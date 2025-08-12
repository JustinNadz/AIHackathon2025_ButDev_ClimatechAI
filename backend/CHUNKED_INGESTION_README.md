# Chunked Flood Data Ingestion

This document describes the enhanced flood data ingestion system designed to handle large datasets with 2 million+ points efficiently.

## Overview

The original flood ingestor processed data row-by-row with individual database commits, which was inefficient for large datasets. The new chunked system:

- **Processes data in configurable chunks** to manage memory usage
- **Uses batch database commits** for improved performance
- **Provides progress tracking** and detailed logging
- **Includes geometry simplification** to prevent database issues
- **Offers optimized methods** for very large datasets

## Key Features

### 1. Chunked Processing
- Configurable chunk sizes (default: 1000 features per chunk)
- Memory-efficient processing of large datasets
- Progress tracking and logging for each chunk

### 2. Batch Database Operations
- Configurable batch sizes (default: 100 records per batch)
- Reduced database round trips
- Improved transaction performance

### 3. Geometry Simplification
- Automatic detection of large geometries
- Configurable simplification tolerance
- Prevents database crashes with complex geometries

### 4. Multipolygon Splitting
- Splits large multipolygons into smaller, manageable pieces
- Configurable maximum coordinates per resulting polygon
- Converts one large feature into multiple smaller features
- Maintains geographic coverage while improving performance

### 5. Optimized Methods
- `ingest_shp_optimized()` for datasets with 2M+ points
- Larger chunk sizes and more aggressive simplification
- Better memory management for very large datasets

## Usage Examples

### Basic Chunked Ingestion

```python
from ingest.flood_ingestor import FloodIngestor

# Initialize with default settings
ingestor = FloodIngestor(
    chunk_size=1000,    # Process 1000 features per chunk
    batch_size=100      # Commit 100 records per batch
)

# Ingest shapefile
ingestor.ingest_shp(
    file_path="path/to/flood_data.shp",
    risk_column="Var",  # Your risk column name
    default_risk=2.0
)
```

### Optimized for Large Datasets

```python
# For datasets with 2M+ points
ingestor = FloodIngestor(
    chunk_size=5000,    # Larger chunks
    batch_size=500      # Larger batches
)

# Use optimized method
ingestor.ingest_shp_optimized(
    file_path="path/to/large_flood_data.shp",
    risk_column="Var",
    default_risk=2.0
)
```

### Split Large Multipolygons

```python
# For datasets with large multipolygons (millions of coordinates)
ingestor = FloodIngestor(
    chunk_size=1,       # Process one feature at a time
    batch_size=100      # Batch size for database commits
)

# Split large multipolygons into smaller pieces
ingestor.ingest_shp(
    file_path="path/to/flood_data.shp",
    risk_column="Var",
    split_large_geometries=True,           # Enable splitting
    max_coordinates_per_polygon=5000       # Max 5000 coords per polygon
)
```

## Performance Optimization

### Recommended Settings by Dataset Size

| Dataset Size | Chunk Size | Batch Size | Method |
|--------------|------------|------------|---------|
| < 100K points | 1000 | 100 | `ingest_shp()` |
| 100K - 1M points | 2000 | 200 | `ingest_shp()` |
| 1M - 5M points | 5000 | 500 | `ingest_shp_optimized()` |
| > 5M points | 10000 | 1000 | `ingest_shp_optimized()` |

## Example Scripts

Run the example scripts to see the system in action:

```bash
# General chunked ingestion examples
cd backend
python example_chunked_flood_ingestion.py

# Large multipolygon splitting examples
python example_large_multipolygon_ingestion.py
```

## Command Line Usage

### Split Large Multipolygons

```bash
# Split large multipolygons into smaller pieces
python run_ingestions.py flood datasets/flood_data.shp --split-geometries --max-coords-per-polygon 5000

# More aggressive splitting for very large geometries
python run_ingestions.py flood datasets/flood_data.shp --split-geometries --max-coords-per-polygon 1000

# Optimized approach with splitting
python run_ingestions.py flood datasets/flood_data.shp --optimized --split-geometries --max-coords-per-polygon 3000
```
