# ButDev AI Hackathon - Disaster Data Management System

A comprehensive geospatial disaster data management system using PostgreSQL with PostGIS for storing and analyzing flood, landslide, seismic, and weather data with geometry and risk levels.

## Features

- **PostgreSQL with PostGIS**: Store multiple disaster data types with geospatial geometry
- **Multi-Hazard Support**: Flood, landslide, seismic, and weather data
- **Risk Assessment**: 1-3 scale risk levels for flood and landslide data
- **Shapefile Support**: Ingest flood and landslide data from shapefiles (.shp)
- **CSV Support**: Ingest seismic data from CSV files
- **Weather API Integration**: Real-time weather data from Google Weather API
- **Geospatial Queries**: Spatial analysis and filtering capabilities
- **Flask API**: RESTful endpoints for data access and visualization
- **Google Maps Integration**: Frontend map visualization

## Prerequisites

1. **PostgreSQL** (version 12 or higher)
2. **PostGIS Extension** (version 3.0 or higher)
3. **Python 3.8+**
4. **Google Maps API Key** (for weather data and map visualization)

## Installation

### 1. Install PostgreSQL and PostGIS

#### On macOS (using Homebrew):
```bash
brew install postgresql postgis
brew services start postgresql
```

#### On Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib postgis
sudo systemctl start postgresql
```

#### On Windows:
Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

### 2. Create Database and Enable PostGIS

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE disaster_db;

# Connect to the new database
\c disaster_db

# Enable PostGIS extension
CREATE EXTENSION postgis;

# Exit psql
\q
```

### 3. Setup Python Environment

```bash
cd backend
pip install -r requirements.txt
```

### 4. Configure Environment

Create a `.env` file in the backend directory with your database credentials:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/climatech
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
CHROMA_DB_DIR=./chroma_store
```

### 5. Initialize Database

```bash
python init_db.py
```

This will:
- Create database if it doesn't exist
- Enable PostGIS extension
- Create all necessary tables (flood_data, landslide_data, earthquake_data, weather_data)
- Add sample data for testing

## How to Run the Program

### 1. Start the Flask Application

```bash
cd backend
python app.py
```

The application will start on `http://localhost:5000`

### 2. Access the Web Interface

Open your browser and navigate to:
- **Main Map**: `http://localhost:5000` - Interactive map with all disaster data
- **API Documentation**: See available endpoints below

### 3. Ingest Data

#### Flood Data (Shapefile)
```bash
python run_ingestions.py flood data/flood_zones.shp
```

#### Landslide Data (Shapefile)
```bash
python run_ingestions.py landslide data/landslide_zones.shp
```

#### Seismic Data (CSV)
```bash
python run_ingestions.py seismic data/earthquakes.csv
```

#### Weather Data (API)
```bash
# Ingest weather for major Philippine cities
python run_ingestions.py weather --mode cities

# Ingest weather for a specific location
python run_ingestions.py weather --mode single --lat 14.5995 --lng 120.9842 # preferred
```

### 4. Refresh Database (Optional)

To reset the database with fresh sample data:
```bash
python refresh_database.py
```

## API Endpoints

### Flood Data
- `GET /api/flood-data` - Get flood data with optional risk filtering
- `GET /api/flood-data/stats` - Get flood data statistics

### Landslide Data
- `GET /api/landslide-data` - Get landslide data with optional risk filtering
- `GET /api/landslide-data/stats` - Get landslide data statistics

### Seismic Data
- `GET /api/seismic-data` - Get seismic data with optional magnitude filtering
- `GET /api/seismic-data/stats` - Get seismic data statistics

### Weather Data
- `GET /api/weather-data` - Get weather data with optional time filtering
- `GET /api/weather-data/stats` - Get weather data statistics

### Assistant
- `POST /api/assistant` - Hazard snapshot and recommendations based on lat/lng
  - Body: `{ "lat": number, "lng": number, "hours_earthquake?": int, "eq_radius_km?": number, "weather_hours?": int, "weather_radius_km?": number }`
- `POST /api/assistant/chat` - RAG + Gemma-3 assistant; combines hazards and retrieved guidance
  - Body: `{ "lat": number, "lng": number, "question": string, ...optional same knobs... }`

### Example API Calls

```bash
# Get all flood data
curl http://localhost:5000/api/flood-data

# Get high-risk flood areas (risk >= 2.0)
curl "http://localhost:5000/api/flood-data?min_risk=2.0"

# Get recent seismic events (last 24 hours)
curl "http://localhost:5000/api/seismic-data?hours=24"

# Get weather data for last hour
curl "http://localhost:5000/api/weather-data?hours=1"

# Assistant (hazard snapshot)
curl -s -X POST http://localhost:5000/api/assistant \
  -H "Content-Type: application/json" \
  -d '{"lat":14.5995,"lng":120.9842}'

# Assistant chat (RAG + Gemma-3)
curl -s -X POST http://localhost:5000/api/assistant/chat \
  -H "Content-Type: application/json" \
  -d '{"lat":14.5995,"lng":120.9842,"question":"What should I do right now?"}'
```

## Data Schema

### FloodData Table
- `id`: Primary key
- `geometry`: PostGIS geometry (MULTIPOLYGON, SRID 4326)
- `risk_level`: Float (1-3 scale for flood risk)

### LandslideData Table
- `id`: Primary key
- `geometry`: PostGIS geometry (POLYGON, SRID 4326)
- `risk_level`: Float (1-3 scale for landslide risk)

### EarthquakeData Table
- `id`: Primary key
- `geometry`: PostGIS geometry (POINT, SRID 4326)
- `magnitude`: Float (earthquake magnitude)
- `depth`: Float (depth in kilometers)
- `event_time`: DateTime (earthquake occurrence time)
- `location_name`: String (location description)
- `source`: String (data source)
- `metadata`: JSON (additional data)

### WeatherData Table
- `id`: Primary key
- `geometry`: PostGIS geometry (POINT, SRID 4326)
- `temperature`: Float (temperature in Celsius)
- `humidity`: Float (relative humidity percentage)
- `rainfall`: Float (rainfall in mm/h)
- `wind_speed`: Float (wind speed in km/h)
- `wind_direction`: Float (wind direction in degrees)
- `pressure`: Float (atmospheric pressure in mb)
- `station_name`: String (weather station name)
- `recorded_at`: DateTime (weather recording time)
- `source`: String (data source)

## Data Ingestion Formats

### Flood/Landslide Shapefile Requirements
- **Geometry**: MULTIPOLYGON for flood, POLYGON for landslide
- **Risk Column**: "Var" for flood, "HAZ" for landslide (configurable)
- **Coordinate System**: WGS84 (EPSG:4326)

### Seismic CSV Requirements
- **Required Columns**: Date_Time_PH, Latitude, Longitude, Depth_In_Km, Magnitude, Location
- **Date Format**: YYYY-MM-DD HH:MM:SS (configurable)
- **Coordinates**: Decimal degrees (WGS84)

### Weather Data
- **Source**: Google Weather API (requires API key)
- **Coverage**: Philippines region
- **Update Frequency**: Real-time via API calls

## RAG + LLM Setup

### Model (OpenRouter via LangChain)
- Model: `google/gemma-3-27b-it:free`
- Configure environment variable:
```bash
export OPENROUTER_API_KEY="your_openrouter_key"
```

### Vector Store
- Uses Chroma (persisted at `CHROMA_DB_DIR` in `.env`)
- Embeddings: prefers HuggingFace `sentence-transformers/all-MiniLM-L6-v2`; falls back to OpenRouter OpenAIEmbeddings if HF unavailable

### Ingest Guidance Texts
```bash
curl -s -X POST http://localhost:5000/ingest \
  -H "Content-Type: application/json" \
  -d '{"texts":[
    "Flood prep: move valuables up, prepare go-bag, avoid crossing fast water.",
    "Landslide prep: avoid steep slopes during heavy rain, evacuate if cracks appear.",
    "Heat risk: hydrate, avoid midday labor, check elderly, seek shade/cooling center."
  ]}'
```

## Example Usage

### Python API Usage

```python
from db.base import SessionLocal
from db.queries import add_flood_data, get_flood_data_by_risk

# Add flood data
db = SessionLocal()
add_flood_data(
    db=db,
    geometry_wkt="MULTIPOLYGON (((125.56724 8.69465, 125.56751 8.69465, 125.56751 8.69447, 125.56724 8.69447, 125.56724 8.69465)))",
    risk_level=2.0
)

# Query by risk level
high_risk_areas = get_flood_data_by_risk(db, min_risk=2.0)
print(f"Found {len(high_risk_areas)} high-risk areas")
```

### Command Line Usage

```bash
# Validate seismic CSV before ingestion
python run_ingestions.py seismic data/earthquakes.csv --validate-only

# Ingest with custom date format
python run_ingestions.py seismic data/earthquakes.csv --date-format "%Y-%m-%d %H:%M:%S"

# Ingest landslide data with custom risk column
python run_ingestions.py landslide data/landslide_zones.shp --risk-column "RISK"
```

## Troubleshooting

### Common Issues

1. **PostGIS extension not found**:
   ```bash
   # Install PostGIS extension
   sudo apt install postgresql-13-postgis-3  # Adjust version as needed
   ```

2. **Database connection failed**:
   - Check PostgreSQL is running
   - Verify database credentials in `.env`
   - Ensure database exists

3. **Geometry errors**:
   - Ensure data is in WGS84 (EPSG:4326) coordinate system
   - Check geometry validity

4. **Weather API errors**:
   - Verify Google Maps API key is set
   - Check API key has Weather API enabled
   - Ensure billing is set up for Google Cloud

5. **String data in seismic CSV**:
   - The system automatically handles string-to-float conversion
   - Check for invalid numeric values in the CSV

### Logs

Check application logs for detailed error messages and debugging information. The Flask app provides verbose logging for troubleshooting.

## Performance Tips
- For very large flood polygons, use on-the-fly simplification params when calling:
  - `/api/flood-data?simplify_tolerance=0.0005&precision=5`
- Filter by map bounds and limit results on the client for large datasets.

## Development

### Running Tests

```bash
# Test database connection
python -c "from db.base import engine; print('Database connected successfully!')"

# Test individual components
python weather/google_weather_api.py
python ingest/seismic_ingestor.py sample_seismic_data.csv --validate-only
```

### File Structure

```
backend/
├── app.py                 # Main Flask application
├── init_db.py            # Database initialization
├── refresh_database.py   # Database refresh utility
├── run_ingestions.py     # Main ingestion script
├── db/                   # Database models and queries
├── ingest/              # Data ingestion modules
├── weather/             # Weather API integration
├── static/              # Frontend files
└── requirements.txt     # Python dependencies
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the ButDev AI Hackathon.
