"""
models/injury/train.py
-----------------------
Trains an XGBoost multi-class classifier to predict injury risk:
  0 = LOW | 1 = MEDIUM | 2 = HIGH

Usage:
    python -m models.injury.train
"""

from __future__ import annotations

import logging
import sqlite3
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import shap
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier

logger = logging.getLogger(__name__)

MODEL_PATH = Path("models/injury/model.joblib")
ENCODER_PATH = Path("models/injury/label_encoder.joblib")

FEATURE_COLS = [
    "matches_last_14_days",
    "minutes_last_14_days",
    "days_since_last_match",
    "rolling_sprint_distance_3",
    "player_age",
    "cumulative_minutes_season",
    "season_form_score",
]

RISK_THRESHOLDS = {
    "high": {"matches_last_14_days": 4, "minutes_last_14_days": 300, "days_since_last_match": 3},
    "medium": {"matches_last_14_days": 3, "minutes_last_14_days": 200, "days_since_last_match": 4},
}


def _generate_risk_label(row: pd.Series) -> str:
    """
    Heuristic risk labelling for training data generation.
    In production you would use actual injury outcome data.
    """
    score = 0
    if row.get("matches_last_14_days", 0) >= 4:
        score += 3
    elif row.get("matches_last_14_days", 0) >= 3:
        score += 1
    if row.get("days_since_last_match", 7) <= 3:
        score += 3
    elif row.get("days_since_last_match", 7) <= 4:
        score += 1
    if row.get("minutes_last_14_days", 0) >= 300:
        score += 2
    if row.get("player_age", 26) >= 32:
        score += 1
    if row.get("cumulative_minutes_season", 0) >= 2500:
        score += 1

    if score >= 5:
        return "HIGH"
    elif score >= 2:
        return "MEDIUM"
    return "LOW"


def load_training_data() -> tuple[pd.DataFrame, pd.Series]:
    from features.compute_features import DB_PATH, compute_player_features

    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql_query(
        "SELECT player_id, match_date FROM player_events",
        conn,
    )
    conn.close()

    if df.empty:
        raise ValueError("No training data. Run ingestion pipeline first.")

    feature_rows, labels = [], []
    for _, row in df.iterrows():
        try:
            f = compute_player_features(row["player_id"], row["match_date"])
            feature_rows.append(f)
            labels.append(_generate_risk_label(f))
        except Exception:
            pass

    X = pd.DataFrame(feature_rows)[FEATURE_COLS]
    y = pd.Series(labels, name="risk")
    logger.info("Injury training dataset: %d samples", len(X))
    return X, y


def train(X: pd.DataFrame, y: pd.Series) -> tuple[XGBClassifier, LabelEncoder]:
    le = LabelEncoder()
    y_enc = le.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_enc, test_size=0.2, random_state=42, stratify=y_enc
    )

    model = XGBClassifier(
        n_estimators=150,
        max_depth=3,
        learning_rate=0.1,
        use_label_encoder=False,
        eval_metric="mlogloss",
        random_state=42,
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    logger.info("\n%s", classification_report(y_test, preds, target_names=le.classes_))
    return model, le


def save_model(model: XGBClassifier, le: LabelEncoder) -> None:
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    joblib.dump(le, ENCODER_PATH)
    logger.info("Saved injury model to %s", MODEL_PATH)


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    X, y = load_training_data()
    model, le = train(X, y)
    save_model(model, le)


if __name__ == "__main__":
    main()
