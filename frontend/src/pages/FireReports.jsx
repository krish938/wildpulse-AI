/**
 * pages/FireReports.jsx
 * Community wildfire reports listing page.
 *
 * Features:
 *  - Shows all submitted reports, newest first
 *  - Filter by status and severity
 *  - Each card shows: severity badge, status badge, location, description, date, reporter
 *  - Inline status changer (pending → verified / rejected / resolved)
 *  - Pull-to-refresh button
 *  - Empty state with CTA
 *  - Graceful error if DB is unavailable (shows setup instructions)
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Filter, RefreshCw, MapPin, Calendar, User,
  ChevronDown, Flame, AlertTriangle, CheckCircle, XCircle,
  Clock, Plus,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage    from '../components/ErrorMessage';
import { getReports, updateReport } from '../services/api';

// ─── Colour palettes ─────────────────────────────────────────────────────────
const STATUS_PALETTE = {
  pending:  { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b', icon: Clock },
  verified: { bg: 'rgba(16,185,129,0.15)',  color: '#10b981', icon: CheckCircle },
  rejected: { bg: 'rgba(107,114,128,0.15)', color: '#6b7280', icon: XCircle },
  resolved: { bg: 'rgba(6,182,212,0.15)',   color: '#06b6d4', icon: CheckCircle },
};

const SEVERITY_PALETTE = {
  low:      { color: '#22c55e', label: '🟢 Low' },
  moderate: { color: '#f59e0b', label: '🟡 Moderate' },
  high:     { color: '#f97316', label: '🟠 High' },
  extreme:  { color: '#ef4444', label: '🔴 Extreme' },
};

const STATUSES   = ['pending', 'verified', 'rejected', 'resolved'];
const SEVERITIES = ['low', 'moderate', 'high', 'extreme'];

// ─── Relative date helper ────────────────────────────────────────────────────
const relativeDate = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (mins  < 1)   return 'Just now';
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days  < 7)   return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// ─── StatusDropdown ──────────────────────────────────────────────────────────
const StatusDropdown = ({ reportId, currentStatus, onStatusChange }) => {
  const [open,    setOpen]    = useState(false);
  const [saving,  setSaving]  = useState(false);

  const pal = STATUS_PALETTE[currentStatus] ?? STATUS_PALETTE.pending;
  const Icon = pal.icon;

  const handleSelect = async (newStatus) => {
    if (newStatus === currentStatus) { setOpen(false); return; }
    setSaving(true);
    setOpen(false);
    try {
      await updateReport(reportId, { status: newStatus });
      onStatusChange(reportId, newStatus);
    } catch {
      // Failed silently — parent will show on next refresh
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={saving}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.3rem',
          padding: '0.25rem 0.625rem',
          borderRadius: 9999, fontSize: '0.7rem', fontWeight: 700,
          background: pal.bg, color: pal.color,
          border: `1px solid ${pal.color}40`,
          cursor: 'pointer',
          transition: 'opacity 0.15s',
          opacity: saving ? 0.5 : 1,
        }}
      >
        <Icon size={10} />
        {saving ? 'Saving…' : currentStatus}
        <ChevronDown size={10} />
      </button>

      {open && (
        <>
          {/* Backdrop to close */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 99 }}
          />
          <div style={{
            position: 'absolute', top: '110%', left: 0,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 10, overflow: 'hidden',
            zIndex: 100,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            minWidth: 130,
          }}>
            {STATUSES.map((s) => {
              const sp   = STATUS_PALETTE[s];
              const SIcon = sp.icon;
              return (
                <button
                  key={s}
                  onClick={() => handleSelect(s)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    width: '100%', padding: '0.5rem 0.875rem',
                    background: s === currentStatus ? `${sp.color}18` : 'transparent',
                    color: sp.color, fontSize: '0.78rem', fontWeight: 600,
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  <SIcon size={11} />
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                  {s === currentStatus && (
                    <span style={{ marginLeft: 'auto', fontSize: '0.65rem' }}>✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

// ─── ReportCard ───────────────────────────────────────────────────────────────
const ReportCard = ({ report, onStatusChange }) => {
  const sev = SEVERITY_PALETTE[report.severity] ?? SEVERITY_PALETTE.moderate;

  return (
    <div className="card" style={{ transition: 'transform 0.15s', display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Top row: severity + status */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '0.625rem', gap: '0.5rem', flexWrap: 'wrap',
      }}>
        {/* Severity badge */}
        <span style={{
          padding: '0.22rem 0.7rem', borderRadius: 9999,
          fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
          background: `${sev.color}18`, color: sev.color,
          border: `1px solid ${sev.color}35`,
        }}>
          {sev.label}
        </span>

        {/* Status — interactive dropdown */}
        <StatusDropdown
          reportId={report._id}
          currentStatus={report.status}
          onStatusChange={onStatusChange}
        />
      </div>

      {/* Location name */}
      <div style={{
        fontWeight: 700, fontSize: '0.9rem',
        color: 'var(--text-primary)', marginBottom: '0.375rem',
      }}>
        {report.location?.placeName || 'Unknown Location'}
      </div>

      {/* Description (2-line clamp) */}
      <p style={{
        color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.65,
        margin: '0 0 0.75rem',
        display: '-webkit-box', WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {report.description}
      </p>

      {/* Footer: coords + date + reporter */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '0.75rem',
        fontSize: '0.7rem', color: 'var(--text-muted)',
        borderTop: '1px solid var(--border-color)',
        paddingTop: '0.625rem', marginTop: 'auto',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <MapPin size={11} />
          {report.location?.latitude?.toFixed(4)}, {report.location?.longitude?.toFixed(4)}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Calendar size={11} />
          {relativeDate(report.createdAt)}
        </span>
        {report.reporter?.name && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <User size={11} />
            {report.reporter.name}
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Summary counts ───────────────────────────────────────────────────────────
const SummaryBar = ({ reports }) => {
  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = reports.filter((r) => r.status === s).length;
    return acc;
  }, {});

  return (
    <div style={{
      display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem',
    }}>
      {STATUSES.map((s) => {
        const p = STATUS_PALETTE[s];
        const Icon = p.icon;
        return (
          <div key={s} style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.375rem 0.75rem',
            background: p.bg, borderRadius: 8,
            fontSize: '0.75rem', fontWeight: 700, color: p.color,
          }}>
            <Icon size={12} />
            {counts[s]} {s}
          </div>
        );
      })}
    </div>
  );
};

// ─── Main FireReports page ────────────────────────────────────────────────────
const FireReports = () => {
  const navigate = useNavigate();

  const [reports,       setReports]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [statusFilter,  setStatusFilter]  = useState('');
  const [sevFilter,     setSevFilter]     = useState('');

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { limit: 100 };
      if (statusFilter) params.status   = statusFilter;
      if (sevFilter)    params.severity = sevFilter;
      const res = await getReports(params);
      setReports(res.data?.data || []);
    } catch (err) {
      const msg = err.response?.data?.error
               || err.response?.data?.help
               || err.displayMessage
               || 'Failed to load reports.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, sevFilter]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  // ── Inline status update ───────────────────────────────────────────────────
  const handleStatusChange = (reportId, newStatus) => {
    setReports((prev) =>
      prev.map((r) => r._id === reportId ? { ...r, status: newStatus } : r)
    );
  };

  // ── Filter chips ───────────────────────────────────────────────────────────
  const FilterChip = ({ label, active, onClick }) => (
    <button onClick={onClick} style={{
      padding: '0.28rem 0.75rem', borderRadius: 9999,
      fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
      border: '1px solid',
      background:   active ? 'rgba(249,115,22,0.15)' : 'transparent',
      borderColor:  active ? 'rgba(249,115,22,0.5)'  : 'var(--border-color)',
      color:        active ? 'var(--color-fire)'      : 'var(--text-secondary)',
      transition: 'all 0.15s',
    }}>
      {label}
    </button>
  );

  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>
            <FileText size={20} style={{ display: 'inline', marginRight: '0.5rem', color: 'var(--color-teal)' }} />
            Fire <span className="gradient-text-teal">Reports</span>
          </h1>
          <p style={{ margin: '0.3rem 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Community-submitted wildfire reports · {reports.length} shown
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={fetchReports} className="btn-secondary" style={{ fontSize: '0.8rem' }}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={() => navigate('/report')} className="btn-primary" style={{ fontSize: '0.8rem' }}>
            <Plus size={13} /> Report Fire
          </button>
        </div>
      </div>

      {/* ── Summary bar ───────────────────────────────────────────────────── */}
      {!loading && !error && reports.length > 0 && <SummaryBar reports={reports} />}

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.25rem' }}>
        {/* Status filters */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.375rem',
          marginBottom: '0.5rem', flexWrap: 'wrap',
        }}>
          <Filter size={13} color="var(--text-muted)" />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginRight: '0.25rem' }}>
            Status:
          </span>
          <FilterChip label="All"      active={statusFilter === ''}         onClick={() => setStatusFilter('')} />
          {STATUSES.map((s) => (
            <FilterChip key={s} label={s.charAt(0).toUpperCase() + s.slice(1)}
              active={statusFilter === s} onClick={() => setStatusFilter(s)} />
          ))}
        </div>

        {/* Severity filters */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap',
        }}>
          <Flame size={13} color="var(--text-muted)" />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginRight: '0.25rem' }}>
            Severity:
          </span>
          <FilterChip label="All" active={sevFilter === ''} onClick={() => setSevFilter('')} />
          {SEVERITIES.map((s) => (
            <FilterChip key={s} label={s.charAt(0).toUpperCase() + s.slice(1)}
              active={sevFilter === s} onClick={() => setSevFilter(s)} />
          ))}
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      {loading ? (
        <LoadingSpinner message="Loading reports…" />
      ) : error ? (
        <div>
          <ErrorMessage message={error} onRetry={fetchReports} />
          {/* Show setup instructions if DB is unavailable */}
          {error.toLowerCase().includes('database') && (
            <div className="card" style={{ marginTop: '1rem', fontSize: '0.82rem', lineHeight: 1.8 }}>
              <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-fire)' }}>
                <AlertTriangle size={13} style={{ display: 'inline', marginRight: 5 }} />
                MongoDB Atlas Setup Required
              </div>
              <ol style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', margin: 0 }}>
                <li>Go to <a href="https://cloud.mongodb.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-teal)' }}>cloud.mongodb.com</a></li>
                <li>Open your <strong>Cluster0</strong> → <strong>Network Access</strong></li>
                <li>Click <strong>Add IP Address</strong> → <strong>Allow Access from Anywhere</strong> (or add your current IP)</li>
                <li>Wait ~30 seconds, then restart the backend: <code>npm run dev</code></li>
              </ol>
            </div>
          )}
        </div>
      ) : reports.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
          <FileText size={44} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.35 }} />
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
            No reports found
          </div>
          <div style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            {statusFilter || sevFilter
              ? 'No reports match this filter. Try a different one.'
              : 'Be the first to report a wildfire in your area.'
            }
          </div>
          <button onClick={() => navigate('/report')} className="btn-primary">
            <Flame size={14} /> Submit a Report
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '1rem',
        }}>
          {reports.map((r) => (
            <ReportCard key={r._id} report={r} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FireReports;
