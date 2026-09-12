import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  ShieldCheck, 
  MapPin, 
  CheckCircle2, 
  Layers, 
  RefreshCw, 
  AlertTriangle,
  Compass,
  FileCheck
} from 'lucide-react';
import { fetchWorkbenchGisValidation } from '../../services/api';

export default function GisValidationView() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [gisVal, setGisVal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [radiusKm, setRadiusKm] = useState(5.0);

  const lat = 22.4125;
  const lng = 73.0944;

  useEffect(() => {
    loadGisValidation(radiusKm);
  }, [radiusKm]);

  const loadGisValidation = async (rad) => {
    setLoading(true);
    try {
      const data = await fetchWorkbenchGisValidation(lat, lng, rad);
      setGisVal(data);
    } catch (err) {
      console.error('Failed to load GIS validation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstance.current) {
      const map = L.map(mapRef.current, {
        center: [lat, lng],
        zoom: 12,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | Internal GIS Validation',
        maxZoom: 18
      }).addTo(map);

      mapInstance.current = map;
    }
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !gisVal?.vector_layers) return;
    const map = mapInstance.current;

    // Clear existing layers
    map.eachLayer(layer => {
      if (layer instanceof L.GeoJSON || layer instanceof L.Circle || layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // 1. Factory Centroid Marker
    const factoryIcon = L.divIcon({
      className: 'factory-marker',
      html: `<div style="background:#10b981; width:34px; height:34px; border-radius:50%; border:3px solid #fff; box-shadow:0 0 14px rgba(16,185,129,0.9); display:flex; align-items:center; justify-content:center; color:#fff; font-size:16px;">🏭</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });
    L.marker([lat, lng], { icon: factoryIcon })
      .addTo(map)
      .bindPopup(`<b>Test Facility Centroid</b><br/>${lat}, ${lng}<br/>Nandesari Chemical Estate`);

    // 2. Buffer Rings
    [1.0, 3.0, 5.0, 10.0].forEach(r => {
      L.circle([lat, lng], {
        radius: r * 1000,
        color: r === radiusKm ? '#06b6d4' : 'rgba(255,255,255,0.15)',
        weight: r === radiusKm ? 2.5 : 1,
        dashArray: '4, 6',
        fill: false
      }).addTo(map).bindTooltip(`${r} km Buffer Ring`, { sticky: true });
    });

    // 3. Water Polygons
    if (gisVal.vector_layers.water_bodies?.features) {
      L.geoJSON(gisVal.vector_layers.water_bodies, {
        style: { color: '#2563eb', weight: 2.5, fillColor: '#3b82f6', fillOpacity: 0.45 }
      }).bindTooltip(layer => `<b>${layer.feature.properties?.name}</b><br/>Type: ${layer.feature.properties?.water_type}`).addTo(map);
    }

    // 4. Residential Polygons
    if (gisVal.vector_layers.residential_areas?.features) {
      L.geoJSON(gisVal.vector_layers.residential_areas, {
        style: { color: '#d97706', weight: 2, fillColor: '#f59e0b', fillOpacity: 0.35 }
      }).bindTooltip(layer => `<b>${layer.feature.properties?.name}</b><br/>Category: ${layer.feature.properties?.category}`).addTo(map);
    }

    // 5. Industrial Polygons
    if (gisVal.vector_layers.industrial_areas?.features) {
      L.geoJSON(gisVal.vector_layers.industrial_areas, {
        style: { color: '#7c3aed', weight: 2, fillColor: '#8b5cf6', fillOpacity: 0.25 }
      }).bindTooltip(layer => `<b>${layer.feature.properties?.name}</b><br/>Hazard: ${layer.feature.properties?.hazard_classification}`).addTo(map);
    }

    // 6. Roads LineStrings
    if (gisVal.vector_layers.roads?.features) {
      L.geoJSON(gisVal.vector_layers.roads, {
        style: { color: '#94a3b8', weight: 3.5, opacity: 0.75 }
      }).bindTooltip(layer => `<b>${layer.feature.properties?.name}</b>`).addTo(map);
    }

    // 7. Nearest Water Line
    const nw = gisVal.nearest_water_body;
    if (nw?.nearest_boundary_point) {
      L.polyline([[lat, lng], nw.nearest_boundary_point], {
        color: '#3b82f6',
        weight: 3,
        dashArray: '4, 6'
      }).addTo(map).bindTooltip(`<b>Point-to-Polygon Distance to ${nw.name}</b>: ${nw.distance_km} km`, { sticky: true });
    }

  }, [gisVal, radiusKm]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #06b6d4' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>Section 27 Internal Inspection Tool</span>
              <span className="badge badge-low" style={{ fontSize: '0.7rem' }}>Vector Polygons Audited</span>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              GIS Geometric Validation: Visual Feature & Distance Audit
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
              Verifies that water bodies and residential areas are extracted as actual geometries (Polygons) rather than misleading point markers.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Buffer Radius:</span>
            {[1.0, 3.0, 5.0, 10.0].map(r => (
              <button
                key={r}
                className={`btn btn-sm ${radiusKm === r ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                onClick={() => setRadiusKm(r)}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.25rem', alignItems: 'start' }}>
        {/* Map */}
        <div className="card" style={{ padding: '1rem' }}>
          <div 
            ref={mapRef} 
            style={{ width: '100%', height: '520px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }} 
          />
        </div>

        {/* Audit Checklist & Metrics Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ padding: '1.15rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <FileCheck size={16} color="var(--primary)" />
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                GIS Audit Checklist
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.78rem' }}>
              {(gisVal?.audit_checklist || []).map((chk, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: 'var(--text-main)' }}>{chk.check}</span>
                  <span className="badge badge-low" style={{ fontSize: '0.62rem' }}>{chk.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Extracted Distances */}
          <div className="card" style={{ padding: '1.15rem' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', margin: '0 0 0.65rem 0' }}>
              Geometric Geodesic Measurements
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.78rem' }}>
              <div style={{ background: '#090d16', padding: '0.6rem 0.8rem', borderRadius: 6 }}>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>NEAREST WATER BODY</div>
                <div style={{ color: '#60a5fa', fontWeight: 700, fontSize: '0.9rem', marginTop: 2 }}>
                  {gisVal?.nearest_water_body?.name}
                </div>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.8rem', marginTop: 2 }}>
                  Distance: {gisVal?.nearest_water_body?.distance_km} km
                </div>
              </div>

              <div style={{ background: '#090d16', padding: '0.6rem 0.8rem', borderRadius: 6 }}>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>NEAREST RESIDENTIAL POLYGON</div>
                <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.9rem', marginTop: 2 }}>
                  {gisVal?.nearest_residential_area?.name}
                </div>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.8rem', marginTop: 2 }}>
                  Distance: {gisVal?.nearest_residential_area?.distance_km} km
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
