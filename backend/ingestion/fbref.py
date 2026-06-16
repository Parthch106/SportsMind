"""
ingestion/fbref.py
------------------
Pulls player season statistics from FBref via the soccerdata library.
Stats are cached to data/raw/fbref_*.parquet.
"""

from __future__ import annotations

import logging
from pathlib import Path

import pandas as pd

logger = logging.getLogger(__name__)
RAW_DIR = Path("data/raw")


def load_player_stats(
    league: str = "ESP-La Liga",
    season: str = "2015-2016",
    stat_type: str = "standard",
) -> pd.DataFrame:
    """
    Pull per-90 player stats from FBref.

    Args:
        league:    soccerdata league identifier
        season:    e.g. "2015-2016"
        stat_type: "standard" | "shooting" | "passing" | "defense" | "misc"

    Returns:
        DataFrame with multi-level columns (stat_type, metric)
    """
    cache = RAW_DIR / f"fbref_{league.replace(' ', '_')}_{season}_{stat_type}.parquet"
    if cache.exists():
        logger.info("Loading cached FBref stats from %s", cache)
        return pd.read_parquet(cache)

    try:
        import soccerdata as sd  # optional dependency
    except ImportError:
        raise ImportError(
            "soccerdata is required for FBref ingestion.\n"
            "Install with: pip install soccerdata"
        )

    logger.info("Fetching FBref %s stats for %s %s …", stat_type, league, season)
    fbref = sd.FBref(leagues=league, seasons=season)
    df = fbref.read_player_season_stats(stat_type=stat_type)
    df.to_parquet(cache)
    logger.info("Saved FBref stats (%d rows) to %s", len(df), cache)
    return df


def load_shooting_stats(**kwargs) -> pd.DataFrame:
    return load_player_stats(stat_type="shooting", **kwargs)


def load_passing_stats(**kwargs) -> pd.DataFrame:
    return load_player_stats(stat_type="passing", **kwargs)


def load_defense_stats(**kwargs) -> pd.DataFrame:
    return load_player_stats(stat_type="defense", **kwargs)


def get_player_xg(player_name: str, df: pd.DataFrame | None = None) -> float | None:
    """
    Extract a player's season xG from a pre-loaded stats DataFrame.
    Returns None if the player is not found.
    """
    if df is None:
        df = load_shooting_stats()

    # Handle multi-level columns from soccerdata
    try:
        player_row = df[df.index.get_level_values("player") == player_name]
        if player_row.empty:
            return None
        return float(player_row[("shooting", "xg")].iloc[0])
    except (KeyError, IndexError):
        return None


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    df = load_player_stats()
    print(df.head())
