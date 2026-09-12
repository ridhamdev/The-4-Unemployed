import React from 'react';
import { Factory, Zap, Flame, Trash2, PlusCircle, Sparkles, AlertCircle } from 'lucide-react';

const FUEL_OPTIONS = [
  { value: 'natural_gas', label: 'Natural Gas (m³)' },
  { value: 'diesel', label: 'Diesel (L)' },
  { value: 'coal', label: 'Thermal Coal (kg)' },
  { value: 'heavy_fuel_oil', label: 'Heavy Fuel Oil / Furnace Oil (L)' },
  { value: 'lpg', label: 'LPG (kg)' },
  { value: 'grid_electricity', label: 'Grid Electricity (kWh)' },
  { value: 'biomass', label: 'Biomass / Agro Residue (kg)' },
  { value: 'none', label: 'None (Direct electric or unheated)' }
];

export default function FactoryForm({ factoryData, setFactoryData, onLoadDemo }) {
  // Helpers to update sub-objects
  const handleFactoryChange = (field, val) => {
    setFactoryData(prev => ({ ...prev, [field]: val }));
  };

  const handleEnergyChange = (field, val) => {
    setFactoryData(prev => ({
      ...prev,
      energy: { ...(prev.energy || {}), [field]: val }
    }));
  };

  const handleProductionChange = (field, val) => {
    setFactoryData(prev => ({
      ...prev,
      production: { ...(prev.production || {}), [field]: val }
    }));
  };

  const handleWasteChange = (field, val) => {
    setFactoryData(prev => ({
      ...prev,
      waste: { ...(prev.waste || {}), [field]: val }
    }));
  };

  // Process helpers
  const handleProcessChange = (idx, field, val) => {
    const updated = [...(factoryData.processes || [])];
    updated[idx] = { ...updated[idx], [field]: val };
    setFactoryData(prev => ({ ...prev, processes: updated }));
  };

  const addProcess = () => {
    const newProcess = {
      process_name: `Process ${(factoryData.processes?.length || 0) + 1}`,
      energy_consumption_kwh: 5000,
      fuel_used: 'natural_gas',
      fuel_consumption: 1500,
      fuel_unit: 'm3',
      material_consumed: 'Feedstock / Steam',
      waste_generated_kg: 100,
      operating_hours_month: 500,
      temperature_c: 180,
      equipment_type: 'Industrial Furnace / Reactor',
      pollution_control: 'None'
    };
    setFactoryData(prev => ({
      ...prev,
      processes: [...(prev.processes || []), newProcess]
    }));
  };

  const removeProcess = (idx) => {
    const updated = (factoryData.processes || []).filter((_, i) => i !== idx);
    setFactoryData(prev => ({ ...prev, processes: updated }));
  };

  const energy = factoryData.energy || {};
  const production = factoryData.production || {};
  const waste = factoryData.waste || {};
  const processes = factoryData.processes || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner with Quick Demo Loader */}
      <div style={{
        background: 'linear-gradient(90deg, #131b2e 0%, #1e293b 100%)',
        border: '1px solid var(--border-color)',
        borderRadius: 12,
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
            Factory Operational & Process Information
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Enter energy, fuels, production volume, solid waste streams, and process-level leak parameters.
          </p>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onLoadDemo}>
          <Sparkles size={15} color="var(--primary)" />
          Load Demo Chemical Plant (5 Processes)
        </button>
      </div>

      {/* Section 1: Factory Profile */}
      <div className="card">
        <h3 className="card-title">
          <Factory size={18} color="var(--primary)" />
          1. General Factory Information
        </h3>
        <div className="grid-3">
          <div className="form-group">
            <label className="form-label">Factory Name</label>
            <input 
              type="text" 
              className="form-input"
              value={factoryData.name || ''}
              onChange={(e) => handleFactoryChange('name', e.target.value)}
              placeholder="e.g. Apex PetroChem & Polymers Ltd"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Industry Sector</label>
            <select 
              className="form-select"
              value={factoryData.industry_type || 'Chemical & Specialty Polymers'}
              onChange={(e) => handleFactoryChange('industry_type', e.target.value)}
            >
              <option value="Chemical & Specialty Polymers">Chemical & Specialty Polymers</option>
              <option value="Cement & Building Materials">Cement & Building Materials</option>
              <option value="Iron & Steel Metallurgy">Iron & Steel Metallurgy</option>
              <option value="Textile Processing & Dyeing">Textile Processing & Dyeing</option>
              <option value="Food & Beverage Processing">Food & Beverage Processing</option>
              <option value="Pulp & Paper Mill">Pulp & Paper Mill</option>
              <option value="Automotive & Mechanical Assembly">Automotive & Mechanical Assembly</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Location Territory Name</label>
            <input 
              type="text" 
              className="form-input"
              value={factoryData.location_name || ''}
              onChange={(e) => handleFactoryChange('location_name', e.target.value)}
              placeholder="e.g. Nandesari Industrial Estate, Vadodara"
            />
          </div>
        </div>

        <div className="grid-3">
          <div className="form-group">
            <label className="form-label">Total Number of Employees</label>
            <input 
              type="number" 
              className="form-input"
              value={factoryData.num_employees || 100}
              onChange={(e) => handleFactoryChange('num_employees', parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Operating Hours per Day</label>
            <input 
              type="number" 
              className="form-input"
              value={factoryData.operating_hours_per_day || 24}
              onChange={(e) => handleFactoryChange('operating_hours_per_day', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Operating Days per Month</label>
            <input 
              type="number" 
              className="form-input"
              value={factoryData.operating_days_per_month || 26}
              onChange={(e) => handleFactoryChange('operating_days_per_month', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      {/* Section 2: Energy & Production */}
      <div className="grid-2">
        {/* Energy Consumption */}
        <div className="card">
          <h3 className="card-title">
            <Zap size={18} color="var(--accent-amber)" />
            2. Energy & Fuel Consumption (Monthly)
          </h3>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Electricity Consumption (kWh)</label>
              <input 
                type="number" 
                className="form-input"
                value={energy.electricity_kwh_month ?? 0}
                onChange={(e) => handleEnergyChange('electricity_kwh_month', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Renewable Electricity Share (%)</label>
              <input 
                type="number" 
                className="form-input"
                min="0" 
                max="100"
                value={energy.renewable_percentage ?? 0}
                onChange={(e) => handleEnergyChange('renewable_percentage', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Diesel Fuel (Liters/month)</label>
              <input 
                type="number" 
                className="form-input"
                value={energy.diesel_liters_month ?? 0}
                onChange={(e) => handleEnergyChange('diesel_liters_month', parseFloat(e.target.value) || 0)}
                placeholder="DG sets, on-site fleet"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Natural Gas (m³/month)</label>
              <input 
                type="number" 
                className="form-input"
                value={energy.natural_gas_m3_month ?? 0}
                onChange={(e) => handleEnergyChange('natural_gas_m3_month', parseFloat(e.target.value) || 0)}
                placeholder="Boilers, heating, dryers"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Other Fuel Name & Quantity</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Coal, Biomass, None"
                value={energy.other_fuel_name || 'None'}
                onChange={(e) => handleEnergyChange('other_fuel_name', e.target.value)}
                style={{ flex: 1 }}
              />
              <input 
                type="number" 
                className="form-input" 
                placeholder="Amount"
                value={energy.other_fuel_consumption ?? 0}
                onChange={(e) => handleEnergyChange('other_fuel_consumption', parseFloat(e.target.value) || 0)}
                style={{ width: 120 }}
              />
            </div>
          </div>
        </div>

        {/* Production, Materials & Waste */}
        <div className="card">
          <h3 className="card-title">
            <Flame size={18} color="var(--accent-rose)" />
            3. Production & Waste Streams
          </h3>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Main Product</label>
              <input 
                type="text" 
                className="form-input"
                value={production.main_product || ''}
                onChange={(e) => handleProductionChange('main_product', e.target.value)}
                placeholder="e.g. Polymer Stabilizers & Resins"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Production Quantity / Month</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="number" 
                  className="form-input"
                  value={production.production_quantity_month ?? 1000}
                  onChange={(e) => handleProductionChange('production_quantity_month', parseFloat(e.target.value) || 1)}
                  style={{ flex: 1 }}
                />
                <input 
                  type="text" 
                  className="form-input"
                  value={production.production_unit || 'Tonnes'}
                  onChange={(e) => handleProductionChange('production_unit', e.target.value)}
                  style={{ width: 100 }}
                  placeholder="Unit"
                />
              </div>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Solid Waste Generated (kg/mo)</label>
              <input 
                type="number" 
                className="form-input"
                value={waste.waste_generated_kg_month ?? 0}
                onChange={(e) => handleWasteChange('waste_generated_kg_month', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Recycled Percentage (%)</label>
              <input 
                type="number" 
                className="form-input"
                min="0"
                max="100"
                value={waste.recycled_percentage ?? 0}
                onChange={(e) => handleWasteChange('recycled_percentage', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Waste Sent to Landfill (kg/mo)</label>
              <input 
                type="number" 
                className="form-input"
                value={waste.waste_sent_to_landfill_kg ?? 0}
                onChange={(e) => handleWasteChange('waste_sent_to_landfill_kg', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Waste Type / Category</label>
              <input 
                type="text" 
                className="form-input"
                value={waste.waste_type || 'Chemical Sludge & Packaging'}
                onChange={(e) => handleWasteChange('waste_type', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Dynamic Multi-Process Information */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 className="card-title" style={{ marginBottom: '0.2rem' }}>
              4. Process Breakdown & Equipment Leak Parameters
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Identify unit operations (Boilers, Kilns, Heaters, Generators, Strippers) to locate specific emission leak-points.
            </span>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={addProcess}>
            <PlusCircle size={15} /> Add Process Unit
          </button>
        </div>

        {processes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)', border: '1px dashed var(--border-color)', borderRadius: 8 }}>
            No process units configured. Click <strong>Add Process Unit</strong> or <strong>Load Demo Chemical Plant</strong> above.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {processes.map((proc, idx) => (
              <div 
                key={idx} 
                style={{ 
                  background: '#0a0f1d', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 8, 
                  padding: '1rem',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ background: 'var(--bg-subtle)', padding: '0.2rem 0.6rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                      #{idx + 1}
                    </span>
                    <input 
                      type="text"
                      className="form-input"
                      value={proc.process_name}
                      onChange={(e) => handleProcessChange(idx, 'process_name', e.target.value)}
                      style={{ fontWeight: 700, width: 280 }}
                      placeholder="e.g. Utility Steam Boiler"
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removeProcess(idx)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>

                <div className="grid-4">
                  <div className="form-group">
                    <label className="form-label">Primary Fuel Used</label>
                    <select 
                      className="form-select"
                      value={proc.fuel_used || 'natural_gas'}
                      onChange={(e) => handleProcessChange(idx, 'fuel_used', e.target.value)}
                    >
                      {FUEL_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fuel Consumption / Mo</label>
                    <input 
                      type="number" 
                      className="form-input"
                      value={proc.fuel_consumption ?? 0}
                      onChange={(e) => handleProcessChange(idx, 'fuel_consumption', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Electricity Usage (kWh/mo)</label>
                    <input 
                      type="number" 
                      className="form-input"
                      value={proc.energy_consumption_kwh ?? 0}
                      onChange={(e) => handleProcessChange(idx, 'energy_consumption_kwh', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Exhaust Temp (°C)</label>
                    <input 
                      type="number" 
                      className="form-input"
                      value={proc.temperature_c ?? 0}
                      onChange={(e) => handleProcessChange(idx, 'temperature_c', parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 240"
                    />
                  </div>
                </div>

                <div className="grid-3">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Equipment Model / Type</label>
                    <input 
                      type="text" 
                      className="form-input"
                      value={proc.equipment_type || ''}
                      onChange={(e) => handleProcessChange(idx, 'equipment_type', e.target.value)}
                      placeholder="e.g. Water-Tube Boiler 10 TPH"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Existing Pollution Control</label>
                    <input 
                      type="text" 
                      className="form-input"
                      value={proc.pollution_control || ''}
                      onChange={(e) => handleProcessChange(idx, 'pollution_control', e.target.value)}
                      placeholder="e.g. Economizer, Scrubber, None"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">By-product Waste Generated (kg/mo)</label>
                    <input 
                      type="number" 
                      className="form-input"
                      value={proc.waste_generated_kg ?? 0}
                      onChange={(e) => handleProcessChange(idx, 'waste_generated_kg', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
