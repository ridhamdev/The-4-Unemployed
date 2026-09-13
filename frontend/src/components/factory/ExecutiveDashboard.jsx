import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle2, 
  Zap, 
  Flame, 
  Droplets, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  HelpCircle, 
  FileText, 
  Printer, 
  Download,
  Info,
  Clock,
  ArrowRight
} from 'lucide-react';
import IndustrialGisMap from './IndustrialGisMap';

export default function ExecutiveDashboard({ analysisResult, factoryData }) {
  const [activeSubTab, setActiveSubTab] = useState('overview'); // 'overview', 'map', 'recommendations', 'action_plan', 'why', 'report'

  if (!analysisResult) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
        <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>No Analysis Run Yet</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Please go to "Onboarding & Operations" to select a factory scenario and click "Run Environmental Analysis".
        </p>
      </div>
    );
  }

  const health = analysisResult.factory_health || {};
  const problems = analysisResult.top_problems || [];
  const recs = analysisResult.circular_recommendations || [];
  const actionPlan = analysisResult.action_plan || {};
  const whyEvidence = analysisResult.why_this_result || [];
  const report = analysisResult.dynamic_report || {};

  const riskLevel = health.environmental_risk_level || 'MEDIUM';
  const riskScore = health.environmental_risk_score || 50;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>
      
      {/* Executive Sub Navigation Bar */}
      <div style={{
        background: '#090d16',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '0.5rem',
        display: 'flex',
        gap: '0.4rem',
        overflowX: 'auto'
      }}>
        {[
          { id: 'overview', label: '1. Executive Health & Problems' },
          { id: 'map', label: '2. Surroundings GIS Map' },
          { id: 'recommendations', label: '3. Circular Solutions' },
          { id: 'action_plan', label: '4. Phased Action Plan' },
          { id: 'why', label: '5. "Why This Result?" Evidence' },
          { id: 'report', label: '6. Dynamic Scientific Report' }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            className={`btn btn-sm ${activeSubTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.78rem', whiteSpace: 'nowrap', padding: '0.45rem 0.85rem' }}
            onClick={() => setActiveSubTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SUBTAB 1: HEALTH OVERVIEW & TOP PROBLEMS */}
      {activeSubTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* SECTION A: FACTORY HEALTH OVERVIEW */}
          <div className="card" style={{ padding: '1.5rem', borderLeft: `4px solid ${riskLevel === 'HIGH' ? '#ef4444' : riskLevel === 'MEDIUM' ? '#f59e0b' : '#10b981'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                  <span className={`badge ${riskLevel === 'HIGH' ? 'badge-high' : riskLevel === 'MEDIUM' ? 'badge-medium' : 'badge-low'}`}>
                    {riskLevel} RISK ({riskScore} / 100)
                  </span>
                  <span className="badge" style={{ 
                    background: analysisResult.is_demo ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)', 
                    color: analysisResult.is_demo ? '#f59e0b' : '#10b981', 
                    border: `1px solid ${analysisResult.is_demo ? 'rgba(245, 158, 11, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`, 
                    fontSize: '0.7rem' 
                  }}>
                    {analysisResult.is_demo ? 'DEMO SCENARIO' : 'VERIFIED INDUSTRIAL PROFILE'}
                  </span>
                  <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#67e8f9', border: '1px solid rgba(6, 182, 212, 0.3)', fontSize: '0.7rem' }}>
                    Data Quality: {health.data_quality || 'HIGH'}
                  </span>
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  {analysisResult.factory_name || factoryData.name || 'Industrial Facility'} — Environmental Health Overview
                </h2>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Factory ID: <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{analysisResult.factory_code || factoryData.factory_id || 'FAC-00001'}</span>
                  {' '}• Analysis ID: <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>{analysisResult.analysis_id}</span>
                  {' '}• Location: <strong style={{ color: '#fff' }}>{factoryData.city || 'Vadodara'}, {factoryData.state || 'Gujarat'}</strong>
                  {' '}• Sector: {factoryData.industry_type}
                </div>
              </div>
            </div>

            {/* Key Performance Indicators Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div style={{ background: '#090d16', padding: '1rem', borderRadius: 8 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>ESTIMATED MONTHLY CARBON</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginTop: 4 }}>
                  {health.estimated_monthly_co2e_tonnes ?? '--'} <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>tCO₂e</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>Scope 1 + Scope 2 Combined</div>
              </div>

              <div style={{ background: '#090d16', padding: '1rem', borderRadius: 8 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>CARBON INTENSITY</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: 4 }}>
                  {health.carbon_intensity_tonne_per_tonne ?? '--'} <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>t/tonne</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>Emissions per unit product</div>
              </div>

              <div style={{ background: '#090d16', padding: '1rem', borderRadius: 8 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>ENERGY INTENSITY</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginTop: 4 }}>
                  {health.electricity_intensity_kwh_per_tonne ?? '--'} <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>kWh/t</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>Electricity draw per output</div>
              </div>

              <div style={{ background: '#090d16', padding: '1rem', borderRadius: 8 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>WASTE CIRCULARITY</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: 4 }}>
                  {health.waste_circularity_recovery_pct ?? '--'}%
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>Byproduct recycling rate</div>
              </div>

              <div style={{ background: '#090d16', padding: '1rem', borderRadius: 8 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>AIRSHED CONTEXT</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>
                  {health.airshed_context || 'Moderate'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>Ambient background dispersion</div>
              </div>
            </div>
          </div>

          {/* SECTION B: TOP PRIORITIZED PROBLEMS (3 to 5 issues) */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <AlertTriangle size={18} color="#ef4444" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  Top Prioritized Problem Areas ({problems.length} Issues Identified)
                </h3>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                Ranked by emissions magnitude, thermodynamic waste, and proximity to sensitive receptors.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {problems.map(prob => (
                <div 
                  key={prob.rank}
                  style={{
                    background: '#090d16',
                    borderRadius: 8,
                    padding: '1.25rem',
                    border: `1px solid ${prob.severity === 'HIGH' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                    borderLeft: `4px solid ${prob.severity === 'HIGH' ? '#ef4444' : '#f59e0b'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ 
                        background: prob.severity === 'HIGH' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: prob.severity === 'HIGH' ? '#ef4444' : '#f59e0b',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: '0.72rem',
                        fontWeight: 800
                      }}>
                        PRIORITY #{prob.rank} • {prob.severity} SEVERITY
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                        Affected Unit: <b style={{ color: '#fff' }}>{prob.affected_process}</b>
                      </span>
                    </div>
                  </div>

                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: '0 0 0.5rem 0' }}>
                    {prob.problem_title}
                  </h4>

                  <p style={{ fontSize: '0.84rem', color: 'var(--text-main)', lineHeight: 1.5, margin: '0 0 0.75rem 0' }}>
                    <b style={{ color: 'var(--text-muted)' }}>Why It Matters:</b> {prob.why_it_matters}
                  </p>

                  <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    padding: '0.6rem 0.85rem',
                    borderRadius: 6,
                    fontSize: '0.78rem',
                    color: 'var(--accent-cyan)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span>📊</span>
                    <span><b>Empirical Evidence:</b> {prob.evidence_metric}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* SUBTAB 2: SURROUNDINGS GIS MAP */}
      {activeSubTab === 'map' && (
        <IndustrialGisMap factoryData={factoryData} />
      )}

      {/* SUBTAB 3: CIRCULAR RECOMMENDATIONS */}
      {activeSubTab === 'recommendations' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: '0 0 0.25rem 0' }}>
              Actionable Circular Engineering Alternatives
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
              Tailored interventions to close loops, recover waste energy, and reduce compliance exposure.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {recs.map(rec => (
              <div 
                key={rec.id}
                style={{
                  background: '#090d16',
                  borderRadius: 8,
                  padding: '1.25rem',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                      {rec.id}
                    </span>
                    <span className="badge" style={{ 
                      fontSize: '0.68rem',
                      background: rec.cost_level === 'HIGH' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: rec.cost_level === 'HIGH' ? '#ef4444' : '#10b981'
                    }}>
                      CapEx: {rec.cost_level}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: '0 0 0.5rem 0' }}>
                    {rec.title}
                  </h4>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>
                    Target Process: <b style={{ color: '#fff' }}>{rec.affected_process}</b>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.45, margin: '0 0 0.75rem 0' }}>
                    <b style={{ color: 'var(--text-muted)' }}>Why:</b> {rec.why}
                  </p>

                  <div style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    padding: '0.6rem 0.85rem',
                    borderRadius: 6,
                    fontSize: '0.78rem',
                    color: '#6ee7b7',
                    marginBottom: '0.75rem'
                  }}>
                    <b>Expected Benefit:</b> {rec.expected_benefit}
                  </div>
                </div>

                <div style={{
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  paddingTop: '0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.75rem'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Est. CO₂ Reduction:</span>
                    <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.82rem' }}>
                      {rec.estimated_co2_reduction}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Est. Payback:</span>
                    <div style={{ color: '#fff', fontWeight: 700 }}>
                      ~{rec.payback_period_months || 12} Months
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 4: PHASED ACTION PLAN */}
      {activeSubTab === 'action_plan' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: '0 0 0.25rem 0' }}>
              Phased Implementation Action Plan
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
              Practical roadmap divided into immediate low-cost steps, intermediate retrofits, and strategic investments.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {/* Immediate Actions */}
            <div style={{ background: '#090d16', padding: '1.25rem', borderRadius: 8, borderTop: '3px solid #10b981' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Clock size={16} color="#10b981" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  Immediate (0 – 30 Days)
                </h4>
              </div>
              <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                {(actionPlan.immediate_actions_0_30_days || []).map((act, i) => (
                  <li key={i} style={{ marginBottom: '0.5rem' }}>{act}</li>
                ))}
              </ul>
            </div>

            {/* Short-Term Actions */}
            <div style={{ background: '#090d16', padding: '1.25rem', borderRadius: 8, borderTop: '3px solid #06b6d4' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Calendar size={16} color="#06b6d4" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  Short-Term (1 – 6 Months)
                </h4>
              </div>
              <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                {(actionPlan.short_term_actions_1_6_months || []).map((act, i) => (
                  <li key={i} style={{ marginBottom: '0.5rem' }}>{act}</li>
                ))}
              </ul>
            </div>

            {/* Long-Term Actions */}
            <div style={{ background: '#090d16', padding: '1.25rem', borderRadius: 8, borderTop: '3px solid #8b5cf6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <TrendingDown size={16} color="#8b5cf6" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  Long-Term (6 – 18 Months)
                </h4>
              </div>
              <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                {(actionPlan.long_term_actions_6_18_months || []).map((act, i) => (
                  <li key={i} style={{ marginBottom: '0.5rem' }}>{act}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: "WHY THIS RESULT?" EVIDENCE */}
      {activeSubTab === 'why' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: '0 0 0.25rem 0' }}>
              Transparent Supporting Evidence ("Why This Result?")
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
              Auditable mathematical and operational justifications behind identified priorities.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {whyEvidence.map((ev, idx) => (
              <div key={idx} style={{ background: '#090d16', padding: '1.25rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
                  {ev.claim}
                </div>
                <div style={{
                  background: 'rgba(6, 182, 212, 0.08)',
                  padding: '0.6rem 0.85rem',
                  borderRadius: 6,
                  color: 'var(--accent-cyan)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                  fontFamily: 'var(--font-mono)'
                }}>
                  📈 Evidence: {ev.supporting_data}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <b>Evaluation Context:</b> {ev.context}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 6: DYNAMIC SCIENTIFIC REPORT */}
      {activeSubTab === 'report' && (
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Dynamic Scientific Environmental Report
              </h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 4 }}>
                Unique Analysis ID: <b style={{ color: 'var(--accent-cyan)' }}>{report.analysis_id}</b> • Generated: {report.timestamp}
              </div>
            </div>

            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => window.print()}
            >
              <Printer size={15} /> Print / Save as PDF
            </button>
          </div>

          <div style={{
            background: '#090d16',
            padding: '2rem',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.06)',
            color: 'var(--text-main)',
            fontSize: '0.88rem',
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            {report.report_markdown || 'Report generating...'}
          </div>
        </div>
      )}

    </div>
  );
}
