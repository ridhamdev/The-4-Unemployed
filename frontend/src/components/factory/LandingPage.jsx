import React from 'react';
import { 
  ShieldCheck, 
  Leaf, 
  MapPin, 
  Cpu, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  Sparkles,
  TrendingDown,
  Building2,
  Droplets,
  Zap
} from 'lucide-react';

export default function LandingPage({ onStartAnalysis, onLoadScenario }) {
  const scenarios = [
    {
      key: 'textile_surat',
      name: 'Textile Dyeing & Finishing Mills',
      cluster: 'Pandesara GIDC, Surat',
      icon: '🧵',
      highlight: 'Solid fuel boiler, stenters, Tapi River proximity',
      color: '#06b6d4'
    },
    {
      key: 'food_anand',
      name: 'Dairy & Agro-Food Processing',
      cluster: 'Anand Agro-Industrial Corridor',
      icon: '🥛',
      highlight: 'Refrigeration, spray dryer, high-COD biogas capture',
      color: '#10b981'
    },
    {
      key: 'chemical_nandesari',
      name: 'Chemical & Specialty Polymers',
      cluster: 'Nandesari GIDC, Vadodara',
      icon: '🧪',
      highlight: 'Solvent distillation, thermic heater, Mini River basin',
      color: '#8b5cf6'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', paddingBottom: '3rem' }}>
      {/* Hero Section */}
      <div className="card" style={{
        padding: '3rem 2.5rem',
        background: 'radial-gradient(ellipse at top right, rgba(6, 182, 212, 0.12), rgba(13, 19, 34, 0.98) 70%)',
        border: '1px solid rgba(6, 182, 212, 0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: 880 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
            <span className="badge badge-primary" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
              Factory Decision Support Platform
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>•</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
              Zero Technical Jargon • Executive Ready
            </span>
          </div>

          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 900,
            letterSpacing: '-0.02em',
            color: '#fff',
            lineHeight: 1.18,
            marginBottom: '1rem'
          }}>
            Industrial Environmental Intelligence
          </h1>

          <p style={{
            fontSize: '1.08rem',
            color: 'var(--text-main)',
            lineHeight: 1.6,
            marginBottom: '2rem',
            maxWidth: 780
          }}>
            Understand your factory's environmental risks, spatial airshed vulnerabilities, and discover practical circular engineering alternatives to cut fuel costs, recover waste, and protect surrounding communities.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              className="btn btn-primary"
              style={{ padding: '0.85rem 1.6rem', fontSize: '0.95rem' }}
              onClick={onStartAnalysis}
            >
              <span>Analyze My Factory</span>
              <ArrowRight size={18} />
            </button>

            <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
              or load a pre-configured scenario:
            </span>
          </div>
        </div>
      </div>

      {/* 3 Scenario Quick-Load Cards */}
      <div>
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Explore Realistic Industrial Case Studies
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
            Each scenario demonstrates distinct operational profiles, real vector GIS distances, and tailored circular solutions.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {scenarios.map(sc => (
            <div 
              key={sc.key}
              className="card"
              style={{
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                borderTop: `4px solid ${sc.color}`
              }}
              onClick={() => onLoadScenario(sc.key)}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{sc.icon}</div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: '0 0 0.25rem 0' }}>
                {sc.name}
              </h4>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.75rem' }}>
                📍 {sc.cluster}
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.45, margin: '0 0 1rem 0' }}>
                {sc.highlight}
              </p>
              <button 
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', borderColor: sc.color, color: sc.color }}
                onClick={(e) => {
                  e.stopPropagation();
                  onLoadScenario(sc.key);
                }}
              >
                Load This Scenario →
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 7 Core Executive Questions Addressed */}
      <div className="card" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '1.25rem' }}>
          Answering the 7 Critical Questions for Industrial Decision Makers
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {[
            { num: "1", q: "WHAT IS THE PROBLEM?", a: "Identifies top 3–5 high-emission fuel, process, and waste points." },
            { num: "2", q: "HOW SERIOUS IS IT?", a: "Quantifies severity (High / Med / Low) against regulatory baselines." },
            { num: "3", q: "WHERE IS THE PROBLEM?", a: "Pinpoints exact equipment (boilers, heaters, distillation, ETP)." },
            { num: "4", q: "WHAT IS CONTRIBUTING?", a: "Links operational rates, fuel intensity, and meteorological stagnation." },
            { num: "5", q: "WHAT SHOULD WE DO?", a: "Recommends proven circular solutions (WHR economizers, biogas, ZLD)." },
            { num: "6", q: "WHAT COULD IT COST?", a: "Estimates CapEx, engineering difficulty, and ROI payback periods." },
            { num: "7", q: "WHAT IS THE BENEFIT?", a: "Calculates precise CO₂e reduction and recovered energy value." }
          ].map(item => (
            <div key={item.num} style={{ background: '#090d16', padding: '1rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span style={{ 
                  width: 22, 
                  height: 22, 
                  borderRadius: '50%', 
                  background: 'var(--primary)', 
                  color: '#fff', 
                  fontSize: '0.72rem', 
                  fontWeight: 800, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  {item.num}
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>{item.q}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {item.a}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
