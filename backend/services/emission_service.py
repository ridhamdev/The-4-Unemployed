import os
import pandas as pd
from typing import Dict, Any, List, Tuple

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
CSV_PATH = os.path.join(DATA_DIR, "emission_factors.csv")

class EmissionService:
    def __init__(self, factors_file: str = CSV_PATH):
        self.factors_file = factors_file
        self.factors_df = self._load_factors()

    def _load_factors(self) -> pd.DataFrame:
        if os.path.exists(self.factors_file):
            return pd.read_csv(self.factors_file)
        # Fallback in-memory dataframe if file missing
        data = {
            "fuel_type": ["diesel", "natural_gas", "coal", "heavy_fuel_oil", "lpg", "biomass", "grid_electricity_in", "grid_electricity_us", "grid_electricity_global"],
            "unit": ["L", "m3", "kg", "L", "kg", "kg", "kWh", "kWh", "kWh"],
            "co2e_total": [2.68, 2.03, 2.42, 3.12, 1.61, 0.05, 0.716, 0.386, 0.490],
            "source": ["DEFRA / IPCC", "US EPA / IPCC", "CEA / IPCC", "DEFRA", "DEFRA", "IPCC 2019", "CEA India", "US EPA eGRID", "IEA"],
            "year": [2023, 2023, 2023, 2023, 2023, 2023, 2024, 2023, 2023]
        }
        return pd.DataFrame(data)

    def get_factor(self, fuel_key: str) -> Dict[str, Any]:
        """Fetch emission factor by fuel key with fuzzy matching."""
        key = fuel_key.lower().strip().replace(" ", "_")
        matches = self.factors_df[self.factors_df["fuel_type"].str.lower() == key]
        if not matches.empty:
            row = matches.iloc[0]
            return {
                "fuel_type": row["fuel_type"],
                "unit": row["unit"],
                "co2e_factor_kg": float(row["co2e_total"]),
                "source": row["source"],
                "year": int(row["year"])
            }
        
        # Approximate matching
        for _, row in self.factors_df.iterrows():
            if row["fuel_type"] in key or key in row["fuel_type"]:
                return {
                    "fuel_type": row["fuel_type"],
                    "unit": row["unit"],
                    "co2e_factor_kg": float(row["co2e_total"]),
                    "source": row["source"],
                    "year": int(row["year"])
                }

        # Default fallback
        return {
            "fuel_type": fuel_key,
            "unit": "kg",
            "co2e_factor_kg": 2.20,
            "source": "Estimated Benchmark Average",
            "year": 2023
        }

    def calculate_factory_emissions(
        self,
        energy_data: Dict[str, Any],
        processes: List[Dict[str, Any]],
        country_grid: str = "in"
    ) -> Dict[str, Any]:
        """
        Calculates Estimated Scope 1 (Direct Fuels) and Scope 2 (Indirect Electricity) emissions.
        All values returned in metric tonnes CO2e (tCO2e).
        """
        factors_used = []

        # Scope 1 direct fuels
        diesel_liters = float(energy_data.get("diesel_liters_month", 0.0) or 0.0)
        gas_m3 = float(energy_data.get("natural_gas_m3_month", 0.0) or 0.0)
        other_fuel_val = float(energy_data.get("other_fuel_consumption", 0.0) or 0.0)
        other_fuel_name = str(energy_data.get("other_fuel_name", "None"))

        diesel_factor = self.get_factor("diesel")
        gas_factor = self.get_factor("natural_gas")
        factors_used.extend([diesel_factor, gas_factor])

        diesel_co2e_t = (diesel_liters * diesel_factor["co2e_factor_kg"]) / 1000.0
        gas_co2e_t = (gas_m3 * gas_factor["co2e_factor_kg"]) / 1000.0

        other_co2e_t = 0.0
        if other_fuel_name.lower() != "none" and other_fuel_val > 0:
            other_factor = self.get_factor(other_fuel_name)
            factors_used.append(other_factor)
            other_co2e_t = (other_fuel_val * other_factor["co2e_factor_kg"]) / 1000.0

        scope1_direct_t = diesel_co2e_t + gas_co2e_t + other_co2e_t

        # Scope 2 electricity
        elec_kwh = float(energy_data.get("electricity_kwh_month", 0.0) or 0.0)
        renewable_pct = float(energy_data.get("renewable_percentage", 0.0) or 0.0)
        grid_key = f"grid_electricity_{country_grid}" if f"grid_electricity_{country_grid}" in self.factors_df["fuel_type"].values else "grid_electricity_global"
        grid_factor = self.get_factor(grid_key)
        factors_used.append(grid_factor)

        effective_grid_kwh = elec_kwh * max(0.0, 1.0 - (renewable_pct / 100.0))
        scope2_indirect_t = (effective_grid_kwh * grid_factor["co2e_factor_kg"]) / 1000.0

        # Process-level breakdown
        process_emissions = []
        for p in processes:
            p_name = p.get("process_name", "Unknown Process")
            p_fuel = p.get("fuel_used", "none")
            p_fuel_val = float(p.get("fuel_consumption", 0.0) or 0.0)
            p_elec_val = float(p.get("energy_consumption_kwh", 0.0) or 0.0)

            p_co2e_t = 0.0
            p_fuel_factor = None
            if p_fuel and p_fuel.lower() not in ["none", ""]:
                p_fuel_factor = self.get_factor(p_fuel)
                p_co2e_t += (p_fuel_val * p_fuel_factor["co2e_factor_kg"]) / 1000.0

            # Add process electricity portion if applicable
            if p_elec_val > 0:
                p_co2e_t += (p_elec_val * max(0.0, 1.0 - (renewable_pct / 100.0)) * grid_factor["co2e_factor_kg"]) / 1000.0

            process_emissions.append({
                "process_name": p_name,
                "fuel_used": p_fuel,
                "fuel_consumption": p_fuel_val,
                "electricity_kwh": p_elec_val,
                "co2e_tonnes": round(p_co2e_t, 3),
                "factor_used": p_fuel_factor or grid_factor
            })

        total_co2e_t = scope1_direct_t + scope2_indirect_t

        return {
            "total_co2e_tonnes": round(total_co2e_t, 2),
            "scope1_direct_tonnes": round(scope1_direct_t, 2),
            "scope2_indirect_tonnes": round(scope2_indirect_t, 2),
            "diesel_co2e_tonnes": round(diesel_co2e_t, 2),
            "natural_gas_co2e_tonnes": round(gas_co2e_t, 2),
            "other_fuel_co2e_tonnes": round(other_co2e_t, 2),
            "electricity_co2e_tonnes": round(scope2_indirect_t, 2),
            "process_emissions": process_emissions,
            "factors_used": factors_used
        }

emission_service = EmissionService()
