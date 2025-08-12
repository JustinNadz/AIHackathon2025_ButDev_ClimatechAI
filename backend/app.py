from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from db.queries import (
    get_flood_data_by_risk,
    get_landslide_data_by_risk,
    get_recent_weather_data,
    get_recent_earthquakes,
    get_earthquakes_by_magnitude,
    get_flood_risk_at_point,
    get_landslide_risk_at_point,
    get_recent_earthquakes_nearby,
    get_nearest_recent_weather,
    get_landslide_data_nearby,
    get_all_emergency_protocols,
    get_emergency_protocol_by_id,
    get_emergency_protocols_by_type,
    create_emergency_protocol,
    update_emergency_protocol,
    delete_emergency_protocol
)
from vectordb.ingest import add_documents
from ai.rag import answer_with_rag
from ai.base_model import get_base_model  # Import our new base model
from db.setup import setup_database
from db.base import SessionLocal, engine
from sqlalchemy import text
import json
import traceback
from datetime import datetime

# Setup database with PostGIS
setup_database()

app = Flask(__name__, static_folder='static')
CORS(app)  # Enable CORS for all routes

# Enable CORS for all routes
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"])


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
# ENHANCED AI ASSISTANT ENDPOINT (Base Model + RAG Support)
# ============================================================================

@app.route("/api/assistant/enhanced", methods=["POST"])
def enhanced_assistant():
    """Enhanced AI assistant using google/gemma-3-27b-it:free as primary model with RAG backup.
    
    This endpoint provides intelligent climate and disaster advice using:
    1. Primary: google/gemma-3-27b-it:free model for natural language understanding
    2. Backup: RAG system with embedded knowledge base
    3. Real-time hazard data integration
    
    Request JSON:
      { "lat": number, "lng": number, "question": string }
    Optional parameters:
      hours_earthquake: int (default 24)
      eq_radius_km: float (default 100)
      weather_hours: int (default 3)
      weather_radius_km: float (default 100)
      use_rag_fallback: bool (default true)
    """
    db = None
    try:
        payload = request.get_json(force=True) or {}
        lat = payload.get("lat")
        lng = payload.get("lng")
        question = payload.get("question") or "What should I do to prepare for potential climate hazards in this area?"
        
        # Location is now optional - we can handle general questions too
        has_location = lat is not None and lng is not None

        # Configuration parameters
        hours_earthquake = int(payload.get("hours_earthquake", 24))
        eq_radius_km = float(payload.get("eq_radius_km", 100.0))
        weather_hours = int(payload.get("weather_hours", 3))
        weather_radius_km = float(payload.get("weather_radius_km", 100.0))
        use_rag_fallback = payload.get("use_rag_fallback", True)

        print(f"🤖 Enhanced Assistant Request: {question}" + (f" at ({lat:.5f}, {lng:.5f})" if has_location else " (general question)"))

        # Fast greeting detection for quick responses
        greeting_words = ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "greetings", "hola", "bonjour"]
        question_lower = question.lower().strip()
        
        # Check if the question is a simple greeting
        is_greeting = any(greeting in question_lower for greeting in greeting_words) and len(question.split()) <= 3
        
        # Check for questions about development/creator
        developer_keywords = ["who developed", "who created", "who made", "who built", "your developer", "your creator", "who are you made by", "development team", "your team"]
        is_developer_question = any(keyword in question_lower for keyword in developer_keywords)
        
        # Check for location-specific questions that should trigger map interaction
        philippine_cities = {
            "manila": {"lat": 14.5995, "lng": 120.9842},
            "quezon city": {"lat": 14.6760, "lng": 121.0437},
            "cebu city": {"lat": 10.3157, "lng": 123.8854},
            "cebu": {"lat": 10.3157, "lng": 123.8854},
            "davao city": {"lat": 7.1907, "lng": 125.4553},
            "davao": {"lat": 7.1907, "lng": 125.4553},
            "iloilo city": {"lat": 10.7202, "lng": 122.5621},
            "iloilo": {"lat": 10.7202, "lng": 122.5621},
            "baguio": {"lat": 16.4023, "lng": 120.5960},
            "zamboanga city": {"lat": 6.9214, "lng": 122.0790},
            "zamboanga": {"lat": 6.9214, "lng": 122.0790},
            "cagayan de oro": {"lat": 8.4542, "lng": 124.6319},
            "general santos": {"lat": 6.1164, "lng": 125.1716}
        }
        
        detected_city = None
        for city_name, coords in philippine_cities.items():
            if city_name in question_lower:
                detected_city = {"name": city_name.title(), "coords": coords}
                break
        
        # Check for weather-specific questions about cities
        weather_keywords = ["weather", "temperature", "rain", "rainfall", "humidity", "wind"]
        is_weather_question = any(keyword in question_lower for keyword in weather_keywords)
        
        if detected_city and is_weather_question:
            # Handle city-specific weather questions with real database data
            try:
                print(f"🌤️ Weather question detected for {detected_city['name']}")
                
                db = SessionLocal()
                # Get real weather data for the detected city
                lat, lng = detected_city['coords']['lat'], detected_city['coords']['lng']
                nearest_weather = get_nearest_recent_weather(db, latitude=lat, longitude=lng, hours=24, max_km=10.0)
                
                if nearest_weather:
                    # Create response with real weather data
                    temp = nearest_weather.get("temperature")
                    humidity = nearest_weather.get("humidity")
                    rainfall = nearest_weather.get("rainfall", 0)
                    wind_speed = nearest_weather.get("wind_speed")
                    station_name = nearest_weather.get("station_name", f"{detected_city['name']} Station")
                    recorded_time = nearest_weather.get("recorded_at")
                    
                    weather_response = f"""🌤️ **Current Weather in {detected_city['name']}**

**Real-time Data from {station_name}:**"""
                    
                    if temp is not None:
                        weather_response += f"\n🌡️ **Temperature:** {temp:.1f}°C"
                    
                    if humidity is not None:
                        weather_response += f"\n💧 **Humidity:** {humidity:.0f}%"
                    
                    if rainfall > 0:
                        weather_response += f"\n🌧️ **Rainfall:** {rainfall:.1f}mm/h"
                    else:
                        weather_response += f"\n☀️ **Rainfall:** No rain currently"
                    
                    if wind_speed is not None:
                        weather_response += f"\n💨 **Wind Speed:** {wind_speed:.1f}km/h"
                    
                    if recorded_time:
                        try:
                            # recorded_time is already an ISO string from the database query
                            # Parse it back to datetime for formatting, or use as-is
                            from datetime import datetime
                            if isinstance(recorded_time, str):
                                # Parse ISO string back to datetime
                                parsed_time = datetime.fromisoformat(recorded_time.replace('Z', '+00:00') if recorded_time.endswith('Z') else recorded_time)
                                weather_response += f"\n⏰ **Last Updated:** {parsed_time.strftime('%B %d, %Y at %I:%M %p')}"
                            else:
                                # If it's already a datetime object
                                weather_response += f"\n⏰ **Last Updated:** {recorded_time.strftime('%B %d, %Y at %I:%M %p')}"
                        except (ValueError, TypeError):
                            # If parsing fails, just show the raw timestamp
                            weather_response += f"\n⏰ **Last Updated:** {recorded_time}"
                    
                    weather_response += f"""

**Safety Notes for {detected_city['name']}:**
• Monitor weather conditions regularly
• Stay updated with local advisories
• Keep emergency contacts handy
• Report any unusual weather to local authorities

*Weather data from ClimaTech database | Developed by ButDev Team for AI Hackathon 2025*"""
                
                else:
                    weather_response = f"""🌤️ **Weather Information for {detected_city['name']}**

Unfortunately, I don't have current weather data for {detected_city['name']} in my database at the moment.

**What you can do:**
• Check [PAGASA Weather](https://www.pagasa.dost.gov.ph/) for official updates
• Monitor local weather stations
• Use weather apps for real-time conditions

I'll continue to monitor and update our database. Try asking again later!

*Developed by ButDev Team for AI Hackathon 2025*"""
                
                return jsonify({
                    "location": {"lat": lat, "lng": lng},
                    "question": question,
                    "hazards": {
                        "flood_risk": None,
                        "landslide_risk": None,
                        "recent_earthquakes": 0,
                        "earthquake_details": [],
                        "weather": nearest_weather,
                    },
                    "response": weather_response,
                    "model_used": "city_weather_database",
                    "context_provided": [f"🌤️ Real weather data for {detected_city['name']}"],
                    "timestamp": json.loads(json.dumps({"timestamp": None}, default=str)),
                    "detected_city": detected_city,
                    "is_floating_response": True  # Signal frontend to use floating chat
                })
                
            except Exception as weather_error:
                print(f"❌ Error getting weather for {detected_city['name']}: {weather_error}")
            finally:
                if 'db' in locals():
                    db.close()
        
        if is_greeting:
            # Provide fast greeting response
            greeting_response = """Hi there! 👋 I'm ClimatechAI, your personal climate and disaster preparedness assistant for the Philippines.

I was developed by the **ButDev Team** for the **AI Hackathon 2025** to help keep you safe from natural disasters and climate risks.

I can help you with:
🌊 Flood risk assessment and safety tips
🏔️ Landslide hazard information  
🌋 Earthquake monitoring and preparedness
🌤️ Weather-based risk analysis
🚨 Emergency preparedness guidance

Feel free to ask me about climate risks at your location, or click anywhere on the map to get a detailed safety assessment for that area!

How can I help keep you safe today?"""
            
            return jsonify({
                "location": {"lat": lat, "lng": lng} if has_location else None,
                "question": question,
                "hazards": {
                    "flood_risk": None,
                    "landslide_risk": None,
                    "recent_earthquakes": 0,
                    "earthquake_details": [],
                    "weather": None,
                },
                "response": greeting_response,
                "model_used": "fast_greeting_response",
                "context_provided": ["🚀 Fast greeting response - no hazard data needed"],
                "timestamp": json.loads(json.dumps({"timestamp": None}, default=str)),
                "detected_city": detected_city
            })
        
        if is_developer_question:
            # Provide fast developer information response
            developer_response = """I am **ClimatechAI**, an advanced climate and disaster preparedness assistant specifically designed for the Philippines! 🇵🇭

**👥 Development Team:** I was created by the **ButDev Team** as part of the **AI Hackathon 2025**

**🎯 My Mission:** To help protect lives and communities by providing real-time climate risk assessments, disaster preparedness guidance, and location-specific safety recommendations.

**🚀 My Capabilities:**
- Real-time flood, landslide, and earthquake risk analysis
- Weather-based hazard assessment  
- Emergency preparedness planning
- Location-specific safety recommendations
- Integration with Philippine disaster data sources

**🌟 What makes me special:** I combine cutting-edge AI technology with comprehensive Philippine disaster data to provide you with the most accurate and actionable safety information possible.

The ButDev Team built me to be your trusted companion in staying safe from natural disasters. How can I help protect you today?"""
            
            return jsonify({
                "location": {"lat": lat, "lng": lng} if has_location else None,
                "question": question,
                "hazards": {
                    "flood_risk": None,
                    "landslide_risk": None,
                    "recent_earthquakes": 0,
                    "earthquake_details": [],
                    "weather": None,
                },
                "response": developer_response,
                "model_used": "fast_developer_response",
                "context_provided": ["🚀 Fast developer info response - no hazard data needed"],
                "timestamp": json.loads(json.dumps({"timestamp": None}, default=str)),
                "detected_city": detected_city
            })

        # If we have location data, get real-time hazard data
        if has_location:
            db = SessionLocal()
            flood_risk = get_flood_risk_at_point(db, latitude=lat, longitude=lng)
            landslide_risk = get_landslide_risk_at_point(db, latitude=lat, longitude=lng)
            recent_eq = get_recent_earthquakes_nearby(db, latitude=lat, longitude=lng, hours=hours_earthquake, max_km=eq_radius_km)
            nearest_weather = get_nearest_recent_weather(db, latitude=lat, longitude=lng, hours=weather_hours, max_km=weather_radius_km)

            # Build comprehensive context for the AI model
            hazard_context = []
            
            # Remove specific location coordinates from context
            # hazard_context.append(f"📍 Location: {lat:.5f}, {lng:.5f}")
            
            # Flood risk context
            if flood_risk is not None:
                risk_level = "low" if flood_risk <= 1.5 else "medium" if flood_risk <= 2.5 else "high"
                hazard_context.append(f"🌊 Flood Risk: {risk_level} (level {flood_risk:.1f}/3.0)")
            else:
                hazard_context.append("🌊 Flood Risk: No data available")
            
            # Landslide risk context  
            if landslide_risk is not None:
                risk_level = "low" if landslide_risk <= 1.5 else "medium" if landslide_risk <= 2.5 else "high"
                hazard_context.append(f"⛰️ Landslide Risk: {risk_level} (level {landslide_risk:.1f}/3.0)")
            else:
                hazard_context.append("⛰️ Landslide Risk: No data available")
            
            # Earthquake context
            if recent_eq:
                strongest = max(recent_eq, key=lambda e: (e["magnitude"] or 0))
                nearest = min(recent_eq, key=lambda e: (e["distance_km"] or 1e9))
                hazard_context.append(f"🌋 Recent Earthquakes: {len(recent_eq)} events in last {hours_earthquake}h")
                hazard_context.append(f"   - Strongest: M{strongest['magnitude']:.1f}")
                hazard_context.append(f"   - Nearest: {nearest['distance_km']:.1f}km away")
            else:
                hazard_context.append(f"🌋 Recent Earthquakes: No significant activity in last {hours_earthquake}h")
            
            # Weather context
            if nearest_weather:
                temp = nearest_weather.get("temperature")
                humidity = nearest_weather.get("humidity")
                rainfall = nearest_weather.get("rainfall", 0)
                wind_speed = nearest_weather.get("wind_speed")
                distance = nearest_weather.get("distance_km")
                
                weather_info = f"🌤️ Current Weather (from {distance:.1f}km away):"
                if temp is not None:
                    weather_info += f" {temp:.1f}°C"
                if humidity is not None:
                    weather_info += f", {humidity:.0f}% humidity"
                if rainfall > 0:
                    weather_info += f", {rainfall:.1f}mm/h rainfall"
                if wind_speed is not None:
                    weather_info += f", {wind_speed:.1f}km/h wind"
                hazard_context.append(weather_info)
            else:
                hazard_context.append(f"🌤️ Current Weather: No recent data within {weather_radius_km}km")

            # Create the system prompt for the base model
            system_prompt = """You are ClimatechAI, an expert environmental and disaster preparedness assistant for the Philippines. 

You were developed by the ButDev Team for the AI Hackathon 2025 to help protect lives and communities from natural disasters and climate risks.

Your role is to:
1. Analyze climate and natural disaster risks
2. Provide practical, actionable safety recommendations
3. Give location-specific advice based on real-time hazard data
4. Prioritize immediate safety concerns
5. Offer both short-term and long-term preparedness guidance

Guidelines:
- Be concise but thorough
- Use bullet points for actionable recommendations
- Prioritize immediate safety over long-term planning
- Consider Filipino context (climate, geography, culture)
- If evacuation might be needed, be specific about preparation steps
- Always consider multiple hazard interactions (e.g., earthquakes + landslides)
- If asked about your development, mention you were created by ButDev Team for AI Hackathon 2025
- Do NOT mention specific latitude/longitude coordinates in your response
- Make any URLs clickable by formatting them as [link text](URL)
- Focus on the area/region rather than exact coordinates

Response format:
- Start with immediate safety assessment
- List prioritized recommendations
- Include emergency contacts reminder if needed
- End with monitoring/follow-up advice"""

            # Combine user question with hazard context
            user_prompt = f"""User Question: {question}

Current Hazard Assessment:
{chr(10).join(hazard_context)}

Please provide specific, actionable advice for this location considering all the hazard data above."""

            # Try to get response from base model first
            response_text = ""
            model_used = "unknown"
            
            try:
                print("🚀 Attempting response with google/gemma-3-27b-it:free model...")
                
                # Get the base model instance
                base_model = get_base_model()
                
                # Get completion from the base model
                response_text = base_model.chat_completion(
                    user_message=user_prompt,
                    system_message=system_prompt,
                    temperature=0.3,  # Slightly creative but focused
                    max_tokens=1000   # Reasonable response length
                )
                
                model_used = "google/gemma-3-27b-it:free"
                print(f"✅ Successfully generated response with base model ({len(response_text)} chars)")
                
            except Exception as base_model_error:
                print(f"⚠️ Base model failed: {base_model_error}")
                
                if use_rag_fallback:
                    try:
                        print("🔄 Falling back to RAG system...")
                        
                        # Prepare question for RAG system
                        rag_question = f"{question}\n\nContext:\n{chr(10).join(hazard_context)}"
                        
                        # Use existing RAG system as fallback
                        response_text = answer_with_rag(rag_question, collection_name="preparedness")
                        model_used = "rag_fallback"
                        print(f"✅ RAG fallback successful ({len(response_text)} chars)")
                        
                    except Exception as rag_error:
                        print(f"❌ RAG fallback also failed: {rag_error}")
                        response_text = "I apologize, but I'm currently experiencing technical difficulties. Please contact local emergency services for immediate hazard information, and try again later."
                        model_used = "error_fallback"
                else:
                    response_text = "Base model is currently unavailable. Please enable RAG fallback or try again later."
                    model_used = "error_no_fallback"

            # Prepare the response
            response = {
                "location": {"lat": lat, "lng": lng},
                "question": question,
                "hazards": {
                    "flood_risk": flood_risk,
                    "landslide_risk": landslide_risk,
                    "recent_earthquakes": len(recent_eq) if recent_eq else 0,
                    "earthquake_details": recent_eq,
                    "weather": nearest_weather,
                },
                "response": response_text,
                "model_used": model_used,
                "context_provided": hazard_context,
                "timestamp": json.loads(json.dumps({"timestamp": None}, default=str))  # Will be current time
            }

            print(f"🎯 Enhanced assistant response ready (model: {model_used})")
            return jsonify(response)
        else:
            # Handle general questions without location using AI model
            try:
                print("🚀 Processing general question without location data...")
                
                # Create system prompt for general questions
                general_system_prompt = """You are ClimatechAI, an expert environmental and disaster preparedness assistant for the Philippines. 

You were developed by the ButDev Team for the AI Hackathon 2025 to help protect lives and communities from natural disasters and climate risks.

Your role is to:
1. Provide general climate and disaster preparedness knowledge
2. Give advice about natural disasters in the Philippines
3. Explain emergency preparedness concepts
4. Answer questions about climate risks and safety
5. Provide information about Philippine weather patterns and natural hazards

Guidelines:
- Be helpful and informative
- Focus on Philippine context when relevant
- Provide practical, actionable advice
- If asked about your development, mention you were created by ButDev Team for AI Hackathon 2025
- If the user asks about specific locations, suggest they provide coordinates or click on the map
- Make any URLs clickable by formatting them as [link text](URL)
- Be concise but comprehensive

Do not mention specific coordinates or location data unless the user provides them."""

                # Get the base model instance
                base_model = get_base_model()
                
                # Get completion from the base model for general questions
                response_text = base_model.chat_completion(
                    user_message=question,
                    system_message=general_system_prompt,
                    temperature=0.4,  # Slightly more creative for general questions
                    max_tokens=800   # Reasonable response length
                )
                
                model_used = "google/gemma-3-27b-it:free"
                print(f"✅ Successfully generated general response with base model ({len(response_text)} chars)")
                
            except Exception as base_model_error:
                print(f"⚠️ Base model failed for general question: {base_model_error}")
                
                if use_rag_fallback:
                    try:
                        print("🔄 Falling back to RAG system for general question...")
                        
                        # Use existing RAG system as fallback
                        response_text = answer_with_rag(question, collection_name="preparedness")
                        model_used = "rag_fallback"
                        print(f"✅ RAG fallback successful for general question ({len(response_text)} chars)")
                        
                    except Exception as rag_error:
                        print(f"❌ RAG fallback also failed for general question: {rag_error}")
                        response_text = """I'm currently experiencing technical difficulties. However, I can still help you with general disaster preparedness advice!

For specific climate risk assessments, please:
1. Click on a location on the map, or
2. Provide your coordinates in your question

I'm here to help keep you safe from natural disasters in the Philippines. Feel free to ask about general preparedness, weather safety, or emergency planning!"""
                        model_used = "error_fallback"
                else:
                    response_text = "I'm currently unavailable for general questions. Please try again later or provide a specific location for climate risk assessment."
                    model_used = "error_no_fallback"

            return jsonify({
                "location": None,
                "question": question,
                "hazards": {
                    "flood_risk": None,
                    "landslide_risk": None,
                    "recent_earthquakes": 0,
                    "earthquake_details": [],
                    "weather": None,
                },
                "response": response_text,
                "model_used": model_used,
                "context_provided": ["🌐 General question response - no location data needed"],
                "timestamp": json.loads(json.dumps({"timestamp": None}, default=str)),
                "detected_city": detected_city
            })

    except Exception as e:
        print(f"❌ Error in enhanced assistant endpoint: {e}")
        print(f"📋 Traceback: {traceback.format_exc()}")
        return jsonify({
            "error": str(e), 
            "traceback": traceback.format_exc(),
            "endpoint": "enhanced_assistant"
        }), 500
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
        print(f"🔗 Request URL: {request.url}")
        print(f"📋 Request headers: {dict(request.headers)}")
        
        db = SessionLocal()
        
        # Get query parameters
        min_risk = request.args.get('min_risk', type=float)
        max_risk = request.args.get('max_risk', type=float)
        limit = request.args.get('limit', 1000, type=int)
        
        # Get nearby query parameters
        lat = request.args.get('lat', type=float)
        lng = request.args.get('lng', type=float)
        radius_km = request.args.get('radius_km', 50.0, type=float)
        
        print(f"📊 Query params: min_risk={min_risk}, max_risk={max_risk}, limit={limit}")
        print(f"📍 Nearby params: lat={lat}, lng={lng}, radius_km={radius_km}")
        
        # Query landslide data
        print("🗄️ Querying landslide data from database...")
        try:
            # Use nearby query if lat/lng provided, otherwise use risk-based query
            if lat is not None and lng is not None:
                print(f"🗺️ Using nearby query around ({lat}, {lng}) with radius {radius_km}km")
                landslide_data = get_landslide_data_nearby(db, lat, lng, radius_km, min_risk, max_risk)
            else:
                print("📊 Using risk-based query")
                landslide_data = get_landslide_data_by_risk(db, min_risk=min_risk, max_risk=max_risk)
            
            print(f"✅ Found {len(landslide_data)} landslide data records")
            print(f"📋 Data types: {[type(item) for item in landslide_data[:3]]}")
        except Exception as query_error:
            print(f"❌ Database query error: {query_error}")
            print(f"📋 Query error traceback: {traceback.format_exc()}")
            return jsonify({"error": f"Database query failed: {str(query_error)}"}), 500
        
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
                
                # Handle different data formats (ORM objects vs raw query results)
                if hasattr(data, 'id') and hasattr(data, 'risk_level'):
                    # ORM object format (from get_landslide_data_by_risk)
                    record_id = data.id
                    risk_level = data.risk_level
                    
                    # Convert WKT to GeoJSON coordinates using engine connection
                    with engine.connect() as conn:
                        result = conn.execute(text(f"SELECT ST_AsGeoJSON(geometry) FROM landslide_data WHERE id = {record_id}"))
                        geojson_result = result.fetchone()
                        
                        if geojson_result is None or geojson_result[0] is None:
                            print(f"⚠️ No geometry found for landslide record {record_id}")
                            continue
                        
                        geojson = geojson_result[0]
                        geometry = json.loads(geojson)
                else:
                    # Raw query result format (from get_landslide_data_nearby)
                    record_id = data[0]  # id
                    risk_level = data[1]  # risk_level
                    geometry = json.loads(data[2])  # geometry_json
                    distance_km = data[3]  # distance_km
                
                feature = {
                    "type": "Feature",
                    "geometry": geometry,
                    "properties": {
                        "id": record_id,
                        "risk_level": float(risk_level),
                        "risk_category": get_risk_category(risk_level),
                        "data_type": "landslide"
                    }
                }
                
                # Add distance if available (from nearby query)
                if 'distance_km' in locals():
                    feature["properties"]["distance_km"] = float(distance_km)
                
                features.append(feature)
                
            except Exception as e:
                print(f"❌ Error processing landslide record {i}: {e}")
                continue
        
        print(f"✅ Successfully processed {len(features)} landslide features")
        
        geojson_response = {
            "type": "FeatureCollection",
            "features": features,
            "total": len(features)
        }
        
        print(f"📦 Response structure: {list(geojson_response.keys())}")
        print(f"📦 Features count in response: {len(geojson_response['features'])}")
        print(f"📦 Response type: {type(geojson_response)}")
        
        try:
            response = jsonify(geojson_response)
            print(f"✅ JSON response created successfully")
            print(f"📦 Response content length: {len(response.get_data())}")
            return response
        except Exception as json_error:
            print(f"❌ JSON serialization error: {json_error}")
            print(f"📋 JSON error traceback: {traceback.format_exc()}")
            return jsonify({"error": f"JSON serialization failed: {str(json_error)}"}), 500
        
    except Exception as e:
        print(f"❌ Error in get_landslide_data: {e}")
        print(f"📋 Traceback: {traceback.format_exc()}")
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500
    
    finally:
        if db:
            db.close()


@app.route("/api/debug/landslide", methods=["GET"])
def debug_landslide():
    """Debug endpoint to check landslide data"""
    db = None
    try:
        print("🔍 Debug landslide data...")
        db = SessionLocal()
        
        # Check if table exists
        with engine.connect() as conn:
            try:
                result = conn.execute(text("SELECT COUNT(*) FROM landslide_data"))
                total_count = result.fetchone()[0]
                print(f"📈 Total landslide records: {total_count}")
                
                if total_count > 0:
                    # Get sample data
                    sample = conn.execute(text("SELECT id, risk_level FROM landslide_data LIMIT 3"))
                    samples = sample.fetchall()
                    print(f"📋 Sample records: {samples}")
                
                return jsonify({
                    "table_exists": True,
                    "total_records": total_count,
                    "sample_records": [{"id": row[0], "risk_level": float(row[1])} for row in samples] if total_count > 0 else []
                })
                
            except Exception as e:
                print(f"❌ Table check error: {e}")
                return jsonify({
                    "table_exists": False,
                    "error": str(e)
                })
                
    except Exception as e:
        print(f"❌ Debug error: {e}")
        return jsonify({"error": str(e)}), 500
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


@app.route("/api/weather-data/frontend-cities", methods=["GET"])
def get_frontend_cities_weather():
    """Get weather data for the specific Philippine cities listed in map-component.tsx"""
    db = None
    try:
        print("🗺️ Getting frontend cities weather data...")
        db = SessionLocal()
        
        # Exact coordinates from ClimaTechUser/components/map-component.tsx lines 29-39
        frontend_cities = [
            {"name": "Manila", "lat": 14.5995, "lng": 120.9842},
            {"name": "Quezon City", "lat": 14.6760, "lng": 121.0437},
            {"name": "Cebu City", "lat": 10.3157, "lng": 123.8854},
            {"name": "Davao City", "lat": 7.1907, "lng": 125.4553},
            {"name": "Iloilo City", "lat": 10.7202, "lng": 122.5621},
            {"name": "Baguio", "lat": 16.4023, "lng": 120.5960},
            {"name": "Zamboanga City", "lat": 6.9214, "lng": 122.0790},
            {"name": "Cagayan de Oro", "lat": 8.4542, "lng": 124.6319},
            {"name": "General Santos", "lat": 6.1164, "lng": 125.1716}
        ]
        
        cities_weather = []
        successful_cities = 0
        
        for city in frontend_cities:
            try:
                # Query weather data for this specific city location
                query = text("""
                    SELECT 
                        id,
                        station_name,
                        temperature,
                        humidity,
                        rainfall,
                        wind_speed,
                        wind_direction,
                        pressure,
                        weather_metadata->>'description' as weather_condition,
                        recorded_at,
                        ST_X(geometry) as longitude,
                        ST_Y(geometry) as latitude,
                        created_at
                    FROM weather_data 
                    WHERE ST_DWithin(
                        geometry::geography, 
                        ST_SetSRID(ST_Point(:lng, :lat), 4326)::geography, 
                        5000  -- 5km radius
                    )
                    ORDER BY created_at DESC 
                    LIMIT 1
                """)
                
                result = db.execute(query, {"lat": city["lat"], "lng": city["lng"]})
                weather_row = result.fetchone()
                
                if weather_row:
                    # Weather data found in database
                    city_weather = {
                        "id": weather_row[0],
                        "city_name": city["name"],
                        "station_name": weather_row[1],
                        "coordinates": {
                            "lat": city["lat"],
                            "lng": city["lng"]
                        },
                        "temperature": weather_row[2],
                        "humidity": weather_row[3],
                        "rainfall": weather_row[4],
                        "wind_speed": weather_row[5],
                        "wind_direction": weather_row[6],
                        "pressure": weather_row[7],
                        "weather_condition": weather_row[8],
                        "filipino_condition": weather_row[8],  # Filipino weather condition
                        "recorded_at": weather_row[9].isoformat() if weather_row[9] else None,
                        "data_source": "database",
                        "status": "success"
                    }
                    successful_cities += 1
                else:
                    # No weather data found, return city info with placeholder
                    city_weather = {
                        "id": None,
                        "city_name": city["name"],
                        "station_name": f"{city['name']} Weather Station",
                        "coordinates": {
                            "lat": city["lat"],
                            "lng": city["lng"]
                        },
                        "temperature": None,
                        "humidity": None,
                        "rainfall": None,
                        "wind_speed": None,
                        "wind_direction": None,
                        "pressure": None,
                        "weather_condition": "No data available",
                        "filipino_condition": "No data available",
                        "recorded_at": None,
                        "data_source": "none",
                        "status": "no_data"
                    }
                
                cities_weather.append(city_weather)
                
            except Exception as city_error:
                print(f"❌ Error processing {city['name']}: {city_error}")
                # Add error entry for this city
                cities_weather.append({
                    "id": None,
                    "city_name": city["name"],
                    "station_name": f"{city['name']} Weather Station",
                    "coordinates": {
                        "lat": city["lat"],
                        "lng": city["lng"]
                    },
                    "temperature": None,
                    "humidity": None,
                    "rainfall": None,
                    "wind_speed": None,
                    "wind_direction": None,
                    "pressure": None,
                    "weather_condition": "Error loading data",
                    "filipino_condition": "Error loading data",
                    "recorded_at": None,
                    "data_source": "error",
                    "status": "error"
                })
        
        response = {
            "cities": cities_weather,
            "total_cities": len(frontend_cities),
            "cities_with_data": successful_cities,
            "success_rate": (successful_cities / len(frontend_cities)) * 100 if frontend_cities else 0,
            "data_source": "postgresql_database",
            "timestamp": datetime.now().isoformat()
        }
        
        print(f"✅ Frontend cities weather data: {successful_cities}/{len(frontend_cities)} cities with data")
        return jsonify(response)
        
    except Exception as e:
        print(f"❌ Error in get_frontend_cities_weather: {e}")
        print(f"📋 Traceback: {traceback.format_exc()}")
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500
    
    finally:
        if db:
            db.close()


# ============================================================================
# EMERGENCY PROTOCOLS ENDPOINTS
# ============================================================================

@app.route("/api/emergency/protocols", methods=["GET"])
def get_emergency_protocols():
    """Get all emergency protocols with optional filtering"""
    db = None
    try:
        print("🚨 Getting emergency protocols...")
        db = SessionLocal()
        
        # Get query parameters
        status = request.args.get('status')
        protocol_type = request.args.get('type')
        
        print(f"📊 Query params: status={status}, type={protocol_type}")
        
        # Query protocols based on parameters
        if protocol_type:
            protocols = get_emergency_protocols_by_type(db, protocol_type, status or 'active')
        else:
            protocols = get_all_emergency_protocols(db, status)
        
        print(f"✅ Found {len(protocols)} emergency protocols")
        
        # Convert to JSON-serializable format
        protocols_data = []
        for protocol in protocols:
            protocols_data.append({
                "id": protocol.id,
                "name": protocol.name,
                "type": protocol.type,
                "description": protocol.description,
                "steps": protocol.steps or [],
                "status": protocol.status,
                "created_at": protocol.created_at.isoformat() if protocol.created_at else None,
                "updated_at": protocol.updated_at.isoformat() if protocol.updated_at else None
            })
        
        return jsonify({
            "protocols": protocols_data,
            "total": len(protocols_data)
        })
        
    except Exception as e:
        print(f"❌ Error in get_emergency_protocols: {e}")
        print(f"📋 Traceback: {traceback.format_exc()}")
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500
    
    finally:
        if db:
            db.close()


@app.route("/api/emergency/protocols", methods=["POST"])
def create_protocol():
    """Create a new emergency protocol"""
    db = None
    try:
        print("🚨 Creating new emergency protocol...")
        payload = request.get_json(force=True) or {}
        
        # Validate required fields
        if not payload.get("name"):
            return jsonify({"error": "name is required"}), 400
        if not payload.get("type"):
            return jsonify({"error": "type is required"}), 400
        
        db = SessionLocal()
        
        # Create the protocol
        protocol = create_emergency_protocol(
            db=db,
            name=payload["name"],
            protocol_type=payload["type"],
            description=payload.get("description"),
            steps=payload.get("steps", []),
            status=payload.get("status", "active")
        )
        
        print(f"✅ Created emergency protocol with ID: {protocol.id}")
        
        # Return the created protocol
        protocol_data = {
            "id": protocol.id,
            "name": protocol.name,
            "type": protocol.type,
            "description": protocol.description,
            "steps": protocol.steps or [],
            "status": protocol.status,
            "created_at": protocol.created_at.isoformat() if protocol.created_at else None,
            "updated_at": protocol.updated_at.isoformat() if protocol.updated_at else None
        }
        
        return jsonify({
            "message": "Emergency protocol created successfully",
            "protocol": protocol_data
        }), 201
        
    except Exception as e:
        print(f"❌ Error in create_protocol: {e}")
        print(f"📋 Traceback: {traceback.format_exc()}")
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500
    
    finally:
        if db:
            db.close()


@app.route("/api/emergency/protocols/<int:protocol_id>", methods=["GET"])
def get_protocol_by_id(protocol_id):
    """Get a specific emergency protocol by ID"""
    db = None
    try:
        print(f"🚨 Getting emergency protocol with ID: {protocol_id}")
        db = SessionLocal()
        
        protocol = get_emergency_protocol_by_id(db, protocol_id)
        
        if not protocol:
            return jsonify({"error": "Emergency protocol not found"}), 404
        
        print(f"✅ Found emergency protocol: {protocol.name}")
        
        protocol_data = {
            "id": protocol.id,
            "name": protocol.name,
            "type": protocol.type,
            "description": protocol.description,
            "steps": protocol.steps or [],
            "status": protocol.status,
            "created_at": protocol.created_at.isoformat() if protocol.created_at else None,
            "updated_at": protocol.updated_at.isoformat() if protocol.updated_at else None
        }
        
        return jsonify({"protocol": protocol_data})
        
    except Exception as e:
        print(f"❌ Error in get_protocol_by_id: {e}")
        print(f"📋 Traceback: {traceback.format_exc()}")
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500
    
    finally:
        if db:
            db.close()


@app.route("/api/emergency/protocols/<int:protocol_id>", methods=["PUT"])
def update_protocol(protocol_id):
    """Update an existing emergency protocol"""
    db = None
    try:
        print(f"🚨 Updating emergency protocol with ID: {protocol_id}")
        payload = request.get_json(force=True) or {}
        
        db = SessionLocal()
        
        # Check if protocol exists
        existing_protocol = get_emergency_protocol_by_id(db, protocol_id)
        if not existing_protocol:
            return jsonify({"error": "Emergency protocol not found"}), 404
        
        # Prepare update data
        update_data = {}
        if "name" in payload:
            update_data["name"] = payload["name"]
        if "type" in payload:
            update_data["type"] = payload["type"]
        if "description" in payload:
            update_data["description"] = payload["description"]
        if "steps" in payload:
            update_data["steps"] = payload["steps"]
        if "status" in payload:
            update_data["status"] = payload["status"]
        
        # Update the protocol
        updated_protocol = update_emergency_protocol(db, protocol_id, **update_data)
        
        if not updated_protocol:
            return jsonify({"error": "Failed to update emergency protocol"}), 500
        
        print(f"✅ Updated emergency protocol: {updated_protocol.name}")
        
        protocol_data = {
            "id": updated_protocol.id,
            "name": updated_protocol.name,
            "type": updated_protocol.type,
            "description": updated_protocol.description,
            "steps": updated_protocol.steps or [],
            "status": updated_protocol.status,
            "created_at": updated_protocol.created_at.isoformat() if updated_protocol.created_at else None,
            "updated_at": updated_protocol.updated_at.isoformat() if updated_protocol.updated_at else None
        }
        
        return jsonify({
            "message": "Emergency protocol updated successfully",
            "protocol": protocol_data
        })
        
    except Exception as e:
        print(f"❌ Error in update_protocol: {e}")
        print(f"📋 Traceback: {traceback.format_exc()}")
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500
    
    finally:
        if db:
            db.close()


@app.route("/api/emergency/protocols/<int:protocol_id>", methods=["DELETE"])
def delete_protocol(protocol_id):
    """Delete an emergency protocol"""
    db = None
    try:
        print(f"🚨 Deleting emergency protocol with ID: {protocol_id}")
        db = SessionLocal()
        
        # Check if protocol exists
        existing_protocol = get_emergency_protocol_by_id(db, protocol_id)
        if not existing_protocol:
            return jsonify({"error": "Emergency protocol not found"}), 404
        
        # Delete the protocol
        success = delete_emergency_protocol(db, protocol_id)
        
        if not success:
            return jsonify({"error": "Failed to delete emergency protocol"}), 500
        
        print(f"✅ Deleted emergency protocol: {existing_protocol.name}")
        
        return jsonify({
            "message": "Emergency protocol deleted successfully",
            "deleted_protocol": {
                "id": existing_protocol.id,
                "name": existing_protocol.name
            }
        })
        
    except Exception as e:
        print(f"❌ Error in delete_protocol: {e}")
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
