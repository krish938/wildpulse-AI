/**
 * components/WeatherCard.jsx
 * Displays real-time weather conditions for a selected location.
 *
 * Props:
 *   weather  {Object|null} — normalized weather data from Open-Meteo via /api/weather
 *   loading  {boolean}     — true while fetching
 *   error    {string|null} — error message if fetch failed (optional, can also be in weather.error)
 *
 * Data source: Open-Meteo (open-meteo.com) — free, no API key
 *
 * What each field means:
 *   temperature       °C at 2m above ground
 *   feelsLike         apparent temperature (wind chill / heat index)
 *   humidity          relative humidity %
 *   windSpeed         km/h at 10m
 *   windDirection     degrees (0=N, 90=E, 180=S, 270=W)
 *   precipitation     mm (current period)
 *   weatherCode       WMO code (0 = clear sky, 95 = thunderstorm, etc.)
 *   weatherCategory   'clear'|'cloudy'|'rain'|'snow'|'storm'|'fog'
 *   timestamp         local time string from Open-Meteo
 */

import { Thermometer, Droplets, Wind, CloudRain, MapPin, Sun, Cloud, CloudSnow, Zap } from 'lucide-react';

// ─── Weather Category → Icon ──────────────────────────────────────────────────
const WeatherIcon = ({ category, size = 18 }) => {
  const props = { size, strokeWidth: 1.75 };
  switch (category) {
    case 'clear':  return <Sun {...props} color="#f59e0b" />;
    case 'cloudy': return <Cloud {...props} color="#8b97b8" />;
    case 'rain':   return <CloudRain {...props} color="#06b6d4" />;
    case 'snow':   return <CloudSnow {...props} color="#a78bfa" />;
    case 'storm':  return <Zap {...props} color="#f59e0b" />;
    default:       return <Cloud {...props} color="#8b97b8" />;
  }
};

// ─── Wind direction degrees → compass label ───────────────────────────────────
const toCompassLabel = (degrees) => {
  if (degrees === null || degrees === undefined) return '—';
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(degrees / 45) % 8];
};

// ─── Single metric row ─────────────────────────────────────────────────────────
const Metric = ({ icon: Icon, iconColor, label, value, unit, subValue }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0.5rem 0',
    borderBottom: '1px solid var(--border-color)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
      <Icon size={13} color={iconColor} strokeWidth={2} />
      <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>{label}</span>
    </div>
    <div style={{ textAlign: 'right' }}>
      <span style={{
        fontWeight: 700, color: 'var(--text-primary)',
        fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums',
      }}>
        {value !== null && value !== undefined && value !== '' ? `${value}${unit}` : '—'}
      </span>
      {subValue && (
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 1 }}>
          {subValue}
        </div>
      )}
    </div>
  </div>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const WeatherSkeleton = () => (
  <div className="card" style={{ padding: '1.125rem' }}>
    {/* Header skeleton */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.875rem' }}>
      <div className="skeleton" style={{ width: 34, height: 34, borderRadius: '50%' }} />
      <div>
        <div className="skeleton" style={{ width: 110, height: 13, marginBottom: 5 }} />
        <div className="skeleton" style={{ width: 70, height: 10 }} />
      </div>
    </div>
    {/* Big temperature skeleton */}
    <div className="skeleton" style={{ width: 80, height: 32, borderRadius: 8, marginBottom: '1rem' }} />
    {/* Metrics skeleton */}
    {[1, 2, 3].map((i) => (
      <div key={i} style={{
        display: 'flex', justifyContent: 'space-between',
        padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)',
      }}>
        <div className="skeleton" style={{ width: 80, height: 11 }} />
        <div className="skeleton" style={{ width: 50, height: 11 }} />
      </div>
    ))}
  </div>
);

// ─── Main WeatherCard ─────────────────────────────────────────────────────────
const WeatherCard = ({ weather, loading, error }) => {
  // Loading state — show skeleton
  if (loading) return <WeatherSkeleton />;

  // Error state
  if (error) {
    return (
      <div className="card" style={{ padding: '1.125rem' }}>
        <div className="section-title" style={{ fontSize: '0.82rem', marginBottom: '0.5rem' }}>
          <Thermometer size={14} color="var(--text-muted)" /> Weather
        </div>
        <div className="alert-error">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  // Empty state — no location selected yet
  if (!weather) {
    return (
      <div className="card" style={{ padding: '1.125rem', textAlign: 'center' }}>
        <MapPin size={26} color="var(--text-muted)" style={{ marginBottom: '0.625rem' }} />
        <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
          No location selected
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: 1.55 }}>
          Click anywhere on the map to load current weather conditions
        </div>
      </div>
    );
  }

  // Handle error embedded in weather object (legacy support)
  if (weather.error) {
    return (
      <div className="card" style={{ padding: '1.125rem' }}>
        <div className="section-title" style={{ fontSize: '0.82rem', marginBottom: '0.5rem' }}>
          <Thermometer size={14} color="var(--text-muted)" /> Weather
        </div>
        <div className="alert-error">
          <span>{weather.error}</span>
        </div>
      </div>
    );
  }

  const windLabel = toCompassLabel(weather.windDirection);
  const windSubValue = weather.windDirection !== null
    ? `${windLabel} · ${weather.windDirection}°`
    : null;

  // Format timestamp for display
  const timeDisplay = weather.timestamp
    ? (() => {
        try {
          return new Date(weather.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
          return weather.timestamp;
        }
      })()
    : null;

  return (
    <div className="card" style={{ padding: '1.125rem', animation: 'fade-in 0.25s ease' }}>
      {/* Header: icon + condition + timezone */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', marginBottom: '0.875rem' }}>
        <div style={{
          width: 36, height: 36,
          background: 'var(--bg-elevated)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <WeatherIcon category={weather.weatherCategory} size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
            Current Conditions
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {weather.weatherDescription}
            {weather.timezone ? ` · ${weather.timezone}` : ''}
            {timeDisplay ? ` · ${timeDisplay}` : ''}
          </div>
        </div>
      </div>

      {/* Big temperature display */}
      {weather.temperature !== null && (
        <div style={{ marginBottom: '0.875rem' }}>
          <div style={{
            fontSize: '2rem', fontWeight: 800, lineHeight: 1,
            color: weather.temperature > 35 ? '#ef4444'
                 : weather.temperature > 25 ? '#f97316'
                 : weather.temperature > 15 ? '#f59e0b'
                 : '#06b6d4',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {weather.temperature.toFixed(1)}°C
          </div>
          {weather.feelsLike !== null && weather.feelsLike !== undefined && (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 3 }}>
              Feels like {weather.feelsLike.toFixed(1)}°C
            </div>
          )}
        </div>
      )}

      {/* Metrics */}
      <Metric
        icon={Droplets} iconColor="#06b6d4"
        label="Humidity"
        value={weather.humidity}
        unit="%"
      />
      <Metric
        icon={Wind} iconColor="#a78bfa"
        label="Wind Speed"
        value={weather.windSpeed?.toFixed(1)}
        unit=" km/h"
        subValue={windSubValue}
      />
      <Metric
        icon={CloudRain} iconColor="#22c55e"
        label="Precipitation"
        value={weather.precipitation?.toFixed(1)}
        unit=" mm"
      />

      {/* Data source attribution */}
      <div style={{
        marginTop: '0.75rem', paddingTop: '0.625rem',
        borderTop: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: '0.65rem', color: 'var(--text-muted)',
      }}>
        <span>
          Source:{' '}
          <a
            href="https://open-meteo.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--color-teal)', textDecoration: 'none' }}
          >
            Open-Meteo
          </a>
        </span>
        {weather.weatherCode !== null && (
          <span>WMO code: {weather.weatherCode}</span>
        )}
      </div>
    </div>
  );
};

export default WeatherCard;
