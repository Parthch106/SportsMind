"""
ingestion/transfermarkt.py
--------------------------
Pulls fixture schedules from Transfermarkt via soccerdata to
compute workload features (days between matches, congestion windows).
"""

from __future__ import annotations

import logging
from pathlib import Path

import pandas as pd

logger = logging.getLogger(__name__)
RAW_DIR = Path("data/raw")


def load_schedule(
    league: str = "ESP-La Liga",
    season: str = "2015-2016",
) -> pd.DataFrame:
    """
    Pull fixture schedule from Transfermarkt.
    Returns DataFrame with columns: date, home_team, away_team, match_id, etc.
    """
    cache = RAW_DIR / f"tm_schedule_{league.replace(' ', '_')}_{season}.parquet"
    if cache.exists():
        logger.info("Loading cached Transfermarkt schedule from %s", cache)
        return pd.read_parquet(cache)

    try:
        import soccerdata as sd
    except ImportError:
        raise ImportError("Install soccerdata: pip install soccerdata")

    logger.info("Fetching Transfermarkt schedule for %s %s …", league, season)
    tm = sd.Transfermarkt(leagues=league, seasons=season)
    schedule = tm.read_schedule()
    schedule.to_parquet(cache)
    logger.info("Saved schedule (%d fixtures) to %s", len(schedule), cache)
    return schedule


def compute_rest_days(schedule: pd.DataFrame, player_id: str) -> pd.Series:
    """
    Given a schedule DataFrame, compute rest days before each match
    for players who appear in both home and away teams.
    Returns a Series indexed by match date.
    """
    # Filter to matches the player was involved in
    player_matches = schedule[
        (schedule["home_team"] == player_id) | (schedule["away_team"] == player_id)
    ].copy()
    player_matches = player_matches.sort_values("date")
    player_matches["days_since_last_match"] = (
        player_matches["date"].diff().dt.days
    )
    return player_matches.set_index("date")["days_since_last_match"]


def get_matches_in_window(
    schedule: pd.DataFrame,
    team_name: str,
    reference_date: str,
    days: int = 14,
) -> int:
    """
    Count how many matches a team played in the N days before reference_date.
    """
    ref = pd.Timestamp(reference_date)
    window_start = ref - pd.Timedelta(days=days)
    mask = (
        ((schedule["home_team"] == team_name) | (schedule["away_team"] == team_name))
        & (schedule["date"] >= window_start)
        & (schedule["date"] < ref)
    )
    return int(mask.sum())


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    df = load_schedule()
    print(df.head())
