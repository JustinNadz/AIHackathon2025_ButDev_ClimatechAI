#!/usr/bin/env python3
"""
Example script for ingesting flood data with large multipolygons
that have millions of coordinates by splitting them into smaller pieces.
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
    """Main function demonstrating large multipolygon ingestion"""
    
    # Example shapefile path - update this to your actual file
    shapefile_path = "datasets/Iloilo_Flood_5year.shp"
    
    # Check if file exists
    if not os.path.exists(shapefile_path):
        logger.error(f"Shapefile not found: {shapefile_path}")
        logger.info("Please update the shapefile_path variable to point to your flood data file")
        return
    
    logger.info("🚀 Starting large multipolygon ingestion examples...")
    
    # Example 1: Split large multipolygons into manageable pieces
    logger.info("\n" + "="*60)
    logger.info("EXAMPLE 1: Split large multipolygons (recommended for your case)")
    logger.info("="*60)
    
    ingestor_split = FloodIngestor(
        chunk_size=1,        # Process 1 feature at a time since you have only 3
        batch_size=50        # Commit 50 records per batch
    )
    
    try:
        ingestor_split.ingest_shp(
            file_path=shapefile_path,
            risk_column="Var",  # Update this to match your data column
            default_risk=2.0,
            split_large_geometries=True,           # Enable geometry splitting
            max_coordinates_per_polygon=5000       # Max 5000 coords per resulting polygon
        )
    except Exception as e:
        logger.error(f"Split ingestion failed: {e}")
    
    # Example 2: More aggressive splitting for very large geometries
    logger.info("\n" + "="*60)
    logger.info("EXAMPLE 2: Aggressive splitting for very large geometries")
    logger.info("="*60)
    
    ingestor_aggressive = FloodIngestor(
        chunk_size=1,
        batch_size=100
    )
    
    try:
        ingestor_aggressive.ingest_shp(
            file_path=shapefile_path,
            risk_column="Var",  # Update this to match your data column
            default_risk=2.0,
            split_large_geometries=True,           # Enable geometry splitting
            max_coordinates_per_polygon=1000       # Very small polygons (1000 coords each)
        )
    except Exception as e:
        logger.error(f"Aggressive splitting failed: {e}")
    
    # Example 3: Optimized approach with splitting
    logger.info("\n" + "="*60)
    logger.info("EXAMPLE 3: Optimized approach with geometry splitting")
    logger.info("="*60)
    
    ingestor_optimized = FloodIngestor(
        chunk_size=1,
        batch_size=200
    )
    
    try:
        ingestor_optimized.ingest_shp_optimized(
            file_path=shapefile_path,
            risk_column="Var",  # Update this to match your data column
            default_risk=2.0,
            max_coordinates_per_polygon=3000       # Medium-sized polygons
        )
    except Exception as e:
        logger.error(f"Optimized splitting failed: {e}")
    
    logger.info("\n" + "="*60)
    logger.info("✅ All examples completed!")
    logger.info("="*60)


def explain_multipolygon_splitting():
    """Explain how multipolygon splitting works"""
    logger.info("\n" + "="*60)
    logger.info("HOW MULTIPOLYGON SPLITTING WORKS")
    logger.info("="*60)
    
    explanation = [
        "1. Your dataset has 3 features, each with a large multipolygon",
        "2. Each multipolygon contains millions of coordinates",
        "3. The splitting algorithm:",
        "   - Takes each multipolygon",
        "   - Groups its polygons into smaller multipolygons",
        "   - Ensures each resulting multipolygon has ≤ max_coordinates_per_polygon",
        "   - Creates multiple database records from one original feature",
        "",
        "4. Benefits:",
        "   - Prevents database crashes from huge geometries",
        "   - Improves query performance",
        "   - Reduces memory usage",
        "   - Makes data more manageable",
        "",
        "5. Example:",
        "   - Original: 1 feature with 2M coordinates",
        "   - After splitting: 400 features with 5000 coordinates each",
        "   - Same geographic coverage, smaller individual pieces"
    ]
    
    for line in explanation:
        logger.info(line)


def recommended_settings():
    """Print recommended settings for different scenarios"""
    logger.info("\n" + "="*60)
    logger.info("RECOMMENDED SETTINGS")
    logger.info("="*60)
    
    scenarios = [
        ("Small multipolygons (< 100K coords)", "10000", "Standard ingestion"),
        ("Medium multipolygons (100K - 1M coords)", "5000", "Split with medium chunks"),
        ("Large multipolygons (1M - 5M coords)", "3000", "Split with small chunks"),
        ("Very large multipolygons (> 5M coords)", "1000", "Aggressive splitting"),
    ]
    
    logger.info("Scenario | Max Coords Per Polygon | Approach")
    logger.info("-" * 50)
    for scenario, max_coords, approach in scenarios:
        logger.info(f"{scenario:<35} | {max_coords:<20} | {approach}")


if __name__ == "__main__":
    main()
    explain_multipolygon_splitting()
    recommended_settings()
