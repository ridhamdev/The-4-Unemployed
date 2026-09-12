import pytest
from backend.services.gis_service import gis_service, haversine_distance_km

def test_haversine_distance():
    # Distance between Vadodara (22.3072, 73.1812) and Nandesari (22.4125, 73.0944) ~14.6 km
    d = haversine_distance_km(22.3072, 73.1812, 22.4125, 73.0944)
    assert 12.0 < d < 17.0

def test_find_nearest_water_body_nandesari():
    # Test coordinates at Nandesari Chemical Estate (22.4125, 73.0944)
    res = gis_service.find_nearest_water_body(22.4125, 73.0944)
    assert res is not None
    assert "name" in res
    assert "Mini River" in res["name"] or "Mahi River" in res["name"]
    assert res["distance_km"] > 0
    assert res["distance_km"] < 6.0 # Mini River is less than 2 km east
    assert "nearest_boundary_point" in res
    assert len(res["nearest_boundary_point"]) == 2

def test_find_nearest_residential_area_nandesari():
    res = gis_service.find_nearest_residential_area(22.4125, 73.0944)
    assert res is not None
    assert "name" in res
    assert "Nandesari Township" in res["name"] or "Ranoli" in res["name"]
    assert res["distance_km"] > 0
    assert res["distance_km"] < 4.0 # Nandesari Township is ~1-2 km away

def test_compute_buffer_analysis():
    analysis = gis_service.compute_buffer_analysis(22.4125, 73.0944, radius_km=5.0)
    assert analysis["analysis_boundary_km"] == 5.0
    assert analysis["total_territory_area_km2"] > 75.0 # pi * 25 ~ 78.5
    breakdown = analysis["land_cover_breakdown"]
    assert breakdown["industrial_land_km2"] > 0
    assert breakdown["residential_land_km2"] > 0
    assert breakdown["green_agricultural_km2"] > 0
    # Sum of percentages should roughly equal 100%
    total_pct = (breakdown["industrial_percentage"] + 
                 breakdown["residential_percentage"] + 
                 breakdown["water_percentage"] + 
                 breakdown["green_agricultural_percentage"])
    assert 98.0 <= total_pct <= 102.0

def test_get_spatial_layers():
    layers = gis_service.get_spatial_layers(22.4125, 73.0944, radius_km=5.0)
    assert "factory_marker" in layers
    assert "nearest_water_body" in layers
    assert "layers" in layers
    assert "water_bodies" in layers["layers"]
    assert "residential_areas" in layers["layers"]
    assert "industrial_areas" in layers["layers"]
    assert "roads" in layers["layers"]
    assert "monitoring_stations" in layers["layers"]
    assert len(layers["layers"]["water_bodies"]["features"]) >= 3
    assert len(layers["layers"]["residential_areas"]["features"]) >= 3
