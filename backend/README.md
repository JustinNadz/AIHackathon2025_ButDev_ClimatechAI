# Backend – Disaster Data Management System

This backend provides geospatial APIs (PostgreSQL + PostGIS) for flood, landslide, seismic, and weather data, plus an AI assistant (RAG + Gemma-3). It also serves a simple test map UI.

## Prerequisites
- PostgreSQL 12+ with PostGIS 3+
- Python 3.8+
- Recommended: sentence-transformers (for local embeddings)
- API keys/env (as needed):
  - `GOOGLE_MAPS_API_KEY` (Google Maps + Weather API)
  - `OPENROUTER_API_KEY` (for Gemma-3 via OpenRouter)

## Setup
```bash
cd backend
pip install -r requirements.txt
```

Create `.env` in `backend/`:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/climatech
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
OPENROUTER_API_KEY=your_openrouter_key_if_using_llm
CHROMA_DB_DIR=./chroma_store
```

Initialize DB (creates tables and sample data):
```bash
python init_db.py
```

Optional: Full refresh (drops, recreates, repopulates):
```bash
python refresh_database.py
```

## Run the API
```bash
python app.py
# → http://localhost:5000
```

Open test map UI:
- `http://localhost:5000` (loads `static/map_example.html`)

## Ingestion

Flood (Shapefile):
```bash
python run_ingestions.py flood path/to/flood_zones.shp
# Optional: --risk-column Var (default)
```

Landslide (Shapefile):
```bash
python run_ingestions.py landslide path/to/landslide_zones.shp
# Optional: --risk-column HAZ (or LH as per your data)
```

Seismic (CSV):
```bash
python run_ingestions.py seismic path/to/earthquakes.csv
# Optional: --validate-only  --date-format "%Y-%m-%d %H:%M:%S"
```

Weather (API):
```bash
# Single location (preferred)
python run_ingestions.py weather --mode single --lat 14.5995 --lng 120.9842

# Major cities
python run_ingestions.py weather --mode cities
```

## Key API Endpoints

Flood:
- `GET /api/flood-data?min_risk&max_risk&limit&simplify_tolerance&precision`
- `GET /api/flood-data/stats`

Landslide:
- `GET /api/landslide-data?min_risk&max_risk&limit`
- `GET /api/landslide-data/stats`

Seismic:
- `GET /api/seismic-data?min_magnitude&max_magnitude` or `?hours`
- `GET /api/seismic-data/stats`

Weather:
- `GET /api/weather-data?hours`
- `GET /api/weather-data/stats`

Assistant:
- Hazard snapshot: `POST /api/assistant`
  - Body: `{ "lat": number, "lng": number, "hours_earthquake?": int, "eq_radius_km?": number, "weather_hours?": int, "weather_radius_km?": number }`
- RAG + LLM: `POST /api/assistant/chat`
  - Body: `{ "lat": number, "lng": number, "question": string, ...same optional knobs }`

## Quick Tests

Hazard-only assistant (Manila):
```bash
curl -s -X POST http://localhost:5000/api/assistant \
  -H "Content-Type: application/json" \
  -d '{"lat":14.5995,"lng":120.9842}' | jq
```

RAG assistant (Gemma-3 via OpenRouter):
```bash
# Ingest some guidance first
curl -s -X POST http://localhost:5000/ingest \
  -H "Content-Type: application/json" \
  -d '{"texts":[
    "Flood prep: move valuables up, prepare go-bag, avoid crossing fast water.",
    "Landslide prep: avoid steep slopes during heavy rain, evacuate if cracks appear.",
    "Heat risk: hydrate, avoid midday labor, check elderly, seek shade/cooling center."
  ]}'

# Ask for advice
curl -s -X POST http://localhost:5000/api/assistant/chat \
  -H "Content-Type: application/json" \
  -d '{"lat":14.5995,"lng":120.9842,"question":"What should I do right now?"}' | jq
```

## Tips for Large Geometries
- Use simplification/precision to reduce payload & render time:
```bash
curl -s "http://localhost:5000/api/flood-data?simplify_tolerance=0.0005&precision=5" | jq '.total'
```
- Keep `limit` low when testing large datasets.

## Troubleshooting
- DB/connection errors: ensure PostgreSQL is running, `DATABASE_URL` is correct, and PostGIS is enabled.
- Weather empty: ingest via weather modes or ensure API key.
- RAG errors: install HF embeddings or set `OPENROUTER_API_KEY`.
  - Recommended install: `pip install sentence-transformers`
- Google Maps not loading in UI: verify `GOOGLE_MAPS_API_KEY` and Maps JavaScript API enabled.

## Project Structure (backend/)
```
backend/
├── app.py                 # Flask app & endpoints
├── init_db.py             # DB initialization
├── refresh_database.py    # Drop/recreate plus sample data
├── run_ingestions.py      # CLI ingestors (flood/landslide/seismic/weather)
├── db/                    # SQLAlchemy models, queries, setup
├── ingest/                # Ingestion modules
├── ai/                    # LLM + RAG helpers
├── vectordb/              # Vector store & ingestion for RAG
├── static/                # Test map UI (map_example.html)
└── requirements.txt       # Python deps
```


