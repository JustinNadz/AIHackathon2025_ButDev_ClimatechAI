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
1. Ensure the Python backend is running: `cd backend && python app.py`
2. Check the backend URL in `.env.local`
3. Verify the backend endpoints are accessible: `curl http://localhost:5000/api/flood-data`

### No Data Displayed
1. Check if data exists in the database
2. Run data ingestion: `cd backend && python run_ingestions.py flood datasets/your_flood_data.shp`
3. Check browser console for error messages

### CORS Issues
If you see CORS errors, ensure the backend has CORS configured properly.

## Data Format

The backend returns GeoJSON FeatureCollection with:
- `geometry`: Polygon coordinates
- `properties.risk_level`: Numeric risk level (1.0-3.0)
- `properties.risk_category`: Text category (low/medium/high)
- `properties.data_type`: Type of hazard (flood/landslide)
