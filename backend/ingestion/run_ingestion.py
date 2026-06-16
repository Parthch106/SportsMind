"""
backend/ingestion/run_ingestion.py
-----------------------------------
Ingests data from StatsBomb (match events) and FBref (season stats) 
into the local SQLite feature store.
"""

import logging
import time
from collections import defaultdict
import pandas as pd
from statsbombpy import sb

from features.compute_features import store_player_event, _get_conn

logger = logging.getLogger(__name__)

# Constants for La Liga 2020/2021 and Premier League 2015/2016
COMPETITIONS = [
    (11, 90, "La Liga 2020/2021"),
    (2, 27, "Premier League 2015/2016"),
    (43, 106, "World Cup 2022"),
    (55, 282, "UEFA Euro 2024"),
    (223, 282, "Copa America 2024"),
    (16, 4, "Champions League 2018/2019")
]

def ingest_statsbomb_matches():
    for comp_id, season_id, name in COMPETITIONS:
        logger.info(f"Fetching {name} matches from StatsBomb...")
        try:
            matches = sb.matches(competition_id=comp_id, season_id=season_id)
        except Exception as e:
            logger.error(f"Failed to fetch {name}: {e}")
            continue
        
        # Process all available matches
        matches_to_process = matches
        
        total = len(matches_to_process)
        logger.info(f"Processing {total} matches for {name}...")
        
        for idx, match_row in matches_to_process.iterrows():
            match_id = match_row["match_id"]
            match_date = str(match_row["match_date"])
            home_team = match_row["home_team"]
            away_team = match_row["away_team"]
            
            logger.info(f"Processing match {idx+1}/{total}: {home_team} vs {away_team} (ID: {match_id})")
            
            try:
                events = sb.events(match_id=match_id)
            except Exception as e:
                logger.error(f"Failed to fetch events for match {match_id}: {e}")
                continue
            
            if events.empty:
                continue
                
            # Group stats by player_name
            player_stats = defaultdict(lambda: {
                "xg": 0.0,
                "goals": 0,
                "passes": 0,
                "minutes": 90, # default fallback
                "team": "",
            })
            
            for _, event in events.iterrows():
                player = event.get("player")
                if pd.isna(player) or not player:
                    continue
                    
                stats = player_stats[player]
                stats["team"] = event.get("team")
                
                # xG
                if "shot_statsbomb_xg" in event and not pd.isna(event["shot_statsbomb_xg"]):
                    stats["xg"] += float(event["shot_statsbomb_xg"])
                    
                # Goals
                if event.get("type") == "Shot" and event.get("shot_outcome") == "Goal":
                    stats["goals"] += 1
                    
                # Passes
                if event.get("type") == "Pass":
                    stats["passes"] += 1
                    
                # Minutes
                event_min = event.get("minute")
                if not pd.isna(event_min):
                    stats["max_minute"] = max(stats.get("max_minute", 0), int(event_min))
            
            for player, stats in player_stats.items():
                team = stats["team"]
                is_home = 1 if team == home_team else 0
                opponent = away_team if is_home else home_team
                minutes = stats.get("max_minute", 90)
                
                event_dict = {
                    "player_id": player,
                    "match_date": match_date,
                    "match_id": str(match_id),
                    "xg": stats["xg"],
                    "goals": stats["goals"],
                    "passes": stats["passes"],
                    "progressive_carries": 0, # Placeholder
                    "sprint_distance": 0.0,   # Placeholder
                    "high_intensity": 0,      # Placeholder
                    "minutes": minutes,
                    "is_home": is_home,
                    "opponent": opponent
                }
                store_player_event(event_dict)

def ingest_fbref_season():
    logger.info("Fetching FBref season stats...")
    import soccerdata as sd
    
    # Store these in a new table `fbref_season_stats`
    with _get_conn() as conn:
        conn.executescript("""
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
        
    try:
        fbref = sd.FBref(leagues="ESP-La Liga", seasons="2020/2021")
        
        # Standard stats
        logger.info("Fetching standard stats...")
        standard = fbref.read_player_season_stats(stat_type="standard")
        standard = standard.reset_index()
        
        players_data = {}
        
        # We need a robust way to extract the columns
        for _, row in standard.iterrows():
            try:
                player = row.get(("player", ""))
                if isinstance(player, pd.Series): player = player.iloc[0]
                if not player or pd.isna(player): continue
                
                # extract expected goals per 90 etc.
                xg_90 = row.get(("Per 90 Minutes", "xG"), 0.0)
                if isinstance(xg_90, pd.Series): xg_90 = xg_90.iloc[0]
                
                npxg_90 = row.get(("Per 90 Minutes", "npxG"), 0.0)
                if isinstance(npxg_90, pd.Series): npxg_90 = npxg_90.iloc[0]
                
                xag_90 = row.get(("Per 90 Minutes", "xAG"), 0.0)
                if isinstance(xag_90, pd.Series): xag_90 = xag_90.iloc[0]
                if pd.isna(xag_90):
                    xag_90 = row.get(("Per 90 Minutes", "xA"), 0.0)
                    if isinstance(xag_90, pd.Series): xag_90 = xag_90.iloc[0]
                
                mins = row.get(("Playing Time", "Min"), 0)
                if isinstance(mins, pd.Series): mins = mins.iloc[0]
                
                # KP and PrgP might be in "Performance" or we just approximate
                prgp = row.get(("Progression", "PrgP"), 0)
                if isinstance(prgp, pd.Series): prgp = prgp.iloc[0]
                if pd.isna(prgp):
                    prgp = row.get(("Performance", "PrgP"), 0)
                    if isinstance(prgp, pd.Series): prgp = prgp.iloc[0]
                
                # Key Passes
                kp = row.get(("Performance", "KP"), 0)
                if isinstance(kp, pd.Series): kp = kp.iloc[0]
                
                # Dribbles (CPA)
                cpa = row.get(("Progression", "PrgC"), 0)
                if isinstance(cpa, pd.Series): cpa = cpa.iloc[0]
                
                # Tackles
                tklw = row.get(("Performance", "TklW"), 0)
                if isinstance(tklw, pd.Series): tklw = tklw.iloc[0]
            except Exception as e:
                logger.error(f"Error parsing row: {e}")
                continue
                
            mins = int(mins) if not pd.isna(mins) else 0
            prgp_90 = float(prgp) / (mins / 90) if mins > 0 and not pd.isna(prgp) else 0.0
            kp_90 = float(kp) / (mins / 90) if mins > 0 and not pd.isna(kp) else float(xag_90) * 10
            cpa_90 = float(cpa) / (mins / 90) if mins > 0 and not pd.isna(cpa) else 0.0
            tklw_90 = float(tklw) / (mins / 90) if mins > 0 and not pd.isna(tklw) else 0.0

            players_data[player] = {
                "xg_per90": float(xg_90) if not pd.isna(xg_90) else 0.0,
                "npxg_per90": float(npxg_90) if not pd.isna(npxg_90) else 0.0,
                "xag_per90": float(xag_90) if not pd.isna(xag_90) else 0.0,
                "minutes": mins,
                "prgp_per90": prgp_90,
                "kp_per90": kp_90,
                "cpa_per90": cpa_90,
                "tklw_per90": tklw_90,
            }

        # Insert to DB
        with _get_conn() as conn:
            for p, d in players_data.items():
                conn.execute(
                    """
                    INSERT OR REPLACE INTO fbref_season_stats 
                    (player_name, xg_per90, xag_per90, npxg_per90, prgp_per90, kp_per90, cpa_per90, tklw_per90, minutes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (p, d["xg_per90"], d["xag_per90"], d["npxg_per90"], d["prgp_per90"], d["kp_per90"], d["cpa_per90"], d["tklw_per90"], d["minutes"])
                )
            conn.commit()
            
        logger.info(f"Ingested FBref stats for {len(players_data)} players.")
        
    except Exception as e:
        logger.error(f"FBref ingestion failed: {e}")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    ingest_statsbomb_matches()
    # ingest_fbref_season() # Commented out by default to save time if we just want to test statsbomb
