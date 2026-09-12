import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Layers, 
  MapPin, 
  Droplets, 
  Home, 
  Factory, 
  Compass, 
  ShieldAlert,
  Info,
  CheckSquare,
  Square,
  Maximize2
} from 'lucide-react';
import { fetchGisLayers, fetchBufferAnalysis } from '../../services/api';

export default function IndustrialGisMap({ factoryData }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const layerGroupsRef = useRef({
    factory: null,
    water: null,
    residential: null,
    industrial: null,
    roads: null,
    stations: null,
    buffer: null,
    vector_line: null
  });

  const lat = factoryData?.latitude || 22.4125;
  const lng = factoryData?.longitude || 73.0944;

  const [radiusKm, setRadiusKm] = useState(5.0);
  const [gisData, setGisData] = useState(null);
  const [bufferData, setBufferData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Layer Visibility Controls
  const [visibleLayers, setVisibleLayers] = useState({
    factory: true,
    water: true,
    residential: true,
    industrial: true,
    roads: true,
    stations: true,
    buffer: true
  });

  const toggleLayer = (key) => {
    setVisibleLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Load GIS layers
  useEffect(() => {
    loadGis(lat, lng, radiusKm);
  }, [lat, lng, radiusKm]);

  const loadGis = async (lt, lg, rad) => {
    setLoading(true);
    try {
      const [layersRes, bufRes] = await Promise.all([
        fetchGisLayers(lt, lg, rad),
        fetchBufferAnalysis(lt, lg, rad)
      ]);
      setGisData(layersRes);
      setBufferData(bufRes);
    } catch (err) {
      console.error('Failed to load GIS vector layers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstance.current) {
      const map = L.map(mapRef.current, {
        center: [lat, lng],
        zoom: 12,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | Vector GIS Engine',
        maxZoom: 18
      }).addTo(map);

      // Create layer groups
      layerGroupsRef.current.water = L.layerGroup().addTo(map);
      layerGroupsRef.current.residential = L.layerGroup().addTo(map);
      layerGroupsRef.current.industrial = L.layerGroup().addTo(map);
      layerGroupsRef.current.roads = L.layerGroup().addTo(map);
      layerGroupsRef.current.stations = L.layerGroup().addTo(map);
      layerGroupsRef.current.buffer = L.layerGroup().addTo(map);
      layerGroupsRef.current.vector_line = L.layerGroup().addTo(map);
      layerGroupsRef.current.factory = L.layerGroup().addTo(map);

      mapInstance.current = map;
    } else {
      mapInstance.current.setView([lat, lng], radiusKm > 6 ? 11 : 12);
    }
  }, [lat, lng]);

  // Render Vector Layers
  useEffect(() => {
    if (!mapInstance.current || !gisData) return;

    const groups = layerGroupsRef.current;

    // 1. Factory Marker
    groups.factory.clearLayers();
    if (visibleLayers.factory) {
      const factoryIcon = L.divIcon({
        className: 'custom-factory-marker',
        html: `<div style="background:#10b981; width:36px; height:36px; border-radius:50%; border:3px solid #ffffff; box-shadow:0 0 16px rgba(16,185,129,0.8); display:flex; align-items:center; justify-content:center; color:#fff; font-size:18px;">🏭</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });
      L.marker([lat, lng], { icon: factoryIcon })
        .addTo(groups.factory)
        .bindPopup(`<b>${factoryData?.name || 'Target Factory'}</b><br/>Centroid: ${lat.toFixed(4)}, ${lng.toFixed(4)}<br/>${factoryData?.industry_type || 'Industrial'}`);
    }

    // 2. Buffer Boundary Circle
    groups.buffer.clearLayers();
    if (visibleLayers.buffer) {
      L.circle([lat, lng], {
        radius: radiusKm * 1000,
        color: '#06b6d4',
        weight: 2,
        dashArray: '5, 8',
        fillColor: '#06b6d4',
        fillOpacity: 0.04
      }).addTo(groups.buffer).bindTooltip(`Analysis Boundary (${radiusKm} km Radius)`, { sticky: true });
    }

    // 3. Water Bodies (Real Polygons)
    groups.water.clearLayers();
    groups.vector_line.clearLayers();
    if (visibleLayers.water && gisData.layers?.water_bodies?.features) {
      gisData.layers.water_bodies.features.forEach(feat => {
        const poly = L.geoJSON(feat, {
          style: {
            color: '#2563eb',
            weight: 2.5,
            fillColor: '#3b82f6',
            fillOpacity: 0.45
          }
        });
        poly.bindTooltip(`<b>${feat.properties?.name || 'Water Body'}</b><br/>Type: ${feat.properties?.water_type || 'Hydrological Channel'}`);
        groups.water.addLayer(poly);
      });

      // Highlight nearest water body line
      const nw = gisData.nearest_water_body;
      if (nw && nw.nearest_boundary_point) {
        const line = L.polyline([[lat, lng], nw.nearest_boundary_point], {
          color: '#3b82f6',
          weight: 2.5,
          dashArray: '4, 6'
        }).bindTooltip(`<b>Distance to Nearest Water (${nw.name})</b>: ${nw.distance_km} km`, { sticky: true });
        groups.vector_line.addLayer(line);
      }
    }

    // 4. Residential Areas (Real Polygons)
    groups.residential.clearLayers();
    if (visibleLayers.residential && gisData.layers?.residential_areas?.features) {
      gisData.layers.residential_areas.features.forEach(feat => {
        const poly = L.geoJSON(feat, {
          style: {
            color: '#d97706',
            weight: 2,
            fillColor: '#f59e0b',
            fillOpacity: 0.35
          }
        });
        poly.bindTooltip(`<b>${feat.properties?.name || 'Residential Area'}</b><br/>Category: ${feat.properties?.category || 'Settlement'}<br/>Estimated Area: ${feat.properties?.estimated_area_km2 || '1.5'} km²`);
        groups.residential.addLayer(poly);
      });
    }

    // 5. Industrial Areas (Real Polygons)
    groups.industrial.clearLayers();
    if (visibleLayers.industrial && gisData.layers?.industrial_areas?.features) {
      gisData.layers.industrial_areas.features.forEach(feat => {
        const poly = L.geoJSON(feat, {
          style: {
            color: '#7c3aed',
            weight: 1.8,
            fillColor: '#8b5cf6',
            fillOpacity: 0.25
          }
        });
        poly.bindTooltip(`<b>${feat.properties?.name || 'Industrial Zone'}</b><br/>Sector: ${feat.properties?.category || 'Industrial Estate'}`);
        groups.industrial.addLayer(poly);
      });
    }

    // 6. Roads (LineStrings)
    groups.roads.clearLayers();
    if (visibleLayers.roads && gisData.layers?.roads?.features) {
      gisData.layers.roads.features.forEach(feat => {
        const line = L.geoJSON(feat, {
          style: {
            color: '#94a3b8',
            weight: 3.5,
            opacity: 0.75
          }
        });
        line.bindTooltip(`<b>${feat.properties?.name || 'Arterial Road'}</b><br/>Lanes: ${feat.properties?.lanes || 4}`);
        groups.roads.addLayer(line);
      });
    }

    // 7. Monitoring Stations (Points)
    groups.stations.clearLayers();
    if (visibleLayers.stations && gisData.layers?.monitoring_stations?.features) {
      gisData.layers.monitoring_stations.features.forEach(feat => {
        const [stnLng, stnLat] = feat.geometry.coordinates;
        const stnIcon = L.divIcon({
          className: 'custom-station-marker',
          html: `<div style="background:#06b6d4; width:26px; height:26px; transform:rotate(45deg); border:2px solid #ffffff; box-shadow:0 0 10px rgba(6,182,212,0.8); display:flex; align-items:center; justify-content:center; color:#fff; font-size:12px;"><span style="transform:rotate(-45deg);">📡</span></div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });
        L.marker([stnLat, stnLng], { icon: stnIcon })
          .addTo(groups.stations)
          .bindPopup(`<b>${feat.properties?.station_name}</b><br/>Network: ${feat.properties?.network}<br/>Type: ${feat.properties?.station_type}`);
      });
    }

  }, [gisData, visibleLayers, radiusKm]);

  const nearestWater = gisData?.nearest_water_body || {};
  const nearestRes = gisData?.nearest_residential_area || {};
  const breakdown = bufferData?.land_cover_breakdown || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Top Proximity Banner */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1rem'
      }}>
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Droplets size={16} color="#3b82f6" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Nearest Water Body
            </span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
            {nearestWater.name || 'Mini River'}
          </div>
          <div style={{ fontSize: '0.82rem', color: '#60a5fa', fontWeight: 700, marginTop: 2 }}>
            Distance: {nearestWater.distance_km ?? '--'} km <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>({nearestWater.water_type || 'River'})</span>
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Home size={16} color="#f59e0b" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Nearest Residential Area
            </span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
            {nearestRes.name || 'Nandesari Township'}
          </div>
          <div style={{ fontSize: '0.82rem', color: '#fbbf24', fontWeight: 700, marginTop: 2 }}>
            Distance: {nearestRes.distance_km ?? '--'} km <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>({nearestRes.category || 'Habitation'})</span>
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--accent-cyan)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Compass size={16} color="var(--accent-cyan)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Analysis Buffer Boundary
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
            {[1.0, 3.0, 5.0, 10.0].map(r => (
              <button
                key={r}
                type="button"
                className={`btn btn-sm ${radiusKm === r ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '3px 10px', fontSize: '0.75rem' }}
                onClick={() => setRadiusKm(r)}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Map + Layer Controls Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.25rem', alignItems: 'start' }}>
        
        {/* Leaflet Map Card */}
        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={16} color="var(--primary)" />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
                Industrial Geospatial Surroundings Map (True Vector Polygons)
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              OpenStreetMap + Sentinel-2 Reflectance Geometries
            </span>
          </div>

          <div 
            ref={mapRef}
            style={{ 
              width: '100%', 
              height: '500px', 
              borderRadius: 8, 
              border: '1px solid rgba(255,255,255,0.08)',
              overflow: 'hidden' 
            }}
          />
        </div>

        {/* Layer Controls & Land-Use Breakdown Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Layer Checkboxes */}
          <div className="card" style={{ padding: '1.15rem' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', margin: '0 0 0.85rem 0' }}>
              Map Layers (Toggle On/Off)
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.8rem' }}>
              {[
                { key: 'factory', label: 'Factory Centroid', color: '#10b981' },
                { key: 'water', label: 'Water Bodies (Polygons)', color: '#3b82f6' },
                { key: 'residential', label: 'Residential Areas (Polygons)', color: '#f59e0b' },
                { key: 'industrial', label: 'Industrial Estates (Polygons)', color: '#8b5cf6' },
                { key: 'roads', label: 'Road Networks (Lines)', color: '#94a3b8' },
                { key: 'stations', label: 'Monitoring Stations (Points)', color: '#06b6d4' },
                { key: 'buffer', label: `${radiusKm} km Buffer Boundary`, color: '#06b6d4' }
              ].map(lyr => (
                <label 
                  key={lyr.key} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    cursor: 'pointer',
                    color: visibleLayers[lyr.key] ? '#fff' : 'var(--text-dim)'
                  }}
                >
                  <input 
                    type="checkbox"
                    checked={visibleLayers[lyr.key]}
                    onChange={() => toggleLayer(lyr.key)}
                    style={{ accentColor: lyr.color, cursor: 'pointer' }}
                  />
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: lyr.color, display: 'inline-block' }} />
                  <span>{lyr.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Concentric Buffer Land Use Breakdown */}
          <div className="card" style={{ padding: '1.15rem' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', margin: '0 0 0.5rem 0' }}>
              Land Use in {radiusKm} km Buffer ({bufferData?.total_territory_area_km2 || 78.5} km²)
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: '#c4b5fd' }}>Industrial Land:</span>
                <span style={{ fontWeight: 700, color: '#fff' }}>{breakdown.industrial_land_km2 ?? '--'} km² ({breakdown.industrial_percentage ?? '--'}%)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: '#fbbf24' }}>Residential Areas:</span>
                <span style={{ fontWeight: 700, color: '#fff' }}>{breakdown.residential_land_km2 ?? '--'} km² ({breakdown.residential_percentage ?? '--'}%)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: '#60a5fa' }}>Water Bodies:</span>
                <span style={{ fontWeight: 700, color: '#fff' }}>{breakdown.water_bodies_km2 ?? '--'} km² ({breakdown.water_percentage ?? '--'}%)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                <span style={{ color: '#6ee7b7' }}>Green / Agricultural:</span>
                <span style={{ fontWeight: 700, color: '#fff' }}>{breakdown.green_agricultural_km2 ?? '--'} km² ({breakdown.green_agricultural_percentage ?? '--'}%)</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
