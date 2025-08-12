#!/usr/bin/env python3
"""
Weather Data Collection Script
Collects weather data from Google Weather API and saves to PostgreSQL database
"""

import os
import sys
from datetime import datetime

# Ensure the backend directory is in Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from weather.weather_database import WeatherDatabaseManager, collect_philippine_cities_weather


def main():
    """Main function to collect weather data"""
    print("🌤️ ClimaTech Weather Data Collection System")
    print("=" * 50)
    print(f"📅 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Check if API key is available
    api_key = os.getenv('GOOGLE_MAPS_API_KEY')
    if not api_key:
        print("⚠️ Warning: GOOGLE_MAPS_API_KEY not found in environment")
        print("🔄 Will use enhanced mock data with Filipino weather conditions")
    else:
        print(f"✅ Google Maps API Key found: {api_key[:8]}...")
    
    print("\nChoose an option:")
    print("1. Test single location (Manila)")
    print("2. Collect data for 3 major cities")
    print("3. Collect data for all major Philippine cities (15 locations)")
    print("4. Custom location")
    
    try:
        choice = input("\nEnter your choice (1-4): ").strip()
        
        if choice == "1":
            # Test single location
            print("\n📍 Testing single location: Manila")
            with WeatherDatabaseManager(api_key) as weather_manager:
                success = weather_manager.collect_and_save_weather(
                    14.5995, 120.9842, "Manila Test Station"
                )
                if success:
                    print("✅ Manila weather data collected successfully!")
                else:
                    print("❌ Failed to collect Manila weather data")
        
        elif choice == "2":
            # Test 3 major cities
            print("\n🏙️ Collecting data for 3 major cities...")
            test_cities = [
                (14.5995, 120.9842, "Manila Weather Station"),
                (10.3157, 123.8854, "Cebu City Weather Station"),
                (7.1907, 125.4553, "Davao City Weather Station")
            ]
            
            with WeatherDatabaseManager(api_key) as weather_manager:
                result = weather_manager.collect_multiple_locations(test_cities)
                print(f"\n🎯 Result: {result['successful']}/{result['total_locations']} cities processed successfully!")
        
        elif choice == "3":
            # Collect all major Philippine cities
            print("\n🇵🇭 Collecting data for all major Philippine cities...")
            result = collect_philippine_cities_weather()
            print(f"\n🎯 Final Result: {result['successful']}/{result['total_locations']} cities processed successfully!")
        
        elif choice == "4":
            # Custom location
            print("\n📍 Enter custom location:")
            try:
                lat = float(input("Latitude: "))
                lng = float(input("Longitude: "))
                station_name = input("Station name (optional): ").strip() or None
                
                print(f"\n🌤️ Collecting weather data for ({lat:.4f}, {lng:.4f})...")
                with WeatherDatabaseManager(api_key) as weather_manager:
                    success = weather_manager.collect_and_save_weather(lat, lng, station_name)
                    if success:
                        print("✅ Custom location weather data collected successfully!")
                    else:
                        print("❌ Failed to collect weather data for custom location")
            
            except ValueError:
                print("❌ Invalid coordinates. Please enter numeric values.")
        
        else:
            print("❌ Invalid choice. Please run the script again.")
    
    except KeyboardInterrupt:
        print("\n\n👋 Collection interrupted by user")
    except Exception as e:
        print(f"\n❌ An error occurred: {e}")
    
    print(f"\n📅 Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == "__main__":
    main() 