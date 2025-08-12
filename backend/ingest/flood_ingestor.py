import geopandas as gpd
import pandas as pd
from shapely.geometry import shape, MultiPolygon, Polygon
from db.base import SessionLocal
from db.queries import add_flood_data
import math
from typing import List, Tuple, Optional
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FloodIngestor:
    def __init__(self, chunk_size: int = 1000, batch_size: int = 100):
        """
        Initialize FloodIngestor with chunking capabilities
        
        Args:
            chunk_size: Number of features to process in each chunk (default: 1000)
            batch_size: Number of database inserts per batch (default: 100)
        """
        self.chunk_size = chunk_size
        self.batch_size = batch_size
        self.db = SessionLocal()

    def __del__(self):
        if hasattr(self, 'db'):
            self.db.close()
    
    def _split_large_multipolygon(self, multipolygon, max_coordinates_per_polygon=10000):
        """
        Split a large multipolygon into smaller multipolygons
        
        Args:
            multipolygon: Shapely MultiPolygon object
            max_coordinates_per_polygon: Maximum coordinates per resulting polygon
            
        Returns:
            List of smaller MultiPolygon objects
        """
        if not isinstance(multipolygon, MultiPolygon):
            # If it's a single polygon, wrap it in a MultiPolygon
            if hasattr(multipolygon, 'exterior'):
                multipolygon = MultiPolygon([multipolygon])
            else:
                return [multipolygon]
        
        result_multipolygons = []
        current_polygons = []
        current_coord_count = 0
        
        for polygon in multipolygon.geoms:
            # Count coordinates in this polygon
            polygon_coords = len(list(polygon.exterior.coords))
            for interior in polygon.interiors:
                polygon_coords += len(list(interior.coords))
            
            # If adding this polygon would exceed the limit, create a new multipolygon
            if current_coord_count + polygon_coords > max_coordinates_per_polygon and current_polygons:
                result_multipolygons.append(MultiPolygon(current_polygons))
                current_polygons = [polygon]
                current_coord_count = polygon_coords
            else:
                current_polygons.append(polygon)
                current_coord_count += polygon_coords
        
        # Add the last group of polygons
        if current_polygons:
            result_multipolygons.append(MultiPolygon(current_polygons))
        
        return result_multipolygons
    
    def _simplify_geometry_if_needed(self, geometry, max_coordinates=1000, tolerance=0.0001):
        """
        Simplify geometry if it has too many coordinates to prevent database issues
        
        Args:
            geometry: Shapely geometry object
            max_coordinates: Maximum number of coordinates before simplification
            tolerance: Simplification tolerance (higher = more simplified)
        
        Returns:
            Simplified geometry if needed, original otherwise
        """
        # Count total coordinates in the geometry
        coord_count = 0
        
        # Handle different geometry types
        if hasattr(geometry, 'geoms'):
            # MultiPolygon or other multi-geometry
            for geom in geometry.geoms:
                if hasattr(geom, 'exterior'):
                    # Polygon - count exterior and interior rings
                    coord_count += len(list(geom.exterior.coords))
                    for interior in geom.interiors:
                        coord_count += len(list(interior.coords))
                elif hasattr(geom, 'coords'):
                    # LineString or Point
                    coord_count += len(list(geom.coords))
        elif hasattr(geometry, 'exterior'):
            # Single Polygon
            coord_count += len(list(geometry.exterior.coords))
            for interior in geometry.interiors:
                coord_count += len(list(interior.coords))
        elif hasattr(geometry, 'coords'):
            # LineString, Point, or other single geometry
            coord_count = len(list(geometry.coords))
        
        if coord_count > max_coordinates:
            logger.info(f"⚠️ Large geometry detected ({coord_count} coordinates), simplifying...")
            simplified = geometry.simplify(tolerance=tolerance)
            # Count coordinates after simplification
            simplified_count = 0
            
            if hasattr(simplified, 'geoms'):
                # MultiPolygon or other multi-geometry
                for geom in simplified.geoms:
                    if hasattr(geom, 'exterior'):
                        # Polygon - count exterior and interior rings
                        simplified_count += len(list(geom.exterior.coords))
                        for interior in geom.interiors:
                            simplified_count += len(list(interior.coords))
                    elif hasattr(geom, 'coords'):
                        # LineString or Point
                        simplified_count += len(list(geom.coords))
            elif hasattr(simplified, 'exterior'):
                # Single Polygon
                simplified_count += len(list(simplified.exterior.coords))
                for interior in simplified.interiors:
                    simplified_count += len(list(interior.coords))
            elif hasattr(simplified, 'coords'):
                # LineString, Point, or other single geometry
                simplified_count = len(list(simplified.coords))
            
            logger.info(f"✅ Simplified from {coord_count} to {simplified_count} coordinates")
            return simplified
        
        return geometry

    def _process_chunk(self, chunk_df: pd.DataFrame, risk_column: str, default_risk: float,
                      split_large_geometries: bool = True, max_coordinates_per_polygon: int = 10000) -> Tuple[int, int]:
        """
        Process a chunk of data and return success/failure counts
        
        Args:
            chunk_df: DataFrame chunk to process
            risk_column: Column name containing risk values
            default_risk: Default risk value if risk_column is not provided
            split_large_geometries: Whether to split large multipolygons
            max_coordinates_per_polygon: Maximum coordinates per polygon when splitting
            
        Returns:
            Tuple of (successful_ingestions, failed_ingestions)
        """
        successful_ingestions = 0
        failed_ingestions = 0
        batch_data = []
        
        for idx, row in chunk_df.iterrows():
            try:
                # Get the geometry directly without simplification
                geometry = row.geometry
                
                # Extract risk level
                if risk_column in chunk_df.columns:
                    risk_value = row[risk_column]
                    if pd.isna(risk_value):
                        risk_level = default_risk
                        logger.debug(f"⚠️ Row {idx}: Risk value is NaN, using default: {default_risk}")
                    else:
                        risk_level = float(risk_value)
                        # Ensure risk is within 1-3 range (your data scale)
                        risk_level = max(1.0, min(3.0, risk_level))
                else:
                    risk_level = default_risk
                
                # Split large multipolygons if enabled
                if split_large_geometries:
                    split_geometries = self._split_large_multipolygon(
                        geometry, 
                        max_coordinates_per_polygon=max_coordinates_per_polygon
                    )
                    
                    if len(split_geometries) > 1:
                        logger.info(f"🔄 Row {idx}: Split large multipolygon into {len(split_geometries)} smaller pieces")
                    
                    # Add each split geometry to the batch
                    for split_geom in split_geometries:
                        geometry_wkt = split_geom.wkt
                        batch_data.append((geometry_wkt, risk_level))
                        
                        # Commit batch if it reaches batch_size
                        if len(batch_data) >= self.batch_size:
                            self._commit_batch(batch_data)
                            successful_ingestions += len(batch_data)
                            batch_data = []
                else:
                    # Use original approach - single geometry per row
                    geometry_wkt = geometry.wkt
                    batch_data.append((geometry_wkt, risk_level))
                    
                    # Commit batch if it reaches batch_size
                    if len(batch_data) >= self.batch_size:
                        self._commit_batch(batch_data)
                        successful_ingestions += len(batch_data)
                        batch_data = []
                    
            except Exception as e:
                logger.error(f"❌ Error processing row {idx}: {e}")
                failed_ingestions += 1
                continue
        
        # Commit remaining batch data
        if batch_data:
            try:
                self._commit_batch(batch_data)
                successful_ingestions += len(batch_data)
            except Exception as e:
                logger.error(f"❌ Error committing final batch: {e}")
                failed_ingestions += len(batch_data)
        
        return successful_ingestions, failed_ingestions

    def _commit_batch(self, batch_data: List[Tuple[str, float]]):
        """
        Commit a batch of flood data to the database
        
        Args:
            batch_data: List of tuples containing (geometry_wkt, risk_level)
        """
        from db.models import FloodData
        
        # Create model instances
        flood_data_objects = [
            FloodData(geometry=geometry_wkt, risk_level=risk_level)
            for geometry_wkt, risk_level in batch_data
        ]
        
        # Add all objects to session
        self.db.add_all(flood_data_objects)
        
        # Commit the batch
        self.db.commit()
        
        logger.debug(f"✅ Committed batch of {len(batch_data)} records")

    def ingest_shp(self, file_path: str, risk_column: str = None, default_risk: float = 0.0, 
                   chunk_size: Optional[int] = None, split_large_geometries: bool = True,
                   max_coordinates_per_polygon: int = 10000):
        """
        Ingest shapefile data into PostgreSQL with PostGIS using chunked processing
        
        Args:
            file_path: Path to the shapefile
            risk_column: Column name containing risk values (1-3 scale, default: "Var")
            default_risk: Default risk value if risk_column is not provided (default: 2.0)
            chunk_size: Override default chunk size for this ingestion
            split_large_geometries: Whether to split large multipolygons into smaller pieces
            max_coordinates_per_polygon: Maximum coordinates per polygon when splitting (default: 10000)
        """
        if chunk_size is None:
            chunk_size = self.chunk_size
            
        try:
            logger.info(f"🔄 Starting chunked ingestion of {file_path}")
            logger.info(f"📊 Chunk size: {chunk_size}, Batch size: {self.batch_size}")
            if split_large_geometries:
                logger.info(f"✂️ Large geometry splitting enabled (max {max_coordinates_per_polygon} coords per polygon)")
            
            # Read the shapefile
            gdf = gpd.read_file(file_path)
            total_features = len(gdf)
            
            logger.info(f"📈 Found {total_features} features in {file_path}")
            logger.info(f"📋 Columns available: {list(gdf.columns)}")
            
            # Validate risk column exists
            if risk_column and risk_column not in gdf.columns:
                logger.warning(f"⚠️ Warning: Risk column '{risk_column}' not found in shapefile")
                logger.info(f"Available columns: {list(gdf.columns)}")
                logger.info(f"Using default risk value: {default_risk}")
            
            # Check geometry type
            geometry_types = gdf.geometry.geom_type.unique()
            logger.info(f"🗺️ Geometry types found: {geometry_types}")
            
            # Calculate number of chunks
            num_chunks = math.ceil(total_features / chunk_size)
            logger.info(f"🔢 Will process data in {num_chunks} chunks")
            
            total_successful = 0
            total_failed = 0
            
            # Process data in chunks
            for chunk_idx in range(num_chunks):
                start_idx = chunk_idx * chunk_size
                end_idx = min((chunk_idx + 1) * chunk_size, total_features)
                
                logger.info(f"🔄 Processing chunk {chunk_idx + 1}/{num_chunks} (features {start_idx + 1}-{end_idx})")
                
                # Get chunk of data
                chunk_df = gdf.iloc[start_idx:end_idx].copy()
                
                # Process the chunk
                successful, failed = self._process_chunk(
                    chunk_df=chunk_df,
                    risk_column=risk_column,
                    default_risk=default_risk,
                    split_large_geometries=split_large_geometries,
                    max_coordinates_per_polygon=max_coordinates_per_polygon
                )
                
                total_successful += successful
                total_failed += failed
                
                logger.info(f"✅ Chunk {chunk_idx + 1} complete: {successful} successful, {failed} failed")
                
                # Progress update
                progress = ((chunk_idx + 1) / num_chunks) * 100
                logger.info(f"📊 Overall progress: {progress:.1f}% ({total_successful + total_failed} total records processed)")
            
            logger.info(f"\n🎉 Ingestion complete!")
            logger.info(f"✅ Successfully ingested {total_successful} flood data records")
            if total_failed > 0:
                logger.warning(f"❌ Failed to ingest {total_failed} records")
            
            # Print summary statistics
            if risk_column and risk_column in gdf.columns:
                risk_values = gdf[risk_column].dropna()
                if len(risk_values) > 0:
                    logger.info(f"\n📊 Risk level statistics:")
                    logger.info(f"  - Min risk: {risk_values.min()}")
                    logger.info(f"  - Max risk: {risk_values.max()}")
                    logger.info(f"  - Average risk: {risk_values.mean():.2f}")
                    logger.info(f"  - Unique values: {sorted(risk_values.unique())}")
            
        except Exception as e:
            logger.error(f"❌ Error ingesting shapefile: {e}")
            raise

    def ingest_shp_optimized(self, file_path: str, risk_column: str = None, default_risk: float = 0.0,
                           chunk_size: Optional[int] = None, max_coordinates_per_polygon: int = 5000):
        """
        Optimized version for very large datasets (2M+ points)
        Uses larger chunks and more aggressive splitting
        """
        if chunk_size is None:
            chunk_size = 5000  # Larger chunks for big datasets
            
        logger.info(f"🚀 Starting optimized ingestion for large dataset")
        logger.info(f"📊 Using larger chunk size: {chunk_size}")
        logger.info(f"✂️ Using smaller polygon size limit: {max_coordinates_per_polygon}")
        
        # Use optimized approach with splitting
        return self.ingest_shp(
            file_path=file_path,
            risk_column=risk_column,
            default_risk=default_risk,
            chunk_size=chunk_size,
            split_large_geometries=True,
            max_coordinates_per_polygon=max_coordinates_per_polygon
        )