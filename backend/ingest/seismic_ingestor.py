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
            
            # Convert string columns to numeric for validation
            try:
                lat_series = pd.to_numeric(df['Latitude'], errors='coerce')
                lng_series = pd.to_numeric(df['Longitude'], errors='coerce')
                depth_series = pd.to_numeric(df['Depth_In_Km'], errors='coerce')
                magnitude_series = pd.to_numeric(df['Magnitude'], errors='coerce')
                
                print(f"  - Latitude range: {lat_series.min():.4f} to {lat_series.max():.4f}")
                print(f"  - Longitude range: {lng_series.min():.4f} to {lng_series.max():.4f}")
                print(f"  - Depth range: {depth_series.min():.1f} to {depth_series.max():.1f} km")
                print(f"  - Magnitude range: {magnitude_series.min():.1f} to {magnitude_series.max():.1f}")
                print(f"  - Unique locations: {df['Location'].nunique()}")
                
                # Check for invalid numeric values
                invalid_lat = lat_series.isna().sum()
                invalid_lng = lng_series.isna().sum()
                invalid_depth = depth_series.isna().sum()
                invalid_magnitude = magnitude_series.isna().sum()
                
                if invalid_lat > 0:
                    print(f"  ⚠️ Warning: {invalid_lat} invalid latitude values")
                if invalid_lng > 0:
                    print(f"  ⚠️ Warning: {invalid_lng} invalid longitude values")
                if invalid_depth > 0:
                    print(f"  ⚠️ Warning: {invalid_depth} invalid depth values")
                if invalid_magnitude > 0:
                    print(f"  ⚠️ Warning: {invalid_magnitude} invalid magnitude values")
                    
            except Exception as e:
                print(f"  ⚠️ Warning: Could not validate numeric ranges: {e}")
                print(f"  - Raw latitude sample: {df['Latitude'].head(3).tolist()}")
                print(f"  - Raw longitude sample: {df['Longitude'].head(3).tolist()}")
                print(f"  - Raw depth sample: {df['Depth_In_Km'].head(3).tolist()}")
                print(f"  - Raw magnitude sample: {df['Magnitude'].head(3).tolist()}")
            
            successful_ingestions = 0
            failed_ingestions = 0
            
            for idx, row in df.iterrows():
                try:
                    # Parse date
                    event_time = pd.to_datetime(row['Date_Time_PH'], format=date_format)
                    
                    # Convert string coordinates to float
                    try:
                        lat = float(str(row['Latitude']).strip())
                        lng = float(str(row['Longitude']).strip())
                    except (ValueError, TypeError) as e:
                        print(f"⚠️ Row {idx}: Invalid coordinates - lat: {row['Latitude']}, lng: {row['Longitude']}, skipping")
                        failed_ingestions += 1
                        continue
                    
                    # Create point geometry
                    geometry_wkt = f"POINT({lng} {lat})"
                    
                    # Convert string values to appropriate types
                    try:
                        magnitude = float(str(row['Magnitude']).strip())
                    except (ValueError, TypeError) as e:
                        print(f"⚠️ Row {idx}: Invalid magnitude {row['Magnitude']}, skipping")
                        failed_ingestions += 1
                        continue
                    
                    try:
                        depth = float(str(row['Depth_In_Km']).strip())
                    except (ValueError, TypeError) as e:
                        print(f"⚠️ Row {idx}: Invalid depth {row['Depth_In_Km']}, using None")
                        depth = None
                    
                    location_name = str(row['Location']) if pd.notna(row['Location']) else None
                    
                    
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
            
            # Use the numeric series we created earlier for statistics
            if 'magnitude_series' in locals():
                magnitude_stats = magnitude_series.describe()
                print(f"    Min: {magnitude_stats['min']:.2f}")
                print(f"    Max: {magnitude_stats['max']:.2f}")
                print(f"    Mean: {magnitude_stats['mean']:.2f}")
                print(f"    Median: {magnitude_series.median():.2f}")
                
                # Magnitude categories
                magnitude_categories = {
                    "Micro": len(magnitude_series[magnitude_series < 2.0]),
                    "Minor": len(magnitude_series[(magnitude_series >= 2.0) & (magnitude_series < 4.0)]),
                    "Light": len(magnitude_series[(magnitude_series >= 4.0) & (magnitude_series < 5.0)]),
                    "Moderate": len(magnitude_series[(magnitude_series >= 5.0) & (magnitude_series < 6.0)]),
                    "Strong": len(magnitude_series[(magnitude_series >= 6.0) & (magnitude_series < 7.0)]),
                    "Major": len(magnitude_series[(magnitude_series >= 7.0) & (magnitude_series < 8.0)]),
                    "Great": len(magnitude_series[magnitude_series >= 8.0])
                }
                
                print(f"  - Magnitude categories:")
                for category, count in magnitude_categories.items():
                    if count > 0:
                        print(f"    {category} (≥{self._get_magnitude_threshold(category)}): {count} events")
            else:
                print(f"    ⚠️ Could not calculate magnitude statistics due to data format issues")
            
            print(f"  - Depth distribution:")
            if 'depth_series' in locals():
                depth_stats = depth_series.describe()
                print(f"    Min: {depth_stats['min']:.1f} km")
                print(f"    Max: {depth_stats['max']:.1f} km")
                print(f"    Mean: {depth_stats['mean']:.1f} km")
                print(f"    Median: {depth_series.median():.1f} km")
            else:
                print(f"    ⚠️ Could not calculate depth statistics due to data format issues")
            
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