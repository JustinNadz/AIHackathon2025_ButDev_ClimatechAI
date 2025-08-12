#!/usr/bin/env python3
"""
Minimal database setup script for Pivot Backend
"""

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os
from dotenv import load_dotenv

load_dotenv()

def setup_database():
    """Create database and enable PostGIS extension"""
    
    db_url = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/pivot_db")
    
    # Parse connection details
    if db_url.startswith("postgresql://"):
        db_url = db_url[13:]
    
    if "@" in db_url:
        auth_part, rest = db_url.split("@", 1)
        user, password = auth_part.split(":", 1) if ":" in auth_part else (auth_part, "")
        
        if "/" in rest:
            host_port, dbname = rest.split("/", 1)
            host, port = host_port.split(":", 1) if ":" in host_port else (host_port, "5432")
        else:
            host, port = rest, "5432"
            dbname = "pivot_db"
    else:
        print("Invalid DATABASE_URL format")
        return
    
    try:
        # Connect to PostgreSQL server
        conn = psycopg2.connect(
            host=host, port=port, user=user, password=password, database="postgres"
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Create database if it doesn't exist
        cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (dbname,))
        if not cursor.fetchone():
            print(f"Creating database '{dbname}'...")
            cursor.execute(f"CREATE DATABASE {dbname}")
            print(f"Database '{dbname}' created!")
        else:
            print(f"Database '{dbname}' already exists.")
        
        cursor.close()
        conn.close()
        
        # Enable PostGIS in the new database
        conn = psycopg2.connect(
            host=host, port=port, user=user, password=password, database=dbname
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        cursor.execute("CREATE EXTENSION IF NOT EXISTS postgis")
        print("PostGIS extension enabled!")
        
        cursor.close()
        conn.close()
        
        print("Database setup completed!")
        
    except Exception as e:
        print(f"Error: {e}")
        print("Make sure PostgreSQL is running and credentials are correct.")

if __name__ == "__main__":
    setup_database()
