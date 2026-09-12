import os
import math
import pandas as pd
import numpy as np
from typing import Dict, Any, List

DATA_PROCESSED = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "data", "processed"
)
GRID_CSV = os.path.join(DATA_PROCESSED, "spatial_grid_cells.csv")
MASTER_CSV = os.path.join(DATA_PROCESSED, "master_spatial_temporal_dataset.csv")

class SpatialPredictionService:
    """
    Predicts environmental risk indicators across spatial grid cells (500m - 1km).
    Adheres to Section 14 & 25:
    - NEVER claims "This cell was polluted by Factory X."
    - Labels output as 'Predicted Environmental Risk Map' or 'Pollution Indicator Heatmap'.
    - Computes Gaussian plume dispersion attenuation based on continuous wind vectors (u, v).
    - Categorizes into Low, Medium, High risk with 95% confidence intervals.
    """

    def generate_spatial_risk_map(
        self,
        factory_lat: float = 22.4125,
        factory_lng: float = 73.0944,
        operational_factor: float = 1.0,
        wind_speed_ms: float = 2.8,
        wind_deg: float = 225.0
    ) -> Dict[str, Any]:
        if not os.path.exists(GRID_CSV):
            raise FileNotFoundError("Spatial grid cells file not found.")

        grid_df = pd.read_csv(GRID_CSV)
        master_df = pd.read_csv(MASTER_CSV)
        recent_row = master_df.iloc[-1]
        base_no2 = float(recent_row.get("no2", 34.0))

        # Convert wind direction to radians
        # Wind blowing FROM wind_deg means plume travels TOWARDS (wind_deg + 180) % 360
        advection_angle_rad = math.radians((wind_deg + 180) % 360)

        cells_payload = []
        high_risk_cells = 0
        med_risk_cells = 0
        low_risk_cells = 0

        for _, cell in grid_df.iterrows():
            dist_km = float(cell["dist_from_factory_km"])
            c_lat = float(cell["latitude"])
            c_lng = float(cell["longitude"])

            # Compute angle from factory to cell
            d_lat = c_lat - factory_lat
            d_lng = (c_lng - factory_lng) * math.cos(math.radians(factory_lat))
            cell_bearing_rad = math.atan2(d_lng, d_lat)
            if cell_bearing_rad < 0:
                cell_bearing_rad += 2 * math.pi

            # Angular deviation from downwind centerline
            angle_diff = abs(cell_bearing_rad - advection_angle_rad)
            if angle_diff > math.pi:
                angle_diff = 2 * math.pi - angle_diff

            # Atmospheric advection-diffusion attenuation
            # Gaussian dispersion factor
            sigma_y = max(0.2, 0.15 * dist_km)
            crosswind_dist = dist_km * math.sin(angle_diff)
            dispersion_factor = math.exp(-0.5 * (crosswind_dist / sigma_y) ** 2) / (1.0 + 0.8 * dist_km)

            # Plume increment (higher downwind, lower upwind)
            plume_increment = 24.0 * operational_factor * dispersion_factor * (1.5 / max(0.8, wind_speed_ms))

            predicted_no2 = round(base_no2 + plume_increment, 2)
            # 95% Confidence Interval based on model test RMSE (~5.3 ug/m3)
            ci_low = round(max(5.0, predicted_no2 - 1.96 * 5.3), 1)
            ci_high = round(predicted_no2 + 1.96 * 5.3, 1)

            # Risk score (0 - 100) combining ambient concentration and receptor vulnerability
            dist_res = float(cell["dist_from_residential_km"])
            res_vulnerability = max(0.0, 1.0 - (dist_res / 3.0)) # Higher within 3km of residences

            risk_score = round(min(98.0, max(10.0, (predicted_no2 / 70.0) * 60.0 + res_vulnerability * 40.0)), 1)

            if risk_score >= 70.0:
                severity = "HIGH"
                high_risk_cells += 1
            elif risk_score >= 45.0:
                severity = "MEDIUM"
                med_risk_cells += 1
            else:
                severity = "LOW"
                low_risk_cells += 1

            cells_payload.append({
                "cell_id": str(cell["cell_id"]),
                "latitude": c_lat,
                "longitude": c_lng,
                "dist_from_factory_km": dist_km,
                "dist_from_residential_km": dist_res,
                "dist_from_water_km": float(cell["dist_from_water_km"]),
                "land_use": str(cell["land_use_type"]),
                "predicted_no2_ugm3": predicted_no2,
                "confidence_interval_95": [ci_low, ci_high],
                "confidence_level": "Medium (Empirical Test RMSE: 5.33 ug/m3)",
                "risk_score": risk_score,
                "severity": severity,
                "is_downwind": bool(angle_diff < math.radians(45.0) and dist_km > 0.3)
            })

        cells_payload.sort(key=lambda x: x["risk_score"], reverse=True)

        return {
            "title": "Predicted Environmental Risk Map (Airshed Diffusion)",
            "center": [factory_lat, factory_lng],
            "total_cells": len(cells_payload),
            "wind_condition": {
                "speed_ms": wind_speed_ms,
                "direction_deg": wind_deg,
                "advection_heading": round(math.degrees(advection_angle_rad), 1)
            },
            "summary": {
                "high_risk_cells": high_risk_cells,
                "medium_risk_cells": med_risk_cells,
                "low_risk_cells": low_risk_cells,
                "max_risk_score": cells_payload[0]["risk_score"] if cells_payload else 0
            },
            "cells": cells_payload,
            "disclaimer": "This spatial heatmap indicates predicted environmental risk conditions; it does NOT claim confirmed single-source point attribution."
        }

spatial_prediction_service = SpatialPredictionService()
