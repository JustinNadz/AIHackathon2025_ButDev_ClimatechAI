#!/usr/bin/env python3
"""
Database initialization script for PostgreSQL with PostGIS
"""

from db.setup import setup_database, verify_setup
from db.models import FloodData, ChatHistory
from db.base import SessionLocal
from db.queries import add_flood_data
from shapely.geometry import Polygon, Point
import json


def main():
    """Main initialization function"""
    
    try:
        success = setup_database()
        if not success:
            print("❌ Database setup failed")
            return
        
        # Verify setup
        verify_setup()
        
        print("\n🎉 Database initialization completed successfully!")
        print("\n📋 Next steps:")
        print("1. Run 'python tests/test_database.py' to verify everything works")
        print("2. Run 'python example_usage.py' to see usage examples")
        print("3. Run 'python run_ingestions.py <file_path> <type>' to ingest your data")
        
    except Exception as e:
        print(f"❌ Initialization failed: {e}")
        print("\n💡 Make sure:")
        print("- PostgreSQL is running")
        print("- PostGIS extension is installed")
        print("- Database credentials in .env are correct")


if __name__ == "__main__":
    main()
