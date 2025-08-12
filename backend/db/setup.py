#!/usr/bin/env python3
"""
Database setup module for PostgreSQL with PostGIS
Handles database creation, PostGIS extension, and table initialization
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError, ProgrammingError
from config import DATABASE_URL


def create_database_if_not_exists():
    """Create the database if it doesn't exist"""
    # Extract database name from URL
    if 'postgresql://' in DATABASE_URL:
        # Parse the URL to get database name
        parts = DATABASE_URL.split('/')
        if len(parts) >= 4:
            db_name = parts[-1]
            # Create connection URL without database name
            base_url = '/'.join(parts[:-1])
            
            try:
                # Connect to PostgreSQL server (not specific database)
                engine = create_engine(base_url + '/postgres')
                
                with engine.connect() as conn:
                    # Check if database exists
                    result = conn.execute(text(f"SELECT 1 FROM pg_database WHERE datname = '{db_name}'"))
                    exists = result.fetchone()
                    
                    if not exists:
                        # Create database
                        conn.execute(text(f"CREATE DATABASE {db_name}"))
                        conn.commit()
                        print(f"✅ Database '{db_name}' created successfully")
                    else:
                        print(f"ℹ️ Database '{db_name}' already exists")
                        
            except Exception as e:
                print(f"⚠️ Could not create database automatically: {e}")
                print("Please create the database manually:")
                print(f"  psql -U postgres -c 'CREATE DATABASE {db_name};'")
        else:
            print("⚠️ Could not parse database name from DATABASE_URL")
    else:
        print("ℹ️ Not a PostgreSQL URL, skipping database creation")


def enable_postgis_extension():
    """Enable PostGIS extension in the database"""
    try:
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as conn:
            # Check if PostGIS extension exists
            result = conn.execute(text("SELECT 1 FROM pg_extension WHERE extname = 'postgis'"))
            exists = result.fetchone()
            
            if not exists:
                # Enable PostGIS extension
                conn.execute(text("CREATE EXTENSION postgis"))
                conn.commit()
                print("✅ PostGIS extension enabled")
            else:
                print("ℹ️ PostGIS extension already enabled")
                
    except Exception as e:
        print(f"❌ Error enabling PostGIS extension: {e}")
        print("Make sure PostGIS is installed on your system")
        raise


def setup_database():
    """Complete database setup process"""
    print("🗄️ Setting up PostgreSQL database with PostGIS...")
    
    try:
        # Step 1: Create database if it doesn't exist
        create_database_if_not_exists()
        
        # Step 2: Enable PostGIS extension
        enable_postgis_extension()
        
        # Step 3: Create tables
        from .base import create_tables
        create_tables()
        
        print("✅ Database setup completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Database setup failed: {e}")
        return False


def verify_setup():
    """Verify that the database setup is correct"""
    print("🔍 Verifying database setup...")
    
    try:
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as conn:
            # Test 1: Check PostgreSQL version
            result = conn.execute(text("SELECT version();"))
            version = result.fetchone()[0]
            print(f"✅ PostgreSQL: {version.split(',')[0]}")
            
            # Test 2: Check PostGIS version
            result = conn.execute(text("SELECT PostGIS_Version();"))
            postgis_version = result.fetchone()[0]
            print(f"✅ PostGIS: {postgis_version}")
            
            # Test 3: Check tables exist
            result = conn.execute(text("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name IN (
                    'flood_data', 'landslide_data', 'earthquake_data', 
                    'weather_data', 'chat_history', 'emergency_protocols'
                )
                ORDER BY table_name;
            """))
            tables = [row[0] for row in result.fetchall()]
            
            expected_tables = ['flood_data', 'landslide_data', 'earthquake_data', 'weather_data', 'chat_history', 'emergency_protocols']
            missing_tables = [table for table in expected_tables if table not in tables]
            
            if missing_tables:
                print(f"❌ Missing tables: {missing_tables}")
                print(f"✅ Found tables: {tables}")
                return False
            else:
                print(f"✅ All required tables exist: {tables}")
            
            # Test 4: Check spatial functions
            result = conn.execute(text("SELECT ST_AsText(ST_GeomFromText('POINT(0 0)'));"))
            point = result.fetchone()[0]
            print(f"✅ Spatial functions working: {point}")
            
            # Test 5: Check table structures
            print("\n📋 Table structures:")
            for table_name in ['flood_data', 'landslide_data']:
                result = conn.execute(text(f"""
                    SELECT column_name, data_type, udt_name 
                    FROM information_schema.columns 
                    WHERE table_name = '{table_name}' 
                    ORDER BY ordinal_position;
                """))
                columns = result.fetchall()
                print(f"  {table_name}:")
                for col in columns:
                    print(f"    - {col[0]}: {col[1]} ({col[2]})")
            
        print("✅ Database verification completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Database verification failed: {e}")
        return False


if __name__ == "__main__":
    """Run database setup if called directly"""
    success = setup_database()
    if success:
        verify_setup()
    else:
        sys.exit(1)
