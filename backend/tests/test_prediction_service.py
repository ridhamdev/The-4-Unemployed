import pytest
from backend.ml.inference.predictor import predictor

def test_predictor_basic_inference():
    factory_feats = {
        "production_tonnes": 48.0,
        "natural_gas_m3": 480.0,
        "electricity_kwh": 6200.0,
        "diesel_litres": 120.0
    }
    weather_feats = {
        "temperature_c": 30.0,
        "wind_speed_ms": 3.2,
        "relative_humidity_pct": 50.0
    }
    env_feats = {
        "no2": 32.5,
        "so2": 12.0
    }

    res = predictor.predict(
        factory_features=factory_feats,
        weather_features=weather_feats,
        env_features=env_feats,
        date_str="2026-09-12"
    )

    assert res is not None
    assert "predicted_no2_ugm3" in res
    assert res["predicted_no2_ugm3"] > 10.0
    assert "risk_score" in res
    assert 0.0 <= res["risk_score"] <= 100.0
    assert "confidence_interval_95" in res
    assert res["confidence_interval_95"][0] < res["predicted_no2_ugm3"] < res["confidence_interval_95"][1]
    assert "XGBoost" in res["model_metadata"]["algorithm"]

def test_predictor_drift_detection():
    # Provide extreme input that exceeds training bounds by 2x
    extreme_feats = {
        "production_tonnes": 48.0,
        "natural_gas_m3": 25000.0, # 25k m3/day is way above 99th percentile
        "electricity_kwh": 6200.0,
        "diesel_litres": 120.0
    }

    res = predictor.predict(factory_features=extreme_feats)
    assert res["drift_detected"] is True
    assert len(res["drift_warnings"]) > 0
    assert any("Natural Gas" in w for w in res["drift_warnings"])
    assert "Notice:" in res["caution_note"]
