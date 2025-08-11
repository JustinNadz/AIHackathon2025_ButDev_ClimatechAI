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
        # Sample MULTIPOLYGON (matches your data structure)
        multipolygon_wkt = "MULTIPOLYGON (((125.56724 8.69465, 125.56751 8.69465, 125.56751 8.69447, 125.56724 8.69447, 125.56724 8.69465)))"
        
        # Add sample data with 1-3 risk scale
        add_flood_data(
            db=db,
            geometry_wkt=multipolygon_wkt,
            risk_level=2.0  # Using 1-3 scale like your data
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
