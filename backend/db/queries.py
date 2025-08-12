from sqlalchemy.orm import Session
from sqlalchemy import text
from .models import (
    FloodData, EarthquakeData, LandslideData, 
    WeatherData, EmergencyProtocol
)
from datetime import datetime


# ============================================================================
# FLOOD DATA QUERIES
# ============================================================================

def add_flood_data(db: Session, geometry_wkt: str, risk_level: float):
    """Add flood data to the database"""
    flood_data = FloodData(
        geometry=geometry_wkt,
        risk_level=risk_level,
    )
    db.add(flood_data)
    db.commit()
    db.refresh(flood_data)
    return flood_data


def add_flood_data_batch(db: Session, flood_data_list: list):
    """
    Add multiple flood data records to the database in a single batch
    
    Args:
        db: Database session
        flood_data_list: List of FloodData objects to insert
    """
    db.add_all(flood_data_list)
    db.commit()
    return len(flood_data_list)


def get_flood_data_by_risk(db: Session, min_risk: float = None, max_risk: float = None):
    """Get flood data filtered by risk level"""
    query = db.query(FloodData)
    
    if min_risk is not None:
        query = query.filter(FloodData.risk_level >= min_risk)
    if max_risk is not None:
        query = query.filter(FloodData.risk_level <= max_risk)
    
    return query.all()


def get_flood_data_within_bounds(db: Session, bounds_wkt: str):
    """Get flood data within specified bounds using PostGIS ST_Intersects"""
    query = text("""
        SELECT * FROM flood_data 
        WHERE ST_Intersects(geometry, ST_GeomFromText(:bounds_wkt, 4326))
    """)
    result = db.execute(query, {"bounds_wkt": bounds_wkt})
    return result.fetchall()


def get_high_risk_flood_areas(db: Session, risk_threshold: float = 2.0):
    """Get areas with high flood risk"""
    return db.query(FloodData).filter(FloodData.risk_level >= risk_threshold).all()


# ============================================================================
# EARTHQUAKE DATA QUERIES
# ============================================================================

def add_earthquake_data(db: Session, geometry_wkt: str, magnitude: float, depth: float = None,
                       event_time: datetime = None, location_name: str = None, 
                       source: str = None, metadata: dict = None):
    """Add earthquake data to the database"""
    earthquake_data = EarthquakeData(
        geometry=geometry_wkt,
        magnitude=magnitude,
        depth=depth,
        event_time=event_time,
        location_name=location_name,
        source=source,
        metadata=metadata
    )
    db.add(earthquake_data)
    db.commit()
    db.refresh(earthquake_data)
    return earthquake_data


def get_earthquakes_by_magnitude(db: Session, min_magnitude: float = None, max_magnitude: float = None):
    """Get earthquakes filtered by magnitude"""
    query = db.query(EarthquakeData)
    
    if min_magnitude is not None:
        query = query.filter(EarthquakeData.magnitude >= min_magnitude)
    if max_magnitude is not None:
        query = query.filter(EarthquakeData.magnitude <= max_magnitude)
    
    return query.order_by(EarthquakeData.event_time.desc()).all()


def get_recent_earthquakes(db: Session, hours: int = 24):
    """Get earthquakes from the last N hours"""
    from datetime import timedelta
    cutoff_time = datetime.now() - timedelta(hours=hours)
    return db.query(EarthquakeData).filter(
        EarthquakeData.event_time >= cutoff_time
    ).order_by(EarthquakeData.event_time.desc()).all()


# ============================================================================
# LANDSLIDE DATA QUERIES
# ============================================================================

def add_landslide_data(db: Session, geometry_wkt: str, risk_level: float):
    """Add landslide data to the database"""
    landslide_data = LandslideData(
        geometry=geometry_wkt,
        risk_level=risk_level,
    )
    db.add(landslide_data)
    db.commit()
    db.refresh(landslide_data)
    return landslide_data


def get_landslide_data_by_risk(db: Session, min_risk: float = None, max_risk: float = None):
    """Get landslide data filtered by risk level"""
    query = db.query(LandslideData)
    
    if min_risk is not None:
        query = query.filter(LandslideData.risk_level >= min_risk)
    if max_risk is not None:
        query = query.filter(LandslideData.risk_level <= max_risk)
    
    return query.all()


def get_landslide_data_nearby(db: Session, latitude: float, longitude: float, radius_km: float = 50.0, min_risk: float = None, max_risk: float = None):
    """Get landslide data within radius_km of a point, optionally filtered by risk level"""
    query = text(
        """
        SELECT 
            id,
            risk_level,
            ST_AsGeoJSON(geometry) as geometry_json,
            ST_Distance(geometry::geography, ST_SetSRID(ST_Point(:lng, :lat), 4326)::geography) / 1000.0 AS distance_km
        FROM landslide_data
        WHERE ST_DWithin(
            geometry::geography, 
            ST_SetSRID(ST_Point(:lng, :lat), 4326)::geography, 
            :radius_meters
        )
        """
    )
    
    # Add risk level filters if provided
    risk_conditions = []
    params = {
        "lat": latitude, 
        "lng": longitude, 
        "radius_meters": radius_km * 1000.0
    }
    
    if min_risk is not None:
        risk_conditions.append("risk_level >= :min_risk")
        params["min_risk"] = min_risk
    
    if max_risk is not None:
        risk_conditions.append("risk_level <= :max_risk")
        params["max_risk"] = max_risk
    
    if risk_conditions:
        query_text = str(query)
        query_text += " AND " + " AND ".join(risk_conditions)
        query = text(query_text)
    
    query = text(str(query) + " ORDER BY distance_km ASC")
    
    result = db.execute(query, params)
    return result.fetchall()


# ============================================================================
# WEATHER DATA QUERIES
# ============================================================================


def add_weather_data(db: Session, geometry_wkt: str, temperature: float = None, humidity: float = None,
                    rainfall: float = None, wind_speed: float = None, wind_direction: float = None,
                    pressure: float = None, station_name: str = None, recorded_at: datetime = None,
                    source: str = None, weather_metadata: dict = None):
    """Add weather data to the database"""
    weather_data = WeatherData(
        geometry=geometry_wkt,
        temperature=temperature,
        humidity=humidity,
        rainfall=rainfall,
        wind_speed=wind_speed,
        wind_direction=wind_direction,
        pressure=pressure,
        station_name=station_name,
        recorded_at=recorded_at,
        source=source,
        weather_metadata=weather_metadata
    )
    db.add(weather_data)
    db.commit()
    db.refresh(weather_data)
    return weather_data


def get_recent_weather_data(db: Session, hours: int = 1):
    """Get weather data from the last N hours"""
    from datetime import timedelta
    cutoff_time = datetime.now() - timedelta(hours=hours)
    return db.query(WeatherData).filter(
        WeatherData.recorded_at >= cutoff_time
    ).order_by(WeatherData.recorded_at.desc()).all()


# ============================================================================
# ASSISTANT SUPPORT QUERIES (spatial checks and nearest lookups)
# ============================================================================


def get_flood_risk_at_point(db: Session, latitude: float, longitude: float):
    """Return the maximum flood risk_level at a given point, or None if outside flood zones."""
    query = text(
        """
        SELECT MAX(risk_level) AS max_risk
        FROM flood_data
        WHERE ST_Intersects(
            geometry,
            ST_SetSRID(ST_Point(:lng, :lat), 4326)
        )
        """
    )
    result = db.execute(query, {"lat": latitude, "lng": longitude}).fetchone()
    return float(result[0]) if result and result[0] is not None else None


def get_landslide_risk_at_point(db: Session, latitude: float, longitude: float):
    """Return the maximum landslide risk_level at a given point, or None if outside zones."""
    query = text(
        """
        SELECT MAX(risk_level) AS max_risk
        FROM landslide_data
        WHERE ST_Intersects(
            geometry,
            ST_SetSRID(ST_Point(:lng, :lat), 4326)
        )
        """
    )
    result = db.execute(query, {"lat": latitude, "lng": longitude}).fetchone()
    return float(result[0]) if result and result[0] is not None else None


def get_recent_earthquakes_nearby(db: Session, latitude: float, longitude: float, hours: int = 24, max_km: float = 100.0):
    """Return recent earthquakes within max_km of the point in the last N hours, with distance."""
    from datetime import timedelta
    cutoff_time = datetime.now() - timedelta(hours=hours)

    query = text(
        """
        SELECT 
            id,
            magnitude,
            depth,
            event_time,
            ST_Distance(geometry::geography, ST_SetSRID(ST_Point(:lng, :lat), 4326)::geography) / 1000.0 AS distance_km
        FROM earthquake_data
        WHERE event_time IS NOT NULL
          AND event_time >= :cutoff
          AND ST_DWithin(geometry::geography, ST_SetSRID(ST_Point(:lng, :lat), 4326)::geography, :max_meters)
        ORDER BY distance_km ASC, event_time DESC
        """
    )
    rows = db.execute(query, {"lat": latitude, "lng": longitude, "cutoff": cutoff_time, "max_meters": max_km * 1000.0}).fetchall()
    return [
        {
            "id": r[0],
            "magnitude": float(r[1]) if r[1] is not None else None,
            "depth": float(r[2]) if r[2] is not None else None,
            "event_time": r[3].isoformat() if r[3] else None,
            "distance_km": float(r[4]) if r[4] is not None else None,
        }
        for r in rows
    ]


def get_nearest_recent_weather(db: Session, latitude: float, longitude: float, hours: int = 3, max_km: float = 100.0):
    """Return the nearest recent weather station data within max_km in the last N hours."""
    from datetime import timedelta
    cutoff_time = datetime.now() - timedelta(hours=hours)

    query = text(
        """
        SELECT 
            id,
            temperature,
            humidity,
            rainfall,
            wind_speed,
            wind_direction,
            pressure,
            station_name,
            recorded_at,
            ST_Distance(geometry::geography, ST_SetSRID(ST_Point(:lng, :lat), 4326)::geography) / 1000.0 AS distance_km
        FROM weather_data
        WHERE recorded_at IS NOT NULL
          AND recorded_at >= :cutoff
          AND ST_DWithin(geometry::geography, ST_SetSRID(ST_Point(:lng, :lat), 4326)::geography, :max_meters)
        ORDER BY distance_km ASC, recorded_at DESC
        LIMIT 1
        """
    )
    row = db.execute(query, {"lat": latitude, "lng": longitude, "cutoff": cutoff_time, "max_meters": max_km * 1000.0}).fetchone()
    if not row:
        return None
    return {
        "id": row[0],
        "temperature": float(row[1]) if row[1] is not None else None,
        "humidity": float(row[2]) if row[2] is not None else None,
        "rainfall": float(row[3]) if row[3] is not None else None,
        "wind_speed": float(row[4]) if row[4] is not None else None,
        "wind_direction": float(row[5]) if row[5] is not None else None,
        "pressure": float(row[6]) if row[6] is not None else None,
        "station_name": row[7],
        "recorded_at": row[8].isoformat() if row[8] else None,
        "distance_km": float(row[9]) if row[9] is not None else None,
    }


# ============================================================================
# EMERGENCY PROTOCOLS QUERIES
# ============================================================================

def get_all_emergency_protocols(db: Session, status: str = None):
    """Get all emergency protocols, optionally filtered by status"""
    query = db.query(EmergencyProtocol)
    
    if status:
        query = query.filter(EmergencyProtocol.status == status)
    
    return query.order_by(EmergencyProtocol.created_at.desc()).all()


def get_emergency_protocol_by_id(db: Session, protocol_id: int):
    """Get a specific emergency protocol by ID"""
    return db.query(EmergencyProtocol).filter(EmergencyProtocol.id == protocol_id).first()


def get_emergency_protocols_by_type(db: Session, protocol_type: str, status: str = 'active'):
    """Get emergency protocols filtered by type and status"""
    return db.query(EmergencyProtocol).filter(
        EmergencyProtocol.type == protocol_type,
        EmergencyProtocol.status == status
    ).order_by(EmergencyProtocol.created_at.desc()).all()


def create_emergency_protocol(db: Session, name: str, protocol_type: str, description: str = None, 
                            steps: list = None, status: str = 'active'):
    """Create a new emergency protocol"""
    protocol = EmergencyProtocol(
        name=name,
        type=protocol_type,
        description=description,
        steps=steps or [],
        status=status
    )
    db.add(protocol)
    db.commit()
    db.refresh(protocol)
    return protocol


def update_emergency_protocol(db: Session, protocol_id: int, **kwargs):
    """Update an existing emergency protocol"""
    protocol = db.query(EmergencyProtocol).filter(EmergencyProtocol.id == protocol_id).first()
    if not protocol:
        return None
    
    # Update only provided fields
    for key, value in kwargs.items():
        if hasattr(protocol, key):
            setattr(protocol, key, value)
    
    # Always update the updated_at timestamp
    protocol.updated_at = datetime.now()
    
    db.commit()
    db.refresh(protocol)
    return protocol


def delete_emergency_protocol(db: Session, protocol_id: int):
    """Delete an emergency protocol"""
    protocol = db.query(EmergencyProtocol).filter(EmergencyProtocol.id == protocol_id).first()
    if not protocol:
        return False
    
    db.delete(protocol)
    db.commit()
    return True