/**
 * pages/RiskPrediction.jsx
 * Wildfire Risk Prediction page.
 *
 * Flow:
 *   1. User enters coordinates (or picks a preset, or uses GPS)
 *   2. Click "Analyze" → POST /api/risk → weather + FIRMS hotspots + risk engine
 *   3. Results shown in RiskCard (gauge + factor breakdown) and WeatherCard
 *   4. "How risk is calculated" section explains the model transparently
 *
 * The page fetches risk and weather in a single call to /api/risk because
 * the risk engine already calls Open-Meteo internally. No duplicate requests.
 */

import { useState, useCallback } from 'react';
import { AlertTriangle, MapPin, Crosshair, Search, ChevronRight, Info, Flame } from 'lucide-react';
import RiskCard   from '../components/RiskCard';
import WeatherCard from '../components/WeatherCard';
import { getRisk } from '../services/api';

// ─── Preset locations for quick testing ──────────────────────────────────────
const PRESETS = [
  { label: '🇮🇳 Bangalore',       lat: 12.9716,  lon: 77.5946  },
  { label: '🇮🇳 Bandipur Forest', lat: 11.6707,  lon: 76.6341  },
  { label: '🇺🇸 Los Angeles',     lat: 34.0522,  lon: -118.2437 },
  { label: '🇦🇺 Sydney',          lat: -33.8688, lon: 151.2093  },
  { label: '🇧🇷 Amazon',          lat: -3.4653,  lon: -62.2159  },
  { label: '🇵🇹 Lisbon',          lat: 38.7223,  lon: -9.1393   },
  { label: '🇿🇦 Kruger NP',       lat: -24.0,    lon: 31.5      },
  { label: '🇺🇸 Yosemite',        lat: 37.8651,  lon: -119.5383 },
];

// ─── Weight display config (matches constants.js) ─────────────────────────────
const WEIGHT_INFO = [
  { factor: '🌡️ Temperature',   weight: 25, desc: 'High temperatures dry out vegetation and increase ignition risk' },
  { factor: '💧 Humidity',      weight: 20, desc: 'Low humidity desiccates fine fuels (grass, leaves) — critical factor' },
  { factor: '💨 Wind Speed',    weight: 20, desc: 'Wind supplies oxygen, accelerates spread, and lofts burning embers' },
  { factor: '🌧️ Precipitation', weight: 15, desc: 'Recent rainfall raises fuel moisture, strongly suppressing fire' },
  { factor: '🔥 Fire Activity', weight: 20, desc: 'Nearby NASA FIRMS hotspots — fire count, FRP intensity, confidence' },
];

// ─── RiskPrediction Page ──────────────────────────────────────────────────────
const RiskPrediction = () => {
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');

  const [result,  setResult]  = useState(null);   // Full API response
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAnalyze = useCallback(async (overrideLat, overrideLon) => {
    const parsedLat = parseFloat(overrideLat ?? lat);
    const parsedLon = parseFloat(overrideLon ?? lon);

    if (isNaN(parsedLat) || isNaN(parsedLon)) {
      setError('Please enter valid latitude and longitude values.');
      return;
    }
    if (parsedLat < -90 || parsedLat > 90) {
      setError('Latitude must be between -90 and 90.');
      return;
    }
    if (parsedLon < -180 || parsedLon > 180) {
      setError('Longitude must be between -180 and 180.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await getRisk(parsedLat, parsedLon);
      setResult(res.data);     // Full response: { weather, risk, nearbyFireCount, ... }
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.displayMessage ||
        'Failed to retrieve risk data. Check that the backend is running.'
      );
    } finally {
      setLoading(false);
    }
  }, [lat, lon]);

  // Select a preset and immediately analyze it
  const handlePreset = (preset) => {
    setLat(preset.lat.toString());
    setLon(preset.lon.toString());
    handleAnalyze(preset.lat.toString(), preset.lon.toString());
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLon(pos.coords.longitude.toFixed(6));
      },
      () => setError('Could not get your location. Please enter coordinates manually.')
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAnalyze();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 1040, margin: '0 auto' }}>

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>
          <AlertTriangle size={20} style={{ display: 'inline', marginRight: '0.5rem', color: 'var(--color-fire)' }} />
          Wildfire <span className="gradient-text">Risk Prediction</span>
        </h1>
        <p style={{ margin: '0.3rem 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Enter any location to analyse current wildfire risk using real weather data and NASA satellite hotspots.
        </p>
      </div>

      {/* ── Input Card ──────────────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="section-title" style={{ marginBottom: '1rem' }}>
          <MapPin size={15} color="var(--color-teal)" /> Location Input
        </div>

        {/* Coordinate fields */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr auto',
          gap: '0.75rem', alignItems: 'end',
          marginBottom: '1rem',
        }}>
          <div>
            <label className="form-label">Latitude</label>
            <input
              type="number"
              className="input-field"
              placeholder="e.g. 12.9716"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              onKeyDown={handleKeyDown}
              step="any"
              min="-90"
              max="90"
            />
          </div>
          <div>
            <label className="form-label">Longitude</label>
            <input
              type="number"
              className="input-field"
              placeholder="e.g. 77.5946"
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              onKeyDown={handleKeyDown}
              step="any"
              min="-180"
              max="180"
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleMyLocation}
              className="btn-secondary"
              title="Use my current location"
              aria-label="Use my location"
            >
              <Crosshair size={15} />
            </button>
            <button
              onClick={() => handleAnalyze()}
              className="btn-primary"
              disabled={loading}
              style={{ whiteSpace: 'nowrap' }}
            >
              {loading
                ? 'Analysing…'
                : <><Search size={14} /> Analyse</>
              }
            </button>
          </div>
        </div>

        {/* Preset buttons */}
        <div>
          <div style={{
            fontSize: '0.72rem', color: 'var(--text-muted)',
            marginBottom: '0.4rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '0.3rem',
          }}>
            <ChevronRight size={11} /> Quick presets (click to analyse):
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => handlePreset(p)}
                className="btn-secondary"
                disabled={loading}
                style={{ padding: '0.28rem 0.7rem', fontSize: '0.73rem', borderRadius: 9999 }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            marginTop: '0.875rem',
            color: '#fca5a5', fontSize: '0.85rem',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)',
            padding: '0.625rem 0.875rem',
            borderRadius: 8,
          }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* ── Analysis Results ─────────────────────────────────────────────────── */}
      {(result || loading) && (
        <>
          {/* Fire count banner — shown when nearby fires exist */}
          {result?.nearbyFireCount > 0 && !loading && (
            <div style={{
              marginBottom: '1rem',
              padding: '0.625rem 1rem',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 10,
              fontSize: '0.82rem',
              color: '#fca5a5',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <Flame size={14} color="#ef4444" />
              <strong>{result.nearbyFireCount}</strong> active NASA FIRMS hotspot
              {result.nearbyFireCount !== 1 ? 's' : ''} detected within{' '}
              <strong>{result.nearbyFireRadius} km</strong> of this location.
            </div>
          )}

          {/* Side-by-side: RiskCard + WeatherCard */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,0.9fr)',
            gap: '1.25rem',
            alignItems: 'start',
          }}>
            <RiskCard  risk={result?.risk}    loading={loading} />
            <WeatherCard
              weather={result?.weather}
              loading={loading}
              error={result?.weather?.error ? result.weather.error : null}
            />
          </div>
        </>
      )}

      {/* ── How Risk is Calculated ───────────────────────────────────────────── */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="section-title" style={{ marginBottom: '0.75rem' }}>
          <Info size={15} color="var(--color-yellow)" /> How Risk is Calculated
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.7, margin: '0 0 1rem' }}>
          The WildPulse risk engine scores each factor independently (0–100), then combines them
          using configurable weights into an overall score.{' '}
          <strong>This is an educational prototype</strong> — not a validated scientific fire-danger forecast.
          Real weather data comes from{' '}
          <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer"
             style={{ color: 'var(--color-teal)', textDecoration: 'none' }}>Open-Meteo</a>.
          Fire hotspots come from{' '}
          <a href="https://firms.modaps.eosdis.nasa.gov" target="_blank" rel="noopener noreferrer"
             style={{ color: 'var(--color-teal)', textDecoration: 'none' }}>NASA FIRMS</a>.
        </p>

        {/* Weight breakdown cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))',
          gap: '0.75rem',
        }}>
          {WEIGHT_INFO.map(({ factor, weight, desc }) => (
            <div key={factor} className="card-sm" style={{ borderRadius: 10 }}>
              <div style={{ fontWeight: 700, marginBottom: '0.2rem', fontSize: '0.82rem' }}>
                {factor}
              </div>
              <div style={{
                color: 'var(--color-fire)', fontWeight: 800,
                fontSize: '1.25rem', marginBottom: '0.2rem', lineHeight: 1,
              }}>
                {weight}%
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', lineHeight: 1.5 }}>
                {desc}
              </div>
            </div>
          ))}
        </div>

        {/* Risk level legend */}
        <div style={{ marginTop: '1rem' }}>
          <div style={{
            fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '0.5rem',
          }}>
            Risk levels
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { level: 'LOW',      range: '0–24',  color: '#22c55e', desc: 'Conditions unfavourable for fire' },
              { level: 'MODERATE', range: '25–49', color: '#f59e0b', desc: 'Some factors elevated' },
              { level: 'HIGH',     range: '50–74', color: '#f97316', desc: 'Multiple high-risk factors' },
              { level: 'EXTREME',  range: '75–100',color: '#ef4444', desc: 'Critical fire conditions' },
            ].map(({ level, range, color, desc }) => (
              <div key={level} style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                background: `${color}10`, border: `1px solid ${color}35`,
                borderRadius: 8, flex: '1 1 160px',
              }}>
                <div style={{
                  minWidth: 8, height: 8, borderRadius: '50%',
                  background: color, marginTop: 4,
                }} />
                <div>
                  <div style={{ fontWeight: 800, color, fontSize: '0.75rem' }}>
                    {level} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>({range})</span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskPrediction;
