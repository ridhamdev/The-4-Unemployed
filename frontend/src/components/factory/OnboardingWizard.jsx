import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Zap, 
  Flame, 
  Layers, 
  Trash2, 
  ShieldCheck, 
  Plus, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Edit3,
  Sparkles,
  Info
} from 'lucide-react';
import LocationSelectorMap from './LocationSelectorMap';
import { createFactoryProfile, runAnalysis } from '../../services/api';

export default function OnboardingWizard({ 
  factoryData, 
  setFactoryData, 
  onAnalysisCompleted, 
  onOpenDemoModal,
  loading 
}) {
  // Phase 1 = 'location', Phase 2 = 'details'
  const [currentPhase, setCurrentPhase] = useState('location');
  const [currentStep, setCurrentStep] = useState(1); // 1: Basic & Energy, 2: Production & Waste, 3: Processes & Controls
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle Location Confirmed from Map
  const handleLocationConfirmed = (locData) => {
    setFactoryData(prev => ({
      ...prev,
      state: locData.state,
      city: locData.city,
      latitude: locData.latitude,
      longitude: locData.longitude,
      location_name: locData.location_name,
      is_demo: false
    }));
    setCurrentPhase('details');
  };

  // Updaters
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
      process_name: 'Main Production Unit',
      equipment_type: 'Industrial Equipment',
      energy_consumption_kwh: 8000,
      fuel_used: 'natural_gas',
      fuel_consumption: 1200,
      fuel_unit: 'm3',
      waste_generated_kg: 150,
      operating_hours_month: 600,
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

  // Submit and Create Factory Profile in DB
  const handleCreateAndAnalyze = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!factoryData.name || !factoryData.name.trim()) {
      setErrorMsg('Please enter your Factory / Organization Name.');
      return;
    }

    setSubmitting(true);
    try {
      // Step 1: Create real factory record in SQLite database (is_demo = False)
      const payload = {
        name: factoryData.name.trim(),
        industry_type: factoryData.industry_type || 'Chemical Manufacturing',
        state: factoryData.state || 'Gujarat',
        city: factoryData.city || 'Vadodara',
        location_name: factoryData.location_name || `${factoryData.city}, ${factoryData.state}`,
        latitude: factoryData.latitude,
        longitude: factoryData.longitude,
        analysis_radius_km: factoryData.analysis_radius_km || 5.0,
        num_employees: factoryData.num_employees || 120,
        operating_hours_per_day: factoryData.operating_hours_per_day || 24,
        operating_days_per_month: factoryData.operating_days_per_month || 26,
        is_demo: false,
        energy: factoryData.energy,
        production: factoryData.production,
        waste: factoryData.waste,
        processes: factoryData.processes || []
      };

      const created = await createFactoryProfile(payload);
      
      // Step 2: Trigger full analysis pipeline using newly created factory
      const analysisRes = await runAnalysis({ factory_id: created.id });
      
      if (onAnalysisCompleted) {
        onAnalysisCompleted(analysisRes, { ...payload, id: created.id, factory_id: created.factory_id });
      }
    } catch (err) {
      console.error('Factory creation or analysis failed:', err);
      setErrorMsg(err.message || 'Failed to create factory and run analysis.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>
      
      {/* Workflow Phase Header */}
      <div className="card" style={{ padding: '1rem 1.5rem', background: '#090d16', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{
              background: currentPhase === 'location' ? 'var(--primary)' : '#1e293b',
              color: currentPhase === 'location' ? '#0f172a' : '#94a3b8',
              fontWeight: 800,
              fontSize: '0.8rem',
              width: 26,
              height: 26,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>1</span>
            <span style={{ fontWeight: currentPhase === 'location' ? 700 : 500, color: currentPhase === 'location' ? '#fff' : 'var(--text-muted)' }}>
              Select Factory Location (State &rarr; City &rarr; Map)
            </span>

            <span style={{ color: 'var(--text-dim)', margin: '0 0.5rem' }}>&rarr;</span>

            <span style={{
              background: currentPhase === 'details' ? 'var(--primary)' : '#1e293b',
              color: currentPhase === 'details' ? '#0f172a' : '#94a3b8',
              fontWeight: 800,
              fontSize: '0.8rem',
              width: 26,
              height: 26,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>2</span>
            <span style={{ fontWeight: currentPhase === 'details' ? 700 : 500, color: currentPhase === 'details' ? '#fff' : 'var(--text-muted)' }}>
              Enter Factory Information & Operations
            </span>
          </div>

          {/* Separate Demo Button */}
          {onOpenDemoModal && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onOpenDemoModal}
              style={{ fontSize: '0.75rem', borderColor: 'rgba(255,255,255,0.2)' }}
            >
              <Sparkles size={14} color="var(--accent-cyan)" />
              <span>Explore Demo Factories</span>
            </button>
          )}
        </div>
      </div>

      {/* PHASE 1: LOCATION SELECTION */}
      {currentPhase === 'location' && (
        <LocationSelectorMap
          initialLocation={{
            state: factoryData.state || 'Gujarat',
            city: factoryData.city || 'Vadodara',
            latitude: factoryData.latitude || 22.4125,
            longitude: factoryData.longitude || 73.0944,
            location_name: factoryData.location_name || 'Vadodara Industrial Area, Gujarat'
          }}
          onConfirmLocation={handleLocationConfirmed}
        />
      )}

      {/* PHASE 2: FACTORY DETAILS (SHOWN AFTER LOCATION SELECTION) */}
      {currentPhase === 'details' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Confirmed Location Badge with Edit Option */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 8,
            padding: '1rem 1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <CheckCircle2 size={20} color="var(--primary)" />
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Confirmed Factory Location
                </span>
                <h4 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>
                  {factoryData.location_name || `${factoryData.city}, ${factoryData.state}`}
                </h4>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 2 }}>
                  State: <b>{factoryData.state}</b> | City: <b>{factoryData.city}</b> | Coords: <b>{factoryData.latitude?.toFixed(4)}, {factoryData.longitude?.toFixed(4)}</b>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setCurrentPhase('location')}
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}
            >
              <Edit3 size={13} />
              <span>Change Location on Map</span>
            </button>
          </div>

          {/* Sub-Step Navigation for Factory Details */}
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {[
              { num: 1, label: '1. Name, Industry & Energy', icon: Building2 },
              { num: 2, label: '2. Production & Waste', icon: Layers },
              { num: 3, label: '3. Equipment & Controls', icon: Flame }
            ].map(tab => (
              <button
                key={tab.num}
                type="button"
                className={`btn btn-sm ${currentStep === tab.num ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                onClick={() => setCurrentStep(tab.num)}
              >
                <tab.icon size={14} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {errorMsg && (
            <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid #ef4444', borderRadius: 6, color: '#fca5a5', fontSize: '0.82rem' }}>
              {errorMsg}
            </div>
          )}

          {/* FORM STEP 1: FACTORY NAME, INDUSTRY & ENERGY */}
          {currentStep === 1 && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
                <Building2 size={18} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                  Factory Identity & Energy Consumption
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                
                {/* User-Controlled Factory Name (Section 3) */}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label" style={{ fontWeight: 800, color: '#fff' }}>
                    Factory Name / Organization Name *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. ABC Chemical Industries Pvt. Ltd."
                    value={factoryData.name || ''}
                    onChange={(e) => updateFactory('name', e.target.value)}
                    style={{ fontSize: '1rem', fontWeight: 600 }}
                    required
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 4, display: 'block' }}>
                    This exact name will appear on all executive dashboards, GIS layers, and exported scientific reports.
                  </span>
                </div>

                {/* Industry Type */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, color: '#fff' }}>
                    Industry Sector *
                  </label>
                  <select
                    className="form-control"
                    value={factoryData.industry_type || 'Chemical Manufacturing'}
                    onChange={(e) => updateFactory('industry_type', e.target.value)}
                  >
                    <option value="Chemical Manufacturing">Chemical & Specialty Polymers</option>
                    <option value="Textile Dyeing & Wet Processing">Textile Dyeing, Printing & Finishing</option>
                    <option value="Dairy & Agro-Food Processing">Dairy, Beverage & Agro-Food</option>
                    <option value="Pharmaceuticals & Active Ingredients">Pharmaceuticals & Bulk Drugs</option>
                    <option value="Petrochemical & Oil Refining">Petrochemical & Refining</option>
                    <option value="Engineering, Foundry & Metal Fabrication">Engineering, Foundry & Metals</option>
                    <option value="Plastics & Packaging">Plastics & Synthetic Polymers</option>
                    <option value="Pulp & Paper Manufacturing">Pulp & Paper</option>
                    <option value="Other Industrial Manufacturing">Other Industrial Facility</option>
                  </select>
                </div>

                {/* Number of Employees */}
                <div className="form-group">
                  <label className="form-label">Plant Workforce / Employees</label>
                  <input
                    type="number"
                    className="form-control"
                    value={factoryData.num_employees || 120}
                    onChange={(e) => updateFactory('num_employees', parseInt(e.target.value) || 0)}
                  />
                </div>

                {/* Monthly Electricity */}
                <div className="form-group">
                  <label className="form-label">Grid Electricity Demand (kWh / month)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={factoryData.energy?.electricity_kwh_month || 0}
                    onChange={(e) => updateEnergy('electricity_kwh_month', parseFloat(e.target.value) || 0)}
                  />
                </div>

                {/* Renewable Energy Percentage */}
                <div className="form-group">
                  <label className="form-label">Captive Renewable Energy (%)</label>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    max="100"
                    value={factoryData.energy?.renewable_percentage || 0}
                    onChange={(e) => updateEnergy('renewable_percentage', parseFloat(e.target.value) || 0)}
                  />
                </div>

                {/* Natural Gas */}
                <div className="form-group">
                  <label className="form-label">Piped Natural Gas (m³ / month)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={factoryData.energy?.natural_gas_m3_month || 0}
                    onChange={(e) => updateEnergy('natural_gas_m3_month', parseFloat(e.target.value) || 0)}
                  />
                </div>

                {/* Diesel Generator Fuel */}
                <div className="form-group">
                  <label className="form-label">Captive DG Set Diesel (Liters / month)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={factoryData.energy?.diesel_liters_month || 0}
                    onChange={(e) => updateEnergy('diesel_liters_month', parseFloat(e.target.value) || 0)}
                  />
                </div>

              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-primary" onClick={() => setCurrentStep(2)}>
                  <span>Next: Production & Waste</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* FORM STEP 2: PRODUCTION & WASTE */}
          {currentStep === 2 && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
                <Layers size={18} color="var(--accent-cyan)" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                  Production Outputs & Waste Streams
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                
                <div className="form-group">
                  <label className="form-label">Main Manufactured Product</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Specialty Resins, Dye Intermediate"
                    value={factoryData.production?.main_product || ''}
                    onChange={(e) => updateProduction('main_product', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Monthly Production Output (Tonnes)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={factoryData.production?.production_quantity_month || 0}
                    onChange={(e) => updateProduction('production_quantity_month', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Primary Raw Materials Used</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Methanol, Phthalic Anhydride, Caustic Soda, Acid Catalysts"
                    value={factoryData.production?.raw_materials_used || ''}
                    onChange={(e) => updateProduction('raw_materials_used', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Solid Waste / Sludge Generated (kg / month)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={factoryData.waste?.waste_generated_kg_month || 0}
                    onChange={(e) => updateWaste('waste_generated_kg_month', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Byproduct Recycling Rate (%)</label>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    max="100"
                    value={factoryData.waste?.recycled_percentage || 0}
                    onChange={(e) => updateWaste('recycled_percentage', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Waste Treatment & Disposal Method</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. On-site Effluent Treatment Plant (ETP) + Secured Landfill TSDF"
                    value={factoryData.waste?.treatment_method || ''}
                    onChange={(e) => updateWaste('treatment_method', e.target.value)}
                  />
                </div>

              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setCurrentStep(1)}>
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>
                <button type="button" className="btn btn-primary" onClick={() => setCurrentStep(3)}>
                  <span>Next: Equipment & Controls</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* FORM STEP 3: EQUIPMENT UNITS & SUBMIT */}
          {currentStep === 3 && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Flame size={18} color="#f59e0b" />
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                    Major Process Units & Existing Pollution Controls
                  </h3>
                </div>

                <button type="button" className="btn btn-secondary btn-sm" onClick={addProcess}>
                  <Plus size={14} />
                  <span>Add Equipment</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {(factoryData.processes || []).map((proc, idx) => (
                  <div 
                    key={idx}
                    style={{
                      background: '#090d16',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 6,
                      padding: '1rem',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '0.75rem',
                      alignItems: 'end'
                    }}
                  >
                    <div>
                      <label className="form-label" style={{ fontSize: '0.72rem' }}>Equipment / Process Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={proc.process_name}
                        onChange={(e) => updateProcessItem(idx, 'process_name', e.target.value)}
                        style={{ fontSize: '0.8rem' }}
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: '0.72rem' }}>Fuel Used</label>
                      <select
                        className="form-control"
                        value={proc.fuel_used}
                        onChange={(e) => updateProcessItem(idx, 'fuel_used', e.target.value)}
                        style={{ fontSize: '0.8rem' }}
                      >
                        <option value="natural_gas">Natural Gas</option>
                        <option value="diesel">Diesel</option>
                        <option value="coal">Coal / Solid Fuel</option>
                        <option value="electricity">Electricity</option>
                        <option value="none">None / Passive</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: '0.72rem' }}>Pollution Control Installed</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Scrubber, ESP, Cyclone, None"
                        value={proc.pollution_control || ''}
                        onChange={(e) => updateProcessItem(idx, 'pollution_control', e.target.value)}
                        style={{ fontSize: '0.8rem' }}
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: '0.72rem' }}>Operating Hours / Month</label>
                      <input
                        type="number"
                        className="form-control"
                        value={proc.operating_hours_month || 0}
                        onChange={(e) => updateProcessItem(idx, 'operating_hours_month', parseFloat(e.target.value) || 0)}
                        style={{ fontSize: '0.8rem' }}
                      />
                    </div>

                    <div>
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-sm"
                        onClick={() => removeProcess(idx)}
                        style={{ width: '100%', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                      >
                        <Trash2 size={13} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setCurrentStep(2)}>
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCreateAndAnalyze}
                  disabled={submitting || loading}
                  style={{ padding: '0.85rem 1.8rem', fontSize: '0.95rem' }}
                >
                  <CheckCircle2 size={18} />
                  <span>{submitting ? 'Creating Profile & Analyzing...' : 'Create Factory Profile & Run Analysis'}</span>
                </button>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
