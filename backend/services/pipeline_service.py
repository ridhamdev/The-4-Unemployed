import math
from typing import Dict, Any, List, Optional

class PipelineService:
    """
    Data Preprocessing & Fusion Pipeline:
    1. Validates inputs & bounds
    2. Handles missing/null values with robust domain fallbacks
    3. Normalizes units (e.g. MWh equivalents, fuel masses)
    4. Encodes categoricals
    5. Calculates derived features (emission intensities, vulnerability indices)
    6. Merges factory operational + environmental airshed + geospatial terrain
    7. Produces an analysis-ready record
    """

    def process_and_fuse(
        self,
        factory_dict: Dict[str, Any],
        energy_dict: Dict[str, Any],
        production_dict: Dict[str, Any],
        waste_dict: Dict[str, Any],
        processes_list: List[Dict[str, Any]],
        env_dict: Dict[str, Any],
        geo_dict: Dict[str, Any]
    ) -> Dict[str, Any]:

        # 1. Validation & Missing Value Handling
        prod_qty = max(0.1, float(production_dict.get("production_quantity_month", 0.0) or 1.0))
        prod_unit = str(production_dict.get("production_unit", "Tonnes") or "Tonnes")

        elec_kwh = max(0.0, float(energy_dict.get("electricity_kwh_month", 0.0) or 0.0))
        renew_pct = min(100.0, max(0.0, float(energy_dict.get("renewable_percentage", 0.0) or 0.0)))
        diesel_l = max(0.0, float(energy_dict.get("diesel_liters_month", 0.0) or 0.0))
        gas_m3 = max(0.0, float(energy_dict.get("natural_gas_m3_month", 0.0) or 0.0))

        waste_gen_kg = max(0.0, float(waste_dict.get("waste_generated_kg_month", 0.0) or 0.0))
        recycled_pct = min(100.0, max(0.0, float(waste_dict.get("recycled_percentage", 0.0) or 0.0)))
        landfill_kg = max(0.0, float(waste_dict.get("waste_sent_to_landfill_kg", 0.0) or (waste_gen_kg * (1.0 - recycled_pct / 100.0))))

        op_hours_day = max(1.0, min(24.0, float(factory_dict.get("operating_hours_per_day", 24.0) or 24.0)))
        op_days_month = max(1.0, min(31.0, float(factory_dict.get("operating_days_per_month", 26.0) or 26.0)))
        total_monthly_op_hours = op_hours_day * op_days_month

        # Environmental values
        pm25 = float(env_dict.get("pm25", 0.0) or 0.0)
        pm10 = float(env_dict.get("pm10", 0.0) or 0.0)
        no2 = float(env_dict.get("no2", 0.0) or 0.0)
        so2 = float(env_dict.get("so2", 0.0) or 0.0)
        co = float(env_dict.get("co", 0.0) or 0.0)
        o3 = float(env_dict.get("o3", 0.0) or 0.0)

        # Geospatial features
        elev_m = float(geo_dict.get("elevation_m", 0.0) or 0.0)
        slope_deg = float(geo_dict.get("slope_deg", 0.0) or 0.0)
        land_cover = str(geo_dict.get("land_cover", "Industrial / Mixed"))
        dist_to_water = max(0.1, float(geo_dict.get("dist_to_water_km", 3.0) or 3.0))
        dist_to_res = max(0.1, float(geo_dict.get("dist_to_residential_km", 2.0) or 2.0))

        # 2. Unit Normalization to Common Energy Equivalent (MWh)
        # Natural gas ~10.5 kWh/m3, Diesel ~10.0 kWh/L
        gas_mwh = (gas_m3 * 10.5) / 1000.0
        diesel_mwh = (diesel_l * 10.0) / 1000.0
        elec_mwh = elec_kwh / 1000.0
        total_energy_mwh = gas_mwh + diesel_mwh + elec_mwh

        # 3. Derived Features
        energy_intensity_mwh_per_unit = total_energy_mwh / prod_qty if prod_qty > 0 else 0.0
        waste_intensity_kg_per_unit = waste_gen_kg / prod_qty if prod_qty > 0 else 0.0
        landfill_ratio = (landfill_kg / waste_gen_kg) if waste_gen_kg > 0 else 0.0

        # Environmental Airshed Stress Index (0 to 1 scale)
        # WHO 24h benchmarks: PM2.5 (15), PM10 (45), NO2 (25), SO2 (40)
        airshed_stress = min(1.0, (
            (pm25 / 150.0) * 0.4 +
            (pm10 / 250.0) * 0.2 +
            (no2 / 100.0) * 0.2 +
            (so2 / 100.0) * 0.2
        ))

        # Receptor Sensitivity Index (inversely proportional to distance to residential and water)
        # Higher score when closer to residential / water
        res_sensitivity = max(0.0, 1.0 - (dist_to_res / 10.0))
        water_sensitivity = max(0.0, 1.0 - (dist_to_water / 10.0))
        geospatial_sensitivity = (res_sensitivity * 0.6 + water_sensitivity * 0.4)

        # Build Clean Fusion Dataset
        return {
            "factory_features": {
                "factory_name": factory_dict.get("name", ""),
                "industry_type": factory_dict.get("industry_type", ""),
                "production_quantity": prod_qty,
                "production_unit": prod_unit,
                "total_operating_hours": total_monthly_op_hours,
                "electricity_kwh": elec_kwh,
                "electricity_mwh": round(elec_mwh, 2),
                "renewable_pct": renew_pct,
                "diesel_liters": diesel_l,
                "diesel_mwh": round(diesel_mwh, 2),
                "natural_gas_m3": gas_m3,
                "natural_gas_mwh": round(gas_mwh, 2),
                "total_energy_mwh": round(total_energy_mwh, 2),
                "energy_intensity_mwh_per_unit": round(energy_intensity_mwh_per_unit, 4),
                "waste_generated_kg": waste_gen_kg,
                "waste_intensity_kg_per_unit": round(waste_intensity_kg_per_unit, 2),
                "recycled_pct": recycled_pct,
                "landfill_kg": landfill_kg,
                "landfill_ratio": round(landfill_ratio, 3)
            },
            "environmental_features": {
                "pm25": pm25,
                "pm10": pm10,
                "no2": no2,
                "so2": so2,
                "co": co,
                "o3": o3,
                "airshed_stress_index": round(airshed_stress, 3),
                "source": env_dict.get("source", "Unknown"),
                "timestamp": env_dict.get("timestamp", ""),
                "is_real": env_dict.get("is_real", False)
            },
            "geospatial_features": {
                "latitude": factory_dict.get("latitude", 0.0),
                "longitude": factory_dict.get("longitude", 0.0),
                "elevation_m": elev_m,
                "slope_deg": slope_deg,
                "land_cover": land_cover,
                "dist_to_water_km": dist_to_water,
                "dist_to_residential_km": dist_to_res,
                "geospatial_sensitivity_index": round(geospatial_sensitivity, 3),
                "source": geo_dict.get("source", "Unknown"),
                "is_real": geo_dict.get("is_real", False)
            },
            "clean_processes": processes_list
        }

pipeline_service = PipelineService()
