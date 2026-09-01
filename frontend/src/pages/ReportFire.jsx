/**
 * pages/ReportFire.jsx
 * Community wildfire incident report form.
 *
 * Flow:
 *   1. User fills location (GPS button or manual lat/lon) + fire details + optional info
 *   2. Client-side validation before submission
 *   3. POST /api/reports → backend validates → saves to MongoDB
 *   4. Success screen with links to view all reports or submit another
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame, MapPin, Crosshair, Send, CheckCircle, AlertTriangle, User, Mail,
  ChevronRight, Info,
} from 'lucide-react';
import { createReport } from '../services/api';

// ─── Severity options ─────────────────────────────────────────────────────────
const SEVERITY_OPTIONS = [
  {
    value: 'low',
    label: 'Low',
    emoji: '🟢',
    desc: 'Small, contained fire or light smoke. No immediate structures at risk.',
    color: '#22c55e',
  },
  {
    value: 'moderate',
    label: 'Moderate',
    emoji: '🟡',
    desc: 'Growing fire with visible spread. Monitor closely.',
    color: '#f59e0b',
  },
  {
    value: 'high',
    label: 'High',
    emoji: '🟠',
    desc: 'Large fire with significant smoke. Structures or wildlife at risk.',
    color: '#f97316',
  },
  {
    value: 'extreme',
    label: 'Extreme',
    emoji: '🔴',
    desc: 'Uncontrolled blaze. Major emergency — contact local authorities immediately.',
    color: '#ef4444',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isEmpty = (v) => v === null || v === undefined || String(v).trim() === '';

// ─── Success Screen ───────────────────────────────────────────────────────────
const SuccessScreen = ({ onReset }) => {
  const navigate = useNavigate();
  return (
    <div style={{ maxWidth: 560, margin: '4rem auto', textAlign: 'center', padding: '0 1rem' }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'rgba(16,185,129,0.12)',
        border: '2px solid rgba(16,185,129,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 1.5rem',
        boxShadow: '0 0 30px rgba(16,185,129,0.15)',
      }}>
        <CheckCircle size={36} color="#10b981" />
      </div>

      <h2 style={{ fontWeight: 800, fontSize: '1.6rem', marginBottom: '0.5rem' }}>
        Report Submitted!
      </h2>
      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
        Thank you for helping protect our forests and communities.
        Your report has been saved and is now <strong>pending review</strong>.
      </p>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '2rem' }}>
        If this is an emergency, please contact your local fire department immediately.
      </p>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/reports')} className="btn-primary">
          View All Reports
        </button>
        <button onClick={onReset} className="btn-secondary">
          Submit Another
        </button>
      </div>
    </div>
  );
};

// ─── Main Form ────────────────────────────────────────────────────────────────
const BLANK_FORM = {
  latitude:      '',
  longitude:     '',
  placeName:     '',
  description:   '',
  severity:      'moderate',
  reporterName:  '',
  reporterEmail: '',
};

const ReportFire = () => {
  const [form,      setForm]      = useState(BLANK_FORM);
  const [errors,    setErrors]    = useState({});
  const [loading,   setLoading]   = useState(false);
  const [apiError,  setApiError]  = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Generic field setter
  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    // Clear field error on change
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  // GPS location
  const getMyLocation = () => {
    if (!navigator.geolocation) {
      setApiError('Geolocation is not supported by your browser. Please enter coordinates manually.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          latitude:  pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setErrors((prev) => ({ ...prev, latitude: null, longitude: null }));
        setGpsLoading(false);
      },
      () => {
        setApiError('Could not get your location. Please enter coordinates manually.');
        setGpsLoading(false);
      },
      { timeout: 10000 }
    );
  };

  // Client-side validation
  const validate = () => {
    const e = {};

    const lat = parseFloat(form.latitude);
    const lon = parseFloat(form.longitude);

    if (isEmpty(form.latitude))              e.latitude  = 'Latitude is required.';
    else if (isNaN(lat) || lat < -90 || lat > 90)
                                             e.latitude  = 'Latitude must be between -90 and 90.';

    if (isEmpty(form.longitude))             e.longitude = 'Longitude is required.';
    else if (isNaN(lon) || lon < -180 || lon > 180)
                                             e.longitude = 'Longitude must be between -180 and 180.';

    if (!form.description.trim())            e.description = 'Description is required.';
    else if (form.description.trim().length < 10)
                                             e.description = 'Description must be at least 10 characters.';

    if (form.reporterEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.reporterEmail)) {
      e.reporterEmail = 'Please enter a valid email address.';
    }

    return e;
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      // Scroll to first error
      const firstKey = Object.keys(fieldErrors)[0];
      document.getElementById(`field-${firstKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setLoading(true);
    try {
      await createReport({
        latitude:      parseFloat(form.latitude),
        longitude:     parseFloat(form.longitude),
        placeName:     form.placeName.trim() || undefined,
        description:   form.description.trim(),
        severity:      form.severity,
        reporterName:  form.reporterName.trim()  || undefined,
        reporterEmail: form.reporterEmail.trim() || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      const msg = err.response?.data?.details?.join(', ')
               || err.response?.data?.error
               || err.displayMessage
               || 'Failed to submit report. Please check the backend is running.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Reset to blank form
  const handleReset = () => {
    setForm(BLANK_FORM);
    setErrors({});
    setApiError(null);
    setSubmitted(false);
  };

  if (submitted) return <SuccessScreen onReset={handleReset} />;

  const selectedSev = SEVERITY_OPTIONS.find((o) => o.value === form.severity);

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>
          <Flame size={20} style={{ display: 'inline', marginRight: '0.5rem', color: 'var(--color-fire)' }} />
          Report a <span className="gradient-text">Wildfire</span>
        </h1>
        <p style={{ margin: '0.3rem 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Spotted a fire? Help alert the community by submitting a report.
        </p>
      </div>

      {/* ── Emergency banner ───────────────────────────────────────────────── */}
      <div style={{
        marginBottom: '1.25rem',
        padding: '0.75rem 1rem',
        background: 'rgba(239,68,68,0.08)',
        border: '1px solid rgba(239,68,68,0.25)',
        borderRadius: 10,
        fontSize: '0.82rem',
        color: '#fca5a5',
        display: 'flex', alignItems: 'center', gap: '0.625rem',
      }}>
        <AlertTriangle size={15} color="#ef4444" />
        <span>
          <strong>Emergency?</strong> Contact your local fire department or emergency services first.
          This form is for community reporting only.
        </span>
      </div>

      <form onSubmit={handleSubmit} noValidate>

        {/* ── Section 1: Location ──────────────────────────────────────────── */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="section-title" style={{ marginBottom: '1rem' }}>
            <MapPin size={15} color="var(--color-teal)" /> Fire Location
          </div>

          {/* GPS button */}
          <button
            type="button"
            onClick={getMyLocation}
            disabled={gpsLoading}
            className="btn-secondary"
            style={{ marginBottom: '1rem', fontSize: '0.82rem' }}
          >
            <Crosshair size={14} />
            {gpsLoading ? 'Getting location…' : 'Use My Current Location'}
          </button>

          {/* Lat / Lon inputs */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem', marginBottom: '0.75rem',
          }}>
            <div id="field-latitude">
              <label className="form-label">
                Latitude <span style={{ color: 'var(--color-fire)' }}>*</span>
              </label>
              <input
                type="number"
                className={`input-field${errors.latitude ? ' input-error' : ''}`}
                placeholder="e.g. 12.9716"
                value={form.latitude}
                onChange={set('latitude')}
                step="any" min="-90" max="90"
              />
              {errors.latitude && (
                <div style={{ color: '#f87171', fontSize: '0.72rem', marginTop: '0.25rem' }}>
                  {errors.latitude}
                </div>
              )}
            </div>
            <div id="field-longitude">
              <label className="form-label">
                Longitude <span style={{ color: 'var(--color-fire)' }}>*</span>
              </label>
              <input
                type="number"
                className={`input-field${errors.longitude ? ' input-error' : ''}`}
                placeholder="e.g. 77.5946"
                value={form.longitude}
                onChange={set('longitude')}
                step="any" min="-180" max="180"
              />
              {errors.longitude && (
                <div style={{ color: '#f87171', fontSize: '0.72rem', marginTop: '0.25rem' }}>
                  {errors.longitude}
                </div>
              )}
            </div>
          </div>

          {/* Place name */}
          <div>
            <label className="form-label">
              Place Name
              <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.375rem' }}>
                (optional)
              </span>
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Bandipur Forest Reserve, Karnataka"
              value={form.placeName}
              onChange={set('placeName')}
              maxLength={200}
            />
          </div>
        </div>

        {/* ── Section 2: Fire Details ─────────────────────────────────────── */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="section-title" style={{ marginBottom: '1rem' }}>
            <Flame size={15} color="var(--color-fire)" /> Fire Details
          </div>

          {/* Severity selector */}
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label">
              Severity <span style={{ color: 'var(--color-fire)' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              {SEVERITY_OPTIONS.map((opt) => {
                const isSelected = form.severity === opt.value;
                return (
                  <label
                    key={opt.value}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '0.625rem',
                      padding: '0.75rem 0.875rem', borderRadius: 10, cursor: 'pointer',
                      background: isSelected ? `${opt.color}18` : 'var(--bg-secondary)',
                      border: `1.5px solid ${isSelected ? opt.color + '60' : 'var(--border-color)'}`,
                      transition: 'all 0.15s',
                    }}
                  >
                    <input
                      type="radio"
                      name="severity"
                      value={opt.value}
                      checked={isSelected}
                      onChange={set('severity')}
                      style={{ marginTop: 3 }}
                    />
                    <div>
                      <div style={{
                        fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.15rem',
                        color: isSelected ? opt.color : 'var(--text-primary)',
                      }}>
                        {opt.emoji} {opt.label}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                        {opt.desc}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div id="field-description">
            <label className="form-label">
              Description <span style={{ color: 'var(--color-fire)' }}>*</span>
              <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.375rem' }}>
                (min 10 characters)
              </span>
            </label>
            <textarea
              className={`input-field${errors.description ? ' input-error' : ''}`}
              style={{ minHeight: 110, resize: 'vertical', lineHeight: 1.6 }}
              placeholder="Describe what you observed — fire size, smoke colour, wind direction, proximity to structures or roads, time first noticed, etc."
              value={form.description}
              onChange={set('description')}
              maxLength={2000}
            />
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              marginTop: '0.2rem',
            }}>
              {errors.description
                ? <span style={{ color: '#f87171', fontSize: '0.72rem' }}>{errors.description}</span>
                : <span />
              }
              <span style={{
                fontSize: '0.7rem',
                color: form.description.length > 1800 ? '#f59e0b' : 'var(--text-muted)',
              }}>
                {form.description.length}/2000
              </span>
            </div>
          </div>
        </div>

        {/* ── Section 3: Reporter Info (optional) ─────────────────────────── */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="section-title" style={{
            marginBottom: '0.25rem',
            color: 'var(--text-secondary)',
          }}>
            <User size={14} /> Reporter Information
            <span style={{ fontWeight: 400, fontSize: '0.78rem', marginLeft: '0.375rem' }}>
              — optional
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            <Info size={10} style={{ display: 'inline', marginRight: 3 }} />
            Your information will not be publicly displayed.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="form-label">
                <User size={11} style={{ display: 'inline', marginRight: 3 }} />
                Your Name
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Anonymous"
                value={form.reporterName}
                onChange={set('reporterName')}
                maxLength={100}
              />
            </div>
            <div id="field-reporterEmail">
              <label className="form-label">
                <Mail size={11} style={{ display: 'inline', marginRight: 3 }} />
                Email Address
              </label>
              <input
                type="email"
                className={`input-field${errors.reporterEmail ? ' input-error' : ''}`}
                placeholder="you@example.com"
                value={form.reporterEmail}
                onChange={set('reporterEmail')}
              />
              {errors.reporterEmail && (
                <div style={{ color: '#f87171', fontSize: '0.72rem', marginTop: '0.25rem' }}>
                  {errors.reporterEmail}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── API Error ───────────────────────────────────────────────────── */}
        {apiError && (
          <div style={{
            color: '#fca5a5', background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)',
            padding: '0.875rem 1rem', borderRadius: 10,
            marginBottom: '1rem', fontSize: '0.85rem', lineHeight: 1.6,
          }}>
            <AlertTriangle size={14} style={{ display: 'inline', marginRight: 5 }} />
            {apiError}
          </div>
        )}

        {/* ── Submit ──────────────────────────────────────────────────────── */}
        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
          style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', justifyContent: 'center' }}
        >
          {loading
            ? 'Submitting…'
            : <><Send size={16} /> Submit Fire Report</>
          }
        </button>

        {/* Disclaimer */}
        <div style={{
          marginTop: '0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)',
          textAlign: 'center', lineHeight: 1.55,
        }}>
          Reports are reviewed by the community. Submitting false reports may mislead responders.
          In an emergency, always call your local fire authority first.
        </div>

      </form>
    </div>
  );
};

export default ReportFire;
