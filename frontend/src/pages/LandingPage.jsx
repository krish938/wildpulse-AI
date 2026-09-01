/**
 * pages/LandingPage.jsx
 * Hero landing page — first impression of WildPulse AI.
 */

import { useNavigate } from 'react-router-dom';
import {
  Flame, Shield, Map, AlertTriangle,
  BarChart3, ArrowRight, Satellite,
  Globe, Database, Activity,
} from 'lucide-react';

/* ─── Feature card ────────────────────────────────────────────────────────── */
const Feature = ({ icon: Icon, title, desc, color, index }) => (
  <div style={{
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: 16,
    padding: '1.375rem',
    transition: 'border-color 0.2s, transform 0.2s',
    cursor: 'default',
    animationDelay: `${index * 60}ms`,
  }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}40`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; }}
  >
    <div style={{
      width: 44, height: 44, borderRadius: 12,
      background: `${color}18`, border: `1px solid ${color}35`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: '0.875rem',
    }}>
      <Icon size={20} color={color} />
    </div>
    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.375rem' }}>{title}</div>
    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{desc}</div>
  </div>
);

/* ─── Tech pill ───────────────────────────────────────────────────────────── */
const TechPill = ({ label }) => (
  <span style={{
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-color)',
    borderRadius: 9999,
    padding: '0.25rem 0.75rem',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  }}>
    {label}
  </span>
);

/* ─── Step item ───────────────────────────────────────────────────────────── */
const Step = ({ num, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
    <div style={{
      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #f97316, #ef4444)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.7rem', fontWeight: 800, color: '#fff',
    }}>
      {num}
    </div>
    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{label}</span>
  </div>
);

/* ─── Stat mini ───────────────────────────────────────────────────────────── */
const HeroStat = ({ value, label }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontWeight: 500 }}>{label}</div>
  </div>
);

/* ─── Main ────────────────────────────────────────────────────────────────── */
const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    { icon: Satellite,     title: 'NASA FIRMS Data',       desc: 'Near-real-time wildfire hotspots from NASA VIIRS/MODIS satellite observations.',          color: '#f97316' },
    { icon: Map,           title: 'Interactive Fire Map',  desc: 'Explore active fire locations on a live Leaflet map with clickable detail popups.',        color: '#06b6d4' },
    { icon: AlertTriangle, title: 'AI Risk Prediction',   desc: 'Explainable risk scoring (LOW → EXTREME) based on weather conditions and fire activity.',  color: '#f59e0b' },
    { icon: Globe,         title: 'Real Weather Data',     desc: 'Current temperature, humidity, wind speed, and rainfall via Open-Meteo (no key needed).',  color: '#10b981' },
    { icon: Shield,        title: 'Community Reporting',  desc: 'Report suspected wildfires from the field. Reports saved to MongoDB Atlas.',               color: '#a78bfa' },
    { icon: BarChart3,     title: 'Fire Analytics',        desc: 'Interactive Recharts visualizations of fire intensity, distribution, and report trends.',   color: '#ef4444' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>

      {/* ── Top bar ── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.875rem 3rem',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
        position: 'sticky', top: 0, zIndex: 50,
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #f97316, #ef4444)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 14px rgba(249,115,22,0.4)',
          }}>
            <Flame size={18} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '1rem', letterSpacing: '-0.01em' }}>
              WildPulse <span style={{ color: 'var(--color-fire)' }}>AI</span>
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Monitor · Predict · Protect
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
          <button onClick={() => navigate('/about')} className="btn-ghost">
            About
          </button>
          <button onClick={() => navigate('/map')} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}>
            <Map size={14} /> Live Map
          </button>
          <button onClick={() => navigate('/dashboard')} className="btn-primary" style={{ padding: '0.5rem 1.125rem', fontSize: '0.82rem' }}>
            Dashboard <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* ── Hero section ── */}
      <section style={{ padding: '5rem 2rem 3.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 600, height: 400, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(249,115,22,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Live badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.75rem' }}>
          <div style={{
            background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)',
            borderRadius: 9999, padding: '0.3rem 0.875rem',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            fontSize: '0.78rem', color: 'var(--color-fire)', fontWeight: 700,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-fire)', animation: 'pulse-fire 2s ease-in-out infinite' }} />
            Near Real-Time Wildfire Monitoring
          </div>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(2.25rem, 6vw, 4.25rem)',
          fontWeight: 900,
          lineHeight: 1.08,
          margin: '0 0 1.25rem',
          letterSpacing: '-0.03em',
          maxWidth: 840,
          marginInline: 'auto',
        }}>
          <span className="gradient-text">Wildfire Intelligence</span>
          <br />
          <span style={{ color: 'var(--text-primary)' }}>at Your Fingertips</span>
        </h1>

        {/* Sub-headline */}
        <p style={{
          fontSize: '1.05rem',
          color: 'var(--text-secondary)',
          maxWidth: 580,
          margin: '0 auto 2.25rem',
          lineHeight: 1.75,
        }}>
          WildPulse AI combines <strong style={{ color: 'var(--text-primary)' }}>NASA satellite data</strong>,{' '}
          <strong style={{ color: 'var(--text-primary)' }}>real-time weather</strong>, and an{' '}
          <strong style={{ color: 'var(--text-primary)' }}>AI risk engine</strong> to monitor,
          predict, and help protect against wildfires.
        </p>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3rem' }}>
          <button onClick={() => navigate('/dashboard')} className="btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }}>
            Open Dashboard <ArrowRight size={17} />
          </button>
          <button onClick={() => navigate('/map')} className="btn-secondary" style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }}>
            <Map size={17} /> View Live Map
          </button>
        </div>

        {/* Mini stats */}
        <div style={{
          display: 'inline-flex', gap: '2.5rem', padding: '1rem 2.5rem',
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderRadius: 16, flexWrap: 'wrap', justifyContent: 'center',
        }}>
          <HeroStat value="8" label="Application Pages" />
          <div style={{ width: 1, background: 'var(--border-color)', alignSelf: 'stretch' }} />
          <HeroStat value="9" label="REST API Endpoints" />
          <div style={{ width: 1, background: 'var(--border-color)', alignSelf: 'stretch' }} />
          <HeroStat value="5" label="Risk Factors" />
          <div style={{ width: 1, background: 'var(--border-color)', alignSelf: 'stretch' }} />
          <HeroStat value="0" label="Paid APIs Required" />
        </div>
      </section>

      {/* ── Tech stack pills ── */}
      <section style={{ textAlign: 'center', padding: '0 2rem 3rem' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.875rem' }}>
          Built with
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
          {['React 18', 'Vite 8', 'Node.js', 'Express.js', 'MongoDB Atlas', 'NASA FIRMS API', 'Open-Meteo', 'Leaflet.js', 'Recharts', 'Tailwind CSS v4', 'Mongoose'].map(t => (
            <TechPill key={t} label={t} />
          ))}
        </div>
      </section>

      {/* ── Features grid ── */}
      <section style={{ padding: '0 3rem 4rem', maxWidth: 1200, margin: '0 auto' }}>
        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
            Platform <span className="gradient-text">Features</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Everything needed to monitor and predict wildfire risk in one platform
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          {features.map((f, i) => <Feature key={f.title} {...f} index={i} />)}
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ padding: '0 3rem 4.5rem', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
            How it <span className="gradient-text-teal">Works</span>
          </h2>
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem',
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderRadius: 20, padding: '2rem',
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
              🛰️ Data Pipeline
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Step num="1" label="NASA satellites detect fire hotspots globally" />
              <Step num="2" label="FIRMS API serves the hotspot data to our backend" />
              <Step num="3" label="Open-Meteo provides current weather at any lat/lon" />
              <Step num="4" label="Risk engine scores risk from environmental factors" />
              <Step num="5" label="React frontend renders everything interactively" />
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
              🧠 Risk Engine Formula
            </div>
            <div style={{
              background: 'var(--bg-secondary)', borderRadius: 12, padding: '1.25rem',
              fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 2,
            }}>
              <div><span style={{ color: '#f97316' }}>score</span> = weighted_sum(</div>
              <div style={{ paddingLeft: '1rem' }}><span style={{ color: '#06b6d4' }}>temperature</span> × 0.25 +</div>
              <div style={{ paddingLeft: '1rem' }}><span style={{ color: '#06b6d4' }}>humidity</span>    × 0.20 +</div>
              <div style={{ paddingLeft: '1rem' }}><span style={{ color: '#06b6d4' }}>windSpeed</span>   × 0.20 +</div>
              <div style={{ paddingLeft: '1rem' }}><span style={{ color: '#06b6d4' }}>precipitation</span> × 0.15 +</div>
              <div style={{ paddingLeft: '1rem' }}><span style={{ color: '#06b6d4' }}>fireActivity</span> × 0.20</div>
              <div>)</div>
              <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                → <span style={{ color: '#22c55e' }}>LOW</span> / <span style={{ color: '#f59e0b' }}>MODERATE</span> / <span style={{ color: '#f97316' }}>HIGH</span> / <span style={{ color: '#ef4444' }}>EXTREME</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        textAlign: 'center',
        padding: '1.5rem 2rem',
        color: 'var(--text-muted)',
        fontSize: '0.78rem',
      }}>
        <div style={{ marginBottom: '0.375rem' }}>
          WildPulse AI — Semester 7 Mini Project · MERN Stack Web Application
        </div>
        <div>
          Data sources: NASA FIRMS · Open-Meteo · OpenStreetMap · All free tier APIs
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
