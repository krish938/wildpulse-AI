/**
 * components/Sidebar.jsx
 * Left navigation sidebar with links to all application pages.
 */

import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  AlertTriangle,
  FileText,
  PlusCircle,
  BarChart3,
  Info,
  Flame,
  ChevronRight,
} from 'lucide-react';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', desc: 'Main overview' },
    ],
  },
  {
    label: 'Monitoring',
    items: [
      { to: '/map',  icon: Map,           label: 'Live Fire Map',    desc: 'NASA FIRMS hotspots' },
      { to: '/risk', icon: AlertTriangle, label: 'Risk Prediction',  desc: 'AI risk analysis' },
    ],
  },
  {
    label: 'Reports',
    items: [
      { to: '/reports',   icon: FileText,   label: 'Fire Reports', desc: 'Community reports' },
      { to: '/report',    icon: PlusCircle, label: 'Report Fire',  desc: 'Submit an incident' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { to: '/analytics', icon: BarChart3,  label: 'Analytics', desc: 'Charts & statistics' },
      { to: '/about',     icon: Info,       label: 'About',     desc: 'Project info & viva' },
    ],
  },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      padding: '0',
      flexShrink: 0,
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Subtle top gradient accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, #f97316, #ef4444, transparent)',
        pointerEvents: 'none',
      }} />

      {/* Logo area */}
      <div style={{
        padding: '1rem 1rem 0.875rem',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', gap: '0.625rem',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #f97316, #ef4444)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 12px rgba(249,115,22,0.4)',
        }}>
          <Flame size={18} color="white" />
        </div>
        <div>
          <div style={{ fontWeight: 900, fontSize: '1rem', lineHeight: 1.15, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            WildPulse
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--color-fire)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            AI Platform
          </div>
        </div>
      </div>

      {/* Navigation groups */}
      <nav style={{ flex: 1, padding: '0.625rem 0.625rem', overflowY: 'auto' }}>
        {navGroups.map(({ label, items }) => (
          <div key={label} style={{ marginBottom: '0.875rem' }}>
            <div style={{
              fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.1em',
              padding: '0 0.5rem', marginBottom: '0.3rem',
            }}>
              {label}
            </div>
            {items.map(({ to, icon: Icon, label: navLabel, desc }) => {
              const isActive = location.pathname === to;
              return (
                <NavLink
                  key={to}
                  to={to}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                    padding: '0.5rem 0.625rem',
                    borderRadius: 9,
                    marginBottom: '0.15rem',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                    background: isActive ? 'rgba(249,115,22,0.1)' : 'transparent',
                    border: `1px solid ${isActive ? 'rgba(249,115,22,0.25)' : 'transparent'}`,
                  }}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div style={{
                      position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                      width: 3, height: 18, borderRadius: '0 3px 3px 0',
                      background: 'var(--color-fire)',
                    }} />
                  )}

                  <div style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    background: isActive ? 'rgba(249,115,22,0.18)' : 'var(--bg-elevated)',
                    border: `1px solid ${isActive ? 'rgba(249,115,22,0.3)' : 'var(--border-color)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    <Icon size={14} color={isActive ? 'var(--color-fire)' : 'var(--text-muted)'} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.8rem', fontWeight: isActive ? 700 : 500,
                      color: isActive ? 'var(--color-fire)' : 'var(--text-secondary)',
                      lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {navLabel}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.05rem' }}>
                      {desc}
                    </div>
                  </div>

                  {isActive && <ChevronRight size={12} color="var(--color-fire)" style={{ flexShrink: 0 }} />}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom project info */}
      <div style={{
        borderTop: '1px solid var(--border-color)',
        padding: '0.75rem 1rem',
        background: 'rgba(11,14,26,0.5)',
      }}>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
          <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.1rem' }}>WildPulse AI v1.0</div>
          <div>Semester 7 Mini Project</div>
          <div>MERN Stack</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
