# 🌤️ Weather Database Setup Guide

This guide shows you how to set up weather data collection with Filipino weather conditions and save it to your PostgreSQL database.

## ✅ **What's Been Created:**

### 1. **Enhanced Google Weather API** (`weather/google_weather_api.py`)
- ✅ **Filipino Weather Conditions**: 12 weather types matching your TypeScript frontend
- ✅ **Smart Mapping**: Converts generic weather descriptions to Filipino conditions
- ✅ **Realistic Data**: Temperature ranges and rainfall based on weather conditions
- ✅ **Fallback System**: Uses enhanced mock data if Google API is unavailable

### 2. **Database Integration** (`weather/weather_database.py`)
- ✅ **PostgreSQL Storage**: Saves weather data to your `weather_data` table
- ✅ **Batch Processing**: Can collect data for multiple cities at once
- ✅ **Error Handling**: Graceful handling of API failures and database errors

### 3. **Updated Database Model** (`db/models.py`)
- ✅ **Weather Metadata Field**: Added JSON column to store Filipino weather conditions
- ✅ **PostGIS Integration**: Geographic point storage for weather stations

### 4. **Collection Scripts**
- ✅ **Interactive Script**: `collect_weather_data.py` for manual collection
- ✅ **Table Update**: `update_weather_table.py` to add metadata column

## 🚀 **Step-by-Step Setup:**

### **Step 1: Update Your Database Table**
```bash
cd backend
python update_weather_table.py
```

**Expected Output:**
```
🗄️ ClimaTech Weather Table Update
========================================
🏗️ Setting up database...
✅ Database setup completed successfully!
🗄️ Updating weather_data table...
📝 Adding weather_metadata column to weather_data table...
✅ Successfully added weather_metadata column to weather_data table

📋 Current weather_data table structure:
  - id: integer (NOT NULL)
  - geometry: USER-DEFINED (NOT NULL)
  - temperature: double precision (NULL)
  - humidity: double precision (NULL)
  - rainfall: double precision (NULL)
  - wind_speed: double precision (NULL)
  - wind_direction: double precision (NULL)
  - pressure: double precision (NULL)
  - station_name: character varying (NULL)
  - recorded_at: timestamp with time zone (NULL)
  - source: character varying (NULL)
  - weather_metadata: json (NULL)
  - created_at: timestamp with time zone (NULL)

✅ Weather table update completed successfully!
```

### **Step 2: Test Weather Data Collection**
```bash
python collect_weather_data.py
```

**Choose Option 1 for testing:**
```
🌤️ ClimaTech Weather Data Collection System
==================================================
📅 Started at: 2025-01-28 14:30:00
✅ Google Maps API Key found: AIzaSyC...
⚠️ Warning: GOOGLE_MAPS_API_KEY not found in environment
🔄 Will use enhanced mock data with Filipino weather conditions

Choose an option:
1. Test single location (Manila)
2. Collect data for 3 major cities
3. Collect data for all major Philippine cities (15 locations)
4. Custom location

Enter your choice (1-4): 1
```

**Expected Output:**
```
📍 Testing single location: Manila
🌤️ Collecting weather data for (14.5995, 120.9842)...
🌤️ Fetching weather data from Google Weather API...
✅ Weather data saved to database:
   📍 Location: 14.5995, 120.9842
   🌡️ Temperature: 31.2°C
   🌤️ Condition: Partly Cloudy Skies
   💧 Humidity: 78.5%
   🌧️ Rainfall: 0.0mm/h
   💨 Wind: 12.3km/h
   🗄️ Database ID: 1
✅ Manila weather data collected successfully!
```

### **Step 3: Verify Database Content**

#### **Option A: Using Python Script**
```python
# Create verify_weather_data.py
from db.base import SessionLocal, engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text("SELECT * FROM weather_data ORDER BY created_at DESC LIMIT 5"))
    for row in result:
        print(f"ID: {row[0]}, Station: {row[8]}, Temp: {row[2]}°C")
```

#### **Option B: Using PostgreSQL CLI**
```bash
# Connect to your database
psql -h localhost -U postgres -d climatech

# Check if table exists and has data
\dt weather_data

# View recent weather data
SELECT 
    id,
    station_name,
    temperature,
    humidity,
    rainfall,
    weather_metadata->>'description' as weather_condition,
    recorded_at,
    created_at
FROM weather_data 
ORDER BY created_at DESC 
LIMIT 10;

# Check Filipino weather conditions
SELECT 
    weather_metadata->>'description' as weather_condition,
    COUNT(*) as count
FROM weather_data 
WHERE weather_metadata->>'description' IS NOT NULL
GROUP BY weather_metadata->>'description'
ORDER BY count DESC;

# Geographic query
SELECT 
    station_name,
    ST_AsText(geometry) as location,
    temperature,
    weather_metadata->>'description' as condition
FROM weather_data 
WHERE ST_DWithin(
    geometry::geography, 
    ST_SetSRID(ST_Point(120.9842, 14.5995), 4326)::geography, 
    100000  -- 100km radius from Manila
);
```

### **Step 4: Collect Data for Multiple Cities**
```bash
python collect_weather_data.py
# Choose option 2 or 3 for multiple cities
```

## 🔍 **Database Verification Steps:**

### **1. Check Table Structure**
```sql
\d weather_data
```
**Expected columns:**
- `id` (primary key)
- `geometry` (PostGIS POINT)
- `temperature`, `humidity`, `rainfall`, `wind_speed`, `wind_direction`, `pressure`
- `station_name`, `recorded_at`, `source`
- `weather_metadata` (JSON) ← **New field for Filipino conditions**
- `created_at`

### **2. Verify Data Content**
```sql
SELECT COUNT(*) FROM weather_data;
```
Should show the number of weather records.

### **3. Check Filipino Weather Conditions**
```sql
SELECT 
    weather_metadata->>'description' as filipino_condition,
    temperature,
    humidity,
    rainfall
FROM weather_data 
WHERE weather_metadata->>'description' IS NOT NULL
LIMIT 5;
```

**Expected Filipino conditions:**
- "Clear Skies"
- "Cloudy Skies with Rainshowers"
- "Monsoon Rains"
- "Partly Cloudy Skies"
- "Light Rains"
- etc.

### **4. Geographic Verification**
```sql
SELECT 
    station_name,
    ST_X(geometry) as longitude,
    ST_Y(geometry) as latitude,
    weather_metadata->>'description' as condition
FROM weather_data
ORDER BY created_at DESC
LIMIT 5;
```

### **5. Check Metadata Structure**
```sql
SELECT 
    weather_metadata,
    jsonb_pretty(weather_metadata::jsonb) as formatted_metadata
FROM weather_data 
WHERE weather_metadata IS NOT NULL
LIMIT 1;
```

**Expected metadata structure:**
```json
{
  "description": "Partly Cloudy Skies",
  "location_name": "Manila Weather Station",
  "data_source": "enhanced_mock_api",
  "collection_time": "2025-01-28T14:30:00"
}
```

## 🎯 **Success Indicators:**

✅ **Database Table Updated**: `weather_data` table has `weather_metadata` column  
✅ **Data Collection Works**: Can collect weather data without errors  
✅ **Filipino Conditions**: Weather conditions match TypeScript frontend types  
✅ **Geographic Data**: PostGIS POINT geometry is correctly stored  
✅ **Weather Metadata Storage**: JSON weather_metadata contains Filipino weather description  

## 🚨 **Troubleshooting:**

### **Table doesn't exist:**
```bash
python init_db.py  # Create all tables
```

### **Metadata column missing:**
```bash
python update_weather_table.py  # Add weather_metadata column
```

### **No weather data:**
```bash
python collect_weather_data.py  # Collect test data
```

### **Database connection error:**
```bash
# Check your .env file
cat .env | grep DATABASE_URL
# Should show: DATABASE_URL=postgresql://postgres:admin123@localhost:5432/climatech
```

## 📊 **Ready for Production:**

Once verified, your weather system can:
- ✅ Collect real weather data from Google Weather API
- ✅ Store Filipino weather conditions in PostgreSQL
- ✅ Provide weather data to your ClimaTechUser frontend
- ✅ Handle multiple weather stations across the Philippines
- ✅ Scale to collect data from hundreds of locations

---

**🎉 Your weather database system is now fully integrated with Filipino weather conditions and ready for use!** 