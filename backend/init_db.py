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


def create_sample_data():
    """Create sample flood data for testing"""
    print("\n📊 Creating sample flood data...")
    
    db = SessionLocal()
    
    try:
        # Sample polygon (simple rectangle)
        polygon_wkt = "POLYGON((-74.006 40.712, -74.006 40.722, -73.996 40.722, -73.996 40.712, -74.006 40.712))"
        
        # Add sample data
        add_flood_data(
            db=db,
            geometry_wkt=polygon_wkt,
            risk_level=1.5
        )
        
        print("✅ Sample data created successfully!")
        
    except Exception as e:
        print(f"❌ Error creating sample data: {e}")
        raise
    finally:
        db.close()


def main():
    """Main initialization function"""
    print("🌊 PostgreSQL + PostGIS Database Initialization")
    print("=" * 50)
    
    try:
        success = setup_database()
        if not success:
            print("❌ Database setup failed")
            return
        
        # Verify setup
        verify_setup()
        
        # Create sample data
        create_sample_data()
        
        print("\n🎉 Database initialization completed successfully!")
        print("\n📋 Next steps:")
        print("1. Run 'python example_usage.py' to see usage examples")
        print("2. Run 'python run_ingestions.py <file_path>' to ingest your data")
        print("3. Run 'python app.py' to start the Flask application")
        
    except Exception as e:
        print(f"❌ Initialization failed: {e}")
        print("\n💡 Make sure:")
        print("- PostgreSQL is running")
        print("- PostGIS extension is installed")
        print("- Database credentials in .env are correct")


if __name__ == "__main__":
    main()
