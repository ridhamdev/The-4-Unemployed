import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database.database import SessionLocal
from backend.models.db_models import Factory, ReportRecord
from backend.services.geo_service import geo_service

client = TestClient(app)

def test_geo_states_and_cities():
    # 1. States endpoint
    res = client.get("/api/geo/states")
    assert res.status_code == 200
    states = res.json()["states"]
    assert "Gujarat" in states
    assert "Maharashtra" in states

    # 2. Cities for Gujarat
    res_cities = client.get("/api/geo/cities?state=Gujarat")
    assert res_cities.status_code == 200
    cities = res_cities.json()["cities"]
    city_names = [c["name"] for c in cities]
    assert "Ahmedabad" in city_names
    assert "Surat" in city_names
    assert "Vadodara" in city_names

def test_real_factory_creation_and_isolation():
    # Create real user factory in Ahmedabad
    payload = {
        "name": "ABC Chemical Industries Pvt. Ltd.",
        "industry_type": "Chemical Manufacturing",
        "state": "Gujarat",
        "city": "Ahmedabad",
        "location_name": "Vatva GIDC Phase 2, Ahmedabad",
        "latitude": 22.9850,
        "longitude": 72.6350,
        "analysis_radius_km": 5.0,
        "num_employees": 180,
        "operating_hours_per_day": 24,
        "operating_days_per_month": 26,
        "energy": {
            "electricity_kwh_month": 120000,
            "electricity_source": "Grid",
            "renewable_percentage": 10.0,
            "diesel_liters_month": 1500,
            "natural_gas_m3_month": 16000
        },
        "production": {
            "main_product": "Dyes & Pigments",
            "production_quantity_month": 800,
            "production_unit": "Tonnes"
        },
        "waste": {
            "waste_generated_kg_month": 4200,
            "waste_type": "Chemical Sludge",
            "treatment_method": "ETP Common Treatment",
            "recycled_percentage": 15.0
        }
    }

    res = client.post("/api/factories", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "FAC-" in data["factory_id"]
    assert data["name"] == "ABC Chemical Industries Pvt. Ltd."
    assert data["is_demo"] is False
    assert data["state"] == "Gujarat"
    assert data["city"] == "Ahmedabad"

    factory_code = data["factory_id"]

    # Retrieve factory by unique factory_id code
    get_res = client.get(f"/api/factories/{factory_code}")
    assert get_res.status_code == 200
    fac_detail = get_res.json()
    assert fac_detail["name"] == "ABC Chemical Industries Pvt. Ltd."
    assert fac_detail["is_demo"] is False

    # Trigger analysis on this specific factory
    anl_res = client.post(f"/api/factories/{factory_code}/analyze")
    assert anl_res.status_code == 200
    anl_data = anl_res.json()
    assert anl_data["factory_name"] == "ABC Chemical Industries Pvt. Ltd."
    assert anl_data["factory_code"] == factory_code
    assert anl_data["is_demo"] is False

    # Verify ReportRecord was persisted in DB
    rep_res = client.get(f"/api/factories/{factory_code}/report")
    assert rep_res.status_code == 200
    rep_data = rep_res.json()
    assert rep_data["factory_name"] == "ABC Chemical Industries Pvt. Ltd."
    assert "ABC Chemical Industries Pvt. Ltd." in rep_data["report_markdown"]
    assert len(rep_data["provenance_records"]) > 0

def test_demo_scenario_isolation():
    # Demo scenarios must be labeled with is_demo = True
    scenarios_res = client.get("/api/factory/scenarios")
    assert scenarios_res.status_code == 200
    scenarios = scenarios_res.json()
    assert len(scenarios) == 3
    for s in scenarios:
        assert s["is_demo"] is True
        assert "Demo" in s["badge"]
