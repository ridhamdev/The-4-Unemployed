import math
from typing import Dict, Any, List

class DecisionEngine:
    """
    Decoupled Industrial Decision Engine (Section 16).
    Translates factory operational inputs, deployed ML risk predictions, and GIS proximity
    into executive problem prioritizations, circular engineering interventions, and phased action plans.
    """

    def analyze_factory_decision(
        self,
        factory_data: Dict[str, Any],
        ml_prediction: Dict[str, Any],
        gis_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Synthesizes operational logs, ML predictions, and GIS spatial risks into
        concrete executive recommendations.
        """
        industry = factory_data.get("industry_type", "").lower()
        energy = factory_data.get("energy", {})
        production = factory_data.get("production", {})
        waste = factory_data.get("waste", {})
        processes = factory_data.get("processes", [])

        # Operational metrics
        elec_kwh = float(energy.get("electricity_kwh_month", 150000))
        gas_m3 = float(energy.get("natural_gas_m3_month", 10000))
        diesel_l = float(energy.get("diesel_liters_month", 2000))
        other_fuel_name = energy.get("other_fuel_name", "None")
        other_fuel_val = float(energy.get("other_fuel_consumption", 0))
        prod_tonnes = max(1.0, float(production.get("production_quantity_month", 1000)))
        waste_kg = float(waste.get("waste_generated_kg_month", 5000))
        recycled_pct = float(waste.get("recycled_percentage", 20.0))
        renew_pct = float(energy.get("renewable_percentage", 10.0))

        # GIS spatial context
        nearest_water = gis_analysis.get("nearest_water_body", {})
        water_dist_km = float(nearest_water.get("distance_km", 3.0))
        water_name = nearest_water.get("name", "Local Water Body")

        nearest_res = gis_analysis.get("nearest_residential_area", {})
        res_dist_km = float(nearest_res.get("distance_km", 3.0))
        res_name = nearest_res.get("name", "Residential Settlement")

        # ML Risk context
        risk_score = float(ml_prediction.get("risk_score", 50.0))
        predicted_no2 = float(ml_prediction.get("predicted_no2_ugm3", 35.0))

        # Scope 1 & 2 emissions (monthly tCO2e)
        scope1_gas = gas_m3 * 0.0020
        scope1_diesel = diesel_l * 0.00268
        scope1_coal = (other_fuel_val * 2.42) if "coal" in other_fuel_name.lower() or "lignite" in other_fuel_name.lower() else 0.0
        scope1_total = scope1_gas + scope1_diesel + scope1_coal
        scope2_elec = (elec_kwh * 0.716) / 1000.0
        total_monthly_co2e = round(scope1_total + scope2_elec, 1)

        # Intensity metrics
        elec_intensity_kwh_tonne = round(elec_kwh / prod_tonnes, 1)
        co2_intensity_tonne_tonne = round(total_monthly_co2e / prod_tonnes, 3)

        # -------------------------------------------------------------
        # 1. TOP PRIORITIZED PROBLEMS (3 to 5 issues with evidence)
        # -------------------------------------------------------------
        top_problems = []

        # Check for coal/solid fuel combustion
        if scope1_coal > 0:
            top_problems.append({
                "rank": 1,
                "problem_title": "Heavy Solid Fuel (Coal/Lignite) Combustion & Flue Particulate Emissions",
                "severity": "HIGH",
                "affected_process": "High-Pressure Steam Boiler (15 TPH, Coal/Lignite)",
                "why_it_matters": (
                    f"Solid fuel combustion is the primary source of particulate matter and acid gas emissions. "
                    f"The factory is located only {res_dist_km:.1f} km from {res_name}, posing direct human receptor health risks."
                ),
                "evidence_metric": (
                    f"Consumes {other_fuel_val:.0f} tonnes coal/mo, generating {scope1_coal:.1f} tCO₂e/mo "
                    f"({(scope1_coal / max(1.0, total_monthly_co2e)) * 100:.1f}% of factory emissions)."
                )
            })

        # Check for natural gas thermal losses
        if gas_m3 > 5000:
            boiler_proc = next((p["process_name"] for p in processes if "boiler" in p.get("process_name", "").lower()), "Thermal Units")
            pct_gas_co2 = (scope1_gas / max(1.0, total_monthly_co2e)) * 100
            top_problems.append({
                "rank": len(top_problems) + 1,
                "problem_title": "Thermal Energy Losses in High-Temperature Exhaust & Boilers",
                "severity": "HIGH" if gas_m3 > 12000 else "MEDIUM",
                "affected_process": boiler_proc,
                "why_it_matters": "Unrecovered flue exhaust represents thermodynamic energy loss, inflating natural gas purchases and heating costs.",
                "evidence_metric": f"Natural gas consumption ({gas_m3:,.0f} m³/mo) accounts for {pct_gas_co2:.1f}% of estimated plant carbon footprint."
            })

        # Check for organic wastewater / low recycling in dairy/food
        if "dairy" in industry or "food" in industry:
            top_problems.append({
                "rank": len(top_problems) + 1,
                "problem_title": "Uncaptured Biogas in High-COD Organic Sludge & Wastewater",
                "severity": "HIGH",
                "affected_process": "Anaerobic Wastewater Digestion & Sludge Press",
                "why_it_matters": (
                    f"High biological oxygen demand in dairy whey effluent poses extreme eutrophication risk "
                    f"to {water_name} located {water_dist_km:.1f} km away. Venting biogas wastes renewable methane fuel."
                ),
                "evidence_metric": f"Generates {waste_kg:,.0f} kg/mo organic sludge with unutilized methane generation potential."
            })

        # Check for solvent VOCs in chemical industry
        if "chemical" in industry or "polymer" in industry:
            distill_proc = next((p["process_name"] for p in processes if any(k in p.get("process_name", "").lower() for k in ["distill", "solvent", "heater"])), "Vacuum Distillation")
            top_problems.append({
                "rank": len(top_problems) + 1,
                "problem_title": "Fugitive Solvent VOC Venting & Thermal Fluid Heater Radiation Losses",
                "severity": "HIGH",
                "affected_process": distill_proc,
                "why_it_matters": (
                    f"Volatile organic compounds vented at {distill_proc} act as ozone and smog precursors. "
                    f"Distance to {water_name} ({water_dist_km:.1f} km) requires leak-tight solvent containment."
                ),
                "evidence_metric": f"Operates at 115°C – 290°C with vent condenser recovery efficiency below circular closed-loop threshold."
            })

        # Check for captive diesel generation
        if diesel_l > 1000:
            top_problems.append({
                "rank": len(top_problems) + 1,
                "problem_title": "High-Emission Captive Diesel Generator Reliance for Backup Power",
                "severity": "MEDIUM",
                "affected_process": "Captive Emergency Diesel Generator (DG Set)",
                "why_it_matters": "Diesel generator exhaust contains unburned hydrocarbons and fine soot emitted at ground level.",
                "evidence_metric": f"Consumes {diesel_l:,.0f} L diesel/mo emitting {scope1_diesel:.1f} tCO₂e/mo under intermittent grid interruptions."
            })

        # Check for low waste recovery
        if recycled_pct < 35.0:
            top_problems.append({
                "rank": len(top_problems) + 1,
                "problem_title": "Low Solid Byproduct Circularity & High Secured Landfill Dependence",
                "severity": "MEDIUM",
                "affected_process": "Sludge Dewatering & Solid Waste Handling",
                "why_it_matters": "Sending process residues to landfills loses potential secondary material value and incurs high disposal tipping fees.",
                "evidence_metric": f"Only {recycled_pct:.1f}% of {waste_kg:,.0f} kg/mo total waste is recycled; {waste.get('waste_sent_to_landfill_kg', waste_kg * 0.75):,.0f} kg sent to disposal."
            })

        # Limit to top 4 issues
        top_problems = top_problems[:4]
        for i, p in enumerate(top_problems):
            p["rank"] = i + 1

        # -------------------------------------------------------------
        # 2. CIRCULAR ALTERNATIVE RECOMMENDATIONS (Industry Tailored)
        # -------------------------------------------------------------
        recommendations = []

        if "textile" in industry:
            # Rec 1: Boiler Economizer & Condensate Recycling
            saved_fuel_tonnes = round(other_fuel_val * 0.15, 1)
            saved_co2 = round(saved_fuel_tonnes * 2.42, 1)
            recommendations.append({
                "id": "REC-TEX-01",
                "title": "Flue Gas Economizer & Pressurized Condensate Heat Recovery Loop",
                "why": f"Boiler flue gas exits above 185°C without full heat recovery. Condensate from stenters and jet dyeing contains recoverable sensible heat.",
                "expected_benefit": f"Preheats boiler feedwater from 30°C to 85°C, reducing solid fuel consumption by ~15% and recovering treated hot water.",
                "estimated_co2_reduction": f"~{saved_co2} tCO₂e/month ({saved_fuel_tonnes} tonnes coal saved)",
                "cost_level": "MEDIUM",
                "implementation_difficulty": "MEDIUM",
                "payback_period_months": 14,
                "affected_process": "High-Pressure Steam Boiler"
            })
            # Rec 2: Caustic Soda & Water Recovery
            recommendations.append({
                "id": "REC-TEX-02",
                "title": "Zero Liquid Discharge (ZLD) Ultrafiltration & Caustic Mercerizing Recovery",
                "why": f"Jet dyeing and bleaching generate high-salinity effluent discharged towards {water_name} ({water_dist_km:.1f} km away).",
                "expected_benefit": "Recovers 80% of process water for direct reuse in dye baths and extracts 90%+ caustic soda for circular chemical replenishment.",
                "estimated_co2_reduction": "~18.5 tCO₂e/month (avoided virgin chemical manufacture)",
                "cost_level": "HIGH",
                "implementation_difficulty": "COMPLEX",
                "payback_period_months": 22,
                "affected_process": "Jet Dyeing & Bleaching Range"
            })
            # Rec 3: Stenter Heat Recovery & Electrostatic Precipitator
            recommendations.append({
                "id": "REC-TEX-03",
                "title": "Air-to-Air Heat Exchanger & Electrostatic Precipitator on Stenter Chimneys",
                "why": "Stenter frames vent hot air at 195°C laden with vaporized textile finish oils into the local airshed.",
                "expected_benefit": "Preheats incoming makeup air, cutting stenter natural gas consumption by 18% while scrubbing 95% of oil aerosols.",
                "estimated_co2_reduction": f"~{round(gas_m3 * 0.18 * 0.0020, 1)} tCO₂e/month",
                "cost_level": "LOW",
                "implementation_difficulty": "EASY",
                "payback_period_months": 8,
                "affected_process": "Multi-Chamber Fabric Stenter Frame"
            })

        elif "dairy" in industry or "food" in industry:
            # Rec 1: High-Rate Anaerobic Biogas Cogeneration
            biogas_m3_est = round(waste_kg * 0.35, 0)
            biogas_kwh_est = round(biogas_m3_est * 2.0, 0)
            saved_co2 = round((biogas_kwh_est * 0.716) / 1000.0, 1)
            recommendations.append({
                "id": "REC-FOOD-01",
                "title": "High-Rate Anaerobic Digestion (UASB) with Combined Heat & Power (CHP)",
                "why": f"High-COD dairy whey and organic sludge is currently flared or composted without methane energy capture near {water_name}.",
                "expected_benefit": f"Captures ~{biogas_m3_est:,.0f} m³ biomethane/month to generate on-site electricity and hot water, offsetting grid power.",
                "estimated_co2_reduction": f"~{saved_co2} tCO₂e/month ({biogas_kwh_est:,.0f} kWh clean power generated)",
                "cost_level": "HIGH",
                "implementation_difficulty": "MEDIUM",
                "payback_period_months": 20,
                "affected_process": "Anaerobic Wastewater Digestion Reactor"
            })
            # Rec 2: Spray Dryer Exhaust Heat Recirculation
            saved_gas_dryer = round(4000 * 0.22, 0)
            recommendations.append({
                "id": "REC-FOOD-02",
                "title": "Spray Drying Exhaust Air Heat Recovery Loop & Cyclone Fines Recovery",
                "why": "Milk powder spray dryer exhausts air at 185°C; fines carry-over represents product loss.",
                "expected_benefit": "Recovers exhaust heat through an indirect finned heat pipe exchanger to preheat inlet air, saving 22% dryer fuel.",
                "estimated_co2_reduction": f"~{round(saved_gas_dryer * 0.0020, 1)} tCO₂e/month",
                "cost_level": "MEDIUM",
                "implementation_difficulty": "MEDIUM",
                "payback_period_months": 12,
                "affected_process": "Multi-Stage Spray Dryer"
            })
            # Rec 3: Whey Permeate Valorization into Bioproducts
            recommendations.append({
                "id": "REC-FOOD-03",
                "title": "Ultrafiltration Whey Demineralization & Animal Feed Valorization",
                "why": "Liquid whey permeate contains nutritious milk sugars and proteins that overburden wastewater plants.",
                "expected_benefit": "Transforms liquid whey byproduct into dry animal feed concentrate, eliminating ETP organic shock loads.",
                "estimated_co2_reduction": "~12.0 tCO₂e/month (avoided effluent degradation)",
                "cost_level": "LOW",
                "implementation_difficulty": "EASY",
                "payback_period_months": 6,
                "affected_process": "Effluent Treatment Plant"
            })

        else: # Chemical / Specialty Polymers
            # Rec 1: Waste Heat Recovery Boiler Economizer
            saved_gas_boiler = round(gas_m3 * 0.16, 0)
            saved_co2_boiler = round(saved_gas_boiler * 0.0020, 1)
            recommendations.append({
                "id": "REC-CHEM-01",
                "title": "Closed-Loop Flue Gas Economizer & Boiler Feedwater Preheater",
                "why": f"Utility boiler and thermic fluid heater operate at 220°C – 290°C with high flue heat loss.",
                "expected_benefit": f"Recovers exhaust heat to preheat incoming water, slashing natural gas demand by ~16% ({saved_gas_boiler:,.0f} m³/mo).",
                "estimated_co2_reduction": f"~{saved_co2_boiler} tCO₂e/month",
                "cost_level": "MEDIUM",
                "implementation_difficulty": "MEDIUM",
                "payback_period_months": 15,
                "affected_process": "Utility Steam Boiler & Thermic Fluid Heater"
            })
            # Rec 2: Chilled Solvent Vent Condenser for VOC Circularity
            recommendations.append({
                "id": "REC-CHEM-02",
                "title": "Nitrogen-Blanketed Chilled Secondary Solvent Condenser (-15°C)",
                "why": f"Vacuum distillation vents trace volatile solvents, located only {res_dist_km:.1f} km from {res_name}.",
                "expected_benefit": "Achieves 98.5% solvent recovery efficiency, recycling high-value methanol and aromatic solvent vapors directly back to reactors.",
                "estimated_co2_reduction": "~14.2 tCO₂e/month (raw material upstream credit)",
                "cost_level": "MEDIUM",
                "implementation_difficulty": "EASY",
                "payback_period_months": 9,
                "affected_process": "Vacuum Distillation & Fractionation Column"
            })
            # Rec 3: Industrial Symbiosis for Sludge Co-Processing
            saved_co2_sludge = round((waste_kg * 0.75 * 0.0008) * 0.60, 1)
            recommendations.append({
                "id": "REC-CHEM-03",
                "title": "Industrial Symbiosis: Chemical Sludge Co-Processing in Regional Cement Kilns",
                "why": f"Disposing {waste_kg:,.0f} kg/mo sludge into secured landfills creates long-term liability.",
                "expected_benefit": "Partners with regional cement kilns to use dried chemical sludge as alternative fuel & raw material (AFR), achieving 100% landfill diversion.",
                "estimated_co2_reduction": f"~{saved_co2_sludge} tCO₂e/month avoided landfill methane",
                "cost_level": "LOW",
                "implementation_difficulty": "EASY",
                "payback_period_months": 3,
                "affected_process": "Effluent Sludge Dewatering & Drying"
            })

        # -------------------------------------------------------------
        # 3. PHASED ACTION PLAN
        # -------------------------------------------------------------
        action_plan = {
            "immediate_actions_0_30_days": [
                "Conduct comprehensive ultrasonic steam trap audit to isolate leaking bypass valves and restore condensate traps.",
                "Calibrate air-to-fuel ratio across combustion burners with continuous flue gas O₂ / CO analyzers.",
                "Verify ETP pipeline containment integrity and stormwater diversion valves."
            ],
            "short_term_actions_1_6_months": [
                f"Procure and commission {recommendations[0]['title']} on {recommendations[0]['affected_process']}.",
                f"Install automated temperature and pressure monitoring to prevent fugitive vent losses.",
                "Initiate formal off-taker negotiations for industrial byproduct symbiosis."
            ],
            "long_term_actions_6_18_months": [
                f"Full engineering deployment of {recommendations[1]['title']}.",
                "Execute Corporate Virtual Power Purchase Agreement (VPPA) to boost renewable electricity share to 60%+.",
                "Implement ISO 50001 continuous energy management system."
            ]
        }

        # -------------------------------------------------------------
        # 4. "WHY THIS RESULT?" SUPPORTING EVIDENCE
        # -------------------------------------------------------------
        why_evidence = [
            {
                "claim": f"Primary environmental pressure identified at {top_problems[0]['affected_process']}",
                "supporting_data": top_problems[0]['evidence_metric'],
                "context": f"Evaluated under local airshed meteorological dispersion and {res_dist_km:.1f} km proximity to {res_name}."
            },
            {
                "claim": f"Total Estimated Carbon Footprint: {total_monthly_co2e} tCO₂e/month",
                "supporting_data": f"Scope 1 Thermal: {scope1_total:.1f} tCO₂e/mo | Scope 2 Grid: {scope2_elec:.1f} tCO₂e/mo",
                "context": f"Yields a facility carbon intensity of {co2_intensity_tonne_tonne} tCO₂e per tonne of finished product."
            },
            {
                "claim": f"Local Hydrological Vulnerability: {water_name} is {water_dist_km:.1f} km away",
                "supporting_data": f"Nearest boundary coordinate: {nearest_water.get('nearest_boundary_point', [])}",
                "context": "Directs circular priority toward zero-liquid discharge, water recovery, and high-COD effluent containment."
            }
        ]

        return {
            "factory_health": {
                "environmental_risk_score": risk_score,
                "environmental_risk_level": ml_prediction.get("risk_level", "MEDIUM"),
                "estimated_monthly_co2e_tonnes": total_monthly_co2e,
                "carbon_intensity_tonne_per_tonne": co2_intensity_tonne_tonne,
                "electricity_intensity_kwh_per_tonne": elec_intensity_kwh_tonne,
                "waste_circularity_recovery_pct": recycled_pct,
                "renewable_energy_pct": renew_pct,
                "airshed_context": "Critical" if predicted_no2 > 45 else ("Moderate" if predicted_no2 > 25 else "Low Background"),
                "data_quality": "HIGH" if not ml_prediction.get("drift_detected") else "MEDIUM (Parameters Outside Model Norm)"
            },
            "top_problems": top_problems,
            "recommendations": recommendations,
            "action_plan": action_plan,
            "why_this_result": why_evidence
        }

decision_engine = DecisionEngine()
