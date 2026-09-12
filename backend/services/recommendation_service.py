from typing import Dict, Any, List

class RecommendationService:
    """
    Rule-Based Circular Alternative Recommendation Engine.
    Maps identified problem factors, fuel profiles, and waste streams to
    actionable circular interventions with defensible estimated CO2 reduction ranges,
    cost categorizations, difficulty, and operational benefits.
    """

    def generate_recommendations(
        self,
        analysis_result: Dict[str, Any],
        factory_features: Dict[str, Any],
        raw_processes: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        recommendations = []
        problem_factors = analysis_result.get("problem_factors", [])

        total_co2e = analysis_result.get("total_co2e_tonnes", 1.0)
        gas_m3 = factory_features.get("natural_gas_m3", 0.0)
        diesel_l = factory_features.get("diesel_liters", 0.0)
        landfill_kg = factory_features.get("landfill_kg", 0.0)
        waste_gen_kg = factory_features.get("waste_generated_kg", 0.0)
        recycled_pct = factory_features.get("recycled_pct", 0.0)
        elec_kwh = factory_features.get("electricity_kwh", 0.0)
        renew_pct = factory_features.get("renewable_pct", 0.0)

        # 1. Rule: High Boiler / Thermal Fuel Combustion
        boiler_processes = [
            p for p in raw_processes 
            if any(term in p.get("process_name", "").lower() for term in ["boiler", "heater", "furnace", "kiln"])
        ]

        if gas_m3 > 5000 or any(p.get("temperature_c", 0) > 180 for p in raw_processes):
            est_low = round(total_co2e * 0.12, 1)
            est_high = round(total_co2e * 0.22, 1)
            recommendations.append({
                "problem": "High Natural Gas & High-Temperature Exhaust Losses in Thermal Processes",
                "proposed_intervention": "Closed-Loop Waste Heat Recovery (WHR) & Flue Gas Economizer",
                "co2_reduction_range": f"12% – 22% of total plant CO2e (~{est_low} to {est_high} tCO2e/mo)",
                "cost_category": "Medium CapEx",
                "difficulty": "Medium",
                "expected_benefit": "Recovers sensible heat from 200°C+ flue gas to preheat boiler feedwater and incoming combustion air, cutting fuel gas consumption by 15-20%.",
                "reason": f"Active boilers and heaters consume {gas_m3:,.0f} m³ gas/mo with high flue exit temperatures, presenting prime thermodynamic waste-heat recovery potential."
            })

        # 2. Rule: Diesel Generator Reliance (Captive Power Emission Leak-Point)
        if diesel_l > 1000:
            est_low = round((diesel_l * 2.68 / 1000.0) * 0.70, 1)
            est_high = round((diesel_l * 2.68 / 1000.0) * 0.95, 1)
            recommendations.append({
                "problem": f"Heavy Captive Diesel Generator Usage ({diesel_l:,.0f} L/month)",
                "proposed_intervention": "Battery Energy Storage (BESS) + Rooftop Solar Peak Shaving Hybrid",
                "co2_reduction_range": f"70% – 95% of DG set emissions (~{est_low} to {est_high} tCO2e/mo)",
                "cost_category": "High CapEx",
                "difficulty": "Medium",
                "expected_benefit": "Eliminates high-cost, high-emission diesel spinning reserve during grid interruptions; provides clean instantaneous backup power.",
                "reason": f"Captive diesel combustion emits high particulate matter and CO2 right in the local airshed. Solar+storage circularizes on-site energy reliability."
            })

        # 3. Rule: High Landfill Waste & Low Circular Recycling
        if landfill_kg > 1500 or recycled_pct < 40.0:
            est_low = round((landfill_kg * 0.0008) * 0.40, 2)
            est_high = round((landfill_kg * 0.0008) * 0.75, 2)
            recommendations.append({
                "problem": f"High Solid Waste Discard to Landfill ({landfill_kg:,.0f} kg/month, {recycled_pct:.0f}% recycled)",
                "proposed_intervention": "Industrial Symbiosis & Secondary Raw Material Valorization Network",
                "co2_reduction_range": f"40% – 75% reduction in landfill footprint (~{est_low} to {est_high} tCO2e avoided)",
                "cost_category": "Low CapEx / Revenue Generating",
                "difficulty": "Easy to Medium",
                "expected_benefit": "Partners with regional cement co-processing or recycling off-takers to convert process filter cakes and distillation bottoms into alternative kiln fuels or packaging feedstock.",
                "reason": f"Factory disposes {landfill_kg:,.0f} kg solid byproduct monthly. Regional industrial symbiosis routes these streams into circular production loops."
            })

        # 4. Rule: Grid Electricity Carbon Footprint
        if elec_kwh > 50000 and renew_pct < 60.0:
            est_low = round(((elec_kwh * 0.716) / 1000.0) * 0.40, 1)
            est_high = round(((elec_kwh * 0.716) / 1000.0) * 0.70, 1)
            recommendations.append({
                "problem": f"High Grid Electricity Carbon Intensity (Renewable Share: {renew_pct:.0f}%)",
                "proposed_intervention": "Corporate Virtual Power Purchase Agreement (VPPA) & On-site Solar Canopy",
                "co2_reduction_range": f"40% – 70% Scope 2 reduction (~{est_low} to {est_high} tCO2e/mo)",
                "cost_category": "OpEx / Minimal Upfront",
                "difficulty": "Easy",
                "expected_benefit": "Transitions grid reliance to dedicated off-site wind-solar hybrid tariff or rooftop PPA, locking in clean power at levelized long-term costs.",
                "reason": f"Scope 2 power contributes substantially to total plant footprint. Increasing renewable fraction from {renew_pct:.0f}% to 75%+ directly cuts emissions."
            })

        # 5. Rule: Process Leak Point - Distillation / Solvent Vapor Losses
        distill_procs = [p for p in raw_processes if any(term in p.get("process_name", "").lower() for term in ["distill", "solvent", "stripping", "reactor"])]
        if distill_procs:
            recommendations.append({
                "problem": "Potential Fugitive VOC & Solvent Evaporative Losses in Separation Columns",
                "proposed_intervention": "Closed-Loop Closed-Vent Nitrogen Blanketing & Chilled Solvent Condenser",
                "co2_reduction_range": "15% – 30% reduction in chemical make-up raw material waste",
                "cost_category": "Medium CapEx",
                "difficulty": "Medium",
                "expected_benefit": "Recovers high-value unreacted volatile organics directly back into reaction vessels, preventing atmospheric venting and cutting raw material procurement.",
                "reason": "Solvent distillation is a common chemical leak-point; continuous vapor recovery circularizes raw material inputs."
            })

        # 6. Rule: Motor Driven Equipment & Steam Trap Monitoring
        pumps_or_drives = [p for p in raw_processes if p.get("energy_consumption_kwh", 0) > 15000]
        if pumps_or_drives or boiler_processes:
            recommendations.append({
                "problem": "Sub-optimal Steam Distribution & Motor Load Inefficiencies",
                "proposed_intervention": "Acoustic Steam-Trap Leak Detection & Variable Frequency Drives (VFDs)",
                "co2_reduction_range": "5% – 10% thermal and 15% – 25% pumping energy reduction",
                "cost_category": "Low CapEx",
                "difficulty": "Easy",
                "expected_benefit": "Identifies passing steam traps that vent live utility steam; modulates motor rpm based on real-time process load demands.",
                "reason": "Typical industrial steam loops suffer 8-15% invisible enthalpy loss via failed traps. Digital leak monitoring delivers immediate quick-payback circular gains."
            })

        return recommendations

recommendation_service = RecommendationService()
