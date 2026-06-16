"""
models/tactical/heatmaps.py
----------------------------
Generates pitch heatmaps using mplsoccer.
Visualises where a team concedes goals and creates chances.
Output: PNG files saved to outputs/heatmaps/
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import matplotlib
matplotlib.use("Agg")  # headless backend for server-side rendering
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

HEATMAP_DIR = Path("outputs/heatmaps")
HEATMAP_DIR.mkdir(parents=True, exist_ok=True)


def get_concession_zones(events_df: pd.DataFrame, team_name: str) -> pd.DataFrame:
    """
    Extract the locations where a team conceded goals.

    Args:
        events_df:  Full match events DataFrame from StatsBomb
        team_name:  The team who is conceding (opponents scored)

    Returns:
        DataFrame with columns [location_x, location_y, shot_statsbomb_xg]
    """
    if events_df.empty:
        return pd.DataFrame()

    mask = (
        (events_df.get("type", pd.Series()) == "Shot")
        & (events_df.get("shot_outcome", pd.Series()) == "Goal")
        & (events_df.get("team", pd.Series()) != team_name)
    )
    conceded = events_df[mask].copy()

    if conceded.empty:
        return pd.DataFrame()

    # Parse location from list column
    if "location" in conceded.columns:
        conceded["location_x"] = conceded["location"].apply(
            lambda loc: loc[0] if isinstance(loc, list) else np.nan
        )
        conceded["location_y"] = conceded["location"].apply(
            lambda loc: loc[1] if isinstance(loc, list) else np.nan
        )

    cols = [c for c in ["location_x", "location_y", "shot_statsbomb_xg"] if c in conceded.columns]
    return conceded[cols].dropna()


def get_shot_creation_zones(events_df: pd.DataFrame, team_name: str) -> pd.DataFrame:
    """Extract locations where a team created shots."""
    mask = (
        (events_df.get("type", pd.Series()) == "Shot")
        & (events_df.get("team", pd.Series()) == team_name)
    )
    shots = events_df[mask].copy()
    if shots.empty:
        return pd.DataFrame()
    if "location" in shots.columns:
        shots["location_x"] = shots["location"].apply(lambda l: l[0] if isinstance(l, list) else np.nan)
        shots["location_y"] = shots["location"].apply(lambda l: l[1] if isinstance(l, list) else np.nan)
    return shots[["location_x", "location_y"]].dropna()


def generate_concession_heatmap(
    concession_df: pd.DataFrame,
    team_name: str,
    output_filename: str | None = None,
) -> str:
    """
    Generate and save a KDE heatmap of concession zones.

    Returns:
        Absolute path to the saved PNG file.
    """
    try:
        from mplsoccer import Pitch
    except ImportError:
        raise ImportError("Install mplsoccer: pip install mplsoccer")

    if output_filename is None:
        safe_name = team_name.replace(" ", "_").lower()
        output_filename = f"{safe_name}_concession_heatmap.png"

    output_path = HEATMAP_DIR / output_filename

    pitch = Pitch(pitch_type="statsbomb", line_color="white", pitch_color="#1a1a2e")
    fig, ax = pitch.draw(figsize=(10, 7))
    fig.set_facecolor("#1a1a2e")

    if not concession_df.empty and len(concession_df) >= 3:
        pitch.kdeplot(
            concession_df["location_x"],
            concession_df["location_y"],
            ax=ax,
            cmap="Reds",
            fill=True,
            levels=10,
            alpha=0.75,
            thresh=0.05,
        )
        # Scatter individual goal locations
        pitch.scatter(
            concession_df["location_x"],
            concession_df["location_y"],
            ax=ax,
            s=80,
            color="white",
            alpha=0.6,
            edgecolors="red",
            linewidths=1.5,
            zorder=3,
        )
    else:
        ax.text(
            60, 40, "Insufficient data",
            ha="center", va="center",
            color="white", fontsize=14, alpha=0.7,
        )

    ax.set_title(
        f"{team_name} — Concession Zones",
        color="white",
        fontsize=16,
        fontweight="bold",
        pad=15,
    )

    fig.savefig(output_path, dpi=150, bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close(fig)

    logger.info("Saved heatmap: %s", output_path)
    return str(output_path)


def generate_shot_creation_heatmap(
    shots_df: pd.DataFrame,
    team_name: str,
    output_filename: str | None = None,
) -> str:
    """Generate and save a shot-creation zone heatmap."""
    try:
        from mplsoccer import Pitch
    except ImportError:
        raise ImportError("Install mplsoccer: pip install mplsoccer")

    if output_filename is None:
        safe_name = team_name.replace(" ", "_").lower()
        output_filename = f"{safe_name}_shot_creation_heatmap.png"

    output_path = HEATMAP_DIR / output_filename

    pitch = Pitch(pitch_type="statsbomb", line_color="white", pitch_color="#0d1b2a")
    fig, ax = pitch.draw(figsize=(10, 7))
    fig.set_facecolor("#0d1b2a")

    if not shots_df.empty and len(shots_df) >= 3:
        pitch.kdeplot(
            shots_df["location_x"],
            shots_df["location_y"],
            ax=ax,
            cmap="Blues",
            fill=True,
            levels=10,
            alpha=0.75,
            thresh=0.05,
        )

    ax.set_title(
        f"{team_name} — Shot Creation Zones",
        color="white",
        fontsize=16,
        fontweight="bold",
        pad=15,
    )

    fig.savefig(output_path, dpi=150, bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close(fig)
    logger.info("Saved heatmap: %s", output_path)
    return str(output_path)
