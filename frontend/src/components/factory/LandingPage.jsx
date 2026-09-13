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
  Zap,
  FileText,
  Compass
} from 'lucide-react';

export default function LandingPage({ onStartAnalysis, onOpenDemoModal }) {
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
            Industrial Environmental Intelligence & Circular Economy Platform
          </h1>

          <p style={{
            fontSize: '1.08rem',
            color: 'var(--text-main)',
            lineHeight: 1.6,
            marginBottom: '2rem',
            maxWidth: 780
          }}>
            Pinpoint your factory location on the interactive GIS map, configure your equipment and energy inputs, and generate an executive environmental health diagnostic with practical circular engineering alternatives to cut fuel costs, recover waste, and ensure compliance.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Primary Action: Analyze My Factory */}
            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: '0.9rem 1.8rem', fontSize: '1rem', fontWeight: 700 }}
              onClick={onStartAnalysis}
            >
              <Compass size={18} />
              <span>Select Location & Analyze My Factory</span>
              <ArrowRight size={18} />
            </button>

            {/* Secondary Action: Explore Demo Factories */}
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.9rem 1.4rem', fontSize: '0.95rem' }}
              onClick={onOpenDemoModal}
            >
              <Sparkles size={16} color="var(--accent-cyan)" />
              <span>Explore Demo Factories</span>
            </button>
          </div>
        </div>
      </div>

      {/* Core Workflow Stages Grid */}
      <div>
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            How the Factory Decision Platform Works
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
            A structured, 4-stage executive workflow from geographic selection to dynamic scientific reporting.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(6, 182, 212, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={22} color="var(--accent-cyan)" />
            </div>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#fff' }}>
              1. Hierarchical Map Selection
            </h4>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Select State &rarr; Select City &rarr; Interactive map pans and loads real vector GIS layers. Click or drag to set your exact factory coordinates.
            </p>
          </div>

          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={22} color="var(--primary)" />
            </div>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#fff' }}>
              2. User-Controlled Factory Profile
            </h4>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Enter your exact organization name, energy consumption (gas, electricity, diesel), production units, and waste streams to create a real database record.
            </p>
          </div>

          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingDown size={22} color="var(--accent-purple)" />
            </div>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#fff' }}>
              3. Vector GIS & Deployed ML
            </h4>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Computes exact geodesic point-to-polygon distances to the nearest water bodies and residential zones, combining with sub-10ms deployed model inference.
            </p>
          </div>

          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={22} color="#f59e0b" />
            </div>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#fff' }}>
              4. Dynamic Scientific Report
            </h4>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Generates a 100% factory-specific scientific report with unique analysis ID, complete data provenance table, ROI calculations, and zero static boilerplate.
            </p>
          </div>

        </div>
      </div>

      {/* Demo Section Card (Isolated) */}
      <div className="card" style={{
        padding: '1.75rem 2rem',
        background: '#090d16',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.25rem'
      }}>
        <div style={{ maxWidth: 650 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <Sparkles size={18} color="var(--accent-cyan)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-cyan)' }}>
              Evaluation & Judge Demonstration
            </span>
          </div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
            Want to test pre-loaded industrial scenarios?
          </h3>
          <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Explore 3 verified industrial case studies: <b>Surat Textile Dyeing Mills</b> (Tapi River), <b>Anand Dairy Processing</b> (Mahi Canal), and <b>Vadodara Petrochemical & Polymers</b> (Mini River). Demo factories are completely isolated from your real factory database.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={onOpenDemoModal}
          style={{ padding: '0.75rem 1.4rem' }}
        >
          <span>Open Demo Scenarios</span>
          <ArrowRight size={16} />
        </button>
      </div>

    </div>
  );
}
