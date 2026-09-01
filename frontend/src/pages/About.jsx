/**
 * pages/About.jsx
 * Project information page — architecture, technology, and viva explanation guide.
 */

import {
  Code2, Satellite, Database, Globe, Cpu, Shield,
  ArrowRight, BookOpen, Layers, Zap, GitBranch,
} from 'lucide-react';

const Section = ({ title, icon: Icon, iconColor = 'var(--color-fire)', children }) => (
  <div className="card" style={{ marginBottom: '1rem' }}>
    <h2 style={{
      margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700,
      color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem',
      paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)',
    }}>
      {Icon && <Icon size={16} color={iconColor} />}
      {title}
    </h2>
    {children}
  </div>
);

const CodeBadge = ({ children }) => (
  <code style={{
    background: 'rgba(249,115,22,0.1)', color: 'var(--color-fire)',
    padding: '0.1em 0.4em', borderRadius: 4, fontSize: '0.85em',
    fontFamily: "'Fira Code', 'Cascadia Code', monospace",
  }}>
    {children}
  </code>
);

const About = () => (
  <div style={{ maxWidth: 960, margin: '0 auto' }}>

    {/* Hero banner */}
    <div className="card" style={{
      marginBottom: '1rem',
      background: 'linear-gradient(135deg, rgba(249,115,22,0.08) 0%, rgba(16,185,129,0.06) 100%)',
      border: '1px solid rgba(249,115,22,0.25)',
      textAlign: 'center', padding: '2.5rem 2rem',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: 'linear-gradient(#f97316 1px, transparent 1px), linear-gradient(90deg, #f97316 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>🔥</div>
        <h1 style={{ margin: '0 0 0.25rem', fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
          WildPulse <span className="gradient-text">AI</span>
        </h1>
        <p style={{ margin: '0 0 0.5rem', color: 'var(--color-fire)', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          Monitor • Predict • Protect
        </p>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 560, margin: '0.75rem auto 0', lineHeight: 1.7, fontSize: '0.9rem' }}>
          A MERN stack web application for wildfire monitoring, AI-based risk prediction,
          and community incident reporting — Semester 7 Mini Project.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.5rem' }}>
          {['React', 'Vite', 'Node.js', 'Express', 'MongoDB', 'NASA FIRMS', 'Open-Meteo', 'Leaflet'].map(t => (
            <span key={t} style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
              borderRadius: 9999, padding: '0.25rem 0.75rem',
              fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500,
            }}>{t}</span>
          ))}
        </div>
      </div>
    </div>

    {/* Data Flow */}
    <Section title="Data Flow" icon={ArrowRight} iconColor="var(--color-teal)">
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.7, margin: '0 0 1rem' }}>
        This is the complete journey of data through WildPulse AI — from satellite to screen:
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {[
          { num: '1', label: 'Fire Hotspots', flow: 'NASA Satellite → FIRMS API → Backend /api/fires → Frontend Map', color: '#f97316' },
          { num: '2', label: 'Weather Data', flow: 'Open-Meteo API → Backend /api/weather → WeatherCard Component', color: '#06b6d4' },
          { num: '3', label: 'Risk Score', flow: 'Weather + Fire Data → riskService.js (engine) → /api/risk → RiskCard', color: '#f59e0b' },
          { num: '4', label: 'Reports (Write)', flow: 'User fills form → POST /api/reports → MongoDB Atlas (stored)', color: '#10b981' },
          { num: '5', label: 'Reports (Read)', flow: 'GET /api/reports → MongoDB → Fire Reports Page (rendered)', color: '#a78bfa' },
        ].map(({ num, label, flow, color }) => (
          <div key={num} style={{
            display: 'flex', alignItems: 'flex-start', gap: '0.875rem',
            padding: '0.75rem 1rem', background: 'var(--bg-secondary)',
            borderRadius: 10, border: `1px solid ${color}25`,
          }}>
            <span style={{
              width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
              background: `${color}20`, border: `1px solid ${color}50`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', fontWeight: 800, color,
            }}>{num}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{label}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace', lineHeight: 1.5 }}>{flow}</div>
            </div>
          </div>
        ))}
      </div>
    </Section>

    {/* Tech Stack */}
    <Section title="Technology Stack" icon={Layers} iconColor="#a78bfa">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.875rem' }}>
        {[
          {
            icon: Globe, title: 'Frontend', color: '#06b6d4',
            items: ['React 18 + Vite 8', 'Tailwind CSS v4', 'React Router v6', 'Leaflet + React-Leaflet', 'Recharts', 'Lucide React icons', 'Axios HTTP client'],
          },
          {
            icon: Cpu, title: 'Backend', color: '#f97316',
            items: ['Node.js v24', 'Express.js 4', 'Mongoose ODM', 'Helmet (security)', 'CORS middleware', 'Morgan (HTTP logger)', 'dotenv (config)'],
          },
          {
            icon: Database, title: 'Database', color: '#10b981',
            items: ['MongoDB Atlas (cloud)', 'FireReport schema', 'Indexed fields', 'Timestamps auto-managed', 'Mongoose validation', 'CRUD via REST API'],
          },
          {
            icon: Satellite, title: 'APIs', color: '#f59e0b',
            items: ['NASA FIRMS (hotspots)', 'Open-Meteo (weather)', 'OpenStreetMap (tiles)', 'All free tier', 'No paid APIs used', 'Key stored in backend .env'],
          },
        ].map(({ icon: Icon, title, color, items }) => (
          <div key={title} className="card-sm" style={{ border: `1px solid ${color}25` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: `${color}18`, border: `1px solid ${color}35`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={15} color={color} />
              </div>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{title}</span>
            </div>
            {items.map(item => (
              <div key={item} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', padding: '0.2rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ color, fontSize: '0.6rem' }}>▸</span> {item}
              </div>
            ))}
          </div>
        ))}
      </div>
    </Section>

    {/* Risk Engine */}
    <Section title="AI Risk Prediction Engine" icon={Zap} iconColor="var(--color-yellow)">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.7, margin: '0 0 0.875rem' }}>
            The risk engine in <CodeBadge>riskService.js</CodeBadge> uses a <strong style={{ color: 'var(--text-primary)' }}>weighted scoring model</strong>.
            Each factor is independently scored 0–100 then combined:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { label: '🌡️ Temperature', weight: 25, color: '#f97316' },
              { label: '💧 Humidity', weight: 20, color: '#06b6d4' },
              { label: '💨 Wind Speed', weight: 20, color: '#a78bfa' },
              { label: '🌧️ Rainfall', weight: 15, color: '#22c55e' },
              { label: '🔥 Fire Activity', weight: 20, color: '#ef4444' },
            ].map(({ label, weight, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', width: 140, flexShrink: 0 }}>{label}</span>
                <div style={{ flex: 1, height: 6, background: 'var(--bg-secondary)', borderRadius: 9999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${weight * 4}%`, background: color, borderRadius: 9999 }} />
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color, width: 32, textAlign: 'right' }}>{weight}%</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          <div style={{ padding: '0.875rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10 }}>
            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#f59e0b', marginBottom: '0.375rem' }}>⚠️ Prototype Disclaimer</div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
              This is an explainable scoring model for educational/demonstration use. It is <strong>NOT</strong> validated against historical wildfire datasets. Do not use for real emergency decisions.
            </p>
          </div>
          <div style={{ padding: '0.875rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10 }}>
            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#10b981', marginBottom: '0.375rem' }}>🚀 Future ML Path</div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
              The <CodeBadge>predictRisk(features)</CodeBadge> interface allows swapping the scoring logic for a trained Random Forest or Logistic Regression model with zero changes to the API or frontend.
            </p>
          </div>
        </div>
      </div>
    </Section>

    {/* Security */}
    <Section title="Security Measures" icon={Shield} iconColor="var(--color-safe)">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.5rem' }}>
        {[
          { icon: '🔐', text: 'API keys stored only in backend .env — never in frontend React code' },
          { icon: '🛡️', text: 'Helmet.js sets secure HTTP headers on every response' },
          { icon: '🌐', text: 'CORS configured to allow only the frontend origin URL' },
          { icon: '✅', text: 'Input validation on all API endpoints' },
          { icon: '📋', text: 'Mongoose schema-level validation for MongoDB documents' },
          { icon: '🚫', text: '.env and node_modules excluded via .gitignore' },
        ].map(({ icon, text }) => (
          <div key={text} style={{
            display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
            padding: '0.625rem 0.875rem', background: 'var(--bg-secondary)', borderRadius: 8,
          }}>
            <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{icon}</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{text}</span>
          </div>
        ))}
      </div>
    </Section>

    {/* API Reference */}
    <Section title="REST API Reference" icon={Code2} iconColor="var(--color-teal)">
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.875rem' }}>
        All API endpoints follow RESTful conventions. Base URL: <CodeBadge>http://localhost:5000/api</CodeBadge>
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
              {['Method', 'Endpoint', 'Description'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { method: 'GET', endpoint: '/health', desc: 'Server + DB status', color: '#06b6d4' },
              { method: 'GET', endpoint: '/fires', desc: 'NASA FIRMS satellite hotspots', color: '#06b6d4' },
              { method: 'GET', endpoint: '/weather?latitude=&longitude=', desc: 'Open-Meteo current weather', color: '#06b6d4' },
              { method: 'GET', endpoint: '/risk?latitude=&longitude=', desc: 'Wildfire risk prediction (GET)', color: '#06b6d4' },
              { method: 'POST', endpoint: '/risk', desc: 'Risk via JSON request body', color: '#10b981' },
              { method: 'GET', endpoint: '/reports', desc: 'List community fire reports', color: '#06b6d4' },
              { method: 'POST', endpoint: '/reports', desc: 'Submit new fire report', color: '#10b981' },
              { method: 'GET', endpoint: '/reports/:id', desc: 'Get single report by ID', color: '#06b6d4' },
              { method: 'PATCH', endpoint: '/reports/:id', desc: 'Update report status', color: '#f97316' },
            ].map(({ method, endpoint, desc, color }) => (
              <tr key={endpoint} style={{ borderBottom: '1px solid rgba(45,55,72,0.6)', transition: 'background 0.15s' }}>
                <td style={{ padding: '0.5rem 0.75rem' }}>
                  <span style={{
                    padding: '0.2rem 0.6rem', borderRadius: 5, fontSize: '0.7rem', fontWeight: 800,
                    background: `${color}18`, color, letterSpacing: '0.03em',
                  }}>{method}</span>
                </td>
                <td style={{ padding: '0.5rem 0.75rem' }}>
                  <code style={{ color: 'var(--text-primary)', fontSize: '0.78rem', fontFamily: 'monospace' }}>{endpoint}</code>
                </td>
                <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)' }}>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>

    {/* MERN Architecture */}
    <Section title="MERN Architecture Explained" icon={GitBranch} iconColor="#a78bfa">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
        {[
          { letter: 'M', name: 'MongoDB', role: 'Database', desc: 'Stores fire reports, scales to millions of records', color: '#10b981' },
          { letter: 'E', name: 'Express', role: 'Backend Framework', desc: 'REST API server, routes, middleware, error handling', color: '#f97316' },
          { letter: 'R', name: 'React', role: 'Frontend', desc: 'Interactive UI components, React Router, state management', color: '#06b6d4' },
          { letter: 'N', name: 'Node.js', role: 'Runtime', desc: 'JavaScript server-side runtime — runs Express backend', color: '#22c55e' },
        ].map(({ letter, name, role, desc, color }) => (
          <div key={letter} className="card-sm" style={{ borderTop: `3px solid ${color}`, textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color, lineHeight: 1, marginBottom: '0.25rem' }}>{letter}</div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.15rem' }}>{name}</div>
            <div style={{ fontSize: '0.72rem', color, fontWeight: 600, marginBottom: '0.5rem' }}>{role}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
          </div>
        ))}
      </div>
    </Section>

    {/* Viva prep */}
    <Section title="Viva Preparation Guide" icon={BookOpen} iconColor="#f59e0b">
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 0.875rem', lineHeight: 1.7 }}>
        Key topics to be ready to explain in your viva examination:
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.5rem' }}>
        {[
          { q: 'What is MERN?', a: 'MongoDB + Express + React + Node.js — a JavaScript-only full stack' },
          { q: 'What is REST API?', a: 'Architectural style using HTTP verbs (GET/POST/PATCH) with JSON data' },
          { q: 'What is NASA FIRMS?', a: 'Fire Information for Resource Management System — satellite fire detection' },
          { q: 'What is Mongoose?', a: 'ODM library that maps JavaScript objects to MongoDB documents' },
          { q: 'What is the risk engine?', a: 'A weighted scoring model: temp(25%) + humidity(20%) + wind(20%) + rain(15%) + fires(20%)' },
          { q: 'Why Open-Meteo?', a: 'Free weather API with no API key needed — perfect for academic projects' },
          { q: 'What is Leaflet?', a: 'Open-source JavaScript map library — renders OSM tiles and fire markers' },
          { q: 'What is dotenv?', a: 'Loads environment variables from .env file — keeps secrets out of code' },
          { q: 'Why separate backend?', a: 'Security — API keys are never exposed in the React frontend bundle' },
          { q: 'Future ML integration?', a: 'Replace predictRisk() internals with Random Forest model, same API interface' },
        ].map(({ q, a }) => (
          <div key={q} style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 8, borderLeft: '3px solid rgba(245,158,11,0.4)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>Q: {q}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>A: {a}</div>
          </div>
        ))}
      </div>
    </Section>
  </div>
);

export default About;
