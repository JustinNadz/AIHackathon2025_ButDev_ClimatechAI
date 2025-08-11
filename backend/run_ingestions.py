#!/usr/bin/env python3
"""
Script to run flood, landslide, and weather data ingestion into PostgreSQL with PostGIS
"""
import os
import sys
from ingest.flood_ingestor import FloodIngestor
from ingest.landslide_ingestor import LandslideIngestor
from ingest.weather_ingestor import WeatherIngestor


def main():
    """Main ingestion function"""
    print("🌊 Disaster Data Ingestion Tool")
    print("=" * 40)
    
    if len(sys.argv) < 3:
        print("Usage: python run_ingestions.py <data_type> <file_path> [options]")
        print("\nData types:")
        print("  flood     - Ingest flood data (uses 'Var' column)")
        print("  landslide - Ingest landslide data (uses 'HAZ' column)")
        print("  weather   - Ingest weather data from API")
        print("\nExamples:")
        print("  python run_ingestions.py flood data/flood_zones.shp")
        print("  python run_ingestions.py landslide data/landslide_zones.shp")
        print("  python run_ingestions.py weather --mode cities")
        print("  python run_ingestions.py weather --mode single --lat 14.5995 --lng 120.9842")
        return
    
    data_type = sys.argv[1].lower()
    
    try:
        if data_type == "flood":
            # Handle flood data ingestion
            if len(sys.argv) < 3:
                print("❌ Error: File path required for flood data")
                return
            
            file_path = sys.argv[2]
            if not os.path.exists(file_path):
                print(f"❌ Error: File not found: {file_path}")
                return
            
            # Parse additional options
            risk_column = None
            for i, arg in enumerate(sys.argv[3:], 3):
                if arg == "--risk-column" and i + 1 < len(sys.argv):
                    risk_column = sys.argv[i + 1]
            
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
            # Handle landslide data ingestion
            if len(sys.argv) < 3:
                print("❌ Error: File path required for landslide data")
                return
            
            file_path = sys.argv[2]
            if not os.path.exists(file_path):
                print(f"❌ Error: File not found: {file_path}")
                return
            
            # Parse additional options
            risk_column = None
            for i, arg in enumerate(sys.argv[3:], 3):
                if arg == "--risk-column" and i + 1 < len(sys.argv):
                    risk_column = sys.argv[i + 1]
            
            # Set default risk column for landslide data
            if not risk_column:
                risk_column = "LH"
            
            print(f"🏔️ Ingesting landslide data with risk column: {risk_column}")
            ingestor = LandslideIngestor()
            ingestor.ingest_shp(
                file_path=file_path,
                risk_column=risk_column,
                default_risk=2.0
            )
            
        elif data_type == "weather":
            # Handle weather data ingestion
            print("🌤️ Weather data ingestion")
            
            # Parse weather-specific options
            mode = "cities"  # default mode
            lat = None
            lng = None
            station = None
            api_key = None
            
            for i, arg in enumerate(sys.argv[2:], 2):
                if arg == "--mode" and i + 1 < len(sys.argv):
                    mode = sys.argv[i + 1]
                elif arg == "--lat" and i + 1 < len(sys.argv):
                    lat = float(sys.argv[i + 1])
                elif arg == "--lng" and i + 1 < len(sys.argv):
                    lng = float(sys.argv[i + 1])
                elif arg == "--station" and i + 1 < len(sys.argv):
                    station = sys.argv[i + 1]
                elif arg == "--api-key" and i + 1 < len(sys.argv):
                    api_key = sys.argv[i + 1]
            
            # Initialize weather ingestor
            ingestor = WeatherIngestor(api_key=api_key)
            
            if mode == "single":
                if not lat or not lng:
                    print("❌ Error: --lat and --lng are required for single mode")
                    return
                
                ingestor.ingest_weather_for_location(lat, lng, station)
                
            else:
                print(f"❌ Error: Unknown weather mode '{mode}'")
                return
            
        else:
            print(f"❌ Error: Unknown data type '{data_type}'")
            print("Supported types: flood, landslide, weather")
            return
            
    except Exception as e:
        print(f"❌ Error during ingestion: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
