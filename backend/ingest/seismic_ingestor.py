import pandas as pd
import sys
import os
from datetime import datetime
from db.base import SessionLocal
from db.queries import add_earthquake_data
import time


class SeismicIngestor:
    def __init__(self):
        self.db = SessionLocal()

    def __del__(self):
        if hasattr(self, 'db'):
            self.db.close()

    def ingest_csv(self, file_path: str, date_format: str = "%Y-%m-%d %H:%M:%S"):
        """
        Ingest seismic data from CSV file into PostgreSQL with PostGIS
        
        Args:
            file_path: Path to the CSV file
            date_format: Format of the Date_Time_PH column (default: "%Y-%m-%d %H:%M:%S")
        """
        try:
            print(f"🌋 Seismic Data Ingestion")
            print(f"=" * 50)
            print(f"Processing file: {file_path}")
            
            # Read CSV file
            df = pd.read_csv(file_path)
            
            print(f"Found {len(df)} seismic events in {file_path}")
            print(f"Columns available: {list(df.columns)}")
            
            # Validate required columns
            required_columns = ['Date_Time_PH', 'Latitude', 'Longitude', 'Depth_In_Km', 'Magnitude', 'Location']
            missing_columns = [col for col in required_columns if col not in df.columns]
            
            if missing_columns:
                print(f"❌ Error: Missing required columns: {missing_columns}")
                print(f"Available columns: {list(df.columns)}")
                return False
            
            # Check data types and basic validation
            print(f"\n📊 Data validation:")
            print(f"  - Date range: {df['Date_Time_PH'].min()} to {df['Date_Time_PH'].max()}")
            print(f"  - Latitude range: {df['Latitude'].min():.4f} to {df['Latitude'].max():.4f}")
            print(f"  - Longitude range: {df['Longitude'].min():.4f} to {df['Longitude'].max():.4f}")
            print(f"  - Depth range: {df['Depth_In_Km'].min():.1f} to {df['Depth_In_Km'].max():.1f} km")
            print(f"  - Magnitude range: {df['Magnitude'].min():.1f} to {df['Magnitude'].max():.1f}")
            print(f"  - Unique locations: {df['Location'].nunique()}")
            
            successful_ingestions = 0
            failed_ingestions = 0
            
            for idx, row in df.iterrows():
                try:
                    # Parse date
                    event_time = pd.to_datetime(row['Date_Time_PH'], format=date_format)
                    
                    # Create point geometry
                    geometry_wkt = f"POINT({row['Longitude']} {row['Latitude']})"
                    
                    # Extract data
                    magnitude = float(row['Magnitude'])
                    depth = float(row['Depth_In_Km'])
                    location_name = str(row['Location']) if pd.notna(row['Location']) else None
                    
                    # Validate data
                    if not (4.0 <= row['Latitude'] <= 21.0 and 116.0 <= row['Longitude'] <= 127.0):
                        print(f"⚠️ Row {idx}: Coordinates outside Philippines bounds, skipping")
                        failed_ingestions += 1
                        continue
                    
                    if magnitude < 0 or magnitude > 10:
                        print(f"⚠️ Row {idx}: Invalid magnitude {magnitude}, skipping")
                        failed_ingestions += 1
                        continue
                    
                    if depth < 0 or depth > 700:
                        print(f"⚠️ Row {idx}: Invalid depth {depth} km, skipping")
                        failed_ingestions += 1
                        continue
                    
                    # Add to database
                    add_earthquake_data(
                        db=self.db,
                        geometry_wkt=geometry_wkt,
                        magnitude=magnitude,
                        depth=depth,
                        event_time=event_time,
                        location_name=location_name,
                        source="seismic_csv",
                        metadata={
                            "original_row": idx,
                            "file_source": os.path.basename(file_path)
                        }
                    )
                    
                    successful_ingestions += 1
                    
                    if (idx + 1) % 100 == 0:
                        print(f"Processed {idx + 1} events...")
                        
                except Exception as e:
                    print(f"❌ Error processing row {idx}: {e}")
                    failed_ingestions += 1
                    continue
            
            print(f"\n✅ Successfully ingested {successful_ingestions} seismic events")
            if failed_ingestions > 0:
                print(f"❌ Failed to ingest {failed_ingestions} events")
            
            # Print summary statistics
            print(f"\n📊 Seismic data statistics:")
            print(f"  - Magnitude distribution:")
            magnitude_stats = df['Magnitude'].describe()
            print(f"    Min: {magnitude_stats['min']:.2f}")
            print(f"    Max: {magnitude_stats['max']:.2f}")
            print(f"    Mean: {magnitude_stats['mean']:.2f}")
            print(f"    Median: {df['Magnitude'].median():.2f}")
            
            print(f"  - Depth distribution:")
            depth_stats = df['Depth_In_Km'].describe()
            print(f"    Min: {depth_stats['min']:.1f} km")
            print(f"    Max: {depth_stats['max']:.1f} km")
            print(f"    Mean: {depth_stats['mean']:.1f} km")
            print(f"    Median: {df['Depth_In_Km'].median():.1f} km")
            
            # Magnitude categories
            magnitude_categories = {
                "Micro": len(df[df['Magnitude'] < 2.0]),
                "Minor": len(df[(df['Magnitude'] >= 2.0) & (df['Magnitude'] < 4.0)]),
                "Light": len(df[(df['Magnitude'] >= 4.0) & (df['Magnitude'] < 5.0)]),
                "Moderate": len(df[(df['Magnitude'] >= 5.0) & (df['Magnitude'] < 6.0)]),
                "Strong": len(df[(df['Magnitude'] >= 6.0) & (df['Magnitude'] < 7.0)]),
                "Major": len(df[(df['Magnitude'] >= 7.0) & (df['Magnitude'] < 8.0)]),
                "Great": len(df[df['Magnitude'] >= 8.0])
            }
            
            print(f"  - Magnitude categories:")
            for category, count in magnitude_categories.items():
                if count > 0:
                    print(f"    {category} (≥{self._get_magnitude_threshold(category)}): {count} events")
            
            return True
            
        except Exception as e:
            print(f"❌ Error ingesting seismic CSV: {e}")
            return False
    
    def _get_magnitude_threshold(self, category: str) -> str:
        """Get magnitude threshold for category display"""
        thresholds = {
            "Micro": "2.0",
            "Minor": "2.0",
            "Light": "4.0",
            "Moderate": "5.0",
            "Strong": "6.0",
            "Major": "7.0",
            "Great": "8.0"
        }
        return thresholds.get(category, "0.0")
    
    def validate_csv_structure(self, file_path: str) -> bool:
        """
        Validate CSV structure before ingestion
        
        Args:
            file_path: Path to the CSV file
            
        Returns:
            True if valid, False otherwise
        """
        try:
            df = pd.read_csv(file_path)
            
            required_columns = ['Date_Time_PH', 'Latitude', 'Longitude', 'Depth_In_Km', 'Magnitude', 'Location']
            missing_columns = [col for col in required_columns if col not in df.columns]
            
            if missing_columns:
                print(f"❌ Missing required columns: {missing_columns}")
                print(f"Available columns: {list(df.columns)}")
                return False
            
            print(f"✅ CSV structure is valid")
            print(f"  - Total rows: {len(df)}")
            print(f"  - Date range: {df['Date_Time_PH'].min()} to {df['Date_Time_PH'].max()}")
            print(f"  - Geographic bounds: ({df['Latitude'].min():.4f}, {df['Longitude'].min():.4f}) to ({df['Latitude'].max():.4f}, {df['Longitude'].max():.4f})")
            
            return True
            
        except Exception as e:
            print(f"❌ Error validating CSV: {e}")
            return False


def main():
    """Main function for seismic ingestion"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Seismic Data Ingestion Tool")
    parser.add_argument("file_path", help="Path to the CSV file")
    parser.add_argument("--date-format", default="%Y-%m-%d %H:%M:%S",
                       help="Date format for Date_Time_PH column (default: %%Y-%%m-%%d %%H:%%M:%%S)")
    parser.add_argument("--validate-only", action="store_true",
                       help="Only validate CSV structure without ingesting")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.file_path):
        print(f"❌ Error: File not found: {args.file_path}")
        return
    
    try:
        ingestor = SeismicIngestor()
        
        if args.validate_only:
            print("🔍 Validating CSV structure...")
            if ingestor.validate_csv_structure(args.file_path):
                print("✅ CSV is ready for ingestion")
            else:
                print("❌ CSV validation failed")
        else:
            print("🌋 Starting seismic data ingestion...")
            success = ingestor.ingest_csv(args.file_path, args.date_format)
            
            if success:
                print("\n🎉 Seismic data ingestion completed successfully!")
            else:
                print("\n❌ Seismic data ingestion failed")
        
    except Exception as e:
        print(f"❌ Error during seismic ingestion: {e}")


if __name__ == "__main__":
    main()
