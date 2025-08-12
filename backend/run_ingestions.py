#!/usr/bin/env python3
"""
Script to run flood, landslide, weather, and seismic data ingestion into PostgreSQL with PostGIS
"""
import os
import sys
from ingest.flood_ingestor import FloodIngestor
from ingest.landslide_ingestor import LandslideIngestor
from ingest.weather_ingestor import WeatherIngestor
from ingest.seismic_ingestor import SeismicIngestor

# TODO: make weather data use the actual api

def main():
    """Main ingestion function"""
    print("🌊 Disaster Data Ingestion Tool")
    print("=" * 40)
    
    if len(sys.argv) < 3:
        print("Usage: python run_ingestions.py <data_type> <file_path> [options]")
        print("\nData types:")
        print("  flood     - Ingest flood data (uses 'Var' column)")
        print("  landslide - Ingest landslide data (uses 'LH' column)")
        print("  weather   - Ingest weather data from API")
        print("  seismic   - Ingest seismic data from CSV")
        print("\nExamples:")
        print("  python run_ingestions.py flood data/flood_zones.shp")
        print("  python run_ingestions.py flood data/flood_zones.shp --max-coordinates 500 --simplify-tolerance 0.001")
        print("  python run_ingestions.py landslide data/landslide_zones.shp")
        print("  python run_ingestions.py weather --mode cities")
        print("  python run_ingestions.py weather --mode single --lat 14.5995 --lng 120.9842")
        print("  python run_ingestions.py seismic data/earthquakes.csv")
        print("  python run_ingestions.py seismic data/earthquakes.csv --date-format '%Y-%m-%d %H:%M:%S'")
        print("  python run_ingestions.py seismic data/earthquakes.csv --validate-only")
        print("\nFlood options:")
        print("  --risk-column <name>        - Specify risk column name (default: 'Var')")
        print("  --chunk-size <number>       - Number of features per chunk (default: 1000)")
        print("  --batch-size <number>       - Number of records per batch (default: 100)")
        print("  --optimized                 - Use optimized settings for large datasets (2M+ points)")
        print("  --split-geometries          - Split large multipolygons into smaller pieces")
        print("  --max-coords-per-polygon <number> - Max coordinates per polygon when splitting (default: 10000)")
        print("\nWeather modes:")
        print("  cities    - Ingest weather for major Philippine cities")
        print("  single    - Ingest weather for a single location")
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
            chunk_size = 1000
            batch_size = 100
            use_optimized = False
            split_geometries = False
            max_coords_per_polygon = 10000
            
            for i, arg in enumerate(sys.argv[3:], 3):
                if arg == "--risk-column" and i + 1 < len(sys.argv):
                    risk_column = sys.argv[i + 1]
                elif arg == "--chunk-size" and i + 1 < len(sys.argv):
                    chunk_size = int(sys.argv[i + 1])
                elif arg == "--batch-size" and i + 1 < len(sys.argv):
                    batch_size = int(sys.argv[i + 1])
                elif arg == "--optimized":
                    use_optimized = True
                elif arg == "--split-geometries":
                    split_geometries = True
                elif arg == "--max-coords-per-polygon" and i + 1 < len(sys.argv):
                    max_coords_per_polygon = int(sys.argv[i + 1])
            
            # Set default risk column for flood data
            if not risk_column:
                risk_column = "Var"
            
            print(f"🌊 Ingesting flood data with risk column: {risk_column}")
            print(f"   Chunk size: {chunk_size}")
            print(f"   Batch size: {batch_size}")
            if split_geometries:
                print(f"   Geometry splitting enabled (max {max_coords_per_polygon} coords per polygon)")
            if use_optimized:
                print(f"   Using optimized mode for large datasets")
            
            ingestor = FloodIngestor(chunk_size=chunk_size, batch_size=batch_size)
            
            if use_optimized:
                ingestor.ingest_shp_optimized(
                    file_path=file_path,
                    risk_column=risk_column,
                    default_risk=2.0,
                    max_coordinates_per_polygon=max_coords_per_polygon
                )
            else:
                ingestor.ingest_shp(
                    file_path=file_path,
                    risk_column=risk_column,
                    default_risk=2.0,
                    split_large_geometries=split_geometries,
                    max_coordinates_per_polygon=max_coords_per_polygon
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
            
        elif data_type == "seismic":
            # Handle seismic data ingestion
            if len(sys.argv) < 3:
                print("❌ Error: File path required for seismic data")
                return
            
            file_path = sys.argv[2]
            if not os.path.exists(file_path):
                print(f"❌ Error: File not found: {file_path}")
                return
            
            # Parse seismic-specific options
            date_format = "%Y-%m-%d %H:%M:%S"  # default format
            validate_only = False
            
            for i, arg in enumerate(sys.argv[3:], 3):
                if arg == "--date-format" and i + 1 < len(sys.argv):
                    date_format = sys.argv[i + 1]
                elif arg == "--validate-only":
                    validate_only = True
            
            print(f"🌋 Ingesting seismic data with date format: {date_format}")
            ingestor = SeismicIngestor()
            
            if validate_only:
                if ingestor.validate_csv_structure(file_path):
                    print("✅ CSV is ready for ingestion")
                else:
                    print("❌ CSV validation failed")
            else:
                success = ingestor.ingest_csv(file_path, date_format)
                if success:
                    print("✅ Seismic data ingestion completed successfully!")
                else:
                    print("❌ Seismic data ingestion failed")
            
        else:
            print(f"❌ Error: Unknown data type '{data_type}'")
            print("Supported types: flood, landslide, weather, seismic")
            return
            
    except Exception as e:
        print(f"❌ Error during ingestion: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
