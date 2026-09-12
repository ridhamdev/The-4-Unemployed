import pytest
import os
from backend.services.emission_service import emission_service
from backend.services.pipeline_service import pipeline_service
from backend.services.analysis_service import analysis_service
from backend.services.recommendation_service import recommendation_service
from backend.services.data_lab_service import data_lab_service
from backend.services.environmental_service import environmental_service
from backend.services.satellite_service import satellite_service

def test_emission_service():
    energy = {
        "electricity_kwh_month": 100000,
        "renewable_percentage": 20.0,
        "diesel_liters_month": 1000,
        "natural_gas_m3_month": 5000
    }
    processes = [
        {
            "process_name": "Boiler",
            "fuel_used": "natural_gas",
            "fuel_consumption": 5000,
            "energy_consumption_kwh": 0
        }
    ]
    res = emission_service.calculate_factory_emissions(energy, processes, country_grid="in")
    assert res["total_co2e_tonnes"] > 0
    assert res["diesel_co2e_tonnes"] == pytest.approx(2.68, 0.05)
    assert res["natural_gas_co2e_tonnes"] == pytest.approx(10.15, 0.05)
    assert len(res["factors_used"]) >= 3

def test_environmental_and_satellite():
    env = environmental_service.fetch_air_quality(22.3072, 73.1812)
    assert "pm25" in env
    assert "source" in env
    assert isinstance(env["is_real"], bool)

    sat = satellite_service.getSatelliteData(22.3072, 73.1812, 5.0)
    assert "elevation_m" in sat
    assert "dist_to_residential_km" in sat
    assert "source" in sat

def test_pipeline_and_analysis_scoring():
    factory_dict = {
        "name": "Test Plant",
        "industry_type": "Chemical",
        "latitude": 22.3072,
        "longitude": 73.1812,
        "operating_hours_per_day": 24,
        "operating_days_per_month": 26
    }
    energy_dict = {
        "electricity_kwh_month": 120000,
        "renewable_percentage": 10.0,
        "diesel_liters_month": 2000,
        "natural_gas_m3_month": 8000
    }
    production_dict = {
        "production_quantity_month": 500,
        "production_unit": "Tonnes"
    }
    waste_dict = {
        "waste_generated_kg_month": 3000,
        "recycled_percentage": 20.0,
        "waste_sent_to_landfill_kg": 2400
    }
    processes = [
        {
            "process_name": "Boiler Unit",
            "energy_consumption_kwh": 5000,
            "fuel_used": "natural_gas",
            "fuel_consumption": 8000,
            "waste_generated_kg": 200,
            "temperature_c": 230,
            "pollution_control": "None"
        }
    ]

    env = environmental_service.fetch_air_quality(22.3072, 73.1812)
    geo = satellite_service.getSatelliteData(22.3072, 73.1812, 5.0)

    fused = pipeline_service.process_and_fuse(
        factory_dict, energy_dict, production_dict, waste_dict, processes, env, geo
    )
    analysis = analysis_service.analyze_factory(fused, processes)

    assert analysis["total_co2e_tonnes"] > 0
    assert len(analysis["problem_factors"]) > 0
    for factor in analysis["problem_factors"]:
        assert 0 <= factor["problem_score"] <= 100
        assert factor["severity"] in ["HIGH", "MEDIUM", "LOW"]
        assert len(factor["why_explanation"]) > 5

    # Check recommendations
    recs = recommendation_service.generate_recommendations(analysis, fused["factory_features"], processes)
    assert len(recs) > 0
    assert any("Waste Heat Recovery" in r["proposed_intervention"] for r in recs)

def test_data_lab_training():
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    sample_csv = os.path.join(repo_root, "datasets", "industrial_sample_dataset.csv")
    assert os.path.exists(sample_csv)

    overview = data_lab_service.analyze_csv(sample_csv, "test-ds", "sample.csv")
    assert overview["rows_count"] >= 100
    assert "co2_emissions_tonnes" in overview["columns"]

    train_res = data_lab_service.train_baseline_models(
        file_path=sample_csv,
        target_column="co2_emissions_tonnes",
        feature_columns=["production_tonnes", "natural_gas_m3", "electricity_kwh", "diesel_liters", "operating_hours"]
    )
    assert "linear_regression_metrics" in train_res
    assert "random_forest_metrics" in train_res
    assert train_res["random_forest_metrics"]["test_r2"] > 0.5
    assert len(train_res["feature_importances"]) > 0
