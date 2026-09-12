from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ProcessBase(BaseModel):
    process_name: str
    energy_consumption_kwh: float = 0.0
    fuel_used: str = "none"
    fuel_consumption: float = 0.0
    fuel_unit: str = "unit"
    material_consumed: Optional[str] = ""
    waste_generated_kg: float = 0.0
    operating_hours_month: float = 0.0
    temperature_c: float = 0.0
    equipment_type: Optional[str] = ""
    pollution_control: Optional[str] = "None"

class ProcessCreate(ProcessBase):
    pass

class ProcessResponse(ProcessBase):
    id: int
    factory_id: int
    class Config:
        from_attributes = True

class EnergyInput(BaseModel):
    electricity_kwh_month: float = 0.0
    electricity_source: str = "Grid"
    renewable_percentage: float = 0.0
    diesel_liters_month: float = 0.0
    natural_gas_m3_month: float = 0.0
    other_fuel_name: str = "None"
    other_fuel_consumption: float = 0.0

class ProductionInput(BaseModel):
    main_product: str = ""
    production_quantity_month: float = 1.0
    production_unit: str = "Tonnes"
    raw_materials_used: str = ""
    approximate_quantity_month: float = 0.0
    material_category: str = ""

class WasteInput(BaseModel):
    waste_generated_kg_month: float = 0.0
    waste_type: str = ""
    treatment_method: str = ""
    recycled_percentage: float = 0.0
    waste_sent_to_landfill_kg: float = 0.0

class LocationInput(BaseModel):
    latitude: float
    longitude: float
    location_name: Optional[str] = ""
    analysis_radius_km: Optional[float] = 5.0

class FactoryCreate(BaseModel):
    name: str
    industry_type: str
    location_name: str
    latitude: float
    longitude: float
    analysis_radius_km: float = 5.0
    num_employees: int = 100
    operating_hours_per_day: float = 24.0
    operating_days_per_month: float = 26.0
    energy: Optional[EnergyInput] = None
    production: Optional[ProductionInput] = None
    waste: Optional[WasteInput] = None
    processes: List[ProcessCreate] = []

class EnvironmentalDataSchema(BaseModel):
    pm25: float
    pm10: float
    no2: float
    so2: float
    co: float
    o3: float
    source: str
    timestamp: str
    is_real: bool

class GeospatialDataSchema(BaseModel):
    elevation_m: float
    slope_deg: float
    land_cover: str
    dist_to_water_km: float
    dist_to_residential_km: float
    vegetation_ndvi_proxy: float
    source: str
    timestamp: str
    is_real: bool

class ProblemFactorItem(BaseModel):
    factor_name: str
    category: str
    contribution_pct: float
    problem_score: float
    severity: str
    why_explanation: str
    raw_value: float
    unit: str

class RecommendationItem(BaseModel):
    problem: str
    proposed_intervention: str
    co2_reduction_range: str
    cost_category: str
    difficulty: str
    expected_benefit: str
    reason: str

class AnalysisResponse(BaseModel):
    analysis_id: int
    factory_id: int
    factory_name: str
    total_co2e_tonnes: float
    scope1_direct_co2e_tonnes: float
    scope2_indirect_co2e_tonnes: float
    co2e_per_production_unit: float
    production_unit: str
    major_emission_source: str
    composite_risk_score: float
    problem_factors: List[ProblemFactorItem]
    recommendations: List[RecommendationItem]
    environmental_data: Optional[EnvironmentalDataSchema] = None
    geospatial_data: Optional[GeospatialDataSchema] = None
    emission_factors_used: List[Dict[str, Any]] = []
    created_at: str

class DataLabOverview(BaseModel):
    dataset_id: str
    filename: str
    rows_count: int
    cols_count: int
    columns: List[str]
    missing_values: Dict[str, int]
    missing_percentages: Dict[str, float]
    summary_stats: Dict[str, Dict[str, float]]
    preview_head: List[Dict[str, Any]]

class DataLabTrainRequest(BaseModel):
    target_column: str
    feature_columns: List[str]
    test_size: float = 0.2

class DataLabTrainResponse(BaseModel):
    model_types: List[str]
    linear_regression_metrics: Dict[str, float]
    random_forest_metrics: Dict[str, float]
    feature_importances: List[Dict[str, Any]]
    sample_predictions: List[Dict[str, Any]]
    ml_vs_rules_verdict: str
