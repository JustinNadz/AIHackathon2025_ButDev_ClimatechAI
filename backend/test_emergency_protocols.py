#!/usr/bin/env python3
"""
Test script for emergency protocols API endpoints
"""

import requests
import json
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Base URL for the API
BASE_URL = "http://localhost:5000/api/emergency/protocols"


def test_get_protocols():
    """Test GET /api/emergency/protocols"""
    print("🧪 Testing GET /api/emergency/protocols")
    
    try:
        response = requests.get(BASE_URL)
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success! Found {data.get('total', 0)} protocols")
            
            protocols = data.get('protocols', [])
            for i, protocol in enumerate(protocols[:3], 1):
                print(f"  {i}. {protocol.get('name')} ({protocol.get('type')})")
            
            return True
        else:
            print(f"❌ Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False


def test_create_protocol():
    """Test POST /api/emergency/protocols"""
    print("\n🧪 Testing POST /api/emergency/protocols")
    
    test_protocol = {
        "name": "Test Emergency Protocol",
        "type": "test",
        "description": "This is a test protocol for API testing",
        "steps": [
            "Step 1: Test the API",
            "Step 2: Verify the response",
            "Step 3: Clean up test data"
        ],
        "status": "active"
    }
    
    try:
        response = requests.post(BASE_URL, json=test_protocol)
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 201:
            data = response.json()
            print(f"✅ Success! Created protocol: {data.get('protocol', {}).get('name')}")
            return data.get('protocol', {}).get('id')
        else:
            print(f"❌ Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return None


def test_get_protocol_by_id(protocol_id):
    """Test GET /api/emergency/protocols/{id}"""
    print(f"\n🧪 Testing GET /api/emergency/protocols/{protocol_id}")
    
    try:
        response = requests.get(f"{BASE_URL}/{protocol_id}")
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            protocol = data.get('protocol', {})
            print(f"✅ Success! Retrieved protocol: {protocol.get('name')}")
            return True
        else:
            print(f"❌ Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False


def test_update_protocol(protocol_id):
    """Test PUT /api/emergency/protocols/{id}"""
    print(f"\n🧪 Testing PUT /api/emergency/protocols/{protocol_id}")
    
    update_data = {
        "name": "Updated Test Emergency Protocol",
        "description": "This protocol has been updated for testing",
        "steps": [
            "Step 1: Test the API",
            "Step 2: Verify the response",
            "Step 3: Update the protocol",
            "Step 4: Clean up test data"
        ]
    }
    
    try:
        response = requests.put(f"{BASE_URL}/{protocol_id}", json=update_data)
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success! Updated protocol: {data.get('protocol', {}).get('name')}")
            return True
        else:
            print(f"❌ Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False


def test_delete_protocol(protocol_id):
    """Test DELETE /api/emergency/protocols/{id}"""
    print(f"\n🧪 Testing DELETE /api/emergency/protocols/{protocol_id}")
    
    try:
        response = requests.delete(f"{BASE_URL}/{protocol_id}")
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success! Deleted protocol: {data.get('deleted_protocol', {}).get('name')}")
            return True
        else:
            print(f"❌ Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False


def test_filter_protocols():
    """Test filtering protocols by type and status"""
    print("\n🧪 Testing protocol filtering")
    
    try:
        # Test filtering by type
        response = requests.get(f"{BASE_URL}?type=flood")
        print(f"📊 Filter by type=flood - Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Found {data.get('total', 0)} flood protocols")
        
        # Test filtering by status
        response = requests.get(f"{BASE_URL}?status=active")
        print(f"📊 Filter by status=active - Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Found {data.get('total', 0)} active protocols")
        
        return True
        
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False


def main():
    """Run all tests"""
    print("🚨 Emergency Protocols API Test Suite")
    print("=" * 50)
    
    # Test 1: Get all protocols
    test_get_protocols()
    
    # Test 2: Create a new protocol
    protocol_id = test_create_protocol()
    
    if protocol_id:
        # Test 3: Get protocol by ID
        test_get_protocol_by_id(protocol_id)
        
        # Test 4: Update protocol
        test_update_protocol(protocol_id)
        
        # Test 5: Get updated protocol
        test_get_protocol_by_id(protocol_id)
        
        # Test 6: Delete protocol
        test_delete_protocol(protocol_id)
    
    # Test 7: Test filtering
    test_filter_protocols()
    
    print("\n🎉 Test suite completed!")


if __name__ == "__main__":
    main()
