"""
Database migration script: Connects via DATABASE_URL and applies
supabase/migrations/00001_initial_schema.sql and supabase/seed.sql
"""
import os
import sys
from pathlib import Path
import psycopg2
from dotenv import load_dotenv

# Load environment variables from backend/.env
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL is not set in backend/.env")
    sys.exit(1)

root_dir = Path(__file__).resolve().parent.parent
schema_file = root_dir / "supabase" / "migrations" / "00001_initial_schema.sql"
seed_file = root_dir / "supabase" / "seed.sql"

print(f"Connecting to database using DATABASE_URL...")

try:
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor()

    print(f"Applying schema migration from {schema_file.name}...")
    with open(schema_file, "r", encoding="utf-8") as f:
        schema_sql = f.read()
    cur.execute(schema_sql)
    print("Schema migration completed successfully!")

    print(f"Applying seed data from {seed_file.name}...")
    with open(seed_file, "r", encoding="utf-8") as f:
        seed_sql = f.read()
    cur.execute(seed_sql)
    print("Seed data applied successfully!")

    # Verify tables
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
    """)
    tables = [row[0] for row in cur.fetchall()]
    print(f"Public tables verified in database ({len(tables)}): {', '.join(tables)}")

    cur.close()
    conn.close()
    print("All migrations completed successfully!")

except Exception as e:
    print(f"ERROR applying migrations: {e}")
    sys.exit(1)
