/**
 * pages/Analytics.jsx
 * Analytics dashboard with Recharts visualizations.
 * Uses real data from the backend where available.
 * Clearly labels any derived/estimated data.
 */

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { getFireHotspots, getReports } from '../services/api';

// Colors for charts
const RISK_COLORS = {
  LOW: '#22c55e', MODERATE: '#f59e0b', HIGH: '#f97316', EXTREME: '#ef4444',
};

// Categorize fire by FRP
const getFRPLevel = (frp) => {
  if (frp > 200) return 'EXTREME';
  if (frp > 50) return 'HIGH';
  if (frp > 10) return 'MODERATE';
  return 'LOW';
};

const Analytics = () => {
  const [fires, setFires] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [firesRes, reportsRes] = await Promise.allSettled([
          getFireHotspots(),
          getReports({ limit: 200 }),
        ]);
        if (firesRes.status === 'fulfilled' && firesRes.value.data.success) {
          setFires(firesRes.value.data.data || []);
        }
        if (reportsRes.status === 'fulfilled') {
          setReports(reportsRes.value.data.data || []);
        }
      } catch (e) {
        console.error('Analytics fetch error', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Compute fire intensity distribution from real data
  const intensityData = ['LOW', 'MODERATE', 'HIGH', 'EXTREME'].map(level => ({
    name: level,
    count: fires.filter(f => getFRPLevel(f.frp) === level).length,
    fill: RISK_COLORS[level],
  }));

  // Day vs Night distribution
  const dayNightData = [
    { name: 'Day', count: fires.filter(f => f.dayNight === 'D').length, fill: '#f97316' },
    { name: 'Night', count: fires.filter(f => f.dayNight === 'N').length, fill: '#818cf8' },
    { name: 'Unknown', count: fires.filter(f => !f.dayNight).length, fill: '#475569' },
  ].filter(d => d.count > 0);

  // Reports by severity
  const reportSeverityData = ['low', 'moderate', 'high', 'extreme'].map(s => ({
    name: s.charAt(0).toUpperCase() + s.slice(1),
    count: reports.filter(r => r.severity === s).length,
    fill: { low: '#22c55e', moderate: '#f59e0b', high: '#f97316', extreme: '#ef4444' }[s],
  }));

  // Reports by status
  const reportStatusData = ['pending', 'verified', 'rejected', 'resolved'].map(s => ({
    name: s.charAt(0).toUpperCase() + s.slice(1),
    count: reports.filter(r => r.status === s).length,
  }));

  // FRP distribution histogram (top 20 fires by FRP)
  const topFires = [...fires].sort((a, b) => (b.frp || 0) - (a.frp || 0)).slice(0, 20);

  const SectionTitle = ({ children }) => (
    <div className="section-title" style={{ marginBottom: '1rem' }}>{children}</div>
  );

  if (loading) return <LoadingSpinner message="Loading analytics data..." />;

  const noFireData = fires.length === 0;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>
          <BarChart3 size={20} style={{ display: 'inline', marginRight: '0.5rem', color: '#a78bfa' }} />
          Fire <span style={{ background: 'linear-gradient(135deg, #a78bfa, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Analytics</span>
        </h1>
        <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          {noFireData
            ? 'Configure NASA FIRMS API key to see real fire analytics · Community report data shown below'
            : `Analytics from ${fires.length.toLocaleString()} NASA FIRMS hotspots and ${reports.length} community reports`}
        </p>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.875rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Hotspots', value: fires.length.toLocaleString(), color: '#f97316' },
          { label: 'Extreme Fires', value: fires.filter(f => getFRPLevel(f.frp) === 'EXTREME').length },
          { label: 'Avg FRP (MW)', value: fires.length ? (fires.reduce((s,f) => s+(f.frp||0),0)/fires.length).toFixed(1) : '—', color: '#f59e0b' },
          { label: 'Total Reports', value: reports.length, color: '#10b981' },
          { label: 'Pending Reports', value: reports.filter(r=>r.status==='pending').length, color: '#f59e0b' },
        ].map(({ label, value, color = 'var(--text-primary)' }) => (
          <div key={label} className="card-sm" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color, marginBottom: '0.25rem' }}>{value}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.25rem' }}>

        {/* Fire Intensity Distribution */}
        <div className="card">
          <SectionTitle>🔥 Fire Intensity Distribution {noFireData && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>(no FIRMS data)</span>}</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={intensityData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8 }}
                labelStyle={{ color: 'var(--text-primary)' }}
                itemStyle={{ color: 'var(--text-secondary)' }}
              />
              <Bar dataKey="count" name="Hotspots" radius={[4,4,0,0]}>
                {intensityData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Day vs Night */}
        <div className="card">
          <SectionTitle>🌙 Day vs Night Detections</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={dayNightData.length > 0 ? dayNightData : [{ name: 'No Data', count: 1, fill: '#2d3748' }]}
                dataKey="count"
                nameKey="name"
                cx="50%" cy="50%"
                outerRadius={80}
                label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                labelLine={false}
              >
                {dayNightData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Report severity */}
        <div className="card">
          <SectionTitle>📋 Reports by Severity</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={reportSeverityData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
              <Bar dataKey="count" name="Reports" radius={[4,4,0,0]}>
                {reportSeverityData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Report status */}
        <div className="card">
          <SectionTitle>📊 Report Status Distribution</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={reportStatusData.some(d=>d.count>0) ? reportStatusData : [{ name: 'No Reports', count: 1 }]}
                dataKey="count"
                nameKey="name"
                cx="50%" cy="50%"
                outerRadius={80}
                label={({ name, count }) => count > 0 ? `${name}: ${count}` : ''}
              >
                {reportStatusData.map((_, i) => (
                  <Cell key={i} fill={['#f59e0b','#10b981','#6b7280','#06b6d4'][i]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top fires by FRP */}
        {fires.length > 0 && (
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <SectionTitle>⚡ Top 20 Fires by Fire Radiative Power (MW)</SectionTitle>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '-0.5rem 0 1rem' }}>
              FRP measures the rate of fire energy output in megawatts. Higher FRP = more intense fire.
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topFires.map((f,i) => ({ name: `#${i+1}`, frp: parseFloat(f.frp?.toFixed(1) || 0), lat: f.latitude?.toFixed(2), lon: f.longitude?.toFixed(2) }))} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8 }}
                  formatter={(val, name, props) => [`${val} MW`, 'FRP']}
                  labelFormatter={(label, payload) => payload[0] ? `${payload[0].payload.lat}, ${payload[0].payload.lon}` : label}
                />
                <Bar dataKey="frp" name="FRP (MW)" fill="url(#fireGradient)" radius={[3,3,0,0]} />
                <defs>
                  <linearGradient id="fireGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Data source note */}
      <div style={{ marginTop: '1.25rem', padding: '0.875rem 1.25rem', background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-color)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        <strong style={{ color: 'var(--text-secondary)' }}>Data Sources:</strong> Fire hotspot data from NASA FIRMS (VIIRS/MODIS satellite). Community reports from MongoDB. Analytics are derived from live data — not synthetic or hardcoded.
      </div>
    </div>
  );
};

export default Analytics;
