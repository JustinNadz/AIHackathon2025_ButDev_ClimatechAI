from flask import Flask, request, jsonify, send_from_directory
from db.queries import (
    get_flood_data_by_risk,
    get_landslide_data_by_risk,
    get_recent_weather_data
)
from vectordb.ingest import add_documents
from db.setup import setup_database
from db.base import SessionLocal, engine
from sqlalchemy import text
import json
import traceback

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


# ============================================================================
# FLOOD DATA ENDPOINTS
# ============================================================================

@app.route("/api/flood-data", methods=["GET"])
def get_flood_data():
    """Get all flood data for Google Maps"""
    db = None
    try:
        print("🔍 Starting flood data request...")
        db = SessionLocal()
        
        # Get query parameters
        min_risk = request.args.get('min_risk', type=float)
        max_risk = request.args.get('max_risk', type=float)
        limit = request.args.get('limit', 1000, type=int)
        
        print(f"📊 Query params: min_risk={min_risk}, max_risk={max_risk}, limit={limit}")
        
        # Query flood data
        print("🗄️ Querying flood data from database...")
        flood_data = get_flood_data_by_risk(db, min_risk=min_risk, max_risk=max_risk)
        print(f"✅ Found {len(flood_data)} flood data records")
        
        if not flood_data:
            return jsonify({
                "type": "FeatureCollection",
                "features": [],
                "total": 0,
                "message": "No flood data found for the specified risk range."
            })
        
        # Convert to GeoJSON format for Google Maps
        features = []
        for i, data in enumerate(flood_data[:limit]):
            try:
                print(f"🔄 Processing record {i+1}/{min(len(flood_data), limit)}")
                
                # Convert WKT to GeoJSON coordinates using engine connection
                with engine.connect() as conn:
                    result = conn.execute(text(f"SELECT ST_AsGeoJSON(geometry) FROM flood_data WHERE id = {data.id}"))
                    geojson_result = result.fetchone()
                    
                    if geojson_result is None or geojson_result[0] is None:
                        print(f"⚠️ No geometry found for record {data.id}")
                        continue
                    
                    geojson = geojson_result[0]
                    geometry = json.loads(geojson)
                
                feature = {
                    "type": "Feature",
                    "geometry": geometry,
                    "properties": {
                        "id": data.id,
                        "risk_level": float(data.risk_level),
                        "risk_category": get_risk_category(data.risk_level),
                        "data_type": "flood"
                    }
                }
                features.append(feature)
                
            except Exception as e:
                print(f"❌ Error processing record {data.id}: {e}")
                continue
        
        print(f"✅ Successfully processed {len(features)} features")
        
        geojson_response = {
            "type": "FeatureCollection",
            "features": features,
            "total": len(features)
        }
        
        return jsonify(geojson_response)
        
    except Exception as e:
        print(f"❌ Error in get_flood_data: {e}")
        print(f"📋 Traceback: {traceback.format_exc()}")
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500
    
    finally:
        if db:
            db.close()


@app.route("/api/flood-data/stats", methods=["GET"])
def get_flood_stats():
    """Get flood data statistics for dashboard"""
    db = None
    try:
        print("📊 Getting flood data statistics...")
        db = SessionLocal()
        
        with engine.connect() as conn:
            # Get total count
            result = conn.execute(text("SELECT COUNT(*) FROM flood_data"))
            total_count = result.fetchone()[0]
            print(f"📈 Total flood areas: {total_count}")
            
            if total_count == 0:
                return jsonify({
                    "total_flood_areas": 0,
                    "risk_statistics": {
                        "min_risk": 0,
                        "max_risk": 0,
                        "avg_risk": 0
                    },
                    "risk_distribution": []
                })
            
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
            distribution = [{"risk_level": float(row[0]), "count": row[1]} for row in result.fetchall()]
        
        stats_response = {
            "total_flood_areas": total_count,
            "risk_statistics": {
                "min_risk": float(stats[0]) if stats[0] else 0,
                "max_risk": float(stats[1]) if stats[1] else 0,
                "avg_risk": float(stats[2]) if stats[2] else 0
            },
            "risk_distribution": distribution
        }
        
        print(f"✅ Statistics calculated successfully")
        return jsonify(stats_response)
        
    except Exception as e:
        print(f"❌ Error in get_flood_stats: {e}")
        print(f"📋 Traceback: {traceback.format_exc()}")
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500
    
    finally:
        if db:
            db.close()


# ============================================================================
# LANDSLIDE DATA ENDPOINTS
# ============================================================================

@app.route("/api/landslide-data", methods=["GET"])
def get_landslide_data():
    """Get all landslide data for Google Maps"""
    db = None
    try:
        print("🏔️ Starting landslide data request...")
        db = SessionLocal()
        
        # Get query parameters
        min_risk = request.args.get('min_risk', type=float)
        max_risk = request.args.get('max_risk', type=float)
        limit = request.args.get('limit', 1000, type=int)
        
        print(f"📊 Query params: min_risk={min_risk}, max_risk={max_risk}, limit={limit}")
        
        # Query landslide data
        print("🗄️ Querying landslide data from database...")
        landslide_data = get_landslide_data_by_risk(db, min_risk=min_risk, max_risk=max_risk)
        print(f"✅ Found {len(landslide_data)} landslide data records")
        
        if not landslide_data:
            return jsonify({
                "type": "FeatureCollection",
                "features": [],
                "total": 0,
                "message": "No landslide data found for the specified risk range."
            })
        
        # Convert to GeoJSON format for Google Maps
        features = []
        for i, data in enumerate(landslide_data[:limit]):
            try:
                print(f"🔄 Processing landslide record {i+1}/{min(len(landslide_data), limit)}")
                
                # Convert WKT to GeoJSON coordinates using engine connection
                with engine.connect() as conn:
                    result = conn.execute(text(f"SELECT ST_AsGeoJSON(geometry) FROM landslide_data WHERE id = {data.id}"))
                    geojson_result = result.fetchone()
                    
                    if geojson_result is None or geojson_result[0] is None:
                        print(f"⚠️ No geometry found for landslide record {data.id}")
                        continue
                    
                    geojson = geojson_result[0]
                    geometry = json.loads(geojson)
                
                feature = {
                    "type": "Feature",
                    "geometry": geometry,
                    "properties": {
                        "id": data.id,
                        "risk_level": float(data.risk_level),
                        "risk_category": get_risk_category(data.risk_level),
                        "data_type": "landslide"
                    }
                }
                features.append(feature)
                
            except Exception as e:
                print(f"❌ Error processing landslide record {data.id}: {e}")
                continue
        
        print(f"✅ Successfully processed {len(features)} landslide features")
        
        geojson_response = {
            "type": "FeatureCollection",
            "features": features,
            "total": len(features)
        }
        
        return jsonify(geojson_response)
        
    except Exception as e:
        print(f"❌ Error in get_landslide_data: {e}")
        print(f"📋 Traceback: {traceback.format_exc()}")
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500
    
    finally:
        if db:
            db.close()


@app.route("/api/landslide-data/stats", methods=["GET"])
def get_landslide_stats():
    """Get landslide data statistics for dashboard"""
    db = None
    try:
        print("📊 Getting landslide data statistics...")
        db = SessionLocal()
        
        with engine.connect() as conn:
            # Get total count
            result = conn.execute(text("SELECT COUNT(*) FROM landslide_data"))
            total_count = result.fetchone()[0]
            print(f"📈 Total landslide areas: {total_count}")
            
            if total_count == 0:
                return jsonify({
                    "total_landslide_areas": 0,
                    "risk_statistics": {
                        "min_risk": 0,
                        "max_risk": 0,
                        "avg_risk": 0
                    },
                    "risk_distribution": []
                })
            
            # Get risk level statistics
            result = conn.execute(text("""
                SELECT 
                    MIN(risk_level) as min_risk,
                    MAX(risk_level) as max_risk,
                    AVG(risk_level) as avg_risk,
                    COUNT(*) as total
                FROM landslide_data
            """))
            stats = result.fetchone()
            
            # Get risk level distribution
            result = conn.execute(text("""
                SELECT 
                    risk_level,
                    COUNT(*) as count
                FROM landslide_data 
                GROUP BY risk_level 
                ORDER BY risk_level
            """))
            distribution = [{"risk_level": float(row[0]), "count": row[1]} for row in result.fetchall()]
        
        stats_response = {
            "total_landslide_areas": total_count,
            "risk_statistics": {
                "min_risk": float(stats[0]) if stats[0] else 0,
                "max_risk": float(stats[1]) if stats[1] else 0,
                "avg_risk": float(stats[2]) if stats[2] else 0
            },
            "risk_distribution": distribution
        }
        
        print(f"✅ Landslide statistics calculated successfully")
        return jsonify(stats_response)
        
    except Exception as e:
        print(f"❌ Error in get_landslide_stats: {e}")
        print(f"📋 Traceback: {traceback.format_exc()}")
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500
    
    finally:
        if db:
            db.close()


# ============================================================================
# WEATHER DATA ENDPOINTS
# ============================================================================

@app.route("/api/weather-data", methods=["GET"])
def get_weather_data():
    """Get weather data for Google Maps"""
    db = None
    try:
        print("🌤️ Starting weather data request...")
        db = SessionLocal()
        
        # Get query parameters
        hours = request.args.get('hours', 1, type=int)
        limit = request.args.get('limit', 1000, type=int)
        station_name = request.args.get('station')
        
        print(f"📊 Query params: hours={hours}, limit={limit}, station={station_name}")
        
        # Query weather data
        print("🗄️ Querying weather data from database...")
        weather_data = get_recent_weather_data(db, hours=hours)
        print(f"✅ Found {len(weather_data)} weather data records")
        
        if not weather_data:
            return jsonify({
                "type": "FeatureCollection",
                "features": [],
                "total": 0,
                "message": "No weather data found for the specified time range."
            })
        
        # Convert to GeoJSON format for Google Maps
        features = []
        for i, data in enumerate(weather_data[:limit]):
            try:
                print(f"🔄 Processing weather record {i+1}/{min(len(weather_data), limit)}")
                
                # Convert WKT to GeoJSON coordinates using engine connection
                with engine.connect() as conn:
                    result = conn.execute(text(f"SELECT ST_AsGeoJSON(geometry) FROM weather_data WHERE id = {data.id}"))
                    geojson_result = result.fetchone()
                    
                    if geojson_result is None or geojson_result[0] is None:
                        print(f"⚠️ No geometry found for weather record {data.id}")
                        continue
                    
                    geojson = geojson_result[0]
                    geometry = json.loads(geojson)
                
                feature = {
                    "type": "Feature",
                    "geometry": geometry,
                    "properties": {
                        "id": data.id,
                        "temperature": float(data.temperature) if data.temperature else None,
                        "humidity": float(data.humidity) if data.humidity else None,
                        "rainfall": float(data.rainfall) if data.rainfall else None,
                        "wind_speed": float(data.wind_speed) if data.wind_speed else None,
                        "wind_direction": float(data.wind_direction) if data.wind_direction else None,
                        "pressure": float(data.pressure) if data.pressure else None,
                        "station_name": data.station_name,
                        "recorded_at": data.recorded_at.isoformat() if data.recorded_at else None,
                        "source": data.source,
                        "data_type": "weather"
                    }
                }
                features.append(feature)
                
            except Exception as e:
                print(f"❌ Error processing weather record {data.id}: {e}")
                continue
        
        print(f"✅ Successfully processed {len(features)} weather features")
        
        geojson_response = {
            "type": "FeatureCollection",
            "features": features,
            "total": len(features)
        }
        
        return jsonify(geojson_response)
        
    except Exception as e:
        print(f"❌ Error in get_weather_data: {e}")
        print(f"📋 Traceback: {traceback.format_exc()}")
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500
    
    finally:
        if db:
            db.close()


@app.route("/api/weather-data/stats", methods=["GET"])
def get_weather_stats():
    """Get weather data statistics for dashboard"""
    db = None
    try:
        print("📊 Getting weather data statistics...")
        db = SessionLocal()
        
        with engine.connect() as conn:
            # Get total count
            result = conn.execute(text("SELECT COUNT(*) FROM weather_data"))
            total_count = result.fetchone()[0]
            print(f"📈 Total weather stations: {total_count}")
            
            if total_count == 0:
                return jsonify({
                    "total_weather_stations": 0,
                    "temperature_statistics": {
                        "min_temp": 0,
                        "max_temp": 0,
                        "avg_temp": 0
                    },
                    "rainfall_statistics": {
                        "total_rainfall": 0,
                        "avg_rainfall": 0
                    }
                })
            
            # Get temperature statistics
            result = conn.execute(text("""
                SELECT 
                    MIN(temperature) as min_temp,
                    MAX(temperature) as max_temp,
                    AVG(temperature) as avg_temp
                FROM weather_data 
                WHERE temperature IS NOT NULL
            """))
            temp_stats = result.fetchone()
            
            # Get rainfall statistics
            result = conn.execute(text("""
                SELECT 
                    SUM(rainfall) as total_rainfall,
                    AVG(rainfall) as avg_rainfall
                FROM weather_data 
                WHERE rainfall IS NOT NULL
            """))
            rain_stats = result.fetchone()
            
            # Get station count
            result = conn.execute(text("""
                SELECT COUNT(DISTINCT station_name) as unique_stations
                FROM weather_data 
                WHERE station_name IS NOT NULL
            """))
            station_count = result.fetchone()[0]
        
        stats_response = {
            "total_weather_stations": total_count,
            "unique_stations": station_count,
            "temperature_statistics": {
                "min_temp": float(temp_stats[0]) if temp_stats[0] else 0,
                "max_temp": float(temp_stats[1]) if temp_stats[1] else 0,
                "avg_temp": float(temp_stats[2]) if temp_stats[2] else 0
            },
            "rainfall_statistics": {
                "total_rainfall": float(rain_stats[0]) if rain_stats[0] else 0,
                "avg_rainfall": float(rain_stats[1]) if rain_stats[1] else 0
            }
        }
        
        print(f"✅ Weather statistics calculated successfully")
        return jsonify(stats_response)
        
    except Exception as e:
        print(f"❌ Error in get_weather_stats: {e}")
        print(f"📋 Traceback: {traceback.format_exc()}")
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500
    
    finally:
        if db:
            db.close()


# ============================================================================
# EARTHQUAKE DATA ENDPOINTS
# ============================================================================

@app.route("/api/earthquake-data", methods=["GET"])
def get_earthquake_data():
    pass


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_risk_category(risk_level):
    """Convert risk level to category for frontend styling"""
    try:
        risk_level = float(risk_level)
        if risk_level <= 1.5:
            return "low"
        elif risk_level <= 2.5:
            return "medium"
        else:
            return "high"
    except (ValueError, TypeError):
        return "unknown"


if __name__ == "__main__":
    app.run(debug=True)
