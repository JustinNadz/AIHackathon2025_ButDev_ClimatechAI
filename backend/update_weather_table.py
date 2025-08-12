#!/usr/bin/env python3
"""
Update Weather Table Script
Adds metadata column to weather_data table for storing Filipino weather conditions
"""

import os
import sys
from sqlalchemy import text

# Ensure the backend directory is in Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db.base import engine
from db.setup import setup_database


def update_weather_table():
    """Add weather_metadata column to weather_data table if it doesn't exist"""
    print("🗄️ Updating weather_data table...")
    
    try:
        with engine.connect() as conn:
            # Check if weather_metadata column exists
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'weather_data' 
                AND column_name = 'weather_metadata'
            """))
            
            if result.fetchone():
                print("✅ weather_metadata column already exists in weather_data table")
            else:
                print("📝 Adding weather_metadata column to weather_data table...")
                
                # Add weather_metadata column
                conn.execute(text("""
                    ALTER TABLE weather_data 
                    ADD COLUMN weather_metadata JSON
                """))
                conn.commit()
                
                print("✅ Successfully added weather_metadata column to weather_data table")
            
            # Verify table structure
            print("\n📋 Current weather_data table structure:")
            result = conn.execute(text("""
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'weather_data' 
                ORDER BY ordinal_position
            """))
            
            for row in result:
                nullable = "NULL" if row[2] == "YES" else "NOT NULL"
                print(f"  - {row[0]}: {row[1]} ({nullable})")
            
            return True
            
    except Exception as e:
        print(f"❌ Error updating weather_data table: {e}")
        return False


def main():
    """Main function"""
    print("🗄️ ClimaTech Weather Table Update")
    print("=" * 40)
    
    # First ensure the database and tables exist
    print("🏗️ Setting up database...")
    setup_success = setup_database()
    
    if not setup_success:
        print("❌ Database setup failed")
        return
    
    # Update the weather table
    update_success = update_weather_table()
    
    if update_success:
        print("\n✅ Weather table update completed successfully!")
        print("\n📊 You can now:")
        print("  1. Run weather data collection: python collect_weather_data.py")
        print("  2. Check the database with the verification steps below")
    else:
        print("\n❌ Weather table update failed")


if __name__ == "__main__":
    main() 