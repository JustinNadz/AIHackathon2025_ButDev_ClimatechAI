# Backend Setup for Frontend-Admin Map

## Overview
The Frontend-Admin interactive map now connects to the Python backend to fetch real flood and landslide risk data from the PostgreSQL/PostGIS database.

## Backend Requirements

1. **Python Backend Running**: Ensure the Flask backend is running on `http://localhost:5000`
2. **Database Populated**: The PostgreSQL database should have flood and landslide data ingested
3. **API Endpoints Available**:
   - `GET /api/flood-data` - Returns GeoJSON flood risk polygons
   - `GET /api/landslide-data` - Returns GeoJSON landslide risk polygons

## Environment Configuration

Create a `.env.local` file in the Frontend-Admin directory:

```bash
# Backend API Configuration
NEXT_PUBLIC_BACKEND_BASE_URL=http://localhost:5000

# Google Maps API Key (if not already set)
# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

## Features

### Data Loading
- **Automatic Loading**: Data loads automatically when the map is ready and layer changes
- **Manual Loading**: Use the "Load Data" button to manually fetch data
- **Layer-Specific**: Load data for specific layers (flood, landslide, weather) or all data

### Interactive Features
- **Clickable Polygons**: Click on flood/landslide zones to see risk details
- **Color-Coded Risk**: 
  - Red: High risk (2.5-3.0)
  - Orange: Medium risk (1.5-2.4)
  - Green: Low risk (1.0-1.4)
- **Info Windows**: Display risk level, category, and zone ID
- **Clear Map**: Remove all loaded data with the "Clear Map" button

### Loading States
- Buttons show "Loading..." when fetching data
- Buttons are disabled during data loading
- Console logs show progress and errors

## Troubleshooting

### Backend Connection Issues
1. **Install CORS dependency**: `cd backend && pip install flask-cors`
2. **Ensure the Python backend is running**: `cd backend && python app.py`
3. **Check the backend URL in `.env.local`**
4. **Test backend connectivity**: 
   ```bash
   cd backend && python test_api.py
   ```
5. **Verify the backend endpoints are accessible**: 
   ```bash
   curl http://localhost:5000/api/flood-data
   ```

### No Data Displayed
1. **Check if data exists in the database**:
   ```bash
   cd backend && python -c "
   from db.base import SessionLocal
   from db.models import FloodData, LandslideData
   db = SessionLocal()
   print(f'Flood records: {db.query(FloodData).count()}')
   print(f'Landslide records: {db.query(LandslideData).count()}')
   db.close()
   "
   ```
2. **Run data ingestion if needed**: 
   ```bash
   cd backend && python run_ingestions.py flood datasets/your_flood_data.shp
   cd backend && python run_ingestions.py landslide datasets/your_landslide_data.shp
   ```
3. **Check browser console for error messages** (F12 → Console)
4. **Use the "Test Backend" button** in the map interface

### CORS Issues
- The backend now includes CORS support with `flask-cors`
- If you still see CORS errors, restart the backend after installing flask-cors

### Debugging Steps
1. **Check backend logs** for any errors when making requests
2. **Use browser Network tab** (F12 → Network) to see the actual HTTP requests
3. **Test with curl** to verify the API works:
   ```bash
   curl -v http://localhost:5000/api/flood-data?limit=1
   ```
4. **Check environment variables** are set correctly
5. **Use the "Test Backend" button** in the map interface for detailed logging
6. **Check browser console** for coordinate parsing errors and validation messages

### Coordinate Parsing Issues
If you see "InvalidValueError: not a LatLng or LatLngLiteral" errors:
- The frontend now includes robust coordinate validation
- Invalid coordinates are logged and skipped
- Check the browser console for detailed coordinate parsing logs
- Ensure the backend returns valid GeoJSON with finite coordinate values

## Data Format

The backend returns GeoJSON FeatureCollection with:
- `geometry`: Polygon coordinates
- `properties.risk_level`: Numeric risk level (1.0-3.0)
- `properties.risk_category`: Text category (low/medium/high)
- `properties.data_type`: Type of hazard (flood/landslide)
