import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Search, Info, ShieldAlert, Compass, Navigation } from 'lucide-react';

const PRESET_LOCATIONS = [
  { name: 'Vadodara / Nandesari Petrochemicals (Gujarat, IN)', lat: 22.4125, lng: 73.0944 },
  { name: 'Jamnagar Refining & Fertilizers (Gujarat, IN)', lat: 22.4707, lng: 70.0577 },
  { name: 'Thane-Belapur Chemical Zone (Maharashtra, IN)', lat: 19.1235, lng: 73.0112 },
  { name: 'Houston Ship Channel Petrochem (Texas, US)', lat: 29.7348, lng: -95.2144 },
  { name: 'Ruhr Valley Industrial Hub (Duisburg, DE)', lat: 51.4556, lng: 7.0116 }
];

export default function MapPicker({ factoryData, setFactoryData, onLocationChanged }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const contextLayersRef = useRef([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const lat = factoryData.latitude || 22.4125;
  const lng = factoryData.longitude || 73.0944;
  const radiusKm = factoryData.analysis_radius_km || 5.0;

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstance.current) {
      const map = L.map(mapRef.current, {
        center: [lat, lng],
        zoom: 12,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | GEE & Leaflet Prototype',
        maxZoom: 19
      }).addTo(map);

      // Factory Marker icon
      const factoryIcon = L.divIcon({
        className: 'custom-factory-marker',
        html: `<div style="background:#10b981; width:28px; height:28px; border-radius:50%; border:3px solid #ffffff; box-shadow:0 0 10px rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; color:#fff; font-size:14px;">🏭</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([lat, lng], { icon: factoryIcon, draggable: true }).addTo(map);
      markerRef.current = marker;

      const circle = L.circle([lat, lng], {
        radius: radiusKm * 1000,
        color: '#10b981',
        weight: 2,
        fillColor: '#10b981',
        fillOpacity: 0.12,
        dashArray: '4, 6'
      }).addTo(map);
      circleRef.current = circle;

      // Handle map click
      map.on('click', (e) => {
        const newLat = parseFloat(e.latlng.lat.toFixed(4));
        const newLng = parseFloat(e.latlng.lng.toFixed(4));
        updatePosition(newLat, newLng);
      });

      // Handle marker drag
      marker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        const newLat = parseFloat(pos.lat.toFixed(4));
        const newLng = parseFloat(pos.lng.toFixed(4));
        updatePosition(newLat, newLng);
      });

      mapInstance.current = map;
    }

    renderContextReceptors(lat, lng);

    return () => {
      // cleanup is preserved across tab navigation
    };
  }, []);

  // Update map center & circle when coordinates or radius change
  useEffect(() => {
    if (mapInstance.current && markerRef.current && circleRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      circleRef.current.setLatLng([lat, lng]);
      circleRef.current.setRadius(radiusKm * 1000);
      mapInstance.current.setView([lat, lng], mapInstance.current.getZoom());
      renderContextReceptors(lat, lng);
    }
  }, [lat, lng, radiusKm]);

  const updatePosition = (newLat, newLng) => {
    setFactoryData(prev => ({
      ...prev,
      latitude: newLat,
      longitude: newLng
    }));
    if (onLocationChanged) {
      onLocationChanged(newLat, newLng, radiusKm);
    }
  };

  const renderContextReceptors = (cLat, cLng) => {
    if (!mapInstance.current) return;

    // Clear previous context markers
    contextLayersRef.current.forEach(layer => mapInstance.current.removeLayer(layer));
    contextLayersRef.current = [];

    // Synthetic receptor points based on radius to visualize geospatial context
    const receptors = [
      {
        name: 'Nearby Residential Settlement (High Vulnerability Receptor)',
        lat: cLat + 0.015,
        lng: cLng + 0.012,
        icon: '🏘️',
        bg: '#f43f5e',
        desc: 'Distance: 1.8 km downwind. Sensitive population exposure zone.'
      },
      {
        name: 'River Basin & Surface Water Canal',
        lat: cLat - 0.018,
        lng: cLng + 0.008,
        icon: '💧',
        bg: '#06b6d4',
        desc: 'Distance: 2.2 km. Industrial effluent and runoff receptor.'
      },
      {
        name: 'Adjacent Industrial Cluster / By-product Synergy Partner',
        lat: cLat - 0.012,
        lng: cLng - 0.015,
        icon: '⚙️',
        bg: '#8b5cf6',
        desc: 'Distance: 1.6 km. Potential circular off-taker for waste heat and slag.'
      }
    ];

    receptors.forEach(rec => {
      const recIcon = L.divIcon({
        className: 'context-marker',
        html: `<div style="background:${rec.bg}; width:24px; height:24px; border-radius:50%; border:2px solid #ffffff; display:flex; align-items:center; justify-content:center; font-size:12px; box-shadow:0 2px 6px rgba(0,0,0,0.4);">${rec.icon}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const m = L.marker([rec.lat, rec.lng], { icon: recIcon })
        .bindPopup(`<strong>${rec.name}</strong><br/><span style="font-size:12px; color:#475569;">${rec.desc}</span>`)
        .addTo(mapInstance.current);

      contextLayersRef.current.push(m);
    });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError('');

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const first = data[0];
        const newLat = parseFloat(parseFloat(first.lat).toFixed(4));
        const newLng = parseFloat(parseFloat(first.lon).toFixed(4));
        setFactoryData(prev => ({
          ...prev,
          location_name: first.display_name.split(',')[0] + ', ' + (first.display_name.split(',')[1] || ''),
          latitude: newLat,
          longitude: newLng
        }));
        if (onLocationChanged) onLocationChanged(newLat, newLng, radiusKm);
      } else {
        setSearchError('Location not found. Try entering city or coordinates.');
      }
    } catch (err) {
      setSearchError('Geocoding search failed. Please click directly on the map or choose a preset.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Important Architecture Clarification Banner */}
      <div className="alert-box">
        <Info size={22} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
        <div>
          <strong style={{ color: '#ffffff' }}>Geospatial Context Architecture Note:</strong>
          <p style={{ marginTop: '0.2rem', color: '#cbd5e1' }}>
            Satellite imagery & geospatial data provide <strong>environmental context, receptor vulnerability, and terrain elevation</strong>. 
            They do <strong>NOT</strong> directly claim to measure chimney leaks from orbit. Instead, geospatial proximity to human settlements 
            and water bodies is fused with <strong>factory operational data</strong> to calculate problem factor severity and circular interventions.
          </p>
        </div>
      </div>

      <div className="grid-3">
        {/* Left Column: Coordinates and Search */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h2 className="card-title">
            <MapPin size={18} color="var(--primary)" />
            Factory Location Selection
          </h2>

          <form onSubmit={handleSearch} style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Search City or Industrial Zone</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text"
                className="form-input"
                placeholder="e.g. Vadodara, Jamnagar, Duisburg..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="btn btn-secondary" disabled={isSearching}>
                <Search size={16} />
              </button>
            </div>
            {searchError && <span style={{ fontSize: '0.75rem', color: 'var(--accent-rose)', marginTop: '0.25rem', display: 'block' }}>{searchError}</span>}
          </form>

          <div className="form-group">
            <label className="form-label">Industrial Presets</label>
            <select 
              className="form-select"
              onChange={(e) => {
                const idx = parseInt(e.target.value);
                if (idx >= 0) {
                  const p = PRESET_LOCATIONS[idx];
                  setFactoryData(prev => ({
                    ...prev,
                    location_name: p.name,
                    latitude: p.lat,
                    longitude: p.lng
                  }));
                  if (onLocationChanged) onLocationChanged(p.lat, p.lng, radiusKm);
                }
              }}
              defaultValue="0"
            >
              {PRESET_LOCATIONS.map((p, idx) => (
                <option key={idx} value={idx}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Latitude</label>
              <input 
                type="number" 
                step="0.0001" 
                className="form-input"
                value={lat}
                onChange={(e) => updatePosition(parseFloat(e.target.value) || 0, lng)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Longitude</label>
              <input 
                type="number" 
                step="0.0001" 
                className="form-input"
                value={lng}
                onChange={(e) => updatePosition(lat, parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Analysis Territory Radius</label>
              <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>{radiusKm} km</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="15" 
              step="0.5"
              value={radiusKm}
              onChange={(e) => {
                const r = parseFloat(e.target.value);
                setFactoryData(prev => ({ ...prev, analysis_radius_km: r }));
                if (onLocationChanged) onLocationChanged(lat, lng, r);
              }}
              style={{ width: '100%', accentColor: 'var(--primary)' }}
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              Defines buffer zone for air dispersion, nearby receptors, and circular symbiotic partners.
            </span>
          </div>

          <div style={{ background: '#0f172a', padding: '0.85rem', borderRadius: 8, marginTop: '1rem', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              RECEPTOR CONTEXT LEGEND
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>🏭</span> <span>Factory Location (Click/drag to move)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>🏘️</span> <span>Residential Settlement (&lt; 2 km receptor risk)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>💧</span> <span>Surface Water Body (Effluent receptor)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>⚙️</span> <span>Nearby Industrial Zone (Circular exchange partner)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Map Container */}
        <div className="card" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
              OpenStreetMap + Geospatial Buffer ({radiusKm} km)
            </h3>
            <span className="badge badge-real">
              Leaflet • OpenStreetMap Live
            </span>
          </div>

          <div 
            ref={mapRef} 
            style={{ 
              height: 480, 
              width: '100%', 
              borderRadius: 8, 
              border: '1px solid var(--border-color)',
              overflow: 'hidden'
            }} 
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            <span>Tip: Click anywhere on the map or drag the factory icon to re-center the airshed analysis buffer.</span>
            <span>Lat: {lat}, Lng: {lng}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
