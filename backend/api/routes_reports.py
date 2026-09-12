import os
import json
from fastapi import APIRouter, HTTPException, Path, Body
from typing import Dict, Any

from backend.services.report_service import report_service

router = APIRouter(prefix="/api/reports", tags=["Dynamic Scientific Reports"])

# In-memory store for generated analysis reports
REPORT_STORE: Dict[str, Dict[str, Any]] = {}

@router.get("/{analysis_id}")
def get_report_by_id(analysis_id: str = Path(...)):
    """Retrieves generated dynamic scientific report by unique analysis ID."""
    if analysis_id in REPORT_STORE:
        return REPORT_STORE[analysis_id]
    raise HTTPException(status_code=404, detail=f"Analysis report '{analysis_id}' not found.")

@router.post("/generate")
def generate_report_endpoint(payload: Dict[str, Any] = Body(...)):
    """Generates and stores dynamic scientific report."""
    try:
        report = report_service.generate_dynamic_report(
            factory_data=payload.get("factory_data", {}),
            decision_result=payload.get("decision_result", {}),
            gis_layers=payload.get("gis_layers", {}),
            environmental_data=payload.get("environmental_data", {}),
            weather_data=payload.get("weather_data", {}),
            ml_prediction=payload.get("ml_prediction", {})
        )
        REPORT_STORE[report["analysis_id"]] = report
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
