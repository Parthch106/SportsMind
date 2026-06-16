"""
models/tactical/analyse.py
---------------------------
Combines formation detection + zone vulnerability analysis into
a single structured JSON output used by the API and LLM layer.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import pandas as pd

from models.tactical.clustering import analyse_team_formation
from models.tactical.heatmaps import (
    generate_concession_heatmap,
    get_concession_zones,
    get_shot_creation_zones,
    generate_shot_creation_heatmap,
)

logger = logging.getLogger(__name__)

# Divide the pitch into 6 macro-zones (StatsBomb coords: 120x80)
PITCH_ZONES = {
    "left channel": {"x": (80, 120), "y": (0, 27)},
    "central attacking": {"x": (80, 120), "y": (27, 53)},
    "right channel": {"x": (80, 120), "y": (53, 80)},
    "left midfield": {"x": (40, 80), "y": (0, 40)},
    "right midfield": {"x": (40, 80), "y": (40, 80)},
    "defensive third": {"x": (0, 40), "y": (0, 80)},
}


def _compute_zone_rates(concession_df: pd.DataFrame) -> list[dict[str, Any]]:
    """Compute concession rate per pitch zone."""
    if concession_df.empty:
        return []

    total = len(concession_df)
    zone_results = []

    for zone_name, bounds in PITCH_ZONES.items():
        mask = (
            (concession_df["location_x"] >= bounds["x"][0])
            & (concession_df["location_x"] < bounds["x"][1])
            & (concession_df["location_y"] >= bounds["y"][0])
            & (concession_df["location_y"] < bounds["y"][1])
        )
        zone_goals = mask.sum()
        if zone_goals == 0:
            continue

        rate = zone_goals / total
        avg_xg = (
            float(concession_df.loc[mask, "shot_statsbomb_xg"].mean())
            if "shot_statsbomb_xg" in concession_df.columns
            else 0.0
        )
        zone_results.append({
            "zone": zone_name,
            "concession_rate": round(rate, 2),
            "goals_conceded": int(zone_goals),
            "avg_xg_against": round(avg_xg, 2),
        })

    return sorted(zone_results, key=lambda z: z["concession_rate"], reverse=True)


def get_tactical_analysis(
    team_name: str,
    events_df: pd.DataFrame,
    frames_df: pd.DataFrame | None = None,
) -> dict[str, Any]:
    """
    Full tactical analysis for a team.

    Args:
        team_name:  Team name (e.g. "FC Barcelona")
        events_df:  StatsBomb events DataFrame
        frames_df:  StatsBomb 360 freeze frames (optional)

    Returns:
        Structured tactical analysis dict
    """
    # Formation detection
    formation_result = {"formation_string": "Unknown", "confidence": 0.0}
    if frames_df is not None and not frames_df.empty:
        formation_result = analyse_team_formation(events_df, frames_df, team_name)

    # Concession zone analysis
    concession_df = get_concession_zones(events_df, team_name)
    vulnerability_zones = _compute_zone_rates(concession_df)

    # Generate heatmap
    heatmap_path = ""
    try:
        heatmap_path = generate_concession_heatmap(concession_df, team_name)
    except Exception as exc:
        logger.warning("Could not generate heatmap: %s", exc)

    # Tactical summary text
    top_zone = vulnerability_zones[0]["zone"] if vulnerability_zones else "unknown zones"
    top_rate = vulnerability_zones[0]["concession_rate"] if vulnerability_zones else 0.0
    tactical_summary = (
        f"{team_name} concede {top_rate*100:.0f}% of goals from the "
        f"{top_zone}. Formation detected: {formation_result.get('formation_string', 'Unknown')}."
    )

    return {
        "team": team_name,
        "formation_detected": formation_result.get("formation_string", "Unknown"),
        "formation_confidence": formation_result.get("confidence", 0.0),
        "vulnerability_zones": vulnerability_zones[:3],  # Top 3 zones
        "heatmap_url": f"/heatmaps/{Path(heatmap_path).name}" if heatmap_path else "",
        "tactical_summary": tactical_summary,
    }
