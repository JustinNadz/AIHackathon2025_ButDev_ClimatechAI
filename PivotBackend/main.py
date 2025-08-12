from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import inspect, text
from pydantic import BaseModel
from typing import Optional, List
import os
from dotenv import load_dotenv

from database import engine, get_db
from models import Base, WeatherData, FloodData, LandslideData

# Load environment variables
load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Pivot Backend",
    description="Backend API for Pivot Frontend",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class HealthResponse(BaseModel):
    status: str
    message: str

class TableInfo(BaseModel):
    table_name: str
    exists: bool
    record_count: int

class DatabaseInfo(BaseModel):
    status: str
    tables: list[TableInfo]
    total_records: int

class PointRequest(BaseModel):
    latitude: float
    longitude: float

class HazardZone(BaseModel):
    id: int
    risk_value: str
    severity: str
    affected_area: Optional[float] = None
    timestamp: str

class PointInPolygonResponse(BaseModel):
    point: dict
    in_flood_zones: List[HazardZone]
    in_landslide_zones: List[HazardZone]
    total_flood_zones: int
    total_landslide_zones: int

# Health check endpoint
@app.get("/", response_model=HealthResponse)
async def root():
    return HealthResponse(
        status="healthy",
        message="Pivot Backend is running"
    )

# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        message="Pivot Backend is running"
    )

# Database test endpoint
@app.get("/api/db-test")
async def test_database(db: Session = Depends(get_db)):
    try:
        # Test database connection
        weather_count = db.query(WeatherData).count()
        flood_count = db.query(FloodData).count()
        landslide_count = db.query(LandslideData).count()
        
        return {
            "status": "connected",
            "weather_records": weather_count,
            "flood_records": flood_count,
            "landslide_records": landslide_count
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

# Table management endpoints
@app.get("/api/tables", response_model=DatabaseInfo)
async def get_table_info(db: Session = Depends(get_db)):
    """Get information about all database tables"""
    try:
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        
        tables_info = []
        total_records = 0
        
        # Check each model table
        model_tables = ["weather_data", "flood_data", "landslide_data"]
        
        for table_name in model_tables:
            exists = table_name in existing_tables
            record_count = 0
            
            if exists:
                if table_name == "weather_data":
                    record_count = db.query(WeatherData).count()
                elif table_name == "flood_data":
                    record_count = db.query(FloodData).count()
                elif table_name == "landslide_data":
                    record_count = db.query(LandslideData).count()
            
            tables_info.append(TableInfo(
                table_name=table_name,
                exists=exists,
                record_count=record_count
            ))
            total_records += record_count
        
        return DatabaseInfo(
            status="connected",
            tables=tables_info,
            total_records=total_records
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/api/tables/create")
async def create_tables():
    """Create all database tables"""
    try:
        Base.metadata.create_all(bind=engine)
        
        # Verify tables were created
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        
        return {
            "status": "success",
            "message": "Tables created successfully",
            "tables": existing_tables
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating tables: {str(e)}")

@app.delete("/api/tables/drop")
async def drop_tables():
    """Drop all database tables (use with caution!)"""
    try:
        Base.metadata.drop_all(bind=engine)
        
        return {
            "status": "success",
            "message": "All tables dropped successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error dropping tables: {str(e)}")

@app.post("/api/tables/reset")
async def reset_tables():
    """Drop and recreate all tables"""
    try:
        # Drop all tables
        Base.metadata.drop_all(bind=engine)
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        # Verify tables were recreated
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        
        return {
            "status": "success",
            "message": "Tables reset successfully",
            "tables": existing_tables
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error resetting tables: {str(e)}")

# Point-in-polygon endpoints
@app.post("/api/check-point", response_model=PointInPolygonResponse)
async def check_point_in_hazards(point: PointRequest, db: Session = Depends(get_db)):
    """
    Check if a point (lat/lng) is inside any flood or landslide zones
    """
    try:
        # Create a point geometry from the coordinates
        point_geom = f"POINT({point.longitude} {point.latitude})"
        
        # Check flood zones
        flood_query = text("""
            SELECT id, risk_value, 
                   CASE 
                       WHEN risk_value = '1' THEN 'low'
                       WHEN risk_value = '2' THEN 'medium'
                       WHEN risk_value = '3' THEN 'high'
                       ELSE 'unknown'
                   END as severity,
                   timestamp
            FROM flood_data 
            WHERE ST_Contains(geometry, ST_GeomFromText(:point_geom, 4326))
        """)
        
        flood_results = db.execute(flood_query, {"point_geom": point_geom}).fetchall()
        flood_zones = [
            HazardZone(
                id=row.id,
                risk_value=row.risk_value,
                severity=row.severity,
                timestamp=row.timestamp.isoformat() if row.timestamp else None
            )
            for row in flood_results
        ]
        
        # Check landslide zones
        landslide_query = text("""
            SELECT id, risk_value,
                   CASE 
                       WHEN risk_value = '1' THEN 'low'
                       WHEN risk_value = '2' THEN 'medium'
                       WHEN risk_value = '3' THEN 'high'
                       ELSE 'unknown'
                   END as severity,
                   timestamp
            FROM landslide_data 
            WHERE ST_Contains(geometry, ST_GeomFromText(:point_geom, 4326))
        """)
        
        landslide_results = db.execute(landslide_query, {"point_geom": point_geom}).fetchall()
        landslide_zones = [
            HazardZone(
                id=row.id,
                risk_value=row.risk_value,
                severity=row.severity,
                timestamp=row.timestamp.isoformat() if row.timestamp else None
            )
            for row in landslide_results
        ]
        
        return PointInPolygonResponse(
            point={"latitude": point.latitude, "longitude": point.longitude},
            in_flood_zones=flood_zones,
            in_landslide_zones=landslide_zones,
            total_flood_zones=len(flood_zones),
            total_landslide_zones=len(landslide_zones)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking point: {str(e)}")

@app.get("/api/check-point/{latitude}/{longitude}", response_model=PointInPolygonResponse)
async def check_point_in_hazards_get(latitude: float, longitude: float, db: Session = Depends(get_db)):
    """
    Check if a point (lat/lng) is inside any flood or landslide zones (GET version)
    """
    try:
        # Create a point geometry from the coordinates
        point_geom = f"POINT({longitude} {latitude})"
        
        # Check flood zones
        flood_query = text("""
            SELECT id, risk_value, 
                   CASE 
                       WHEN risk_value = '1' THEN 'low'
                       WHEN risk_value = '2' THEN 'medium'
                       WHEN risk_value = '3' THEN 'high'
                       ELSE 'unknown'
                   END as severity,
                   timestamp
            FROM flood_data 
            WHERE ST_Contains(geometry, ST_GeomFromText(:point_geom, 4326))
        """)
        
        flood_results = db.execute(flood_query, {"point_geom": point_geom}).fetchall()
        flood_zones = [
            HazardZone(
                id=row.id,
                risk_value=row.risk_value,
                severity=row.severity,
                timestamp=row.timestamp.isoformat() if row.timestamp else None
            )
            for row in flood_results
        ]
        
        # Check landslide zones
        landslide_query = text("""
            SELECT id, risk_value,
                   CASE 
                       WHEN risk_value = '1' THEN 'low'
                       WHEN risk_value = '2' THEN 'medium'
                       WHEN risk_value = '3' THEN 'high'
                       ELSE 'unknown'
                   END as severity,
                   timestamp
            FROM landslide_data 
            WHERE ST_Contains(geometry, ST_GeomFromText(:point_geom, 4326))
        """)
        
        landslide_results = db.execute(landslide_query, {"point_geom": point_geom}).fetchall()
        landslide_zones = [
            HazardZone(
                id=row.id,
                risk_value=row.risk_value,
                severity=row.severity,
                timestamp=row.timestamp.isoformat() if row.timestamp else None
            )
            for row in landslide_results
        ]
        
        return PointInPolygonResponse(
            point={"latitude": latitude, "longitude": longitude},
            in_flood_zones=flood_zones,
            in_landslide_zones=landslide_zones,
            total_flood_zones=len(flood_zones),
            total_landslide_zones=len(landslide_zones)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking point: {str(e)}")

@app.get("/api/hazards-in-bounds")
async def get_hazards_in_bounds(
    min_lat: float, 
    max_lat: float, 
    min_lng: float, 
    max_lng: float, 
    hazard_type: str = "both",
    db: Session = Depends(get_db)
):
    """
    Get all flood and/or landslide zones within a bounding box
    """
    try:
        # Create bounding box geometry
        bbox_geom = f"POLYGON(({min_lng} {min_lat}, {max_lng} {min_lat}, {max_lng} {max_lat}, {min_lng} {max_lat}, {min_lng} {min_lat}))"
        
        result = {}
        
        # Get flood zones if requested
        if hazard_type in ["flood", "both"]:
            flood_query = text("""
                SELECT id, risk_value, 
                       CASE 
                           WHEN risk_value = '1' THEN 'low'
                           WHEN risk_value = '2' THEN 'medium'
                           WHEN risk_value = '3' THEN 'high'
                           ELSE 'unknown'
                       END as severity,
                       ST_AsGeoJSON(geometry) as geometry,
                       timestamp
                FROM flood_data 
                WHERE ST_Intersects(geometry, ST_GeomFromText(:bbox_geom, 4326))
            """)
            
            flood_results = db.execute(flood_query, {"bbox_geom": bbox_geom}).fetchall()
            result["flood_zones"] = [
                {
                    "id": row.id,
                    "risk_value": row.risk_value,
                    "severity": row.severity,
                    "geometry": row.geometry,
                    "timestamp": row.timestamp.isoformat() if row.timestamp else None
                }
                for row in flood_results
            ]
        
        # Get landslide zones if requested
        if hazard_type in ["landslide", "both"]:
            landslide_query = text("""
                SELECT id, risk_value,
                       CASE 
                           WHEN risk_value = '1' THEN 'low'
                           WHEN risk_value = '2' THEN 'medium'
                           WHEN risk_value = '3' THEN 'high'
                           ELSE 'unknown'
                       END as severity,
                       ST_AsGeoJSON(geometry) as geometry,
                       timestamp
                FROM landslide_data 
                WHERE ST_Intersects(geometry, ST_GeomFromText(:bbox_geom, 4326))
            """)
            
            landslide_results = db.execute(landslide_query, {"bbox_geom": bbox_geom}).fetchall()
            result["landslide_zones"] = [
                {
                    "id": row.id,
                    "risk_value": row.risk_value,
                    "severity": row.severity,
                    "geometry": row.geometry,
                    "timestamp": row.timestamp.isoformat() if row.timestamp else None
                }
                for row in landslide_results
            ]
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting hazards in bounds: {str(e)}")

# Get environment info
@app.get("/api/env-info")
async def get_env_info():
    return {
        "google_maps_api_key": "configured" if os.getenv("GOOGLE_MAPS_API_KEY") else "not_configured",
        "database_url": "configured" if os.getenv("DATABASE_URL") else "not_configured",
        "environment": os.getenv("ENVIRONMENT", "development")
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
