/**
 * components/LoadingSpinner.jsx
 * Reusable loading state component.
 */

const LoadingSpinner = ({ message = 'Loading...', size = 'md', fullPage = false }) => {
  const dim = { sm: 20, md: 32, lg: 48 }[size] ?? 32;
  const border = { sm: 2, md: 3, lg: 4 }[size] ?? 3;

  const inner = (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '0.875rem', padding: fullPage ? '0' : '2.5rem',
    }}>
      <div style={{
        width: dim, height: dim,
        border: `${border}px solid var(--border-color)`,
        borderTopColor: 'var(--color-fire)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
        flexShrink: 0,
      }} />
      {message && (
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          {message}
        </span>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(11,14,26,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)',
      }}>
        {inner}
      </div>
    );
  }

  return inner;
};

export default LoadingSpinner;
