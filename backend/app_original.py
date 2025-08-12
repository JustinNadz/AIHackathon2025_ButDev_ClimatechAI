from flask import Flask, request, jsonify, send_from_directory
from db.queries import (
    get_flood_data_by_risk,
    get_landslide_data_by_risk,
    get_recent_weather_data,
    get_recent_earthquakes,
    get_earthquakes_by_magnitude,
    get_flood_risk_at_point,
    get_landslide_risk_at_point,
    get_recent_earthquakes_nearby,
    get_nearest_recent_weather
)
from vectordb.ingest import add_documents
from ai.rag import answer_with_rag
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


@app.route("/api/assistant/chat", methods=["POST"])
def assistant_chat():
    """RAG-powered assistant that combines hazards snapshot with retrieved guidance and LLM synthesis.

    Request JSON:
      { "lat": number, "lng": number, "question": string }
    Optional:
      hours_earthquake, eq_radius_km, weather_hours, weather_radius_km (forwarded to /api/assistant logic)
    """
    db = None
    try:
        payload = request.get_json(force=True) or {}
        lat = payload.get("lat")
        lng = payload.get("lng")
        question = payload.get("question") or "What should I do to prepare right now?"
        if lat is None or lng is None:
            return jsonify({"error": "lat and lng are required"}), 400

        # Reuse internal assistant functions to compute hazards
        hours_earthquake = int(payload.get("hours_earthquake", 24))
        eq_radius_km = float(payload.get("eq_radius_km", 100.0))
        weather_hours = int(payload.get("weather_hours", 3))
        weather_radius_km = float(payload.get("weather_radius_km", 100.0))

        db = SessionLocal()
        flood_risk = get_flood_risk_at_point(db, latitude=lat, longitude=lng)
        landslide_risk = get_landslide_risk_at_point(db, latitude=lat, longitude=lng)
        recent_eq = get_recent_earthquakes_nearby(db, latitude=lat, longitude=lng, hours=hours_earthquake, max_km=eq_radius_km)
        nearest_weather = get_nearest_recent_weather(db, latitude=lat, longitude=lng, hours=weather_hours, max_km=weather_radius_km)

        # Build a concise context string to inform the LLM
        context_lines = [
            f"Location: {lat:.5f}, {lng:.5f}",
            f"Flood risk: {flood_risk if flood_risk is not None else 'none'}",
            f"Landslide risk: {landslide_risk if landslide_risk is not None else 'none'}",
            f"Recent earthquakes (last {hours_earthquake}h, {eq_radius_km}km): {recent_eq}",
            f"Nearest weather (last {weather_hours}h, {weather_radius_km}km): {nearest_weather}",
        ]
        user_instruction = (
            "Given this situation, provide concise, prioritized recommendations for safety and preparedness. "
            "If evacuation is likely, list steps and what to bring. Use bullet points."
        )
        combined_question = (
            f"User question: {question}\n\n"
            f"{user_instruction}\n\n"
            "Context for your answer (do not ignore):\n" + "\n".join(context_lines)
        )

        # Retrieve guidance and answer
        advice = answer_with_rag(combined_question, collection_name="preparedness")

        return jsonify({
            "location": {"lat": lat, "lng": lng},
            "hazards": {
                "flood_risk": flood_risk,
                "landslide_risk": landslide_risk,
                "recent_earthquakes": recent_eq,
                "nearest_weather": nearest_weather,
            },
            "advice": advice,
        })
    except Exception as e:
        print(f"❌ Error in assistant_chat endpoint: {e}")
        print(f"📋 Traceback: {traceback.format_exc()}")
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500
    finally:
        if db:
            db.close()


# ============================================================================
# ASSISTANT ENDPOINT
# ============================================================================

@app.route("/api/assistant", methods=["POST"])
def assistant():
    """AI assistant: assess risks and provide recommendations for a given location.

    Request JSON:
      { "lat": number, "lng": number }
    Optional parameters:
      hours_earthquake: int (default 24)
      eq_radius_km: float (default 100)
      weather_hours: int (default 3)
      weather_radius_km: float (default 100)
    """
    db = None
    try:
        payload = request.get_json(force=True) or {}
        lat = payload.get("lat")
        lng = payload.get("lng")
        if lat is None or lng is None:
            return jsonify({"error": "lat and lng are required"}), 400

        hours_earthquake = int(payload.get("hours_earthquake", 24))
        eq_radius_km = float(payload.get("eq_radius_km", 100.0))
        weather_hours = int(payload.get("weather_hours", 3))
        weather_radius_km = float(payload.get("weather_radius_km", 100.0))

        db = SessionLocal()

        # Spatial checks
        flood_risk = get_flood_risk_at_point(db, latitude=lat, longitude=lng)
        landslide_risk = get_landslide_risk_at_point(db, latitude=lat, longitude=lng)
        recent_eq = get_recent_earthquakes_nearby(db, latitude=lat, longitude=lng, hours=hours_earthquake, max_km=eq_radius_km)
        nearest_weather = get_nearest_recent_weather(db, latitude=lat, longitude=lng, hours=weather_hours, max_km=weather_radius_km)

        # Heat assessment from weather
        heat_category = "unknown"
        if nearest_weather and nearest_weather.get("temperature") is not None and nearest_weather.get("humidity") is not None:
            t = nearest_weather["temperature"]
            rh = nearest_weather["humidity"]
            # Simple heat risk categorization
            if t >= 40 or (t >= 35 and rh >= 60):
                heat_category = "extreme"
            elif t >= 35 or (t >= 32 and rh >= 60):
                heat_category = "high"
            elif t >= 30:
                heat_category = "moderate"
            else:
                heat_category = "low"

        # Recommendation logic
        recommendations = []

        def risk_label(val):
            if val is None:
                return "none"
            if val <= 1.5:
                return "low"
            elif val <= 2.5:
                return "medium"
            return "high"

        flood_label = risk_label(flood_risk)
        landslide_label = risk_label(landslide_risk)

        if flood_label == "high":
            recommendations.append("You are in a high flood-risk area. Prepare emergency kit, move valuables to higher levels, and be ready to evacuate.")
        elif flood_label == "medium":
            recommendations.append("Medium flood risk detected. Monitor local advisories, identify evacuation routes, and secure important documents.")

        if landslide_label == "high":
            recommendations.append("High landslide risk area. Avoid steep slopes, monitor cracks/soil movement, and prepare to evacuate if heavy rains persist.")
        elif landslide_label == "medium":
            recommendations.append("Moderate landslide risk. Stay alert during prolonged rainfall and avoid unstable slopes.")

        if recent_eq:
            strongest = max(recent_eq, key=lambda e: (e["magnitude"] or 0))
            nearest = min(recent_eq, key=lambda e: (e["distance_km"] or 1e9))
            recommendations.append(
                f"Recent earthquake detected (M{strongest['magnitude']:.1f}) within {nearest['distance_km']:.1f} km. Check building integrity and aftershock advisories."
            )

        if nearest_weather:
            if (nearest_weather.get("rainfall") or 0) >= 10:
                recommendations.append("Heavy rain conditions nearby. Avoid flood-prone roads and monitor river levels.")
            if heat_category in ("high", "extreme"):
                recommendations.append("Heat risk elevated. Stay hydrated, avoid outdoor exertion at midday, and check on vulnerable individuals.")

        # Escalation to evacuation
        if flood_label == "high" or landslide_label == "high":
            recommendations.append("Consider evacuating to a safe shelter if conditions worsen or upon local authority guidance.")

        response = {
            "location": {"lat": lat, "lng": lng},
            "assessments": {
                "flood": {"risk_level": flood_risk, "category": flood_label},
                "landslide": {"risk_level": landslide_risk, "category": landslide_label},
                "earthquakes_recent": recent_eq,
                "weather_nearest": nearest_weather,
                "heat_category": heat_category,
            },
            "recommendations": recommendations or ["No immediate hazards detected. Maintain basic preparedness and follow local advisories."],
        }

        return jsonify(response)
    except Exception as e:
        print(f"❌ Error in assistant endpoint: {e}")
        print(f"📋 Traceback: {traceback.format_exc()}")
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500
    finally:
        if db:
            db.close()


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
# SEISMIC DATA ENDPOINTS
# ============================================================================

@app.route("/api/seismic-data", methods=["GET"])
def get_seismic_data():
    """Get seismic data for Google Maps"""
    db = None
    try:
        print("🌋 Starting seismic data request...")
        db = SessionLocal()
        
        # Get query parameters
        min_magnitude = request.args.get('min_magnitude', type=float)
        max_magnitude = request.args.get('max_magnitude', type=float)
        hours = request.args.get('hours', 24, type=int)
        limit = request.args.get('limit', 1000, type=int)
        
        print(f"📊 Query params: min_magnitude={min_magnitude}, max_magnitude={max_magnitude}, hours={hours}, limit={limit}")
        
        # Query seismic data
        print("🗄️ Querying seismic data from database...")
        if min_magnitude is not None or max_magnitude is not None:
            seismic_data = get_earthquakes_by_magnitude(db, min_magnitude=min_magnitude, max_magnitude=max_magnitude)
        else:
            seismic_data = get_recent_earthquakes(db, hours=hours)
        
        print(f"✅ Found {len(seismic_data)} seismic data records")
        
        if not seismic_data:
            return jsonify({
                "type": "FeatureCollection",
                "features": [],
                "total": 0,
                "message": "No seismic data found for the specified criteria."
            })
        
        # Convert to GeoJSON format for Google Maps
        features = []
        for i, data in enumerate(seismic_data[:limit]):
            try:
                print(f"🔄 Processing seismic record {i+1}/{min(len(seismic_data), limit)}")
                
                # Convert WKT to GeoJSON coordinates using engine connection
                with engine.connect() as conn:
                    result = conn.execute(text(f"SELECT ST_AsGeoJSON(geometry) FROM earthquake_data WHERE id = {data.id}"))
                    geojson_result = result.fetchone()
                    
                    if geojson_result is None or geojson_result[0] is None:
                        print(f"⚠️ No geometry found for seismic record {data.id}")
                        continue
                    
                    geojson = geojson_result[0]
                    geometry = json.loads(geojson)
                
                feature = {
                    "type": "Feature",
                    "geometry": geometry,
                    "properties": {
                        "id": data.id,
                        "magnitude": float(data.magnitude),
                        "depth": float(data.depth) if data.depth else None,
                        "location_name": data.location_name,
                        "event_time": data.event_time.isoformat() if data.event_time else None,
                        "source": data.source,
                        "magnitude_category": get_magnitude_category(data.magnitude),
                        "data_type": "seismic"
                    }
                }
                features.append(feature)
                
            except Exception as e:
                print(f"❌ Error processing seismic record {data.id}: {e}")
                continue
        
        print(f"✅ Successfully processed {len(features)} seismic features")
        
        geojson_response = {
            "type": "FeatureCollection",
            "features": features,
            "total": len(features)
        }
        
        return jsonify(geojson_response)
        
    except Exception as e:
        print(f"❌ Error in get_seismic_data: {e}")
        print(f"📋 Traceback: {traceback.format_exc()}")
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500
    
    finally:
        if db:
            db.close()


@app.route("/api/seismic-data/stats", methods=["GET"])
def get_seismic_stats():
    """Get seismic data statistics for dashboard"""
    db = None
    try:
        print("📊 Getting seismic data statistics...")
        db = SessionLocal()
        
        with engine.connect() as conn:
            # Get total count
            result = conn.execute(text("SELECT COUNT(*) FROM earthquake_data"))
            total_count = result.fetchone()[0]
            print(f"📈 Total seismic events: {total_count}")
            
            if total_count == 0:
                return jsonify({
                    "total_seismic_events": 0,
                    "magnitude_statistics": {
                        "min_magnitude": 0,
                        "max_magnitude": 0,
                        "avg_magnitude": 0
                    },
                    "depth_statistics": {
                        "min_depth": 0,
                        "max_depth": 0,
                        "avg_depth": 0
                    },
                    "magnitude_distribution": []
                })
            
            # Get magnitude statistics
            result = conn.execute(text("""
                SELECT 
                    MIN(magnitude) as min_magnitude,
                    MAX(magnitude) as max_magnitude,
                    AVG(magnitude) as avg_magnitude,
                    COUNT(*) as total
                FROM earthquake_data
            """))
            mag_stats = result.fetchone()
            
            # Get depth statistics
            result = conn.execute(text("""
                SELECT 
                    MIN(depth) as min_depth,
                    MAX(depth) as max_depth,
                    AVG(depth) as avg_depth
                FROM earthquake_data 
                WHERE depth IS NOT NULL
            """))
            depth_stats = result.fetchone()
            
            # Get magnitude distribution
            result = conn.execute(text("""
                SELECT 
                    CASE 
                        WHEN magnitude < 2.0 THEN 'Micro'
                        WHEN magnitude < 4.0 THEN 'Minor'
                        WHEN magnitude < 5.0 THEN 'Light'
                        WHEN magnitude < 6.0 THEN 'Moderate'
                        WHEN magnitude < 7.0 THEN 'Strong'
                        WHEN magnitude < 8.0 THEN 'Major'
                        ELSE 'Great'
                    END as category,
                    COUNT(*) as count
                FROM earthquake_data 
                GROUP BY category
                ORDER BY 
                    CASE category
                        WHEN 'Micro' THEN 1
                        WHEN 'Minor' THEN 2
                        WHEN 'Light' THEN 3
                        WHEN 'Moderate' THEN 4
                        WHEN 'Strong' THEN 5
                        WHEN 'Major' THEN 6
                        WHEN 'Great' THEN 7
                    END
            """))
            distribution = [{"category": row[0], "count": row[1]} for row in result.fetchall()]
        
        stats_response = {
            "total_seismic_events": total_count,
            "magnitude_statistics": {
                "min_magnitude": float(mag_stats[0]) if mag_stats[0] else 0,
                "max_magnitude": float(mag_stats[1]) if mag_stats[1] else 0,
                "avg_magnitude": float(mag_stats[2]) if mag_stats[2] else 0
            },
            "depth_statistics": {
                "min_depth": float(depth_stats[0]) if depth_stats[0] else 0,
                "max_depth": float(depth_stats[1]) if depth_stats[1] else 0,
                "avg_depth": float(depth_stats[2]) if depth_stats[2] else 0
            },
            "magnitude_distribution": distribution
        }
        
        print(f"✅ Seismic statistics calculated successfully")
        return jsonify(stats_response)
        
    except Exception as e:
        print(f"❌ Error in get_seismic_stats: {e}")
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


def get_magnitude_category(magnitude):
    """Convert magnitude to category for frontend styling"""
    try:
        magnitude = float(magnitude)
        if magnitude < 2.0:
            return "micro"
        elif magnitude < 4.0:
            return "minor"
        elif magnitude < 5.0:
            return "light"
        elif magnitude < 6.0:
            return "moderate"
        elif magnitude < 7.0:
            return "strong"
        elif magnitude < 8.0:
            return "major"
        else:
            return "great"
    except (ValueError, TypeError):
        return "unknown"


if __name__ == "__main__":
    app.run(debug=True)
