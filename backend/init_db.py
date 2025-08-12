#!/usr/bin/env python3
"""
Database initialization script for PostgreSQL with PostGIS
"""

from db.setup import setup_database, verify_setup

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
