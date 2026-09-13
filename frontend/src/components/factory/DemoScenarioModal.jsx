import React from 'react';
import { X, Sparkles, Building2, MapPin, Zap, ArrowRight, ShieldAlert, AlertTriangle } from 'lucide-react';

export default function DemoScenarioModal({ 
  isOpen, 
  onClose, 
  onSelectDemoScenario, 
  loading 
}) {
  if (!isOpen) return null;

  const demoScenarios = [
    {
      key: 'textile_surat',
      name: 'Apex TexDye & Wet Processing Mills',
      industry: 'Textile Dyeing, Printing & Wet Processing',
      location: 'Pandesara GIDC Industrial Estate, Surat, Gujarat',
      coordinates: '21.1465° N, 72.8350° E',
      description: 'Solid fuel boilers, multi-chamber fabric stenters, proximity to Tapi River tidal basin (5.91 km), and captive DG sets.',
      highlight: 'Flue gas economizer loop & Zero Liquid Discharge caustic recovery.',
      badgeColor: '#06b6d4',
      icon: '🧵'
    },
    {
      key: 'food_anand',
      name: 'Amulya Dairy & Nutrition Agro-Foods',
      industry: 'Dairy, Beverage & Agro-Food Processing',
      location: 'Anand Agro-Industrial Corridor, Gujarat',
      coordinates: '22.5420° N, 72.9650° E',
      description: 'Ammonia refrigeration chillers, milk powder spray drying towers, organic whey sludge, and Mahi Irrigation Canal (2.14 km).',
      highlight: 'Anaerobic digester biogas CHP & condensate heat recovery pump.',
      badgeColor: '#10b981',
      icon: '🥛'
    },
    {
      key: 'chemical_nandesari',
      name: 'Apex PetroChem & Polymers Ltd',
      industry: 'Chemical & Specialty Polymers',
      location: 'Nandesari Industrial Estate, Vadodara, Gujarat',
      coordinates: '22.4125° N, 73.0944° E',
      description: 'Solvent distillation columns, thermic fluid heaters, hazardous distillation residues, and Mini River tributary (1.02 km).',
      highlight: 'Closed-loop nitrogen cryogenic solvent condensation & waste heat loop.',
      badgeColor: '#8b5cf6',
      icon: '🧪'
    }
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 8, 15, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1.5rem'
    }}>
      <div style={{
        background: '#0d1322',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: 12,
        maxWidth: 780,
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sparkles size={20} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
              Explore Pre-Configured Demo Factories
            </h3>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Notice Banner */}
        <div style={{
          margin: '1.25rem 1.5rem 0',
          padding: '0.85rem 1rem',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem'
        }}>
          <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#fef3c7', lineHeight: 1.4 }}>
            <b>Demo Data Isolation Notice:</b> Pre-configured demo factories are strictly for demonstration and testing. Loading a demo scenario will <b>never</b> overwrite or modify your real factory database profile.
          </p>
        </div>

        {/* List of Demo Scenarios */}
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {demoScenarios.map(sc => (
            <div 
              key={sc.key}
              style={{
                background: '#090d16',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 8,
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
                transition: 'border-color 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '1.4rem' }}>{sc.icon}</span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
                      {sc.name}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {sc.industry}
                    </span>
                  </div>
                </div>

                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '3px 8px',
                  borderRadius: 4,
                  background: `${sc.badgeColor}20`,
                  color: sc.badgeColor,
                  border: `1px solid ${sc.badgeColor}40`
                }}>
                  Demo Scenario
                </span>
              </div>

              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.45 }}>
                {sc.description}
              </p>

              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '0.5rem 0.75rem',
                borderRadius: 6,
                fontSize: '0.75rem',
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem',
                color: 'var(--text-muted)'
              }}>
                <span>📍 <b>Location:</b> {sc.location}</span>
                <span>💡 <b>Interventions:</b> {sc.highlight}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={loading}
                  onClick={() => {
                    onSelectDemoScenario(sc.key);
                    onClose();
                  }}
                  style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
                >
                  <span>Load & Analyze {sc.name.split(' ')[0]}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
