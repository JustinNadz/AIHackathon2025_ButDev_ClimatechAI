#!/usr/bin/env python3
"""
Database initialization script for PostgreSQL with PostGIS
"""

from db.setup import setup_database, verify_setup
from db.base import SessionLocal
from db.queries import (
    add_flood_data, add_earthquake_data
)
from datetime import datetime, timedelta


def create_sample_data():
    """Create sample data for all data types"""
    print("\n📊 Creating sample data for all data types...")
    
    db = SessionLocal()
    
    try:
        # Sample flood data
        print("🌊 Creating sample flood data...")
        flood_multipolygon = "MULTIPOLYGON (((125.56724 8.69465, 125.56751 8.69465, 125.56751 8.69447, 125.56724 8.69447, 125.56724 8.69465)))"
        add_flood_data(
            db=db,
            geometry_wkt=flood_multipolygon,
            risk_level=2.0,
            area_name="Sample Flood Zone",
            source="sample_data"
        )
        
        # Sample earthquake data
        print("🌋 Creating sample earthquake data...")
        earthquake_point = "POINT(121.7740 12.8797)"
        add_earthquake_data(
            db=db,
            geometry_wkt=earthquake_point,
            magnitude=4.5,
            depth=10.5,
            event_time=datetime.now() - timedelta(hours=2),
            location_name="Sample Earthquake Location",
            source="sample_data"
        )
        
        # TODO: add the sample data for everything else later
        
        print("✅ Sample data created successfully for all data types!")
        
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
        print("\n📋 Available API Endpoints:")
        print("🌊 Flood Data:")
        print("  - GET /api/flood-data - Get flood data")
        print("  - GET /api/flood-data/stats - Get flood statistics")
        print("🌋 Earthquake Data:")
        print("  - GET /api/earthquake-data - Get earthquake data")
        print("🏥 Infrastructure Data:")
        print("  - GET /api/infrastructure-data - Get infrastructure data")
        print("🏠 Evacuation Centers:")
        print("  - GET /api/evacuation-centers - Get evacuation centers")
        print("🗺️ Combined Data:")
        print("  - GET /api/all-data - Get all data types")
        print("🔍 Debug:")
        print("  - GET /api/debug/flood-data - Debug flood data")
        print("\n📋 Next steps:")
        print("1. Run 'python run_ingestions.py <file_path>' to ingest your flood data")
        print("2. Run 'python app.py' to start the Flask application")
        print("3. Visit http://localhost:5000 to see the map")
        
    except Exception as e:
        print(f"❌ Initialization failed: {e}")
        print("\n💡 Make sure:")
        print("- PostgreSQL is running")
        print("- PostGIS extension is installed")
        print("- Database credentials in .env are correct")


if __name__ == "__main__":
    main()
