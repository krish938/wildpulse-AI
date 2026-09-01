/**
 * components/StatCard.jsx
 * Dashboard statistic card — icon, metric value, and label.
 */

const StatCard = ({ icon: Icon, value, label, color = 'var(--color-fire)', sublabel, loading = false }) => (
  <div className="card" style={{ padding: '1.125rem 1.25rem' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {loading ? (
          <>
            <div className="skeleton" style={{ height: 32, width: 80, marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 12, width: 120 }} />
          </>
        ) : (
          <>
            <div style={{
              fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)',
              lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: '0.2rem',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {value ?? '—'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {label}
            </div>
            {sublabel && (
              <div style={{ fontSize: '0.7rem', color, fontWeight: 600, marginTop: '0.2rem' }}>
                {sublabel}
              </div>
            )}
          </>
        )}
      </div>

      {/* Icon */}
      <div style={{
        width: 42, height: 42, borderRadius: 11, flexShrink: 0,
        background: `${color}18`,
        border: `1px solid ${color}35`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={20} color={color} />
      </div>
    </div>

    {/* Bottom accent line */}
    <div style={{
      marginTop: '0.875rem',
      height: 2,
      borderRadius: 9999,
      background: `linear-gradient(90deg, ${color}50 0%, ${color}10 100%)`,
    }} />
  </div>
);

export default StatCard;
