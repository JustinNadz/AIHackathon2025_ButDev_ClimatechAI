from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import inspect
from pydantic import BaseModel
from typing import Optional
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
