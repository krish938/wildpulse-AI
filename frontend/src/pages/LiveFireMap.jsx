/**
 * pages/LiveFireMap.jsx
 * Interactive wildfire map powered by real NASA FIRMS satellite data.
 *
 * Performance-aware version:
 * - Filters API response to India & nearby region (lat 6–37, lon 68–98)
 * - Caps rendered markers at MAX_MARKERS (default 500) to prevent browser freeze
 * - Popups are lazily rendered only when a marker is clicked
 * - Fire filtering & transformation use useMemo to avoid re-computation
 * - Data is fetched ONCE on mount; manual "Refresh Fire Data" button for updates
 *
 * Data Flow:
 * Component mounts → GET /api/fires → client-side filter (India region) →
 * cap to 500 → CircleMarkers plotted on Leaflet map
 *
 * Click on map → parallel requests:
 *   GET /api/weather?latitude=...&longitude=... → Open-Meteo real weather
 *   GET /api/risk?latitude=...&longitude=...   → wildfire risk engine
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  MapContainer, TileLayer, CircleMarker, Popup, useMapEvents,
} from 'react-leaflet';
import {
  Flame, Crosshair, AlertTriangle, RefreshCw, Info, Map,
  Satellite, Clock, Zap, Thermometer, Wind,
} from 'lucide-react';
import WeatherCard from '../components/WeatherCard';
import RiskCard from '../components/RiskCard';
import useWeather from '../hooks/useWeather';
import { getFireHotspots, getRisk } from '../services/api';

// ─── Performance constants ────────────────────────────────────────────────────
// India & nearby region bounding box
const REGION_LAT_MIN = 6;
const REGION_LAT_MAX = 37;
const REGION_LON_MIN = 68;
const REGION_LON_MAX = 98;
// Maximum markers rendered on the map at once
const MAX_MARKERS = 500;

// ─── Map Click Handler ────────────────────────────────────────────────────────
// Must be rendered inside <MapContainer> to access the Leaflet event system
const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// ─── Marker Colour / Size — based on Fire Radiative Power (MW) ───────────────
const getMarkerStyle = (frp) => {
  if (frp > 200) return { color: '#ef4444', radius: 8 }; // Extreme
  if (frp > 50)  return { color: '#f97316', radius: 6 }; // High
  if (frp > 10)  return { color: '#f59e0b', radius: 5 }; // Moderate
  return               { color: '#fbbf24', radius: 4 };  // Low
};

// ─── Confidence display helper ────────────────────────────────────────────────
const confidenceBadgeStyle = (conf) => {
  const c = (conf || '').toLowerCase();
  if (c === 'high' || c === 'h')    return { bg: 'rgba(34,197,94,0.15)',  color: '#4ade80' };
  if (c === 'nominal' || c === 'n') return { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' };
  return                                   { bg: 'rgba(99,102,241,0.15)',  color: '#a78bfa' };
};

// ─── NASA FIRMS Hotspot Popup ────────────────────────────────────────────────
const FirePopup = ({ fire, onAnalyzeRisk }) => {
  const confStyle = confidenceBadgeStyle(fire.confidence);
  const { color } = getMarkerStyle(fire.frp);

  return (
    <div style={{ minWidth: 220, maxWidth: 260, fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${color}22, ${color}10)`,
        borderBottom: '1px solid var(--border-color)',
        padding: '0.75rem 1rem 0.6rem',
        borderRadius: '12px 12px 0 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
          <Flame size={14} color={color} />
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f0f4ff' }}>
            NASA FIRMS Hotspot
          </span>
        </div>
        <div style={{ fontSize: '0.7rem', color: '#8b97b8' }}>
          {fire.latitude?.toFixed(5)}, {fire.longitude?.toFixed(5)}
        </div>
      </div>

      {/* Metrics grid */}
      <div style={{ padding: '0.75rem 1rem' }}>

        {/* FRP */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '0.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: '#8b97b8' }}>
            <Zap size={11} color="#f97316" /> FRP (Fire Power)
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.82rem', color: color }}>
            {fire.frp > 0 ? `${fire.frp.toFixed(1)} MW` : '—'}
          </span>
        </div>

        {/* Brightness */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '0.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: '#8b97b8' }}>
            <Thermometer size={11} color="#f59e0b" /> Brightness Temp
          </div>
          <span style={{ fontWeight: 600, fontSize: '0.82rem', color: '#f0f4ff' }}>
            {fire.brightness ? `${fire.brightness.toFixed(1)} K` : '—'}
          </span>
        </div>

        {/* Confidence */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '0.5rem',
        }}>
          <div style={{ fontSize: '0.72rem', color: '#8b97b8' }}>Confidence</div>
          <span style={{
            fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.06em', padding: '0.15rem 0.5rem', borderRadius: 99,
            background: confStyle.bg, color: confStyle.color,
          }}>
            {fire.confidence || 'unknown'}
          </span>
        </div>

        {/* Satellite / instrument */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '0.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: '#8b97b8' }}>
            <Satellite size={11} color="#a78bfa" /> Satellite
          </div>
          <span style={{ fontSize: '0.78rem', color: '#f0f4ff', fontWeight: 600 }}>
            {fire.satellite} / {fire.instrument}
          </span>
        </div>

        {/* Acquisition time */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '0.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: '#8b97b8' }}>
            <Clock size={11} color="#06b6d4" /> Detected
          </div>
          <span style={{ fontSize: '0.72rem', color: '#8b97b8' }}>
            {fire.acquisitionDate}{fire.acquisitionTime ? ` · ${fire.acquisitionTime}` : ''}
          </span>
        </div>

        {/* Day/Night */}
        {fire.dayNight && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '0.5rem',
          }}>
            <div style={{ fontSize: '0.72rem', color: '#8b97b8' }}>Detection</div>
            <span style={{ fontSize: '0.72rem', color: '#8b97b8' }}>
              {fire.dayNight === 'D' ? 'Daytime' : fire.dayNight === 'N' ? 'Nighttime' : fire.dayNight}
            </span>
          </div>
        )}

        {/* Dataset */}
        <div style={{
          fontSize: '0.65rem', color: '#3d4a6b',
          marginTop: '0.375rem',
          paddingTop: '0.5rem',
          borderTop: '1px solid #1f2845',
        }}>
          {fire.dataset || 'NASA FIRMS'}
        </div>
      </div>

      {/* Analyze Risk CTA */}
      <div style={{ padding: '0 1rem 0.875rem' }}>
        <button
          onClick={() => onAnalyzeRisk(fire.latitude, fire.longitude)}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #f97316, #ef4444)',
            color: 'white', border: 'none', borderRadius: 8,
            padding: '0.5rem 0', fontSize: '0.75rem',
            fontWeight: 700, cursor: 'pointer',
            letterSpacing: '0.02em',
            transition: 'opacity 0.15s',
            fontFamily: 'Inter, sans-serif',
          }}
          onMouseOver={(e) => (e.target.style.opacity = 0.85)}
          onMouseOut={(e) => (e.target.style.opacity = 1)}
        >
          Analyze Risk at This Location
        </button>
      </div>
    </div>
  );
};

// ─── Stats bar above the map ──────────────────────────────────────────────────
const FireStats = ({ fires }) => {
  const stats = useMemo(() => {
    if (!fires.length) return null;
    const extreme = fires.filter((f) => f.frp > 200).length;
    const high    = fires.filter((f) => f.frp > 50 && f.frp <= 200).length;
    const avgFrp  = fires.reduce((s, f) => s + (f.frp || 0), 0) / fires.length;
    return { extreme, high, avgFrp };
  }, [fires]);

  if (!stats) return null;

  return (
    <div style={{
      display: 'flex', gap: '0.75rem', flexWrap: 'wrap',
      marginBottom: '0.625rem', flexShrink: 0,
    }}>
      {[
        { label: 'Extreme fires', value: stats.extreme.toLocaleString(), color: '#ef4444' },
        { label: 'High intensity', value: stats.high.toLocaleString(), color: '#f97316' },
        { label: 'Avg FRP', value: `${stats.avgFrp.toFixed(1)} MW`, color: '#f59e0b' },
      ].map(({ label, value, color }) => (
        <div key={label} style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderRadius: 8, padding: '0.3rem 0.75rem',
          display: 'flex', alignItems: 'center', gap: '0.375rem',
        }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color }}>{value}</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{label}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const LiveFireMap = () => {
  const [fires, setFires]               = useState([]);
  const [loadingFires, setLoadingFires] = useState(true);
  const [firesError, setFiresError]     = useState(null);
  const [firmsConfigRequired, setFirmsConfigRequired] = useState(false);
  const [firesMetadata, setFiresMetadata] = useState(null); // {source, fetchedAt, cached, stale, warning}

  const [selectedLocation, setSelectedLocation] = useState(null);

  // ── Weather: real Open-Meteo data via useWeather hook ──────────────────────
  // Weather is fetched independently from risk — call GET /api/weather directly.
  const { weather, loading: loadingWeather, error: weatherError, fetchWeather } = useWeather();

  // ── Risk: wildfire risk engine result ──────────────────────────────────────
  const [riskData, setRiskData]       = useState(null);
  const [loadingRisk, setLoadingRisk] = useState(false);

  // ── Fetch fire hotspots from backend ──────────────────────────────────────
  const fetchFires = useCallback(async (forceRefresh = false) => {
    setLoadingFires(true);
    setFiresError(null);
    try {
      const res = await getFireHotspots(forceRefresh);
      const payload = res.data;

      if (payload.success) {
        setFires(payload.data || []);
        setFiresMetadata({
          source:        payload.source,
          fetchedAt:     payload.fetchedAt,
          cached:        payload.cached,
          stale:         payload.stale,
          cacheExpiresAt: payload.cacheExpiresAt,
          warning:       payload.warning,
          count:         payload.count,
          attribution:   payload.attribution,
        });
        setFirmsConfigRequired(false);
      } else {
        setFires([]);
        setFiresError(payload.error);
        setFirmsConfigRequired(payload.configurationRequired || false);
        setFiresMetadata(null);
      }
    } catch (err) {
      setFiresError('Cannot connect to backend. Make sure the backend server is running on port 5000.');
    } finally {
      setLoadingFires(false);
    }
  }, []);

  // ── Fetch weather + risk for a clicked location ────────────────────────────
  // Weather and risk are fetched in parallel for speed.
  // Weather goes to GET /api/weather → Open-Meteo (real data, no API key)
  // Risk goes to GET /api/risk → uses weather internally + FIRMS hotspot count
  const fetchLocationRisk = useCallback(async (lat, lon) => {
    setSelectedLocation({ lat, lon });
    setLoadingRisk(true);
    setRiskData(null);

    // Kick off weather fetch immediately (runs in background via useWeather hook)
    fetchWeather(lat, lon);

    // Fetch risk in parallel
    try {
      const res = await getRisk(lat, lon);
      setRiskData(res.data);
    } catch (err) {
      console.error('Risk fetch error:', err);
      setRiskData(null);
    } finally {
      setLoadingRisk(false);
    }
  }, [fetchWeather]);

  // Prevent double-fetch in React StrictMode
  const hasFetched = useRef(false);
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchFires(false);
  }, [fetchFires]);

  // ── Lazy popup: only render heavy FirePopup for the clicked marker ─────
  const [selectedFireIdx, setSelectedFireIdx] = useState(null);

  // ── Client-side India-region filter + marker cap (useMemo) ─────────────
  // The API returns worldwide data which would freeze the browser if all
  // rendered. Filter to India/nearby region and cap at MAX_MARKERS.
  const displayFires = useMemo(() => {
    const regionFiltered = fires.filter((f) => {
      const lat = f.latitude;
      const lon = f.longitude;
      return (
        lat >= REGION_LAT_MIN && lat <= REGION_LAT_MAX &&
        lon >= REGION_LON_MIN && lon <= REGION_LON_MAX
      );
    });

    // Sort by FRP descending so we keep the most intense fires when capping
    regionFiltered.sort((a, b) => (b.frp || 0) - (a.frp || 0));

    const capped = regionFiltered.slice(0, MAX_MARKERS);

    // Console diagnostics
    console.log(`[FIRE MAP] Total API records: ${fires.length}`);
    console.log(`[FIRE MAP] India records: ${regionFiltered.length}`);
    console.log(`[FIRE MAP] Rendered markers: ${capped.length}`);

    return capped;
  }, [fires]);

  // ── Geolocation ───────────────────────────────────────────────────────────
  const goToMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchLocationRisk(pos.coords.latitude, pos.coords.longitude),
      () => alert('Location permission denied.')
    );
  };

  // ── Subtitle line ─────────────────────────────────────────────────────────
  const subtitleText = useMemo(() => {
    if (loadingFires) return 'Loading wildfire data...';
    if (firesError) return 'Failed to load fire data';
    if (displayFires.length > 0) {
      const cached = firesMetadata?.cached ? ' (cached)' : '';
      return `${displayFires.length.toLocaleString()} wildfire detections · India region · ${firesMetadata?.source || 'NASA FIRMS'}${cached}`;
    }
    if (firmsConfigRequired) return 'NASA FIRMS API key not configured — click map to analyze any location';
    return 'No hotspots returned — click map to analyze any location';
  }, [loadingFires, firesError, displayFires.length, firesMetadata, firmsConfigRequired]);

  return (
    <div style={{ display: 'flex', gap: '1.25rem', height: 'calc(100vh - 100px)', maxWidth: 1400, margin: '0 auto' }}>

      {/* ── Left: Map area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '0.75rem', flexShrink: 0, flexWrap: 'wrap', gap: '0.5rem',
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Map size={20} color="var(--color-fire)" />
              Live Fire Map
            </h1>
            <p style={{ margin: '0.2rem 0 0', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
              {subtitleText}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            <button
              id="btn-my-location"
              onClick={goToMyLocation}
              className="btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.45rem 0.875rem' }}
            >
              <Crosshair size={13} /> My Location
            </button>
            <button
              id="btn-refresh-fires"
              onClick={() => fetchFires(true)}
              className="btn-secondary"
              disabled={loadingFires}
              style={{ fontSize: '0.78rem', padding: '0.45rem 0.875rem' }}
            >
              <RefreshCw
                size={13}
                style={{ animation: loadingFires ? 'spin 0.8s linear infinite' : 'none' }}
              />
              Refresh Fire Data
            </button>
          </div>
        </div>

        {/* NASA FIRMS attribution banner — always shown when data is loaded */}
        {displayFires.length > 0 && firesMetadata && (
          <div style={{
            background: 'rgba(6, 182, 212, 0.07)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            borderRadius: 10, padding: '0.45rem 0.875rem',
            fontSize: '0.72rem', color: '#67e8f9',
            marginBottom: '0.625rem', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '0.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Satellite size={12} />
              <span>
                <strong>Data source: NASA FIRMS</strong>
                {' '}· {firesMetadata.source}
                {firesMetadata.cached && <span style={{ opacity: 0.7 }}> · from cache</span>}
                {firesMetadata.stale && <span style={{ color: '#fbbf24' }}> · stale data</span>}
              </span>
            </div>
            {firesMetadata.fetchedAt && (
              <span style={{ opacity: 0.65 }}>
                Fetched: {new Date(firesMetadata.fetchedAt).toLocaleTimeString()}
              </span>
            )}
          </div>
        )}

        {/* Stale cache warning */}
        {firesMetadata?.stale && firesMetadata.warning && (
          <div className="alert-warning" style={{ marginBottom: '0.625rem', flexShrink: 0 }}>
            <AlertTriangle size={14} />
            <span>{firesMetadata.warning}</span>
          </div>
        )}

        {/* FIRMS not configured info */}
        {firmsConfigRequired && (
          <div className="alert-warning" style={{ marginBottom: '0.625rem', flexShrink: 0 }}>
            <Info size={14} style={{ flexShrink: 0 }} />
            <span>
              NASA FIRMS API key not configured. Add{' '}
              <code style={{ background: 'rgba(0,0,0,0.3)', padding: '0 4px', borderRadius: 3 }}>
                NASA_FIRMS_MAP_KEY
              </code>{' '}
              to <code style={{ background: 'rgba(0,0,0,0.3)', padding: '0 4px', borderRadius: 3 }}>
                backend/.env
              </code>{' '}
              — register free at{' '}
              <a
                href="https://firms.modaps.eosdis.nasa.gov/api/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#67e8f9', textDecoration: 'underline' }}
              >
                firms.modaps.eosdis.nasa.gov
              </a>
            </span>
          </div>
        )}

        {/* General error with Retry */}
        {firesError && !firmsConfigRequired && (
          <div className="alert-error" style={{ marginBottom: '0.625rem', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={14} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{firesError}</span>
            <button
              onClick={() => fetchFires(true)}
              className="btn-secondary"
              style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', flexShrink: 0 }}
            >
              <RefreshCw size={11} /> Retry
            </button>
          </div>
        )}

        {/* Stats bar */}
        {displayFires.length > 0 && <FireStats fires={displayFires} />}

        {/* Map */}
        <div style={{ flex: 1, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          <MapContainer
            center={[22, 82]}
            zoom={5}
            style={{ height: '100%', width: '100%' }}
            attributionControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | <a href="https://firms.modaps.eosdis.nasa.gov/" target="_blank">NASA FIRMS</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={18}
            />

            <MapClickHandler onLocationSelect={fetchLocationRisk} />

            {/* ── NASA FIRMS fire hotspot markers (filtered & capped) ─────── */}
            {displayFires.map((fire, idx) => {
              if (!fire.latitude || !fire.longitude) return null;
              const { color, radius } = getMarkerStyle(fire.frp);
              return (
                <CircleMarker
                  key={`${fire.latitude}-${fire.longitude}-${idx}`}
                  center={[fire.latitude, fire.longitude]}
                  radius={radius}
                  pathOptions={{
                    fillColor: color,
                    fillOpacity: 0.8,
                    color: color,
                    weight: 1,
                    opacity: 0.9,
                  }}
                  eventHandlers={{
                    click: () => setSelectedFireIdx(idx),
                  }}
                >
                  {/* Lazy popup: only render heavy FirePopup content for the clicked marker */}
                  <Popup
                    minWidth={220}
                    maxWidth={280}
                    className="nasa-firms-popup"
                  >
                    {selectedFireIdx === idx
                      ? <FirePopup fire={fire} onAnalyzeRisk={fetchLocationRisk} />
                      : <div style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#8b97b8' }}>Loading…</div>
                    }
                  </Popup>
                </CircleMarker>
              );
            })}

            {/* ── Selected location indicator ───────────────────────────────── */}
            {selectedLocation && (
              <CircleMarker
                center={[selectedLocation.lat, selectedLocation.lon]}
                radius={13}
                pathOptions={{
                  fillColor: '#06b6d4',
                  fillOpacity: 0.2,
                  color: '#06b6d4',
                  weight: 2,
                  dashArray: '5, 5',
                }}
              />
            )}
          </MapContainer>
        </div>

        {/* Legend */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1rem',
          marginTop: '0.625rem', flexShrink: 0, flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
            {[
              { color: '#fbbf24', label: 'Low (< 10 MW)' },
              { color: '#f59e0b', label: 'Moderate (10–50 MW)' },
              { color: '#f97316', label: 'High (50–200 MW)' },
              { color: '#ef4444', label: 'Extreme (> 200 MW)' },
              { color: '#06b6d4', label: 'Selected location' },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }} />
                {label}
              </div>
            ))}
          </div>

          {/* Compact attribution */}
          {displayFires.length > 0 && (
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', flexShrink: 0 }}>
              <a
                href="https://firms.modaps.eosdis.nasa.gov/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--color-teal)', opacity: 0.8 }}
              >
                NASA FIRMS
              </a>
              {' '}· FRP = Fire Radiative Power (MW)
            </div>
          )}
        </div>
      </div>

      {/* ── Right panel: weather + risk ──────────────────────────────────────── */}
      <div style={{
        width: 295, flexShrink: 0,
        display: 'flex', flexDirection: 'column', gap: '1rem',
        overflowY: 'auto',
      }}>

        {/* Location section */}
        <div>
          <div className="section-title" style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>
            <Flame size={14} color="var(--color-fire)" />
            Selected Location
          </div>
          {selectedLocation ? (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              {selectedLocation.lat.toFixed(5)}, {selectedLocation.lon.toFixed(5)}
            </div>
          ) : (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              Click the map or a fire marker to analyze a location
            </div>
          )}
        </div>

        {/* Weather card: real Open-Meteo data from /api/weather */}
        <WeatherCard
          weather={weather}
          loading={loadingWeather}
          error={weatherError}
        />
        {/* Risk card: wildfire risk engine from /api/risk */}
        <RiskCard risk={riskData?.risk} loading={loadingRisk} />

        {/* NASA FIRMS info footer in sidebar */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 12, padding: '0.875rem',
          marginTop: 'auto',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            marginBottom: '0.5rem',
          }}>
            <Satellite size={13} color="var(--color-teal)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Data Source
            </span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>
            Fire hotspots: <span style={{ color: 'var(--color-teal)' }}>NASA FIRMS</span>
            <br />
            Satellites: VIIRS (Suomi-NPP / NOAA-20 / NOAA-21), MODIS
            <br />
            Latency: Near-Real-Time (NRT)
            <br />
            Cache: refreshed every 10 minutes
          </div>
          {firesMetadata?.count !== undefined && (
            <div style={{
              marginTop: '0.5rem', paddingTop: '0.5rem',
              borderTop: '1px solid var(--border-color)',
              fontSize: '0.7rem', color: 'var(--text-muted)',
            }}>
              {firesMetadata.count.toLocaleString()} hotspots ·{' '}
              <span style={{ color: 'var(--text-secondary)' }}>
                {firesMetadata.source}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveFireMap;
