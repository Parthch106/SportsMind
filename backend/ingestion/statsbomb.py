"""
ingestion/statsbomb.py
----------------------
Loads StatsBomb open data via statsbombpy and persists it to
data/raw/ as Parquet files for fast reloads.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path

import pandas as pd
from statsbombpy import sb

logger = logging.getLogger(__name__)

RAW_DIR = Path("data/raw")
RAW_DIR.mkdir(parents=True, exist_ok=True)

# ── Competition constants (La Liga 2015/16 — richest free dataset) ────────────
LA_LIGA_COMP_ID = 11
LA_LIGA_SEASON_ID = 27


def load_competitions() -> pd.DataFrame:
    """Return all available StatsBomb competitions."""
    return sb.competitions()


def load_matches(competition_id: int = LA_LIGA_COMP_ID,
                 season_id: int = LA_LIGA_SEASON_ID) -> pd.DataFrame:
    """
    Pull all matches for the given competition/season.
    Cached to data/raw/matches_{comp}_{season}.parquet.
    """
    cache = RAW_DIR / f"matches_{competition_id}_{season_id}.parquet"
    if cache.exists():
        logger.info("Loading cached matches from %s", cache)
        return pd.read_parquet(cache)

    logger.info("Fetching matches from StatsBomb API …")
    matches = sb.matches(competition_id=competition_id, season_id=season_id)
    matches.to_parquet(cache, index=False)
    logger.info("Saved %d matches to %s", len(matches), cache)
    return matches


def load_events(match_id: int) -> pd.DataFrame:
    """
    Pull all events for a single match.
    Cached to data/raw/events_{match_id}.parquet.
    """
    cache = RAW_DIR / f"events_{match_id}.parquet"
    if cache.exists():
        return pd.read_parquet(cache)

    logger.info("Fetching events for match %d …", match_id)
    events = sb.events(match_id=match_id)
    events.to_parquet(cache, index=False)
    return events


def load_frames(match_id: int) -> pd.DataFrame:
    """
    Pull StatsBomb 360° freeze frames for a match.
    Cached to data/raw/frames_{match_id}.parquet.
    """
    cache = RAW_DIR / f"frames_{match_id}.parquet"
    if cache.exists():
        return pd.read_parquet(cache)

    logger.info("Fetching 360 frames for match %d …", match_id)
    try:
        frames = sb.frames(match_id=match_id)
        frames.to_parquet(cache, index=False)
        return frames
    except Exception as exc:
        logger.warning("No 360 frames for match %d: %s", match_id, exc)
        return pd.DataFrame()


def load_lineups(match_id: int) -> dict:
    """Return lineup dicts (team_name → list of player dicts)."""
    cache = RAW_DIR / f"lineups_{match_id}.json"
    if cache.exists():
        with open(cache) as f:
            return json.load(f)

    logger.info("Fetching lineups for match %d …", match_id)
    lineups = sb.lineups(match_id=match_id)
    with open(cache, "w") as f:
        json.dump({k: v.to_dict(orient="records") for k, v in lineups.items()}, f)
    return lineups


def ingest_all_matches(competition_id: int = LA_LIGA_COMP_ID,
                       season_id: int = LA_LIGA_SEASON_ID) -> None:
    """
    Download events + frames for every match in the competition.
    Safe to re-run — already-cached files are skipped.
    """
    matches = load_matches(competition_id, season_id)
    logger.info("Ingesting %d matches …", len(matches))
    for _, row in matches.iterrows():
        mid = int(row["match_id"])
        load_events(mid)
        load_frames(mid)
    logger.info("Ingestion complete.")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    ingest_all_matches()
