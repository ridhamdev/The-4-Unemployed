import React, { useState } from 'react';
import { Wind, RefreshCw, Upload, CheckCircle2, AlertTriangle, Mountain, Shield, Eye } from 'lucide-react';
import { uploadEnvironmentalCsv } from '../services/api';

export default function EnvironmentalPanel({ 
  envData, 
  geoData, 
  onRefresh, 
  onEnvUpdated, 
  loading,
  latitude,
  longitude 
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');

  const handleCsvUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadSuccess('');
    setUploadError('');

    try {
      const res = await uploadEnvironmentalCsv(file);
      setUploadSuccess(`Successfully ingested ${res.message}`);
      if (onEnvUpdated && res.latest_reading) {
        onEnvUpdated(res.latest_reading);
      }
    } catch (err) {
      setUploadError(err.message || 'Failed to upload CSV');
    } finally {
      setUploading(false);
    }
  };

  const getAqiSeverity = (pollutant, val) => {
    if (pollutant === 'pm25') {
      return val > 75 ? 'badge-high' : val > 35 ? 'badge-medium' : 'badge-low';
    }
    if (pollutant === 'pm10') {
      return val > 150 ? 'badge-high' : val > 75 ? 'badge-medium' : 'badge-low';
    }
    return val > 60 ? 'badge-medium' : 'badge-low';
  };

  const isReal = envData?.is_real ?? false;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Bar */}
      <div style={{
        background: '#131b2e',
        border: '1px solid var(--border-color)',
        borderRadius: 12,
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
              Ambient Airshed & Geospatial Receptor Data
            </h2>
            <span className={`badge ${isReal ? 'badge-real' : 'badge-sample'}`}>
              {isReal ? '● LIVE EXTERNAL API' : '▲ SAMPLE BENCHMARK'}
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Coordinates: {latitude || 22.4125}° N, {longitude || 73.0944}° E • 
            Source: <strong style={{ color: '#fff' }}>{envData?.source || 'Open-Meteo Air Quality (Copernicus CAMS)'}</strong> • 
            Timestamp: {envData?.timestamp || 'Latest Synoptic Cycle'}
          </p>
        </div>

        <button 
          type="button" 
          className="btn btn-secondary btn-sm" 
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          {loading ? 'Querying API...' : 'Fetch Live Ambient Data'}
        </button>
      </div>

      {/* Air Quality Pollutant Cards */}
      <div>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Wind size={16} color="var(--accent-cyan)" />
          Atmospheric Criteria Pollutants (Ambient Airshed)
        </h3>

        <div className="grid-3" style={{ gridTemplateColumns: 'repeat(6, minmax(0, 1fr))' }}>
          {/* PM2.5 */}
          <div className="kpi-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="kpi-title">PM 2.5</span>
              <span className={`badge ${getAqiSeverity('pm25', envData?.pm25 || 0)}`} style={{ fontSize: '0.65rem' }}>
                {(envData?.pm25 || 0) > 75 ? 'Poor' : (envData?.pm25 || 0) > 35 ? 'Moderate' : 'Good'}
              </span>
            </div>
            <div className="kpi-value" style={{ color: 'var(--accent-amber)' }}>
              {envData?.pm25 ?? 64.2} <span className="kpi-unit">µg/m³</span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Fine particulate matter</span>
          </div>

          {/* PM10 */}
          <div className="kpi-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="kpi-title">PM 10</span>
              <span className={`badge ${getAqiSeverity('pm10', envData?.pm10 || 0)}`} style={{ fontSize: '0.65rem' }}>
                {(envData?.pm10 || 0) > 150 ? 'Poor' : 'Moderate'}
              </span>
            </div>
            <div className="kpi-value">
              {envData?.pm10 ?? 112.0} <span className="kpi-unit">µg/m³</span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Coarse inhalable dust</span>
          </div>

          {/* NO2 */}
          <div className="kpi-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="kpi-title">NO₂</span>
              <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>Trace</span>
            </div>
            <div className="kpi-value">
              {envData?.no2 ?? 38.5} <span className="kpi-unit">µg/m³</span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Combustion byproduct</span>
          </div>

          {/* SO2 */}
          <div className="kpi-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="kpi-title">SO₂</span>
              <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>Trace</span>
            </div>
            <div className="kpi-value">
              {envData?.so2 ?? 24.1} <span className="kpi-unit">µg/m³</span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Sulfur oxide gas</span>
          </div>

          {/* CO */}
          <div className="kpi-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="kpi-title">CO</span>
              <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>Trace</span>
            </div>
            <div className="kpi-value">
              {envData?.co ?? 480} <span className="kpi-unit">µg/m³</span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Carbon monoxide</span>
          </div>

          {/* O3 */}
          <div className="kpi-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="kpi-title">Ozone (O₃)</span>
              <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>Normal</span>
            </div>
            <div className="kpi-value">
              {envData?.o3 ?? 54.0} <span className="kpi-unit">µg/m³</span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Ground-level ozone</span>
          </div>
        </div>
      </div>

      {/* Geospatial Terrain & Receptor Sensitivity */}
      <div className="grid-2">
        <div className="card">
          <h3 className="card-title">
            <Mountain size={18} color="var(--primary)" />
            Geospatial Terrain & Satellite Land Cover
          </h3>
          <div className="grid-2" style={{ marginTop: '0.5rem' }}>
            <div style={{ background: '#0a0f1d', padding: '0.85rem', borderRadius: 8, border: '1px solid var(--border-color)' }}>
              <span className="kpi-title">Terrain Elevation</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>
                {geoData?.elevation_m ?? 38.5} <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>meters</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Open-Meteo Global Elevation Model</span>
            </div>

            <div style={{ background: '#0a0f1d', padding: '0.85rem', borderRadius: 8, border: '1px solid var(--border-color)' }}>
              <span className="kpi-title">Slope Gradient</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>
                {geoData?.slope_deg ?? 1.8}°
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Flat / gentle terrain dispersion</span>
            </div>
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Land-Cover Classification:</span>
              <span style={{ fontWeight: 600, color: '#fff' }}>{geoData?.land_cover || 'Industrial / Mixed Built-up'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Vegetation Canopy (NDVI proxy):</span>
              <span style={{ fontWeight: 600, color: '#fff' }}>{geoData?.vegetation_ndvi_proxy ?? 0.19} (Low vegetation zone)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Satellite Service Architecture:</span>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>Google Earth Engine / Sentinel-2 Ready</span>
            </div>
          </div>
        </div>

        {/* Sensitive Receptor Distances */}
        <div className="card">
          <h3 className="card-title">
            <Shield size={18} color="var(--accent-rose)" />
            Receptor Exposure & Proximity Assessment
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Distances from the factory boundary to vulnerable receptors amplify the problem factor priority score.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ background: '#0a0f1d', padding: '0.85rem', borderRadius: 8, border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff' }}>Nearest Residential Settlement</span>
                <span className="badge badge-high">{geoData?.dist_to_residential_km ?? 1.8} km</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                Proximity (&lt; 2 km) requires enhanced particulate filtration and flue gas monitoring.
              </p>
            </div>

            <div style={{ background: '#0a0f1d', padding: '0.85rem', borderRadius: 8, border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff' }}>Nearest Water Body / Canal Basin</span>
                <span className="badge badge-medium">{geoData?.dist_to_water_km ?? 2.4} km</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                Surface drainage zone receptor requires secondary containment and sludge landfill diversion.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CSV Environmental Data Ingestion */}
      <div className="card" style={{ borderStyle: 'dashed' }}>
        <h3 className="card-title" style={{ fontSize: '0.95rem' }}>
          <Upload size={16} color="var(--primary)" />
          Alternative Ingestion: Upload Custom Environmental / Sensor CSV
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          If live external satellite or atmospheric APIs cannot be accessed due to local network policies, 
          upload a CSV file containing historical local sensor columns (e.g. <code>ambient_pm25_ugm3</code>, <code>ambient_so2_ugm3</code>).
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <input 
            type="file" 
            accept=".csv"
            onChange={handleCsvUpload}
            disabled={uploading}
            style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}
          />
          {uploading && <span style={{ fontSize: '0.8rem', color: 'var(--accent-amber)' }}>Ingesting CSV...</span>}
          {uploadSuccess && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary)', fontSize: '0.8rem' }}>
              <CheckCircle2 size={16} /> {uploadSuccess}
            </div>
          )}
          {uploadError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-rose)', fontSize: '0.8rem' }}>
              <AlertTriangle size={16} /> {uploadError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
