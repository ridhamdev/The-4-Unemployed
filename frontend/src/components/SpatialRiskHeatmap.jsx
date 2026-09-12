import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Wind, 
  Compass, 
  ShieldAlert, 
  Info, 
  RefreshCw, 
  Layers, 
  Eye, 
  Activity, 
  AlertTriangle,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { fetchSpatialRisk } from '../services/api';

export default function SpatialRiskHeatmap({ factoryData }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersLayerRef = useRef(null);

  const lat = factoryData?.latitude || 22.4125;
  const lng = factoryData?.longitude || 73.0944;

  const [windSpeed, setWindSpeed] = useState(2.8);
  const [windDeg, setWindDeg] = useState(225.0);
  const [loading, setLoading] = useState(false);
  const [riskData, setRiskData] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  // Fetch spatial risk data
  const loadSpatialRisk = async (speed, deg) => {
    setLoading(true);
    try {
      const data = await fetchSpatialRisk(lat, lng, speed, deg);
      setRiskData(data);
      if (data.cells && data.cells.length > 0) {
        setSelectedCell(data.cells[0]); // default to highest risk cell
      }
    } catch (err) {
      console.error('Failed to load spatial risk:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSpatialRisk(windSpeed, windDeg);
  }, [lat, lng]);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstance.current) {
      const map = L.map(mapRef.current, {
        center: [lat, lng],
        zoom: 13,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap | S5P/ERA5 Spatial Risk Model',
        maxZoom: 18
      }).addTo(map);

      // Factory Marker
      const factoryIcon = L.divIcon({
        className: 'custom-factory-marker',
        html: `<div style="background:#10b981; width:34px; height:34px; border-radius:50%; border:3px solid #ffffff; box-shadow:0 0 16px rgba(16,185,129,0.7); display:flex; align-items:center; justify-content:center; color:#fff; font-size:16px;">🏭</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });
      L.marker([lat, lng], { icon: factoryIcon })
        .addTo(map)
        .bindPopup(`<b>${factoryData?.name || 'Industrial Facility'}</b><br/>Coordinates: ${lat}, ${lng}<br/>Analysis Epicenter`);

      const layerGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = layerGroup;
      mapInstance.current = map;
    }
  }, [lat, lng]);

  // Update Grid Markers whenever riskData or filterSeverity changes
  useEffect(() => {
    if (!mapInstance.current || !markersLayerRef.current || !riskData?.cells) return;

    markersLayerRef.current.clearLayers();

    const filteredCells = riskData.cells.filter(cell => {
      if (filterSeverity === 'ALL') return true;
      return cell.severity === filterSeverity;
    });

    filteredCells.forEach(cell => {
      let fillColor = '#10b981'; // LOW
      let strokeColor = '#059669';
      if (cell.severity === 'HIGH') {
        fillColor = '#ef4444';
        strokeColor = '#b91c1c';
      } else if (cell.severity === 'MEDIUM') {
        fillColor = '#f59e0b';
        strokeColor = '#d97706';
      }

      // Render 1 km cell footprint as a circular zone
      const circle = L.circle([cell.latitude, cell.longitude], {
        radius: 450, // approx 1km cell coverage radius
        color: strokeColor,
        weight: cell.is_downwind ? 2.5 : 1.2,
        dashArray: cell.is_downwind ? null : '3, 4',
        fillColor: fillColor,
        fillOpacity: cell.is_downwind ? 0.45 : 0.22
      });

      circle.on('click', () => {
        setSelectedCell(cell);
      });

      const downwindBadge = cell.is_downwind 
        ? `<span style="background:#ef4444; color:#fff; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:bold;">DOWNWIND</span>` 
        : `<span style="background:#4b5563; color:#fff; padding:2px 6px; border-radius:4px; font-size:10px;">CROSS/UPWIND</span>`;

      circle.bindTooltip(`
        <div style="font-family:sans-serif; min-width:140px;">
          <div style="font-weight:700; color:#111827; font-size:12px; margin-bottom:2px;">${cell.cell_id} (${cell.severity})</div>
          <div style="font-size:11px; color:#4b5563;">Predicted NO₂: <b>${cell.predicted_no2_ugm3} µg/m³</b></div>
          <div style="font-size:10px; color:#6b7280; margin-top:2px;">95% CI: [${cell.confidence_interval_95[0]} - ${cell.confidence_interval_95[1]}] µg/m³</div>
          <div style="font-size:10px; color:#6b7280; margin-top:4px;">${downwindBadge}</div>
        </div>
      `, { sticky: true, opacity: 0.95 });

      markersLayerRef.current.addLayer(circle);
    });

    // Draw Wind Advection Arrow Line
    const advectionDeg = riskData.wind_condition?.advection_heading || ((windDeg + 180) % 360);
    const rad = (advectionDeg * Math.PI) / 180.0;
    const arrowDistKm = 4.2;
    const endLat = lat + (arrowDistKm / 111.0) * Math.cos(rad);
    const endLng = lng + (arrowDistKm / (111.0 * Math.cos(lat * Math.PI / 180.0))) * Math.sin(rad);

    const windVectorLine = L.polyline([[lat, lng], [endLat, endLng]], {
      color: '#06b6d4',
      weight: 3.5,
      dashArray: '6, 6',
      opacity: 0.85
    }).bindTooltip(`<b>Downwind Advection Plume Vector</b><br/>Heading: ${advectionDeg.toFixed(0)}° (${getCompassDirection(advectionDeg)})<br/>Speed: ${windSpeed} m/s`, { sticky: true });

    markersLayerRef.current.addLayer(windVectorLine);

  }, [riskData, filterSeverity]);

  const handleApplySimulation = (e) => {
    e.preventDefault();
    loadSpatialRisk(windSpeed, windDeg);
  };

  const getCompassDirection = (deg) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(((deg % 360) / 45)) % 8;
    return directions[index];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '3rem' }}>
      {/* Title & Attribution Header */}
      <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-cyan)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>Section 14 & 25 Spatial Module</span>
              <span className="badge badge-low" style={{ fontSize: '0.7rem' }}>75 Grid Cells (1 km Res)</span>
              <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '0.7rem' }}>
                Gaussian Advection-Diffusion
              </span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              Spatial Risk Heatmap: Environmental Risk / Pollution Indicator
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.4rem 0 0 0', maxWidth: 900 }}>
              Continuous atmospheric dispersion mapping across a 5 km territory. Grid risk combines Gaussian transport modeling, satellite column density, and residential receptor proximity.
            </p>
          </div>

          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => loadSpatialRisk(windSpeed, windDeg)}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            {loading ? 'Recalculating...' : 'Refresh Spatial Grid'}
          </button>
        </div>

        {/* Mandatory Scientific Attribution Policy Notice */}
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem 1rem',
          background: 'rgba(6, 182, 212, 0.08)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem'
        }}>
          <ShieldAlert size={18} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', lineHeight: 1.45 }}>
            <b style={{ color: 'var(--accent-cyan)' }}>Mandatory Attribution Notice:</b> Spatial indicators depict modeled atmospheric concentrations and cumulative environmental risk within the airshed. They <b>do NOT prove single-facility point-source causation</b> or establish legal fault. Predictions incorporate empirical 95% confidence intervals derived from out-of-sample test validation (RMSE = 5.33 µg/m³).
          </div>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem'
      }}>
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>Total Grid Cells</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginTop: '0.3rem' }}>
            {riskData?.total_cells || 75}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            1.0 km × 1.0 km resolution (5 km radius)
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', borderTop: '3px solid #ef4444' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>High Risk Cells</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444', marginTop: '0.3rem' }}>
            {riskData?.summary?.high_risk_cells ?? 0}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Risk Score ≥ 70 (Plume centerline & near receptors)
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', borderTop: '3px solid #f59e0b' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>Medium Risk Cells</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.3rem' }}>
            {riskData?.summary?.medium_risk_cells ?? 0}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Risk Score 45 – 70 (Moderate dispersion zone)
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', borderTop: '3px solid #10b981' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>Low Risk Cells</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: '0.3rem' }}>
            {riskData?.summary?.low_risk_cells ?? 0}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Risk Score &lt; 45 (Upwind / Baseline airshed)
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', borderTop: '3px solid var(--accent-cyan)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>Max Risk Index</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '0.3rem' }}>
            {riskData?.summary?.max_risk_score ?? '--'} <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>/100</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            At nearest downwind receptor
          </div>
        </div>
      </div>

      {/* Main Interactive Grid Layout: Map & Controls/Inspector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.25rem', alignItems: 'start' }}>
        
        {/* Left Column: Interactive Leaflet Map */}
        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          
          {/* Map Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={16} color="var(--primary)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>Territory Airshed Dispersion View</span>
            </div>

            {/* Severity Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginRight: 4 }}>Filter:</span>
              {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setFilterSeverity(sev)}
                  style={{
                    padding: '3px 8px',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    borderRadius: 4,
                    border: '1px solid',
                    cursor: 'pointer',
                    background: filterSeverity === sev ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                    color: filterSeverity === sev ? '#fff' : 'var(--text-muted)',
                    borderColor: filterSeverity === sev ? 'var(--primary)' : 'rgba(255,255,255,0.1)'
                  }}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Leaflet Container */}
          <div 
            ref={mapRef} 
            style={{ 
              width: '100%', 
              height: '540px', 
              borderRadius: '8px', 
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.08)' 
            }} 
          />

          {/* Map Legend */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '0.6rem 0.85rem', 
            background: '#090d16', 
            borderRadius: 6,
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }}></span>
                <span>High Risk (≥70)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }}></span>
                <span>Medium Risk (45-70)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                <span>Low Risk (&lt;45)</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ borderBottom: '2px dashed #06b6d4', width: 24, display: 'inline-block' }}></span>
              <span>Downwind Plume Axis</span>
            </div>
          </div>
        </div>

        {/* Right Column: Plume Simulation Controls & Selected Cell Inspector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Simulation Controls Card */}
          <div className="card" style={{ padding: '1.15rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <Sliders size={16} color="var(--primary)" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                Meteorological Plume Simulation
              </h3>
            </div>

            <form onSubmit={handleApplySimulation} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {/* Wind Speed Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Wind Speed:</span>
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {windSpeed} m/s
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="12.0" 
                  step="0.1"
                  value={windSpeed}
                  onChange={(e) => setWindSpeed(parseFloat(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                  <span>0.5 m/s (Stagnant)</span>
                  <span>12 m/s (High Dispersion)</span>
                </div>
              </div>

              {/* Wind Direction Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Wind Direction (From):</span>
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {windDeg}° ({getCompassDirection(windDeg)})
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="360" 
                  step="5"
                  value={windDeg}
                  onChange={(e) => setWindDeg(parseFloat(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                  <span>0° (N)</span>
                  <span>90° (E)</span>
                  <span>180° (S)</span>
                  <span>270° (W)</span>
                </div>
              </div>

              {/* Computed Advection Heading */}
              <div style={{
                background: '#090d16',
                padding: '0.65rem 0.85rem',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.78rem'
              }}>
                <span style={{ color: 'var(--text-muted)' }}>Plume Blows Towards:</span>
                <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
                  {((windDeg + 180) % 360).toFixed(0)}° ({getCompassDirection((windDeg + 180) % 360)})
                </span>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '0.25rem' }}
                disabled={loading}
              >
                <RefreshCw size={15} className={loading ? 'spin' : ''} />
                {loading ? 'Simulating Plume...' : 'Simulate Atmospheric Advection'}
              </button>
            </form>
          </div>

          {/* Cell Inspector Card */}
          <div className="card" style={{ padding: '1.15rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Eye size={16} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  Grid Cell Inspector
                </h3>
              </div>
              {selectedCell && (
                <span className={`badge ${selectedCell.severity === 'HIGH' ? 'badge-high' : selectedCell.severity === 'MEDIUM' ? 'badge-medium' : 'badge-low'}`} style={{ fontSize: '0.68rem' }}>
                  {selectedCell.severity} RISK
                </span>
              )}
            </div>

            {selectedCell ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Cell Header & ID */}
                <div style={{ background: '#090d16', padding: '0.7rem 0.85rem', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>CELL IDENTIFIER</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '0.85rem' }}>
                      {selectedCell.cell_id}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>
                    Coords: {selectedCell.latitude.toFixed(4)}, {selectedCell.longitude.toFixed(4)}
                  </div>
                </div>

                {/* Risk Score & Prediction */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div style={{ background: '#090d16', padding: '0.65rem 0.75rem', borderRadius: 6 }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>RISK INDEX</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: selectedCell.severity === 'HIGH' ? '#ef4444' : selectedCell.severity === 'MEDIUM' ? '#f59e0b' : '#10b981', marginTop: 2 }}>
                      {selectedCell.risk_score} <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>/100</span>
                    </div>
                  </div>

                  <div style={{ background: '#090d16', padding: '0.65rem 0.75rem', borderRadius: 6 }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>PREDICTED NO₂</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginTop: 2 }}>
                      {selectedCell.predicted_no2_ugm3} <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>µg/m³</span>
                    </div>
                  </div>
                </div>

                {/* 95% Confidence Interval */}
                <div style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  padding: '0.6rem 0.85rem',
                  borderRadius: 6
                }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 700 }}>
                    95% Empirical Confidence Interval:
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                    [{selectedCell.confidence_interval_95[0]} – {selectedCell.confidence_interval_95[1]}] µg/m³
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: 2 }}>
                    Derived from chronological Test RMSE (5.33 µg/m³)
                  </div>
                </div>

                {/* Distance & Receptor Metrics */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Distance from Factory:</span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{selectedCell.dist_from_factory_km} km</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Distance to Residential:</span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{selectedCell.dist_from_residential_km} km</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Distance to Water Bodies:</span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{selectedCell.dist_from_water_km} km</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Land Use Classification:</span>
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{selectedCell.land_use}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Downwind Vector:</span>
                    <span style={{ color: selectedCell.is_downwind ? '#ef4444' : 'var(--text-dim)', fontWeight: 700 }}>
                      {selectedCell.is_downwind ? 'YES (Within Plume Cone)' : 'NO'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                Click any cell marker on the map to inspect its spatial risk details.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
