/**
 * pages/NotFound.jsx
 * 404 page.
 */

import { useNavigate } from 'react-router-dom';
import { Flame } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center', gap: '1rem', padding: '2rem' }}>
      <Flame size={48} color="var(--color-fire)" />
      <h1 style={{ fontSize: '4rem', fontWeight: 900, margin: 0, color: 'var(--text-muted)' }}>404</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', margin: 0 }}>Page not found — this area is off the map.</p>
      <button onClick={() => navigate('/')} className="btn-primary" style={{ marginTop: '0.5rem' }}>Go Home</button>
    </div>
  );
};

export default NotFound;
