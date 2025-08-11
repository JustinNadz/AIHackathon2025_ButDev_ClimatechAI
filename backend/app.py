from flask import Flask, request, jsonify, send_from_directory
from db.queries import get_flood_data_by_risk, get_flood_data_within_bounds
from vectordb.ingest import add_documents
from db.setup import setup_database
from db.base import SessionLocal, engine
from sqlalchemy import text
import json
import os

# Setup database with PostGIS
setup_database()

app = Flask(__name__, static_folder='static')


@app.route("/")
def index():
    """Serve the map example"""
    return send_from_directory('static', 'map_example.html')


@app.route("/ingest", methods=["POST"])
def ingest():
    texts = request.json.get("texts", [])
    if not texts:
        return jsonify({"error": "No texts provided"}), 400
    count = add_documents(texts)
    return jsonify({"message": f"Added {count} chunks"})


@app.route("/api/flood-data", methods=["GET"])
def get_flood_data():
    """Get all flood data for Google Maps"""
    try:
        db = SessionLocal()
        
        # Get query parameters
        min_risk = request.args.get('min_risk', type=float)
        max_risk = request.args.get('max_risk', type=float)
        limit = request.args.get('limit', 1000, type=int)
        
        # Query flood data
        flood_data = get_flood_data_by_risk(db, min_risk=min_risk, max_risk=max_risk)
        
        # Convert to GeoJSON format for Google Maps
        features = []
        for data in flood_data[:limit]:
            # Convert WKT to GeoJSON coordinates using engine connection
            with engine.connect() as conn:
                result = conn.execute(text(f"SELECT ST_AsGeoJSON(geometry) FROM flood_data WHERE id = {data.id}"))
                geojson = result.fetchone()[0]
                geometry = json.loads(geojson)
            
            feature = {
                "type": "Feature",
                "geometry": geometry,
                "properties": {
                    "id": data.id,
                    "risk_level": data.risk_level,
                    "risk_category": get_risk_category(data.risk_level)
                }
            }
            features.append(feature)
        
        geojson_response = {
            "type": "FeatureCollection",
            "features": features,
            "total": len(features)
        }
        
        db.close()
        return jsonify(geojson_response)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/flood-data/stats", methods=["GET"])
def get_flood_stats():
    """Get flood data statistics for dashboard"""
    try:
        db = SessionLocal()
        
        with engine.connect() as conn:
            # Get total count
            result = conn.execute(text("SELECT COUNT(*) FROM flood_data"))
            total_count = result.fetchone()[0]
            
            # Get risk level statistics
            result = conn.execute(text("""
                SELECT 
                    MIN(risk_level) as min_risk,
                    MAX(risk_level) as max_risk,
                    AVG(risk_level) as avg_risk,
                    COUNT(*) as total
                FROM flood_data
            """))
            stats = result.fetchone()
            
            # Get risk level distribution
            result = conn.execute(text("""
                SELECT 
                    risk_level,
                    COUNT(*) as count
                FROM flood_data 
                GROUP BY risk_level 
                ORDER BY risk_level
            """))
            distribution = [{"risk_level": row[0], "count": row[1]} for row in result.fetchall()]
        
        stats_response = {
            "total_flood_areas": total_count,
            "risk_statistics": {
                "min_risk": float(stats[0]) if stats[0] else 0,
                "max_risk": float(stats[1]) if stats[1] else 0,
                "avg_risk": float(stats[2]) if stats[2] else 0
            },
            "risk_distribution": distribution
        }
        
        db.close()
        return jsonify(stats_response)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def get_risk_category(risk_level):
    """Convert risk level to category for frontend styling"""
    if risk_level <= 1.5:
        return "low"
    elif risk_level <= 2.5:
        return "medium"
    else:
        return "high"


if __name__ == "__main__":
    app.run(debug=True)
