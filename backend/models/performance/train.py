"""
models/performance/train.py
----------------------------
Trains an XGBoost regression model to predict player xG per match.
Uses the shared SQLite feature store as the training data source.

Usage:
    python -m models.performance.train
"""

from __future__ import annotations

import logging
import sqlite3
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import shap
import xgboost as xgb
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split

logger = logging.getLogger(__name__)

MODEL_PATH = Path("models/performance/model.joblib")
FEATURE_COLS = [
    "rolling_xg_5",
    "rolling_passes_5",
    "rolling_sprint_distance_3",
    "opponent_defensive_rating",
    "opponent_press_intensity",
    "is_home",
    "days_since_last_match",
    "xg_vs_opponent_historic",
    "season_form_score",
    "player_age",
    "matches_last_14_days",
    "minutes_last_14_days",
]


MODEL_PATH_XG = Path("models/performance/model.joblib")
MODEL_PATH_PASSES = Path("models/performance/model_passes.joblib")

def load_training_data() -> tuple[pd.DataFrame, pd.Series, pd.Series]:
    """
    Build training dataset from SQLite player_events table.
    X = feature matrix, y_xg = actual xG per match, y_passes = actual passes.
    """
    from features.compute_features import DB_PATH

    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql_query(
        """
        SELECT player_id, match_date, match_id, xg, goals, passes,
               sprint_distance, high_intensity, minutes, is_home
        FROM player_events
        """,
        conn,
    )
    conn.close()

    if df.empty:
        raise ValueError(
            "No training data in player_events. "
            "Run the StatsBomb ingestion pipeline first."
        )

    # Build features for each row using the compute_features module
    from features.compute_features import compute_player_features

    feature_rows = []
    targets_xg = []
    targets_passes = []
    for _, row in df.iterrows():
        try:
            f = compute_player_features(row["player_id"], row["match_date"])
            feature_rows.append(f)
            targets_xg.append(row["xg"])
            targets_passes.append(row["passes"])
        except Exception as exc:
            logger.debug("Skipping %s: %s", row["player_id"], exc)

    X = pd.DataFrame(feature_rows)[FEATURE_COLS]
    y_xg = pd.Series(targets_xg, name="xg")
    y_passes = pd.Series(targets_passes, name="passes")
    logger.info("Training dataset: %d samples, %d features", len(X), len(X.columns))
    return X, y_xg, y_passes


def train(X: pd.DataFrame, y: pd.Series, target_name: str) -> xgb.XGBRegressor:
    """Train the XGBoost performance prediction model."""
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = xgb.XGBRegressor(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        eval_metric="mae",
    )
    model.fit(
        X_train,
        y_train,
        eval_set=[(X_test, y_test)],
        verbose=False,
    )

    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    r2 = r2_score(y_test, preds)
    logger.info("%s model — MAE: %.3f | R²: %.3f", target_name.capitalize(), mae, r2)

    return model


def save_model(model: xgb.XGBRegressor, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, path)
    logger.info("Saved performance model to %s", path)


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    X, y_xg, y_passes = load_training_data()
    
    logger.info("--- Training xG Model ---")
    model_xg = train(X, y_xg, "xG")
    save_model(model_xg, MODEL_PATH_XG)
    
    logger.info("--- Training Passes Model ---")
    model_passes = train(X, y_passes, "passes")
    save_model(model_passes, MODEL_PATH_PASSES)

    # SHAP validation for xG model
    explainer = shap.TreeExplainer(model_xg)
    shap_values = explainer.shap_values(X[:100])
    logger.info("SHAP analysis complete for xG. Top feature: %s", X.columns[np.argmax(np.abs(shap_values).mean(0))])


if __name__ == "__main__":
    main()
