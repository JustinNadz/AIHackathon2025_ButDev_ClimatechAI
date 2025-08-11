#!/usr/bin/env python3
"""
Script to run flood and landslide data ingestion into PostgreSQL with PostGIS
"""
import os
import sys
from ingest.flood_ingestor import FloodIngestor
from ingest.landslide_ingestor import LandslideIngestor


def main():
    """Main ingestion function"""
    print("🌊 Disaster Data Ingestion Tool")
    print("=" * 40)
    
    if len(sys.argv) < 3:
        print("Usage: python run_ingestions.py <data_type> <file_path> [options]")
        print("\nData types:")
        print("  flood     - Ingest flood data (uses 'Var' column)")
        print("  landslide - Ingest landslide data (uses 'HAZ' column)")
        print("\nExamples:")
        print("  python run_ingestions.py flood data/flood_zones.shp")
        print("  python run_ingestions.py landslide data/landslide_zones.shp")
        print("  python run_ingestions.py flood data/flood_zones.shp --risk-column Risk")
        print("  python run_ingestions.py landslide data/landslide_zones.shp --risk-column HAZ")
        return
    
    data_type = sys.argv[1].lower()
    file_path = sys.argv[2]
    
    # Parse additional options
    risk_column = None
    for i, arg in enumerate(sys.argv[3:], 3):
        if arg == "--risk-column" and i + 1 < len(sys.argv):
            risk_column = sys.argv[i + 1]
    
    print(f"Processing {data_type} data from: {file_path}")
    
    if not os.path.exists(file_path):
        print(f"❌ Error: File not found: {file_path}")
        sys.exit(1)
    
    try:
        if data_type == "flood":
            # Set default risk column for flood data
            if not risk_column:
                risk_column = "Var"
            
            print(f"🌊 Ingesting flood data with risk column: {risk_column}")
            ingestor = FloodIngestor()
            ingestor.ingest_shp(
                file_path=file_path,
                risk_column=risk_column,
                default_risk=2.0
            )
            
        elif data_type == "landslide":
            # Set default risk column for landslide data
            if not risk_column:
                risk_column = "HAZ"
            
            print(f"🏔️ Ingesting landslide data with risk column: {risk_column}")
            ingestor = LandslideIngestor()
            ingestor.ingest_shp(
                file_path=file_path,
                risk_column=risk_column,
                default_risk=2.0
            )
            
        else:
            print(f"❌ Error: Unknown data type '{data_type}'")
            print("Supported types: flood, landslide")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Error during ingestion: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
