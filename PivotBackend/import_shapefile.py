#!/usr/bin/env python3
"""
Optimized shapefile import script for Pivot Backend
Handles large multipolygons with progress reporting and performance optimizations
"""

import geopandas as gpd
import pandas as pd
from shapely.geometry import MultiPolygon, Polygon
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

def simplify_geometry(geometry, tolerance=0.0001):
    """
    Optimized geometry simplification with adaptive tolerance
    """
    if geometry is None:
        return None
    
    try:
        # Adaptive tolerance based on geometry size
        if hasattr(geometry, 'area') and geometry.area > 1000:
            # Increase tolerance for very large geometries
            adaptive_tolerance = max(tolerance, 0.001)
        else:
            adaptive_tolerance = tolerance
        
        # Simplify with adaptive tolerance
        simplified = geometry.simplify(adaptive_tolerance, preserve_topology=True)
        
        # Quick validation
        if simplified.is_valid:
            return simplified
        else:
            # Try to fix invalid geometry
            fixed = simplified.buffer(0)
            if fixed.is_valid:
                return fixed
            else:
                return geometry
    except Exception as e:
        print(f"Error simplifying geometry: {e}")
        return geometry

def preprocess_geometries(gdf, tolerance=0.0001):
    """
    Pre-process all geometries in batch for better performance
    """
    print("Pre-processing geometries...")
    start_time = time.time()
    
    # Create progress bar for geometry processing
    with tqdm(total=len(gdf), desc="Simplifying geometries") as pbar:
        simplified_geometries = []
        areas = []
        
        for idx, row in gdf.iterrows():
            geometry = row.geometry
            if geometry is None:
                simplified_geometries.append(None)
                areas.append(0)
            else:
                # Simplify geometry
                simplified = simplify_geometry(geometry, tolerance)
                simplified_geometries.append(simplified)
                
                # Calculate area
                if simplified:
                    area = simplified.area * 111320 * 111320  # Convert to square meters
                else:
                    area = 0
                areas.append(area)
            
            pbar.update(1)
    
    elapsed = time.time() - start_time
    print(f"Geometry processing completed in {elapsed:.2f} seconds")
    
    return simplified_geometries, areas

def import_flood_data(shapefile_path, risk_column='VAR', tolerance=0.0001, batch_size=100, max_records=None):
    """
    Optimized flood data import with progress reporting
    """
    print(f"Importing flood data from: {shapefile_path}")
    start_time = time.time()
    
    try:
        # Read shapefile
        print("Reading shapefile...")
        gdf = gpd.read_file(shapefile_path)
        print(f"Loaded {len(gdf)} flood records")
        print(f"Columns: {list(gdf.columns)}")
        
        # Limit records if specified
        if max_records and len(gdf) > max_records:
            print(f"Limiting to {max_records} records for testing...")
            gdf = gdf.head(max_records)
        
        # Check if VAR column exists
        if risk_column not in gdf.columns:
            print(f"Warning: Column '{risk_column}' not found. Available columns: {list(gdf.columns)}")
            for col in gdf.columns:
                if 'risk' in col.lower() or 'var' in col.lower():
                    risk_column = col
                    print(f"Using column '{risk_column}' instead")
                    break
        
        # Ensure CRS is WGS84 (EPSG:4326)
        if gdf.crs != 'EPSG:4326':
            print(f"Reprojecting from {gdf.crs} to EPSG:4326...")
            gdf = gdf.to_crs('EPSG:4326')
        
        # Pre-process all geometries
        simplified_geometries, areas = preprocess_geometries(gdf, tolerance)
        
        # Create database session
        Session = sessionmaker(bind=engine)
        session = Session()
        
        imported_count = 0
        error_count = 0
        
        print("Importing to database...")
        # Use tqdm for progress bar
        for index, row in tqdm(gdf.iterrows(), total=len(gdf), desc="Importing records"):
            try:
                # Get risk value
                risk_value = row[risk_column]
                if pd.isna(risk_value):
                    risk_value = 1
                
                # Convert risk to severity
                severity_map = {1: 'low', 2: 'medium', 3: 'high'}
                severity = severity_map.get(int(risk_value), 'low')
                
                # Get pre-processed geometry
                simplified_geometry = simplified_geometries[index]
                if simplified_geometry is None:
                    error_count += 1
                    continue
                
                # Create flood data record
                flood_data = FloodData(
                    location=simplified_geometry.wkt,
                    flood_level=risk_value,
                    flood_type='shapefile_import',
                    severity=severity,
                    affected_area=areas[index],
                    water_depth=risk_value,
                )
                
                session.add(flood_data)
                imported_count += 1
                
                # Commit in batches
                if imported_count % batch_size == 0:
                    session.commit()
                    print(f"  Committed batch. Total imported: {imported_count}")
                
            except Exception as e:
                print(f"Error importing flood record {index}: {e}")
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

def import_landslide_data(shapefile_path, risk_column='LH', tolerance=0.0001, batch_size=100, max_records=None):
    """
    Optimized landslide data import with progress reporting
    """
    print(f"Importing landslide data from: {shapefile_path}")
    start_time = time.time()
    
    try:
        # Read shapefile
        print("Reading shapefile...")
        gdf = gpd.read_file(shapefile_path)
        print(f"Loaded {len(gdf)} landslide records")
        print(f"Columns: {list(gdf.columns)}")
        
        # Limit records if specified
        if max_records and len(gdf) > max_records:
            print(f"Limiting to {max_records} records for testing...")
            gdf = gdf.head(max_records)
        
        # Check if LH column exists
        if risk_column not in gdf.columns:
            print(f"Warning: Column '{risk_column}' not found. Available columns: {list(gdf.columns)}")
            for col in gdf.columns:
                if 'risk' in col.lower() or 'lh' in col.lower():
                    risk_column = col
                    print(f"Using column '{risk_column}' instead")
                    break
        
        # Ensure CRS is WGS84 (EPSG:4326)
        if gdf.crs != 'EPSG:4326':
            print(f"Reprojecting from {gdf.crs} to EPSG:4326...")
            gdf = gdf.to_crs('EPSG:4326')
        
        # Pre-process all geometries
        simplified_geometries, areas = preprocess_geometries(gdf, tolerance)
        
        # Create database session
        Session = sessionmaker(bind=engine)
        session = Session()
        
        imported_count = 0
        error_count = 0
        
        print("Importing to database...")
        # Use tqdm for progress bar
        for index, row in tqdm(gdf.iterrows(), total=len(gdf), desc="Importing records"):
            try:
                # Get risk value
                risk_value = row[risk_column]
                if pd.isna(risk_value):
                    risk_value = 1
                
                # Convert risk to severity
                severity_map = {1: 'low', 2: 'medium', 3: 'high'}
                severity = severity_map.get(int(risk_value), 'low')
                
                # Get pre-processed geometry
                simplified_geometry = simplified_geometries[index]
                if simplified_geometry is None:
                    error_count += 1
                    continue
                
                # Create landslide data record
                landslide_data = LandslideData(
                    location=simplified_geometry.wkt,
                    landslide_type='shapefile_import',
                    severity=severity,
                    affected_area=areas[index],
                    slope_angle=risk_value * 10,
                    soil_type='unknown',
                    vegetation_cover=50.0,
                )
                
                session.add(landslide_data)
                imported_count += 1
                
                # Commit in batches
                if imported_count % batch_size == 0:
                    session.commit()
                    print(f"  Committed batch. Total imported: {imported_count}")
                
            except Exception as e:
                print(f"Error importing landslide record {index}: {e}")
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
    parser.add_argument('--max-records', type=int, default=None,
                       help='Maximum number of records to import (for testing)')
    
    args = parser.parse_args()
    
    print("�� Starting optimized shapefile import...")
    print(f"   Type: {args.type}")
    print(f"   Risk column: {args.risk_column}")
    print(f"   Tolerance: {args.tolerance}")
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
        
        imported, errors = import_flood_data(
            args.flood_file, 
            args.risk_column, 
            args.tolerance, 
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
        
        imported, errors = import_landslide_data(
            args.landslide_file, 
            args.risk_column, 
            args.tolerance, 
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