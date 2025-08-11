import os
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/flood_db")
CHROMA_DB_DIR = os.getenv("CHROMA_DB_DIR", "./chroma_store")
