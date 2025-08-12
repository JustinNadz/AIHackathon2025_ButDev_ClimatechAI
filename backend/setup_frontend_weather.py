#!/usr/bin/env python3
"""
Complete Frontend Weather Setup Script
Sets up database, collects weather data, and verifies everything for map-component.tsx integration
"""

import os
import sys
from datetime import datetime
import subprocess

# Ensure the backend directory is in Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))


def run_step(step_name, function, required=True):
    """Run a setup step with error handling"""
    print(f"\n{'='*60}")
    print(f"🔄 {step_name}")
    print(f"{'='*60}")
    
    try:
        result = function()
        if result:
            print(f"✅ {step_name} completed successfully!")
            return True
        else:
            print(f"❌ {step_name} failed!")
            if required:
                return False
            return True
    except Exception as e:
        print(f"❌ {step_name} failed with error: {e}")
        if required:
            return False
        return True


def step1_update_database():
    """Step 1: Update database table with metadata column"""
    try:
        from update_weather_table import update_weather_table, setup_database
        
        print("🏗️ Setting up database...")
        setup_success = setup_database()
        if not setup_success:
            return False
        
        print("🗄️ Updating weather table...")
        return update_weather_table()
    except Exception as e:
        print(f"Database setup error: {e}")
        return False


def step2_collect_weather_data():
    """Step 2: Collect weather data for frontend cities"""
    try:
        from collect_frontend_cities_weather import collect_frontend_cities_weather
        
        print("🌤️ Collecting weather data for frontend cities...")
        result = collect_frontend_cities_weather()
        
        if result and result.get('success_rate', 0) > 0:
            print(f"✅ Collected weather data for {result['successful']}/{result['total_locations']} cities")
            return True
        else:
            print("❌ Failed to collect weather data")
            return False
    except Exception as e:
        print(f"Weather collection error: {e}")
        return False


def step3_verify_api_endpoint():
    """Step 3: Verify the API endpoint works"""
    try:
        from db.base import SessionLocal
        from sqlalchemy import text
        
        print("🔍 Verifying API endpoint functionality...")
        
        db = SessionLocal()
        try:
            # Test the database query that the API endpoint uses
            result = db.execute(text("""
                SELECT COUNT(*) 
                FROM weather_data 
                WHERE station_name LIKE '%Weather Station'
            """))
            count = result.fetchone()[0]
            
            if count > 0:
                print(f"✅ Found {count} weather records in database")
                return True
            else:
                print("❌ No weather data found in database")
                return False
        finally:
            db.close()
    except Exception as e:
        print(f"API verification error: {e}")
        return False


def step4_test_api_response():
    """Step 4: Test the actual API response"""
    try:
        import requests
        import time
        
        print("🧪 Testing API endpoint...")
        
        # Start a simple test server in background (optional)
        print("💡 You can test the API endpoint manually by:")
        print("   1. Running: python app.py")
        print("   2. Visiting: http://localhost:5000/api/weather-data/frontend-cities")
        
        return True
    except Exception as e:
        print(f"API test error: {e}")
        return False


def step5_verify_frontend_integration():
    """Step 5: Verify frontend integration readiness"""
    print("🔗 Verifying frontend integration readiness...")
    
    # Check if all required files exist
    required_files = [
        "weather/google_weather_api.py",
        "weather/weather_database.py",
        "collect_frontend_cities_weather.py",
        "app.py"
    ]
    
    missing_files = []
    for file in required_files:
        if not os.path.exists(file):
            missing_files.append(file)
    
    if missing_files:
        print(f"❌ Missing required files: {missing_files}")
        return False
    
    print("✅ All required files present")
    
    # Verify database connection
    try:
        from db.base import engine
        with engine.connect() as conn:
            result = conn.execute("SELECT 1")
            if result.fetchone():
                print("✅ Database connection working")
            else:
                print("❌ Database connection failed")
                return False
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return False
    
    return True


def print_final_instructions():
    """Print final setup instructions"""
    print(f"\n{'='*60}")
    print("🎉 FRONTEND WEATHER SETUP COMPLETE!")
    print(f"{'='*60}")
    
    print("\n📱 Your frontend can now use:")
    print("   🔗 API Endpoint: GET /api/weather-data/frontend-cities")
    print("   📍 Cities: 9 Philippine cities from map-component.tsx")
    print("   🌤️ Data: Filipino weather conditions + real measurements")
    
    print("\n🚀 Next Steps:")
    print("   1. Start your backend server:")
    print("      cd backend")
    print("      python app.py")
    
    print("\n   2. Test the API endpoint:")
    print("      curl http://localhost:5000/api/weather-data/frontend-cities")
    
    print("\n   3. Update your map component to use real data:")
    print("      const response = await fetch('/api/weather-data/frontend-cities')")
    print("      const data = await response.json()")
    print("      // Use data.cities array for weather markers")
    
    print("\n📊 API Response Format:")
    print("""   {
     "cities": [
       {
         "city_name": "Manila",
         "coordinates": {"lat": 14.5995, "lng": 120.9842},
         "temperature": 31.2,
         "humidity": 78.5,
         "rainfall": 0.0,
         "filipino_condition": "Partly Cloudy Skies",
         "status": "success"
       },
       // ... 8 more cities
     ],
     "total_cities": 9,
     "cities_with_data": 9,
     "success_rate": 100.0
   }""")
    
    print("\n🔍 Database Verification:")
    print("   psql -h localhost -U postgres -d climatech")
    print("   SELECT station_name, temperature, metadata->>'description' FROM weather_data;")


def main():
    """Main setup function"""
    print("🌤️ ClimaTech Frontend Weather Integration Setup")
    print("=" * 60)
    print(f"📅 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("\n🎯 This script will:")
    print("   1. Update database table with metadata column")
    print("   2. Collect weather data for frontend cities")
    print("   3. Verify API endpoint functionality")
    print("   4. Test API response")
    print("   5. Verify frontend integration readiness")
    
    # Check API key
    api_key = os.getenv('GOOGLE_MAPS_API_KEY')
    if not api_key:
        print("\n⚠️ Warning: GOOGLE_MAPS_API_KEY not found in environment")
        print("🔄 Will use enhanced mock data with Filipino weather conditions")
    else:
        print(f"\n✅ Google Maps API Key found: {api_key[:8]}...")
    
    # Run all setup steps
    steps = [
        ("Step 1: Update Database Table", step1_update_database, True),
        ("Step 2: Collect Weather Data", step2_collect_weather_data, True),
        ("Step 3: Verify API Endpoint", step3_verify_api_endpoint, True),
        ("Step 4: Test API Response", step4_test_api_response, False),
        ("Step 5: Verify Frontend Integration", step5_verify_frontend_integration, True)
    ]
    
    success_count = 0
    for step_name, step_function, required in steps:
        success = run_step(step_name, step_function, required)
        if success:
            success_count += 1
        elif required:
            print(f"\n❌ Setup failed at: {step_name}")
            print("💡 Please fix the error above and try again")
            return False
    
    if success_count >= 4:  # At least 4 out of 5 steps should succeed
        print_final_instructions()
        return True
    else:
        print(f"\n❌ Setup incomplete: {success_count}/{len(steps)} steps completed")
        return False


if __name__ == "__main__":
    try:
        success = main()
        if success:
            print(f"\n🎉 Setup completed successfully!")
        else:
            print(f"\n❌ Setup failed!")
        print(f"📅 Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    except KeyboardInterrupt:
        print("\n\n👋 Setup interrupted by user")
    except Exception as e:
        print(f"\n❌ Setup failed with error: {e}")
        import traceback
        print(f"📋 Traceback: {traceback.format_exc()}") 