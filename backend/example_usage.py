#!/usr/bin/env python3
"""
Example usage of the PostgreSQL + PostGIS flood data system
"""

from db.base import SessionLocal
from db.queries import (
    add_flood_data, 
    get_flood_data_by_risk, 
    get_flood_data_by_area,
    get_flood_data_within_bounds,
    get_high_risk_areas
)
from db.models import FloodData
import json


def example_add_flood_data():
    """Example of adding flood data to the database"""
    print("🌊 Adding example flood data...")
    
    db = SessionLocal()
    
    try:
        # Example 1: Add a flood zone (polygon)
        flood_zone_wkt = "POLYGON((-74.01 40.71, -74.01 40.72, -74.00 40.72, -74.00 40.71, -74.01 40.71))"
        
        flood_data1 = add_flood_data(
            db=db,
            geometry_wkt=flood_zone_wkt,
            risk_level=1.8,  # High risk
            area_name="Downtown Flood Zone",
            date_recorded="2024-01-20",
            additional_data={
                "elevation": "5m",
                "population": "15000",
                "infrastructure": "commercial"
            }
        )
        print(f"✅ Added flood zone: {flood_data1.area_name} (Risk: {flood_data1.risk_level})")
        
        # Example 2: Add a flood point (point geometry)
        flood_point_wkt = "POINT(-73.99 40.715)"
        
        flood_data2 = add_flood_data(
            db=db,
            geometry_wkt=flood_point_wkt,
            risk_level=0.5,  # Low risk
            area_name="Riverside Park",
            date_recorded="2024-01-21",
            additional_data={
                "elevation": "12m",
                "land_use": "recreational",
                "drainage": "good"
            }
        )
        print(f"✅ Added flood point: {flood_data2.area_name} (Risk: {flood_data2.risk_level})")
        
        # Example 3: Add another high-risk area
        high_risk_zone_wkt = "POLYGON((-73.98 40.70, -73.98 40.71, -73.97 40.71, -73.97 40.70, -73.98 40.70))"
        
        flood_data3 = add_flood_data(
            db=db,
            geometry_wkt=high_risk_zone_wkt,
            risk_level=2.0,  # Maximum risk
            area_name="Industrial District",
            date_recorded="2024-01-22",
            additional_data={
                "elevation": "2m",
                "land_use": "industrial",
                "critical_facilities": "chemical_plant"
            }
        )
        print(f"✅ Added high-risk zone: {flood_data3.area_name} (Risk: {flood_data3.risk_level})")
        
    finally:
        db.close()


def example_query_flood_data():
    """Example of querying flood data"""
    print("\n🔍 Querying flood data...")
    
    db = SessionLocal()
    
    try:
        # Query 1: Get all high-risk areas (risk >= 1.5)
        high_risk_areas = get_high_risk_areas(db, risk_threshold=1.5)
        print(f"📍 High-risk areas (risk >= 1.5): {len(high_risk_areas)} found")
        for area in high_risk_areas:
            print(f"  - {area.area_name}: Risk {area.risk_level}")
        
        # Query 2: Get areas by risk range
        medium_risk = get_flood_data_by_risk(db, min_risk=0.5, max_risk=1.0)
        print(f"\n📍 Medium-risk areas (0.5 <= risk <= 1.0): {len(medium_risk)} found")
        for area in medium_risk:
            print(f"  - {area.area_name}: Risk {area.risk_level}")
        
        # Query 3: Get data by area name
        downtown_data = get_flood_data_by_area(db, "Downtown Flood Zone")
        print(f"\n📍 Downtown Flood Zone data: {len(downtown_data)} records")
        for data in downtown_data:
            print(f"  - Risk: {data.risk_level}, Date: {data.date_recorded}")
            if data.additional_data:
                metadata = json.loads(data.additional_data)
                print(f"    Population: {metadata.get('population', 'N/A')}")
        
        # Query 4: Spatial query within bounds
        bounds_wkt = "POLYGON((-74.02 40.70, -74.02 40.73, -73.96 40.73, -73.96 40.70, -74.02 40.70))"
        within_bounds = get_flood_data_within_bounds(db, bounds_wkt)
        print(f"\n📍 Areas within bounds: {len(within_bounds)} found")
        
    finally:
        db.close()


def example_risk_analysis():
    """Example of risk analysis"""
    print("\n📊 Risk Analysis...")
    
    db = SessionLocal()
    
    try:
        # Get all flood data
        all_data = db.query(FloodData).all()
        
        if all_data:
            # Calculate statistics
            risks = [data.risk_level for data in all_data]
            avg_risk = sum(risks) / len(risks)
            max_risk = max(risks)
            min_risk = min(risks)
            
            print(f"📈 Risk Statistics:")
            print(f"  - Total areas: {len(all_data)}")
            print(f"  - Average risk: {avg_risk:.2f}")
            print(f"  - Maximum risk: {max_risk:.2f}")
            print(f"  - Minimum risk: {min_risk:.2f}")
            
            # Risk distribution
            low_risk = len([r for r in risks if r < 1.0])
            medium_risk = len([r for r in risks if 1.0 <= r < 1.5])
            high_risk = len([r for r in risks if r >= 1.5])
            
            print(f"\n📊 Risk Distribution:")
            print(f"  - Low risk (< 1.0): {low_risk} areas")
            print(f"  - Medium risk (1.0-1.5): {medium_risk} areas")
            print(f"  - High risk (>= 1.5): {high_risk} areas")
            
            # Critical areas (risk >= 1.8)
            critical_areas = [data for data in all_data if data.risk_level >= 1.8]
            print(f"\n🚨 Critical Areas (risk >= 1.8): {len(critical_areas)}")
            for area in critical_areas:
                print(f"  - {area.area_name}: Risk {area.risk_level}")
                if area.additional_data:
                    metadata = json.loads(area.additional_data)
                    if 'critical_facilities' in metadata:
                        print(f"    Critical facilities: {metadata['critical_facilities']}")
        
    finally:
        db.close()


def main():
    """Run all examples"""
    print("🌊 PostgreSQL + PostGIS Flood Data System Examples")
    print("=" * 50)
    
    try:
        # Add example data
        example_add_flood_data()
        
        # Query the data
        example_query_flood_data()
        
        # Perform risk analysis
        example_risk_analysis()
        
        print("\n🎉 Examples completed successfully!")
        print("\n💡 Try running 'python test_db.py' to verify your setup")
        
    except Exception as e:
        print(f"❌ Error running examples: {e}")
        print("Make sure your database is initialized with 'python init_db.py'")


if __name__ == "__main__":
    main()
