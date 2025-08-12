#!/usr/bin/env python3
"""
Minimal Flask server for ClimatechAI backend with all required API endpoints.
This version works without database dependencies.
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json
import traceback
from datetime import datetime

app = Flask(__name__, static_folder='static')
CORS(app)  # Enable CORS for frontend communication

# Mock data
mock_flood_data = [
    {
        "id": 1,
        "latitude": 10.7302,
        "longitude": 122.5591,
        "risk_level": 8,
        "water_level": 2.5,
        "flood_type": "river flood",
        "location_name": "Iloilo City Center",
        "last_updated": "2025-01-12T10:00:00Z"
    },
    {
        "id": 2,
        "latitude": 10.7200,
        "longitude": 122.5500,
        "risk_level": 6,
        "water_level": 1.8,
        "flood_type": "urban flood",
        "location_name": "Jaro District",
        "last_updated": "2025-01-12T10:00:00Z"
    },
    {
        "id": 3,
        "latitude": 10.7100,
        "longitude": 122.5400,
        "risk_level": 4,
        "water_level": 0.8,
        "flood_type": "coastal flood",
        "location_name": "La Paz",
        "last_updated": "2025-01-12T10:00:00Z"
    }
]

mock_landslide_data = [
    {
        "id": 1,
        "latitude": 10.7450,
        "longitude": 122.5650,
        "risk_level": 7,
        "slope_angle": 35.5,
        "soil_type": "clay",
        "location_name": "Jaro Hills",
        "last_updated": "2025-01-12T10:00:00Z"
    },
    {
        "id": 2,
        "latitude": 10.7350,
        "longitude": 122.5550,
        "risk_level": 5,
        "slope_angle": 25.0,
        "soil_type": "sandy clay",
        "location_name": "Mandurriao Hills",
        "last_updated": "2025-01-12T10:00:00Z"
    }
]

mock_seismic_data = [
    {
        "id": 1,
        "latitude": 10.7302,
        "longitude": 122.5591,
        "magnitude": 4.2,
        "depth": 15.0,
        "event_time": "2025-01-12T09:30:00Z",
        "location_name": "Near Iloilo City",
        "intensity": 5
    },
    {
        "id": 2,
        "latitude": 10.7150,
        "longitude": 122.5450,
        "magnitude": 3.8,
        "depth": 8.5,
        "event_time": "2025-01-12T08:15:00Z",
        "location_name": "Iloilo Strait",
        "intensity": 4
    }
]

mock_weather_data = [
    {
        "id": 1,
        "latitude": 10.7302,
        "longitude": 122.5591,
        "temperature": 28.5,
        "humidity": 78,
        "pressure": 1013.2,
        "wind_speed": 11.5,
        "wind_direction": 120,
        "station_name": "Iloilo City Weather Station",
        "recorded_at": "2025-01-12T10:00:00Z"
    },
    {
        "id": 2,
        "latitude": 10.7200,
        "longitude": 122.5500,
        "temperature": 29.0,
        "humidity": 75,
        "pressure": 1012.8,
        "wind_speed": 12.0,
        "wind_direction": 115,
        "station_name": "Jaro Weather Station",
        "recorded_at": "2025-01-12T10:00:00Z"
    }
]

# Root endpoint
@app.route('/')
def index():
    return jsonify({
        "message": "ClimatechAI Backend Server is running",
        "version": "1.0.0",
        "status": "healthy",
        "endpoints": [
            "/api/flood-data",
            "/api/landslide-data", 
            "/api/seismic-data",
            "/api/weather-data"
        ]
    })

# API Routes
@app.route('/api/flood-data')
def get_flood_data():
    """Get flood risk data"""
    try:
        # Get query parameters
        min_risk = request.args.get('min_risk', type=float)
        max_risk = request.args.get('max_risk', type=float)
        limit = request.args.get('limit', 1000, type=int)
        
        data = mock_flood_data.copy()
        
        # Apply filters
        if min_risk is not None:
            data = [d for d in data if d['risk_level'] >= min_risk]
        if max_risk is not None:
            data = [d for d in data if d['risk_level'] <= max_risk]
        
        # Apply limit
        data = data[:limit]
        
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/landslide-data')
def get_landslide_data():
    """Get landslide risk data"""
    try:
        # Get query parameters
        min_risk = request.args.get('min_risk', type=float)
        max_risk = request.args.get('max_risk', type=float)
        limit = request.args.get('limit', 1000, type=int)
        
        data = mock_landslide_data.copy()
        
        # Apply filters
        if min_risk is not None:
            data = [d for d in data if d['risk_level'] >= min_risk]
        if max_risk is not None:
            data = [d for d in data if d['risk_level'] <= max_risk]
        
        # Apply limit
        data = data[:limit]
        
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/seismic-data')
def get_seismic_data():
    """Get seismic activity data"""
    try:
        # Get query parameters
        min_magnitude = request.args.get('min_magnitude', type=float)
        max_magnitude = request.args.get('max_magnitude', type=float)
        limit = request.args.get('limit', 1000, type=int)
        
        data = mock_seismic_data.copy()
        
        # Apply filters
        if min_magnitude is not None:
            data = [d for d in data if d['magnitude'] >= min_magnitude]
        if max_magnitude is not None:
            data = [d for d in data if d['magnitude'] <= max_magnitude]
        
        # Apply limit
        data = data[:limit]
        
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/weather-data')
def get_weather_data():
    """Get weather station data"""
    try:
        limit = request.args.get('limit', 1000, type=int)
        data = mock_weather_data[:limit]
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Health check endpoint
@app.route('/health')
def health_check():
    return jsonify({
        "status": "healthy",
        "message": "Server is running normally",
        "timestamp": datetime.now().isoformat()
    })

# Assistant chat endpoint (simplified)
@app.route("/api/assistant/chat", methods=["POST"])
def assistant_chat():
    """Simple assistant chat endpoint"""
    try:
        data = request.get_json()
        question = data.get('question', '')
        lat = data.get('lat', 10.7302)
        lng = data.get('lng', 122.5591)
        
        # Mock response
        response = {
            "answer": f"Based on the climate data for location ({lat}, {lng}), I can provide information about flood risks, landslide hazards, and weather conditions in the Iloilo City area. This is a mock response for: {question}",
            "sources": ["Flood risk assessment data", "Weather monitoring stations", "Geological hazard maps"],
            "location": {"lat": lat, "lng": lng}
        }
        
        return jsonify(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting ClimatechAI Minimal Backend Server...")
    print("📡 Server will be available at: http://localhost:5000")
    print("🔗 API endpoints:")
    print("   - GET /api/flood-data")
    print("   - GET /api/landslide-data") 
    print("   - GET /api/seismic-data")
    print("   - GET /api/weather-data")
    print("   - POST /api/assistant/chat")
    print("✅ Server is ready!")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
