import json
import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database.database import get_db
from backend.models.db_models import Factory, Process, EnergyConsumption, ProductionInfo, WasteRecord
from backend.models.schemas import FactoryCreate, ProcessCreate, LocationInput

router = APIRouter(prefix="/api", tags=["Factory"])

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
DEMO_PATH = os.path.join(DATA_DIR, "sample_factory_data.json")

from backend.services.factory_service import factory_service

@router.get("/factory/demo/load")
def get_demo_factory():
    """Returns realistic preconfigured factory data for 1-click evaluation."""
    if os.path.exists(DEMO_PATH):
        with open(DEMO_PATH, "r") as f:
            return json.load(f)
    return factory_service.get_scenario("chemical_nandesari")

@router.get("/factory/scenarios")
def list_scenarios():
    """Returns list of 3 distinct industrial factory scenarios (Section 32)."""
    return factory_service.list_scenarios()

@router.get("/factory/scenarios/{scenario_key}")
def get_scenario_details(scenario_key: str):
    """Returns full operational profile for selected scenario (textile_surat, food_anand, chemical_nandesari)."""
    return factory_service.get_scenario(scenario_key)


@router.post("/factory")
def create_or_update_factory(payload: FactoryCreate, db: Session = Depends(get_db)):
    """Creates a new factory profile and associated energy, waste, and process records."""
    factory = Factory(
        name=payload.name,
        industry_type=payload.industry_type,
        location_name=payload.location_name,
        latitude=payload.latitude,
        longitude=payload.longitude,
        analysis_radius_km=payload.analysis_radius_km,
        num_employees=payload.num_employees,
        operating_hours_per_day=payload.operating_hours_per_day,
        operating_days_per_month=payload.operating_days_per_month
    )
    db.add(factory)
    db.flush()

    if payload.energy:
        energy_rec = EnergyConsumption(
            factory_id=factory.id,
            electricity_kwh_month=payload.energy.electricity_kwh_month,
            electricity_source=payload.energy.electricity_source,
            renewable_percentage=payload.energy.renewable_percentage,
            diesel_liters_month=payload.energy.diesel_liters_month,
            natural_gas_m3_month=payload.energy.natural_gas_m3_month,
            other_fuel_name=payload.energy.other_fuel_name,
            other_fuel_consumption=payload.energy.other_fuel_consumption
        )
        db.add(energy_rec)

    if payload.production:
        prod_rec = ProductionInfo(
            factory_id=factory.id,
            main_product=payload.production.main_product,
            production_quantity_month=payload.production.production_quantity_month,
            production_unit=payload.production.production_unit,
            raw_materials_used=payload.production.raw_materials_used,
            approximate_quantity_month=payload.production.approximate_quantity_month,
            material_category=payload.production.material_category
        )
        db.add(prod_rec)

    if payload.waste:
        waste_rec = WasteRecord(
            factory_id=factory.id,
            waste_generated_kg_month=payload.waste.waste_generated_kg_month,
            waste_type=payload.waste.waste_type,
            treatment_method=payload.waste.treatment_method,
            recycled_percentage=payload.waste.recycled_percentage,
            waste_sent_to_landfill_kg=payload.waste.waste_sent_to_landfill_kg
        )
        db.add(waste_rec)

    for p in payload.processes:
        proc_rec = Process(
            factory_id=factory.id,
            process_name=p.process_name,
            energy_consumption_kwh=p.energy_consumption_kwh,
            fuel_used=p.fuel_used,
            fuel_consumption=p.fuel_consumption,
            fuel_unit=p.fuel_unit,
            material_consumed=p.material_consumed or "",
            waste_generated_kg=p.waste_generated_kg,
            operating_hours_month=p.operating_hours_month,
            temperature_c=p.temperature_c,
            equipment_type=p.equipment_type or "",
            pollution_control=p.pollution_control or "None"
        )
        db.add(proc_rec)

    db.commit()
    db.refresh(factory)
    return {"message": "Factory profile created successfully", "factory_id": factory.id, "name": factory.name}

@router.get("/factories")
def list_factories(db: Session = Depends(get_db)):
    factories = db.query(Factory).order_by(Factory.created_at.desc()).all()
    return [{
        "id": f.id,
        "name": f.name,
        "industry_type": f.industry_type,
        "location_name": f.location_name,
        "latitude": f.latitude,
        "longitude": f.longitude,
        "analysis_radius_km": f.analysis_radius_km,
        "created_at": f.created_at.isoformat() if f.created_at else ""
    } for f in factories]

@router.get("/factory/{id}")
def get_factory_detail(id: int, db: Session = Depends(get_db)):
    factory = db.query(Factory).filter(Factory.id == id).first()
    if not factory:
        raise HTTPException(status_code=404, detail="Factory not found")

    return {
        "id": factory.id,
        "name": factory.name,
        "industry_type": factory.industry_type,
        "location_name": factory.location_name,
        "latitude": factory.latitude,
        "longitude": factory.longitude,
        "analysis_radius_km": factory.analysis_radius_km,
        "num_employees": factory.num_employees,
        "operating_hours_per_day": factory.operating_hours_per_day,
        "operating_days_per_month": factory.operating_days_per_month,
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
            "raw_materials_used": factory.production.raw_materials_used if factory.production else ""
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

@router.post("/processes")
def add_processes_to_factory(factory_id: int, processes: List[ProcessCreate], db: Session = Depends(get_db)):
    factory = db.query(Factory).filter(Factory.id == factory_id).first()
    if not factory:
        raise HTTPException(status_code=404, detail="Factory not found")

    added = []
    for p in processes:
        proc = Process(
            factory_id=factory_id,
            process_name=p.process_name,
            energy_consumption_kwh=p.energy_consumption_kwh,
            fuel_used=p.fuel_used,
            fuel_consumption=p.fuel_consumption,
            fuel_unit=p.fuel_unit,
            material_consumed=p.material_consumed or "",
            waste_generated_kg=p.waste_generated_kg,
            operating_hours_month=p.operating_hours_month,
            temperature_c=p.temperature_c,
            equipment_type=p.equipment_type or "",
            pollution_control=p.pollution_control or "None"
        )
        db.add(proc)
        added.append(p.process_name)

    db.commit()
    return {"message": f"Added {len(added)} processes", "processes": added}

@router.post("/location")
def update_location(factory_id: int, loc: LocationInput, db: Session = Depends(get_db)):
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
