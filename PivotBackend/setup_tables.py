#!/usr/bin/env python3
"""
Table setup script for Pivot Backend
Creates all database tables for the models
"""

import os
from dotenv import load_dotenv
from database import engine
from models import Base, WeatherData, FloodData, LandslideData

load_dotenv()

def setup_tables():
    """Create all database tables"""
    
    try:
        print("Creating database tables...")
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        print("✅ All tables created successfully!")
        print("\nCreated tables:")
        print("- weather_data")
        print("- flood_data") 
        print("- landslide_data")
        
        # Verify tables exist
        from sqlalchemy import inspect
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        
        print(f"\nExisting tables in database: {existing_tables}")
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        print("Make sure the database is running and accessible.")

def drop_tables():
    """Drop all database tables (use with caution!)"""
    
    try:
        print("⚠️  Dropping all database tables...")
        
        # Drop all tables
        Base.metadata.drop_all(bind=engine)
        
        print("✅ All tables dropped successfully!")
        
    except Exception as e:
        print(f"❌ Error dropping tables: {e}")

def reset_tables():
    """Drop and recreate all tables"""
    
    try:
        print("🔄 Resetting all database tables...")
        
        # Drop all tables
        Base.metadata.drop_all(bind=engine)
        print("✅ Tables dropped.")
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ Tables recreated.")
        
        print("🔄 Database reset completed!")
        
    except Exception as e:
        print(f"❌ Error resetting tables: {e}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == "drop":
            drop_tables()
        elif command == "reset":
            reset_tables()
        else:
            print("Usage: python setup_tables.py [drop|reset]")
            print("  No arguments: Create tables")
            print("  drop: Drop all tables")
            print("  reset: Drop and recreate all tables")
    else:
        setup_tables()
