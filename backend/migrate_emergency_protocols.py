#!/usr/bin/env python3
"""
Migration script to transfer emergency protocols from MongoDB to PostgreSQL
This script helps migrate existing emergency protocols data between databases
"""

import os
import sys
import json
from datetime import datetime
from pymongo import MongoClient
from sqlalchemy.orm import Session

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db.base import SessionLocal
from db.queries import create_emergency_protocol, get_all_emergency_protocols


def export_from_mongodb(mongodb_uri: str, database_name: str, collection_name: str = 'emergency_protocols'):
    """
    Export emergency protocols from MongoDB
    
    Args:
        mongodb_uri: MongoDB connection string
        database_name: MongoDB database name
        collection_name: MongoDB collection name
    
    Returns:
        List of protocol documents
    """
    try:
        print(f"📤 Exporting emergency protocols from MongoDB...")
        print(f"🔗 URI: {mongodb_uri}")
        print(f"🗄️ Database: {database_name}")
        print(f"📁 Collection: {collection_name}")
        
        # Connect to MongoDB
        client = MongoClient(mongodb_uri)
        db = client[database_name]
        collection = db[collection_name]
        
        # Get all protocols
        protocols = list(collection.find({}))
        
        print(f"✅ Exported {len(protocols)} protocols from MongoDB")
        
        # Convert ObjectId to string for JSON serialization
        for protocol in protocols:
            if '_id' in protocol:
                protocol['_id'] = str(protocol['_id'])
        
        return protocols
        
    except Exception as e:
        print(f"❌ Error exporting from MongoDB: {e}")
        return []


def import_to_postgresql(protocols_data: list):
    """
    Import emergency protocols to PostgreSQL
    
    Args:
        protocols_data: List of protocol documents from MongoDB
    
    Returns:
        Number of successfully imported protocols
    """
    db = SessionLocal()
    imported_count = 0
    
    try:
        print(f"📥 Importing {len(protocols_data)} protocols to PostgreSQL...")
        
        for i, protocol_data in enumerate(protocols_data, 1):
            try:
                print(f"🔄 Processing protocol {i}/{len(protocols_data)}: {protocol_data.get('name', 'Unknown')}")
                
                # Extract data from MongoDB document
                name = protocol_data.get('name', '')
                protocol_type = protocol_data.get('type', 'general')
                description = protocol_data.get('description', '')
                steps = protocol_data.get('steps', [])
                status = protocol_data.get('status', 'active')
                
                # Validate required fields
                if not name:
                    print(f"⚠️ Skipping protocol {i}: missing name")
                    continue
                
                # Create protocol in PostgreSQL
                new_protocol = create_emergency_protocol(
                    db=db,
                    name=name,
                    protocol_type=protocol_type,
                    description=description,
                    steps=steps,
                    status=status
                )
                
                print(f"✅ Imported protocol: {new_protocol.name} (ID: {new_protocol.id})")
                imported_count += 1
                
            except Exception as e:
                print(f"❌ Error importing protocol {i}: {e}")
                continue
        
        print(f"✅ Successfully imported {imported_count}/{len(protocols_data)} protocols")
        return imported_count
        
    except Exception as e:
        print(f"❌ Error during PostgreSQL import: {e}")
        return imported_count
    
    finally:
        db.close()


def verify_migration():
    """
    Verify that the migration was successful by comparing data
    """
    db = SessionLocal()
    
    try:
        print("🔍 Verifying migration...")
        
        # Get protocols from PostgreSQL
        postgres_protocols = get_all_emergency_protocols(db)
        
        print(f"📊 PostgreSQL protocols count: {len(postgres_protocols)}")
        
        if postgres_protocols:
            print("📋 Sample protocols in PostgreSQL:")
            for i, protocol in enumerate(postgres_protocols[:3], 1):
                print(f"  {i}. {protocol.name} ({protocol.type}) - {protocol.status}")
        
        return len(postgres_protocols)
        
    except Exception as e:
        print(f"❌ Error verifying migration: {e}")
        return 0
    
    finally:
        db.close()


def create_sample_protocols():
    """
    Create sample emergency protocols for testing
    """
    db = SessionLocal()
    
    try:
        print("🧪 Creating sample emergency protocols...")
        
        sample_protocols = [
            {
                "name": "Flood Emergency Response",
                "type": "flood",
                "description": "Standard operating procedures for flood emergencies",
                "steps": [
                    "Assess water level and flow direction",
                    "Evacuate to higher ground immediately",
                    "Avoid walking or driving through floodwaters",
                    "Contact emergency services",
                    "Monitor local weather updates"
                ],
                "status": "active"
            },
            {
                "name": "Earthquake Safety Protocol",
                "type": "earthquake",
                "description": "Emergency procedures during and after earthquakes",
                "steps": [
                    "Drop, Cover, and Hold On",
                    "Stay indoors until shaking stops",
                    "Check for injuries and damage",
                    "Evacuate if building is unsafe",
                    "Listen to emergency broadcasts"
                ],
                "status": "active"
            },
            {
                "name": "Landslide Preparedness",
                "type": "landslide",
                "description": "Prevention and response to landslide events",
                "steps": [
                    "Monitor rainfall and soil conditions",
                    "Watch for warning signs (cracks, tilting trees)",
                    "Evacuate immediately if landslide is imminent",
                    "Stay away from steep slopes",
                    "Report landslides to authorities"
                ],
                "status": "active"
            }
        ]
        
        created_count = 0
        for protocol_data in sample_protocols:
            try:
                protocol = create_emergency_protocol(
                    db=db,
                    name=protocol_data["name"],
                    protocol_type=protocol_data["type"],
                    description=protocol_data["description"],
                    steps=protocol_data["steps"],
                    status=protocol_data["status"]
                )
                print(f"✅ Created sample protocol: {protocol.name}")
                created_count += 1
                
            except Exception as e:
                print(f"❌ Error creating sample protocol: {e}")
        
        print(f"✅ Created {created_count} sample protocols")
        return created_count
        
    except Exception as e:
        print(f"❌ Error creating sample protocols: {e}")
        return 0
    
    finally:
        db.close()


def main():
    """
    Main migration function
    """
    print("🚨 Emergency Protocols Migration Tool")
    print("=" * 50)
    
    # Check if we should create sample data
    if len(sys.argv) > 1 and sys.argv[1] == '--sample':
        create_sample_protocols()
        verify_migration()
        return
    
    # Check if we should migrate from MongoDB
    mongodb_uri = os.getenv('MONGODB_URI')
    mongodb_database = os.getenv('MONGODB_DATABASE', 'climatech-ai')
    
    if mongodb_uri:
        print("🔄 Starting MongoDB to PostgreSQL migration...")
        
        # Export from MongoDB
        protocols_data = export_from_mongodb(mongodb_uri, mongodb_database)
        
        if protocols_data:
            # Import to PostgreSQL
            imported_count = import_to_postgresql(protocols_data)
            
            # Verify migration
            postgres_count = verify_migration()
            
            print(f"\n📊 Migration Summary:")
            print(f"  MongoDB protocols: {len(protocols_data)}")
            print(f"  Imported to PostgreSQL: {imported_count}")
            print(f"  Total in PostgreSQL: {postgres_count}")
            
        else:
            print("❌ No data found in MongoDB or export failed")
    else:
        print("ℹ️ No MongoDB URI found, creating sample protocols instead...")
        create_sample_protocols()
        verify_migration()


if __name__ == "__main__":
    main()
