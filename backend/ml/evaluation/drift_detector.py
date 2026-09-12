import os
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple

MASTER_DATASET = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
    "data", "processed", "master_spatial_temporal_dataset.csv"
)


class DriftDetector:
    """
    Model Drift & Out-of-Distribution Input Detector (Section 26).
    Compares incoming inference inputs against training empirical bounds (min, max, p01, p99).
    Flags out-of-range inputs to alert decision-makers without producing deceptive certainty.
    """

    def __init__(self):
        self.stats = {}
        self._init_bounds()

    def _init_bounds(self):
        if not os.path.exists(MASTER_DATASET):
            return
        df = pd.read_csv(MASTER_DATASET)
        critical_cols = [
            "production_tonnes", "natural_gas_m3", "electricity_kwh", "diesel_litres",
            "temperature_c", "wind_speed_ms", "relative_humidity_pct"
        ]
        for c in critical_cols:
            if c in df.columns:
                series = df[c].dropna()
                self.stats[c] = {
                    "min": float(series.min()),
                    "max": float(series.max()),
                    "p01": float(series.quantile(0.01)),
                    "p99": float(series.quantile(0.99)),
                    "mean": float(series.mean()),
                    "std": float(series.std())
                }

    def check_input_drift(self, feature_dict: Dict[str, float]) -> Tuple[bool, List[str], str]:
        """
        Validates whether incoming input falls outside model training bounds.
        Returns: (is_drift, list_of_warning_messages, recommendation_caution_flag)
        """
        warnings = []
        is_drift = False

        human_labels = {
            "natural_gas_m3": "Natural Gas Consumption",
            "production_tonnes": "Production Output",
            "electricity_kwh": "Electricity Consumption",
            "diesel_litres": "Diesel Fuel Consumption",
            "temperature_c": "Ambient Temperature",
            "wind_speed_ms": "Local Wind Speed"
        }

        for col, stat in self.stats.items():
            if col in feature_dict:
                val = float(feature_dict[col])
                lbl = human_labels.get(col, col)
                if val > stat["max"] * 1.5:
                    is_drift = True
                    warnings.append(
                        f"{lbl} ({val:,.1f}) exceeds the maximum observed in the model training baseline ({stat['max']:,.1f})."
                    )
                elif val < stat["min"] * 0.5 and val > 0:
                    is_drift = True
                    warnings.append(
                        f"{lbl} ({val:,.1f}) is substantially lower than the training dataset baseline ({stat['min']:,.1f})."
                    )
                elif val > stat["p99"]:
                    warnings.append(
                        f"{lbl} ({val:,.1f}) falls in the extreme top 1% (> {stat['p99']:,.1f}) of industrial observations."
                    )

        caution = ""
        if is_drift:
            caution = "Notice: Some factory parameters exceed standard training ranges. Environmental risk predictions incorporate widened confidence intervals."

        return is_drift, warnings, caution
