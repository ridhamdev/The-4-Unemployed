import React from 'react';

export function EmissionsBySourceChart({ data }) {
  if (!data || data.length === 0) {
    return <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>No emission data available</div>;
  }

  const maxVal = Math.max(...data.map(d => d.value), 1.0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {data.map((item, idx) => {
        const pct = Math.min(100, Math.max(5, (item.value / maxVal) * 100));
        return (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{item.label}</span>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {item.value} <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{item.unit || 'tCO2e'}</span>
              </span>
            </div>
            <div style={{ width: '100%', height: 10, background: '#0a0f1d', borderRadius: 999, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div 
                style={{ 
                  width: `${pct}%`, 
                  height: '100%', 
                  background: item.color || 'linear-gradient(90deg, #10b981, #06b6d4)', 
                  borderRadius: 999,
                  transition: 'width 0.4s ease'
                }} 
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ProblemFactorRankingChart({ factors }) {
  if (!factors || factors.length === 0) {
    return <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>No problem factors ranked</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {factors.map((item, idx) => {
        const score = item.problem_score || 0;
        const barColor = score >= 70 ? '#f43f5e' : (score >= 40 ? '#f59e0b' : '#10b981');

        return (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--text-dim)', fontWeight: 700, fontSize: '0.75rem' }}>#{idx + 1}</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{item.factor_name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className={`badge ${score >= 70 ? 'badge-high' : score >= 40 ? 'badge-medium' : 'badge-low'}`} style={{ fontSize: '0.65rem' }}>
                  {item.severity}
                </span>
                <span style={{ color: barColor, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  {score}/100
                </span>
              </div>
            </div>

            {/* Horizontal Bar */}
            <div style={{ width: '100%', height: 12, background: '#0a0f1d', borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div 
                style={{ 
                  width: `${score}%`, 
                  height: '100%', 
                  background: barColor, 
                  borderRadius: 6,
                  transition: 'width 0.4s ease'
                }} 
              />
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {item.why_explanation}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function EnergyBreakdownChart({ energyData }) {
  if (!energyData) return null;

  const gasMwh = (energyData.natural_gas_m3_month * 10.5) / 1000.0 || 0;
  const dieselMwh = (energyData.diesel_liters_month * 10.0) / 1000.0 || 0;
  const elecMwh = (energyData.electricity_kwh_month) / 1000.0 || 0;
  const totalMwh = gasMwh + dieselMwh + elecMwh;

  if (totalMwh === 0) return <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>No energy data</div>;

  const gasPct = ((gasMwh / totalMwh) * 100).toFixed(1);
  const dieselPct = ((dieselMwh / totalMwh) * 100).toFixed(1);
  const elecPct = ((elecMwh / totalMwh) * 100).toFixed(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Segmented bar */}
      <div style={{ display: 'flex', height: 16, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ width: `${elecPct}%`, background: '#6366f1' }} title={`Electricity: ${elecMwh.toFixed(1)} MWh (${elecPct}%)`} />
        <div style={{ width: `${gasPct}%`, background: '#f59e0b' }} title={`Natural Gas: ${gasMwh.toFixed(1)} MWh (${gasPct}%)`} />
        <div style={{ width: `${dieselPct}%`, background: '#f43f5e' }} title={`Diesel: ${dieselMwh.toFixed(1)} MWh (${dieselPct}%)`} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.78rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: '#6366f1' }} />
          <span>Grid Electricity: <strong>{elecMwh.toFixed(1)} MWh</strong> ({elecPct}%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: '#f59e0b' }} />
          <span>Natural Gas: <strong>{gasMwh.toFixed(1)} MWh</strong> ({gasPct}%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: '#f43f5e' }} />
          <span>Diesel: <strong>{dieselMwh.toFixed(1)} MWh</strong> ({dieselPct}%)</span>
        </div>
      </div>
    </div>
  );
}

export function WasteStreamsChart({ wasteData }) {
  if (!wasteData) return null;

  const totalKg = wasteData.waste_generated_kg_month || 0;
  const recycledPct = wasteData.recycled_percentage || 0;
  const landfillKg = wasteData.waste_sent_to_landfill_kg || (totalKg * (1 - recycledPct / 100.0));
  const recycledKg = totalKg - landfillKg;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', height: 16, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ width: `${recycledPct}%`, background: '#10b981' }} title={`Recycled: ${recycledKg.toFixed(0)} kg (${recycledPct}%)`} />
        <div style={{ width: `${100 - recycledPct}%`, background: '#f43f5e' }} title={`Landfilled: ${landfillKg.toFixed(0)} kg (${(100 - recycledPct).toFixed(0)}%)`} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981' }} />
          <span>Circular Recovered: <strong>{recycledKg.toFixed(0)} kg</strong> ({recycledPct}%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: '#f43f5e' }} />
          <span>Disposed to Landfill: <strong>{landfillKg.toFixed(0)} kg</strong> ({(100 - recycledPct).toFixed(0)}%)</span>
        </div>
      </div>
    </div>
  );
}
