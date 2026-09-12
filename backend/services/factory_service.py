import os
from typing import Dict, Any, List

class FactoryService:
    """
    Factory Profile Service providing 3 distinctly different industrial scenarios (Section 32):
    - Scenario A: Textile Dyeing & Wet Processing (Surat, Tapi River basin, heavy steam & coal/gas)
    - Scenario B: Agro-Food & Dairy Processing (Anand, Agro corridor, refrigeration, high organic waste)
    - Scenario C: Chemical & Specialty Polymers (Nandesari, Mini River basin, high solvent distillation)
    """

    SCENARIOS = {
        "textile_surat": {
            "factory_id": "FACT-TEX-001",
            "name": "Apex TexDye & Wet Processing Mills",
            "industry_type": "Textile Dyeing, Printing & Wet Processing",
            "location_name": "Pandesara GIDC Industrial Estate, Surat, Gujarat",
            "latitude": 21.1465,
            "longitude": 72.8350,
            "analysis_radius_km": 5.0,
            "num_employees": 380,
            "operating_hours_per_day": 24,
            "operating_days_per_month": 28,
            "energy": {
                "electricity_kwh_month": 140000,
                "electricity_source": "Grid + Captive Wind (10%)",
                "renewable_percentage": 10.0,
                "diesel_liters_month": 2200,
                "natural_gas_m3_month": 6500,
                "other_fuel_name": "Imported Steam Coal / Lignite",
                "other_fuel_consumption": 85.0 # tonnes/mo
            },
            "production": {
                "main_product": "Dyed & Finished Polyester/Cotton Fabric",
                "production_quantity_month": 450,
                "production_unit": "Tonnes",
                "raw_materials_used": "Grey Fabric, Reactive Dyes, Sodium Hydrosulfite, Acetic Acid",
                "approximate_quantity_month": 510,
                "material_category": "Textile Fibers & Specialty Dyes"
            },
            "waste": {
                "waste_generated_kg_month": 9500,
                "waste_type": "Chemical Coagulation ETP Sludge & Color Residue",
                "treatment_method": "Common Effluent Treatment Plant (CETP) Discharge + Secured Landfill",
                "recycled_percentage": 15.0,
                "waste_sent_to_landfill_kg": 8075
            },
            "processes": [
                {
                    "process_name": "High-Pressure Steam Boiler (15 TPH, Coal/Lignite)",
                    "energy_consumption_kwh": 18000,
                    "fuel_used": "coal",
                    "fuel_consumption": 85,
                    "fuel_unit": "Tonnes",
                    "waste_generated_kg": 3500,
                    "operating_hours_month": 672,
                    "temperature_c": 185,
                    "equipment_type": "Fluidized Bed Combustion (AFBC) Boiler",
                    "pollution_control": "Cyclone Separator Only (High Particulate Risk)"
                },
                {
                    "process_name": "Multi-Chamber Fabric Stenter & Heat-Setting Frame",
                    "energy_consumption_kwh": 35000,
                    "fuel_used": "natural_gas",
                    "fuel_consumption": 6500,
                    "fuel_unit": "m3",
                    "waste_generated_kg": 200,
                    "operating_hours_month": 620,
                    "temperature_c": 195,
                    "equipment_type": "Direct Gas-Fired Stenter Frame",
                    "pollution_control": "Exhaust Chimney (No Heat Exchanger)"
                },
                {
                    "process_name": "High-Temperature High-Pressure Jet Dyeing Range",
                    "energy_consumption_kwh": 42000,
                    "fuel_used": "steam",
                    "fuel_consumption": 0,
                    "fuel_unit": "tonnes_steam",
                    "waste_generated_kg": 4200,
                    "operating_hours_month": 650,
                    "temperature_c": 130,
                    "equipment_type": "HTHP Jet Dyeing Machines (12 Units)",
                    "pollution_control": "Drain to ETP (High Water & Dye Loss)"
                },
                {
                    "process_name": "Captive Emergency Diesel Generator (500 kVA)",
                    "energy_consumption_kwh": 0,
                    "fuel_used": "diesel",
                    "fuel_consumption": 2200,
                    "fuel_unit": "L",
                    "waste_generated_kg": 180,
                    "operating_hours_month": 80,
                    "temperature_c": 380,
                    "equipment_type": "500 kVA Turbocharged DG Set",
                    "pollution_control": "Acoustic Enclosure Only"
                }
            ]
        },

        "food_anand": {
            "factory_id": "FACT-FOOD-002",
            "name": "Amulya Dairy & Nutrition Agro-Foods",
            "industry_type": "Dairy, Beverage & Agro-Food Processing",
            "location_name": "Anand Agro-Industrial Corridor, Gujarat",
            "latitude": 22.5420,
            "longitude": 72.9650,
            "analysis_radius_km": 5.0,
            "num_employees": 195,
            "operating_hours_per_day": 24,
            "operating_days_per_month": 30,
            "energy": {
                "electricity_kwh_month": 210000,
                "electricity_source": "Grid + Rooftop Solar (25%)",
                "renewable_percentage": 25.0,
                "diesel_liters_month": 800,
                "natural_gas_m3_month": 18500,
                "other_fuel_name": "None",
                "other_fuel_consumption": 0
            },
            "production": {
                "main_product": "Pasteurized Milk, Milk Powder & Whey Derivatives",
                "production_quantity_month": 3200,
                "production_unit": "Tonnes",
                "raw_materials_used": "Raw Chilled Milk, Enzymes, Vitamin Premixes, Packaging Polyfilm",
                "approximate_quantity_month": 3350,
                "material_category": "Agricultural & Dairy Raw Produce"
            },
            "waste": {
                "waste_generated_kg_month": 14000,
                "waste_type": "High-COD Whey Effluent & Biological ETP Sludge",
                "treatment_method": "Anaerobic Biological ETP + Farm Composting",
                "recycled_percentage": 40.0,
                "waste_sent_to_landfill_kg": 8400
            },
            "processes": [
                {
                    "process_name": "Natural Gas Low-NOx Steam Boiler (8 TPH)",
                    "energy_consumption_kwh": 8500,
                    "fuel_used": "natural_gas",
                    "fuel_consumption": 14500,
                    "fuel_unit": "m3",
                    "waste_generated_kg": 120,
                    "operating_hours_month": 700,
                    "temperature_c": 170,
                    "equipment_type": "Packaged Fire-Tube Steam Boiler",
                    "pollution_control": "Economizer Preheater"
                },
                {
                    "process_name": "Milk Pasteurization & Plate Heat Exchangers",
                    "energy_consumption_kwh": 38000,
                    "fuel_used": "steam",
                    "fuel_consumption": 0,
                    "fuel_unit": "tonnes_steam",
                    "waste_generated_kg": 500,
                    "operating_hours_month": 720,
                    "temperature_c": 85,
                    "equipment_type": "Regenerative Plate Heat Exchanger (PHE)",
                    "pollution_control": "Clean-In-Place (CIP) Recovery"
                },
                {
                    "process_name": "Industrial Ammonia Cold Storage & Chilling Plant",
                    "energy_consumption_kwh": 95000,
                    "fuel_used": "grid_electricity",
                    "fuel_consumption": 95000,
                    "fuel_unit": "kWh",
                    "waste_generated_kg": 0,
                    "operating_hours_month": 720,
                    "temperature_c": 4,
                    "equipment_type": "Screw Compressor Ammonia Refrigeration",
                    "pollution_control": "Ammonia Leak Sensor Alarm"
                },
                {
                    "process_name": "Multi-Stage Spray Dryer for Dairy Powder",
                    "energy_consumption_kwh": 48000,
                    "fuel_used": "natural_gas",
                    "fuel_consumption": 4000,
                    "fuel_unit": "m3",
                    "waste_generated_kg": 1500,
                    "operating_hours_month": 550,
                    "temperature_c": 185,
                    "equipment_type": "Co-Current Spray Drying Tower",
                    "pollution_control": "Baghouse Dust Collector"
                },
                {
                    "process_name": "Anaerobic Wastewater Digestion & Sludge Dewatering",
                    "energy_consumption_kwh": 20500,
                    "fuel_used": "grid_electricity",
                    "fuel_consumption": 20500,
                    "fuel_unit": "kWh",
                    "waste_generated_kg": 11880,
                    "operating_hours_month": 720,
                    "temperature_c": 35,
                    "equipment_type": "UASB Reactor + Screw Press",
                    "pollution_control": "Biogas Flare Vent (No Energy Capture)"
                }
            ]
        },

        "chemical_nandesari": {
            "factory_id": "FACT-CHEM-003",
            "name": "Apex PetroChem & Polymers Ltd",
            "industry_type": "Chemical & Specialty Polymers",
            "location_name": "Nandesari Industrial Estate, Vadodara, Gujarat",
            "latitude": 22.4125,
            "longitude": 73.0944,
            "analysis_radius_km": 5.0,
            "num_employees": 240,
            "operating_hours_per_day": 24,
            "operating_days_per_month": 26,
            "energy": {
                "electricity_kwh_month": 185000,
                "electricity_source": "Grid + Captive Solar (15%)",
                "renewable_percentage": 15.0,
                "diesel_liters_month": 3200,
                "natural_gas_m3_month": 14000,
                "other_fuel_name": "None",
                "other_fuel_consumption": 0
            },
            "production": {
                "main_product": "Polymer Stabilizers & Resins",
                "production_quantity_month": 1200,
                "production_unit": "Tonnes",
                "raw_materials_used": "Phthalic Anhydride, Methanol, Catalyst Acids",
                "approximate_quantity_month": 1350,
                "material_category": "Petrochemical Feedstocks"
            },
            "waste": {
                "waste_generated_kg_month": 4800,
                "waste_type": "Chemical Sludge & Distillation Bottoms",
                "treatment_method": "Effluent Treatment Plant (ETP) & Secured Landfill",
                "recycled_percentage": 25.0,
                "waste_sent_to_landfill_kg": 3600
            },
            "processes": [
                {
                    "process_name": "Main Utility Steam Boiler (10 TPH)",
                    "energy_consumption_kwh": 12000,
                    "fuel_used": "natural_gas",
                    "fuel_consumption": 9200,
                    "fuel_unit": "m3",
                    "waste_generated_kg": 150,
                    "operating_hours_month": 624,
                    "temperature_c": 220,
                    "equipment_type": "Water-Tube Industrial Boiler",
                    "pollution_control": "Economizer Only"
                },
                {
                    "process_name": "High-Temp Thermic Fluid Heater",
                    "energy_consumption_kwh": 8500,
                    "fuel_used": "natural_gas",
                    "fuel_consumption": 4800,
                    "fuel_unit": "m3",
                    "waste_generated_kg": 80,
                    "operating_hours_month": 520,
                    "temperature_c": 290,
                    "equipment_type": "Coil-type Thermic Heater",
                    "pollution_control": "None"
                },
                {
                    "process_name": "Captive Diesel Generation (DG Set)",
                    "energy_consumption_kwh": 0,
                    "fuel_used": "diesel",
                    "fuel_consumption": 3200,
                    "fuel_unit": "L",
                    "waste_generated_kg": 320,
                    "operating_hours_month": 120,
                    "temperature_c": 420,
                    "equipment_type": "750 kVA Diesel Generator",
                    "pollution_control": "Acoustic Enclosure Only"
                },
                {
                    "process_name": "Vacuum Distillation & Solvent Stripping",
                    "energy_consumption_kwh": 55000,
                    "fuel_used": "grid_electricity",
                    "fuel_consumption": 55000,
                    "fuel_unit": "kWh",
                    "waste_generated_kg": 1450,
                    "operating_hours_month": 624,
                    "temperature_c": 115,
                    "equipment_type": "Fractionation Column",
                    "pollution_control": "Vent Condenser"
                },
                {
                    "process_name": "Effluent Sludge Dewatering & Drying",
                    "energy_consumption_kwh": 22000,
                    "fuel_used": "grid_electricity",
                    "fuel_consumption": 22000,
                    "fuel_unit": "kWh",
                    "waste_generated_kg": 2800,
                    "operating_hours_month": 480,
                    "temperature_c": 85,
                    "equipment_type": "Filter Press + Rotary Dryer",
                    "pollution_control": "Packed Scrubber"
                }
            ]
        }
    }

    def get_scenario(self, scenario_key: str) -> Dict[str, Any]:
        return self.SCENARIOS.get(scenario_key, self.SCENARIOS["chemical_nandesari"])

    def list_scenarios(self) -> List[Dict[str, Any]]:
        return [
            {
                "key": k,
                "name": v["name"],
                "industry": v["industry_type"],
                "location": v["location_name"],
                "coordinates": [v["latitude"], v["longitude"]],
                "description": (
                    "Surat Textile Dyeing: Tapi river basin, coal/gas steam heating, high water & effluent"
                    if k == "textile_surat"
                    else "Anand Dairy: Agro-corridor, high organic whey sludge, biogas & refrigeration potential"
                    if k == "food_anand"
                    else "Vadodara Chemical: Nandesari estate, distillation solvent recovery, Mini River proximity"
                )
            }
            for k, v in self.SCENARIOS.items()
        ]

factory_service = FactoryService()
