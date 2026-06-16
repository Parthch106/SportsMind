import sqlite3

def check_nulls():
    conn = sqlite3.connect('data/features.db')
    tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
    
    for (table_name,) in tables:
        columns = conn.execute(f"PRAGMA table_info({table_name})").fetchall()
        
        null_counts = {}
        for col in columns:
            col_name = col[1]
            count = conn.execute(f"SELECT COUNT(*) FROM {table_name} WHERE {col_name} IS NULL").fetchone()[0]
            if count > 0:
                null_counts[col_name] = count
                
        if null_counts:
            print(f"Table '{table_name}' has NULLs:")
            for k, v in null_counts.items():
                print(f"  - {k}: {v} NULLs")
        else:
            print(f"Table '{table_name}': No NULL values.")

if __name__ == "__main__":
    check_nulls()
