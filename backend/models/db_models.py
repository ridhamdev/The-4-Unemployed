import datetime
from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from backend.database.database import Base

class Factory(Base):
    __tablename__ = "factories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    industry_type = Column(String(100), nullable=False)
    location_name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    analysis_radius_km = Column(Float, default=5.0)
    num_employees = Column(Integer, default=100)
    operating_hours_per_day = Column(Float, default=24.0)
    operating_days_per_month = Column(Float, default=26.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    processes = relationship("Process", back_populates="factory", cascade="all, delete-orphan")
    energy = relationship("EnergyConsumption", back_populates="factory", uselist=False, cascade="all, delete-orphan")
    production = relationship("ProductionInfo", back_populates="factory", uselist=False, cascade="all, delete-orphan")
    waste = relationship("WasteRecord", back_populates="factory", uselist=False, cascade="all, delete-orphan")
    environmental_data = relationship("EnvironmentalData", back_populates="factory", cascade="all, delete-orphan")
    geospatial_data = relationship("GeospatialData", back_populates="factory", cascade="all, delete-orphan")
    analyses = relationship("AnalysisResult", back_populates="factory", cascade="all, delete-orphan")

class Process(Base):
    __tablename__ = "processes"

    id = Column(Integer, primary_key=True, index=True)
    factory_id = Column(Integer, ForeignKey("factories.id"), nullable=False)
    process_name = Column(String(150), nullable=False)
    energy_consumption_kwh = Column(Float, default=0.0)
    fuel_used = Column(String(100), default="none")
    fuel_consumption = Column(Float, default=0.0)
    fuel_unit = Column(String(50), default="unit")
    material_consumed = Column(String(255), default="")
    waste_generated_kg = Column(Float, default=0.0)
    operating_hours_month = Column(Float, default=0.0)
    temperature_c = Column(Float, default=0.0)
    equipment_type = Column(String(150), default="")
    pollution_control = Column(String(255), default="None")

    factory = relationship("Factory", back_populates="processes")

class EnergyConsumption(Base):
    __tablename__ = "energy_consumption"

    id = Column(Integer, primary_key=True, index=True)
    factory_id = Column(Integer, ForeignKey("factories.id"), nullable=False)
    electricity_kwh_month = Column(Float, default=0.0)
    electricity_source = Column(String(100), default="Grid")
    renewable_percentage = Column(Float, default=0.0)
    diesel_liters_month = Column(Float, default=0.0)
    natural_gas_m3_month = Column(Float, default=0.0)
    other_fuel_name = Column(String(100), default="None")
    other_fuel_consumption = Column(Float, default=0.0)

    factory = relationship("Factory", back_populates="energy")

class ProductionInfo(Base):
    __tablename__ = "production_info"

    id = Column(Integer, primary_key=True, index=True)
    factory_id = Column(Integer, ForeignKey("factories.id"), nullable=False)
    main_product = Column(String(200), default="")
    production_quantity_month = Column(Float, default=0.0)
    production_unit = Column(String(50), default="Tonnes")
    raw_materials_used = Column(Text, default="")
    approximate_quantity_month = Column(Float, default=0.0)
    material_category = Column(String(150), default="")

    factory = relationship("Factory", back_populates="production")

class WasteRecord(Base):
    __tablename__ = "waste_records"

    id = Column(Integer, primary_key=True, index=True)
    factory_id = Column(Integer, ForeignKey("factories.id"), nullable=False)
    waste_generated_kg_month = Column(Float, default=0.0)
    waste_type = Column(String(150), default="")
    treatment_method = Column(String(200), default="")
    recycled_percentage = Column(Float, default=0.0)
    waste_sent_to_landfill_kg = Column(Float, default=0.0)

    factory = relationship("Factory", back_populates="waste")

class EnvironmentalData(Base):
    __tablename__ = "environmental_data"

    id = Column(Integer, primary_key=True, index=True)
    factory_id = Column(Integer, ForeignKey("factories.id"), nullable=False)
    pm25 = Column(Float, default=0.0)
    pm10 = Column(Float, default=0.0)
    no2 = Column(Float, default=0.0)
    so2 = Column(Float, default=0.0)
    co = Column(Float, default=0.0)
    o3 = Column(Float, default=0.0)
    source = Column(String(150), default="Open-Meteo Air Quality / CAMS")
    timestamp = Column(String(100), default="")
    is_real = Column(Boolean, default=True)

    factory = relationship("Factory", back_populates="environmental_data")

class GeospatialData(Base):
    __tablename__ = "geospatial_data"

    id = Column(Integer, primary_key=True, index=True)
    factory_id = Column(Integer, ForeignKey("factories.id"), nullable=False)
    elevation_m = Column(Float, default=0.0)
    slope_deg = Column(Float, default=0.0)
    land_cover = Column(String(100), default="Industrial / Mixed Built-up")
    dist_to_water_km = Column(Float, default=3.5)
    dist_to_residential_km = Column(Float, default=2.1)
    vegetation_ndvi_proxy = Column(Float, default=0.18)
    source = Column(String(150), default="Open-Meteo Elevation & Geospatial Service")
    timestamp = Column(String(100), default="")
    is_real = Column(Boolean, default=True)

    factory = relationship("Factory", back_populates="geospatial_data")

class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    factory_id = Column(Integer, ForeignKey("factories.id"), nullable=False)
    total_co2e_tonnes = Column(Float, default=0.0)
    scope1_direct_co2e_tonnes = Column(Float, default=0.0)
    scope2_indirect_co2e_tonnes = Column(Float, default=0.0)
    co2e_per_production_unit = Column(Float, default=0.0)
    major_emission_source = Column(String(200), default="")
    composite_risk_score = Column(Float, default=0.0)
    problem_factors_json = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    factory = relationship("Factory", back_populates="analyses")
    recommendations = relationship("Recommendation", back_populates="analysis", cascade="all, delete-orphan")

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analysis_results.id"), nullable=False)
    problem = Column(String(255), nullable=False)
    proposed_intervention = Column(String(255), nullable=False)
    co2_reduction_range = Column(String(100), default="")
    cost_category = Column(String(50), default="Medium")
    difficulty = Column(String(50), default="Medium")
    expected_benefit = Column(Text, default="")
    reason = Column(Text, default="")

    analysis = relationship("AnalysisResult", back_populates="recommendations")

class DatasetRecord(Base):
    __tablename__ = "datasets"

    id = Column(String(64), primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    rows_count = Column(Integer, default=0)
    cols_count = Column(Integer, default=0)
    summary_json = Column(JSON, default=dict)
    file_path = Column(String(500), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
