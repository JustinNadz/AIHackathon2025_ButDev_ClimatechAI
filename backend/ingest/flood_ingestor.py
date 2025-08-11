import geopandas as gpd
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
            risk_column: Column name containing risk values (0-2 scale)
        """
        try:
            gdf = gpd.read_file(file_path)
            
            print(f"Found {len(gdf)} features in {file_path}")
            
            for idx, row in gdf.iterrows():
                # Extract geometry as WKT
                geometry_wkt = row.geometry.wkt
                
                # Extract risk level
                if risk_column and risk_column in gdf.columns:
                    risk_level = float(row[risk_column])
                    # Ensure risk is within 0-2 range
                    risk_level = max(0.0, min(2.0, risk_level))
                else:
                    risk_level = default_risk
                
                # Add to database
                add_flood_data(
                    db=self.db,
                    geometry_wkt=geometry_wkt,
                    risk_level=risk_level,
                )
                
            
            print(f"Successfully ingested {len(gdf)} flood data records")
            
        except Exception as e:
            print(f"Error ingesting shapefile: {e}")
            raise