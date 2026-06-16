import sqlite3
from statsbombpy import sb
import sys
import logging

# Reconfigure stdout to handle special characters
sys.stdout.reconfigure(encoding='utf-8')
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DB_PATH = "e:/Work/SportsMind/backend/data/features.db"

def backfill():
    conn = sqlite3.connect(DB_PATH)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS players (
            player_id TEXT PRIMARY KEY,
            position TEXT
        );
    """)
    
    rows = conn.execute("SELECT DISTINCT match_id FROM player_events").fetchall()
    match_ids = [r[0] for r in rows]
    
    logger.info(f"Found {len(match_ids)} matches in DB to process for lineups...")
    
    players_found = {}
    
    for idx, match_id in enumerate(match_ids):
        try:
            lineups = sb.lineups(match_id=match_id)
            for team_name, lineup_df in lineups.items():
                for _, row in lineup_df.iterrows():
                    player_name = row['player_name']
                    positions = row.get('positions', [])
                    if isinstance(positions, list) and len(positions) > 0:
                        pos = positions[0].get('position', 'Unknown')
                        if player_name not in players_found or players_found[player_name] == 'Unknown':
                            players_found[player_name] = pos
        except Exception as e:
            logger.error(f"Failed to fetch lineup for match {match_id}: {e}")
            continue
            
    logger.info(f"Extracted positions for {len(players_found)} players. Saving to database...")
    
    for player, pos in players_found.items():
        conn.execute("INSERT OR REPLACE INTO players (player_id, position) VALUES (?, ?)", (player, pos))
        
    conn.commit()
    conn.close()
    logger.info("Backfill complete!")

if __name__ == "__main__":
    backfill()
