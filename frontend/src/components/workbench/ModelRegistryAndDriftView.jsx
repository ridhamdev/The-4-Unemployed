import React, { useEffect, useState } from 'react';
import { 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Sliders, 
  GitBranch, 
  Layers,
  Sparkles
} from 'lucide-react';
import { fetchWorkbenchModels } from '../../services/api';

export default function ModelRegistryAndDriftView() {
  const [modelData, setModelData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Live Drift Simulator inputs
  const [testGas, setTestGas] = useState(450);
  const [testProd, setTestProd] = useState(45);
  const [testElec, setTestElec] = useState(6000);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    setLoading(true);
    try {
      const data = await fetchWorkbenchModels();
      setModelData(data);
    } catch (err) {
      console.error('Failed to load models:', err);
    } finally {
      setLoading(false);
    }
  };

  const active = modelData?.active_model || {};
  const isGasDrift = testGas > 8500 || testGas < 50;
  const isProdDrift = testProd > 120 || testProd < 5;
  const isElecDrift = testElec > 15000 || testElec < 500;
  const hasDrift = isGasDrift || isProdDrift || isElecDrift;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Active Deployed Model Card */}
      <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <span className="badge badge-low" style={{ fontSize: '0.7rem' }}>ACTIVE DEPLOYED PRODUCTION MODEL</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                {active.model_id || 'MOD-XGB-001'} (v{active.version || '1.2.0'})
              </span>
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              {active.name || 'IndustrialRiskModel'} — {active.algorithm || 'XGBoost'}
            </h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Artifact: <code style={{ color: 'var(--primary)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>{active.deployed_path}</code>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ background: '#090d16', padding: '0.6rem 1rem', borderRadius: 8, textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>OUT-OF-SAMPLE TEST R²</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                {active.test_r2?.toFixed(4) || '0.5457'}
              </div>
            </div>
            <div style={{ background: '#090d16', padding: '0.6rem 1rem', borderRadius: 8, textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>TEST RMSE</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                {active.test_rmse?.toFixed(2) || '5.33'} µg/m³
              </div>
            </div>
          </div>
        </div>

        {/* Hyperparameters Grid */}
        <div style={{ background: '#090d16', padding: '1rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
            Hyperparameters & Training Configuration
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem', fontSize: '0.8rem' }}>
            {Object.entries(active.hyperparameters || {}).map(([param, val]) => (
              <div key={param} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                <span style={{ color: 'var(--text-muted)' }}>{param}:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#fff' }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Model Versioning History Table */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <GitBranch size={16} color="var(--primary)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Model Registry Version History (Section 14)
          </h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#090d16', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                <th style={{ padding: '0.65rem 0.85rem', color: 'var(--text-dim)' }}>VERSION</th>
                <th style={{ padding: '0.65rem 0.85rem', color: 'var(--text-dim)' }}>MODEL NAME</th>
                <th style={{ padding: '0.65rem 0.85rem', color: 'var(--text-dim)' }}>ALGORITHM</th>
                <th style={{ padding: '0.65rem 0.85rem', color: 'var(--text-dim)' }}>TRAINING DATASET</th>
                <th style={{ padding: '0.65rem 0.85rem', color: 'var(--text-dim)', textAlign: 'right' }}>TEST R²</th>
                <th style={{ padding: '0.65rem 0.85rem', color: 'var(--text-dim)', textAlign: 'right' }}>TEST RMSE</th>
                <th style={{ padding: '0.65rem 0.85rem', color: 'var(--text-dim)' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(16, 185, 129, 0.06)' }}>
                <td style={{ padding: '0.7rem 0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>v1.2.0</td>
                <td style={{ padding: '0.7rem 0.85rem', color: '#fff', fontWeight: 600 }}>IndustrialRiskModel</td>
                <td style={{ padding: '0.7rem 0.85rem', color: 'var(--text-muted)' }}>XGBoost (150 Trees, lr=0.05)</td>
                <td style={{ padding: '0.7rem 0.85rem', color: 'var(--text-dim)' }}>master_spatial_temporal_dataset_v2</td>
                <td style={{ padding: '0.7rem 0.85rem', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>0.5457</td>
                <td style={{ padding: '0.7rem 0.85rem', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>5.33 µg/m³</td>
                <td style={{ padding: '0.7rem 0.85rem' }}><span className="badge badge-low" style={{ fontSize: '0.65rem' }}>ACTIVE DEPLOYED</span></td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '0.7rem 0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>v1.1.0</td>
                <td style={{ padding: '0.7rem 0.85rem', color: '#fff' }}>IndustrialRiskModel</td>
                <td style={{ padding: '0.7rem 0.85rem', color: 'var(--text-muted)' }}>Random Forest (150 Trees)</td>
                <td style={{ padding: '0.7rem 0.85rem', color: 'var(--text-dim)' }}>master_spatial_temporal_dataset_v1</td>
                <td style={{ padding: '0.7rem 0.85rem', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>0.5331</td>
                <td style={{ padding: '0.7rem 0.85rem', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>5.41 µg/m³</td>
                <td style={{ padding: '0.7rem 0.85rem' }}><span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.06)', color: 'var(--text-dim)' }}>ARCHIVED</span></td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '0.7rem 0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>v1.0.0</td>
                <td style={{ padding: '0.7rem 0.85rem', color: '#fff' }}>LinearBaselineModel</td>
                <td style={{ padding: '0.7rem 0.85rem', color: 'var(--text-muted)' }}>Linear Regression (Parametric)</td>
                <td style={{ padding: '0.7rem 0.85rem', color: 'var(--text-dim)' }}>raw_ground_cpcb_2023</td>
                <td style={{ padding: '0.7rem 0.85rem', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>0.4551</td>
                <td style={{ padding: '0.7rem 0.85rem', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>5.84 µg/m³</td>
                <td style={{ padding: '0.7rem 0.85rem' }}><span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.06)', color: 'var(--text-dim)' }}>ARCHIVED</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Drift Monitor & Boundary Violation Simulator */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Sliders size={16} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Live Model Drift & Range Violation Monitor (Section 26)
          </h3>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 1.25rem 0' }}>
          Test incoming feature vectors in real time to simulate how out-of-distribution inputs trigger confidence widening.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Natural Gas Fuel (m³/day):</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: isGasDrift ? '#ef4444' : 'var(--accent-cyan)' }}>
                  {testGas.toLocaleString()} m³
                </span>
              </div>
              <input 
                type="range"
                min="0"
                max="25000"
                step="250"
                value={testGas}
                onChange={(e) => setTestGas(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                <span>Baseline: ~450 m³</span>
                <span>P99 Bound: 8,500 m³</span>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Daily Production Output (Tonnes/day):</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: isProdDrift ? '#ef4444' : 'var(--accent-cyan)' }}>
                  {testProd.toLocaleString()} tonnes
                </span>
              </div>
              <input 
                type="range"
                min="0"
                max="250"
                step="5"
                value={testProd}
                onChange={(e) => setTestProd(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                <span>Baseline: ~46 tonnes</span>
                <span>P99 Bound: 120 tonnes</span>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Electricity Demand (kWh/day):</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: isElecDrift ? '#ef4444' : 'var(--accent-cyan)' }}>
                  {testElec.toLocaleString()} kWh
                </span>
              </div>
              <input 
                type="range"
                min="0"
                max="40000"
                step="500"
                value={testElec}
                onChange={(e) => setTestElec(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                <span>Baseline: ~6,000 kWh</span>
                <span>P99 Bound: 15,000 kWh</span>
              </div>
            </div>
          </div>

          {/* Drift Status Indicator */}
          <div style={{
            background: hasDrift ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
            border: `1px solid ${hasDrift ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            padding: '1.25rem',
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {hasDrift ? (
                <AlertTriangle size={22} color="#ef4444" />
              ) : (
                <CheckCircle2 size={22} color="var(--primary)" />
              )}
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: hasDrift ? '#ef4444' : 'var(--primary)', margin: 0 }}>
                {hasDrift ? 'OUT-OF-DISTRIBUTION DRIFT DETECTED' : 'WITHIN VALID TRAINING DOMAIN'}
              </h4>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.5, margin: 0 }}>
              {hasDrift ? (
                <span>
                  <b>Caution:</b> Tested parameter combinations diverge beyond empirical training bounds. 
                  In production, the model outputs: <i>"Prediction should be interpreted cautiously because some inputs fall outside the model's training range."</i>
                </span>
              ) : (
                <span>
                  All tested operational parameters lie safely within the 1st–99th percentiles of verified historical chemical estate operations. Predictions maintain optimal calibrated uncertainty intervals (± 5.33 µg/m³).
                </span>
              )}
            </p>

            <div style={{
              background: '#090d16',
              padding: '0.75rem',
              borderRadius: 6,
              fontSize: '0.75rem',
              color: 'var(--text-dim)'
            }}>
              <b>Uncertainty Calibration:</b> {hasDrift ? '± 10.4 µg/m³ (Widened 2x)' : '± 5.33 µg/m³ (Nominal RMSE)'}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
