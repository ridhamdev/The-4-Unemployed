from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any
from backend.services.gis_service import gis_service

router = APIRouter(prefix="/api/gis", tags=["Geospatial & Vector GIS Engine"])

@router.get("/layers")
def get_gis_layers(
    latitude: float = Query(22.4125),
    longitude: float = Query(73.0944),
    radius_km: float = Query(5.0)
):
    """
    Returns real vector GIS layers matching Section 5 & 6:
    - Factory: Point
    - Water Bodies: Polygons
    - Residential Areas: Polygons
    - Industrial Areas: Polygons
    - Roads: LineStrings
    - Environmental Stations: Points
    - Nearest Water & Residential with point-to-polygon distances
    """
    try:
        layers = gis_service.get_spatial_layers(latitude, longitude, radius_km)
        return layers
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/nearest-water")
def get_nearest_water_body(
    latitude: float = Query(22.4125),
    longitude: float = Query(73.0944)
):
    """Returns nearest water body polygon and exact point-to-polygon distance."""
    try:
        return gis_service.find_nearest_water_body(latitude, longitude)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/nearest-residential")
def get_nearest_residential_area(
    latitude: float = Query(22.4125),
    longitude: float = Query(73.0944)
):
    """Returns nearest residential polygon and distance."""
    try:
        return gis_service.find_nearest_residential_area(latitude, longitude)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/buffer-analysis")
def get_buffer_analysis(
    latitude: float = Query(22.4125),
    longitude: float = Query(73.0944),
    radius_km: float = Query(5.0)
):
    """Computes land cover composition (industrial, residential, water, green) within radius."""
    try:
        return gis_service.compute_buffer_analysis(latitude, longitude, radius_km)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/nearest-industrial")
def get_nearest_industrial_zone(
    latitude: float = Query(22.4125),
    longitude: float = Query(73.0944)
):
    """Returns nearest industrial zone polygon and distance."""
    try:
        return gis_service.find_nearest_industrial_zone(latitude, longitude)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

