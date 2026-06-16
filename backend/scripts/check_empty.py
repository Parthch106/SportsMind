import sqlite3

def check_empty():
    conn = sqlite3.connect('data/features.db')
    tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
    
    for (table_name,) in tables:
        columns = conn.execute(f"PRAGMA table_info({table_name})").fetchall()
        
        empty_counts = {}
        for col in columns:
            col_name = col[1]
            col_type = col[2]
            
            if 'TEXT' in col_type.upper():
                count = conn.execute(f"SELECT COUNT(*) FROM {table_name} WHERE {col_name} = '' OR {col_name} = 'Unknown'").fetchone()[0]
                if count > 0:
                    empty_counts[col_name] = count
                    
        if empty_counts:
            print(f"Table '{table_name}' has 'Unknown' or empty strings:")
            for k, v in empty_counts.items():
                print(f"  - {k}: {v} records")
        else:
            print(f"Table '{table_name}': No 'Unknown' or empty text values.")

if __name__ == "__main__":
    check_empty()
