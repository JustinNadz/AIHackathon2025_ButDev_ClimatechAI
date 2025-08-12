from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
from database import Base

class WeatherData(Base):
    __tablename__ = "weather_data"
    
    id = Column(Integer, primary_key=True, index=True)
    location = Column(Geometry('POINT', srid=4326), nullable=False)
    temperature = Column(Float)
    humidity = Column(Float)
    pressure = Column(Float)
    wind_speed = Column(Float)
    wind_direction = Column(Float)
    precipitation = Column(Float)
    weather_condition = Column(String(100))
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class FloodData(Base):
    __tablename__ = "flood_data"
    
    id = Column(Integer, primary_key=True, index=True)
    geometry = Column(Geometry('MULTIPOLYGON', srid=4326), nullable=False)
    risk_value = Column(String(50))
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class LandslideData(Base):
    __tablename__ = "landslide_data"
    
    id = Column(Integer, primary_key=True, index=True)
    geometry = Column(Geometry('MULTIPOLYGON', srid=4326), nullable=False)
    risk_value = Column(String(50))
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class RiskAssessmentData(Base):
    __tablename__ = "risk_assessment_data"
    
    id = Column(Integer, primary_key=True, index=True)
    location = Column(Geometry('POINT', srid=4326), nullable=False)
    weather_data_id = Column(Integer, nullable=True)  # Reference to weather_data
    flood_risk = Column(String(50), nullable=True)
    landslide_risk = Column(String(50), nullable=True)
    ai_risk_score = Column(Integer, nullable=True)
    ai_risk_level = Column(String(50), nullable=True)  # low, medium, high, critical
    ai_assessment_summary = Column(Text, nullable=True)
    ai_recommendations = Column(Text, nullable=True)
    ai_factors = Column(Text, nullable=True)  # JSON string of contributing factors
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
