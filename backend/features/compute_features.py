"""
features/compute_features.py
------------------------------
Unified feature computation for all four SportsMind modules.
Results are cached in SQLite (data/features.db) so they are
computed once and shared across performance, injury, and tactical models.
"""

from __future__ import annotations

import logging
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

DB_PATH = Path("data/features.db")
DB_PATH.parent.mkdir(parents=True, exist_ok=True)


# ── Database helpers ──────────────────────────────────────────────────────────

def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    _init_schema(conn)
    return conn


def _init_schema(conn: sqlite3.Connection) -> None:
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS player_features (
            player_id       TEXT NOT NULL,
            match_date      TEXT NOT NULL,
            feature_json    TEXT NOT NULL,
            created_at      TEXT DEFAULT (datetime('now')),
            PRIMARY KEY (player_id, match_date)
        );

        CREATE TABLE IF NOT EXISTS player_events (
            player_id       TEXT NOT NULL,
            match_date      TEXT NOT NULL,
            match_id        TEXT NOT NULL,
            xg              REAL DEFAULT 0,
            goals           INTEGER DEFAULT 0,
            passes          INTEGER DEFAULT 0,
            progressive_carries INTEGER DEFAULT 0,
            sprint_distance REAL DEFAULT 0,
            high_intensity  INTEGER DEFAULT 0,
            minutes         INTEGER DEFAULT 0,
            is_home         INTEGER DEFAULT 0,
            opponent        TEXT DEFAULT '',
            PRIMARY KEY (player_id, match_id)
        );
        
        CREATE TABLE IF NOT EXISTS fbref_season_stats (
            player_name TEXT PRIMARY KEY,
            xg_per90 REAL DEFAULT 0,
            xag_per90 REAL DEFAULT 0,
            npxg_per90 REAL DEFAULT 0,
            prgp_per90 REAL DEFAULT 0,
            kp_per90 REAL DEFAULT 0,
            cpa_per90 REAL DEFAULT 0,
            tklw_per90 REAL DEFAULT 0,
            minutes INTEGER DEFAULT 0
        );
    """)
    conn.commit()


# ── Rolling stat helpers ──────────────────────────────────────────────────────

def _get_player_history(
    player_id: str,
    before_date: str,
    conn: sqlite3.Connection,
    limit: int = 10,
) -> pd.DataFrame:
    """Return the most recent N matches for a player before a given date."""
    rows = conn.execute(
        """
        SELECT * FROM player_events
        WHERE player_id = ? AND match_date < ?
        ORDER BY match_date DESC
        LIMIT ?
        """,
        (player_id, before_date, limit),
    ).fetchall()
    cols = [d[0] for d in conn.execute(
        "SELECT * FROM player_events LIMIT 0"
    ).description or []]
    return pd.DataFrame(rows, columns=cols) if rows else pd.DataFrame()


def get_rolling_xg(player_id: str, match_date: str, window: int = 5) -> float:
    with _get_conn() as conn:
        hist = _get_player_history(player_id, match_date, conn, limit=window)
    if hist.empty:
        return 0.0
    return float(hist["xg"].mean())


def get_rolling_passes(player_id: str, match_date: str, window: int = 5) -> float:
    with _get_conn() as conn:
        hist = _get_player_history(player_id, match_date, conn, limit=window)
    if hist.empty:
        return 0.0
    return float(hist["passes"].mean())


def get_sprint_load(player_id: str, match_date: str, window: int = 3) -> float:
    with _get_conn() as conn:
        hist = _get_player_history(player_id, match_date, conn, limit=window)
    if hist.empty:
        return 0.0
    return float(hist["sprint_distance"].mean())


def get_rest_days(player_id: str, match_date: str) -> int:
    with _get_conn() as conn:
        row = conn.execute(
            """
            SELECT match_date FROM player_events
            WHERE player_id = ? AND match_date < ?
            ORDER BY match_date DESC LIMIT 1
            """,
            (player_id, match_date),
        ).fetchone()
    if row is None:
        return 7  # default: assume 1 week rest if no history
    last = datetime.strptime(row[0], "%Y-%m-%d")
    current = datetime.strptime(match_date[:10], "%Y-%m-%d")
    return max(0, (current - last).days)


def get_match_count(player_id: str, match_date: str, days: int = 14) -> int:
    cutoff = (datetime.strptime(match_date[:10], "%Y-%m-%d") - timedelta(days=days)).strftime("%Y-%m-%d")
    with _get_conn() as conn:
        row = conn.execute(
            """
            SELECT COUNT(*) FROM player_events
            WHERE player_id = ? AND match_date >= ? AND match_date < ?
            """,
            (player_id, cutoff, match_date),
        ).fetchone()
    return int(row[0]) if row else 0


def get_minutes(player_id: str, match_date: str, days: int = 14) -> int:
    cutoff = (datetime.strptime(match_date[:10], "%Y-%m-%d") - timedelta(days=days)).strftime("%Y-%m-%d")
    with _get_conn() as conn:
        row = conn.execute(
            """
            SELECT SUM(minutes) FROM player_events
            WHERE player_id = ? AND match_date >= ? AND match_date < ?
            """,
            (player_id, cutoff, match_date),
        ).fetchone()
    return int(row[0] or 0)


def get_season_minutes(player_id: str, match_date: str) -> int:
    season_start = match_date[:4] + "-08-01"
    with _get_conn() as conn:
        row = conn.execute(
            """
            SELECT SUM(minutes) FROM player_events
            WHERE player_id = ? AND match_date >= ? AND match_date < ?
            """,
            (player_id, season_start, match_date),
        ).fetchone()
    return int(row[0] or 0)


def get_home_away(player_id: str, match_date: str) -> int:
    with _get_conn() as conn:
        row = conn.execute(
            """
            SELECT is_home FROM player_events
            WHERE player_id = ? AND match_date = ?
            LIMIT 1
            """,
            (player_id, match_date),
        ).fetchone()
    return int(row[0]) if row else 0


def get_age(player_id: str) -> int:
    """Placeholder — returns a typical professional age."""
    return 26


def get_form_score(player_id: str, match_date: str, window: int = 10) -> float:
    with _get_conn() as conn:
        hist = _get_player_history(player_id, match_date, conn, limit=window)
    if hist.empty:
        return 5.0  # neutral form
    weights = np.exp(-0.3 * np.arange(len(hist)))  # more weight to recent matches
    weighted_xg = np.average(hist["xg"].values, weights=weights)
    return float(min(10.0, weighted_xg * 5))


def get_fbref_profile(player_id: str) -> dict:
    """
    Computes season averages directly from StatsBomb player_events to guarantee
    data consistency, bypassing the broken fbref scraper.
    """
    with _get_conn() as conn:
        row = conn.execute(
            """
            SELECT 
                SUM(xg) as total_xg,
                SUM(passes) as total_passes,
                SUM(goals) as total_goals,
                SUM(minutes) as total_mins
            FROM player_events
            WHERE player_id = ?
            """,
            (player_id,)
        ).fetchone()

    if not row or not row[3] or row[3] == 0:
        return {}

    total_xg, total_passes, total_goals, total_mins = row
    games = total_mins / 90.0

    return {
        "profile_xg": round(total_xg / games, 2) if total_xg else 0.0,
        "profile_xa": round((total_passes * 0.02) / games, 2) if total_passes else 0.0, # approximation
        "profile_npxg": round(total_xg / games, 2) if total_xg else 0.0,
        "profile_progressive_runs": round((total_passes * 0.1) / games, 2) if total_passes else 0.0,
        "profile_key_passes": round((total_passes * 0.05) / games, 2) if total_passes else 0.0,
        "profile_cpa": round(total_goals * 0.5 / games, 2) if total_goals else 0.0,
        "profile_tackles_won": round(1.5, 2), # flat mock since defense not in this table
    }


# ── Main entry point ──────────────────────────────────────────────────────────

KNOWN_POSITIONS = {
    "Ousmane Dembélé": "Right Winger",
    "Ousmane Demb\ufffdl\ufffd": "Right Winger",
    "Lionel Messi": "Right Winger",
    "Cristiano Ronaldo": "Center Forward",
    "Kylian Mbappé": "Center Forward",
    "Neymar": "Left Winger",
    "Kevin De Bruyne": "Attacking Midfield",
    "Virgil van Dijk": "Center Back",
    "Trent Alexander-Arnold": "Right Back",
    "Erling Haaland": "Center Forward"
}

def _resolve_player_name(player_name: str) -> str:
    """Fuzzy match the incoming player name to the database player names."""
    import difflib
    with _get_conn() as conn:
        rows = conn.execute("SELECT DISTINCT player_id FROM player_events").fetchall()
    db_names = [r[0] for r in rows]
    matches = difflib.get_close_matches(player_name, db_names, n=1, cutoff=0.5)
    if matches:
        return matches[0]
    return player_name

def compute_player_features(player_id: str, match_date: str) -> dict:
    """
    Compute and return all features for a player ahead of a given match.
    Called once — results shared by performance, injury, and tactical modules.

    Args:
        player_id:  Player name or unique ID string
        match_date: ISO date string, e.g. "2016-04-15"

    Returns:
        Dict of feature name → value
    """
    import json
    
    player_id = _resolve_player_name(player_id)

    # Check SQLite cache first
    with _get_conn() as conn:
        row = conn.execute(
            "SELECT feature_json FROM player_features WHERE player_id=? AND match_date=?",
            (player_id, match_date),
        ).fetchone()

    if row:
        logger.debug("Feature cache hit for %s @ %s", player_id, match_date)
        return json.loads(row[0])

    logger.info("Computing features for %s @ %s …", player_id, match_date)

    features = {
        # Rolling performance (5-match window)
        "rolling_xg_5": get_rolling_xg(player_id, match_date, window=5),
        "rolling_passes_5": get_rolling_passes(player_id, match_date, window=5),

        # Physical load (3-match window)
        "rolling_sprint_distance_3": get_sprint_load(player_id, match_date, window=3),

        # Workload
        "days_since_last_match": get_rest_days(player_id, match_date),
        "matches_last_14_days": get_match_count(player_id, match_date, days=14),
        "minutes_last_14_days": get_minutes(player_id, match_date, days=14),
        "cumulative_minutes_season": get_season_minutes(player_id, match_date),

        # Match context
        "is_home": get_home_away(player_id, match_date),
        "player_age": get_age(player_id),
        "season_form_score": get_form_score(player_id, match_date),

        # Opponent features (populated by model layer with real opponent data)
        "opponent_defensive_rating": 0.5,
        "opponent_press_intensity": 10.0,
        "xg_vs_opponent_historic": 0.0,
    }
    
    # Fetch player's primary position from the DB or overrides
    pos = KNOWN_POSITIONS.get(player_id)
    if not pos:
        with _get_conn() as conn:
            pos_row = conn.execute("SELECT position FROM players WHERE player_id=?", (player_id,)).fetchone()
        pos = pos_row[0] if pos_row else "Unknown"
    features["position"] = pos
    
    # Merge FBref profile stats for radar
    fbref_stats = get_fbref_profile(player_id)
    features.update(fbref_stats)

    # Cache to SQLite
    with _get_conn() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO player_features (player_id, match_date, feature_json) VALUES (?,?,?)",
            (player_id, match_date, json.dumps(features)),
        )
        conn.commit()

    return features


def store_player_event(event: dict) -> None:
    """
    Insert a single player-match event record into the SQLite store.
    Used by the ingestion pipeline to populate history.
    """
    with _get_conn() as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO player_events
            (player_id, match_date, match_id, xg, goals, passes,
             progressive_carries, sprint_distance, high_intensity, minutes, is_home, opponent)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
            """,
            (
                event.get("player_id", ""),
                event.get("match_date", ""),
                event.get("match_id", ""),
                event.get("xg", 0.0),
                event.get("goals", 0),
                event.get("passes", 0),
                event.get("progressive_carries", 0),
                event.get("sprint_distance", 0.0),
                event.get("high_intensity", 0),
                event.get("minutes", 0),
                event.get("is_home", 0),
                event.get("opponent", ""),
            ),
        )
        conn.commit()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    features = compute_player_features("Lionel Messi", "2016-04-15")
    import json
    print(json.dumps(features, indent=2))
