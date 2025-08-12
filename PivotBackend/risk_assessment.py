#!/usr/bin/env python3
"""
Risk Assessment Module for PivotBackend
Combines weather data, hazard zones, and LLM analysis for risk prediction
"""

import requests
import json
import os
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

class RiskAssessmentEngine:
    def __init__(self, openrouter_api_key: Optional[str] = None):
        """
        Initialize Risk Assessment Engine
        
        Args:
            openrouter_api_key: OpenRouter API key for LLM access
        """
        # Debug: Print environment variable
        env_key = os.getenv('OPENROUTER_API_KEY')
        print(f"🔍 Debug: OPENROUTER_API_KEY from env: {'Set' if env_key else 'Not found'}")
        
        self.openrouter_api_key = openrouter_api_key or env_key
        if not self.openrouter_api_key:
            print("⚠️ Warning: No OpenRouter API key found. Risk assessment will be limited.")
        else:
            print("✅ OpenRouter API key found and loaded successfully.")
        
        self.base_url = "https://openrouter.ai/api/v1"
        self.model = "google/gemma-3-27b-it:free"
    
    def get_recent_weather_data(self, lat: float, lng: float, db: Session, hours: int = 24) -> Optional[Dict]:
        """
        Get the most recent weather data for a location
        """
        try:
            # Create a point geometry
            point_geom = f"POINT({lng} {lat})"
            
            # Query for recent weather data within specified hours
            weather_query = text("""
                SELECT temperature, humidity, pressure, wind_speed, wind_direction, 
                       precipitation, weather_condition, timestamp
                FROM weather_data 
                WHERE ST_DWithin(location, ST_GeomFromText(:point_geom, 4326), 0.01)
                AND timestamp >= NOW() - INTERVAL ':hours hours'
                ORDER BY timestamp DESC
                LIMIT 1
            """)
            
            result = db.execute(weather_query, {"point_geom": point_geom, "hours": hours}).fetchone()
            
            if result:
                return {
                    "temperature": result.temperature,
                    "humidity": result.humidity,
                    "pressure": result.pressure,
                    "wind_speed": result.wind_speed,
                    "wind_direction": result.wind_direction,
                    "precipitation": result.precipitation,
                    "weather_condition": result.weather_condition,
                    "timestamp": result.timestamp.isoformat() if result.timestamp else None
                }
            else:
                return None
                
        except Exception as e:
            print(f"Error getting weather data: {e}")
            return None
    
    def get_hazard_zones(self, lat: float, lng: float, db: Session) -> Dict:
        """
        Get hazard zones (flood and landslide) for a location
        """
        try:
            point_geom = f"POINT({lng} {lat})"
            
            # Check flood zones
            flood_query = text("""
                SELECT id, risk_value, 
                       CASE 
                           WHEN risk_value = '1' THEN 'low'
                           WHEN risk_value = '2' THEN 'medium'
                           WHEN risk_value = '3' THEN 'high'
                           ELSE 'unknown'
                       END as severity
                FROM flood_data 
                WHERE ST_Contains(geometry, ST_GeomFromText(:point_geom, 4326))
            """)
            
            flood_results = db.execute(flood_query, {"point_geom": point_geom}).fetchall()
            flood_zones = [
                {
                    "id": row.id,
                    "risk_value": row.risk_value,
                    "severity": row.severity
                }
                for row in flood_results
            ]
            
            # Check landslide zones
            landslide_query = text("""
                SELECT id, risk_value,
                       CASE 
                           WHEN risk_value = '1' THEN 'low'
                           WHEN risk_value = '2' THEN 'medium'
                           WHEN risk_value = '3' THEN 'high'
                           ELSE 'unknown'
                       END as severity
                FROM landslide_data 
                WHERE ST_Contains(geometry, ST_GeomFromText(:point_geom, 4326))
            """)
            
            landslide_results = db.execute(landslide_query, {"point_geom": point_geom}).fetchall()
            landslide_zones = [
                {
                    "id": row.id,
                    "risk_value": row.risk_value,
                    "severity": row.severity
                }
                for row in landslide_results
            ]
            
            return {
                "flood_zones": flood_zones,
                "landslide_zones": landslide_zones,
                "total_flood_zones": len(flood_zones),
                "total_landslide_zones": len(landslide_zones)
            }
            
        except Exception as e:
            print(f"Error getting hazard zones: {e}")
            return {
                "flood_zones": [],
                "landslide_zones": [],
                "total_flood_zones": 0,
                "total_landslide_zones": 0
            }
    
    def create_risk_assessment_prompt(self, weather_data: Dict, hazard_zones: Dict, lat: float, lng: float) -> str:
        """
        Create a prompt for the LLM to assess risk
        """
        # Format weather data
        weather_info = ""
        if weather_data:
            weather_info = f"""
Current Weather Conditions:
- Temperature: {weather_data.get('temperature', 'Unknown')}°C
- Humidity: {weather_data.get('humidity', 'Unknown')}%
- Pressure: {weather_data.get('pressure', 'Unknown')} mb
- Wind Speed: {weather_data.get('wind_speed', 'Unknown')} km/h
- Wind Direction: {weather_data.get('wind_direction', 'Unknown')}°
- Precipitation: {weather_data.get('precipitation', 'Unknown')} mm/h
- Weather Condition: {weather_data.get('weather_condition', 'Unknown')}
- Recorded: {weather_data.get('timestamp', 'Unknown')}
"""
        else:
            weather_info = "No recent weather data available for this location."
        
        # Format hazard zones
        flood_info = ""
        if hazard_zones['flood_zones']:
            flood_severities = [zone['severity'] for zone in hazard_zones['flood_zones']]
            flood_info = f"Flood Risk Zones: {', '.join(flood_severities)}"
        else:
            flood_info = "No flood risk zones detected."
        
        landslide_info = ""
        if hazard_zones['landslide_zones']:
            landslide_severities = [zone['severity'] for zone in hazard_zones['landslide_zones']]
            landslide_info = f"Landslide Risk Zones: {', '.join(landslide_severities)}"
        else:
            landslide_info = "No landslide risk zones detected."
        
        prompt = f"""You are a disaster risk assessment expert analyzing a location in the Philippines.

Location: {lat:.4f}, {lng:.4f}

{weather_info}

Hazard Analysis:
{flood_info}
{landslide_info}

Based on the weather conditions and hazard zone data, assess the likelihood of a disaster event occurring in this area.

Provide your response in this exact JSON format:
{{
    "risk_score": <number between 0-100>,
    "risk_level": "<low/medium/high/critical>",
    "description": "<detailed explanation of potential issues>",
    "recommendations": "<specific recommendations for this situation>"
}}

Risk Score Guidelines:
- 0-20: Very low risk
- 21-40: Low risk
- 41-60: Medium risk
- 61-80: High risk
- 81-100: Critical risk

Consider factors like:
- Heavy rainfall + flood zones = increased flood risk
- High humidity + landslide zones = increased landslide risk
- Wind conditions affecting debris flow
- Temperature affecting soil stability
- Pressure changes indicating weather system changes

Respond only with the JSON, no additional text."""

        return prompt
    
    def assess_risk_with_llm(self, prompt: str) -> Optional[Dict]:
        """
        Use OpenRouter LLM to assess risk
        """
        try:
            if not self.openrouter_api_key:
                print("❌ No OpenRouter API key available")
                return None
            
            headers = {
                "Authorization": f"Bearer {self.openrouter_api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": self.model,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.3,
                "max_tokens": 500
            }
            
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result['choices'][0]['message']['content']
                
                # Try to parse JSON response
                try:
                    # Clean the response in case there's extra text
                    content = content.strip()
                    if content.startswith('```json'):
                        content = content[7:]
                    if content.endswith('```'):
                        content = content[:-3]
                    
                    risk_assessment = json.loads(content)
                    return risk_assessment
                    
                except json.JSONDecodeError as e:
                    print(f"Error parsing LLM response: {e}")
                    print(f"Raw response: {content}")
                    return None
            else:
                print(f"OpenRouter API error: {response.status_code}")
                print(f"Response: {response.text}")
                return None
                
        except Exception as e:
            print(f"Error calling OpenRouter API: {e}")
            return None
    
    def assess_location_risk(self, lat: float, lng: float, db: Session) -> Dict:
        """
        Complete risk assessment for a location
        """
        try:
            print(f"🔍 Assessing risk for location ({lat:.4f}, {lng:.4f})...")
            
            # Get recent weather data
            weather_data = self.get_recent_weather_data(lat, lng, db)
            print(f"   Weather data: {'Available' if weather_data else 'Not available'}")
            
            # Get hazard zones
            hazard_zones = self.get_hazard_zones(lat, lng, db)
            print(f"   Hazard zones: {hazard_zones['total_flood_zones']} flood, {hazard_zones['total_landslide_zones']} landslide")
            
            # Create assessment prompt
            prompt = self.create_risk_assessment_prompt(weather_data, hazard_zones, lat, lng)
            
            # Get LLM assessment
            llm_assessment = self.assess_risk_with_llm(prompt)
            
            if llm_assessment:
                print(f"   LLM assessment: Risk score {llm_assessment.get('risk_score', 'Unknown')}")
            else:
                print("   LLM assessment: Failed")
                # Create fallback assessment
                llm_assessment = self._create_fallback_assessment(weather_data, hazard_zones)
            
            return {
                "location": {"lat": lat, "lng": lng},
                "weather_data": weather_data,
                "hazard_zones": hazard_zones,
                "risk_assessment": llm_assessment,
                "assessment_timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"❌ Error in risk assessment: {e}")
            return {
                "location": {"lat": lat, "lng": lng},
                "error": str(e),
                "assessment_timestamp": datetime.now().isoformat()
            }
    
    def _create_fallback_assessment(self, weather_data: Optional[Dict], hazard_zones: Dict) -> Dict:
        """
        Create a fallback risk assessment when LLM is unavailable
        """
        risk_score = 0
        risk_level = "low"
        description = "Unable to perform detailed risk assessment due to system limitations."
        recommendations = "Monitor weather conditions and follow local emergency guidelines."
        
        # Basic risk calculation based on available data
        if weather_data:
            # High precipitation increases risk
            if weather_data.get('precipitation', 0) > 10:
                risk_score += 30
                description += " High precipitation detected."
            
            # High humidity can affect soil stability
            if weather_data.get('humidity', 0) > 80:
                risk_score += 15
                description += " High humidity conditions."
        
        # Hazard zones increase risk
        if hazard_zones['total_flood_zones'] > 0:
            risk_score += 25
            description += f" Located in {hazard_zones['total_flood_zones']} flood risk zone(s)."
        
        if hazard_zones['total_landslide_zones'] > 0:
            risk_score += 25
            description += f" Located in {hazard_zones['total_landslide_zones']} landslide risk zone(s)."
        
        # Determine risk level
        if risk_score >= 80:
            risk_level = "critical"
        elif risk_score >= 60:
            risk_level = "high"
        elif risk_score >= 40:
            risk_level = "medium"
        else:
            risk_level = "low"
        
        return {
            "risk_score": min(risk_score, 100),
            "risk_level": risk_level,
            "description": description,
            "recommendations": recommendations
        }


def main():
    """Test the risk assessment engine"""
    try:
        from database import SessionLocal
        
        # Initialize risk assessment engine
        risk_engine = RiskAssessmentEngine()
        
        # Test location (Manila)
        test_lat, test_lng = 14.5995, 120.9842
        
        with SessionLocal() as db:
            assessment = risk_engine.assess_location_risk(test_lat, test_lng, db)
            
            print("\n📊 Risk Assessment Results:")
            print(f"Location: {assessment['location']}")
            
            if 'risk_assessment' in assessment:
                risk = assessment['risk_assessment']
                print(f"Risk Score: {risk.get('risk_score', 'Unknown')}")
                print(f"Risk Level: {risk.get('risk_level', 'Unknown')}")
                print(f"Description: {risk.get('description', 'Unknown')}")
                print(f"Recommendations: {risk.get('recommendations', 'Unknown')}")
            else:
                print(f"Error: {assessment.get('error', 'Unknown error')}")
        
    except Exception as e:
        print(f"❌ Error testing risk assessment: {e}")


if __name__ == "__main__":
    main()
