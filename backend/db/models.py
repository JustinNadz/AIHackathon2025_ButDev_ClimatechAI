from sqlalchemy import Column, Integer, Text, Float
from geoalchemy2 import Geometry
from .base import Base


class ChatHistory(Base):
    __tablename__ = "chat_history"
    id = Column(Integer, primary_key=True, autoincrement=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)


class FloodData(Base):
    __tablename__ = "flood_data"
    id = Column(Integer, primary_key=True, autoincrement=True)
    geometry = Column(Geometry('MULTIPOLYGON', srid=4326), nullable=False)
    risk_level = Column(Float, nullable=False)
