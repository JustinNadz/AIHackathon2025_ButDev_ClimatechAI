import geopandas as gpd
import pandas as pd
from shapely.geometry import shape
from db.base import SessionLocal
from db.queries import add_flood_data
import json


class FloodIngestor:
    def __init__(self):
        self.db = SessionLocal()

    def __del__(self):
        if hasattr(self, 'db'):
            self.db.close()

    def ingest_shp(self, file_path: str, risk_column: str = None, default_risk: float = 0.0):
        """
        Ingest shapefile data into PostgreSQL with PostGIS
        
        Args:
            file_path: Path to the shapefile
            risk_column: Column name containing risk values (1-3 scale, default: "Var")
            default_risk: Default risk value if risk_column is not provided (default: 2.0)
        """
        try:
            gdf = gpd.read_file(file_path)
            
            print(f"Found {len(gdf)} features in {file_path}")
            print(f"Columns available: {list(gdf.columns)}")
            
            # Validate risk column exists
            if risk_column not in gdf.columns:
                print(f"⚠️ Warning: Risk column '{risk_column}' not found in shapefile")
                print(f"Available columns: {list(gdf.columns)}")
                print(f"Using default risk value: {default_risk}")
            
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
                    if risk_column in gdf.columns:
                        risk_value = row[risk_column]
                        if pd.isna(risk_value):
                            risk_level = default_risk
                            print(f"⚠️ Row {idx}: Risk value is NaN, using default: {default_risk}")
                        else:
                            risk_level = float(risk_value)
                            # Ensure risk is within 1-3 range (your data scale)
                            risk_level = max(1.0, min(3.0, risk_level))
                    else:
                        risk_level = default_risk
                    
                    # Add to database
                    add_flood_data(
                        db=self.db,
                        geometry_wkt=geometry_wkt,
                        risk_level=risk_level,
                    )
                    
                    successful_ingestions += 1
                    
                    if (idx + 1) % 100 == 0:
                        print(f"Processed {idx + 1} features...")
                        
                except Exception as e:
                    print(f"❌ Error processing row {idx}: {e}")
                    failed_ingestions += 1
                    continue
            
            print(f"\n✅ Successfully ingested {successful_ingestions} flood data records")
            if failed_ingestions > 0:
                print(f"❌ Failed to ingest {failed_ingestions} records")
            
            # Print summary statistics
            if risk_column in gdf.columns:
                risk_values = gdf[risk_column].dropna()
                if len(risk_values) > 0:
                    print(f"\n📊 Risk level statistics:")
                    print(f"  - Min risk: {risk_values.min()}")
                    print(f"  - Max risk: {risk_values.max()}")
                    print(f"  - Average risk: {risk_values.mean():.2f}")
                    print(f"  - Unique values: {sorted(risk_values.unique())}")
            
        except Exception as e:
            print(f"❌ Error ingesting shapefile: {e}")
            raise