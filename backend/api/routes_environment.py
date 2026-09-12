import io
import pandas as pd
from fastapi import APIRouter, Depends, Query, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from backend.database.database import get_db
from backend.models.db_models import Factory, EnvironmentalData, GeospatialData
from backend.services.environmental_service import environmental_service
from backend.services.satellite_service import satellite_service

router = APIRouter(prefix="/api/environment", tags=["Environmental & Geospatial"])

@router.get("/live")
def get_live_environment_and_geospatial(
    latitude: float = Query(..., description="Factory latitude"),
    longitude: float = Query(..., description="Factory longitude"),
    radius_km: float = Query(5.0, description="Analysis buffer radius")
):
    """
    Fetches real-time environmental air quality (Open-Meteo CAMS)
    and geospatial terrain/receptor metrics for coordinates.
    """
    air_data = environmental_service.fetch_air_quality(latitude, longitude)
    geo_data = satellite_service.getSatelliteData(latitude, longitude, radius_km)

    return {
        "environmental": air_data,
        "geospatial": geo_data
    }

@router.post("/upload")
async def upload_environmental_csv(file: UploadFile = File(...)):
    """Uploads a CSV with local environmental measurements."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files supported.")

    content = await file.read()
    try:
        df = pd.read_csv(io.StringIO(content.decode("utf-8")))
        first_row = df.iloc[0].to_dict()
        parsed = environmental_service.parse_csv_record(first_row)
        return {
            "message": f"Successfully parsed {len(df)} records from {file.filename}",
            "latest_reading": parsed,
            "columns_detected": list(df.columns)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")
