#!/usr/bin/env python3
"""
Database refresh script - drops all tables and recreates them with fresh sample data
"""
from db.base import engine, Base
from db.setup import setup_database
from db.base import SessionLocal
from db.queries import (
    add_flood_data, add_earthquake_data, add_landslide_data, add_weather_data
)
from sqlalchemy import text
from datetime import datetime, timedelta
import sys


def drop_all_tables():
    """Drop all existing tables"""
    print("🗑️ Dropping all existing tables...")
    
    try:
        with engine.connect() as conn:
            # Get all table names (excluding PostGIS system tables)
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name NOT LIKE 'spatial_ref_sys%'
                AND table_name NOT LIKE 'geometry_columns%'
                AND table_name NOT LIKE 'geography_columns%'
                AND table_name NOT LIKE 'raster_columns%'
                AND table_name NOT LIKE 'raster_overviews%';
            """))
            tables = [row[0] for row in result.fetchall()]
            
            if tables:
                print(f"Found tables to drop: {tables}")
                
                # Drop tables in reverse dependency order
                for table in reversed(tables):
                    try:
                        conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE;"))
                        print(f"  ✅ Dropped {table}")
                    except Exception as e:
                        print(f"  ⚠️ Could not drop {table}: {e}")
                
                conn.commit()
                print("✅ All tables dropped successfully")
            else:
                print("ℹ️ No existing tables to drop")
                
    except Exception as e:
        print(f"❌ Error dropping tables: {e}")
        return False
    
    return True


def create_fresh_tables():
    """Create all tables fresh"""
    print("\n🏗️ Creating fresh tables...")
    
    try:
        # This will create all tables defined in models
        Base.metadata.create_all(engine)
        print("✅ All tables created successfully")
        
        # Verify tables were created
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name;
            """))
            new_tables = [row[0] for row in result.fetchall()]
            
            required_tables = ['flood_data', 'landslide_data', 'earthquake_data', 'weather_data', 'chat_history']
            print(f"\n📋 Tables created: {new_tables}")
            
            for table in required_tables:
                if table in new_tables:
                    print(f"  ✅ {table} - Created")
                else:
                    print(f"  ❌ {table} - Missing")
                    
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return False
    
    return True


def create_sample_data():
    """Create fresh sample data"""
    print("\n📊 Creating fresh sample data...")
    
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
        
        # Add more flood data with different risk levels
        flood_polygon2 = "MULTIPOLYGON (((125.56800 8.69500, 125.56850 8.69500, 125.56850 8.69480, 125.56800 8.69480, 125.56800 8.69500)))"
        add_flood_data(
            db=db,
            geometry_wkt=flood_polygon2,
            risk_level=3.0
        )
        
        flood_polygon3 = "MULTIPOLYGON (((125.56600 8.69300, 125.56650 8.69300, 125.56650 8.69280, 125.56600 8.69280, 125.56600 8.69300)))"
        add_flood_data(
            db=db,
            geometry_wkt=flood_polygon3,
            risk_level=1.0
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
        
        # Add more earthquake data with different magnitudes
        earthquake_point2 = "POINT(121.7750 12.8800)"
        add_earthquake_data(
            db=db,
            geometry_wkt=earthquake_point2,
            magnitude=3.2,
            depth=8.0,
            event_time=datetime.now() - timedelta(hours=1),
            location_name="Sample Earthquake Location 2",
            source="sample_data"
        )
        
        earthquake_point3 = "POINT(121.7760 12.8810)"
        add_earthquake_data(
            db=db,
            geometry_wkt=earthquake_point3,
            magnitude=5.8,
            depth=15.0,
            event_time=datetime.now() - timedelta(hours=3),
            location_name="Sample Earthquake Location 3",
            source="sample_data"
        )
        
        earthquake_point4 = "POINT(121.7770 12.8820)"
        add_earthquake_data(
            db=db,
            geometry_wkt=earthquake_point4,
            magnitude=2.1,
            depth=5.0,
            event_time=datetime.now() - timedelta(hours=4),
            location_name="Sample Earthquake Location 4",
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
        
        # Add more landslide data with different risk levels
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
        
        # Sample weather data
        print("🌤️ Creating sample weather data...")
        weather_locations = [
            (14.5995, 120.9842, "Manila Weather Station"),
            (10.3157, 123.8854, "Cebu Weather Station"),
            (7.1907, 125.4553, "Davao Weather Station"),
            (16.4023, 120.5960, "Baguio Weather Station"),
            (15.4700, 120.9600, "Tarlac Weather Station"),
        ]
        
        for lat, lng, station_name in weather_locations:
            weather_point = f"POINT({lng} {lat})"
            add_weather_data(
                db=db,
                geometry_wkt=weather_point,
                temperature=25.0 + (lat - 12) * 2,  # Temperature varies with latitude
                humidity=75.0,
                rainfall=2.5,
                wind_speed=15.0,
                wind_direction=180.0,
                pressure=1013.0,
                station_name=station_name,
                recorded_at=datetime.now(),
                source="sample_data"
            )
        
        print("✅ Sample data created successfully for all data types!")
        
    except Exception as e:
        print(f"❌ Error creating sample data: {e}")
        raise
    finally:
        db.close()


def verify_database():
    """Verify the database is working correctly"""
    print("\n🔍 Verifying database...")
    
    try:
        with engine.connect() as conn:
            # Check table counts
            tables_to_check = ['flood_data', 'landslide_data', 'earthquake_data', 'weather_data', 'chat_history']
            
            for table in tables_to_check:
                result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = result.fetchone()[0]
                print(f"  📊 {table}: {count} rows")
            
            # Check spatial functions
            result = conn.execute(text("SELECT PostGIS_Version();"))
            postgis_version = result.fetchone()[0]
            print(f"  🗺️ PostGIS: {postgis_version}")
            
            # Test spatial query
            result = conn.execute(text("SELECT COUNT(*) FROM flood_data WHERE ST_IsValid(geometry);"))
            valid_geometries = result.fetchone()[0]
            print(f"  ✅ Valid flood geometries: {valid_geometries}")
            
            result = conn.execute(text("SELECT COUNT(*) FROM landslide_data WHERE ST_IsValid(geometry);"))
            valid_geometries = result.fetchone()[0]
            print(f"  ✅ Valid landslide geometries: {valid_geometries}")
            
        print("✅ Database verification completed!")
        
    except Exception as e:
        print(f"❌ Error verifying database: {e}")
        return False
    
    return True


def main():
    """Main refresh function"""
    print("🔄 Database Refresh Tool")
    print("=" * 50)
    print("This will:")
    print("1. Drop all existing tables")
    print("2. Create fresh tables")
    print("3. Add sample data")
    print("4. Verify everything works")
    print()
    
    # Ask for confirmation
    response = input("Are you sure you want to refresh the database? (y/N): ")
    if response.lower() != 'y':
        print("❌ Database refresh cancelled")
        return
    
    try:
        # Step 1: Drop all tables
        if not drop_all_tables():
            print("❌ Failed to drop tables")
            sys.exit(1)
        
        # Step 2: Create fresh tables
        if not create_fresh_tables():
            print("❌ Failed to create tables")
            sys.exit(1)
        
        # Step 4: Verify database
        if not verify_database():
            print("❌ Database verification failed")
            sys.exit(1)
        
        print("\n🎉 Database refresh completed successfully!")
        print("\n📋 Next steps:")
        print("1. Run 'python app.py' to start the Flask application")
        print("2. Visit http://localhost:5000 to see the map")
        print("3. Test API endpoints:")
        print("   - GET /api/flood-data")
        print("   - GET /api/landslide-data")
        print("   - GET /api/flood-data/stats")
        print("   - GET /api/landslide-data/stats")
        
    except Exception as e:
        print(f"❌ Database refresh failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
