from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

from backend.database.database import get_db
from backend.models.db_models import Factory, EnvironmentalData, GeospatialData, AnalysisResult, Recommendation
from backend.services.environmental_service import environmental_service
from backend.services.satellite_service import satellite_service
from backend.services.pipeline_service import pipeline_service
from backend.services.analysis_service import analysis_service
from backend.services.recommendation_service import recommendation_service
from backend.services.gis_service import gis_service
from backend.ml.inference.predictor import predictor
from backend.services.decision_engine import decision_engine
from backend.services.report_service import report_service
from backend.api.routes_reports import REPORT_STORE


router = APIRouter(prefix="/api", tags=["Analysis & Recommendations"])

@router.post("/analyze")
def run_factory_analysis(
    raw_payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """
    Core Pipeline Orchestrator:
    Location + Factory Data + Environmental + Geospatial 
    -> Fusion Pipeline -> Emission & Problem Factor Scoring 
    -> Circular Recommendations -> SQLite DB Persistence.
    """
    factory_dict = {}
    energy_dict = {}
    production_dict = {}
    waste_dict = {}
    processes_list = []

    factory_id = raw_payload.get("factory_id")

    # Scenario A: Existing factory_id passed
    if factory_id:
        db_factory = db.query(Factory).filter(Factory.id == factory_id).first()
        if not db_factory:
            raise HTTPException(status_code=404, detail="Factory ID not found")
        target_factory_id = db_factory.id

        factory_dict = {
            "name": db_factory.name,
            "industry_type": db_factory.industry_type,
            "location_name": db_factory.location_name,
            "latitude": db_factory.latitude,
            "longitude": db_factory.longitude,
            "analysis_radius_km": db_factory.analysis_radius_km,
            "operating_hours_per_day": db_factory.operating_hours_per_day,
            "operating_days_per_month": db_factory.operating_days_per_month
        }
        if db_factory.energy:
            energy_dict = {
                "electricity_kwh_month": db_factory.energy.electricity_kwh_month,
                "renewable_percentage": db_factory.energy.renewable_percentage,
                "diesel_liters_month": db_factory.energy.diesel_liters_month,
                "natural_gas_m3_month": db_factory.energy.natural_gas_m3_month,
                "other_fuel_name": db_factory.energy.other_fuel_name,
                "other_fuel_consumption": db_factory.energy.other_fuel_consumption
            }
        if db_factory.production:
            production_dict = {
                "main_product": db_factory.production.main_product,
                "production_quantity_month": db_factory.production.production_quantity_month,
                "production_unit": db_factory.production.production_unit,
                "raw_materials_used": db_factory.production.raw_materials_used
            }
        if db_factory.waste:
            waste_dict = {
                "waste_generated_kg_month": db_factory.waste.waste_generated_kg_month,
                "recycled_percentage": db_factory.waste.recycled_percentage,
                "waste_sent_to_landfill_kg": db_factory.waste.waste_sent_to_landfill_kg
            }
        processes_list = [{
            "process_name": p.process_name,
            "energy_consumption_kwh": p.energy_consumption_kwh,
            "fuel_used": p.fuel_used,
            "fuel_consumption": p.fuel_consumption,
            "fuel_unit": p.fuel_unit,
            "waste_generated_kg": p.waste_generated_kg,
            "operating_hours_month": p.operating_hours_month,
            "temperature_c": p.temperature_c,
            "equipment_type": p.equipment_type,
            "pollution_control": p.pollution_control
        } for p in db_factory.processes]

    # Scenario B: Factory attributes passed directly in body
    elif "name" in raw_payload or "latitude" in raw_payload or "factory" in raw_payload or "factory_name" in raw_payload:
        sub_factory = raw_payload.get("factory", {}) if isinstance(raw_payload.get("factory"), dict) else {}
        factory_dict = {
            "name": raw_payload.get("name") or sub_factory.get("name") or raw_payload.get("factory_name", "Industrial Facility"),
            "industry_type": raw_payload.get("industry_type") or sub_factory.get("industry_type", "Chemical"),
            "location_name": raw_payload.get("location_name") or sub_factory.get("location_name", "Industrial Zone"),
            "latitude": float(raw_payload.get("latitude") or sub_factory.get("latitude", 22.4125)),
            "longitude": float(raw_payload.get("longitude") or sub_factory.get("longitude", 73.0944)),
            "analysis_radius_km": float(raw_payload.get("analysis_radius_km") or sub_factory.get("analysis_radius_km", 5.0)),
            "operating_hours_per_day": float(raw_payload.get("operating_hours_per_day") or sub_factory.get("operating_hours_per_day", 24.0)),
            "operating_days_per_month": float(raw_payload.get("operating_days_per_month") or sub_factory.get("operating_days_per_month", 26.0))
        }
        energy_dict = raw_payload.get("energy", {}) or {}
        production_dict = raw_payload.get("production", {}) or {}
        waste_dict = raw_payload.get("waste", {}) or {}
        processes_list = raw_payload.get("processes", []) or []

        # Create new factory row
        db_factory = Factory(
            name=factory_dict["name"],
            industry_type=factory_dict["industry_type"],
            location_name=factory_dict["location_name"],
            latitude=factory_dict["latitude"],
            longitude=factory_dict["longitude"],
            analysis_radius_km=factory_dict["analysis_radius_km"],
            operating_hours_per_day=factory_dict["operating_hours_per_day"],
            operating_days_per_month=factory_dict["operating_days_per_month"]
        )
        db.add(db_factory)
        db.flush()
        target_factory_id = db_factory.id
    else:
        raise HTTPException(status_code=400, detail="Provide either factory attributes or factory_id in request body")

    # Step 1: Collect/Load Environmental & Geospatial Data
    lat = factory_dict.get("latitude", 22.4125)
    lng = factory_dict.get("longitude", 73.0944)
    radius = factory_dict.get("analysis_radius_km", 5.0)

    env_data = environmental_service.fetch_air_quality(lat, lng)
    geo_data = satellite_service.getSatelliteData(lat, lng, radius)

    # Save env/geo records to DB
    env_rec = EnvironmentalData(
        factory_id=target_factory_id,
        pm25=env_data["pm25"],
        pm10=env_data["pm10"],
        no2=env_data["no2"],
        so2=env_data["so2"],
        co=env_data["co"],
        o3=env_data["o3"],
        source=env_data["source"],
        timestamp=env_data["timestamp"],
        is_real=env_data["is_real"]
    )
    db.add(env_rec)

    geo_rec = GeospatialData(
        factory_id=target_factory_id,
        elevation_m=geo_data["elevation_m"],
        slope_deg=geo_data["slope_deg"],
        land_cover=geo_data["land_cover"],
        dist_to_water_km=geo_data["dist_to_water_km"],
        dist_to_residential_km=geo_data["dist_to_residential_km"],
        vegetation_ndvi_proxy=geo_data["vegetation_ndvi_proxy"],
        source=geo_data["source"],
        timestamp=geo_data["timestamp"],
        is_real=geo_data["is_real"]
    )
    db.add(geo_rec)

    # Step 2: Preprocess and Fuse Data Pipeline
    fused = pipeline_service.process_and_fuse(
        factory_dict,
        energy_dict,
        production_dict,
        waste_dict,
        processes_list,
        env_data,
        geo_data
    )

    # Step 3: Analyze Pollution / Emission Factors & Identify Problem Areas
    analysis = analysis_service.analyze_factory(fused, processes_list)

    # Step 4: Recommend Circular Alternatives
    recs = recommendation_service.generate_recommendations(
        analysis,
        fused["factory_features"],
        processes_list
    )

    # Step 5: Save Analysis Result & Recommendations in DB
    analysis_record = AnalysisResult(
        factory_id=target_factory_id,
        total_co2e_tonnes=analysis["total_co2e_tonnes"],
        scope1_direct_co2e_tonnes=analysis["scope1_direct_co2e_tonnes"],
        scope2_indirect_co2e_tonnes=analysis["scope2_indirect_co2e_tonnes"],
        co2e_per_production_unit=analysis["co2e_per_production_unit"],
        major_emission_source=analysis["major_emission_source"],
        composite_risk_score=analysis["composite_risk_score"],
        problem_factors_json=analysis["problem_factors"]
    )
    db.add(analysis_record)
    db.flush()

    for r in recs:
        db_rec = Recommendation(
            analysis_id=analysis_record.id,
            problem=r["problem"],
            proposed_intervention=r["proposed_intervention"],
            co2_reduction_range=r["co2_reduction_range"],
            cost_category=r["cost_category"],
            difficulty=r["difficulty"],
            expected_benefit=r["expected_benefit"],
            reason=r["reason"]
        )
        db.add(db_rec)

    db.commit()

    # =========================================================================
    # ENHANCED PLATFORM: Real GIS, Deployed Inference, Decision Engine & Dynamic Report
    # =========================================================================
    lat = float(factory_dict.get("latitude", 22.4125))
    lng = float(factory_dict.get("longitude", 73.0944))
    radius = float(factory_dict.get("analysis_radius_km", 5.0))

    # 1. Real Vector GIS Layers & Concentric Buffer Analytics
    gis_layers = gis_service.get_spatial_layers(lat, lng, radius_km=radius)

    # 2. Deployed Model Prediction (NO RETRAINING)
    prod_daily = float(production_dict.get("production_quantity_month", 1000.0)) / 26.0
    gas_daily = float(energy_dict.get("natural_gas_m3_month", 5000.0)) / 26.0
    elec_daily = float(energy_dict.get("electricity_kwh_month", 100000.0)) / 26.0
    diesel_daily = float(energy_dict.get("diesel_liters_month", 1000.0)) / 26.0

    ml_pred = predictor.predict(
        factory_features={
            "production_tonnes": prod_daily,
            "natural_gas_m3": gas_daily,
            "electricity_kwh": elec_daily,
            "diesel_litres": diesel_daily
        },
        weather_features={
            "temperature_c": float(env_data.get("temperature", 28.5)),
            "wind_speed_ms": float(env_data.get("wind_speed", 2.8)),
            "wind_direction_deg": float(env_data.get("wind_direction", 225.0)),
            "relative_humidity_pct": float(env_data.get("humidity", 55.0))
        },
        env_features={
            "no2": float(env_data.get("no2", 34.0)),
            "so2": float(env_data.get("so2", 14.0)),
            "pm25": float(env_data.get("pm25", 55.0))
        }
    )

    # 3. Decoupled Industrial Decision Engine
    full_factory_data = {
        "name": factory_dict.get("name", "Factory"),
        "industry_type": factory_dict.get("industry_type", "Manufacturing"),
        "location_name": factory_dict.get("location_name", "Industrial Zone"),
        "latitude": lat,
        "longitude": lng,
        "energy": energy_dict,
        "production": production_dict,
        "waste": waste_dict,
        "processes": processes_list
    }
    decision_res = decision_engine.analyze_factory_decision(
        factory_data=full_factory_data,
        ml_prediction=ml_pred,
        gis_analysis=gis_layers
    )

    # 4. 100% Dynamic Scientific Report Generator (Unique analysis_id, zero static text)
    dynamic_rep = report_service.generate_dynamic_report(
        factory_data=full_factory_data,
        decision_result=decision_res,
        gis_layers=gis_layers,
        environmental_data=env_data,
        weather_data={
            "wind_speed_ms": float(env_data.get("wind_speed", 2.8)),
            "wind_u": -1.9,
            "wind_v": -2.0
        },
        ml_prediction=ml_pred
    )
    # Cache generated report
    REPORT_STORE[dynamic_rep["analysis_id"]] = dynamic_rep

    return {
        "analysis_id": dynamic_rep["analysis_id"],
        "db_analysis_id": analysis_record.id,
        "factory_id": target_factory_id,
        "factory_name": factory_dict.get("name", "Factory"),
        "total_co2e_tonnes": decision_res["factory_health"]["estimated_monthly_co2e_tonnes"],
        "scope1_direct_co2e_tonnes": analysis["scope1_direct_co2e_tonnes"],
        "scope2_indirect_co2e_tonnes": analysis["scope2_indirect_co2e_tonnes"],
        "co2e_per_production_unit": decision_res["factory_health"]["carbon_intensity_tonne_per_tonne"],
        "production_unit": analysis["production_unit"],
        "major_emission_source": analysis["major_emission_source"],
        "composite_risk_score": decision_res["factory_health"]["environmental_risk_score"],
        "problem_factors": analysis["problem_factors"],
        "recommendations": recs,
        "environmental_data": env_data,
        "geospatial_data": geo_data,
        "emission_factors_used": analysis["emission_factors_used"],
        "created_at": analysis_record.created_at.isoformat() if analysis_record.created_at else "",
        # New Executive Platform Deliverables
        "factory_health": decision_res["factory_health"],
        "top_problems": decision_res["top_problems"],
        "circular_recommendations": decision_res["recommendations"],
        "action_plan": decision_res["action_plan"],
        "why_this_result": decision_res["why_this_result"],
        "gis_layers": gis_layers,
        "ml_prediction": ml_pred,
        "dynamic_report": dynamic_rep
    }


@router.get("/analysis/{id}")
def get_analysis_by_id(id: int, db: Session = Depends(get_db)):
    record = db.query(AnalysisResult).filter(AnalysisResult.id == id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis result not found")

    factory = db.query(Factory).filter(Factory.id == record.factory_id).first()
    recs = db.query(Recommendation).filter(Recommendation.analysis_id == id).all()

    return {
        "analysis_id": record.id,
        "factory_id": record.factory_id,
        "factory_name": factory.name if factory else "Factory",
        "total_co2e_tonnes": record.total_co2e_tonnes,
        "scope1_direct_co2e_tonnes": record.scope1_direct_co2e_tonnes,
        "scope2_indirect_co2e_tonnes": record.scope2_indirect_co2e_tonnes,
        "co2e_per_production_unit": record.co2e_per_production_unit,
        "major_emission_source": record.major_emission_source,
        "composite_risk_score": record.composite_risk_score,
        "problem_factors": record.problem_factors_json or [],
        "recommendations": [{
            "problem": r.problem,
            "proposed_intervention": r.proposed_intervention,
            "co2_reduction_range": r.co2_reduction_range,
            "cost_category": r.cost_category,
            "difficulty": r.difficulty,
            "expected_benefit": r.expected_benefit,
            "reason": r.reason
        } for r in recs],
        "created_at": record.created_at.isoformat() if record.created_at else ""
    }

@router.get("/recommendations/{factory_id}")
def get_recommendations_for_factory(factory_id: int, db: Session = Depends(get_db)):
    latest_analysis = (
        db.query(AnalysisResult)
        .filter(AnalysisResult.factory_id == factory_id)
        .order_by(AnalysisResult.created_at.desc())
        .first()
    )
    if not latest_analysis:
        raise HTTPException(status_code=404, detail="No analysis found for this factory.")

    recs = db.query(Recommendation).filter(Recommendation.analysis_id == latest_analysis.id).all()
    return {
        "factory_id": factory_id,
        "analysis_id": latest_analysis.id,
        "recommendations": [{
            "problem": r.problem,
            "proposed_intervention": r.proposed_intervention,
            "co2_reduction_range": r.co2_reduction_range,
            "cost_category": r.cost_category,
            "difficulty": r.difficulty,
            "expected_benefit": r.expected_benefit,
            "reason": r.reason
        } for r in recs]
    }
