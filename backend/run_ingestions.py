#!/usr/bin/env python3
"""
Script to run flood data ingestion into PostgreSQL with PostGIS
"""
import os
import sys
from ingest.flood_ingestor import FloodIngestor


def main():
    """Main ingestion function"""
    print("🌊 Flood Data Ingestion Tool")
    print("=" * 40)
    
    # Initialize the flood ingestor
    ingestor = FloodIngestor()
    
    # Example usage - modify these paths and parameters as needed
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
        
        print(f"Processing file: {file_path}")
        
        try:
            ingestor.ingest_shp(
                file_path=file_path,
                risk_column="Var", 
                default_risk=2.0  
            )
            
        except Exception as e:
            print(f"❌ Error during ingestion: {e}")
            sys.exit(1)
    else:
        print("Usage: python run_ingestions.py <file_path>")
        print("Example: python run_ingestions.py data/flood_zones.shp")
        print("\nThe system will:")
        print("- Read the shapefile using GeoPandas")
        print("- Extract geometry as WKT (Well-Known Text)")
        print("- Extract risk levels from the 'Var' column (1-3 scale)")
        print("- Store data in PostgreSQL with PostGIS")
        print("\nMake sure your database is initialized first with: python init_db.py")


if __name__ == "__main__":
    main()
