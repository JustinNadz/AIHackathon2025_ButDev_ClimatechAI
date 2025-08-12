from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import inspect, text
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import time
from dotenv import load_dotenv

from database import engine, get_db
from models import Base, WeatherData, FloodData, LandslideData, RiskAssessmentData
from google_weather_api import WeatherDatabaseManager
from risk_assessment import RiskAssessmentEngine

# Load environment variables
load_dotenv()

# Debug: Check if environment variables are loaded
print(f"🔍 Debug: OPENROUTER_API_KEY loaded: {'Yes' if os.getenv('OPENROUTER_API_KEY') else 'No'}")
print(f"🔍 Debug: GOOGLE_MAPS_API_KEY loaded: {'Yes' if os.getenv('GOOGLE_MAPS_API_KEY') else 'No'}")

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

class GridRiskAssessmentRequest(BaseModel):
    min_lat: Optional[float] = 10.65  # Default to map grid southwest corner
    max_lat: Optional[float] = 10.79  # Default to map grid northeast corner
    min_lng: Optional[float] = 122.50  # Default to map grid southwest corner
    max_lng: Optional[float] = 122.62  # Default to map grid northeast corner
    grid_spacing: float = 0.02  # Default 0.02 degree spacing (~2km)
    api_key: Optional[str] = None  # Optional override for API key

class GridPointAssessment(BaseModel):
    latitude: float
    longitude: float
    weather_data: Optional[Dict[str, Any]] = None
    flood_risk: Optional[str] = None
    landslide_risk: Optional[str] = None
    ai_assessment: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class GridRiskAssessmentResponse(BaseModel):
    status: str
    message: str
    grid_points: int
    points_processed: int
    points_with_weather: int
    points_with_flood_risk: int
    points_with_landslide_risk: int
    points_with_ai_assessment: int
    errors: int
    estimated_time: Optional[float] = None
    results: Optional[List[GridPointAssessment]] = None

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


# GRID RISK ASSESSMENT FUNCTIONS

def generate_grid_points(min_lat: float, max_lat: float, min_lng: float, max_lng: float, spacing: float):
    """
    Generate a grid of points within the specified bounds
    """
    points = []
    lat = min_lat
    while lat <= max_lat:
        lng = min_lng
        while lng <= max_lng:
            points.append((lat, lng))
            lng += spacing
        lat += spacing
    return points

def fetch_weather_data(lat: float, lng: float, api_key: str):
    """
    Fetch weather data for a single point using Google Weather API
    """
    try:
        # Use the local Google Weather API
        with WeatherDatabaseManager(api_key) as weather_manager:
            # Get weather data
            weather_data = weather_manager.weather_api.get_weather_data(lat, lng)
            
            if weather_data and 'current' in weather_data:
                current = weather_data['current']
                return {
                    "temperature": current["temperature"],
                    "humidity": current["humidity"],
                    "pressure": current["pressure"],
                    "wind_speed": current["wind_speed"],
                    "wind_direction": current["wind_direction"],
                    "precipitation": current["rainfall"],
                    "weather_condition": current["description"]
                }
            else:
                print(f"Error: Invalid weather data format for ({lat}, {lng})")
                return None
                
    except Exception as e:
        print(f"Error fetching weather for ({lat}, {lng}): {e}")
        return None

def check_hazard_zones(lat: float, lng: float, db: Session):
    """
    Check if a point is within flood or landslide hazard zones
    """
    try:
        point_geom = f"POINT({lng} {lat})"
        
        # Check flood zones
        flood_query = text("""
            SELECT risk_value 
            FROM flood_data 
            WHERE ST_Contains(geometry, ST_GeomFromText(:point_geom, 4326))
            ORDER BY risk_value DESC
            LIMIT 1
        """)
        
        flood_result = db.execute(flood_query, {"point_geom": point_geom}).fetchone()
        flood_risk = flood_result.risk_value if flood_result else None
        
        # Check landslide zones
        landslide_query = text("""
            SELECT risk_value 
            FROM landslide_data 
            WHERE ST_Contains(geometry, ST_GeomFromText(:point_geom, 4326))
            ORDER BY risk_value DESC
            LIMIT 1
        """)
        
        landslide_result = db.execute(landslide_query, {"point_geom": point_geom}).fetchone()
        landslide_risk = landslide_result.risk_value if landslide_result else None
        
        # Debug output
        if flood_risk or landslide_risk:
            print(f"  🚨 Found hazard zones for ({lat}, {lng}): flood={flood_risk}, landslide={landslide_risk}")
        else:
            print(f"  ✅ No hazard zones found for ({lat}, {lng})")
        
        return flood_risk, landslide_risk
        
    except Exception as e:
        print(f"Error checking hazard zones for ({lat}, {lng}): {e}")
        return None, None

def assess_point_risk(lat: float, lng: float, weather_data: Dict, flood_risk: str, landslide_risk: str, db: Session):
    """
    Use AI to assess risk for a specific point
    """
    try:
        risk_engine = RiskAssessmentEngine()
        
        # Perform AI assessment using the database session
        assessment = risk_engine.assess_location_risk(lat, lng, db)
        
        return assessment
        
    except Exception as e:
        print(f"Error in AI assessment for ({lat}, {lng}): {e}")
        return None

def save_risk_assessment_to_db(lat: float, lng: float, weather_data: Dict, flood_risk: str, landslide_risk: str, ai_assessment: Dict, weather_data_id: int, db: Session):
    """
    Save risk assessment results to database
    """
    try:
        point_geom = f"POINT({lng} {lat})"
        
        # Extract AI assessment data
        ai_risk_score = ai_assessment.get('risk_score')
        ai_risk_level = ai_assessment.get('risk_level', 'unknown')
        ai_assessment_summary = ai_assessment.get('assessment_summary', '')
        ai_recommendations = ai_assessment.get('recommendations', '')
        ai_factors = ai_assessment.get('contributing_factors', '')
        
        # Convert factors to JSON string if it's a dict
        if isinstance(ai_factors, dict):
            import json
            ai_factors = json.dumps(ai_factors)
        
        # Create risk assessment record
        risk_record = RiskAssessmentData(
            location=point_geom,
            weather_data_id=weather_data_id,
            flood_risk=flood_risk,
            landslide_risk=landslide_risk,
            ai_risk_score=ai_risk_score,
            ai_risk_level=ai_risk_level,
            ai_assessment_summary=ai_assessment_summary,
            ai_recommendations=ai_recommendations,
            ai_factors=ai_factors
        )
        
        db.add(risk_record)
        db.commit()
        
        print(f"  💾 Saved risk assessment to database for ({lat}, {lng}) - Risk Level: {ai_risk_level}")
        
        return risk_record.id
        
    except Exception as e:
        print(f"  ⚠️ Error saving risk assessment to database: {e}")
        db.rollback()
        return None

def process_grid_risk_assessment(
    min_lat: float, 
    max_lat: float, 
    min_lng: float, 
    max_lng: float, 
    grid_spacing: float,
    api_key: str,
    db: Session
):
    """
    Process a grid of points for comprehensive risk assessment
    """
    # Generate grid points
    grid_points = generate_grid_points(min_lat, max_lat, min_lng, max_lng, grid_spacing)
    total_points = len(grid_points)
    
    print(f"Processing risk assessment for {total_points} grid points...")
    
    results = []
    points_processed = 0
    points_with_weather = 0
    points_with_flood_risk = 0
    points_with_landslide_risk = 0
    points_with_ai_assessment = 0
    errors = 0
    
    for lat, lng in grid_points:
        try:
            point_result = GridPointAssessment(
                latitude=lat,
                longitude=lng
            )
            
            # 1. Fetch weather data
            weather_data = fetch_weather_data(lat, lng, api_key)
            weather_data_id = None
            if weather_data:
                point_result.weather_data = weather_data
                points_with_weather += 1
                
                # Save weather data to database for risk assessment
                try:
                    point_geom = f"POINT({lng} {lat})"
                    weather_record = WeatherData(
                        location=point_geom,
                        temperature=weather_data["temperature"],
                        humidity=weather_data["humidity"],
                        pressure=weather_data["pressure"],
                        wind_speed=weather_data["wind_speed"],
                        wind_direction=weather_data["wind_direction"],
                        precipitation=weather_data["precipitation"],
                        weather_condition=weather_data["weather_condition"]
                    )
                    db.add(weather_record)
                    db.commit()
                    weather_data_id = weather_record.id
                    print(f"  💾 Saved weather data to database for ({lat}, {lng})")
                except Exception as e:
                    print(f"  ⚠️ Error saving weather data to database: {e}")
                    db.rollback()
            
            # 2. Check hazard zones
            flood_risk, landslide_risk = check_hazard_zones(lat, lng, db)
            if flood_risk:
                point_result.flood_risk = flood_risk
                points_with_flood_risk += 1
            if landslide_risk:
                point_result.landslide_risk = landslide_risk
                points_with_landslide_risk += 1
            
            # 3. AI risk assessment (only if we have some data)
            if weather_data or flood_risk or landslide_risk:
                ai_assessment = assess_point_risk(lat, lng, weather_data, flood_risk, landslide_risk, db)
                if ai_assessment:
                    point_result.ai_assessment = ai_assessment
                    points_with_ai_assessment += 1
                    
                    # Save risk assessment to database
                    save_risk_assessment_to_db(
                        lat, lng, weather_data, flood_risk, landslide_risk, 
                        ai_assessment, weather_data_id, db
                    )
            
            results.append(point_result)
            points_processed += 1
            
            # Rate limiting
            time.sleep(0.5)  # Wait 0.5 seconds between requests
            
        except Exception as e:
            print(f"Error processing point ({lat}, {lng}): {e}")
            point_result.error = str(e)
            results.append(point_result)
            errors += 1
            points_processed += 1
            continue
    
    return {
        "grid_points": total_points,
        "points_processed": points_processed,
        "points_with_weather": points_with_weather,
        "points_with_flood_risk": points_with_flood_risk,
        "points_with_landslide_risk": points_with_landslide_risk,
        "points_with_ai_assessment": points_with_ai_assessment,
        "errors": errors,
        "results": results
    }


# Grid Risk Assessment Endpoint
@app.post("/api/grid-risk-assessment", response_model=GridRiskAssessmentResponse)
async def create_grid_risk_assessment(
    request: GridRiskAssessmentRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Create a comprehensive risk assessment grid within specified bounds
    """
    try:
        # Get API key
        api_key = request.api_key or os.getenv("GOOGLE_MAPS_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=400, 
                detail="Google Maps API key not provided. Set GOOGLE_MAPS_API_KEY environment variable or provide api_key in request."
            )
        
        # Use default bounds if not provided
        min_lat = request.min_lat if request.min_lat is not None else 10.65
        max_lat = request.max_lat if request.max_lat is not None else 10.79
        min_lng = request.min_lng if request.min_lng is not None else 122.50
        max_lng = request.max_lng if request.max_lng is not None else 122.62
        
        # Validate bounds
        if min_lat >= max_lat or min_lng >= max_lng:
            raise HTTPException(
                status_code=400,
                detail="Invalid bounds: min values must be less than max values"
            )
        
        # Calculate grid size
        grid_points = generate_grid_points(
            min_lat, max_lat, 
            min_lng, max_lng, 
            request.grid_spacing
        )
        total_points = len(grid_points)
        
        # Estimate time (0.5 seconds per point due to rate limiting)
        estimated_time = total_points * 0.5  # seconds
        
        # For large grids, run in background
        if total_points > 20:
            # Start background task
            background_tasks.add_task(
                process_grid_risk_assessment,
                min_lat,
                max_lat,
                min_lng,
                max_lng,
                request.grid_spacing,
                api_key,
                db
            )
            
            return GridRiskAssessmentResponse(
                status="started",
                message=f"Grid risk assessment started in background. Processing {total_points} points.",
                grid_points=total_points,
                points_processed=0,
                points_with_weather=0,
                points_with_flood_risk=0,
                points_with_landslide_risk=0,
                points_with_ai_assessment=0,
                errors=0,
                estimated_time=estimated_time
            )
        else:
            # For small grids, process immediately
            result = process_grid_risk_assessment(
                min_lat,
                max_lat,
                min_lng,
                max_lng,
                request.grid_spacing,
                api_key,
                db
            )
            
            return GridRiskAssessmentResponse(
                status="completed",
                message=f"Grid risk assessment completed. {result['points_processed']} points processed.",
                grid_points=result['grid_points'],
                points_processed=result['points_processed'],
                points_with_weather=result['points_with_weather'],
                points_with_flood_risk=result['points_with_flood_risk'],
                points_with_landslide_risk=result['points_with_landslide_risk'],
                points_with_ai_assessment=result['points_with_ai_assessment'],
                errors=result['errors'],
                estimated_time=estimated_time,
                results=result['results']
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating grid risk assessment: {str(e)}")

@app.get("/api/grid-risk-assessment/status")
async def get_grid_risk_assessment_status(db: Session = Depends(get_db)):
    """
    Get status of grid risk assessment data
    """
    try:
        total_weather_records = db.query(WeatherData).count()
        total_flood_records = db.query(FloodData).count()
        total_landslide_records = db.query(LandslideData).count()
        total_risk_assessments = db.query(RiskAssessmentData).count()
        
        # Get recent risk assessments
        recent_assessments = db.query(RiskAssessmentData).order_by(RiskAssessmentData.timestamp.desc()).limit(5).all()
        
        return {
            "total_weather_records": total_weather_records,
            "total_flood_records": total_flood_records,
            "total_landslide_records": total_landslide_records,
            "total_risk_assessments": total_risk_assessments,
            "recent_assessments": [
                {
                    "id": assessment.id,
                    "location": assessment.location,
                    "ai_risk_level": assessment.ai_risk_level,
                    "ai_risk_score": assessment.ai_risk_score,
                    "timestamp": assessment.timestamp.isoformat() if assessment.timestamp else None
                }
                for assessment in recent_assessments
            ],
            "status": "available" if total_weather_records > 0 else "no_data"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting grid risk assessment status: {str(e)}")

@app.get("/api/risk-assessments")
async def get_risk_assessments(
    limit: int = 100,
    offset: int = 0,
    risk_level: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get risk assessment data with optional filtering
    """
    try:
        query = db.query(RiskAssessmentData)
        
        # Filter by risk level if specified
        if risk_level:
            query = query.filter(RiskAssessmentData.ai_risk_level == risk_level)
        
        # Get total count
        total_count = query.count()
        
        # Apply pagination
        assessments = query.order_by(RiskAssessmentData.timestamp.desc()).offset(offset).limit(limit).all()
        
        return {
            "total_count": total_count,
            "limit": limit,
            "offset": offset,
            "assessments": [
                {
                    "id": assessment.id,
                    "location": assessment.location,
                    "weather_data_id": assessment.weather_data_id,
                    "flood_risk": assessment.flood_risk,
                    "landslide_risk": assessment.landslide_risk,
                    "ai_risk_score": assessment.ai_risk_score,
                    "ai_risk_level": assessment.ai_risk_level,
                    "ai_assessment_summary": assessment.ai_assessment_summary,
                    "ai_recommendations": assessment.ai_recommendations,
                    "ai_factors": assessment.ai_factors,
                    "timestamp": assessment.timestamp.isoformat() if assessment.timestamp else None
                }
                for assessment in assessments
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting risk assessments: {str(e)}")

# Get environment info
@app.get("/api/env-info")
async def get_env_info():
    return {
        "google_maps_api_key": "configured" if os.getenv("GOOGLE_MAPS_API_KEY") else "not_configured",
        "openrouter_api_key": "configured" if os.getenv("OPENROUTER_API_KEY") else "not_configured",
        "database_url": "configured" if os.getenv("DATABASE_URL") else "not_configured",
        "environment": os.getenv("ENVIRONMENT", "development")
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
