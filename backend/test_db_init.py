#!/usr/bin/env python3
"""
Test script to verify database initialization works correctly
"""

import sys
import os
from sqlalchemy import create_engine, text
from config import DATABASE_URL

def test_database_initialization():
    """Test that database initialization creates all required tables"""
    print("🧪 Testing database initialization...")
    
    try:
        # Create engine
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as conn:
            # Check if all required tables exist
            required_tables = ['flood_data', 'landslide_data', 'earthquake_data', 'weather_data', 'chat_history']
            
            print("📋 Checking for required tables:")
            for table in required_tables:
                result = conn.execute(text(f"SELECT 1 FROM information_schema.tables WHERE table_name = '{table}'"))
                exists = result.fetchone()
                if exists:
                    print(f"  ✅ {table} - EXISTS")
                else:
                    print(f"  ❌ {table} - MISSING")
                    return False
            
            # Check PostGIS extension
            result = conn.execute(text("SELECT PostGIS_Version();"))
            postgis_version = result.fetchone()[0]
            print(f"  ✅ PostGIS: {postgis_version}")
            
            # Test spatial functions
            result = conn.execute(text("SELECT ST_AsText(ST_GeomFromText('POINT(0 0)'));"))
            point = result.fetchone()[0]
            print(f"  ✅ Spatial functions: {point}")
            
            print("\n🎉 Database initialization test passed!")
            return True
            
    except Exception as e:
        print(f"❌ Database initialization test failed: {e}")
        return False

if __name__ == "__main__":
    success = test_database_initialization()
    sys.exit(0 if success else 1)
