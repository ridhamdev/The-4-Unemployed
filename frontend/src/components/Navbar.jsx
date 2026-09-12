import React from 'react';
import { 
  Sparkles, 
  Building2, 
  MapPin, 
  BarChart3, 
  Database, 
  Cpu, 
  Wind, 
  GitBranch, 
  PlayCircle,
  ShieldCheck,
  FlaskConical,
  Layers
} from 'lucide-react';

export default function Navbar({ 
  appMode, 
  setAppMode, 
  activeTab, 
  setActiveTab, 
  onRunAnalysis, 
  loading 
}) {
  const factoryTabs = [
    { id: 'home', label: '1. Overview', icon: Sparkles },
    { id: 'onboarding', label: '2. Onboarding & Operations', icon: Building2 },
    { id: 'map', label: '3. Surroundings GIS Map', icon: MapPin },
    { id: 'dashboard', label: '4. Executive Decision Dashboard', icon: BarChart3 },
  ];

  const workbenchTabs = [
    { id: 'wb_datasets', label: '1. Datasets & Quality', icon: Database },
    { id: 'wb_benchmark', label: '2. Benchmark & Ablation', icon: Cpu },
    { id: 'wb_plume', label: '3. Spatial Plume Dispersion', icon: Wind },
    { id: 'wb_gis', label: '4. GIS Geometry Validation', icon: Layers },
    { id: 'wb_registry', label: '5. Model Registry & Drift', icon: GitBranch },
  ];

  const currentTabs = appMode === 'factory' ? factoryTabs : workbenchTabs;

  return (
    <header style={{
      background: '#0d1322',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        padding: '0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: appMode === 'factory' 
              ? 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)'
              : 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: appMode === 'factory' 
              ? '0 0 15px rgba(16, 185, 129, 0.4)'
              : '0 0 15px rgba(139, 92, 246, 0.4)'
          }}>
            {appMode === 'factory' ? <Sparkles size={20} color="#fff" /> : <FlaskConical size={20} color="#fff" />}
          </div>
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.01em', color: '#fff', margin: 0 }}>
              Industrial Environmental Intelligence
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 2 }}>
              <span style={{ color: appMode === 'factory' ? 'var(--primary)' : '#c4b5fd', fontWeight: 700 }}>
                {appMode === 'factory' ? 'Factory Decision Support Platform' : 'Internal ML Research & Training Workbench'}
              </span>
              <span>•</span>
              <span>HackOut’26 Two-Layer System</span>
            </div>
          </div>
        </div>

        {/* Mode Switcher & Global Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          
          {/* Two-Layer Mode Toggle Switcher */}
          <div style={{
            background: '#090d16',
            padding: '3px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            gap: '3px'
          }}>
            <button
              type="button"
              onClick={() => {
                setAppMode('factory');
                setActiveTab('home');
              }}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 700,
                background: appMode === 'factory' ? 'var(--primary)' : 'transparent',
                color: appMode === 'factory' ? '#fff' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s ease'
              }}
            >
              🏢 Factory Decision Platform
            </button>

            <button
              type="button"
              onClick={() => {
                setAppMode('workbench');
                setActiveTab('wb_datasets');
              }}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 700,
                background: appMode === 'workbench' ? '#8b5cf6' : 'transparent',
                color: appMode === 'workbench' ? '#fff' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s ease'
              }}
            >
              🔬 ML Research Workbench
            </button>
          </div>

          {/* Action Button (When in Factory Mode) */}
          {appMode === 'factory' && (
            <button 
              type="button" 
              className="btn btn-primary btn-sm"
              onClick={onRunAnalysis}
              disabled={loading}
            >
              <PlayCircle size={16} />
              {loading ? 'Analyzing Pipeline...' : 'Run Analysis'}
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Sub-Navigation Bar */}
      <div style={{ background: '#090d16', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '0 1.5rem' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', gap: '0.25rem', overflowX: 'auto' }}>
          {currentTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const activeColor = appMode === 'factory' ? 'var(--primary)' : '#a78bfa';
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? `2px solid ${activeColor}` : '2px solid transparent',
                  padding: '0.7rem 0.9rem',
                  color: isActive ? activeColor : 'var(--text-muted)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={16} color={isActive ? activeColor : 'currentColor'} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
