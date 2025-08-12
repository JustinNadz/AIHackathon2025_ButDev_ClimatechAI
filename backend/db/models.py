from sqlalchemy import Column, Integer, Text, Float, DateTime, String, JSON
from geoalchemy2 import Geometry
from sqlalchemy.sql import func
from .base import Base


class FloodData(Base):
    __tablename__ = "flood_data"
    id = Column(Integer, primary_key=True, autoincrement=True)
    geometry = Column(Geometry('MULTIPOLYGON', srid=4326), nullable=False)
    risk_level = Column(Float, nullable=False)  # 1-3 scale for flood risk


class EarthquakeData(Base):
    __tablename__ = "earthquake_data"
    id = Column(Integer, primary_key=True, autoincrement=True)
    geometry = Column(Geometry('POINT', srid=4326), nullable=False)
    magnitude = Column(Float, nullable=False)
    depth = Column(Float, nullable=True)  # Depth in kilometers
    event_time = Column(DateTime(timezone=True), nullable=True)
    location_name = Column(String(255), nullable=True)
    source = Column(String(100), nullable=True)  # e.g., 'PHIVOLCS', 'USGS'
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class LandslideData(Base):
    __tablename__ = "landslide_data"
    id = Column(Integer, primary_key=True, autoincrement=True)
    geometry = Column(Geometry('MULTIPOLYGON', srid=4326), nullable=False)
    risk_level = Column(Float, nullable=False)  # 1-3 scale for landslide risk


class WeatherData(Base):
    __tablename__ = "weather_data"
    id = Column(Integer, primary_key=True, autoincrement=True)
    geometry = Column(Geometry('POINT', srid=4326), nullable=False)
    temperature = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    rainfall = Column(Float, nullable=True)  # mm per hour
    wind_speed = Column(Float, nullable=True)
    wind_direction = Column(Float, nullable=True)
    pressure = Column(Float, nullable=True)
    station_name = Column(String(255), nullable=True)
    recorded_at = Column(DateTime(timezone=True), nullable=True)
    source = Column(String(100), nullable=True)  # e.g., 'PAGASA', 'weather_station'
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class EmergencyProtocol(Base):
    __tablename__ = "emergency_protocols"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    type = Column(String(100), nullable=False)  # e.g., 'flood', 'earthquake', 'landslide', 'general'
    description = Column(Text, nullable=True)
    steps = Column(JSON, nullable=True)  # PostgreSQL JSON type for array of steps
    status = Column(String(50), default='active')  # 'active', 'inactive', 'draft'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
