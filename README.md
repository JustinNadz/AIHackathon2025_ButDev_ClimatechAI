# ButDev AI Hackathon - Flood Risk Analysis

A geospatial flood risk analysis system using PostgreSQL with PostGIS for storing and querying flood data with geometry and risk levels (0-2 scale).

## Features

- **PostgreSQL with PostGIS**: Store flood data with geospatial geometry
- **Risk Assessment**: 1-3 scale flood risk levels
- **Shapefile Support**: Ingest flood data from shapefiles (.shp)
- **Geospatial Queries**: Spatial analysis and filtering capabilities
- **AI Integration**: Chat interface for querying flood data

## Prerequisites

1. **PostgreSQL** (version 12 or higher)
2. **PostGIS Extension** (version 3.0 or higher)
3. **Python 3.8+**

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
CREATE DATABASE flood_db;

# Connect to the new database
\c flood_db

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
DATABASE_URL=postgresql://username:password@localhost:5432/flood_db
OPENROUTER_API_KEY=your_api_key_here
CHROMA_DB_DIR=./chroma_store
```

### 5. Initialize Database

```bash
python init_db.py
```

This will:
- Create database if it doesn't exist
- Enable PostGIS extension
- Create necessary tables

## Usage

### Ingesting Flood Data

Currently supports shapefile (.shp) ingestion:

```bash
python run_ingestions.py path/to/flood_zones.shp
```

The system will:
- Read the shapefile using GeoPandas
- Extract geometry as WKT (Well-Known Text)
- Extract risk levels from the "LH" column (1-3 scale)
- Store data in PostgreSQL with PostGIS

### Customizing Risk Column

The system is configured to use the "LH" column by default. If your data uses a different column name, edit the `risk_column` parameter in `run_ingestions.py`:

```python
ingestor.ingest_shp(
    file_path=file_path,
    risk_column="your_risk_column_name",  # Change this to your column name
    default_risk=2.0  # Default risk if column not found
)
```

### Database Queries

The system provides several query functions in `db/queries.py`:

- `get_flood_data_by_risk()`: Filter by risk level
- `get_flood_data_within_bounds()`: Spatial queries within bounds
- `add_chat_history()`: Store chat interactions
- `get_chat_history()`: Retrieve chat history

## Data Schema

### FloodData Table
- `id`: Primary key
- `geometry`: PostGIS geometry (MULTIPOLYGON, SRID 4326)
- `risk_level`: Float (1-3 scale for flood risk)

### ChatHistory Table
- `id`: Primary key
- `question`: User question
- `answer`: System response

## API Endpoints

The Flask application provides endpoints for:
- `/ask` (POST): Chat interface for flood data queries
- `/ingest` (POST): Ingest text documents for RAG

## Development

### Running the Application

```bash
python app.py
```

### Testing Database Connection

```bash
python -c "from db.base import engine; print('Database connected successfully!')"
```

## Example Usage

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

4. **Shapefile ingestion errors**:
   - Verify shapefile contains valid geometries
   - Check that "LH" column exists in the shapefile
   - Ensure risk values are numeric and within 1-3 range

### Logs

Check application logs for detailed error messages and debugging information.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the ButDev AI Hackathon.
