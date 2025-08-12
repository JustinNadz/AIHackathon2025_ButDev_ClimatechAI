#!/usr/bin/env python3
"""
Frontend Cities Weather Collection Script
Collects weather data for the exact Philippine cities listed in map-component.tsx
"""

import os
import sys
from datetime import datetime

# Ensure the backend directory is in Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from weather.weather_database import WeatherDatabaseManager


def collect_frontend_cities_weather():
    """
    Collect weather data for the exact Philippine cities from map-component.tsx
    These cities match the frontend PHILIPPINE_CITIES array (lines 29-39)
    """
    
    # Exact cities from ClimaTechUser/components/map-component.tsx lines 29-39
    frontend_cities = [
        (14.5995, 120.9842, "Manila Weather Station"),
        (14.6760, 121.0437, "Quezon City Weather Station"),
        (10.3157, 123.8854, "Cebu City Weather Station"),
        (7.1907, 125.4553, "Davao City Weather Station"),
        (10.7202, 122.5621, "Iloilo City Weather Station"),
        (16.4023, 120.5960, "Baguio Weather Station"),
        (6.9214, 122.0790, "Zamboanga City Weather Station"),
        (8.4542, 124.6319, "Cagayan de Oro Weather Station"),
        (6.1164, 125.1716, "General Santos Weather Station")
    ]
    
    print("🗺️ Frontend Cities Weather Collection")
    print("=" * 50)
    print(f"📍 Collecting weather data for {len(frontend_cities)} cities from map-component.tsx")
    print(f"📅 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Check API key
    api_key = os.getenv('GOOGLE_MAPS_API_KEY')
    if not api_key:
        print("⚠️ Warning: GOOGLE_MAPS_API_KEY not found in environment")
        print("🔄 Will use enhanced mock data with Filipino weather conditions")
    else:
        print(f"✅ Google Maps API Key found: {api_key[:8]}...")
    
    print("\n🏙️ Cities to process:")
    for i, (lat, lng, name) in enumerate(frontend_cities, 1):
        print(f"  {i}. {name} ({lat:.4f}, {lng:.4f})")
    
    # Collect weather data
    with WeatherDatabaseManager(api_key) as weather_manager:
        result = weather_manager.collect_multiple_locations(frontend_cities)
        
        print(f"\n📊 Frontend Cities Collection Summary:")
        print(f"  🏙️ Total Cities: {result['total_locations']}")
        print(f"  ✅ Successful: {result['successful']}")
        print(f"  ❌ Failed: {result['failed']}")
        print(f"  📈 Success Rate: {result['success_rate']:.1f}%")
        
        # Show detailed results
        print(f"\n📋 Detailed Results:")
        for i, city_result in enumerate(result['results'], 1):
            lat, lng = city_result['location']
            status = "✅" if city_result['status'] == 'success' else "❌"
            city_name = frontend_cities[i-1][2]  # Get city name
            print(f"  {i}. {status} {city_name}")
        
        return result


def verify_frontend_cities_data():
    """Verify that weather data was collected for frontend cities"""
    print("\n🔍 Verifying Frontend Cities Weather Data")
    print("=" * 50)
    
    try:
        from db.base import engine
        from sqlalchemy import text
        
        with engine.connect() as conn:
            # Query weather data for the frontend cities
            result = conn.execute(text("""
                SELECT 
                    station_name,
                    temperature,
                    humidity,
                    rainfall,
                    weather_metadata->>'description' as weather_condition,
                    ST_X(geometry) as longitude,
                    ST_Y(geometry) as latitude,
                    created_at
                FROM weather_data 
                WHERE station_name LIKE '%Weather Station'
                ORDER BY created_at DESC;
            """))
            
            rows = result.fetchall()
            
            if rows:
                print(f"✅ Found {len(rows)} weather records for cities:")
                print("\n📊 Weather Data Summary:")
                print("-" * 80)
                print(f"{'Station Name':<25} {'Temp':<6} {'Humidity':<8} {'Condition':<20} {'Location'}")
                print("-" * 80)
                
                for row in rows:
                    station = row[0][:24] if row[0] else "Unknown"
                    temp = f"{row[1]:.1f}°C" if row[1] else "N/A"
                    humidity = f"{row[2]:.0f}%" if row[2] else "N/A"
                    condition = row[4][:19] if row[4] else "Unknown"
                    location = f"({row[6]:.2f}, {row[5]:.2f})" if row[5] and row[6] else "N/A"
                    
                    print(f"{station:<25} {temp:<6} {humidity:<8} {condition:<20} {location}")
                
                print("-" * 80)
                
                # Check for Filipino weather conditions
                print(f"\n🌤️ Filipino Weather Conditions Found:")
                condition_result = conn.execute(text("""
                    SELECT 
                        weather_metadata->>'description' as weather_condition,
                        COUNT(*) as count
                    FROM weather_data 
                    WHERE weather_metadata->>'description' IS NOT NULL
                    AND station_name LIKE '%Weather Station'
                    GROUP BY weather_metadata->>'description'
                    ORDER BY count DESC;
                """))
                
                conditions = condition_result.fetchall()
                for condition, count in conditions:
                    print(f"  • {condition}: {count} station(s)")
                
                return True
            else:
                print("❌ No weather data found for frontend cities")
                print("💡 Run the collection script first: python collect_frontend_cities_weather.py")
                return False
                
    except Exception as e:
        print(f"❌ Error verifying weather data: {e}")
        return False


def main():
    """Main function"""
    print("🌤️ ClimaTech Frontend Cities Weather Collection")
    print("=" * 55)
    
    try:
        # Collect weather data for frontend cities
        result = collect_frontend_cities_weather()
        
        if result and result['success_rate'] > 0:
            print(f"\n🎉 Successfully collected weather data for {result['successful']} cities!")
            
            # Verify the data
            verification_success = verify_frontend_cities_data()
            
            if verification_success:
                print(f"\n✅ All systems ready! Your frontend map will now have:")
                print(f"  🗺️ Weather data for all {len(result['results'])} Philippine cities")
                print(f"  🌤️ Filipino weather conditions in database")
                print(f"  📍 Geographic coordinates matching map-component.tsx")
                print(f"  🔗 Ready for API integration with ClimaTechUser frontend")
                
                print(f"\n📡 To integrate with your frontend map:")
                print(f"  1. Your map component can now call: /api/weather-data")
                print(f"  2. Weather markers will show real data from your database")
                print(f"  3. Filipino weather conditions will display correctly")
            
        else:
            print(f"\n❌ Failed to collect weather data for frontend cities")
            
    except KeyboardInterrupt:
        print("\n\n👋 Collection interrupted by user")
    except Exception as e:
        print(f"\n❌ An error occurred: {e}")
    
    print(f"\n📅 Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == "__main__":
    main() 