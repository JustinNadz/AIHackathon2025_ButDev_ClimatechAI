from sqlalchemy.orm import Session
from sqlalchemy import text
from .models import FloodData, ChatHistory
from shapely.geometry import shape
import json


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


def add_chat_history(db: Session, question: str, answer: str):
    """Add chat history to the database"""
    chat_history = ChatHistory(question=question, answer=answer)
    db.add(chat_history)
    db.commit()
    db.refresh(chat_history)
    return chat_history


def get_chat_history(db: Session, limit: int = 10):
    """Get recent chat history"""
    return db.query(ChatHistory).order_by(ChatHistory.id.desc()).limit(limit).all()
