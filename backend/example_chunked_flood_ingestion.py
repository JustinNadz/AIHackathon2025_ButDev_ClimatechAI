#!/usr/bin/env python3
"""
Example script demonstrating chunked flood data ingestion
for handling large datasets with 2 million+ points efficiently.
"""

import os
import sys
from ingest.flood_ingestor import FloodIngestor
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def main():
    """Main function demonstrating chunked flood ingestion"""
    
    # Example shapefile path - update this to your actual file
    shapefile_path = "datasets/Iloilo_Flood_5year.shp"
    
    # Check if file exists
    if not os.path.exists(shapefile_path):
        logger.error(f"Shapefile not found: {shapefile_path}")
        logger.info("Please update the shapefile_path variable to point to your flood data file")
        return
    
    # Initialize ingestor with different configurations
    logger.info("🚀 Starting flood data ingestion examples...")
    
    # Example 1: Standard chunked ingestion
    logger.info("\n" + "="*60)
    logger.info("EXAMPLE 1: Standard chunked ingestion")
    logger.info("="*60)
    
    ingestor_standard = FloodIngestor(
        chunk_size=1000,    # Process 1000 features per chunk
        batch_size=100      # Commit 100 records per batch
    )
    
    try:
        ingestor_standard.ingest_shp(
            file_path=shapefile_path,
            risk_column="Var",  # Update this to match your data column
            default_risk=2.0,
            max_coordinates=1000,
            simplify_tolerance=0.0001
        )
    except Exception as e:
        logger.error(f"Standard ingestion failed: {e}")
    
    # Example 2: Optimized for large datasets (2M+ points)
    logger.info("\n" + "="*60)
    logger.info("EXAMPLE 2: Optimized for large datasets")
    logger.info("="*60)
    
    ingestor_optimized = FloodIngestor(
        chunk_size=5000,    # Larger chunks for big datasets
        batch_size=500      # Larger batches for efficiency
    )
    
    try:
        ingestor_optimized.ingest_shp_optimized(
            file_path=shapefile_path,
            risk_column="Var",  # Update this to match your data column
            default_risk=2.0,
            max_coordinates=1000,
            simplify_tolerance=0.0001
        )
    except Exception as e:
        logger.error(f"Optimized ingestion failed: {e}")
    
    # Example 3: Custom chunk size for specific use case
    logger.info("\n" + "="*60)
    logger.info("EXAMPLE 3: Custom chunk size")
    logger.info("="*60)
    
    ingestor_custom = FloodIngestor(
        chunk_size=2000,    # Custom chunk size
        batch_size=200      # Custom batch size
    )
    
    try:
        ingestor_custom.ingest_shp(
            file_path=shapefile_path,
            risk_column="Var",  # Update this to match your data column
            default_risk=2.0,
            max_coordinates=1000,
            simplify_tolerance=0.0001,
            chunk_size=3000  # Override default chunk size
        )
    except Exception as e:
        logger.error(f"Custom ingestion failed: {e}")
    
    logger.info("\n" + "="*60)
    logger.info("✅ All examples completed!")
    logger.info("="*60)


def performance_tips():
    """Print performance optimization tips"""
    logger.info("\n" + "="*60)
    logger.info("PERFORMANCE OPTIMIZATION TIPS")
    logger.info("="*60)
    
    tips = [
        "1. For datasets with 2M+ points, use ingest_shp_optimized()",
        "2. Increase chunk_size for better memory management",
        "3. Increase batch_size for faster database commits",
        "4. Use higher simplify_tolerance for very large geometries",
        "5. Monitor memory usage and adjust chunk_size accordingly",
        "6. Consider using a larger max_coordinates threshold",
        "7. Use logging to monitor progress and identify bottlenecks",
        "8. For very large datasets, consider preprocessing with QGIS",
        "9. Ensure your PostgreSQL database has adequate memory",
        "10. Consider using COPY commands for ultimate performance"
    ]
    
    for tip in tips:
        logger.info(tip)


if __name__ == "__main__":
    main()
    performance_tips()
