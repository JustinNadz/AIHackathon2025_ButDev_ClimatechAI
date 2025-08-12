#!/usr/bin/env python3
"""
Example usage of Google Weather API for PivotBackend
Demonstrates how to fetch weather data at specific points and store in database
"""

import os
from dotenv import load_dotenv
from google_weather_api import WeatherDatabaseManager, GoogleWeatherAPI

# Load environment variables
load_dotenv()

def example_single_location():
    """Example: Fetch raw weather for a single location and save to database"""
    print("🌤️ Example 1: Single Location Raw Weather Collection")
    print("=" * 50)
    
    # Manila coordinates
    lat, lng = 14.5995, 120.9842
    
    # Use context manager for automatic database connection handling
    with WeatherDatabaseManager() as weather_manager:
        success = weather_manager.collect_and_save_weather(
            lat=lat, 
            lng=lng, 
            station_name="Manila_Central"
        )
        
        if success:
            print("✅ Successfully collected and stored Manila weather data")
        else:
            print("❌ Failed to collect Manila weather data")


def example_multiple_locations():
    """Example: Fetch raw weather for multiple Philippine cities"""
    print("\n🌤️ Example 2: Multiple Locations Raw Weather Collection")
    print("=" * 50)
    
    # Philippine cities with their coordinates
    philippine_cities = [
        (14.5995, 120.9842, "Manila"),           # Manila
        (10.3157, 123.8854, "Cebu"),            # Cebu
        (7.1907, 125.4553, "Davao"),            # Davao
        (16.4023, 120.5960, "Baguio"),          # Baguio
        (11.2404, 125.0056, "Tacloban"),        # Tacloban
        (8.5379, 124.7569, "Cagayan_de_Oro"),   # Cagayan de Oro
        (15.8700, 120.9600, "Dagupan"),         # Dagupan
        (13.7563, 121.0583, "Lucena"),          # Lucena
        (6.5244, 124.8470, "Koronadal"),        # Koronadal
    ]
    
    with WeatherDatabaseManager() as weather_manager:
        success_count = 0
        
        for lat, lng, city_name in philippine_cities:
            print(f"\n📍 Collecting weather for {city_name}...")
            
            success = weather_manager.collect_and_save_weather(
                lat=lat, 
                lng=lng, 
                station_name=f"{city_name}_Station"
            )
            
            if success:
                success_count += 1
                print(f"✅ {city_name} weather data collected successfully")
            else:
                print(f"❌ Failed to collect {city_name} weather data")
        
        print(f"\n📊 Summary: Successfully collected raw weather data for {success_count}/{len(philippine_cities)} cities")


def example_api_only():
    """Example: Use the API without database storage to get raw data"""
    print("\n🌤️ Example 3: Raw API Data (No Database Storage)")
    print("=" * 50)
    
    # Create API instance
    weather_api = GoogleWeatherAPI()
    
    # Test locations
    test_locations = [
        (14.5995, 120.9842, "Manila"),
        (10.3157, 123.8854, "Cebu"),
        (7.1907, 125.4553, "Davao"),
    ]
    
    for lat, lng, city_name in test_locations:
        print(f"\n📍 Getting weather for {city_name}...")
        
        weather_data = weather_api.get_weather_data(lat, lng)
        
        if weather_data:
            current = weather_data['current']
            location = weather_data['location']
            
                    print(f"✅ {city_name} Raw Weather Data:")
        print(f"   🌡️ Temperature: {current['temperature']}°C")
        print(f"   🌤️ Condition: {current['description']}")
        print(f"   💧 Humidity: {current['humidity']}%")
        print(f"   🌧️ Rainfall: {current['rainfall']}mm/h")
        print(f"   💨 Wind: {current['wind_speed']}km/h")
        print(f"   📍 Location: {location['name']}")
        print(f"   🔗 Source: {weather_data['source']}")
        else:
            print(f"❌ Failed to get weather data for {city_name}")


def example_batch_processing():
    """Example: Batch processing multiple locations efficiently for raw data"""
    print("\n🌤️ Example 4: Batch Processing Raw Weather Data")
    print("=" * 50)
    
    # Define locations as tuples (lat, lng)
    locations = [
        (14.5995, 120.9842),  # Manila
        (10.3157, 123.8854),  # Cebu
        (7.1907, 125.4553),   # Davao
        (16.4023, 120.5960),  # Baguio
        (11.2404, 125.0056),  # Tacloban
    ]
    
    with WeatherDatabaseManager() as weather_manager:
        success_count = weather_manager.collect_weather_for_multiple_locations(locations)
        
        print(f"\n📊 Raw Weather Batch Processing Complete!")
        print(f"   ✅ Successfully processed: {success_count} locations")
        print(f"   ❌ Failed: {len(locations) - success_count} locations")


def main():
    """Run all examples"""
    print("🌤️ PivotBackend Raw Google Weather API Examples")
    print("=" * 60)
    
    # Check if API key is available
    api_key = os.getenv('GOOGLE_MAPS_API_KEY')
    if api_key:
        print("✅ Google Maps API key found - will use real raw weather data")
    else:
        print("⚠️ No Google Maps API key found - will use raw mock data")
        print("   Set GOOGLE_MAPS_API_KEY in your .env file for real data")
    
    print("\n" + "=" * 60)
    
    try:
        # Run examples
        example_single_location()
        example_multiple_locations()
        example_api_only()
        example_batch_processing()
        
        print("\n🎉 All examples completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Error running examples: {e}")
        print("Make sure your database is running and properly configured.")


if __name__ == "__main__":
    main()
