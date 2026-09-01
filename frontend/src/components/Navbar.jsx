/**
 * components/Navbar.jsx
 * Top navigation bar for the dashboard layout.
 */

import { Flame, Activity, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

const Navbar = () => {
  const [time, setTime] = useState(new Date());

  // Live clock update every second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header style={{
      height: 'var(--navbar-height)',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0 1.25rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
      zIndex: 20,
      gap: '1rem',
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: 'linear-gradient(135deg, #f97316, #ef4444)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 0 12px rgba(249,115,22,0.35)',
        }}>
          <Flame size={16} color="white" />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.1, letterSpacing: '-0.01em' }}>
            WildPulse <span style={{ color: 'var(--color-fire)' }}>AI</span>
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Monitor · Predict · Protect
          </div>
        </div>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Live monitoring badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--color-safe)',
            boxShadow: '0 0 7px var(--color-safe)',
            animation: 'pulse-fire 2.5s ease-in-out infinite',
          }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Live</span>
        </div>

        {/* Activity indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          <Activity size={13} />
          <span>Monitoring</span>
        </div>

        {/* Live clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
          <Clock size={12} />
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>
            {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
