#!/usr/bin/env python3
"""
Weather Database Integration Module
Handles saving weather data from Google Weather API to PostgreSQL using WeatherData model
"""

import sys
import os
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import traceback

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.base import SessionLocal
from db.queries import add_weather_data
from weather.google_weather_api import GoogleWeatherAPI


class WeatherDatabaseManager:
    """Manages weather data collection and storage to database"""
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize with Google Weather API and database connection"""
        self.weather_api = GoogleWeatherAPI(api_key)
        self.db = None
    
    def __enter__(self):
        """Context manager entry"""
        self.db = SessionLocal()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        if self.db:
            self.db.close()
    
    def save_weather_data_to_db(self, weather_data: Dict) -> bool:
        """
        Save weather data to PostgreSQL database
        
        Args:
            weather_data: Weather data dictionary from GoogleWeatherAPI
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if not self.db:
                raise ValueError("Database connection not established. Use context manager.")
            
            location = weather_data.get('location', {})
            current = weather_data.get('current', {})
            
            # Extract location data
            lat = location.get('lat')
            lng = location.get('lng')
            
            if lat is None or lng is None:
                raise ValueError("Invalid location data: lat/lng missing")
            
            # Create geometry WKT string for PostgreSQL/PostGIS
            geometry_wkt = f"POINT({lng} {lat})"
            
            # Extract weather measurements
            temperature = current.get('temperature')
            humidity = current.get('humidity')
            rainfall = current.get('rainfall', 0.0)
            wind_speed = current.get('wind_speed')
            wind_direction = current.get('wind_direction')
            pressure = current.get('pressure')
            
            # Parse timestamp
            timestamp_str = current.get('timestamp')
            if timestamp_str:
                try:
                    recorded_at = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                except ValueError:
                    recorded_at = datetime.now()
            else:
                recorded_at = datetime.now()
            
            # Get source and station info
            source = weather_data.get('source', 'google_weather_api')
            station_name = weather_data.get('station_name', f"Station_{int(lat*1000)}_{int(lng*1000)}")
            
            # Build metadata with Filipino weather condition
            metadata = {
                'description': current.get('description', 'Unknown'),
                'location_name': location.get('name', f"Location ({lat:.4f}, {lng:.4f})"),
                'data_source': source,
                'collection_time': datetime.now().isoformat()
            }
            
            # Save to database using the queries module
            result = add_weather_data(
                db=self.db,
                geometry_wkt=geometry_wkt,
                temperature=temperature,
                humidity=humidity,
                rainfall=rainfall,
                wind_speed=wind_speed,
                wind_direction=wind_direction,
                pressure=pressure,
                station_name=station_name,
                recorded_at=recorded_at,
                source=source,
                weather_metadata=metadata
            )
            
            print(f"✅ Weather data saved to database:")
            print(f"   📍 Location: {lat:.4f}, {lng:.4f}")
            print(f"   🌡️ Temperature: {temperature}°C")
            print(f"   🌤️ Condition: {current.get('description', 'Unknown')}")
            print(f"   💧 Humidity: {humidity}%")
            print(f"   🌧️ Rainfall: {rainfall}mm/h")
            print(f"   💨 Wind: {wind_speed}km/h")
            print(f"   🗄️ Database ID: {result.id}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error saving weather data to database: {e}")
            print(f"📋 Traceback: {traceback.format_exc()}")
            return False
    
    def collect_and_save_weather(self, lat: float, lng: float, station_name: Optional[str] = None) -> bool:
        """
        Collect weather data from API and save to database
        
        Args:
            lat: Latitude
            lng: Longitude  
            station_name: Optional custom station name
            
        Returns:
            True if successful, False otherwise
        """
        try:
            print(f"🌤️ Collecting weather data for ({lat:.4f}, {lng:.4f})...")
            
            # Get weather data from Google API
            weather_data = self.weather_api.get_weather_data(lat, lng)
            
            if not weather_data:
                print(f"❌ Failed to get weather data for location ({lat}, {lng})")
                return False
            
            # Override station name if provided
            if station_name:
                weather_data['station_name'] = station_name
            
            # Save to database
            return self.save_weather_data_to_db(weather_data)
            
        except Exception as e:
            print(f"❌ Error in collect_and_save_weather: {e}")
            return False
    
    def collect_multiple_locations(self, locations: List[Tuple[float, float, Optional[str]]]) -> Dict:
        """
        Collect weather data for multiple locations and save to database
        
        Args:
            locations: List of (lat, lng, station_name) tuples
            
        Returns:
            Dictionary with success/failure counts
        """
        print(f"🌤️ Starting weather data collection for {len(locations)} locations")
        print("=" * 60)
        
        successful = 0
        failed = 0
        results = []
        
        for i, location_data in enumerate(locations):
            if len(location_data) == 2:
                lat, lng = location_data
                station_name = None
            else:
                lat, lng, station_name = location_data
            
            print(f"\n📍 Processing location {i+1}/{len(locations)}: ({lat:.4f}, {lng:.4f})")
            
            success = self.collect_and_save_weather(lat, lng, station_name)
            
            if success:
                successful += 1
                results.append({'location': (lat, lng), 'status': 'success'})
            else:
                failed += 1
                results.append({'location': (lat, lng), 'status': 'failed'})
            
            # Small delay to avoid overwhelming the API
            import time
            time.sleep(0.5)
        
        summary = {
            'total_locations': len(locations),
            'successful': successful,
            'failed': failed,
            'success_rate': (successful / len(locations)) * 100 if locations else 0,
            'results': results
        }
        
        print(f"\n📊 Weather Data Collection Summary:")
        print(f"  ✅ Successful: {successful}")
        print(f"  ❌ Failed: {failed}")
        print(f"  📈 Success Rate: {summary['success_rate']:.1f}%")
        
        return summary


def collect_philippine_cities_weather():
    """Collect weather data for major Philippine cities"""
    
    # Major Philippine cities with coordinates
    philippine_cities = [
        (14.5995, 120.9842, "Manila Weather Station"),
        (14.6760, 121.0437, "Quezon City Weather Station"),
        (10.3157, 123.8854, "Cebu City Weather Station"),
        (7.1907, 125.4553, "Davao City Weather Station"),
        (10.7202, 122.5621, "Iloilo City Weather Station"),
        (16.4023, 120.5960, "Baguio Weather Station"),
        (6.9214, 122.0790, "Zamboanga City Weather Station"),
        (8.4542, 124.6319, "Cagayan de Oro Weather Station"),
        (6.1164, 125.1716, "General Santos Weather Station"),
        (15.4700, 120.9600, "Tarlac City Weather Station"),
        (14.8448, 120.8105, "Angeles City Weather Station"),
        (13.1587, 123.7304, "Legazpi Weather Station"),
        (11.2404, 125.0058, "Tacloban Weather Station"),
        (9.6498, 123.8505, "Tagbilaran Weather Station"),
        (7.0734, 125.6140, "General Santos Weather Station 2")
    ]
    
    api_key = os.getenv('GOOGLE_MAPS_API_KEY')
    
    with WeatherDatabaseManager(api_key) as weather_manager:
        result = weather_manager.collect_multiple_locations(philippine_cities)
        return result


def test_weather_database_integration():
    """Test the weather database integration"""
    print("🧪 Testing Weather Database Integration")
    print("=" * 50)
    
    try:
        api_key = os.getenv('GOOGLE_MAPS_API_KEY')
        
        with WeatherDatabaseManager(api_key) as weather_manager:
            # Test single location (Manila)
            print("📍 Testing single location (Manila)...")
            success = weather_manager.collect_and_save_weather(
                14.5995, 120.9842, "Manila Test Station"
            )
            
            if success:
                print("✅ Single location test passed!")
            else:
                print("❌ Single location test failed!")
            
            # Test multiple locations
            print("\n📍 Testing multiple locations...")
            test_locations = [
                (14.5995, 120.9842, "Manila Test"),
                (10.3157, 123.8854, "Cebu Test"),
                (7.1907, 125.4553, "Davao Test")
            ]
            
            result = weather_manager.collect_multiple_locations(test_locations)
            
            if result['success_rate'] > 0:
                print("✅ Multiple locations test passed!")
            else:
                print("❌ Multiple locations test failed!")
            
            return result
            
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        print(f"📋 Traceback: {traceback.format_exc()}")
        return None


if __name__ == "__main__":
    # Run test
    test_result = test_weather_database_integration()
    
    if test_result and test_result['success_rate'] > 0:
        print("\n🎉 Weather database integration is working!")
        
        # Ask user if they want to collect data for all Philippine cities
        try:
            response = input("\nDo you want to collect weather data for all major Philippine cities? (y/n): ")
            if response.lower() in ['y', 'yes']:
                print("\n🇵🇭 Collecting weather data for major Philippine cities...")
                result = collect_philippine_cities_weather()
                print(f"\n🎯 Final Result: {result['successful']}/{result['total_locations']} cities processed successfully!")
        except KeyboardInterrupt:
            print("\n👋 Interrupted by user")
    else:
        print("\n❌ Weather database integration test failed!") 