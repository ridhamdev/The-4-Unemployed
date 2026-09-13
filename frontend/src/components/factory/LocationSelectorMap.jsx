import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  MapPin, 
  Search, 
  Compass, 
  CheckCircle2, 
  Navigation, 
  Layers, 
  Info,
  Building2,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { fetchStates, fetchCities, fetchGisLayers } from '../../services/api';

export default function LocationSelectorMap({ 
  onConfirmLocation, 
  initialLocation = null 
}) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const layersGroupRef = useRef({
    water: null,
    residential: null,
    industrial: null,
    roads: null,
    stations: null
  });

  // State & City dropdowns
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState(initialLocation?.state || '');
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(initialLocation?.city || '');

  // Exact coordinates
  const [latitude, setLatitude] = useState(initialLocation?.latitude || 23.0225);
  const [longitude, setLongitude] = useState(initialLocation?.longitude || 72.5714);
  const [locationName, setLocationName] = useState(initialLocation?.location_name || 'Ahmedabad Industrial Area, Gujarat');
  
  // Search & Geocoding
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Hubs / industrial hints for selected city
  const [activeCityHubs, setActiveCityHubs] = useState([]);

  // Load States on mount
  useEffect(() => {
    fetchStates()
      .then(data => {
        setStates(data.states || []);
        if (!selectedState && data.states && data.states.length > 0) {
          // Default to Gujarat if available
          const defaultState = data.states.includes('Gujarat') ? 'Gujarat' : data.states[0];
          setSelectedState(defaultState);
        }
      })
      .catch(err => console.error('Failed to load states:', err));
  }, []);

  // Load Cities whenever selectedState changes
  useEffect(() => {
    if (!selectedState) {
      setCities([]);
      return;
    }
    fetchCities(selectedState)
      .then(data => {
        const cityList = data.cities || [];
        setCities(cityList);
        // If current city is not in new list, pick first
        if (cityList.length > 0) {
          const matched = cityList.find(c => c.name.toLowerCase() === selectedCity.toLowerCase());
          if (matched) {
            handleCitySelect(matched);
          } else {
            handleCitySelect(cityList[0]);
          }
        }
      })
      .catch(err => console.error('Failed to load cities:', err));
  }, [selectedState]);

  // Handle City Change
  const handleCitySelect = (cityObj) => {
    setSelectedCity(cityObj.name);
    setLatitude(cityObj.lat);
    setLongitude(cityObj.lng);
    setLocationName(`${cityObj.name} Industrial Area, ${selectedState}`);
    setActiveCityHubs(cityObj.hubs || []);

    // Fly map to city
    if (mapInstance.current) {
      mapInstance.current.flyTo([cityObj.lat, cityObj.lng], cityObj.zoom || 12, { duration: 1.2 });
      if (markerRef.current) {
        markerRef.current.setLatLng([cityObj.lat, cityObj.lng]);
      }
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstance.current) {
      const map = L.map(mapRef.current, {
        center: [latitude, longitude],
        zoom: 12,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | Vector GIS Engine',
        maxZoom: 19
      }).addTo(map);

      // Create Layer Groups for reference context
      layersGroupRef.current.water = L.layerGroup().addTo(map);
      layersGroupRef.current.residential = L.layerGroup().addTo(map);
      layersGroupRef.current.industrial = L.layerGroup().addTo(map);
      layersGroupRef.current.roads = L.layerGroup().addTo(map);
      layersGroupRef.current.stations = L.layerGroup().addTo(map);

      // Factory Marker Icon
      const factoryIcon = L.divIcon({
        className: 'custom-factory-picker-marker',
        html: `
          <div style="
            background: #10b981; 
            width: 38px; 
            height: 38px; 
            border-radius: 50%; 
            border: 3px solid #ffffff; 
            box-shadow: 0 0 16px rgba(16, 185, 129, 0.7); 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: #fff; 
            font-size: 18px;
            cursor: grab;
            animation: pulse-ring 2s infinite;
          ">
            🏭
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19]
      });

      // Draggable marker
      const marker = L.marker([latitude, longitude], { 
        icon: factoryIcon, 
        draggable: true 
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #0f172a;">
          <strong style="color: #10b981;">Selected Factory Location</strong><br/>
          Click map or drag marker to change location.
        </div>
      `);

      marker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        updateSelectedLocation(pos.lat, pos.lng);
      });

      // Click anywhere on map to reposition marker
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        updateSelectedLocation(lat, lng);
      });

      mapInstance.current = map;
      markerRef.current = marker;
    }
  }, []);

  // Update selected coordinates & fetch nearby reference GIS layers
  const updateSelectedLocation = (newLat, newLng) => {
    setLatitude(Number(newLat.toFixed(6)));
    setLongitude(Number(newLng.toFixed(6)));
    setLocationName(`${selectedCity || 'Industrial Zone'}, ${selectedState} (${newLat.toFixed(4)}, ${newLng.toFixed(4)})`);
  };

  // Load reference GIS layers whenever city/coords update
  useEffect(() => {
    if (!mapInstance.current) return;

    fetchGisLayers(latitude, longitude, 10.0)
      .then(data => {
        if (!data || !data.layers) return;
        renderReferenceLayers(data.layers);
      })
      .catch(err => console.error('Failed to load GIS reference layers:', err));
  }, [selectedCity]);

  // Render reference layers (polygons, lines, stations)
  const renderReferenceLayers = (layers) => {
    const { water, residential, industrial, roads, stations } = layersGroupRef.current;
    if (!water) return;

    water.clearLayers();
    residential.clearLayers();
    industrial.clearLayers();
    roads.clearLayers();
    stations.clearLayers();

    // Water bodies (cyan/blue)
    if (layers.water_bodies?.features) {
      L.geoJSON(layers.water_bodies, {
        style: { color: '#06b6d4', weight: 2, fillColor: '#0891b2', fillOpacity: 0.35 },
        onEachFeature: (f, layer) => {
          layer.bindTooltip(`<b>Water Body:</b> ${f.properties.name || 'Stream'}`, { sticky: true });
        }
      }).addTo(water);
    }

    // Industrial zones (purple)
    if (layers.industrial_areas?.features) {
      L.geoJSON(layers.industrial_areas, {
        style: { color: '#8b5cf6', weight: 2, fillColor: '#7c3aed', fillOpacity: 0.25 },
        onEachFeature: (f, layer) => {
          layer.bindTooltip(`<b>Industrial Zone:</b> ${f.properties.name || 'GIDC / MIDC'}`, { sticky: true });
        }
      }).addTo(industrial);
    }

    // Residential areas (amber/orange)
    if (layers.residential_areas?.features) {
      L.geoJSON(layers.residential_areas, {
        style: { color: '#f59e0b', weight: 1.5, fillColor: '#d97706', fillOpacity: 0.22 },
        onEachFeature: (f, layer) => {
          layer.bindTooltip(`<b>Residential Settlement:</b> ${f.properties.name || 'Township'}`, { sticky: true });
        }
      }).addTo(residential);
    }

    // Roads (slate lines)
    if (layers.roads?.features) {
      L.geoJSON(layers.roads, {
        style: { color: '#94a3b8', weight: 2, opacity: 0.6 }
      }).addTo(roads);
    }

    // CAAQMS Stations (green circles)
    if (layers.monitoring_stations?.features) {
      layers.monitoring_stations.features.forEach(f => {
        const [cLng, cLat] = f.geometry.coordinates;
        L.circleMarker([cLat, cLng], {
          radius: 6,
          color: '#10b981',
          fillColor: '#059669',
          fillOpacity: 0.85
        }).bindTooltip(`<b>Monitoring Station:</b> ${f.properties.station_name || 'CAAQMS'}`, { sticky: true }).addTo(stations);
      });
    }
  };

  // Search Address using Nominatim
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError('');

    try {
      // Append city and state to scope search
      const queryWithContext = `${searchQuery}, ${selectedCity}, ${selectedState}, India`;
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryWithContext)}&limit=1`;
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });
      const data = await res.json();

      if (data && data.length > 0) {
        const result = data[0];
        const newLat = parseFloat(result.lat);
        const newLng = parseFloat(result.lon);

        setLatitude(Number(newLat.toFixed(6)));
        setLongitude(Number(newLng.toFixed(6)));
        setLocationName(result.display_name.split(',').slice(0, 3).join(', '));

        if (mapInstance.current) {
          mapInstance.current.flyTo([newLat, newLng], 14, { duration: 1.2 });
          if (markerRef.current) {
            markerRef.current.setLatLng([newLat, newLng]);
          }
        }
      } else {
        setSearchError(`No coordinates found for "${searchQuery}". You can also click directly on the map.`);
      }
    } catch (err) {
      setSearchError('Search request failed. Please click directly on the map to set your factory.');
    } finally {
      setIsSearching(false);
    }
  };

  // Select industrial hub shortcut
  const handleHubClick = (hubName) => {
    setSearchQuery(hubName);
    // Simulate quick search
    const queryWithContext = `${hubName}, ${selectedCity}, ${selectedState}, India`;
    setIsSearching(true);
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryWithContext)}&limit=1`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const resLat = parseFloat(data[0].lat);
          const resLng = parseFloat(data[0].lon);
          setLatitude(Number(resLat.toFixed(6)));
          setLongitude(Number(resLng.toFixed(6)));
          setLocationName(`${hubName}, ${selectedCity}, ${selectedState}`);
          if (mapInstance.current) {
            mapInstance.current.flyTo([resLat, resLng], 14, { duration: 1.0 });
            if (markerRef.current) markerRef.current.setLatLng([resLat, resLng]);
          }
        } else {
          // If nominatim lacks exact point, apply small offset from city center
          setLocationName(`${hubName}, ${selectedCity}, ${selectedState}`);
        }
      })
      .catch(() => {})
      .finally(() => setIsSearching(false));
  };

  const handleConfirm = () => {
    onConfirmLocation({
      state: selectedState,
      city: selectedCity,
      latitude: latitude,
      longitude: longitude,
      location_name: locationName
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Step Guide Banner */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.12), rgba(16, 185, 129, 0.08))',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        padding: '1rem 1.25rem',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Compass size={22} color="var(--accent-cyan)" />
          <div>
            <strong style={{ color: '#fff', fontSize: '0.92rem' }}>
              Hierarchical Location Selection (Step 1 of 2)
            </strong>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              1. Select State &rarr; 2. Select City &rarr; 3. Pinpoint exact factory location on the interactive map.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          <Info size={14} color="var(--primary)" />
          <span>Click anywhere or drag marker to set exact factory coordinates</span>
        </div>
      </div>

      {/* Control Bar: State & City Dropdowns + Search Bar */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          
          {/* Step 1: State Dropdown */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 700, color: '#fff' }}>
              Step 1: Select State *
            </label>
            <select
              className="form-control"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}
            >
              <option value="" disabled>-- Choose State --</option>
              {states.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Step 2: City Dropdown */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 700, color: '#fff' }}>
              Step 2: Select City / Industrial Hub *
            </label>
            <select
              className="form-control"
              value={selectedCity}
              onChange={(e) => {
                const found = cities.find(c => c.name === e.target.value);
                if (found) handleCitySelect(found);
              }}
              disabled={!selectedState || cities.length === 0}
              style={{ fontWeight: 600 }}
            >
              {!selectedState ? (
                <option value="">Select State First</option>
              ) : (
                cities.map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))
              )}
            </select>
          </div>

          {/* Step 3: Address / Landmark Search */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 700, color: '#fff' }}>
              Search Place or GIDC Estate
            </label>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.4rem' }}>
              <input
                type="text"
                className="form-control"
                placeholder={`Search in ${selectedCity || 'city'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ fontSize: '0.82rem' }}
              />
              <button 
                type="submit" 
                className="btn btn-secondary btn-sm"
                disabled={isSearching}
                style={{ padding: '0 0.85rem' }}
              >
                <Search size={14} />
              </button>
            </form>
          </div>

        </div>

        {searchError && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <AlertCircle size={13} />
            <span>{searchError}</span>
          </div>
        )}

        {/* Major Industrial Hubs Shortcuts for Selected City */}
        {activeCityHubs.length > 0 && (
          <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>
              Known Industrial Hubs:
            </span>
            {activeCityHubs.map(hub => (
              <button
                key={hub}
                type="button"
                className="badge"
                style={{
                  background: 'rgba(139, 92, 246, 0.12)',
                  border: '1px solid rgba(139, 92, 246, 0.35)',
                  color: '#c4b5fd',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                  padding: '3px 8px'
                }}
                onClick={() => handleHubClick(hub)}
              >
                🏭 {hub}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Container + Layer Legend */}
      <div style={{ position: 'relative' }}>
        <div 
          ref={mapRef} 
          style={{ 
            height: 480, 
            width: '100%', 
            borderRadius: 8, 
            border: '1px solid rgba(255, 255, 255, 0.12)',
            zIndex: 1
          }} 
        />

        {/* Legend Overlay */}
        <div style={{
          position: 'absolute',
          bottom: 15,
          left: 15,
          background: 'rgba(9, 13, 22, 0.88)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 6,
          padding: '0.6rem 0.85rem',
          zIndex: 400,
          fontSize: '0.7rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem'
        }}>
          <span style={{ fontWeight: 700, color: '#fff', marginBottom: 2 }}>Reference GIS Layers:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#67e8f9' }}>
            <span style={{ width: 10, height: 10, background: '#0891b2', borderRadius: 2, display: 'inline-block' }}></span>
            <span>Water Bodies (Rivers / Canals)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#c4b5fd' }}>
            <span style={{ width: 10, height: 10, background: '#7c3aed', borderRadius: 2, display: 'inline-block' }}></span>
            <span>Industrial Estates (GIDC / MIDC)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fcd34d' }}>
            <span style={{ width: 10, height: 10, background: '#d97706', borderRadius: 2, display: 'inline-block' }}></span>
            <span>Residential Communities</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#6ee7b7' }}>
            <span style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%', display: 'inline-block' }}></span>
            <span>Ambient Monitoring Stations</span>
          </div>
        </div>
      </div>

      {/* Step 4: Confirmation Card with Exact Coordinates */}
      <div className="card" style={{
        padding: '1.25rem',
        background: '#090d16',
        border: '1px solid var(--primary)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={18} color="var(--primary)" />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)' }}>
              Step 3 & 4: Selected Factory Coordinates
            </span>
          </div>
          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
            {locationName}
          </h4>
          <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
            <span>State: <strong style={{ color: '#fff' }}>{selectedState}</strong></span>
            <span>City: <strong style={{ color: '#fff' }}>{selectedCity}</strong></span>
            <span>Latitude: <strong style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>{latitude.toFixed(6)}</strong></span>
            <span>Longitude: <strong style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>{longitude.toFixed(6)}</strong></span>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          style={{ padding: '0.85rem 1.75rem', fontSize: '0.95rem' }}
          onClick={handleConfirm}
        >
          <CheckCircle2 size={18} />
          <span>Confirm Factory Location</span>
        </button>
      </div>

    </div>
  );
}
