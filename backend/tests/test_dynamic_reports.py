import pytest
from backend.services.factory_service import factory_service
from backend.services.gis_service import gis_service
from backend.ml.inference.predictor import predictor
from backend.services.decision_engine import decision_engine
from backend.services.report_service import report_service

def test_three_distinct_factory_scenarios():
    scenarios = ["textile_surat", "food_anand", "chemical_nandesari"]
    results = {}

    for sc_key in scenarios:
        factory = factory_service.get_scenario(sc_key)
        lat = factory["latitude"]
        lng = factory["longitude"]

        # 1. Real GIS layers
        gis_layers = gis_service.get_spatial_layers(lat, lng, radius_km=5.0)

        # 2. Deployed Model Prediction (no retraining)
        pred = predictor.predict(
            factory_features={
                "production_tonnes": factory["production"]["production_quantity_month"] / 26.0,
                "natural_gas_m3": factory["energy"]["natural_gas_m3_month"] / 26.0,
                "electricity_kwh": factory["energy"]["electricity_kwh_month"] / 26.0,
                "diesel_litres": factory["energy"]["diesel_liters_month"] / 26.0
            }
        )

        # 3. Decision Engine
        dec = decision_engine.analyze_factory_decision(
            factory_data=factory,
            ml_prediction=pred,
            gis_analysis=gis_layers
        )

        # 4. Dynamic Report Generation
        rep = report_service.generate_dynamic_report(
            factory_data=factory,
            decision_result=dec,
            gis_layers=gis_layers,
            environmental_data={"ndvi": 0.25, "pm25": 52.0},
            weather_data={"wind_speed_ms": 2.8, "wind_u": -1.8, "wind_v": -2.0},
            ml_prediction=pred
        )

        results[sc_key] = {
            "factory": factory,
            "gis": gis_layers,
            "pred": pred,
            "dec": dec,
            "rep": rep
        }

    tex = results["textile_surat"]
    food = results["food_anand"]
    chem = results["chemical_nandesari"]

    # 1. Verify Distinct Factory Operational Data
    assert tex["factory"]["industry_type"] != food["factory"]["industry_type"]
    assert food["factory"]["industry_type"] != chem["factory"]["industry_type"]
    assert tex["factory"]["energy"]["other_fuel_name"] == "Imported Steam Coal / Lignite"
    assert food["factory"]["energy"]["other_fuel_name"] == "None"

    # 2. Verify Distinct GIS Spatial Context & Geometries
    tex_water = tex["gis"]["nearest_water_body"]["name"]
    chem_water = chem["gis"]["nearest_water_body"]["name"]
    assert "Tapi" in tex_water
    assert "Mini" in chem_water or "Mahi" in chem_water
    assert tex_water != chem_water

    # 3. Verify Distinct Problem Priorities
    tex_prob_titles = [p["problem_title"] for p in tex["dec"]["top_problems"]]
    food_prob_titles = [p["problem_title"] for p in food["dec"]["top_problems"]]
    chem_prob_titles = [p["problem_title"] for p in chem["dec"]["top_problems"]]

    assert any("Solid Fuel" in t or "Coal" in t for t in tex_prob_titles)
    assert any("Biogas" in t or "Whey" in t for t in food_prob_titles)
    assert any("Solvent" in t or "VOC" in t for t in chem_prob_titles)

    # 4. Verify Distinct Circular Recommendations
    tex_rec_titles = [r["title"] for r in tex["dec"]["recommendations"]]
    food_rec_titles = [r["title"] for r in food["dec"]["recommendations"]]
    chem_rec_titles = [r["title"] for r in chem["dec"]["recommendations"]]

    assert any("Zero Liquid Discharge" in t or "Economizer" in t for t in tex_rec_titles)
    assert any("Anaerobic Digestion" in t or "Biogas" in t for t in food_rec_titles)
    assert any("Solvent Condenser" in t or "Symbiosis" in t for t in chem_rec_titles)

    # 5. Verify Distinct Dynamic Reports & Analysis IDs
    assert tex["rep"]["analysis_id"] != food["rep"]["analysis_id"]
    assert food["rep"]["analysis_id"] != chem["rep"]["analysis_id"]

    tex_md = tex["rep"]["report_markdown"]
    food_md = food["rep"]["report_markdown"]
    chem_md = chem["rep"]["report_markdown"]

    assert "Tapi River" in tex_md
    assert "Mahi Irrigation" in food_md or "Anand" in food_md
    assert "Nandesari" in chem_md
    assert tex_md != food_md != chem_md
