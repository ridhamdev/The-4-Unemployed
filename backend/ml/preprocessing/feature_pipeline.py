import math
import pickle
import os
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, Any, Tuple

FEATURE_COLS = [
    "temperature_c", "relative_humidity_pct", "precipitation_mm", "surface_pressure_hpa",
    "wind_speed_ms", "wind_u", "wind_v",
    "ndvi", "ndbi", "ndwi",
    "production_tonnes", "natural_gas_m3", "electricity_kwh", "diesel_litres",
    "total_energy_mwh", "energy_intensity_mwh_per_tonne", "calculated_total_co2e_tonnes",
    "month_sin", "month_cos", "dow_sin", "dow_cos",
    "no2_lag_1d", "no2_lag_7d", "so2_lag_1d", "co_lag_1d", "pm25_lag_1d",
    "no2_7d_mean", "no2_30d_mean", "so2_7d_mean", "pm25_7d_mean"
]

class FeaturePipeline:
    """
    Unified Preprocessing & Feature Engineering Pipeline.
    Ensures EXACT same transformations between Training and Production Inference (Section 25).
    """

    def __init__(self, scaler_path: str = None):
        self.feature_cols = FEATURE_COLS
        self.scaler = None
        if scaler_path and os.path.exists(scaler_path):
            with open(scaler_path, "rb") as f:
                self.scaler = pickle.load(f)

    def set_scaler(self, scaler):
        self.scaler = scaler

    def save_scaler(self, path: str):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "wb") as f:
            pickle.dump(self.scaler, f)

    def extract_features_dict(
        self,
        factory_features: Dict[str, Any],
        weather_features: Dict[str, Any] = None,
        env_features: Dict[str, Any] = None,
        date_str: str = None
    ) -> Dict[str, float]:
        """Converts heterogeneous incoming payloads into aligned 30-feature dict."""
        weather = weather_features or {}
        env = env_features or {}

        # Date cyclic encodings
        if not date_str:
            d = datetime.now()
        else:
            try:
                d = datetime.strptime(date_str, "%Y-%m-%d")
            except Exception:
                d = datetime.now()

        month = d.month
        dow = d.weekday()
        month_sin = math.sin(2 * math.pi * month / 12.0)
        month_cos = math.cos(2 * math.pi * month / 12.0)
        dow_sin = math.sin(2 * math.pi * dow / 7.0)
        dow_cos = math.cos(2 * math.pi * dow / 7.0)

        # Weather features
        temp = float(weather.get("temperature_c", 28.5))
        rh = float(weather.get("relative_humidity_pct", 55.0))
        precip = float(weather.get("precipitation_mm", 0.0))
        pressure = float(weather.get("surface_pressure_hpa", 1008.0))
        ws = float(weather.get("wind_speed_ms", 2.8))

        # Continuous wind vector decomposition
        if "wind_u" in weather and "wind_v" in weather:
            wu = float(weather["wind_u"])
            wv = float(weather["wind_v"])
        else:
            deg = float(weather.get("wind_direction_deg", 225.0))
            rad = math.radians(deg)
            wu = -ws * math.sin(rad)
            wv = -ws * math.cos(rad)

        # Satellite indices
        ndvi = float(env.get("ndvi", 0.28))
        ndbi = float(env.get("ndbi", 0.12))
        ndwi = float(env.get("ndwi", -0.05))

        # Operational metrics (Daily equivalents)
        prod = float(factory_features.get("production_tonnes_day", factory_features.get("production_quantity", 45.0)))
        gas = float(factory_features.get("natural_gas_m3_day", factory_features.get("natural_gas_m3", 450.0)))
        elec = float(factory_features.get("electricity_kwh_day", factory_features.get("electricity_kwh", 6000.0)))
        diesel = float(factory_features.get("diesel_litres_day", factory_features.get("diesel_litres", 110.0)))

        # Derived energy & Scope 1/2 CO2e
        elec_mwh = elec / 1000.0
        gas_mwh = gas * 0.0105
        diesel_mwh = diesel * 0.0100
        total_energy_mwh = round(elec_mwh + gas_mwh + diesel_mwh, 3)
        energy_intensity = round(total_energy_mwh / max(1.0, prod), 4)
        total_co2e = round(elec * 0.000716 + gas * 0.0020 + diesel * 0.00268, 3)

        # Atmospheric lags & regional background
        no2_lag_1d = float(env.get("no2_lag_1d", env.get("no2", 34.2)))
        no2_lag_7d = float(env.get("no2_lag_7d", 32.8))
        so2_lag_1d = float(env.get("so2_lag_1d", env.get("so2", 14.5)))
        co_lag_1d = float(env.get("co_lag_1d", env.get("co", 0.75)))
        pm25_lag_1d = float(env.get("pm25_lag_1d", env.get("pm25", 58.0)))
        no2_7d_mean = float(env.get("no2_7d_mean", 33.5))
        no2_30d_mean = float(env.get("no2_30d_mean", 32.0))
        so2_7d_mean = float(env.get("so2_7d_mean", 14.0))
        pm25_7d_mean = float(env.get("pm25_7d_mean", 55.0))

        feat_dict = {
            "temperature_c": temp,
            "relative_humidity_pct": rh,
            "precipitation_mm": precip,
            "surface_pressure_hpa": pressure,
            "wind_speed_ms": ws,
            "wind_u": wu,
            "wind_v": wv,
            "ndvi": ndvi,
            "ndbi": ndbi,
            "ndwi": ndwi,
            "production_tonnes": prod,
            "natural_gas_m3": gas,
            "electricity_kwh": elec,
            "diesel_litres": diesel,
            "total_energy_mwh": total_energy_mwh,
            "energy_intensity_mwh_per_tonne": energy_intensity,
            "calculated_total_co2e_tonnes": total_co2e,
            "month_sin": month_sin,
            "month_cos": month_cos,
            "dow_sin": dow_sin,
            "dow_cos": dow_cos,
            "no2_lag_1d": no2_lag_1d,
            "no2_lag_7d": no2_lag_7d,
            "so2_lag_1d": so2_lag_1d,
            "co_lag_1d": co_lag_1d,
            "pm25_lag_1d": pm25_lag_1d,
            "no2_7d_mean": no2_7d_mean,
            "no2_30d_mean": no2_30d_mean,
            "so2_7d_mean": so2_7d_mean,
            "pm25_7d_mean": pm25_7d_mean
        }
        return feat_dict

    def transform_dataframe(self, feat_dict: Dict[str, float]) -> pd.DataFrame:
        df = pd.DataFrame([feat_dict])[self.feature_cols]
        return df

    def transform_scaled(self, feat_dict: Dict[str, float]) -> np.ndarray:
        df = self.transform_dataframe(feat_dict)
        if self.scaler is not None:
            return self.scaler.transform(df)
        return df.values
