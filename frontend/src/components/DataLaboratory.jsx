import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  Upload, 
  Table, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  Cpu, 
  Info, 
  Sparkles, 
  BarChart2, 
  SlidersHorizontal 
} from 'lucide-react';
import { loadSampleDataset, uploadDataset, trainBaselineModel } from '../services/api';

export default function DataLaboratory() {
  const [datasetOverview, setDatasetOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Model training config
  const [targetCol, setTargetCol] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [testSize, setTestSize] = useState(0.2);
  const [training, setTraining] = useState(false);
  const [trainResults, setTrainResults] = useState(null);

  // Auto-load sample dataset on first mount
  useEffect(() => {
    handleLoadSample();
  }, []);

  const handleLoadSample = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await loadSampleDataset();
      setDatasetOverview(data);
      initDefaults(data);
    } catch (err) {
      setError(err.message || 'Failed to load sample dataset');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setTrainResults(null);
    try {
      const data = await uploadDataset(file);
      setDatasetOverview(data);
      initDefaults(data);
    } catch (err) {
      setError(err.message || 'Failed to upload CSV');
    } finally {
      setLoading(false);
    }
  };

  const initDefaults = (data) => {
    const numCols = data.numeric_columns || [];
    // Auto-select target if co2_emissions exists
    const likelyTarget = numCols.find(c => c.toLowerCase().includes('co2') || c.toLowerCase().includes('emission')) || numCols[numCols.length - 1];
    if (likelyTarget) {
      setTargetCol(likelyTarget);
      const feats = numCols.filter(c => c !== likelyTarget && !c.toLowerCase().includes('id'));
      setSelectedFeatures(feats);
    }
  };

  const toggleFeature = (feat) => {
    if (selectedFeatures.includes(feat)) {
      setSelectedFeatures(selectedFeatures.filter(f => f !== feat));
    } else {
      setSelectedFeatures([...selectedFeatures, feat]);
    }
  };

  const handleTrain = async () => {
    if (!datasetOverview || !targetCol || selectedFeatures.length === 0) {
      setError('Please select a target variable and at least one feature.');
      return;
    }

    setTraining(true);
    setError('');
    try {
      const res = await trainBaselineModel(datasetOverview.dataset_id, targetCol, selectedFeatures, testSize);
      setTrainResults(res);
    } catch (err) {
      setError(err.message || 'Training failed');
    } finally {
      setTraining(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #131b2e 0%, #1e293b 100%)',
        border: '1px solid var(--border-color)',
        borderRadius: 12,
        padding: '1.25rem 1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <FlaskConical size={22} color="var(--primary)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
              Data Laboratory (Phase-1 Feasibility Testing)
            </h2>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem', maxWidth: 750 }}>
            Test whether external datasets (Google Earth Engine, Sentinel satellite rasters, CAMS atmospheric data, factory telemetry) 
            can be ingested, cleaned, and evaluated with baseline ML models (Linear Regression & Random Forest) vs rule-based calculations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleLoadSample} disabled={loading}>
            <Sparkles size={14} color="var(--primary)" /> Load 120-Row Sample Dataset
          </button>
          <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
            <Upload size={14} /> Upload Custom CSV
            <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid var(--accent-rose)', padding: '0.75rem 1rem', borderRadius: 8, color: '#fecdd3', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {datasetOverview && (
        <>
          {/* Section 1: Dataset Metadata & Missing Values */}
          <div className="grid-3">
            {/* Rows & Columns KPI */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span className="kpi-title">Active Dataset File</span>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', wordBreak: 'break-all' }}>
                {datasetOverview.filename}
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>TOTAL ROWS</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>
                    {datasetOverview.rows_count}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>TOTAL COLUMNS</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                    {datasetOverview.cols_count}
                  </div>
                </div>
              </div>
            </div>

            {/* Missing Value Audit */}
            <div className="card" style={{ gridColumn: 'span 2' }}>
              <h3 className="card-title" style={{ fontSize: '0.95rem' }}>
                Missing Value Audit & Data Quality Check
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', maxHeight: 130, overflowY: 'auto' }}>
                {datasetOverview.columns.map((col) => {
                  const missCnt = datasetOverview.missing_values[col] || 0;
                  const missPct = datasetOverview.missing_percentages[col] || 0;
                  const hasMiss = missCnt > 0;
                  return (
                    <div 
                      key={col} 
                      style={{ 
                        background: hasMiss ? 'rgba(245, 158, 11, 0.1)' : '#0a0f1d', 
                        border: `1px solid ${hasMiss ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-color)'}`,
                        borderRadius: 6, 
                        padding: '0.35rem 0.6rem',
                        fontSize: '0.75rem'
                      }}
                    >
                      <span style={{ fontWeight: 600, color: '#fff' }}>{col}:</span>{' '}
                      {hasMiss ? (
                        <span style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>
                          {missCnt} null ({missPct}%)
                        </span>
                      ) : (
                        <span style={{ color: 'var(--primary)' }}>100% clean</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.5rem', display: 'block' }}>
                Pipeline automatically executes median imputation for numeric features and mode imputation for categorical records.
              </span>
            </div>
          </div>

          {/* Section 2: Summary Statistics Table */}
          <div className="card">
            <h3 className="card-title" style={{ fontSize: '0.95rem' }}>
              Descriptive Statistics (Numerical Variables)
            </h3>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Column Feature</th>
                    <th style={{ textAlign: 'right' }}>Count</th>
                    <th style={{ textAlign: 'right' }}>Mean</th>
                    <th style={{ textAlign: 'right' }}>Std Dev</th>
                    <th style={{ textAlign: 'right' }}>Min</th>
                    <th style={{ textAlign: 'right' }}>25%</th>
                    <th style={{ textAlign: 'right' }}>Median (50%)</th>
                    <th style={{ textAlign: 'right' }}>75%</th>
                    <th style={{ textAlign: 'right' }}>Max</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(datasetOverview.summary_stats || {}).map(([col, s]) => (
                    <tr key={col}>
                      <td style={{ fontWeight: 700, color: '#fff' }}>{col}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{s.count}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{s.mean}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>{s.std}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{s.min}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>{s.p25}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{s.median}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>{s.p75}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{s.max}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Data Preview (Head 10 rows) */}
          <div className="card">
            <h3 className="card-title" style={{ fontSize: '0.95rem' }}>
              Dataset Head Preview (First 10 Observations)
            </h3>
            <div className="data-table-wrapper" style={{ maxHeight: 280, overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    {datasetOverview.columns.map(c => (
                      <th key={c}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {datasetOverview.preview_head.map((row, idx) => (
                    <tr key={idx}>
                      {datasetOverview.columns.map(c => (
                        <td key={c} style={{ fontFamily: typeof row[c] === 'number' ? 'var(--font-mono)' : 'inherit', fontSize: '0.8rem' }}>
                          {row[c] !== null ? String(row[c]) : <span style={{ color: 'var(--accent-amber)' }}>null</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Machine Learning Baseline Studio */}
          <div className="card" style={{ border: '1px solid var(--primary-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 className="card-title" style={{ marginBottom: '0.2rem' }}>
                  <Cpu size={18} color="var(--primary)" />
                  Baseline ML Experimentation Studio
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Train and compare an interpretable <strong>Linear Regression</strong> baseline against a non-linear <strong>Random Forest Regressor</strong>.
                </span>
              </div>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleTrain} 
                disabled={training || !targetCol || selectedFeatures.length === 0}
              >
                <Play size={15} />
                {training ? 'Training Models...' : 'Train Baseline Models'}
              </button>
            </div>

            <div className="grid-3" style={{ marginBottom: '1.25rem' }}>
              {/* Target Selector */}
              <div className="form-group">
                <label className="form-label">Target Variable (y)</label>
                <select 
                  className="form-select"
                  value={targetCol}
                  onChange={(e) => setTargetCol(e.target.value)}
                >
                  {datasetOverview.numeric_columns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>

              {/* Train/Test Split */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Test Split Ratio</label>
                  <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>{(testSize * 100).toFixed(0)}% Test / {((1 - testSize) * 100).toFixed(0)}% Train</span>
                </div>
                <input 
                  type="range" 
                  min="0.1" 
                  max="0.4" 
                  step="0.05"
                  value={testSize}
                  onChange={(e) => setTestSize(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              {/* Feature count indicator */}
              <div className="form-group">
                <label className="form-label">Active Features Count</label>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', padding: '0.5rem 0' }}>
                  {selectedFeatures.length} of {datasetOverview.columns.length - 1} Selected
                </div>
              </div>
            </div>

            {/* Feature Checkboxes */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ marginBottom: '0.5rem' }}>Feature Columns (X):</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {datasetOverview.columns.filter(c => c !== targetCol && !c.toLowerCase().includes('id')).map(col => {
                  const isChecked = selectedFeatures.includes(col);
                  return (
                    <button
                      key={col}
                      type="button"
                      onClick={() => toggleFeature(col)}
                      style={{
                        background: isChecked ? 'rgba(16, 185, 129, 0.15)' : '#0a0f1d',
                        border: `1px solid ${isChecked ? 'var(--primary)' : 'var(--border-color)'}`,
                        color: isChecked ? '#34d399' : 'var(--text-muted)',
                        padding: '0.35rem 0.75rem',
                        borderRadius: 6,
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {isChecked ? '✓ ' : '+ '} {col}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Training Results */}
            {trainResults && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Metrics Comparison */}
                <div className="grid-2">
                  {/* Linear Regression */}
                  <div style={{ background: '#0a0f1d', padding: '1rem', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: '#fff', fontSize: '0.9rem' }}>Linear Regression (Interpretable)</strong>
                      <span className="badge badge-low">Baseline</span>
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem' }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>TEST R² SCORE</span>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                          {trainResults.linear_regression_metrics.test_r2}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>TEST RMSE</span>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                          {trainResults.linear_regression_metrics.test_rmse}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>MAE</span>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                          {trainResults.linear_regression_metrics.test_mae}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Random Forest */}
                  <div style={{ background: '#0a0f1d', padding: '1rem', borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: '#fff', fontSize: '0.9rem' }}>Random Forest Regressor (Non-Linear)</strong>
                      <span className="badge badge-real">Tree Ensemble</span>
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem' }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>TEST R² SCORE</span>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                          {trainResults.random_forest_metrics.test_r2}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>TEST RMSE</span>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                          {trainResults.random_forest_metrics.test_rmse}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>MAE</span>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                          {trainResults.random_forest_metrics.test_mae}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature Importance Rankings */}
                <div style={{ background: '#0a0f1d', padding: '1rem', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: '0.65rem' }}>
                    Random Forest Feature Importances (Top Predictive Drivers)
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    {trainResults.feature_importances.map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.78rem' }}>
                        <span style={{ width: 180, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.feature}
                        </span>
                        <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${item.importance_pct}%`, height: '100%', background: 'var(--primary)', borderRadius: 4 }} />
                        </div>
                        <span style={{ width: 60, textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#fff' }}>
                          {item.importance_pct}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Technical Feasibility Assessment Verdict */}
                <div className="alert-box" style={{ background: 'rgba(99, 102, 241, 0.08)', borderLeftColor: 'var(--accent-indigo)' }}>
                  <Info size={22} color="var(--accent-indigo)" style={{ flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: '#fff' }}>Phase-1 ML Feasibility Assessment:</strong>
                    <p style={{ marginTop: '0.25rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                      {trainResults.ml_vs_rules_verdict}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
