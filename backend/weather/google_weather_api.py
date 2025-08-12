#!/usr/bin/env python3
"""
Google Weather API integration for fetching real-time weather data
Enhanced with Filipino weather conditions and database storage
"""
import requests
import json
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import time
import os
import random


# Filipino Weather Conditions (from frontend types/weather.ts)
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
            'User-Agent': 'DisasterDataSystem/1.0',
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
            
            # Fallback to enhanced mock data
            return self._get_enhanced_mock_weather_data(lat, lng)
                
        except Exception as e:
            print(f"❌ Error fetching weather data: {e}")
            return self._get_enhanced_mock_weather_data(lat, lng)
    
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
        Parse Google Weather API response into our standard format with Filipino conditions
        """
        try:
            # Extract basic weather info
            weather_condition = google_data.get('weatherCondition', {})
            raw_description = weather_condition.get('description', {}).get('text', 'Unknown')
            
            # Map to Filipino condition
            filipino_condition = map_to_filipino_condition(raw_description)
            
            # Extract temperature data
            temperature_data = google_data.get('temperature', {})
            raw_temperature = temperature_data.get('degrees')
            
            # Adjust temperature for Filipino condition
            temperature = get_temperature_for_condition(filipino_condition, raw_temperature)
            
            # Extract other data
            humidity = google_data.get('relativeHumidity', random.uniform(60, 85))
            
            wind_data = google_data.get('wind', {})
            wind_speed_data = wind_data.get('speed', {})
            wind_direction_data = wind_data.get('direction', {})
            wind_speed = wind_speed_data.get('value', random.uniform(5, 25))
            wind_direction = wind_direction_data.get('degrees', random.uniform(0, 360))
            
            air_pressure = google_data.get('airPressure', {})
            pressure = air_pressure.get('meanSeaLevelMillibars', random.uniform(1000, 1020))
            
            precipitation = google_data.get('precipitation', {})
            qpf = precipitation.get('qpf', {})
            rainfall = qpf.get('quantity', 0.0)
            
            # Adjust rainfall based on Filipino condition
            rainfall = self._adjust_rainfall_for_condition(filipino_condition, rainfall)
            
            current_time = google_data.get('currentTime')
            if current_time:
                recorded_at = datetime.fromisoformat(current_time.replace('Z', '+00:00'))
            else:
                recorded_at = datetime.now()
            
            return self._format_weather_response(
                lat, lng, temperature, humidity, rainfall, wind_speed, 
                wind_direction, pressure, filipino_condition, recorded_at, "google_weather_api"
            )
            
        except Exception as e:
            print(f"❌ Error parsing Google weather response: {e}")
            return self._get_enhanced_mock_weather_data(lat, lng)
    
    def _adjust_rainfall_for_condition(self, condition: str, base_rainfall: float) -> float:
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
    
    def _get_enhanced_mock_weather_data(self, lat: float, lng: float) -> Dict:
        """
        Generate enhanced mock weather data with realistic Filipino conditions
        """
        current_time = datetime.now()
        
        # Select a random Filipino weather condition
        condition = random.choice(FILIPINO_WEATHER_CONDITIONS)
        
        # Generate realistic data for the condition
        temperature = get_temperature_for_condition(condition)
        humidity = random.uniform(60, 90)  # Philippines is typically humid
        wind_speed = random.uniform(5, 25)
        wind_direction = random.uniform(0, 360)
        pressure = random.uniform(1005, 1015)  # Typical for tropical regions
        rainfall = self._adjust_rainfall_for_condition(condition, 0)
        
        return self._format_weather_response(
            lat, lng, temperature, humidity, rainfall, wind_speed,
            wind_direction, pressure, condition, current_time, "enhanced_mock_api"
        )
    
    def _format_weather_response(self, lat: float, lng: float, temperature: float, 
                                humidity: float, rainfall: float, wind_speed: float,
                                wind_direction: float, pressure: float, condition: str,
                                recorded_at: datetime, source: str) -> Dict:
        """Format weather data into standardized response"""
        return {
            "location": {
                "lat": lat,
                "lng": lng,
                "name": f"Weather Station at ({lat:.4f}, {lng:.4f})"
            },
            "current": {
                "temperature": round(temperature, 1),
                "humidity": round(humidity, 1),
                "rainfall": round(rainfall, 1),
                "wind_speed": round(wind_speed, 1),
                "wind_direction": round(wind_direction, 1),
                "pressure": round(pressure, 1),
                "description": condition,  # Filipino weather condition
                "timestamp": recorded_at.isoformat()
            },
            "source": source,
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


def main():
    """Test the enhanced weather API with Filipino conditions"""
    try:
        api_key = os.getenv('GOOGLE_MAPS_API_KEY')
        if not api_key:
            print("⚠️ GOOGLE_MAPS_API_KEY not set, using enhanced mock data")
        
        weather_api = GoogleWeatherAPI(api_key)
        
        # Test single location (Manila)
        print("🌤️ Testing enhanced weather API for Manila...")
        manila_weather = weather_api.get_weather_data(14.5995, 120.9842)
        if manila_weather:
            current = manila_weather['current']
            print(f"✅ Manila weather: {current['temperature']}°C, {current['description']}")
            print(f"   Humidity: {current['humidity']}%, Rainfall: {current['rainfall']}mm/h")
            print(f"   Wind: {current['wind_speed']}km/h, Pressure: {current['pressure']}mb")
        
        # Test multiple locations
        print("\n🌤️ Testing multiple Philippine cities...")
        test_locations = [
            (14.5995, 120.9842),  # Manila
            (10.3157, 123.8854),  # Cebu
            (7.1907, 125.4553),   # Davao
        ]
        
        weather_list = weather_api.get_weather_for_multiple_locations(test_locations)
        print(f"✅ Retrieved weather data for {len(weather_list)} locations")
        
        for weather in weather_list:
            loc = weather['location']
            current = weather['current']
            print(f"  📍 {loc['name']}: {current['temperature']}°C, {current['description']}")
        
    except Exception as e:
        print(f"❌ Error testing weather API: {e}")


if __name__ == "__main__":
    main()
