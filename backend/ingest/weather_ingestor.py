import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from weather.google_weather_api import GoogleWeatherAPI
from db.base import SessionLocal
from db.queries import add_weather_data
from datetime import datetime
import time


class WeatherIngestor:
    def __init__(self, api_key: str = None):
        self.db = SessionLocal()
        self.weather_api = GoogleWeatherAPI(api_key)

    def __del__(self):
        if hasattr(self, 'db'):
            self.db.close()

    def ingest_weather_for_location(self, lat: float, lng: float, station_name: str = None):
        """
        Ingest weather data for a specific location
        
        Args:
            lat: Latitude
            lng: Longitude
            station_name: Optional station name
        """
        try:
            print(f"🌤️ Fetching weather data for location: ({lat:.4f}, {lng:.4f})")
            
            # Get weather data from API
            weather_data = self.weather_api.get_weather_data(lat, lng)
            
            if not weather_data:
                print(f"❌ Failed to get weather data for location ({lat}, {lng})")
                return False
            
            # Extract data
            current = weather_data['current']
            location = weather_data['location']
            
            # Create point geometry
            geometry_wkt = f"POINT({lng} {lat})"
            
            # Add to database
            add_weather_data(
                db=self.db,
                geometry_wkt=geometry_wkt,
                temperature=current['temperature'],
                humidity=current['humidity'],
                rainfall=current['rainfall'],
                wind_speed=current['wind_speed'],
                wind_direction=current['wind_direction'],
                pressure=current['pressure'],
                station_name=station_name or weather_data['station_name'],
                recorded_at=datetime.fromisoformat(current['timestamp']),
                source=weather_data['source']
            )
            
            print(f"✅ Successfully ingested weather data for {location['name']}")
            print(f"   Temperature: {current['temperature']}°C")
            print(f"   Humidity: {current['humidity']}%")
            print(f"   Rainfall: {current['rainfall']} mm/h")
            print(f"   Wind: {current['wind_speed']} km/h")
            
            return True
            
        except Exception as e:
            print(f"❌ Error ingesting weather data: {e}")
            return False

    def ingest_weather_for_multiple_locations(self, locations: list):
        """
        Ingest weather data for multiple locations
        
        Args:
            locations: List of tuples (lat, lng, station_name)
        """
        print(f"🌤️ Weather Data Ingestion for {len(locations)} locations")
        print("=" * 50)
        
        successful_ingestions = 0
        failed_ingestions = 0
        
        for i, location_data in enumerate(locations):
            if len(location_data) == 2:
                lat, lng = location_data
                station_name = None
            else:
                lat, lng, station_name = location_data
            
            print(f"\n📍 Processing location {i+1}/{len(locations)}: ({lat:.4f}, {lng:.4f})")
            
            if self.ingest_weather_for_location(lat, lng, station_name):
                successful_ingestions += 1
            else:
                failed_ingestions += 1
            
            # Add delay to avoid overwhelming the API
            time.sleep(1)
        
        print(f"\n📊 Ingestion Summary:")
        print(f"  ✅ Successful: {successful_ingestions}")
        print(f"  ❌ Failed: {failed_ingestions}")
        print(f"  📍 Total: {len(locations)}")

    def ingest_weather_for_major_cities(self):
        """Ingest weather data for major Philippine cities"""
        major_cities = [
            (14.5995, 120.9842, "Manila"),
            (10.3157, 123.8854, "Cebu City"),
            (7.1907, 125.4553, "Davao City"),
            (16.4023, 120.5960, "Baguio City"),
            (15.4700, 120.9600, "Tarlac City"),
            (14.8448, 120.8105, "Angeles City"),
            (15.1448, 120.5977, "San Fernando"),
            (14.4791, 121.0433, "Antipolo"),
            (14.6091, 121.0223, "Quezon City"),
            (14.5547, 121.0244, "Makati"),
            (14.4500, 120.9500, "Cavite City"),
            (14.1016, 122.9550, "Daet"),
            (13.9318, 121.6157, "Lucena"),
            (13.1587, 123.7304, "Legazpi"),
            (12.8797, 121.7740, "Puerto Princesa"),
            (11.2404, 125.0058, "Tacloban"),
            (10.7203, 122.5621, "Iloilo City"),
            (9.6498, 123.8505, "Tagbilaran"),
            (8.5379, 123.3754, "Ozamiz"),
            (7.0734, 125.6140, "General Santos"),
        ]
        
        print("🏙️ Major Cities Weather Ingestion")
        print("=" * 40)
        self.ingest_weather_for_multiple_locations(major_cities)