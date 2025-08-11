import geopandas as gpd
import pandas as pd
from db.base import SessionLocal
from db.queries import add_landslide_data


class LandslideIngestor:
    def __init__(self):
        self.db = SessionLocal()

    def __del__(self):
        if hasattr(self, 'db'):
            self.db.close()

    def ingest_shp(self, file_path: str, class_column: str = None, default_class: float = 0.0):
        """
        Ingest shapefile data into PostgreSQL with PostGIS
        
        Args:
            file_path: Path to the shapefile
            class_column: Column name containing classification values (1-3 scale, default: "HAZ")
            default_class: Default class value if class_column is not provided (default: 2.0)
        """
        try:
            gdf = gpd.read_file(file_path)
            
            print(f"Found {len(gdf)} features in {file_path}")
            print(f"Columns available: {list(gdf.columns)}")
            
            # Validate risk column exists
            if class_column not in gdf.columns:
                print(f"⚠️ Warning: Risk column '{class_column}' not found in shapefile")
                print(f"Available columns: {list(gdf.columns)}")
                print(f"Using default risk value: {default_class}")
            
            # Check geometry type
            geometry_types = gdf.geometry.geom_type.unique()
            print(f"Geometry types found: {geometry_types}")
            
            successful_ingestions = 0
            failed_ingestions = 0
            
            for idx, row in gdf.iterrows():
                try:
                    # Extract geometry as WKT
                    geometry_wkt = row.geometry.wkt
                    
                    # Extract risk level
                    if class_column in gdf.columns:
                        class_value = row[class_column]
                        if pd.isna(class_value):
                            class_level = default_class
                            print(f"⚠️ Row {idx}: Class value is NaN, using default: {default_class}")
                        else:
                            class_level = float(class_value)
                            class_level = max(1.0, min(3.0, class_level))
                    else:
                        class_level = default_class
                    
                    # Add to database
                    add_landslide_data(
                        db=self.db,
                        geometry_wkt=geometry_wkt,
                        risk_level=class_level,
                    )
                    
                    successful_ingestions += 1
                    
                    if (idx + 1) % 100 == 0:
                        print(f"Processed {idx + 1} features...")
                        
                except Exception as e:
                    print(f"❌ Error processing row {idx}: {e}")
                    failed_ingestions += 1
                    continue
            
            print(f"\n✅ Successfully ingested {successful_ingestions} landslide records")
            if failed_ingestions > 0:
                print(f"❌ Failed to ingest {failed_ingestions} records")
            
            # Print summary statistics
            if class_column in gdf.columns:
                class_values = gdf[class_column].dropna()
                if len(class_values) > 0:
                    print(f"\n📊 Classification statistics:")
                    print(f"  - Average class: {class_values.mean():.2f}")
                    print(f"  - Unique values: {sorted(class_values.unique())}")
            
        except Exception as e:
            print(f"❌ Error ingesting shapefile: {e}")
            raise