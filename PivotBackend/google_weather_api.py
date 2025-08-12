#!/usr/bin/env python3
"""
Google Weather API integration for PivotBackend
Fetches weather data at specific points and stores in database
"""

import requests
import json
import os
import random
import time
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from database import SessionLocal
from models import WeatherData

# Load environment variables
load_dotenv()

# Filipino Weather Conditions for realistic Philippine weather
FILIPINO_WEATHER_CONDITIONS = [
    "Clear Skies",
    "Cloudy Skies with Rainshowers", 
    "Monsoon Rains",
    "Partly Cloudy Skies",
    "Partly Cloudy Skies With Isolated Rainshowers",
    "Stormy",
    "Cloudy Skies",
    "Partly Cloudy Skies to at times cloudy with Rainshowers and Thunderstorms",
    "Light Rains",
    "Cloudy Skies with Rainshowers and Thunderstorms",
    "Occasional Rains",
    "Rains with Gusty Winds"
]

# Temperature ranges for each condition (min, max in °C)
TEMPERATURE_RANGES = {
    "Clear Skies": (28, 35),
    "Cloudy Skies with Rainshowers": (23, 29),
    "Monsoon Rains": (22, 27),
    "Partly Cloudy Skies": (26, 33),
    "Partly Cloudy Skies With Isolated Rainshowers": (25, 31),
    "Stormy": (21, 26),
    "Cloudy Skies": (24, 30),
    "Partly Cloudy Skies to at times cloudy with Rainshowers and Thunderstorms": (24, 30),
    "Light Rains": (23, 29),
    "Cloudy Skies with Rainshowers and Thunderstorms": (23, 29),
    "Occasional Rains": (24, 30),
    "Rains with Gusty Winds": (22, 28)
}

# Weather condition mapping from generic descriptions to Filipino conditions
WEATHER_MAPPING = {
    # Clear conditions
    "clear": "Clear Skies",
    "sunny": "Clear Skies",
    "fair": "Clear Skies",
    
    # Cloudy conditions
    "cloudy": "Cloudy Skies",
    "overcast": "Cloudy Skies",
    "partly cloudy": "Partly Cloudy Skies",
    "mostly cloudy": "Cloudy Skies",
    
    # Rain conditions
    "rain": "Cloudy Skies with Rainshowers",
    "light rain": "Light Rains",
    "heavy rain": "Monsoon Rains",
    "drizzle": "Light Rains",
    "showers": "Cloudy Skies with Rainshowers",
    "scattered showers": "Partly Cloudy Skies With Isolated Rainshowers",
    
    # Storm conditions
    "thunderstorm": "Cloudy Skies with Rainshowers and Thunderstorms",
    "storm": "Stormy",
    "severe": "Stormy",
    
    # Wind and rain
    "windy": "Rains with Gusty Winds",
    "gusty": "Rains with Gusty Winds",
    
    # Monsoon
    "monsoon": "Monsoon Rains",
    "tropical": "Monsoon Rains"
}


def map_to_filipino_condition(description: str) -> str:
    """Map a generic weather description to Filipino weather condition"""
    if not description:
        return random.choice(FILIPINO_WEATHER_CONDITIONS)
    
    description_lower = description.lower()
    
    # Check for exact matches first
    for key, filipino_condition in WEATHER_MAPPING.items():
        if key in description_lower:
            return filipino_condition
    
    # Default fallback based on common patterns
    if any(word in description_lower for word in ["rain", "shower", "drizzle"]):
        if any(word in description_lower for word in ["thunder", "storm"]):
            return "Cloudy Skies with Rainshowers and Thunderstorms"
        elif "light" in description_lower:
            return "Light Rains"
        elif any(word in description_lower for word in ["heavy", "monsoon"]):
            return "Monsoon Rains"
        else:
            return "Cloudy Skies with Rainshowers"
    
    elif any(word in description_lower for word in ["storm", "severe"]):
        return "Stormy"
    
    elif any(word in description_lower for word in ["clear", "sunny", "fair"]):
        return "Clear Skies"
    
    elif any(word in description_lower for word in ["cloud", "overcast"]):
        if "partly" in description_lower:
            return "Partly Cloudy Skies"
        else:
            return "Cloudy Skies"
    
    # Random fallback
    return random.choice(FILIPINO_WEATHER_CONDITIONS)


def get_temperature_for_condition(condition: str, fallback_temp: Optional[float] = None) -> float:
    """Get a realistic temperature for the given Filipino weather condition"""
    if condition in TEMPERATURE_RANGES:
        min_temp, max_temp = TEMPERATURE_RANGES[condition]
        if fallback_temp and min_temp <= fallback_temp <= max_temp:
            return fallback_temp
        return random.uniform(min_temp, max_temp)
    
    # Fallback temperature
    return fallback_temp if fallback_temp else random.uniform(24, 32)


def adjust_rainfall_for_condition(condition: str) -> float:
    """Adjust rainfall amount based on Filipino weather condition"""
    rainfall_multipliers = {
        "Clear Skies": 0.0,
        "Partly Cloudy Skies": 0.0,
        "Cloudy Skies": 0.1,
        "Light Rains": 0.5,
        "Cloudy Skies with Rainshowers": 2.0,
        "Partly Cloudy Skies With Isolated Rainshowers": 1.0,
        "Occasional Rains": 1.5,
        "Monsoon Rains": 5.0,
        "Cloudy Skies with Rainshowers and Thunderstorms": 3.0,
        "Rains with Gusty Winds": 3.5,
        "Stormy": 4.0,
        "Partly Cloudy Skies to at times cloudy with Rainshowers and Thunderstorms": 2.5
    }
    
    multiplier = rainfall_multipliers.get(condition, 1.0)
    
    if condition in ["Clear Skies", "Partly Cloudy Skies"]:
        return 0.0
    
    # Generate realistic rainfall for the condition
    if multiplier == 0.0:
        return 0.0
    elif multiplier <= 0.5:
        return random.uniform(0.1, 1.0)
    elif multiplier <= 2.0:
        return random.uniform(1.0, 8.0)
    else:
        return random.uniform(5.0, 20.0)


class GoogleWeatherAPI:
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Google Weather API client
        
        Args:
            api_key: Google Maps API key (required for weather.googleapis.com)
        """
        self.api_key = api_key or os.getenv('GOOGLE_MAPS_API_KEY')
        if not self.api_key:
            print("⚠️ Warning: No Google Maps API key found. Using mock data.")
        
        self.base_url = "https://weather.googleapis.com/v1"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'PivotBackend/1.0',
            'Accept': 'application/json'
        })
    
    def get_weather_data(self, lat: float, lng: float) -> Dict:
        """
        Get weather data for a specific location using Google's Weather API
        
        Args:
            lat: Latitude
            lng: Longitude
            
        Returns:
            Dictionary containing weather data with Filipino conditions
        """
        try:
            if self.api_key and self.api_key != "mock_key":
                # Try Google Weather API first
                try:
                    return self._fetch_from_google_api(lat, lng)
                except Exception as e:
                    print(f"⚠️ Google API failed: {e}")
                    print("🔄 Falling back to mock data...")
            
            # Fallback to raw mock data
            return self._get_raw_mock_weather_data(lat, lng)
                
        except Exception as e:
            print(f"❌ Error fetching weather data: {e}")
            return self._get_raw_mock_weather_data(lat, lng)
    
    def _fetch_from_google_api(self, lat: float, lng: float) -> Dict:
        """Fetch data from actual Google Weather API"""
        url = f"{self.base_url}/currentConditions:lookup"
        
        params = {
            'location.latitude': lat,
            'location.longitude': lng,
            'key': self.api_key,
        }
        
        print(f"🌤️ Fetching weather data from Google Weather API...")
        print(f"   URL: {url}")
        print(f"   Location: ({lat:.4f}, {lng:.4f})")
        
        response = self.session.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            weather_data = response.json()
            print(f"✅ Successfully fetched weather data from Google")
            return self._parse_google_weather_response(weather_data, lat, lng)
        else:
            print(f"❌ Google Weather API error: {response.status_code}")
            print(f"   Response: {response.text}")
            raise Exception(f"API error: {response.status_code}")
    
    def _parse_google_weather_response(self, google_data: Dict, lat: float, lng: float) -> Dict:
        """
        Parse Google Weather API response into our standard format with raw data
        """
        try:
            # Extract raw weather info
            weather_condition = google_data.get('weatherCondition', {})
            raw_description = weather_condition.get('description', {}).get('text', 'Unknown')
            
            # Extract raw temperature data
            temperature_data = google_data.get('temperature', {})
            temperature = temperature_data.get('degrees')
            
            # Extract raw humidity data
            humidity = google_data.get('relativeHumidity')
            
            # Extract raw wind data
            wind_data = google_data.get('wind', {})
            wind_speed_data = wind_data.get('speed', {})
            wind_direction_data = wind_data.get('direction', {})
            wind_speed = wind_speed_data.get('value')
            wind_direction = wind_direction_data.get('degrees')
            
            # Extract raw pressure data
            air_pressure = google_data.get('airPressure', {})
            pressure = air_pressure.get('meanSeaLevelMillibars')
            
            # Extract raw precipitation data
            precipitation = google_data.get('precipitation', {})
            qpf = precipitation.get('qpf', {})
            rainfall = qpf.get('quantity', 0.0)
            
            current_time = google_data.get('currentTime')
            if current_time:
                recorded_at = datetime.fromisoformat(current_time.replace('Z', '+00:00'))
            else:
                recorded_at = datetime.now()
            
            return {
                "location": {
                    "lat": lat,
                    "lng": lng,
                    "name": f"Weather Station at ({lat:.4f}, {lng:.4f})"
                },
                "current": {
                    "temperature": temperature,
                    "humidity": humidity,
                    "rainfall": rainfall,
                    "wind_speed": wind_speed,
                    "wind_direction": wind_direction,
                    "pressure": pressure,
                    "description": raw_description,
                    "timestamp": recorded_at.isoformat()
                },
                "source": "google_weather_api",
                "station_name": f"Station_{int(lat*1000)}_{int(lng*1000)}"
            }
            
        except Exception as e:
            print(f"❌ Error parsing Google weather response: {e}")
            return self._get_raw_mock_weather_data(lat, lng)
    
    def _get_raw_mock_weather_data(self, lat: float, lng: float) -> Dict:
        """
        Generate raw mock weather data with realistic values
        """
        current_time = datetime.now()
        
        # Generate realistic raw weather data
        temperature = random.uniform(20, 35)  # Celsius
        humidity = random.uniform(40, 95)     # Percentage
        wind_speed = random.uniform(0, 50)    # km/h
        wind_direction = random.uniform(0, 360)  # Degrees
        pressure = random.uniform(990, 1030)  # Millibars
        rainfall = random.uniform(0, 30)      # mm/h
        
        # Simple weather description
        if rainfall > 10:
            description = "Heavy rain"
        elif rainfall > 5:
            description = "Rain"
        elif rainfall > 0:
            description = "Light rain"
        elif temperature > 30:
            description = "Sunny"
        elif temperature > 25:
            description = "Partly cloudy"
        else:
            description = "Cloudy"
        
        return {
            "location": {
                "lat": lat,
                "lng": lng,
                "name": f"Weather Station at ({lat:.4f}, {lng:.4f})"
            },
            "current": {
                "temperature": temperature,
                "humidity": humidity,
                "rainfall": rainfall,
                "wind_speed": wind_speed,
                "wind_direction": wind_direction,
                "pressure": pressure,
                "description": description,
                "timestamp": current_time.isoformat()
            },
            "source": "raw_mock_api",
            "station_name": f"Station_{int(lat*1000)}_{int(lng*1000)}"
        }
    
    def get_weather_for_multiple_locations(self, locations: List[Tuple[float, float]]) -> List[Dict]:
        """
        Get weather data for multiple locations
        
        Args:
            locations: List of (lat, lng) tuples
            
        Returns:
            List of weather data dictionaries
        """
        weather_data_list = []
        
        for i, (lat, lng) in enumerate(locations):
            print(f"🌤️ Fetching weather data for location {i+1}/{len(locations)}: ({lat:.4f}, {lng:.4f})")
            
            weather_data = self.get_weather_data(lat, lng)
            if weather_data:
                weather_data_list.append(weather_data)
            
            # Add delay to avoid rate limiting
            time.sleep(0.5)
        
        return weather_data_list


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
            
            # Extract raw weather measurements
            temperature = current.get('temperature')
            humidity = current.get('humidity')
            precipitation = current.get('rainfall', 0.0)
            wind_speed = current.get('wind_speed')
            wind_direction = current.get('wind_direction')
            pressure = current.get('pressure')
            weather_condition = current.get('description', 'Unknown')
            
            # Parse timestamp
            timestamp_str = current.get('timestamp')
            if timestamp_str:
                try:
                    recorded_at = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                except ValueError:
                    recorded_at = datetime.now()
            else:
                recorded_at = datetime.now()
            
            # Create WeatherData object
            weather_record = WeatherData(
                location=geometry_wkt,
                temperature=temperature,
                humidity=humidity,
                pressure=pressure,
                wind_speed=wind_speed,
                wind_direction=wind_direction,
                precipitation=precipitation,
                weather_condition=weather_condition,
                timestamp=recorded_at
            )
            
            # Add to database
            self.db.add(weather_record)
            self.db.commit()
            self.db.refresh(weather_record)
            
            print(f"✅ Raw weather data saved to database:")
            print(f"   📍 Location: {lat:.4f}, {lng:.4f}")
            print(f"   🌡️ Temperature: {temperature}°C")
            print(f"   🌤️ Condition: {weather_condition}")
            print(f"   💧 Humidity: {humidity}%")
            print(f"   🌧️ Precipitation: {precipitation}mm/h")
            print(f"   💨 Wind: {wind_speed}km/h")
            print(f"   🗄️ Database ID: {weather_record.id}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error saving weather data to database: {e}")
            if self.db:
                self.db.rollback()
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
    
    def collect_weather_for_multiple_locations(self, locations: List[Tuple[float, float]]) -> int:
        """
        Collect and save weather data for multiple locations
        
        Args:
            locations: List of (lat, lng) tuples
            
        Returns:
            Number of successfully saved records
        """
        success_count = 0
        
        for i, (lat, lng) in enumerate(locations):
            print(f"\n🌤️ Processing location {i+1}/{len(locations)}: ({lat:.4f}, {lng:.4f})")
            
            if self.collect_and_save_weather(lat, lng):
                success_count += 1
            
            # Add delay to avoid rate limiting
            time.sleep(1)
        
        print(f"\n✅ Successfully collected weather data for {success_count}/{len(locations)} locations")
        return success_count


def main():
    """Test the weather API and database integration"""
    try:
        api_key = os.getenv('GOOGLE_MAPS_API_KEY')
        if not api_key:
            print("⚠️ GOOGLE_MAPS_API_KEY not set, using enhanced mock data")
        
        # Test single location collection and storage
        print("🌤️ Testing weather collection and storage for Manila...")
        
        with WeatherDatabaseManager(api_key) as weather_manager:
            # Test single location (Manila)
            success = weather_manager.collect_and_save_weather(14.5995, 120.9842, "Manila_Station")
            
            if success:
                print("✅ Successfully collected and stored Manila weather data")
            else:
                print("❌ Failed to collect Manila weather data")
            
            # Test multiple locations
            print("\n🌤️ Testing multiple Philippine cities...")
            test_locations = [
                (14.5995, 120.9842),  # Manila
                (10.3157, 123.8854),  # Cebu
                (7.1907, 125.4553),   # Davao
                (16.4023, 120.5960),  # Baguio
                (11.2404, 125.0056),  # Tacloban
            ]
            
            success_count = weather_manager.collect_weather_for_multiple_locations(test_locations)
            print(f"✅ Completed weather collection for {success_count} cities")
        
    except Exception as e:
        print(f"❌ Error testing weather API: {e}")


if __name__ == "__main__":
    main()
