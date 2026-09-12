import os
import pickle
import json
import numpy as np
import pandas as pd
from typing import Dict, Any, List

from backend.ml.preprocessing.feature_pipeline import FeaturePipeline
from backend.ml.evaluation.drift_detector import DriftDetector

MODELS_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "models"
)
ACTIVE_MODEL_DIR = os.path.join(MODELS_DIR, "active")

class Predictor:
    """
    Production Deployed Model Inference Engine (Section 13, 14 & 25).
    Consumes trained model artifact directly.
    NEVER retrains the model on the production web server.
    """

    def __init__(self, model_dir: str = ACTIVE_MODEL_DIR):
        self.model_dir = model_dir
        self.model = None
        self.scaler = None
        self.metadata = {}
        self.feature_pipeline = None
        self.drift_detector = DriftDetector()
        self._load_artifacts()

    def _load_artifacts(self):
        model_path = os.path.join(self.model_dir, "model.pkl")
        scaler_path = os.path.join(self.model_dir, "scaler.pkl")
        meta_path = os.path.join(self.model_dir, "metadata.json")

        if os.path.exists(model_path):
            with open(model_path, "rb") as f:
                self.model = pickle.load(f)

        if os.path.exists(scaler_path):
            with open(scaler_path, "rb") as f:
                self.scaler = pickle.load(f)

        if os.path.exists(meta_path):
            with open(meta_path, "r") as f:
                self.metadata = json.load(f)

        self.feature_pipeline = FeaturePipeline(scaler_path=scaler_path)
        if self.scaler:
            self.feature_pipeline.set_scaler(self.scaler)

    def predict(
        self,
        factory_features: Dict[str, Any],
        weather_features: Dict[str, Any] = None,
        env_features: Dict[str, Any] = None,
        date_str: str = None
    ) -> Dict[str, Any]:
        """
        Runs production inference for incoming factory parameters.
        Returns:
            - predicted_no2_ugm3
            - risk_score (0-100)
            - risk_level (HIGH, MEDIUM, LOW)
            - confidence_interval_95
            - major_factors
            - drift_warnings (if input bounds violated)
        """
        if self.model is None:
            raise RuntimeError("Deployed model artifact not loaded.")

        feat_dict = self.feature_pipeline.extract_features_dict(
            factory_features=factory_features,
            weather_features=weather_features,
            env_features=env_features,
            date_str=date_str
        )

        # 1. Model Drift Detection
        is_drift, drift_warnings, caution_note = self.drift_detector.check_input_drift(feat_dict)

        # 2. Prepare feature vector matching training feature columns
        df_feats = self.feature_pipeline.transform_dataframe(feat_dict)

        # 3. Model Inference (XGBoost expects unscaled features directly as trained)
        raw_pred = float(self.model.predict(df_feats)[0])
        pred_no2 = round(max(5.0, raw_pred), 2)

        # 4. Confidence Interval (Based on test RMSE = 5.33 ug/m3)
        rmse = float(self.metadata.get("metrics", {}).get("test_rmse", 5.33))
        ci_margin = 1.96 * rmse
        ci_low = round(max(4.0, pred_no2 - ci_margin), 1)
        ci_high = round(pred_no2 + ci_margin, 1)

        # 5. Executive Environmental Risk Score (0 - 100)
        # Combines ambient predicted concentration and industrial intensity factor
        intensity = feat_dict.get("energy_intensity_mwh_per_tonne", 0.25)
        intensity_factor = min(1.3, max(0.7, intensity / 0.25))
        base_score = (pred_no2 / 60.0) * 80.0 * intensity_factor
        risk_score = round(min(96.0, max(12.0, base_score)), 1)

        if risk_score >= 68.0:
            risk_level = "HIGH"
        elif risk_score >= 42.0:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        # 6. Major Factors for this specific prediction
        major_factors = []
        if feat_dict["natural_gas_m3"] > 500:
            major_factors.append({
                "factor": "Boiler Natural Gas Thermal Load",
                "impact": "HIGH",
                "evidence": f"Combustion volume: {feat_dict['natural_gas_m3']:,.0f} m³/day"
            })
        if feat_dict["diesel_litres"] > 100:
            major_factors.append({
                "factor": "Captive Diesel Generation",
                "impact": "HIGH",
                "evidence": f"Diesel fuel rate: {feat_dict['diesel_litres']:,.0f} L/day"
            })
        if feat_dict["wind_speed_ms"] < 2.0:
            major_factors.append({
                "factor": "Stagnant Atmospheric Airshed",
                "impact": "MEDIUM",
                "evidence": f"Low wind speed ({feat_dict['wind_speed_ms']} m/s) restricts convective dispersion"
            })
        if feat_dict["electricity_kwh"] > 5000:
            major_factors.append({
                "factor": "Grid Electricity Draw",
                "impact": "MEDIUM",
                "evidence": f"Daily consumption: {feat_dict['electricity_kwh']:,.0f} kWh"
            })

        return {
            "predicted_no2_ugm3": pred_no2,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "confidence_interval_95": [ci_low, ci_high],
            "confidence_level": "95% Empirical Out-of-Sample",
            "model_metadata": {
                "model_id": self.metadata.get("model_id", "MOD-XGB-001"),
                "model_name": self.metadata.get("model_name", "IndustrialRiskModel"),
                "version": self.metadata.get("version", "1.2.0"),
                "algorithm": self.metadata.get("algorithm", "XGBoost"),
                "test_rmse": rmse,
                "test_r2": self.metadata.get("metrics", {}).get("test_r2", 0.5457)
            },
            "major_contributing_factors": major_factors,
            "drift_detected": is_drift,
            "drift_warnings": drift_warnings,
            "caution_note": caution_note
        }

predictor = Predictor()
