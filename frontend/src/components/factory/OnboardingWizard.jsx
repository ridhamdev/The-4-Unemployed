import React, { useState } from 'react';
import { 
  Building2, 
  Zap, 
  Flame, 
  Layers, 
  Trash2, 
  ShieldCheck, 
  PlayCircle, 
  Plus, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function OnboardingWizard({ 
  factoryData, 
  setFactoryData, 
  onLoadScenario, 
  onRunAnalysis, 
  loading 
}) {
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    { num: 1, label: 'Profile', icon: Building2 },
    { num: 2, label: 'Energy & Fuels', icon: Zap },
    { num: 3, label: 'Processes', icon: Flame },
    { num: 4, label: 'Materials', icon: Layers },
    { num: 5, label: 'Waste Streams', icon: Trash2 },
    { num: 6, label: 'Existing Controls', icon: ShieldCheck }
  ];

  const updateFactory = (field, value) => {
    setFactoryData(prev => ({ ...prev, [field]: value }));
  };

  const updateEnergy = (field, value) => {
    setFactoryData(prev => ({
      ...prev,
      energy: { ...prev.energy, [field]: value }
    }));
  };

  const updateProduction = (field, value) => {
    setFactoryData(prev => ({
      ...prev,
      production: { ...prev.production, [field]: value }
    }));
  };

  const updateWaste = (field, value) => {
    setFactoryData(prev => ({
      ...prev,
      waste: { ...prev.waste, [field]: value }
    }));
  };

  const addProcess = () => {
    const newProc = {
      process_name: 'New Process Unit',
      equipment_type: 'Industrial Equipment',
      energy_consumption_kwh: 5000,
      fuel_used: 'natural_gas',
      fuel_consumption: 1000,
      fuel_unit: 'm3',
      waste_generated_kg: 100,
      operating_hours_month: 500,
      temperature_c: 120,
      pollution_control: 'None'
    };
    setFactoryData(prev => ({
      ...prev,
      processes: [...(prev.processes || []), newProc]
    }));
  };

  const removeProcess = (idx) => {
    setFactoryData(prev => ({
      ...prev,
      processes: prev.processes.filter((_, i) => i !== idx)
    }));
  };

  const updateProcessItem = (idx, field, val) => {
    setFactoryData(prev => {
      const updated = [...prev.processes];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...prev, processes: updated };
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>
      
      {/* 1-Click Scenario Quick-Loaders */}
      <div className="card" style={{ padding: '1rem 1.25rem', background: '#090d16', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={16} color="var(--primary)" />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
              Quick-Load Industrial Scenarios:
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={() => onLoadScenario('textile_surat')}
              disabled={loading}
              style={{ borderColor: '#06b6d4', color: '#67e8f9' }}
            >
              🧵 Surat Textile Mills
            </button>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={() => onLoadScenario('food_anand')}
              disabled={loading}
              style={{ borderColor: '#10b981', color: '#6ee7b7' }}
            >
              🥛 Anand Dairy Agro-Foods
            </button>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={() => onLoadScenario('chemical_nandesari')}
              disabled={loading}
              style={{ borderColor: '#8b5cf6', color: '#c4b5fd' }}
            >
              🧪 Vadodara Chemical Complex
            </button>
          </div>
        </div>
      </div>

      {/* Step Wizard Nav */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {steps.map(s => {
          const Icon = s.icon;
          const isActive = currentStep === s.num;
          return (
            <button
              key={s.num}
              type="button"
              onClick={() => setCurrentStep(s.num)}
              style={{
                flex: 1,
                minWidth: 140,
                padding: '0.75rem 1rem',
                borderRadius: 8,
                background: isActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.03)',
                border: isActive ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.06)',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                fontWeight: 600,
                fontSize: '0.82rem',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={16} color={isActive ? 'var(--primary)' : 'currentColor'} />
              <span>Step {s.num}: {s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Form Content Card */}
      <div className="card" style={{ padding: '1.75rem' }}>
        
        {/* STEP 1: Factory Profile */}
        {currentStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              Step 1 — Factory Identification & Location
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Factory / Facility Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={factoryData.name || ''} 
                  onChange={(e) => updateFactory('name', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Industrial Sector</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={factoryData.industry_type || ''} 
                  onChange={(e) => updateFactory('industry_type', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Industrial Cluster / Location Address</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={factoryData.location_name || ''} 
                  onChange={(e) => updateFactory('location_name', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Coordinates (Latitude, Longitude)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="number" 
                    step="0.0001"
                    className="form-input" 
                    value={factoryData.latitude || 22.4125} 
                    onChange={(e) => updateFactory('latitude', parseFloat(e.target.value))}
                  />
                  <input 
                    type="number" 
                    step="0.0001"
                    className="form-input" 
                    value={factoryData.longitude || 73.0944} 
                    onChange={(e) => updateFactory('longitude', parseFloat(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Main Product</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={factoryData.production?.main_product || ''} 
                  onChange={(e) => updateProduction('main_product', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Monthly Production Output (Tonnes)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={factoryData.production?.production_quantity_month || 1000} 
                  onChange={(e) => updateProduction('production_quantity_month', parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Energy & Fuels */}
        {currentStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              Step 2 — Monthly Energy & Fuel Consumption
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Grid Electricity (kWh / month)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={factoryData.energy?.electricity_kwh_month || 0} 
                  onChange={(e) => updateEnergy('electricity_kwh_month', parseFloat(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Renewable Energy Share (%)</label>
                <input 
                  type="number" 
                  min="0"
                  max="100"
                  className="form-input" 
                  value={factoryData.energy?.renewable_percentage || 0} 
                  onChange={(e) => updateEnergy('renewable_percentage', parseFloat(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Natural Gas (m³ / month)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={factoryData.energy?.natural_gas_m3_month || 0} 
                  onChange={(e) => updateEnergy('natural_gas_m3_month', parseFloat(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Diesel Fuel for DG Sets (Liters / month)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={factoryData.energy?.diesel_liters_month || 0} 
                  onChange={(e) => updateEnergy('diesel_liters_month', parseFloat(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Other Fuel Name (Coal, Biomass, HFO)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={factoryData.energy?.other_fuel_name || 'None'} 
                  onChange={(e) => updateEnergy('other_fuel_name', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Other Fuel Monthly Quantity (Tonnes)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={factoryData.energy?.other_fuel_consumption || 0} 
                  onChange={(e) => updateEnergy('other_fuel_consumption', parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Processes */}
        {currentStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Step 3 — Operational Unit Processes & Equipment
              </h3>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={addProcess}
              >
                <Plus size={14} /> Add Process Unit
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {(factoryData.processes || []).map((proc, idx) => (
                <div key={idx} style={{
                  background: '#090d16',
                  padding: '1rem',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 1fr 1fr 1fr auto',
                  gap: '0.75rem',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>PROCESS NAME</div>
                    <input 
                      type="text"
                      className="form-input"
                      style={{ padding: '5px 8px', fontSize: '0.8rem' }}
                      value={proc.process_name}
                      onChange={(e) => updateProcessItem(idx, 'process_name', e.target.value)}
                    />
                  </div>

                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>EQUIPMENT TYPE</div>
                    <input 
                      type="text"
                      className="form-input"
                      style={{ padding: '5px 8px', fontSize: '0.8rem' }}
                      value={proc.equipment_type || ''}
                      onChange={(e) => updateProcessItem(idx, 'equipment_type', e.target.value)}
                    />
                  </div>

                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>TEMPERATURE (°C)</div>
                    <input 
                      type="number"
                      className="form-input"
                      style={{ padding: '5px 8px', fontSize: '0.8rem' }}
                      value={proc.temperature_c || 100}
                      onChange={(e) => updateProcessItem(idx, 'temperature_c', parseFloat(e.target.value))}
                    />
                  </div>

                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>FUEL USED</div>
                    <input 
                      type="text"
                      className="form-input"
                      style={{ padding: '5px 8px', fontSize: '0.8rem' }}
                      value={proc.fuel_used || 'natural_gas'}
                      onChange={(e) => updateProcessItem(idx, 'fuel_used', e.target.value)}
                    />
                  </div>

                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm"
                    style={{ color: '#ef4444', borderColor: '#ef4444', marginTop: 14 }}
                    onClick={() => removeProcess(idx)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: Materials */}
        {currentStep === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              Step 4 — Raw Materials & Feedstocks
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Primary Raw Materials Used</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={factoryData.production?.raw_materials_used || ''} 
                  onChange={(e) => updateProduction('raw_materials_used', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Approximate Monthly Feedstock Quantity (Tonnes)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={factoryData.production?.approximate_quantity_month || 1200} 
                  onChange={(e) => updateProduction('approximate_quantity_month', parseFloat(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Material Category</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={factoryData.production?.material_category || 'Industrial Feedstocks'} 
                  onChange={(e) => updateProduction('material_category', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Waste */}
        {currentStep === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              Step 5 — Solid & Effluent Waste Streams
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Primary Waste Byproduct Type</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={factoryData.waste?.waste_type || 'Industrial Sludge'} 
                  onChange={(e) => updateWaste('waste_type', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Waste Generated (kg / month)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={factoryData.waste?.waste_generated_kg_month || 5000} 
                  onChange={(e) => updateWaste('waste_generated_kg_month', parseFloat(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Current Recycled / Diverted Share (%)</label>
                <input 
                  type="number" 
                  min="0"
                  max="100"
                  className="form-input" 
                  value={factoryData.waste?.recycled_percentage || 20} 
                  onChange={(e) => updateWaste('recycled_percentage', parseFloat(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Waste Treatment / Disposal Method</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={factoryData.waste?.treatment_method || 'ETP + Landfill'} 
                  onChange={(e) => updateWaste('treatment_method', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: Existing Controls */}
        {currentStep === 6 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              Step 6 — Existing Pollution Controls & Recovery
            </h3>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Document existing abatement devices (scrubbers, economizers, baghouses) to calibrate circular recommendations.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Boiler / Thermal Abatement</label>
                <input 
                  type="text" 
                  className="form-input" 
                  defaultValue="Cyclone / Economizer Preheater"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Effluent / Wastewater Treatment</label>
                <input 
                  type="text" 
                  className="form-input" 
                  defaultValue="Primary + Secondary Biological ETP"
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation & Run Button Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '1.75rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div>
            {currentStep > 1 && (
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={() => setCurrentStep(prev => prev - 1)}
              >
                ← Back: Step {currentStep - 1}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {currentStep < 6 ? (
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setCurrentStep(prev => prev + 1)}
              >
                Next: Step {currentStep + 1} →
              </button>
            ) : null}

            <button 
              type="button" 
              className="btn btn-primary"
              onClick={onRunAnalysis}
              disabled={loading}
              style={{ padding: '0.75rem 1.4rem' }}
            >
              <PlayCircle size={18} />
              {loading ? 'Analyzing Factory...' : 'Run Environmental Analysis'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
