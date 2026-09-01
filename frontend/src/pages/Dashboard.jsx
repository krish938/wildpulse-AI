/**
 * pages/Dashboard.jsx
 * Main dashboard: stats, map CTA, weather sidebar, risk sidebar, recent reports.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, AlertTriangle, FileText, Zap, Map, RefreshCw, Clock } from 'lucide-react';
import StatCard     from '../components/StatCard';
import WeatherCard  from '../components/WeatherCard';
import RiskCard     from '../components/RiskCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { getFireHotspots, getRisk, getReports } from '../services/api';

const DEFAULT_LAT  = 12.9716;
const DEFAULT_LON  = 77.5946;
const DEFAULT_CITY = 'Bangalore, India';

/* ─── Severity badge ─────────────────────────────────────────────────────── */
const SeverityBadge = ({ severity }) => {
  const map = {
    extreme:  { bg: 'rgba(239,68,68,0.15)',  color: '#ef4444' },
    high:     { bg: 'rgba(249,115,22,0.15)', color: '#f97316' },
    moderate: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
    low:      { bg: 'rgba(34,197,94,0.15)',  color: '#22c55e' },
  };
  const { bg, color } = map[severity] ?? map.low;
  return (
    <span style={{
      padding: '0.18rem 0.55rem', borderRadius: 9999,
      fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
      background: bg, color,
    }}>
      {severity}
    </span>
  );
};

/* ─── Report row ─────────────────────────────────────────────────────────── */
const ReportRow = ({ report }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0.625rem 0.875rem',
    background: 'var(--bg-secondary)',
    borderRadius: 10,
    gap: '0.75rem',
  }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8rem',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        marginBottom: '0.1rem',
      }}>
        {report.location?.placeName || `${report.location?.latitude?.toFixed(2)}, ${report.location?.longitude?.toFixed(2)}`}
      </div>
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
        {new Date(report.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
      </div>
    </div>
    <SeverityBadge severity={report.severity} />
  </div>
);

/* ─── Main component ─────────────────────────────────────────────────────── */
const Dashboard = () => {
  const navigate = useNavigate();

  const [fires,   setFires]   = useState([]);
  const [risk,    setRisk]    = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [apiStatus, setApiStatus] = useState({ fires: null, risk: null, reports: null });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [firesRes, riskRes, reportsRes] = await Promise.allSettled([
      getFireHotspots(),
      getRisk(DEFAULT_LAT, DEFAULT_LON),
      getReports({ limit: 5 }),
    ]);

    if (firesRes.status === 'fulfilled' && firesRes.value.data?.success) {
      setFires(firesRes.value.data.data || []);
      setApiStatus(s => ({ ...s, fires: 'ok' }));
    } else {
      setApiStatus(s => ({ ...s, fires: 'warn' }));
    }

    if (riskRes.status === 'fulfilled') {
      setRisk(riskRes.value.data);
      setApiStatus(s => ({ ...s, risk: 'ok' }));
    } else {
      setApiStatus(s => ({ ...s, risk: 'error' }));
    }

    if (reportsRes.status === 'fulfilled') {
      setReports(reportsRes.value.data?.data || []);
      setApiStatus(s => ({ ...s, reports: 'ok' }));
    } else {
      setApiStatus(s => ({ ...s, reports: 'warn' }));
    }

    setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Derived stats from real data
  const highConfFires = fires.filter(f =>
    f.confidence === 'high' || f.confidence === 'h' || parseFloat(f.confidence) > 70
  ).length;
  const extremeFires = fires.filter(f => (f.frp || 0) > 200).length;

  return (
    <div style={{ maxWidth: 1400 }}>
      {/* ── Page header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            🔥 Wildfire <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="page-subtitle">
            Near-real-time monitoring · Default location: {DEFAULT_CITY}
            {lastUpdated && (
              <span style={{ color: 'var(--text-muted)', marginLeft: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={11} /> Updated {lastUpdated}
              </span>
            )}
          </p>
        </div>
        <button onClick={fetchAll} className="btn-secondary" disabled={loading} style={{ flexShrink: 0 }}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 0.75s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="stats-grid">
        <StatCard icon={Flame}         value={loading ? null : fires.length.toLocaleString()}         label="Active Hotspots"         color="#f97316" loading={loading} sublabel={fires.length > 0 ? 'NASA FIRMS' : apiStatus.fires === 'warn' ? 'No key set' : null} />
        <StatCard icon={AlertTriangle} value={loading ? null : highConfFires.toLocaleString()}        label="High Confidence Fires"   color="#f59e0b" loading={loading} />
        <StatCard icon={Zap}           value={loading ? null : extremeFires.toLocaleString()}         label="Extreme Intensity (FRP>200)" color="#ef4444" loading={loading} />
        <StatCard icon={FileText}      value={loading ? null : reports.length.toLocaleString()}       label="Community Reports"       color="#10b981" loading={loading} sublabel={apiStatus.reports === 'warn' ? 'DB not connected' : null} />
      </div>

      {/* ── Main grid: left + right sidebar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.125rem', alignItems: 'start' }}>

        {/* ── Left column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>

          {/* Map CTA card */}
          <div
            className="card"
            onClick={() => navigate('/map')}
            style={{
              minHeight: 340,
              cursor: 'pointer',
              background: 'linear-gradient(145deg, #0d1b2d 0%, #111a30 60%, #0b131f 100%)',
              border: '1px solid rgba(249,115,22,0.2)',
              position: 'relative', overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(249,115,22,0.45)'; e.currentTarget.style.boxShadow = '0 4px 32px rgba(249,115,22,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(249,115,22,0.2)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            {/* Grid overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'linear-gradient(rgba(249,115,22,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.04) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              pointerEvents: 'none',
            }} />

            {/* Bottom glow */}
            <div style={{
              position: 'absolute', bottom: -60, left: '50%', transform: 'translateX(-50%)',
              width: 400, height: 180,
              background: 'radial-gradient(ellipse, rgba(249,115,22,0.12) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div style={{
              position: 'relative', flex: 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '2.5rem', textAlign: 'center',
            }}>
              <div style={{
                width: 68, height: 68, borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(249,115,22,0.25), rgba(239,68,68,0.15))',
                border: '1px solid rgba(249,115,22,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1.25rem',
                boxShadow: '0 0 24px rgba(249,115,22,0.2)',
              }}>
                <Map size={30} color="var(--color-fire)" />
              </div>

              <h2 style={{ margin: '0 0 0.625rem', fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                🔥 Live Fire Map
              </h2>

              <p style={{ color: 'var(--text-secondary)', margin: '0 0 1.5rem', fontSize: '0.875rem', maxWidth: 380, lineHeight: 1.7 }}>
                {loading ? 'Fetching satellite data…' :
                  fires.length > 0
                    ? `${fires.length.toLocaleString()} hotspots detected via NASA FIRMS satellite. Click to explore the interactive map.`
                    : 'Interactive Leaflet map with NASA FIRMS hotspots and click-to-analyze location risk.'
                }
              </p>

              {loading
                ? <LoadingSpinner size="sm" message="Connecting to satellite API…" />
                : (
                  <button className="btn-primary" style={{ fontSize: '0.9rem', padding: '0.7rem 1.875rem' }}>
                    <Map size={16} /> Open Interactive Map
                  </button>
                )
              }

              {fires.length > 0 && !loading && (
                <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem' }}>
                  {[
                    { label: 'Day detections',  value: fires.filter(f => f.dayNight === 'D').length },
                    { label: 'Night detections', value: fires.filter(f => f.dayNight === 'N').length },
                    { label: 'Source',           value: fires[0]?.satellite || 'VIIRS' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 800, color: 'var(--color-fire)', fontSize: '1.125rem', letterSpacing: '-0.02em' }}>{value}</div>
                      <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent reports */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
              <div className="section-title" style={{ marginBottom: 0, fontSize: '0.875rem' }}>
                <FileText size={14} color="var(--color-teal)" /> Recent Community Reports
              </div>
              <button onClick={() => navigate('/reports')} className="btn-ghost" style={{ fontSize: '0.75rem' }}>
                View All →
              </button>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 10 }} />)}
              </div>
            ) : reports.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', padding: '1.5rem' }}>
                No community reports yet.{' '}
                <span
                  onClick={(e) => { e.stopPropagation(); navigate('/report'); }}
                  style={{ color: 'var(--color-fire)', cursor: 'pointer', fontWeight: 600 }}
                >
                  Be the first →
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {reports.map(r => <ReportRow key={r._id} report={r} />)}
              </div>
            )}
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <WeatherCard weather={risk?.weather} loading={loading} />
          <RiskCard    risk={risk?.risk}       loading={loading} />

          {/* Quick actions */}
          <div className="card" style={{ padding: '1rem' }}>
            <div className="section-title" style={{ fontSize: '0.78rem', marginBottom: '0.625rem' }}>
              Quick Actions
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {[
                { label: '🗺 Open Live Map',      to: '/map' },
                { label: '🔮 Predict Risk',        to: '/risk' },
                { label: '🚨 Report a Fire',       to: '/report' },
                { label: '📊 View Analytics',      to: '/analytics' },
              ].map(({ label, to }) => (
                <button key={to} onClick={() => navigate(to)} style={{
                  textAlign: 'left', padding: '0.5rem 0.625rem',
                  background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                  borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-secondary)',
                  fontFamily: 'inherit', transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(249,115,22,0.3)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
