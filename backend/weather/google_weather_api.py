#!/usr/bin/env python3
"""
Google Weather API integration for fetching real-time weather data
"""
import requests
import json
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import time
import os


class GoogleWeatherAPI:
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Google Weather API client
        
        Args:
            api_key: Google Maps API key (required for weather.googleapis.com)
        """
        self.api_key = api_key or os.getenv('GOOGLE_MAPS_API_KEY')
        if not self.api_key:
            raise ValueError("Google Maps API key is required. Set GOOGLE_MAPS_API_KEY environment variable or pass api_key parameter.")
        
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
            Dictionary containing weather data
        """
        try:
            # Google Weather API endpoint
            url = f"{self.base_url}/currentConditions:lookup"
            
            params = {
                'location.latitude':{lat},
                'location.longitude':{lng},
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
                # Fallback to mock data if API fails
                return self._get_mock_weather_data(lat, lng)
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Network error fetching weather data: {e}")
            # Fallback to mock data
            return self._get_mock_weather_data(lat, lng)
        except Exception as e:
            print(f"❌ Error fetching weather data: {e}")
            return None
    
    def _parse_google_weather_response(self, google_data: Dict, lat: float, lng: float) -> Dict:
        """
        Parse Google Weather API response into our standard format
        
        Args:
            google_data: Raw response from Google Weather API
            lat: Latitude
            lng: Longitude
            
        Returns:
            Standardized weather data dictionary
        """
        try:
            # Extract location data (Google API doesn't provide location name in response)
            location_name = f"Weather Station at ({lat:.4f}, {lng:.4f})"
            
            # Extract weather conditions
            weather_condition = google_data.get('weatherCondition', {})
            description = weather_condition.get('description', {}).get('text', 'Unknown')
            
            # Extract temperature data
            temperature_data = google_data.get('temperature', {})
            temperature = temperature_data.get('degrees')
            
            # Extract humidity
            humidity = google_data.get('relativeHumidity')
            
            # Extract wind data
            wind_data = google_data.get('wind', {})
            wind_speed_data = wind_data.get('speed', {})
            wind_direction_data = wind_data.get('direction', {})
            wind_speed = wind_speed_data.get('value')
            wind_direction = wind_direction_data.get('degrees')
            
            # Extract pressure
            air_pressure = google_data.get('airPressure', {})
            pressure = air_pressure.get('meanSeaLevelMillibars')
            
            # Extract precipitation data
            precipitation = google_data.get('precipitation', {})
            qpf = precipitation.get('qpf', {})
            rainfall = qpf.get('quantity', 0.0)  # Current rainfall in millimeters
            
            # Get timestamp
            current_time = google_data.get('currentTime')
            if current_time:
                recorded_at = datetime.fromisoformat(current_time.replace('Z', '+00:00'))
            else:
                recorded_at = datetime.now()
            
            return {
                "location": {
                    "lat": lat,
                    "lng": lng,
                    "name": location_name
                },
                "current": {
                    "temperature": round(temperature, 1) if temperature else None,
                    "humidity": round(humidity, 1) if humidity else None,
                    "rainfall": round(rainfall, 1),
                    "wind_speed": round(wind_speed, 1) if wind_speed else None,
                    "wind_direction": round(wind_direction, 1) if wind_direction else None,
                    "pressure": round(pressure, 1) if pressure else None,
                    "description": description,
                    "timestamp": recorded_at.isoformat()
                },
                "source": "google_weather_api",
                "station_name": f"Google_Weather_{int(lat*1000)}_{int(lng*1000)}"
            }
            
        except Exception as e:
            print(f"❌ Error parsing Google weather response: {e}")
            return self._get_mock_weather_data(lat, lng)
    
    def _get_mock_weather_data(self, lat: float, lng: float) -> Dict:
        """
        Generate mock weather data for demonstration/fallback
        In production, replace this with actual API calls
        """
        import random
        
        # Generate realistic weather data based on location and time
        current_time = datetime.now()
        
        # Simple weather simulation based on coordinates and time
        base_temp = 25 + (lat - 12) * 2  # Temperature varies with latitude
        temp_variation = random.uniform(-5, 5)
        temperature = base_temp + temp_variation
        
        humidity = random.uniform(40, 90)
        rainfall = random.uniform(0, 10) if random.random() < 0.3 else 0  # 30% chance of rain
        wind_speed = random.uniform(0, 25)
        wind_direction = random.uniform(0, 360)
        pressure = random.uniform(1000, 1020)
        
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
                "description": self._get_weather_description(temperature, rainfall),
                "timestamp": current_time.isoformat()
            },
            "source": "mock_weather_api",
            "station_name": f"Station_{int(lat*1000)}_{int(lng*1000)}"
        }
    
    def _get_weather_description(self, temperature: float, rainfall: float) -> str:
        """Generate weather description based on conditions"""
        if rainfall > 5:
            return "Heavy Rain"
        elif rainfall > 0:
            return "Light Rain"
        elif temperature > 30:
            return "Hot"
        elif temperature > 20:
            return "Warm"
        elif temperature > 10:
            return "Cool"
        else:
            return "Cold"
    
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
    """Test the weather API"""
    try:
        # Initialize API (you'll need to set GOOGLE_MAPS_API_KEY environment variable)
        api_key = os.getenv('GOOGLE_MAPS_API_KEY')
        if not api_key:
            print("⚠️ GOOGLE_MAPS_API_KEY not set, using mock data")
            api_key = "mock_key"
        
        weather_api = GoogleWeatherAPI(api_key)
        
        # Test single location (Manila)
        print("🌤️ Testing weather API for Manila...")
        manila_weather = weather_api.get_weather_data(14.5995, 120.9842)
        if manila_weather:
            print(f"✅ Manila weather: {manila_weather['current']['temperature']}°C, {manila_weather['current']['description']}")
        
        # Test multiple locations
        print("\n🌤️ Testing multiple locations...")
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
