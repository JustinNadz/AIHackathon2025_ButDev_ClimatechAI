#!/usr/bin/env python3
"""
GeoJSON import script for Pivot Backend
Imports flood and landslide data from GeoJSON files
"""

import json
import pandas as pd
from shapely.geometry import shape
from sqlalchemy.orm import sessionmaker
import os
import sys
from dotenv import load_dotenv
import argparse
import time
from tqdm import tqdm

from database import engine, SessionLocal
from models import FloodData, LandslideData

load_dotenv()

def import_flood_geojson(geojson_path, risk_column='VAR', batch_size=100, max_records=None):
    """
    Import flood data from GeoJSON file
    """
    print(f"Importing flood data from: {geojson_path}")
    start_time = time.time()
    
    try:
        # Read GeoJSON file
        print("Reading GeoJSON file...")
        with open(geojson_path, 'r') as f:
            geojson_data = json.load(f)
        
        features = geojson_data.get('features', [])
        print(f"Loaded {len(features)} flood features")
        
        # Limit records if specified
        if max_records and len(features) > max_records:
            print(f"Limiting to {max_records} records for testing...")
            features = features[:max_records]
        
        # Check if risk column exists in first feature
        if features:
            first_props = features[0].get('properties', {})
            print(f"Available properties: {list(first_props.keys())}")
            
            # Find risk column (case-insensitive)
            risk_column_found = None
            for key in first_props.keys():
                if key.lower() == risk_column.lower():
                    risk_column_found = key
                    break
            
            if risk_column_found:
                risk_column = risk_column_found
                print(f"Using column '{risk_column}' for risk values")
            else:
                print(f"Warning: Column '{risk_column}' not found.")
                # Use first numeric property
                for key, value in first_props.items():
                    if isinstance(value, (int, float)) and key != 'id':
                        risk_column = key
                        print(f"Using column '{risk_column}' instead")
                        break
        
        # Create database session
        Session = sessionmaker(bind=engine)
        session = Session()
        
        imported_count = 0
        error_count = 0
        
        print("Importing to database...")
        # Process with progress bar
        for feature in tqdm(features, desc="Importing records"):
            try:
                properties = feature.get('properties', {})
                geometry_data = feature.get('geometry')
                
                if not geometry_data:
                    print(f"  Skipping feature: No geometry")
                    error_count += 1
                    continue
                
                # Get risk value
                risk_value = properties.get(risk_column, 1)
                if pd.isna(risk_value):
                    risk_value = 1
                
                # Convert geometry to WKT
                try:
                    shapely_geom = shape(geometry_data)
                    geometry_wkt = shapely_geom.wkt
                except Exception as e:
                    print(f"  Error converting geometry: {e}")
                    error_count += 1
                    continue
                
                # Create flood data record
                flood_data = FloodData(
                    geometry=geometry_wkt,
                    risk_value=str(int(risk_value))
                )
                
                session.add(flood_data)
                imported_count += 1
                
                # Commit in batches
                if imported_count % batch_size == 0:
                    session.commit()
                    print(f"  Committed batch. Total imported: {imported_count}")
                
            except Exception as e:
                print(f"Error importing flood feature: {e}")
                error_count += 1
                continue
        
        # Final commit
        session.commit()
        session.close()
        
        elapsed_time = time.time() - start_time
        print(f"✅ Flood data import completed!")
        print(f"   Imported: {imported_count} records")
        print(f"   Errors: {error_count} records")
        print(f"   Time taken: {elapsed_time:.2f} seconds")
        if imported_count > 0:
            print(f"   Average: {elapsed_time/imported_count:.3f} seconds per record")
        
        return imported_count, error_count
        
    except Exception as e:
        print(f"❌ Error importing flood data: {e}")
        import traceback
        traceback.print_exc()
        return 0, 0

def import_landslide_geojson(geojson_path, risk_column='LH', batch_size=100, max_records=None):
    """
    Import landslide data from GeoJSON file
    """
    print(f"Importing landslide data from: {geojson_path}")
    start_time = time.time()
    
    try:
        # Read GeoJSON file
        print("Reading GeoJSON file...")
        with open(geojson_path, 'r') as f:
            geojson_data = json.load(f)
        
        features = geojson_data.get('features', [])
        print(f"Loaded {len(features)} landslide features")
        
        # Limit records if specified
        if max_records and len(features) > max_records:
            print(f"Limiting to {max_records} records for testing...")
            features = features[:max_records]
        
        # Check if risk column exists in first feature
        if features:
            first_props = features[0].get('properties', {})
            print(f"Available properties: {list(first_props.keys())}")
            
            # Find risk column (case-insensitive)
            risk_column_found = None
            for key in first_props.keys():
                if key.lower() == risk_column.lower():
                    risk_column_found = key
                    break
            
            if risk_column_found:
                risk_column = risk_column_found
                print(f"Using column '{risk_column}' for risk values")
            else:
                print(f"Warning: Column '{risk_column}' not found.")
                # Use first numeric property
                for key, value in first_props.items():
                    if isinstance(value, (int, float)) and key != 'id':
                        risk_column = key
                        print(f"Using column '{risk_column}' instead")
                        break
        
        # Create database session
        Session = sessionmaker(bind=engine)
        session = Session()
        
        imported_count = 0
        error_count = 0
        
        print("Importing to database...")
        # Process with progress bar
        for feature in tqdm(features, desc="Importing records"):
            try:
                properties = feature.get('properties', {})
                geometry_data = feature.get('geometry')
                
                if not geometry_data:
                    print(f"  Skipping feature: No geometry")
                    error_count += 1
                    continue
                
                # Get risk value
                risk_value = properties.get(risk_column, 1)
                if pd.isna(risk_value):
                    risk_value = 1
                
                # Convert geometry to WKT
                try:
                    shapely_geom = shape(geometry_data)
                    geometry_wkt = shapely_geom.wkt
                except Exception as e:
                    print(f"  Error converting geometry: {e}")
                    error_count += 1
                    continue
                
                # Create landslide data record
                landslide_data = LandslideData(
                    geometry=geometry_wkt,
                    risk_value=str(int(risk_value))
                )
                
                session.add(landslide_data)
                imported_count += 1
                
                # Commit in batches
                if imported_count % batch_size == 0:
                    session.commit()
                    print(f"  Committed batch. Total imported: {imported_count}")
                
            except Exception as e:
                print(f"Error importing landslide feature: {e}")
                error_count += 1
                continue
        
        # Final commit
        session.commit()
        session.close()
        
        elapsed_time = time.time() - start_time
        print(f"✅ Landslide data import completed!")
        print(f"   Imported: {imported_count} records")
        print(f"   Errors: {error_count} records")
        print(f"   Time taken: {elapsed_time:.2f} seconds")
        if imported_count > 0:
            print(f"   Average: {elapsed_time/imported_count:.3f} seconds per record")
        
        return imported_count, error_count
        
    except Exception as e:
        print(f"❌ Error importing landslide data: {e}")
        import traceback
        traceback.print_exc()
        return 0, 0

def main():
    parser = argparse.ArgumentParser(description='Import GeoJSON data into Pivot Backend')
    parser.add_argument('--type', choices=['flood', 'landslide', 'both'], required=True,
                       help='Type of data to import')
    parser.add_argument('--flood-file', type=str, help='Path to flood GeoJSON file')
    parser.add_argument('--landslide-file', type=str, help='Path to landslide GeoJSON file')
    parser.add_argument('--risk-column', type=str, default='VAR',
                       help='Name of the risk column (default: VAR for flood, LH for landslide)')
    parser.add_argument('--batch-size', type=int, default=100,
                       help='Batch size for database commits (default: 100)')
    parser.add_argument('--max-records', type=int, default=None,
                       help='Maximum number of records to import (for testing)')
    
    args = parser.parse_args()
    
    print("🚀 Starting GeoJSON import...")
    print(f"   Type: {args.type}")
    print(f"   Risk column: {args.risk_column}")
    print(f"   Batch size: {args.batch_size}")
    if args.max_records:
        print(f"   Max records: {args.max_records}")
    print()
    
    total_imported = 0
    total_errors = 0
    
    if args.type in ['flood', 'both']:
        if not args.flood_file:
            print("❌ Error: --flood-file is required for flood import")
            sys.exit(1)
        
        if not os.path.exists(args.flood_file):
            print(f"❌ Error: Flood file not found: {args.flood_file}")
            sys.exit(1)
        
        imported, errors = import_flood_geojson(
            args.flood_file, 
            args.risk_column, 
            args.batch_size,
            args.max_records
        )
        total_imported += imported
        total_errors += errors
        print()
    
    if args.type in ['landslide', 'both']:
        if not args.landslide_file:
            print("❌ Error: --landslide-file is required for landslide import")
            sys.exit(1)
        
        if not os.path.exists(args.landslide_file):
            print(f"❌ Error: Landslide file not found: {args.landslide_file}")
            sys.exit(1)
        
        imported, errors = import_landslide_geojson(
            args.landslide_file, 
            args.risk_column, 
            args.batch_size,
            args.max_records
        )
        total_imported += imported
        total_errors += errors
        print()
    
    print("🎉 Import completed!")
    print(f"   Total imported: {total_imported} records")
    print(f"   Total errors: {total_errors} records")

if __name__ == "__main__":
    main()
