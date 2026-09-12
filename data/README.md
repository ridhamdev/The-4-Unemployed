# Scientific Data Documentation & Versioning

This directory maintains the multi-source scientific dataset powering the **Industrial Emission Leak-Point Detector & Circular Alternative Recommender**.

In accordance with scientific integrity guidelines:
- **No data fabrication**: Atmospheric, meteorological, and geospatial values represent actual public earth observation and atmospheric monitoring measurements.
- **Strict category labeling**: Every record traces its origin (`OBSERVED_GROUND`, `SATELLITE_DERIVED`, `FACTORY_OPERATIONAL`, `CALCULATED_STOICHIOMETRIC`, `MODEL_PREDICTED`).
- **Raw Data Immutability**: Raw datasets in `data/raw/` are never overwritten.

---

## 1. Directory Structure

```
data/
├── raw/
│   ├── satellite_s5p/       # Sentinel-5P TROPOMI L3 atmospheric column products
│   ├── satellite_s2/        # Sentinel-2 Harmonized surface reflectance & cloud mask
│   ├── weather/             # Historical ERA5 meteorological reanalysis
│   ├── ground_monitoring/   # CPCB / CAAQMS continuous ambient ground station records
│   └── factory/             # Real industrial facility operational batch time-series
├── interim/                 # Harmonized, cloud-filtered, unit-aligned intermediate files
├── processed/               # Feature-engineered spatial-temporal master datasets
└── README.md                # Provenance and metadata
```

---

## 2. Dataset Metadata & Sources

### A. Sentinel-5P / TROPOMI Atmospheric Data
- **Source Collections:**
  - `COPERNICUS/S5P/OFFL/L3_NO2`: Tropospheric NO2 vertical column density ($mol/m^2$)
  - `COPERNICUS/S5P/OFFL/L3_SO2`: Total SO2 vertical column density ($mol/m^2$)
  - `COPERNICUS/S5P/OFFL/L3_CO`: Carbon monoxide total column density ($mol/m^2$)
  - Copernicus European Atmosphere Monitoring Service (CAMS) TROPOMI multi-sensor assimilation
- **Instrument Spatial Resolution:** $3.5\text{ km} \times 5.5\text{ km}$ (binned to regular spatial analysis cells)
- **Temporal Frequency:** Daily overpass (early afternoon local solar time)
- **Quality Filtering:** Cloud fraction $\le 0.3$, QA value $\ge 0.5$

### B. Sentinel-2 MSI Surface Reflectance
- **Source Collection:** `COPERNICUS/S2_SR_HARMONIZED`
- **Cloud Masking:** `COPERNICUS/S2_CLOUD_PROBABILITY` (probability threshold $< 40$)
- **Spectral Bands:**
  - B2 (Blue, 490 nm, 10m)
  - B3 (Green, 560 nm, 10m)
  - B4 (Red, 665 nm, 10m)
  - B8 (Near-Infrared / NIR, 842 nm, 10m)
  - B11 (Shortwave-Infrared / SWIR-1, 1610 nm, 20m)
  - B12 (Shortwave-Infrared / SWIR-2, 2190 nm, 20m)
- **Derived Indices:**
  $$\text{NDVI} = \frac{B8 - B4}{B8 + B4} \quad (\text{Vegetation buffer})$$
  $$\text{NDBI} = \frac{B11 - B8}{B11 + B8} \quad (\text{Built-up / industrial density})$$
  $$\text{NDWI} = \frac{B3 - B8}{B3 + B8} \quad (\text{Surface moisture / water receptor})$$

### C. Meteorology (ERA5 Reanalysis / ECMWF)
- **Source:** Open-Meteo Historical Weather API (ERA5 Reanalysis model)
- **Parameters:**
  - `temperature_2m_mean` (°C)
  - `relative_humidity_2m_mean` (%)
  - `precipitation_sum` (mm)
  - `surface_pressure_mean` (hPa)
  - `wind_speed_10m_max` (km/h converted to m/s)
  - `wind_direction_10m_dominant` (degrees)
- **Continuous Wind Vector Decomposition:**
  $$\text{wind\_u} = -s \cdot \sin\left(\frac{\theta \cdot \pi}{180}\right), \quad \text{wind\_v} = -s \cdot \cos\left(\frac{\theta \cdot \pi}{180}\right)$$

### D. Ground Air Quality Monitoring
- **Source:** Central Pollution Control Board (CPCB) Continuous Ambient Air Quality Monitoring Stations (CAAQMS)
- **Station Location:** Industrial Chemical Belt (Vadodara / Nandesari / Ahmedabad)
- **Monitored Variables:** PM2.5 ($\mu g/m^3$), PM10 ($\mu g/m^3$), NO2 ($\mu g/m^3$), SO2 ($\mu g/m^3$), CO ($\mu g/m^3$), O3 ($\mu g/m^3$)

### E. Factory Operational Data
- **Fields:** `factory_id`, `date`, `process`, `electricity_kwh`, `diesel_litres`, `natural_gas_m3`, `production_tonnes`, `raw_material_tonnes`, `waste_tonnes`, `recycled_tonnes`, `operating_hours`
- **Target Attribution:** Explicitly labeled as `ENVIRONMENTAL RISK / POLLUTION INDICATOR` when modeling ambient conditions, and `FACILITY EMISSION INTENSITY` when modeling factory direct outputs.
