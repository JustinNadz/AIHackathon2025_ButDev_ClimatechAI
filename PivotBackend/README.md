# Pivot Backend

A simple FastAPI backend for the Pivot Frontend application with PostgreSQL/PostGIS support.

## Features

- **FastAPI**: Modern, fast web framework for building APIs
- **PostgreSQL/PostGIS**: Spatial database with geographic data support
- **SQLAlchemy**: ORM for database operations
- **CORS Support**: Configured for React frontend
- **Health Check**: Basic health monitoring endpoints
- **Table Management**: Create, drop, and reset database tables
- **Shapefile Import**: Import flood and landslide data from shapefiles with geometry simplification
- **Environment Configuration**: Support for environment variables

## Database Models

- **WeatherData**: Point-based weather measurements
- **FloodData**: Polygon-based flood areas
- **LandslideData**: Polygon-based landslide areas

## Prerequisites

1. **PostgreSQL with PostGIS**
   - Install PostgreSQL: https://www.postgresql.org/download/
   - Install PostGIS extension: https://postgis.net/install/
   - Or use Docker:
     ```bash
     docker run --name postgis -e POSTGRES_PASSWORD=password -e POSTGRES_DB=pivot_db -p 5432:5432 -d postgis/postgis:15-3.3
     ```

## Setup

1. **Create Virtual Environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Environment Configuration**
   - Copy `env.example` to `.env`
   - Update the `DATABASE_URL` with your PostgreSQL credentials:
     ```
     DATABASE_URL=postgresql://username:password@localhost:5432/pivot_db
     ```

4. **Setup Database**
   ```bash
   python setup_db.py
   ```

5. **Setup Tables**
   ```bash
   # Create tables
   python setup_tables.py
   
   # Or reset tables (drop and recreate)
   python setup_tables.py reset
   ```

6. **Run the Server**
   ```bash
   python main.py
   ```
   
   Or using uvicorn directly:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

## Shapefile Import

Import flood and landslide data from shapefiles with automatic geometry simplification.

### Requirements

Your shapefile should have:
- A risk column with values 1-3 (1=low, 2=medium, 3=high)
- A geometry column with multipolygons

### Usage

```bash
# Import flood data only
python import_shapefile.py --type flood --flood-file path/to/flood.shp

# Import landslide data only
python import_shapefile.py --type landslide --landslide-file path/to/landslide.shp

# Import both flood and landslide data
python import_shapefile.py --type both --flood-file path/to/flood.shp --landslide-file path/to/landslide.shp

# Custom options
python import_shapefile.py \
  --type both \
  --flood-file flood.shp \
  --landslide-file landslide.shp \
  --risk-column risk_level \
  --tolerance 0.0005 \
  --batch-size 50
```

### Options

- `--type`: Type of data to import (`flood`, `landslide`, or `both`)
- `--flood-file`: Path to flood shapefile
- `--landslide-file`: Path to landslide shapefile
- `--risk-column`: Name of the risk column (default: `risk`)
- `--tolerance`: Geometry simplification tolerance (default: `0.0001`)
  - Higher values = more simplified geometry
  - Lower values = more detailed geometry
- `--batch-size`: Number of records to commit at once (default: `100`)

### Features

- **Automatic CRS conversion** to WGS84 (EPSG:4326)
- **Geometry simplification** to reduce complexity
- **Batch processing** for large datasets
- **Error handling** with detailed logging
- **Progress reporting** during import
- **Automatic area calculation** in square meters

### Example Output

```
🚀 Starting shapefile import...
   Type: both
   Risk column: risk
   Tolerance: 0.0001
   Batch size: 100

Importing flood data from: flood.shp
Loaded 1500 flood records
Imported 100 flood records...
Imported 200 flood records...
✅ Flood data import completed!
   Imported: 1500 records
   Errors: 0 records

Importing landslide data from: landslide.shp
Loaded 800 landslide records
Imported 100 landslide records...
✅ Landslide data import completed!
   Imported: 800 records
   Errors: 0 records

🎉 Import completed!
   Total imported: 2300 records
   Total errors: 0 records
```

## API Endpoints

### Health Check
- `GET /` - Root endpoint with health status
- `GET /health` - Health check endpoint

### Database Management
- `GET /api/db-test` - Test database connection
- `GET /api/tables` - Get information about all tables
- `POST /api/tables/create` - Create all database tables
- `DELETE /api/tables/drop` - Drop all database tables
- `POST /api/tables/reset` - Drop and recreate all tables

### Environment Info
- `GET /api/env-info` - Get environment configuration status

## Table Setup Commands

### Command Line
```bash
# Create tables
python setup_tables.py

# Drop all tables
python setup_tables.py drop

# Reset tables (drop and recreate)
python setup_tables.py reset
```

### API Endpoints
```bash
# Get table information
curl http://localhost:8000/api/tables

# Create tables
curl -X POST http://localhost:8000/api/tables/create

# Drop tables
curl -X DELETE http://localhost:8000/api/tables/drop

# Reset tables
curl -X POST http://localhost:8000/api/tables/reset
```

## API Documentation

Once the server is running, you can access:
- **Interactive API docs**: http://localhost:8000/docs
- **ReDoc documentation**: http://localhost:8000/redoc

## Development

The server runs on `http://localhost:8000` by default and is configured to accept requests from the React frontend running on `http://localhost:3000`.

## Project Structure

```
PivotBackend/
├── main.py              # FastAPI application
├── database.py          # Database configuration
├── models.py            # SQLAlchemy models
├── setup_db.py          # Database setup script
├── setup_tables.py      # Table setup script
├── import_shapefile.py  # Shapefile import script
├── requirements.txt     # Python dependencies
├── env.example         # Environment variables template
└── README.md           # This file
```

## Notes

- All spatial data uses SRID 4326 (WGS84)
- Weather data uses POINT geometry for specific locations
- Flood and landslide data use POLYGON geometry for affected areas
- Tables are created automatically when the server starts
- Use the table management endpoints or scripts to manage database schema
- The database setup script will create the database and enable PostGIS extension
- Shapefile import includes automatic geometry simplification for large multipolygons
- Risk values (1-3) are automatically converted to severity levels (low/medium/high)
