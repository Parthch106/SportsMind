import sqlite3

def check_aguero():
    conn = sqlite3.connect('data/features.db')
    rows = conn.execute("SELECT DISTINCT player_id FROM player_events WHERE player_id LIKE '%Aguero%' OR player_id LIKE '%Agüero%'").fetchall()
    print("Aguero in DB:", rows)

if __name__ == "__main__":
    check_aguero()
