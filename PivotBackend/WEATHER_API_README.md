# 🌤️ PivotBackend Raw Google Weather API

A comprehensive raw weather data collection system for PivotBackend that fetches unprocessed weather data at specific geographic points and stores it in your PostgreSQL database with PostGIS support.

## ✨ Features

- **Real Google Weather API Integration**: Fetches actual raw weather data using Google's Weather API
- **Raw Weather Data**: Returns unprocessed weather measurements without any condition mapping
- **Database Storage**: Automatically saves raw weather data to PostgreSQL with PostGIS geometry
- **Raw Mock Data**: Falls back to realistic raw weather data when API is unavailable
- **Batch Processing**: Collect weather data for multiple locations efficiently
- **Context Manager**: Automatic database connection handling
- **Error Handling**: Graceful handling of API failures and database errors

## 🚀 Quick Start

### 1. Install Dependencies

Make sure you have the required packages installed:

```bash
pip install requests python-dotenv sqlalchemy psycopg2-binary geoalchemy2
```

### 2. Set Up Environment Variables

Create a `.env` file in your PivotBackend directory:

```bash
# Database configuration
DATABASE_URL=postgresql://username:password@localhost:5432/pivot_db

# Google Maps API key (optional - for real weather data)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### 3. Basic Usage

#### Single Location Raw Weather Collection

```python
from google_weather_api import WeatherDatabaseManager

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
        print("✅ Weather data collected and stored successfully")
    else:
        print("❌ Failed to collect weather data")
```

#### Multiple Locations Raw Weather Batch Processing

```python
from google_weather_api import WeatherDatabaseManager

# Define multiple locations
locations = [
    (14.5995, 120.9842),  # Manila
    (10.3157, 123.8854),  # Cebu
    (7.1907, 125.4553),   # Davao
    (16.4023, 120.5960),  # Baguio
]

# Batch process all locations
with WeatherDatabaseManager() as weather_manager:
    success_count = weather_manager.collect_weather_for_multiple_locations(locations)
    print(f"✅ Successfully processed {success_count} locations")
```

#### Raw API Data (No Database Storage)

```python
from google_weather_api import GoogleWeatherAPI

# Create API instance
weather_api = GoogleWeatherAPI()

# Get weather data for a location
weather_data = weather_api.get_weather_data(14.5995, 120.9842)

if weather_data:
    current = weather_data['current']
    print(f"Temperature: {current['temperature']}°C")
    print(f"Condition: {current['description']}")
    print(f"Humidity: {current['humidity']}%")
    print(f"Rainfall: {current['rainfall']}mm/h")
    print(f"Wind: {current['wind_speed']}km/h")
```

## 📊 Database Schema

The weather data is stored in the `weather_data` table with the following structure:

```sql
CREATE TABLE weather_data (
    id SERIAL PRIMARY KEY,
    location GEOMETRY(POINT, 4326) NOT NULL,
    temperature FLOAT,
    humidity FLOAT,
    pressure FLOAT,
    wind_speed FLOAT,
    wind_direction FLOAT,
    precipitation FLOAT,
    weather_condition VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Data Fields

- **location**: PostGIS POINT geometry (longitude, latitude)
- **temperature**: Temperature in Celsius
- **humidity**: Relative humidity percentage
- **pressure**: Atmospheric pressure in millibars
- **wind_speed**: Wind speed in km/h
- **wind_direction**: Wind direction in degrees
- **precipitation**: Rainfall in mm/h
- **weather_condition**: Raw weather condition description from API
- **timestamp**: When the data was recorded

## 🌤️ Raw Weather Data

The API returns unprocessed weather data directly from Google's Weather API:

- **Temperature**: Raw temperature in Celsius
- **Humidity**: Raw humidity percentage
- **Pressure**: Raw atmospheric pressure in millibars
- **Wind Speed**: Raw wind speed in km/h
- **Wind Direction**: Raw wind direction in degrees
- **Precipitation**: Raw rainfall in mm/h
- **Weather Condition**: Raw weather description from Google API

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | `postgresql://postgres:password@localhost:5432/pivot_db` |
| `GOOGLE_MAPS_API_KEY` | Google Maps API key for real raw weather data | No | Uses raw mock data |

### Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the "Weather API" service
4. Create credentials (API key)
5. Add the API key to your `.env` file

## 📝 API Reference

### WeatherDatabaseManager

Main class for managing weather data collection and database storage.

#### Methods

- `collect_and_save_weather(lat, lng, station_name=None)`: Collect and save weather for a single location
- `collect_weather_for_multiple_locations(locations)`: Batch process multiple locations
- `save_weather_data_to_db(weather_data)`: Save weather data to database

### GoogleWeatherAPI

Core API class for fetching weather data.

#### Methods

- `get_weather_data(lat, lng)`: Get weather data for a location
- `get_weather_for_multiple_locations(locations)`: Get weather for multiple locations

## 🧪 Testing

Run the example script to test the weather API:

```bash
cd PivotBackend
python example_weather_usage.py
```

This will run several examples:
1. Single location raw weather collection
2. Multiple locations raw weather collection
3. Raw API data usage (no database)
4. Raw weather batch processing

## 🔍 Example Output

```
🌤️ PivotBackend Raw Google Weather API Examples
============================================================
✅ Google Maps API key found - will use real raw weather data

============================================================

🌤️ Example 1: Single Location Raw Weather Collection
==================================================
🌤️ Collecting weather data for (14.5995, 120.9842)...
🌤️ Fetching weather data from Google Weather API...
   URL: https://weather.googleapis.com/v1/currentConditions:lookup
   Location: (14.5995, 120.9842)
✅ Successfully fetched weather data from Google
✅ Raw weather data saved to database:
   📍 Location: 14.5995, 120.9842
   🌡️ Temperature: 28.5°C
   🌤️ Condition: Partly cloudy
   💧 Humidity: 75.2%
   🌧️ Precipitation: 0.0mm/h
   💨 Wind: 12.3km/h
   🗄️ Database ID: 1
✅ Successfully collected and stored Manila raw weather data
```

## 🚨 Error Handling

The API includes comprehensive error handling:

- **API Failures**: Falls back to enhanced mock data
- **Database Errors**: Automatic rollback and error reporting
- **Invalid Coordinates**: Validation and error messages
- **Network Issues**: Timeout handling and retry logic

## 🔄 Rate Limiting

The API includes built-in rate limiting to avoid overwhelming external services:

- 0.5 second delay between API calls
- 1 second delay between database operations
- Automatic session management

## 📈 Performance Tips

1. **Use Batch Processing**: For multiple locations, use `collect_weather_for_multiple_locations()`
2. **Context Manager**: Always use the context manager for automatic connection handling
3. **API Key**: Set up a Google Maps API key for real data instead of mock data
4. **Database Indexing**: Ensure your database has proper indexes on the weather_data table

## 🤝 Contributing

To contribute to this weather API:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is part of the PivotBackend system and follows the same licensing terms.

## 🆘 Support

For issues or questions:

1. Check the error messages in the console output
2. Verify your database connection and API key
3. Review the example usage in `example_weather_usage.py`
4. Check the database schema matches the expected structure
