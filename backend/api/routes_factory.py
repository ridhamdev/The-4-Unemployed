import json
import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.database.database import get_db
from backend.models.db_models import Factory, Process, EnergyConsumption, ProductionInfo, WasteRecord, AnalysisResult, ReportRecord
from backend.models.schemas import FactoryCreate, ProcessCreate, LocationInput, FactoryResponse
from backend.services.geo_service import geo_service
from backend.services.factory_service import factory_service

router = APIRouter(prefix="/api", tags=["Factory & Geospatial Onboarding"])

# ==============================================================================
# 1. HIERARCHICAL GEOGRAPHIC SELECTION (Section 13, 15, 17)
# ==============================================================================

@router.get("/geo/states")
def get_states():
    """Returns structured list of Indian States for Step 1 of location selection."""
    return {"states": geo_service.get_states()}

@router.get("/geo/cities")
def get_cities(state: str = Query(..., description="Selected State Name, e.g. Gujarat")):
    """Returns structured list of industrial cities with coordinates for Step 2."""
    cities = geo_service.get_cities_for_state(state)
    return {"state": state, "cities": cities}

# ==============================================================================
# 2. DEMO / SAMPLE FACTORY SCENARIOS (Section 2, 5, 18)
# ==============================================================================

@router.get("/factory/scenarios")
def list_scenarios():
    """
    Returns list of 3 pre-configured demo scenarios.
    Explicitly labeled with is_demo = True to prevent confusion with real user factories.
    """
    scenarios = factory_service.list_scenarios()
    for s in scenarios:
        s["is_demo"] = True
        s["badge"] = "Demo Factory Scenario"
    return scenarios

@router.get("/factory/scenarios/{scenario_key}")
def get_scenario_details(scenario_key: str):
    """Returns full operational profile for selected demo scenario."""
    res = factory_service.get_scenario(scenario_key)
    if res:
        res["is_demo"] = True
    return res

@router.get("/factory/demo/load")
def get_demo_factory():
    """Returns preconfigured default demo factory tagged with is_demo = True."""
    res = factory_service.get_scenario("chemical_nandesari")
    res["is_demo"] = True
    return res

# ==============================================================================
# 3. REAL USER FACTORY PROFILE CREATION & DATABASE PERSISTENCE (Section 2, 3, 4, 16)
# ==============================================================================

def generate_next_factory_id(db: Session, is_demo: bool = False) -> str:
    """Generates unique sequential factory identifier, e.g. FAC-00021 or DEMO-00001."""
    prefix = "DEMO-" if is_demo else "FAC-"
    count = db.query(Factory).filter(Factory.is_demo == is_demo).count()
    return f"{prefix}{count + 1:05d}"

@router.post("/factories", response_model=dict)
@router.post("/factory", response_model=dict)
def create_factory_profile(payload: FactoryCreate, db: Session = Depends(get_db)):
    """
    Creates a new real factory record with user-controlled name and unique factory_id.
    Strictly sets is_demo = False (unless explicitly flagged).
    """
    is_demo = bool(payload.is_demo)
    factory_id = payload.factory_id or generate_next_factory_id(db, is_demo=is_demo)

    # Check if factory_id already exists
    existing = db.query(Factory).filter(Factory.factory_id == factory_id).first()
    if existing:
        factory_id = generate_next_factory_id(db, is_demo=is_demo)

    factory = Factory(
        factory_id=factory_id,
        name=payload.name.strip() if payload.name else "Industrial Facility",
        industry_type=payload.industry_type,
        state=payload.state or "Gujarat",
        city=payload.city or "Vadodara",
        location_name=payload.location_name or f"{payload.city or ''}, {payload.state or ''}",
        latitude=payload.latitude,
        longitude=payload.longitude,
        analysis_radius_km=payload.analysis_radius_km or 5.0,
        num_employees=payload.num_employees or 100,
        operating_hours_per_day=payload.operating_hours_per_day or 24.0,
        operating_days_per_month=payload.operating_days_per_month or 26.0,
        is_demo=is_demo
    )
    db.add(factory)
    db.flush()

    if payload.energy:
        energy_rec = EnergyConsumption(
            factory_id=factory.id,
            electricity_kwh_month=payload.energy.electricity_kwh_month,
            electricity_source=payload.energy.electricity_source or "Grid",
            renewable_percentage=payload.energy.renewable_percentage or 0.0,
            diesel_liters_month=payload.energy.diesel_liters_month or 0.0,
            natural_gas_m3_month=payload.energy.natural_gas_m3_month or 0.0,
            other_fuel_name=payload.energy.other_fuel_name or "None",
            other_fuel_consumption=payload.energy.other_fuel_consumption or 0.0
        )
        db.add(energy_rec)

    if payload.production:
        prod_rec = ProductionInfo(
            factory_id=factory.id,
            main_product=payload.production.main_product or "",
            production_quantity_month=payload.production.production_quantity_month or 1.0,
            production_unit=payload.production.production_unit or "Tonnes",
            raw_materials_used=payload.production.raw_materials_used or "",
            approximate_quantity_month=payload.production.approximate_quantity_month or 0.0,
            material_category=payload.production.material_category or ""
        )
        db.add(prod_rec)

    if payload.waste:
        waste_rec = WasteRecord(
            factory_id=factory.id,
            waste_generated_kg_month=payload.waste.waste_generated_kg_month or 0.0,
            waste_type=payload.waste.waste_type or "",
            treatment_method=payload.waste.treatment_method or "",
            recycled_percentage=payload.waste.recycled_percentage or 0.0,
            waste_sent_to_landfill_kg=payload.waste.waste_sent_to_landfill_kg or 0.0
        )
        db.add(waste_rec)

    for p in (payload.processes or []):
        proc_rec = Process(
            factory_id=factory.id,
            process_name=p.process_name,
            energy_consumption_kwh=p.energy_consumption_kwh or 0.0,
            fuel_used=p.fuel_used or "none",
            fuel_consumption=p.fuel_consumption or 0.0,
            fuel_unit=p.fuel_unit or "unit",
            material_consumed=p.material_consumed or "",
            waste_generated_kg=p.waste_generated_kg or 0.0,
            operating_hours_month=p.operating_hours_month or 0.0,
            temperature_c=p.temperature_c or 0.0,
            equipment_type=p.equipment_type or "",
            pollution_control=p.pollution_control or "None"
        )
        db.add(proc_rec)

    db.commit()
    db.refresh(factory)

    return {
        "message": "Factory profile created successfully",
        "id": factory.id,
        "factory_id": factory.factory_id,
        "name": factory.name,
        "state": factory.state,
        "city": factory.city,
        "latitude": factory.latitude,
        "longitude": factory.longitude,
        "is_demo": factory.is_demo,
        "created_at": factory.created_at.isoformat() if factory.created_at else ""
    }

@router.get("/factories")
def list_factories(
    is_demo: Optional[bool] = Query(None, description="Filter by demo status (true/false)"),
    db: Session = Depends(get_db)
):
    """Lists saved factories from SQLite app.db, filterable by demo status."""
    query = db.query(Factory)
    if is_demo is not None:
        query = query.filter(Factory.is_demo == is_demo)
    factories = query.order_by(Factory.created_at.desc()).all()

    return [{
        "id": f.id,
        "factory_id": f.factory_id,
        "name": f.name,
        "industry_type": f.industry_type,
        "state": f.state,
        "city": f.city,
        "location_name": f.location_name,
        "latitude": f.latitude,
        "longitude": f.longitude,
        "analysis_radius_km": f.analysis_radius_km,
        "is_demo": f.is_demo,
        "created_at": f.created_at.isoformat() if f.created_at else ""
    } for f in factories]

def find_factory_by_id_or_code(identifier: str, db: Session) -> Optional[Factory]:
    """Helper to find factory by either string factory_id (FAC-00021) or integer database id."""
    if identifier.isdigit():
        f = db.query(Factory).filter(Factory.id == int(identifier)).first()
        if f:
            return f
    return db.query(Factory).filter(Factory.factory_id == identifier).first()

@router.get("/factories/{identifier}")
@router.get("/factory/{identifier}")
def get_factory_details(identifier: str, db: Session = Depends(get_db)):
    """Retrieves full factory profile by factory_id (e.g. FAC-00021) or database integer id."""
    factory = find_factory_by_id_or_code(identifier, db)
    if not factory:
        raise HTTPException(status_code=404, detail=f"Factory '{identifier}' not found in database.")

    return {
        "id": factory.id,
        "factory_id": factory.factory_id,
        "name": factory.name,
        "industry_type": factory.industry_type,
        "state": factory.state,
        "city": factory.city,
        "location_name": factory.location_name,
        "latitude": factory.latitude,
        "longitude": factory.longitude,
        "analysis_radius_km": factory.analysis_radius_km,
        "num_employees": factory.num_employees,
        "operating_hours_per_day": factory.operating_hours_per_day,
        "operating_days_per_month": factory.operating_days_per_month,
        "is_demo": factory.is_demo,
        "created_at": factory.created_at.isoformat() if factory.created_at else "",
        "energy": {
            "electricity_kwh_month": factory.energy.electricity_kwh_month if factory.energy else 0,
            "electricity_source": factory.energy.electricity_source if factory.energy else "Grid",
            "renewable_percentage": factory.energy.renewable_percentage if factory.energy else 0,
            "diesel_liters_month": factory.energy.diesel_liters_month if factory.energy else 0,
            "natural_gas_m3_month": factory.energy.natural_gas_m3_month if factory.energy else 0,
            "other_fuel_name": factory.energy.other_fuel_name if factory.energy else "None",
            "other_fuel_consumption": factory.energy.other_fuel_consumption if factory.energy else 0
        },
        "production": {
            "main_product": factory.production.main_product if factory.production else "",
            "production_quantity_month": factory.production.production_quantity_month if factory.production else 0,
            "production_unit": factory.production.production_unit if factory.production else "Tonnes",
            "raw_materials_used": factory.production.raw_materials_used if factory.production else "",
            "approximate_quantity_month": factory.production.approximate_quantity_month if factory.production else 0,
            "material_category": factory.production.material_category if factory.production else ""
        },
        "waste": {
            "waste_generated_kg_month": factory.waste.waste_generated_kg_month if factory.waste else 0,
            "waste_type": factory.waste.waste_type if factory.waste else "",
            "treatment_method": factory.waste.treatment_method if factory.waste else "",
            "recycled_percentage": factory.waste.recycled_percentage if factory.waste else 0,
            "waste_sent_to_landfill_kg": factory.waste.waste_sent_to_landfill_kg if factory.waste else 0
        },
        "processes": [{
            "id": p.id,
            "process_name": p.process_name,
            "energy_consumption_kwh": p.energy_consumption_kwh,
            "fuel_used": p.fuel_used,
            "fuel_consumption": p.fuel_consumption,
            "fuel_unit": p.fuel_unit,
            "material_consumed": p.material_consumed,
            "waste_generated_kg": p.waste_generated_kg,
            "operating_hours_month": p.operating_hours_month,
            "temperature_c": p.temperature_c,
            "equipment_type": p.equipment_type,
            "pollution_control": p.pollution_control
        } for p in factory.processes]
    }

@router.post("/location")
def update_location(factory_id: int, loc: LocationInput, db: Session = Depends(get_db)):
    """Updates coordinates and radius for a factory."""
    factory = db.query(Factory).filter(Factory.id == factory_id).first()
    if not factory:
        raise HTTPException(status_code=404, detail="Factory not found")

    factory.latitude = loc.latitude
    factory.longitude = loc.longitude
    if loc.location_name:
        factory.location_name = loc.location_name
    if loc.analysis_radius_km:
        factory.analysis_radius_km = loc.analysis_radius_km

    db.commit()
    return {"message": "Location updated", "latitude": factory.latitude, "longitude": factory.longitude}
