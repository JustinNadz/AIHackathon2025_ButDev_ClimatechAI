#!/usr/bin/env python3
"""
Database initialization script for PostgreSQL with PostGIS
"""

from db.setup import setup_database, verify_setup
from db.base import SessionLocal
from db.queries import (
    add_flood_data, add_earthquake_data, add_landslide_data
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
            risk_level=2.0
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
        
        # Sample landslide data
        print("🏔️ Creating sample landslide data...")
        landslide_polygon = "POLYGON((121.7740 12.8797, 121.7750 12.8797, 121.7750 12.8787, 121.7740 12.8787, 121.7740 12.8797))"
        add_landslide_data(
            db=db,
            geometry_wkt=landslide_polygon,
            risk_level=3.0
        )
        
        # Add more sample landslide data with different risk levels
        landslide_polygon2 = "POLYGON((121.7760 12.8797, 121.7770 12.8797, 121.7770 12.8787, 121.7760 12.8787, 121.7760 12.8797))"
        add_landslide_data(
            db=db,
            geometry_wkt=landslide_polygon2,
            risk_level=1.0
        )
        
        landslide_polygon3 = "POLYGON((121.7780 12.8797, 121.7790 12.8797, 121.7790 12.8787, 121.7780 12.8787, 121.7780 12.8797))"
        add_landslide_data(
            db=db,
            geometry_wkt=landslide_polygon3,
            risk_level=2.0
        )
        
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
        print("🏔️ Landslide Data:")
        print("  - GET /api/landslide-data - Get landslide data")
        print("  - GET /api/landslide-data/stats - Get landslide statistics")
        print("🌋 Earthquake Data:")
        print("  - GET /api/earthquake-data - Get earthquake data")
        print("🔍 Debug:")
        print("  - GET /api/debug/flood-data - Debug flood data")
        print("\n📋 Next steps:")
        print("1. Run 'python run_ingestions.py flood <file_path>' to ingest flood data")
        print("2. Run 'python run_ingestions.py landslide <file_path>' to ingest landslide data")
        print("3. Run 'python app.py' to start the Flask application")
        print("4. Visit http://localhost:5000 to see the map")
        
    except Exception as e:
        print(f"❌ Initialization failed: {e}")
        print("\n💡 Make sure:")
        print("- PostgreSQL is running")
        print("- PostGIS extension is installed")
        print("- Database credentials in .env are correct")


if __name__ == "__main__":
    main()
