#!/usr/bin/env python3
"""
Simple test script to check backend API endpoints
"""

import requests
import json

BASE_URL = "http://localhost:5000"

def test_flood_data():
    """Test the flood data endpoint"""
    print("🌊 Testing flood data endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/flood-data?limit=5")
        print(f"Status: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response type: {type(data)}")
            print(f"Response keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
            print(f"Features count: {len(data.get('features', []))}")
            
            if data.get('features'):
                print("Sample feature:")
                print(json.dumps(data['features'][0], indent=2))
            else:
                print("No features found in response")
                print("Full response:")
                print(json.dumps(data, indent=2))
        else:
            print(f"Error response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - Is the backend running?")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_landslide_data():
    """Test the landslide data endpoint"""
    print("\n🏔️ Testing landslide data endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/landslide-data?limit=5")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Features count: {len(data.get('features', []))}")
            
            if data.get('features'):
                print("Sample feature:")
                print(json.dumps(data['features'][0], indent=2))
            else:
                print("No features found in response")
                print("Full response:")
                print(json.dumps(data, indent=2))
        else:
            print(f"Error response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - Is the backend running?")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_database_connection():
    """Test if we can connect to the database"""
    print("\n🗄️ Testing database connection...")
    try:
        response = requests.get(f"{BASE_URL}/api/flood-data/stats")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Database stats: {data}")
        else:
            print(f"Error response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - Is the backend running?")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("🔍 Backend API Test Script")
    print("=" * 50)
    
    test_flood_data()
    test_landslide_data()
    test_database_connection()
    
    print("\n" + "=" * 50)
    print("✅ Test completed!")
