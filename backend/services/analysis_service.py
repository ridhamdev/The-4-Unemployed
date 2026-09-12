from typing import Dict, Any, List
from backend.services.emission_service import emission_service

class AnalysisService:
    """
    Transparent Problem-Factor Identification and Scoring Engine (0-100).
    Combines:
    - Direct & Indirect emission contributions
    - Waste & Landfill footprint
    - Airshed sensitivity (Open-Meteo ambient air quality)
    - Geospatial proximity to receptors (residential settlements & waterways)
    - Abatement status
    """

    def analyze_factory(
        self,
        fused_data: Dict[str, Any],
        raw_processes: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        factory_feat = fused_data["factory_features"]
        env_feat = fused_data["environmental_features"]
        geo_feat = fused_data["geospatial_features"]

        # Calculate emissions
        energy_input = {
            "electricity_kwh_month": factory_feat["electricity_kwh"],
            "diesel_liters_month": factory_feat["diesel_liters"],
            "natural_gas_m3_month": factory_feat["natural_gas_m3"],
            "renewable_percentage": factory_feat["renewable_pct"]
        }
        emissions_calc = emission_service.calculate_factory_emissions(
            energy_input,
            raw_processes
        )

        total_co2e = max(0.01, emissions_calc["total_co2e_tonnes"])
        total_energy_mwh = max(0.01, factory_feat["total_energy_mwh"])
        total_waste_kg = max(0.01, factory_feat["waste_generated_kg"])
        airshed_stress = env_feat.get("airshed_stress_index", 0.3)
        geo_sens = geo_feat.get("geospatial_sensitivity_index", 0.3)

        problem_factors = []

        # 1. Evaluate Process Level Factors
        for p in emissions_calc["process_emissions"]:
            p_name = p["process_name"]
            p_co2e = p["co2e_tonnes"]
            p_elec = p["electricity_kwh"]
            p_fuel_val = p["fuel_consumption"]
            p_fuel_type = p["fuel_used"]

            # Match raw process for abatement & waste
            raw_p = next((x for x in raw_processes if x.get("process_name") == p_name), {})
            p_waste = float(raw_p.get("waste_generated_kg", 0.0) or 0.0)
            p_control = str(raw_p.get("pollution_control", "None"))
            p_temp = float(raw_p.get("temperature_c", 0.0) or 0.0)

            # Energy conversion for process
            p_mwh = (p_elec / 1000.0)
            if "gas" in p_fuel_type:
                p_mwh += (p_fuel_val * 10.5) / 1000.0
            elif "diesel" in p_fuel_type:
                p_mwh += (p_fuel_val * 10.0) / 1000.0

            emission_pct = (p_co2e / total_co2e) * 100.0 if total_co2e > 0 else 0.0
            energy_pct = (p_mwh / total_energy_mwh) * 100.0 if total_energy_mwh > 0 else 0.0
            waste_pct = (p_waste / total_waste_kg) * 100.0 if total_waste_kg > 0 else 0.0

            # Abatement adjustment
            abatement_adj = 0.0
            control_lower = p_control.lower()
            if any(term in control_lower for term in ["scrubber", "filter", "esp", "economizer", "condenser"]):
                abatement_adj = -12.0
            elif "none" in control_lower:
                abatement_adj = +10.0

            # Temperature combustion risk penalty (>200C without WHR)
            temp_penalty = 6.0 if p_temp > 200 else 0.0

            # Transparent formula:
            raw_score = (
                (emission_pct * 0.40) +
                (energy_pct * 0.20) +
                (waste_pct * 0.15) +
                (airshed_stress * 18.0) +
                (geo_sens * 14.0) +
                temp_penalty +
                abatement_adj
            )
            final_score = round(max(5.0, min(98.0, raw_score)), 1)

            if final_score >= 70.0:
                severity = "HIGH"
            elif final_score >= 40.0:
                severity = "MEDIUM"
            else:
                severity = "LOW"

            why_reasons = []
            if emission_pct >= 20.0:
                why_reasons.append(f"Drives {emission_pct:.1f}% of factory CO2e ({p_co2e:.1f} tCO2e/mo)")
            if p_temp > 200:
                why_reasons.append(f"High thermal exhaust at {p_temp:.0f}°C without integrated heat recovery")
            if "none" in control_lower:
                why_reasons.append("Zero active end-of-pipe emission controls")
            elif abatement_adj < 0:
                why_reasons.append(f"Mitigated by {p_control}")
            if airshed_stress > 0.45:
                why_reasons.append(f"Operating in sensitive airshed (PM2.5: {env_feat['pm25']} µg/m³)")
            if geo_sens > 0.5:
                why_reasons.append(f"Located within {geo_feat['dist_to_residential_km']} km of residential settlement")

            why_explanation = "; ".join(why_reasons) if why_reasons else f"Moderate process impact ({emission_pct:.1f}% emissions)"

            problem_factors.append({
                "factor_name": f"{p_name} ({p_fuel_type.replace('_', ' ').title()})",
                "category": "Process Emission",
                "contribution_pct": round(emission_pct, 1),
                "problem_score": final_score,
                "severity": severity,
                "why_explanation": why_explanation,
                "raw_value": round(p_co2e, 2),
                "unit": "tCO2e/mo"
            })

        # 2. Evaluate Solid Waste & Landfill Factor
        landfill_kg = factory_feat["landfill_kg"]
        waste_gen_kg = factory_feat["waste_generated_kg"]
        recycled_pct = factory_feat["recycled_pct"]

        if waste_gen_kg > 0:
            landfill_pct = (landfill_kg / waste_gen_kg) * 100.0
            waste_score = (landfill_pct * 0.50) + (geo_sens * 20.0) + (15.0 if recycled_pct < 30.0 else -5.0)
            waste_score = round(max(10.0, min(95.0, waste_score)), 1)
            waste_sev = "HIGH" if waste_score >= 70.0 else ("MEDIUM" if waste_score >= 40.0 else "LOW")
            
            why_waste = f"{landfill_kg:.0f} kg/mo ({landfill_pct:.1f}%) sent to landfill; recycling rate only {recycled_pct:.0f}%. Proximity to water receptor ({geo_feat['dist_to_water_km']} km) increases runoff risk."
            problem_factors.append({
                "factor_name": "Landfill Waste & Unrecovered By-products",
                "category": "Solid Waste",
                "contribution_pct": round(landfill_pct, 1),
                "problem_score": waste_score,
                "severity": waste_sev,
                "why_explanation": why_waste,
                "raw_value": round(landfill_kg, 1),
                "unit": "kg/mo landfilled"
            })

        # 3. Evaluate Grid Electricity Footprint Factor
        elec_co2e = emissions_calc["electricity_co2e_tonnes"]
        elec_pct = (elec_co2e / total_co2e) * 100.0
        elec_score = (elec_pct * 0.45) + ((100.0 - factory_feat["renewable_pct"]) * 0.25)
        elec_score = round(max(5.0, min(95.0, elec_score)), 1)
        elec_sev = "HIGH" if elec_score >= 70.0 else ("MEDIUM" if elec_score >= 40.0 else "LOW")

        why_elec = f"Accounts for {elec_pct:.1f}% of total emissions ({elec_co2e:.1f} tCO2e/mo). Renewable electricity share is currently {factory_feat['renewable_pct']:.0f}%."
        problem_factors.append({
            "factor_name": "Grid Electricity Dependence",
            "category": "Scope 2 Energy",
            "contribution_pct": round(elec_pct, 1),
            "problem_score": elec_score,
            "severity": elec_sev,
            "why_explanation": why_elec,
            "raw_value": round(elec_co2e, 2),
            "unit": "tCO2e/mo"
        })

        # Sort problem factors by problem_score descending
        problem_factors.sort(key=lambda x: x["problem_score"], reverse=True)

        # Composite overall factory risk score (weighted average of top 3)
        top_scores = [x["problem_score"] for x in problem_factors[:3]]
        composite_score = round(sum(top_scores) / len(top_scores), 1) if top_scores else 50.0

        major_source = problem_factors[0]["factor_name"] if problem_factors else "Unspecified"
        prod_qty = factory_feat["production_quantity"]
        co2e_per_unit = round(total_co2e / prod_qty, 4) if prod_qty > 0 else 0.0

        return {
            "total_co2e_tonnes": total_co2e,
            "scope1_direct_co2e_tonnes": emissions_calc["scope1_direct_tonnes"],
            "scope2_indirect_co2e_tonnes": emissions_calc["scope2_indirect_tonnes"],
            "co2e_per_production_unit": co2e_per_unit,
            "production_unit": factory_feat["production_unit"],
            "major_emission_source": major_source,
            "composite_risk_score": composite_score,
            "problem_factors": problem_factors,
            "emission_factors_used": emissions_calc["factors_used"]
        }

analysis_service = AnalysisService()
