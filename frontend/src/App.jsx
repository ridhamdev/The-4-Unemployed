import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';

// Factory Decision Platform Components (Part B)
import LandingPage from './components/factory/LandingPage';
import OnboardingWizard from './components/factory/OnboardingWizard';
import IndustrialGisMap from './components/factory/IndustrialGisMap';
import ExecutiveDashboard from './components/factory/ExecutiveDashboard';

// Internal ML Research Workbench Components (Part A)
import DatasetsAndQualityView from './components/workbench/DatasetsAndQualityView';
import ScientificModelComparison from './components/ScientificModelComparison';
import SpatialRiskHeatmap from './components/SpatialRiskHeatmap';
import GisValidationView from './components/workbench/GisValidationView';
import ModelRegistryAndDriftView from './components/workbench/ModelRegistryAndDriftView';

import { fetchScenario, runAnalysis } from './services/api';

const DEFAULT_FACTORY = {
  name: 'Apex PetroChem & Polymers Ltd',
  industry_type: 'Chemical & Specialty Polymers',
  location_name: 'Nandesari Industrial Estate, Vadodara, Gujarat',
  latitude: 22.4125,
  longitude: 73.0944,
  analysis_radius_km: 5.0,
  num_employees: 240,
  operating_hours_per_day: 24,
  operating_days_per_month: 26,
  energy: {
    electricity_kwh_month: 185000,
    electricity_source: 'Grid + Captive Solar',
    renewable_percentage: 15.0,
    diesel_liters_month: 3200,
    natural_gas_m3_month: 14000,
    other_fuel_name: 'None',
    other_fuel_consumption: 0
  },
  production: {
    main_product: 'Polymer Stabilizers & Resins',
    production_quantity_month: 1200,
    production_unit: 'Tonnes',
    raw_materials_used: 'Phthalic Anhydride, Methanol, Catalyst Acids',
    approximate_quantity_month: 1350,
    material_category: 'Petrochemical Feedstocks'
  },
  waste: {
    waste_generated_kg_month: 4800,
    waste_type: 'Chemical Sludge & Distillation Bottoms',
    treatment_method: 'Effluent Treatment Plant (ETP) & Secured Landfill',
    recycled_percentage: 25.0,
    waste_sent_to_landfill_kg: 3600
  },
  processes: [
    {
      process_name: 'Main Utility Steam Boiler (10 TPH)',
      energy_consumption_kwh: 12000,
      fuel_used: 'natural_gas',
      fuel_consumption: 9200,
      fuel_unit: 'm3',
      waste_generated_kg: 150,
      operating_hours_month: 624,
      temperature_c: 220,
      equipment_type: 'Water-Tube Industrial Boiler',
      pollution_control: 'Economizer Only'
    },
    {
      process_name: 'High-Temp Thermic Fluid Heater',
      energy_consumption_kwh: 8500,
      fuel_used: 'natural_gas',
      fuel_consumption: 4800,
      fuel_unit: 'm3',
      waste_generated_kg: 80,
      operating_hours_month: 520,
      temperature_c: 290,
      equipment_type: 'Coil-type Thermic Heater',
      pollution_control: 'None'
    },
    {
      process_name: 'Captive Diesel Generation (DG Set)',
      energy_consumption_kwh: 0,
      fuel_used: 'diesel',
      fuel_consumption: 3200,
      fuel_unit: 'L',
      waste_generated_kg: 320,
      operating_hours_month: 120,
      temperature_c: 420,
      equipment_type: '750 kVA Diesel Generator',
      pollution_control: 'Acoustic Enclosure Only'
    },
    {
      process_name: 'Vacuum Distillation & Solvent Stripping',
      energy_consumption_kwh: 55000,
      fuel_used: 'grid_electricity',
      fuel_consumption: 55000,
      fuel_unit: 'kWh',
      waste_generated_kg: 1450,
      operating_hours_month: 624,
      temperature_c: 115,
      equipment_type: 'Fractionation Column',
      pollution_control: 'Vent Condenser'
    },
    {
      process_name: 'Effluent Sludge Dewatering & Drying',
      energy_consumption_kwh: 22000,
      fuel_used: 'grid_electricity',
      fuel_consumption: 22000,
      fuel_unit: 'kWh',
      waste_generated_kg: 2800,
      operating_hours_month: 480,
      temperature_c: 85,
      equipment_type: 'Filter Press + Rotary Dryer',
      pollution_control: 'Packed Scrubber'
    }
  ]
};

export default function App() {
  const [appMode, setAppMode] = useState('factory'); // 'factory' vs 'workbench'
  const [activeTab, setActiveTab] = useState('home'); // factory: 'home', 'onboarding', 'map', 'dashboard' | wb: 'wb_datasets', 'wb_benchmark', 'wb_plume', 'wb_gis', 'wb_registry'
  const [factoryData, setFactoryData] = useState(DEFAULT_FACTORY);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4500);
  };

  // Run initial baseline analysis on mount so dashboard is immediately ready
  useEffect(() => {
    runSilentInitialAnalysis();
  }, []);

  const runSilentInitialAnalysis = async () => {
    try {
      const res = await runAnalysis(DEFAULT_FACTORY);
      setAnalysisResult(res);
    } catch (e) {
      console.warn('Silent analysis failed:', e);
    }
  };

  const handleLoadScenario = async (scenarioKey) => {
    setLoading(true);
    try {
      const scenario = await fetchScenario(scenarioKey);
      setFactoryData(scenario);
      showToast(`Loaded scenario: ${scenario.name}`);
      setActiveTab('onboarding');

      // Auto-analyze selected scenario
      const result = await runAnalysis(scenario);
      setAnalysisResult(result);
    } catch (err) {
      showToast(`Failed to load scenario: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAnalysis = async () => {
    setLoading(true);
    try {
      const payload = {
        name: factoryData.name,
        industry_type: factoryData.industry_type,
        location_name: factoryData.location_name,
        latitude: factoryData.latitude,
        longitude: factoryData.longitude,
        analysis_radius_km: factoryData.analysis_radius_km,
        num_employees: factoryData.num_employees,
        operating_hours_per_day: factoryData.operating_hours_per_day,
        operating_days_per_month: factoryData.operating_days_per_month,
        energy: factoryData.energy,
        production: factoryData.production,
        waste: factoryData.waste,
        processes: factoryData.processes
      };

      const result = await runAnalysis(payload);
      setAnalysisResult(result);
      setActiveTab('dashboard');
      showToast(`Analysis completed! Analysis ID: ${result.analysis_id}`);
    } catch (err) {
      showToast(`Analysis error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Navbar 
        appMode={appMode}
        setAppMode={setAppMode}
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onRunAnalysis={handleRunAnalysis}
        loading={loading}
      />

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: '#131b2e',
          color: '#fff',
          padding: '0.75rem 1.25rem',
          borderRadius: 8,
          border: '1px solid var(--primary)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          zIndex: 9999,
          fontSize: '0.85rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>⚡</span> {toast}
        </div>
      )}

      <main className="main-content" style={{ maxWidth: 1400, margin: '0 auto', padding: '1.5rem' }}>
        
        {/* ========================================================= */}
        {/* PART B — FACTORY DECISION PLATFORM VIEWS                  */}
        {/* ========================================================= */}
        {appMode === 'factory' && (
          <>
            {activeTab === 'home' && (
              <LandingPage 
                onStartAnalysis={() => setActiveTab('onboarding')}
                onLoadScenario={handleLoadScenario}
              />
            )}

            {activeTab === 'onboarding' && (
              <OnboardingWizard 
                factoryData={factoryData}
                setFactoryData={setFactoryData}
                onLoadScenario={handleLoadScenario}
                onRunAnalysis={handleRunAnalysis}
                loading={loading}
              />
            )}

            {activeTab === 'map' && (
              <IndustrialGisMap 
                factoryData={factoryData}
              />
            )}

            {activeTab === 'dashboard' && (
              <ExecutiveDashboard 
                analysisResult={analysisResult}
                factoryData={factoryData}
              />
            )}
          </>
        )}

        {/* ========================================================= */}
        {/* PART A — INTERNAL ML RESEARCH WORKBENCH VIEWS            */}
        {/* ========================================================= */}
        {appMode === 'workbench' && (
          <>
            {activeTab === 'wb_datasets' && (
              <DatasetsAndQualityView />
            )}

            {activeTab === 'wb_benchmark' && (
              <ScientificModelComparison />
            )}

            {activeTab === 'wb_plume' && (
              <SpatialRiskHeatmap 
                factoryData={factoryData}
              />
            )}

            {activeTab === 'wb_gis' && (
              <GisValidationView />
            )}

            {activeTab === 'wb_registry' && (
              <ModelRegistryAndDriftView />
            )}
          </>
        )}

      </main>
    </div>
  );
}
