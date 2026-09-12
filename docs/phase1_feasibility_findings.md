# Phase 1 Feasibility Findings: Industrial Emission Leak-Point Detector & Circular Alternative Recommender

**Project:** HackOut’26 Phase-1 Technical Feasibility Prototype  
**Date:** September 2026  
**Objective:** Validate end-to-end data pipeline feasibility combining factory operational data, environmental airshed measurements, and geospatial terrain data to detect emission problem factors and recommend circular interventions.

---

## 1. What Data Was Successfully Obtained

1. **Ambient Criteria Air Pollutants (Worldwide Real-Time):**
   - Successfully integrated the open **Open-Meteo Air Quality API**, powered by the European **Copernicus Atmosphere Monitoring Service (CAMS)** model.
   - Continuous hourly measurements for **PM2.5, PM10, NO2, SO2, CO, and O3** without requiring commercial API keys or registration.
   - Exact observation timestamps and model source attribution are reliably retrieved.

2. **Global Terrain & Elevation Context:**
   - Successfully queried the **Open-Meteo Elevation API** (90m DEM) to extract elevation and compute terrain slope gradients.
   - Enables dispersion modeling and drainage basin vulnerability assessment.

3. **Factory Operational Activity:**
   - Multi-fuel direct energy consumption (diesel, natural gas, coal, heavy fuel oil).
   - Indirect electricity consumption with renewable self-generation percentage.
   - Process-level telemetry: temperature (°C), equipment type, operating hours, and existing pollution control mechanisms.
   - Solid waste streams, recycled fractions, and landfill disposition.

4. **Standardized Emission Factor Datasets:**
   - Extensible factor table (`emission_factors.csv`) incorporating verified coefficients from **IPCC (2019/2023)**, **DEFRA (2023)**, **US EPA eGRID (2023)**, and **Central Electricity Authority (CEA) India (2024)**.

---

## 2. What Data Could Not Be Obtained in Phase 1

1. **Direct Factory-Level Chimney Gas Plume Imagery:**
   - Public earth observation satellites (e.g. Sentinel-5P TROPOMI) have a spatial resolution of **3.5 km × 5.5 km per pixel**. This resolution measures total atmospheric columns across entire industrial parks or cities; it **cannot** isolate the individual stack or chimney of a specific factory.
   
2. **Sub-Meter Thermal Infrared Plumes:**
   - Satellite constellations that can resolve individual plant hot spots (e.g., GHGSat, Planet Labs SkySat) are proprietary commercial services requiring paid data subscriptions.

3. **Continuous Automated CEMS Sensor Streams:**
   - Direct Continuous Emission Monitoring System (CEMS) telemetry requires hardware-level industrial IoT protocol integration (OPC-UA / Modbus / MQTT) at the factory facility.

---

## 3. Dataset Size Considerations

- **Phase 1 Validation Dataset:** 120 batch records with 14 engineered features.
- **Feasibility Finding:** 
  - For unit-level operational accounting, a facility typically generates 12 monthly billing records or 250–365 daily shift logs per year.
  - While $N \approx 100 - 500$ is small for deep learning, it is **well suited** for statistical profiling, transparent regression baselines, and deterministic emission factor multiplication.

---

## 4. Important Features for Emission Leak Identification

Through feature importance ranking in our Data Laboratory experiments, the most predictive variables for total plant emission and leak vulnerability were:

1. **Thermal Fuel Consumption Rate (Natural Gas / Diesel)** ($\approx 48\%$ relative importance): Direct combustion is the primary Scope 1 driver.
2. **Process Exhaust Temperature & Lack of Abatement** ($\approx 22\%$ relative importance): Flue gas exiting $> 200^\circ\text{C}$ without waste-heat recovery (WHR) indicates thermodynamic loss.
3. **Grid Electricity Intensity Adjusted for Renewable %** ($\approx 15\%$ relative importance): Scope 2 carbon footprint.
4. **Distance to Sensitive Residential Receptors** ($< 2\text{ km}$): Critical weighting factor that amplifies human exposure risk.
5. **Solid Waste Landfill Discard Ratio**: Identifies lost material recovery opportunities.

---

## 5. Missing Values & Data Quality Strategy

- **Observation:** Real-world industrial and sensor logs frequently experience telemetry dropouts (e.g., unrecorded fuel batches or atmospheric sensor downtime).
- **Handling Strategy:**
  - Environmental API disconnects fall back gracefully to regional historical benchmark distributions, clearly labeled as `is_real: false`.
  - Numerical missing features are imputed using column medians rather than means to prevent outlier skew.
  - Fuel types without explicitly stated factors fall back to verified generic hydrocarbon combustion defaults.
  - **No artificial emissions are fabricated:** The system reports estimated uncertainty rather than inventing precise unverified telemetry.

---

## 6. Whether Satellite Data is Usable

- **Finding:** **YES for Environmental Context; NO for Direct Factory Leak Sensing.**
- Satellite data is highly usable and valuable for:
  1. Classifying surrounding land cover (industrial vs. agricultural vs. dense urban).
  2. Measuring vegetation buffer density via Normalized Difference Vegetation Index (NDVI).
  3. Proximity mapping to human settlements and natural waterways.
  4. Topographical slope and elevation modeling.
- **Critical Prototype Policy:** Presenting public satellite images as "real-time leak detectors" is scientifically incorrect and violates regulatory credibility. Using satellite data to calculate **receptor vulnerability and background airshed quality** is technically sound and defensible.

---

## 7. Whether Environmental Data is Usable

- **Finding:** **YES, Highly Usable.**
- Real-time criteria pollutants (PM2.5, PM10, NO2, SO2) from CAMS/Open-Meteo allow the system to evaluate whether the factory is operating within a **stressed airshed**.
- When ambient PM2.5 already exceeds $75\ \mu\text{g/m}^3$, combustion processes receive higher priority weighting in the problem-factor scoring algorithm.

---

## 8. Whether Machine Learning is Currently Justified

- **Finding:** **Interpretable Baselines ONLY; Neural Networks are NOT Justified.**
- In our Data Laboratory experiments:
  - **Linear Regression Baseline:** $R^2 \approx 0.78$, RMSE $\approx 3.8$
  - **Random Forest Regressor:** $R^2 \approx 0.85$, RMSE $\approx 2.9$
- **Why Neural Networks are Not Justified for Phase 1:**
  1. Tabular datasets with $< 10,000$ samples overfit rapidly in deep architectures.
  2. Environmental compliance requires auditable, deterministic calculations (GHG Protocol Scope 1 & 2 methodology).
  3. Stakeholders and operators require transparent "WHY" explanations for circular recommendations, which tree ensembles and rule systems provide cleanly.

---

## 9. Recommended Next Development Steps (Phase 2 Roadmap)

1. **Google Earth Engine (GEE) Production Connector:**
   - Authenticate with GEE service account credentials to extract Sentinel-2 multispectral surface reflectance and Copernicus Land Cover at 10m resolution.
2. **Factory IoT Stack Telemetry Gateway:**
   - Connect MQTT/OPC-UA listeners to capture real-time stack temperature and boiler flue gas oxygen levels.
3. **Regional Circular Symbiosis Matching Engine:**
   - Connect neighboring industrial facilities within the 5–15 km buffer to automate byproduct exchange (e.g., waste heat $\to$ district heating, sludge $\to$ cement kiln).
4. **Dynamic Grid Carbon Intensity Integration:**
   - Ingest hourly marginal grid emission factors to optimize equipment scheduling during green power availability peaks.
