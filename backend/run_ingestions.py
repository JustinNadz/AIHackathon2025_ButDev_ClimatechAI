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
        file_type = sys.argv[2] if len(sys.argv) > 2 else "shp"
        
        print(f"Processing file: {file_path}")
        print(f"File type: {file_type}")
        
        ingestor.ingest_shp(
            file_path=file_path,
            risk_column="Var",
        )  
    else:
        print("Usage: python run_ingestions.py <file_path> [file_type]")
        print("Example: python run_ingestions.py data/flood_zones.shp shp")
        print("Example: python run_ingestions.py data/flood_points.csv csv")
        print("\nMake sure your database is initialized first with: python init_db.py")


if __name__ == "__main__":
    main()
