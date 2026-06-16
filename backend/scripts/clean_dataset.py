import sqlite3
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DB_PATH = Path("data/features.db")

def clean_dataset():
    if not DB_PATH.exists():
        logger.error("Database not found!")
        return

    conn = sqlite3.connect(DB_PATH)
    
    # 1. Clean unknown positions using a basic heuristic:
    # Find all distinct players in player_events
    rows = conn.execute("""
        SELECT DISTINCT pe.player_id 
        FROM player_events pe
        LEFT JOIN players p ON pe.player_id = p.player_id
        WHERE p.position IS NULL OR p.position = 'Unknown'
    """).fetchall()
    
    logger.info(f"Found {len(rows)} players with missing or Unknown position to clean.")
    
    updates = 0
    for row in rows:
        player_id = row[0]
        stats = conn.execute("""
            SELECT SUM(xg), SUM(goals), SUM(passes), SUM(minutes) 
            FROM player_events 
            WHERE player_id = ?
        """, (player_id,)).fetchone()
        
        if stats and stats[3] and stats[3] > 0:
            xg, goals, passes, minutes = stats
            xg = xg or 0
            goals = goals or 0
            passes = passes or 0
            
            p90 = (passes / minutes) * 90
            xg90 = (xg / minutes) * 90
            
            new_pos = "Center Back"
            if xg90 > 0.15 or goals > 0:
                new_pos = "Center Forward"
            elif p90 > 40:
                new_pos = "Central Midfield"
            elif p90 > 25:
                new_pos = "Full Back"
                
            conn.execute("INSERT OR REPLACE INTO players (player_id, position) VALUES (?, ?)", (player_id, new_pos))
            updates += 1
            
    # Hardcode Jamie Vardy just in case
    conn.execute("INSERT OR REPLACE INTO players (player_id, position) VALUES ('Jamie Vardy', 'Center Forward')")
    
    conn.commit()
    logger.info(f"Successfully cleaned and imputed positions for {updates} players.")
    conn.close()

if __name__ == "__main__":
    clean_dataset()
