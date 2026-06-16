"""
models/tactical/clustering.py
------------------------------
Formation detection using K-Means clustering on StatsBomb 360° freeze frames.
Clusters average player positions into formation lines (GK + 4 outfield lines).
"""

from __future__ import annotations

import logging
from typing import Any

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans

logger = logging.getLogger(__name__)

# Pitch dimensions (StatsBomb coordinate system: 120x80)
PITCH_LENGTH = 120.0
PITCH_WIDTH = 80.0

FORMATION_SIGNATURES = {
    "4-3-3": [1, 4, 3, 3],
    "4-4-2": [1, 4, 4, 2],
    "4-2-3-1": [1, 4, 2, 3, 1],
    "3-5-2": [1, 3, 5, 2],
    "3-4-3": [1, 3, 4, 3],
    "5-3-2": [1, 5, 3, 2],
}


def get_team_positions(freeze_frame: list[dict], teammate: bool = True) -> np.ndarray:
    """
    Extract player positions from a StatsBomb freeze frame.

    Args:
        freeze_frame: List of player dicts from StatsBomb 360 data
        teammate:     True = same team as ball carrier, False = opponents

    Returns:
        Nx2 numpy array of [x, y] positions
    """
    players = [p for p in freeze_frame if p.get("teammate") == teammate]
    if not players:
        return np.zeros((0, 2))
    return np.array([[p["location"][0], p["location"][1]] for p in players])


def detect_formation(positions: np.ndarray, n_lines: int = 4) -> dict[str, Any]:
    """
    Cluster player positions into formation lines using K-Means.

    Args:
        positions: Nx2 array of player [x, y] positions
        n_lines:   Number of clusters (formation lines including GK)

    Returns:
        {
            formation_string: "4-3-3",
            centroids: [[x1,y1], ...],
            cluster_sizes: [1, 4, 3, 3]
        }
    """
    if len(positions) < n_lines:
        return {"formation_string": "Unknown", "centroids": [], "cluster_sizes": []}

    kmeans = KMeans(n_clusters=n_lines, random_state=42, n_init=10)
    labels = kmeans.fit_predict(positions)
    centroids = kmeans.cluster_centers_

    # Sort clusters by x-position (deepest = GK line)
    sorted_idx = np.argsort(centroids[:, 0])
    centroids = centroids[sorted_idx]
    cluster_sizes = [int((labels == sorted_idx[i]).sum()) for i in range(n_lines)]

    # Match to known formation signatures
    formation_string = _match_formation(cluster_sizes)

    return {
        "formation_string": formation_string,
        "centroids": centroids.tolist(),
        "cluster_sizes": cluster_sizes,
    }


def _match_formation(cluster_sizes: list[int]) -> str:
    """Find the closest known formation to the cluster sizes."""
    best_match = "Unknown"
    best_score = float("inf")

    for name, sig in FORMATION_SIGNATURES.items():
        if len(sig) != len(cluster_sizes):
            continue
        score = sum(abs(a - b) for a, b in zip(sig, cluster_sizes))
        if score < best_score:
            best_score = score
            best_match = name

    return best_match if best_score <= 2 else "Custom"


def analyse_team_formation(
    events_df: pd.DataFrame,
    frames_df: pd.DataFrame,
    team_name: str,
) -> dict[str, Any]:
    """
    Detect the most common formation used by a team across a match.

    Returns:
        {formation_string, confidence, all_frames_analysed}
    """
    if frames_df.empty or "freeze_frame" not in frames_df.columns:
        return {"formation_string": "Unknown", "confidence": 0.0}

    formation_counts: dict[str, int] = {}

    for _, frame_row in frames_df.iterrows():
        ff = frame_row.get("freeze_frame", [])
        if not isinstance(ff, list):
            continue

        positions = get_team_positions(ff, teammate=True)
        if len(positions) < 5:
            continue

        result = detect_formation(positions)
        formation = result["formation_string"]
        formation_counts[formation] = formation_counts.get(formation, 0) + 1

    if not formation_counts:
        return {"formation_string": "Unknown", "confidence": 0.0}

    total = sum(formation_counts.values())
    top_formation = max(formation_counts, key=formation_counts.get)
    confidence = formation_counts[top_formation] / total

    return {
        "formation_string": top_formation,
        "confidence": round(confidence, 2),
        "all_formations_seen": formation_counts,
    }
