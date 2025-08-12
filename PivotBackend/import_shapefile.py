#!/usr/bin/env python3
"""
Shapefile import script for Pivot Backend
Imports flood and landslide data from shapefiles with Shapely geometry simplification
"""

import geopandas as gpd
import pandas as pd
from shapely.geometry import MultiPolygon, Polygon
from sqlalchemy.orm import sessionmaker
import os
import sys
from dotenv import load_dotenv
import argparse

from database import engine, SessionLocal
from models import FloodData, LandslideData

load_dotenv()

def simplify_geometry(geometry, tolerance=0.0001):
    """
    Simplify geometry using Shapely simplify method
    Args:
        geometry: Shapely geometry object
        tolerance: Simplification tolerance (higher = more simplified)
    """
    if geometry is None:
        return None
    
    try:
        # Simplify the geometry using the built-in simplify method
        simplified = geometry.simplify(tolerance, preserve_topology=True)
        
        # Ensure we have a valid geometry
        if simplified.is_valid:
            return simplified
        else:
            # Try to fix invalid geometry
            fixed = simplified.buffer(0)
            if fixed.is_valid:
                return fixed
            else:
                print(f"Warning: Could not fix invalid geometry, using original")
                return geometry
    except Exception as e:
        print(f"Error simplifying geometry: {e}")
        return geometry

def import_flood_data(shapefile_path, risk_column='VAR', tolerance=0.0001, batch_size=100):
    """
    Import flood data from shapefile
    """
    print(f"Importing flood data from: {shapefile_path}")
    
    try:
        # Read shapefile
        gdf = gpd.read_file(shapefile_path)
        print(f"Loaded {len(gdf)} flood records")
        print(f"Columns: {list(gdf.columns)}")
        
        # Check if VAR column exists
        if risk_column not in gdf.columns:
            print(f"Warning: Column '{risk_column}' not found. Available columns: {list(gdf.columns)}")
            # Try to find a similar column
            for col in gdf.columns:
                if 'risk' in col.lower() or 'var' in col.lower():
                    risk_column = col
                    print(f"Using column '{risk_column}' instead")
                    break
            else:
                print("No suitable risk column found. Using first numeric column.")
                for col in gdf.columns:
                    if col != 'geometry' and gdf[col].dtype in ['int64', 'float64']:
                        risk_column = col
                        print(f"Using column '{risk_column}' as risk column")
                        break
        
        # Ensure CRS is WGS84 (EPSG:4326)
        if gdf.crs != 'EPSG:4326':
            print(f"Reprojecting from {gdf.crs} to EPSG:4326")
            gdf = gdf.to_crs('EPSG:4326')
        
        # Create database session
        Session = sessionmaker(bind=engine)
        session = Session()
        
        imported_count = 0
        error_count = 0
        
        for index, row in gdf.iterrows():
            try:
                # Get risk value (1-3) from VAR column
                risk_value = row[risk_column]
                if pd.isna(risk_value):
                    risk_value = 1  # Default to low risk
                
                # Convert risk number to severity string
                severity_map = {1: 'low', 2: 'medium', 3: 'high'}
                severity = severity_map.get(int(risk_value), 'low')
                
                # Get geometry (multipolygon)
                geometry = row.geometry
                if geometry is None:
                    print(f"Skipping record {index}: No geometry")
                    error_count += 1
                    continue
                
                # Simplify geometry using Shapely
                simplified_geometry = simplify_geometry(geometry, tolerance)
                
                # Calculate affected area (in square meters)
                affected_area = simplified_geometry.area * 111320 * 111320  # Rough conversion to square meters
                
                # Create flood data record
                flood_data = FloodData(
                    location=simplified_geometry.wkt,
                    flood_level=risk_value,
                    flood_type='shapefile_import',
                    severity=severity,
                    affected_area=affected_area,
                    water_depth=risk_value,
                )
                
                session.add(flood_data)
                imported_count += 1
                
                # Commit in batches
                if imported_count % batch_size == 0:
                    session.commit()
                    print(f"Imported {imported_count} flood records...")
                
            except Exception as e:
                print(f"Error importing flood record {index}: {e}")
                error_count += 1
                continue
        
        # Final commit
        session.commit()
        session.close()
        
        print(f"✅ Flood data import completed!")
        print(f"   Imported: {imported_count} records")
        print(f"   Errors: {error_count} records")
        
        return imported_count, error_count
        
    except Exception as e:
        print(f"❌ Error importing flood data: {e}")
        import traceback
        traceback.print_exc()
        return 0, 0

def import_landslide_data(shapefile_path, risk_column='LH', tolerance=0.0001, batch_size=100):
    """
    Import landslide data from shapefile
    """
    print(f"Importing landslide data from: {shapefile_path}")
    
    try:
        # Read shapefile
        gdf = gpd.read_file(shapefile_path)
        print(f"Loaded {len(gdf)} landslide records")
        print(f"Columns: {list(gdf.columns)}")
        
        # Check if LH column exists
        if risk_column not in gdf.columns:
            print(f"Warning: Column '{risk_column}' not found. Available columns: {list(gdf.columns)}")
            # Try to find a similar column
            for col in gdf.columns:
                if 'risk' in col.lower() or 'lh' in col.lower():
                    risk_column = col
                    print(f"Using column '{risk_column}' instead")
                    break
            else:
                print("No suitable risk column found. Using first numeric column.")
                for col in gdf.columns:
                    if col != 'geometry' and gdf[col].dtype in ['int64', 'float64']:
                        risk_column = col
                        print(f"Using column '{risk_column}' as risk column")
                        break
        
        # Ensure CRS is WGS84 (EPSG:4326)
        if gdf.crs != 'EPSG:4326':
            print(f"Reprojecting from {gdf.crs} to EPSG:4326")
            gdf = gdf.to_crs('EPSG:4326')
        
        # Create database session
        Session = sessionmaker(bind=engine)
        session = Session()
        
        imported_count = 0
        error_count = 0
        
        for index, row in gdf.iterrows():
            try:
                # Get risk value (1-3) from LH column
                risk_value = row[risk_column]
                if pd.isna(risk_value):
                    risk_value = 1  # Default to low risk
                
                # Convert risk number to severity string
                severity_map = {1: 'low', 2: 'medium', 3: 'high'}
                severity = severity_map.get(int(risk_value), 'low')
                
                # Get geometry (multipolygon)
                geometry = row.geometry
                if geometry is None:
                    print(f"Skipping record {index}: No geometry")
                    error_count += 1
                    continue
                
                # Simplify geometry using Shapely
                simplified_geometry = simplify_geometry(geometry, tolerance)
                
                # Calculate affected area (in square meters)
                affected_area = simplified_geometry.area * 111320 * 111320  # Rough conversion to square meters
                
                # Create landslide data record
                landslide_data = LandslideData(
                    location=simplified_geometry.wkt,
                    landslide_type='shapefile_import',
                    severity=severity,
                    affected_area=affected_area,
                    slope_angle=risk_value * 10,  # Rough estimate based on risk
                    soil_type='unknown',
                    vegetation_cover=50.0,  # Default value
                )
                
                session.add(landslide_data)
                imported_count += 1
                
                # Commit in batches
                if imported_count % batch_size == 0:
                    session.commit()
                    print(f"Imported {imported_count} landslide records...")
                
            except Exception as e:
                print(f"Error importing landslide record {index}: {e}")
                error_count += 1
                continue
        
        # Final commit
        session.commit()
        session.close()
        
        print(f"✅ Landslide data import completed!")
        print(f"   Imported: {imported_count} records")
        print(f"   Errors: {error_count} records")
        
        return imported_count, error_count
        
    except Exception as e:
        print(f"❌ Error importing landslide data: {e}")
        import traceback
        traceback.print_exc()
        return 0, 0

def main():
    parser = argparse.ArgumentParser(description='Import shapefile data into Pivot Backend')
    parser.add_argument('--type', choices=['flood', 'landslide', 'both'], required=True,
                       help='Type of data to import')
    parser.add_argument('--flood-file', type=str, help='Path to flood shapefile')
    parser.add_argument('--landslide-file', type=str, help='Path to landslide shapefile')
    parser.add_argument('--risk-column', type=str, default='VAR',
                       help='Name of the risk column (default: VAR for flood, LH for landslide)')
    parser.add_argument('--tolerance', type=float, default=0.0001,
                       help='Geometry simplification tolerance (default: 0.0001)')
    parser.add_argument('--batch-size', type=int, default=100,
                       help='Batch size for database commits (default: 100)')
    
    args = parser.parse_args()
    
    print("🚀 Starting shapefile import...")
    print(f"   Type: {args.type}")
    print(f"   Risk column: {args.risk_column}")
    print(f"   Tolerance: {args.tolerance}")
    print(f"   Batch size: {args.batch_size}")
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
        
        imported, errors = import_flood_data(
            args.flood_file, 
            args.risk_column, 
            args.tolerance, 
            args.batch_size
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
        
        imported, errors = import_landslide_data(
            args.landslide_file, 
            args.risk_column, 
            args.tolerance, 
            args.batch_size
        )
        total_imported += imported
        total_errors += errors
        print()
    
    print("🎉 Import completed!")
    print(f"   Total imported: {total_imported} records")
    print(f"   Total errors: {total_errors} records")

if __name__ == "__main__":
    main()
