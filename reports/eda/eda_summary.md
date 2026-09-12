# Exploratory Data Analysis (EDA) Report

**Generated:** September 2026  
**Dataset:** Master Spatial-Temporal Industrial Airshed Dataset  
**Geographical Focus:** Vadodara/Nandesari Chemical Hub (22.4125°N, 73.0944°E)  
**Time Horizon:** 2023-01-01 to 2024-12-31 (731 daily observations)

---

## 1. Dataset Dimensions & Completeness
- **Total Observations:** 731 days
- **Total Features:** 67 variables
- **Duplicate Records:** 0
- **Missing Values:** 0 columns with nulls (Zero missing values; fully complete)

---

## 2. Statistical Distributions of Key Features

| Feature | Mean | Std Dev | Min | Median | Max |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **no2** | 19.44 | 12.2 | 4.65 | 15.83 | 77.93 |
| **so2** | 11.87 | 5.02 | 3.52 | 10.78 | 33.41 |
| **co** | 388.71 | 187.7 | 118.92 | 384.88 | 1218.08 |
| **pm25** | 31.27 | 16.99 | 8.04 | 28.12 | 108.89 |
| **pm10** | 50.84 | 21.9 | 11.11 | 47.9 | 128.28 |
| **temperature_c** | 27.43 | 4.23 | 17.4 | 27.6 | 38.2 |
| **relative_humidity_pct** | 58.82 | 20.38 | 16.0 | 57.0 | 95.0 |
| **wind_speed_ms** | 4.3 | 1.48 | 1.69 | 4.03 | 12.14 |
| **wind_u** | 1.38 | 2.84 | -4.81 | 2.08 | 9.75 |
| **wind_v** | 0.44 | 3.25 | -10.58 | -0.14 | 11.67 |
| **ndvi** | 0.19 | 0.08 | 0.14 | 0.14 | 0.31 |
| **ndbi** | 0.07 | 0.08 | -0.05 | 0.12 | 0.12 |
| **ndwi** | -0.29 | 0.07 | -0.4 | -0.24 | -0.24 |
| **production_tonnes** | 44.94 | 9.72 | 5.0 | 46.7 | 63.4 |
| **natural_gas_m3** | 531.19 | 120.99 | 80.0 | 551.3 | 822.07 |
| **electricity_kwh** | 6819.84 | 1487.62 | 1200.0 | 7086.0 | 9706.0 |
| **diesel_litres** | 36.61 | 94.03 | 0.0 | 0.0 | 532.8 |
| **energy_intensity_mwh_per_tonne** | 0.31 | 0.18 | 0.25 | 0.28 | 1.31 |
| **calculated_total_co2e_tonnes** | 5.33 | 1.03 | 2.1 | 5.48 | 7.84 |
| **environmental_risk_score** | 28.35 | 12.27 | 8.4 | 26.1 | 82.7 |

---

## 3. Key Exploratory Findings

1. **Seasonal Inversion & Thermal Dynamics:**
   - NO2 and PM2.5 concentrations show marked peaks during winter months (November to February) due to nocturnal boundary-layer height suppression and lower atmospheric ventilation.
   - Monsoon periods (July to September) demonstrate substantial particulate scavenging and higher relative humidity (~78%).

2. **Wind Direction Advection (u, v vectors):**
   - Dominant southwesterly winds transport plumes toward the northeastern residential receptor zone (Nandesari township), explaining higher risk scores under positive $u$ and $v$ regimes.

3. **Operational Coupling vs Leaks:**
   - Natural gas consumption correlates strongly with daily output, but isolated decoupling events (e.g. Day 110–118 steam passing leak) demonstrate high fuel consumption with static production, presenting prime anomaly detection signals.

---

## 4. Generated Plots
- `temporal_pollutant_trends.png`: NO2, SO2, PM2.5, CO multi-year trends and 7-day moving averages.
- `bivariate_relationships.png`: Scatter and regression relationships between pollution, weather, and operations.
- `correlation_matrix.png`: Full Pearson correlation matrix.
- `wind_vector_dispersion.png`: Atmospheric NO2 dispersion vs continuous wind components ($u, v$).
