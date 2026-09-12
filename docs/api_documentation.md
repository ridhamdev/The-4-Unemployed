# API Documentation: Industrial Emission Leak-Point Detector & Circular Alternative Recommender

Backend framework: **FastAPI 0.115+**  
Interactive Swagger UI: `http://localhost:8000/docs`  
Interactive ReDoc: `http://localhost:8000/redoc`

---

## 1. System Endpoints

### `GET /`
Returns system metadata, project title, and phase status.

### `GET /api/health`
Health check verifying SQLite database connectivity and service availability.
- **Response:**
  ```json
  {
    "status": "healthy",
    "database": "sqlite_connected",
    "version": "1.0.0"
  }
  ```

---

## 2. Factory Profile Endpoints

### `GET /api/factory/demo/load`
Prepopulates a realistic Chemical & Polymer Manufacturing plant with 5 unit processes (boiler, heater, generator, column, dryer).

### `POST /api/factory`
Creates a new factory profile and associated energy, waste, and process records.
- **Request Body:** `FactoryCreate` (name, industry_type, location_name, latitude, longitude, analysis_radius_km, energy, production, waste, processes)
- **Response:**
  ```json
  {
    "message": "Factory profile created successfully",
    "factory_id": 1,
    "name": "Apex PetroChem & Polymers Ltd"
  }
  ```

### `GET /api/factories`
Returns a list of all persisted factory profiles in SQLite.

### `GET /api/factory/{id}`
Returns complete profile, operational energy metrics, waste disposition, and processes for the given factory ID.

### `POST /api/processes`
Appends additional unit processes to an existing factory.
- **Query Params:** `factory_id: int`
- **Request Body:** Array of `ProcessCreate`

### `POST /api/location`
Updates latitude, longitude, and analysis radius for a factory.

---

## 3. Environmental & Geospatial Endpoints

### `GET /api/environment/live`
Fetches real-time ambient criteria air pollutants from the **Open-Meteo Air Quality API** (backed by Copernicus CAMS models) and terrain elevation/slope from the **Open-Meteo Elevation API**.
- **Query Parameters:**
  - `latitude` (float, required): Factory latitude (e.g. 22.4125)
  - `longitude` (float, required): Factory longitude (e.g. 73.0944)
  - `radius_km` (float, optional, default: 5.0): Analysis territory buffer
- **Response:**
  ```json
  {
    "environmental": {
      "pm25": 64.2,
      "pm10": 112.0,
      "no2": 38.5,
      "so2": 24.1,
      "co": 480.0,
      "o3": 54.0,
      "source": "Live Open-Meteo API (Copernicus CAMS Model)",
      "timestamp": "2026-09-11T17:30",
      "is_real": true
    },
    "geospatial": {
      "latitude": 22.4125,
      "longitude": 73.0944,
      "radius_km": 5.0,
      "elevation_m": 38.5,
      "slope_deg": 1.8,
      "land_cover": "Industrial / Mixed Built-up",
      "vegetation_ndvi_proxy": 0.19,
      "dist_to_water_km": 2.4,
      "dist_to_residential_km": 1.8,
      "source": "Open-Meteo Elevation & Geospatial Benchmark",
      "timestamp": "2026-09-11 17:30:00 UTC",
      "is_real": true
    }
  }
  ```

### `POST /api/environment/upload`
Uploads a CSV file containing localized environmental telemetry.

---

## 4. Analysis & Recommendation Endpoints

### `POST /api/analyze`
Executes the core multi-stage pipeline:
1. Gathers operational factory data.
2. Ingests ambient airshed and terrain metrics.
3. Fuses features into an analysis-ready dataset.
4. Calculates Scope 1 and Scope 2 estimated emissions using `emission_factors.csv`.
5. Computes transparent 0–100 problem scores for all equipment and waste streams.
6. Triggers circular economy recommendations.
7. Persists analysis results and recommendations into SQLite.
- **Request Body:** FactoryCreate payload OR `{ "factory_id": int }`
- **Response:** `AnalysisResponse` (total_co2e_tonnes, problem_factors, recommendations, environmental_data, geospatial_data, emission_factors_used).

### `GET /api/analysis/{id}`
Fetches historical analysis record and recommendations.

### `GET /api/recommendations/{factory_id}`
Returns the most recent recommendations generated for a given factory.

---

## 5. Data Laboratory Endpoints

### `GET /api/dataset/sample/load`
Ingests the pre-packaged 120-row industrial batch dataset into the Data Laboratory for instant statistical inspection.

### `POST /api/dataset/upload`
Uploads an external CSV dataset (satellite, environmental, or operational). Computes missing value counts, percentages, and summary statistics.

### `GET /api/dataset/{id}`
Returns metadata, column list, and summary stats for an uploaded dataset.

### `POST /api/dataset/{id}/train_baseline`
Trains an interpretable **Linear Regression** model and a non-linear **Random Forest Regressor** on user-selected target and feature columns.
- **Request Body:**
  ```json
  {
    "target_column": "co2_emissions_tonnes",
    "feature_columns": ["production_tonnes", "natural_gas_m3", "electricity_kwh", "diesel_liters"],
    "test_size": 0.2
  }
  ```
- **Response:**
  - `linear_regression_metrics`: Train/Test R², Test RMSE, Test MAE
  - `random_forest_metrics`: Train/Test R², Test RMSE, Test MAE
  - `feature_importances`: Ranked array of predictive drivers
  - `sample_predictions`: Actual vs predicted comparison table
  - `ml_vs_rules_verdict`: Technical assessment of ML vs physical calculations.
