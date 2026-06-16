"""
models/performance/predict.py
------------------------------
Loads the trained XGBoost model and returns structured performance predictions
with SHAP explanations for a given player and match.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
import shap

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

# Human-readable labels for SHAP features
FEATURE_LABELS = {
    "rolling_xg_5": "Recent form (5-match xG average)",
    "rolling_passes_5": "Recent passing volume",
    "rolling_sprint_distance_3": "Physical load (sprint distance)",
    "opponent_defensive_rating": "Opponent defensive strength",
    "opponent_press_intensity": "Opponent press intensity (PPDA)",
    "is_home": "Home advantage",
    "days_since_last_match": "Recovery time",
    "xg_vs_opponent_historic": "Historical xG vs this opponent",
    "season_form_score": "Season form score",
    "player_age": "Player age",
    "matches_last_14_days": "Fixture congestion (14 days)",
    "minutes_last_14_days": "Minutes load (14 days)",
}


def _load_model(path: Path):
    if not path.exists():
        raise FileNotFoundError(
            f"Model not found at {path}. Run models/performance/train.py first."
        )
    return joblib.load(path)


def predict_performance(player_id: str, match_date: str, opponent: str = "") -> dict[str, Any]:
    """
    Predict a player's match performance with SHAP explanations.

    Args:
        player_id:  Player name or ID
        match_date: ISO date string (e.g. "2016-04-15")
        opponent:   Opponent team name (for display purposes)

    Returns:
        Structured dict with predicted_xg, predicted_key_passes,
        confidence, and shap_top_drivers.
    """
    from features.compute_features import compute_player_features, _resolve_player_name

    player_id = _resolve_player_name(player_id)
    features = compute_player_features(player_id, match_date)
    X = pd.DataFrame([features])[FEATURE_COLS]

    model_xg = _load_model(MODEL_PATH)
    pred_xg = float(model_xg.predict(X)[0])
    
    # Post-processing for xG
    rolling_xg = features.get("rolling_xg_5", 0.0)
    pred_xg = (pred_xg * 0.3) + (rolling_xg * 0.7)
    pred_xg = max(0.0, pred_xg)

    # Predict total passes using dedicated model, then derive key passes
    model_passes_path = Path("models/performance/model_passes.joblib")
    model_passes = _load_model(model_passes_path)
    pred_total_passes = float(model_passes.predict(X)[0])
    pred_key_passes = int(max(0, round(pred_total_passes * 0.1)))

    # Confidence: inversely proportional to prediction uncertainty, but more forgiving
    deviation = abs(pred_xg - features["rolling_xg_5"])
    confidence = min(0.95, max(0.60, 1.0 - (deviation * 0.5)))

    # SHAP explanations (for the xG model, since it's the primary UI focus)
    explainer = shap.TreeExplainer(model_xg)
    shap_vals = explainer.shap_values(X)[0]

    top_indices = np.argsort(np.abs(shap_vals))[::-1][:3]
    shap_drivers = []
    for idx in top_indices:
        col = FEATURE_COLS[idx]
        impact = shap_vals[idx]
        shap_drivers.append({
            "feature": FEATURE_LABELS.get(col, col),
            "value": round(float(X.iloc[0][col]), 3),
            "impact": f"{'+' if impact >= 0 else ''}{impact:.2f} xG",
        })

    # form_timeline: last 5 matches
    from features.compute_features import _get_player_history, _get_conn
    with _get_conn() as conn:
        hist_timeline = _get_player_history(player_id, match_date, conn, limit=5)
        hist_raw = _get_player_history(player_id, match_date, conn, limit=15)
    
    form_timeline = []
    if not hist_timeline.empty:
        for _, row in hist_timeline.iloc[::-1].iterrows(): # chronological order
            form_timeline.append({
                "opponent_abbr": row["opponent"][:3].upper() if row["opponent"] else "UNK",
                "actual_xg": round(float(row["xg"]), 2),
                "actual_key_passes": int(max(0, round(float(row["passes"]) * 0.1))),
                "is_prediction": False
            })
    form_timeline.append({
        "opponent_abbr": "PRED",
        "actual_xg": round(pred_xg, 2),
        "actual_key_passes": pred_key_passes,
        "is_prediction": True
    })
    
    raw_matches = []
    if not hist_raw.empty:
        for _, row in hist_raw.iterrows():
            raw_matches.append({
                "match_date": str(row["match_date"])[:10],
                "opponent": str(row["opponent"]) if row["opponent"] else "Unknown",
                "xg": round(float(row["xg"]), 2),
                "goals": int(row["goals"]),
                "passes": int(row["passes"]),
                "progressive_carries": int(row["progressive_carries"]),
                "sprint_distance": round(float(row["sprint_distance"]), 1),
                "high_intensity": int(row["high_intensity"]),
                "minutes": int(row["minutes"]),
                "is_home": int(row["is_home"])
            })

    profile_radar = {
        "xg": {"player_value": features.get("profile_xg", 0.0), "positional_average": 0.2},
        "xa": {"player_value": features.get("profile_xa", 0.0), "positional_average": 0.1},
        "key_passes": {"player_value": int(features.get("profile_key_passes", 0.0)), "positional_average": 1.0},
        "progressive_runs": {"player_value": features.get("profile_progressive_runs", 0.0), "positional_average": 2.0},
        "dribbles": {"player_value": features.get("profile_cpa", 0.0), "positional_average": 1.5},
        "shots": {"player_value": features.get("profile_npxg", 0.0), "positional_average": 1.0},
    }

    # Dynamic metrics based on position
    pos = features.get("position", "Unknown").lower()
    dynamic_metrics = []
    
    if "forward" in pos or "winger" in pos or "striker" in pos:
        dynamic_metrics = [
            {"label": "EXPECTED GOALS", "value": round(pred_xg, 2)},
            {"label": "EXPECTED ASSISTS", "value": round(pred_xg * 0.3, 2)}
        ]
    elif "midfield" in pos or "midfielder" in pos:
        rolling_passes = features.get("rolling_passes_5", 0.0)
        dynamic_metrics = [
            {"label": "EXPECTED PASSES", "value": int(rolling_passes * 1.1)},
            {"label": "INTERCEPTIONS", "value": round(pred_xg * 3.5, 1)} # Mock metric
        ]
    elif "back" in pos or "defender" in pos:
        rolling_passes = features.get("rolling_passes_5", 0.0)
        dynamic_metrics = [
            {"label": "BLOCKS", "value": int(pred_xg * 10)}, # Mock
            {"label": "RUNS / CLEARANCES", "value": int(rolling_passes * 0.2)} # Mock
        ]
    else:
        dynamic_metrics = [
            {"label": "EXPECTED GOALS", "value": round(pred_xg, 2)},
            {"label": "KEY PASSES", "value": pred_key_passes}
        ]

    return {
        "player": player_id,
        "position": features.get("position", "Unknown"),
        "match_date": match_date,
        "opponent": opponent,
        "predicted_xg": round(pred_xg, 2),
        "predicted_xa": round(pred_xg * 0.3, 2), # simple mock relation
        "predicted_key_passes": pred_key_passes,
        "confidence": round(confidence, 2),
        "shap_top_drivers": shap_drivers,
        "form_timeline": form_timeline,
        "profile_radar": profile_radar,
        "raw_matches": raw_matches,
        "dynamic_metrics": dynamic_metrics,
    }


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    import json
    result = predict_performance("Lionel Messi", "2016-04-15", opponent="Real Madrid")
    print(json.dumps(result, indent=2))
