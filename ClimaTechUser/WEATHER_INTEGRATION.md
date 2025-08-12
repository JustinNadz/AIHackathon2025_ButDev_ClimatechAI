# ClimaTech Weather Integration Guide

## 🌤️ **System Overview**

Your ClimaTech application now has a complete weather integration system that connects the frontend to your backend, displaying real weather data for Philippine cities with authentic Filipino weather conditions and proper weather icons.

## 📋 **What's Implemented**

### **1. Backend Weather System**

#### **Weather Data Collection**
- **Real Google Weather API**: Fetches actual weather data using your `GOOGLE_MAPS_API_KEY`
- **Filipino Weather Conditions**: Maps generic weather descriptions to authentic Filipino conditions
- **Database Storage**: Saves weather data to PostgreSQL with proper geospatial coordinates
- **Enhanced Mock Data**: Falls back to realistic Filipino weather data when API is unavailable

#### **Weather Database Schema**
```sql
-- weather_data table includes:
- id (Primary Key)
- geometry (PostGIS POINT for coordinates)
- temperature, humidity, rainfall, wind_speed, wind_direction, pressure
- station_name, recorded_at, source
- weather_metadata (JSON with Filipino conditions)
- created_at
```

#### **API Endpoints**
- **`GET /api/weather-data/frontend-cities`**: Returns weather for all 9 frontend cities
- **`GET /api/google-weather?lat={lat}&lng={lng}`**: Individual weather lookup (frontend route)

### **2. Frontend Weather Integration**

#### **Weather Section (`weather-section.tsx`)**
- **Real Data Display**: Shows weather for all Philippine cities from backend
- **Live Updates**: Refreshes data every 5 minutes
- **Filipino Conditions**: Displays authentic weather descriptions
- **Status Indicators**: Shows data source (Live vs Generated)
- **Weather Icons**: Uses your collection of PNG weather icons

#### **Map Component (`map-component.tsx`)**
- **City Weather Markers**: Each city shows real weather data
- **Enhanced Info Windows**: Displays temperature, humidity, wind, rainfall, pressure
- **Weather Icons**: Proper weather icons on map markers
- **Fallback System**: Graceful handling when backend is unavailable

#### **Weather API Route (`app/api/google-weather/route.ts`)**
- **Backend Connection**: Fetches data from `/api/weather-data/frontend-cities`
- **Icon Mapping**: Maps Filipino conditions to your PNG weather icons
- **Fallback System**: Uses generated data when backend is unavailable

## 🏙️ **Supported Philippine Cities**

Your system now supports weather data for these 9 cities:

1. **Manila** (14.5995, 120.9842)
2. **Quezon City** (14.6760, 121.0437)
3. **Cebu City** (10.3157, 123.8854)
4. **Davao City** (7.1907, 125.4553)
5. **Iloilo City** (10.7202, 122.5621)
6. **Baguio** (16.4023, 120.5960)
7. **Zamboanga City** (6.9214, 122.0790)
8. **Cagayan de Oro** (8.4542, 124.6319)
9. **General Santos** (6.1164, 125.1716)

## 🌦️ **Filipino Weather Conditions**

Your system displays authentic Filipino weather conditions:

- **Clear Skies** → `/Clear Skies.png`
- **Cloudy Skies with Rainshowers** → `/Cloudy Skies with Rain showers.png`
- **Monsoon Rains** → `/Monsoon Rains.png`
- **Partly Cloudy Skies** → `/Partly Cloudy Skies.png`
- **Partly Cloudy Skies With Isolated Rainshowers** → `/Partly Cloud Skies with isolated rainshowers.png`
- **Stormy** → `/Stormy.png`
- **Cloudy Skies** → `/Cloudy Skies.png`
- **Partly Cloudy Skies to at times cloudy with Rainshowers and Thunderstorms** → `/Partly Cloudy Skies to at times cloudy with Rainshowers and Thunderstorms.png`
- **Light Rains** → `/Light Rains.png`
- **Cloudy Skies with Rainshowers and Thunderstorms** → `/Cloudy Skies with Rainshowers and Thunderstorms.png`
- **Occasional Rains** → `/Occasional Rain.png`
- **Rains with Gusty Winds** → `/Rains with Gusty Winds.png`

## 🚀 **How to Use**

### **Start the Backend**
```bash
cd backend
conda activate ai
python app.py
```

### **Start the Frontend**
```bash
cd ClimaTechUser
npm run dev
```

### **Collect Weather Data**
```bash
cd backend
python collect_frontend_cities_weather.py
```

## 📡 **Data Flow**

```
Google Weather API
       ↓
Backend Weather Collection
       ↓
PostgreSQL Database (with Filipino conditions)
       ↓
Backend API (/api/weather-data/frontend-cities)
       ↓
Frontend API Route (/api/google-weather)
       ↓
Weather Section & Map Component
       ↓
Weather Icons Display
```

## 🔧 **Configuration**

### **Backend Environment (`.env`)**
```env
DATABASE_URL=postgresql://postgres:admin123@localhost:5432/climatech
GOOGLE_MAPS_API_KEY=AIzaSyCRNZQqOWD_OVZ0Ie2BjMB0a3dngiIbQUk
```

### **Frontend Environment (`.env`)**
```env
NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:5000
GOOGLE_MAPS_API_KEY=AIzaSyCRNZQqOWD_OVZ0Ie2BjMB0a3dngiIbQUk
```

## 🛠️ **Technical Features**

### **Weather Data Collection**
- **API Key Rotation**: Supports multiple Google Maps API keys
- **Error Handling**: Graceful fallback to mock data
- **Rate Limiting**: Respects API limits with delays
- **Geospatial Storage**: PostGIS for accurate coordinates

### **Frontend Integration**
- **Type Safety**: Full TypeScript support for weather data
- **Caching**: API responses cached for performance
- **Loading States**: Proper loading indicators
- **Error Boundaries**: Graceful error handling

### **Weather Icons**
- **PNG Icons**: High-quality weather condition icons
- **Dynamic Mapping**: Automatic icon selection based on conditions
- **Fallback Icons**: Lucide icons as backups
- **Performance**: Optimized loading and caching

## 🔍 **Monitoring & Debugging**

### **Backend Logs**
- Weather collection success/failure rates
- API response times and errors
- Database insertion confirmations

### **Frontend Console**
- Weather fetch success/failure
- Icon loading status
- API response details

### **Database Verification**
```sql
-- Check weather data
SELECT 
    station_name,
    temperature,
    humidity,
    weather_metadata->>'description' as filipino_condition,
    ST_X(geometry) as longitude,
    ST_Y(geometry) as latitude,
    created_at
FROM weather_data 
WHERE station_name LIKE '%Weather Station'
ORDER BY created_at DESC;
```

## 🎯 **Success Indicators**

✅ **Weather Section**: Shows real temperature data and Filipino conditions  
✅ **Map Markers**: Display weather icons and detailed info windows  
✅ **Data Source**: "Live Data" indicators when using backend  
✅ **Refresh Functionality**: Manual refresh button works  
✅ **Fallback System**: Still works when backend is down  
✅ **Weather Icons**: PNG icons display correctly  
✅ **Performance**: Fast loading and smooth updates  

## 🐛 **Troubleshooting**

### **No Weather Data**
1. Check backend server is running: `python app.py`
2. Verify database connection: Check DATABASE_URL
3. Run weather collection: `python collect_frontend_cities_weather.py`

### **Missing Weather Icons**
1. Verify PNG files are in `/public/` folder
2. Check filename mapping in `getWeatherIconPath()` function
3. Check browser console for loading errors

### **API Connection Issues**
1. Verify NEXT_PUBLIC_BACKEND_URL matches backend port
2. Check CORS configuration in backend
3. Verify both frontend and backend are running

---

**🎉 Your ClimaTech weather integration is now complete and fully functional!** 