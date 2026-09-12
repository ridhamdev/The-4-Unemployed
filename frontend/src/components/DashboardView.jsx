import React from 'react';
import { 
  BarChart3, 
  AlertTriangle, 
  ArrowUpRight, 
  Lightbulb, 
  TrendingDown, 
  ShieldAlert, 
  Gauge, 
  Leaf, 
  Coins, 
  Wrench, 
  Clock 
} from 'lucide-react';
import { 
  EmissionsBySourceChart, 
  ProblemFactorRankingChart, 
  EnergyBreakdownChart, 
  WasteStreamsChart 
} from './Charts';

export default function DashboardView({ analysisResult, factoryData, onRunAnalysis, loading }) {
  if (!analysisResult) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
        <BarChart3 size={48} color="var(--primary)" style={{ margin: '0 auto 1rem', opacity: 0.7 }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>No Analysis Results Yet</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: 500, margin: '0.5rem auto 1.5rem' }}>
          Configure your factory parameters and click <strong>Run Pipeline Analysis</strong> to execute the full data fusion, 
          problem-factor scoring, and circular recommendation engine.
        </p>
        <button type="button" className="btn btn-primary" onClick={onRunAnalysis} disabled={loading}>
          {loading ? 'Processing...' : 'Run Pipeline Analysis Now'}
        </button>
      </div>
    );
  }

  const {
    factory_name,
    total_co2e_tonnes,
    scope1_direct_co2e_tonnes,
    scope2_indirect_co2e_tonnes,
    co2e_per_production_unit,
    production_unit,
    major_emission_source,
    composite_risk_score,
    problem_factors = [],
    recommendations = [],
    environmental_data,
    geospatial_data,
    emission_factors_used = []
  } = analysisResult;

  // Prepare emission sources for visual chart
  const emissionChartData = [
    { label: 'Direct Natural Gas', value: Number((scope1_direct_co2e_tonnes * 0.75).toFixed(1)), color: '#f59e0b', unit: 'tCO2e' },
    { label: 'Captive Diesel Generators', value: Number((scope1_direct_co2e_tonnes * 0.25).toFixed(1)), color: '#f43f5e', unit: 'tCO2e' },
    { label: 'Indirect Grid Electricity', value: Number(scope2_indirect_co2e_tonnes.toFixed(1)), color: '#6366f1', unit: 'tCO2e' }
  ];

  const getDifficultyBadge = (diff) => {
    const d = (diff || '').toLowerCase();
    if (d.includes('easy')) return 'badge-low';
    if (d.includes('medium')) return 'badge-medium';
    return 'badge-high';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner with Composite Risk Gauge */}
      <div style={{
        background: 'linear-gradient(135deg, #131b2e 0%, #1e293b 100%)',
        border: '1px solid var(--border-color)',
        borderRadius: 12,
        padding: '1.25rem 1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.25rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>
              {factory_name || 'Industrial Facility'}
            </h2>
            <span className="badge badge-real">Analysis Complete</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Sector: <strong style={{ color: '#fff' }}>{factoryData.industry_type || 'Chemical'}</strong> • 
            Location: {factoryData.location_name} ({factoryData.latitude?.toFixed(4)}°N, {factoryData.longitude?.toFixed(4)}°E) • 
            Analysis Radius: {factoryData.analysis_radius_km || 5} km
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#0a0f1d', padding: '0.75rem 1.25rem', borderRadius: 10, border: '1px solid var(--border-color)' }}>
          <Gauge size={32} color={composite_risk_score >= 70 ? '#f43f5e' : (composite_risk_score >= 40 ? '#f59e0b' : '#10b981')} />
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
              Composite Problem Score
            </span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', lineHeight: 1.1, fontFamily: 'var(--font-mono)' }}>
              {composite_risk_score} <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>/ 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: KPI Overview Cards */}
      <div className="grid-4">
        {/* Total CO2e */}
        <div className="kpi-card">
          <span className="kpi-title">Estimated Monthly Emissions</span>
          <div className="kpi-value" style={{ color: 'var(--accent-amber)' }}>
            {total_co2e_tonnes} <span className="kpi-unit">tCO2e / mo</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.25rem', display: 'block' }}>
            Scope 1: {scope1_direct_co2e_tonnes} t • Scope 2: {scope2_indirect_co2e_tonnes} t
          </span>
        </div>

        {/* Emission Intensity */}
        <div className="kpi-card">
          <span className="kpi-title">Carbon Intensity</span>
          <div className="kpi-value" style={{ color: 'var(--accent-cyan)' }}>
            {co2e_per_production_unit} <span className="kpi-unit">tCO2e / {production_unit}</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.25rem', display: 'block' }}>
            Per unit output of {factoryData.production?.main_product || 'product'}
          </span>
        </div>

        {/* Major Emission Driver */}
        <div className="kpi-card">
          <span className="kpi-title">Primary Leak Driver</span>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-rose)', marginTop: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {major_emission_source}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.25rem', display: 'block' }}>
            Highest combined thermodynamic & airshed score
          </span>
        </div>

        {/* Ambient Airshed Quality */}
        <div className="kpi-card">
          <span className="kpi-title">Ambient Airshed Stress</span>
          <div className="kpi-value" style={{ color: (environmental_data?.pm25 || 0) > 60 ? 'var(--accent-amber)' : 'var(--primary)' }}>
            {environmental_data?.pm25 ?? 64.2} <span className="kpi-unit">PM2.5 (µg/m³)</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.25rem', display: 'block' }}>
            {environmental_data?.is_real ? '● Live CAMS API' : '▲ Sample Benchmark'}
          </span>
        </div>
      </div>

      {/* Section 2: Ranked Problem Factors Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 className="card-title" style={{ marginBottom: '0.2rem' }}>
              <ShieldAlert size={18} color="var(--accent-rose)" />
              Ranked Problem Factors & Emission Leak Points
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Identified through transparent multi-criteria formula combining fuel combustion, waste disposition, ambient airshed, and receptor proximity.
            </span>
          </div>
        </div>

        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>Rank</th>
                <th>Problem / Emission Factor</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Contribution</th>
                <th style={{ textAlign: 'right' }}>Score (0-100)</th>
                <th>Severity</th>
                <th>Transparent Diagnostic Explanation ("WHY")</th>
              </tr>
            </thead>
            <tbody>
              {problem_factors.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 700, color: 'var(--text-dim)' }}>#{idx + 1}</td>
                  <td style={{ fontWeight: 700, color: '#fff' }}>{item.factor_name}</td>
                  <td>
                    <span style={{ background: 'var(--bg-subtle)', padding: '0.15rem 0.5rem', borderRadius: 4, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {item.category}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {item.contribution_pct}%
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800, color: item.problem_score >= 70 ? 'var(--accent-rose)' : (item.problem_score >= 40 ? 'var(--accent-amber)' : 'var(--primary)') }}>
                    {item.problem_score}
                  </td>
                  <td>
                    <span className={`badge ${item.severity === 'HIGH' ? 'badge-high' : (item.severity === 'MEDIUM' ? 'badge-medium' : 'badge-low')}`}>
                      {item.severity}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: 450 }}>
                    {item.why_explanation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Visual Analytics Charts */}
      <div className="grid-2">
        {/* Horizontal Ranking Chart */}
        <div className="card">
          <h3 className="card-title">
            <BarChart3 size={18} color="var(--primary)" />
            Problem-Factor Priority Distribution
          </h3>
          <ProblemFactorRankingChart factors={problem_factors} />
        </div>

        {/* Energy & Fuel Breakdown */}
        <div className="card">
          <h3 className="card-title">
            <TrendingDown size={18} color="var(--accent-amber)" />
            Energy & Fuel Consumption Balance (MWh)
          </h3>
          <EnergyBreakdownChart energyData={factoryData.energy} />

          <div style={{ marginTop: '1.5rem' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
              Solid Waste Disposition & Circular Recovery
            </h4>
            <WasteStreamsChart wasteData={factoryData.waste} />
          </div>
        </div>
      </div>

      {/* Section 4: Circular Alternative Recommendations */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 className="card-title" style={{ marginBottom: '0.2rem' }}>
              <Leaf size={18} color="var(--primary)" />
              Circular Interventions & Decarbonization Alternatives
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Tailored interventions to recover waste heat, eliminate captive diesel leaks, valorize solid by-products, and circularize resources.
            </span>
          </div>
          <span className="badge badge-low">{recommendations.length} Actionable Pathways</span>
        </div>

        <div className="grid-2">
          {recommendations.map((rec, idx) => (
            <div 
              key={idx}
              style={{
                background: '#0a0f1d',
                border: '1px solid var(--border-color)',
                borderRadius: 10,
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--accent-amber)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Addressing: {rec.problem}
                  </span>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>
                    {rec.proposed_intervention}
                  </h4>
                </div>
                <span className={`badge ${getDifficultyBadge(rec.difficulty)}`}>
                  {rec.difficulty}
                </span>
              </div>

              {/* Badges: Reduction, Cost */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#34d399', padding: '0.25rem 0.6rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700 }}>
                  📉 Potential Reduction: {rec.co2_reduction_range}
                </span>
                <span style={{ background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.25)', color: '#818cf8', padding: '0.25rem 0.6rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>
                  💰 {rec.cost_category}
                </span>
              </div>

              {/* Benefit & Rationale */}
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                <strong style={{ color: '#e2e8f0' }}>Expected Operational Benefit:</strong> {rec.expected_benefit}
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
                <strong>Technical Reason:</strong> {rec.reason}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 5: Extensible Emission Factor Traceability */}
      <div className="card" style={{ background: '#090d16' }}>
        <h3 className="card-title" style={{ fontSize: '0.9rem' }}>
          Extensible Emission Factor Traceability (Transparency & Governance)
        </h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          Calculations use verified national and IPCC emission baseline factors from <code>emission_factors.csv</code>.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          {emission_factors_used.map((f, i) => (
            <div key={i} style={{ background: '#131b2e', padding: '0.4rem 0.75rem', borderRadius: 6, border: '1px solid var(--border-color)' }}>
              <strong style={{ color: '#fff' }}>{f.fuel_type}</strong>: {f.co2e_factor_kg} kg CO2e/{f.unit} • Source: {f.source} ({f.year})
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
