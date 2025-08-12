# Pivot Backend

A simple FastAPI backend for the Pivot Frontend application with PostgreSQL/PostGIS support.

## Features

- **FastAPI**: Modern, fast web framework for building APIs
- **PostgreSQL/PostGIS**: Spatial database with geographic data support
- **SQLAlchemy**: ORM for database operations
- **CORS Support**: Configured for React frontend
- **Health Check**: Basic health monitoring endpoints
- **Table Management**: Create, drop, and reset database tables
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
