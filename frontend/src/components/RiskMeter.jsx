/**
 * components/RiskMeter.jsx
 * Visual risk gauge: SVG arc + score + level badge + scale labels.
 *
 * Props:
 *   score  {number} 0–100 — overall risk score
 *   level  {string} 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME'
 */

const PALETTE = {
  LOW:      { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.3)',  glow: '#22c55e40' },
  MODERATE: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', glow: '#f59e0b40' },
  HIGH:     { color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)', glow: '#f9731640' },
  EXTREME:  { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  glow: '#ef444440' },
};

// ─── SVG Arc Gauge ─────────────────────────────────────────────────────────────
/**
 * Renders a 180° semicircle arc gauge.
 * The arc goes from left (0°) to right (180°), bottom of the semicircle is the pivot.
 * Filled portion = score %.
 */
const ArcGauge = ({ score, level }) => {
  const { color } = PALETTE[level] ?? PALETTE.LOW;
  const clampedScore = Math.min(100, Math.max(0, score));

  // SVG viewBox dimensions
  const cx    = 80;   // Center X
  const cy    = 72;   // Center Y (slightly above midpoint for visual balance)
  const r     = 60;   // Radius of arc
  const sw    = 12;   // Stroke width of arc track
  const innerR = r - sw / 2;

  // Arc math: we draw a 180° (π rad) semicircle from 180° to 0° (left to right)
  // pct = 0 → start of arc (left), pct = 1 → end of arc (right)
  const pct = clampedScore / 100;
  const startAngle = Math.PI;       // 180° = left of circle
  const endAngle   = 0;             // 0°   = right of circle
  const sweepAngle = startAngle - endAngle; // = π radians

  // Point on circle at angle θ (measured from positive X axis, clockwise in SVG)
  const pt = (theta) => ({
    x: cx + innerR * Math.cos(theta),
    y: cy - innerR * Math.sin(theta),
  });

  // Track arc path (full semicircle, always grey)
  const trackStart = pt(startAngle);
  const trackEnd   = pt(endAngle);
  const trackPath  = [
    `M ${trackStart.x} ${trackStart.y}`,
    `A ${innerR} ${innerR} 0 0 1 ${trackEnd.x} ${trackEnd.y}`,
  ].join(' ');

  // Fill arc path (filled proportion = pct of π)
  const fillAngle = startAngle - pct * sweepAngle;
  const fillEnd   = pt(fillAngle);
  // large-arc-flag = 1 if angle > π, else 0 — we never exceed π here so always 0
  const fillPath = pct === 0 ? null : [
    `M ${trackStart.x} ${trackStart.y}`,
    `A ${innerR} ${innerR} 0 0 1 ${fillEnd.x} ${fillEnd.y}`,
  ].join(' ');

  return (
    <svg
      viewBox="0 0 160 90"
      style={{ width: '100%', maxWidth: 220, display: 'block', margin: '0 auto' }}
      aria-label={`Risk gauge showing ${score}/100 — ${level}`}
    >
      {/* Drop shadow filter for glow effect */}
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Grey track (full semicircle) */}
      <path
        d={trackPath}
        fill="none"
        stroke="var(--bg-secondary, #1e2433)"
        strokeWidth={sw}
        strokeLinecap="round"
      />

      {/* Coloured fill arc */}
      {fillPath && (
        <path
          d={fillPath}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          filter="url(#glow)"
          style={{ transition: 'stroke-dasharray 0.8s ease, d 0.5s ease' }}
        />
      )}

      {/* Needle dot at the fill end */}
      {pct > 0 && pct < 1 && (
        <circle
          cx={fillEnd.x}
          cy={fillEnd.y}
          r={sw / 2 + 1}
          fill={color}
          filter="url(#glow)"
        />
      )}

      {/* Centre: score number */}
      <text
        x={cx}
        y={cy + 6}
        textAnchor="middle"
        fill={color}
        fontSize="26"
        fontWeight="900"
        fontFamily="inherit"
        style={{ letterSpacing: '-1px' }}
      >
        {clampedScore}
      </text>

      {/* "/100" beneath score */}
      <text
        x={cx}
        y={cy + 18}
        textAnchor="middle"
        fill="var(--text-muted, #64748b)"
        fontSize="9"
        fontWeight="600"
      >
        / 100
      </text>

      {/* Scale labels: 0 at left, 50 at top, 100 at right */}
      <text x={cx - r - 2} y={cy + 4} textAnchor="end"   fill="var(--text-muted, #64748b)" fontSize="7">0</text>
      <text x={cx}         y={cy - r - 6} textAnchor="middle" fill="var(--text-muted, #64748b)" fontSize="7">50</text>
      <text x={cx + r + 2} y={cy + 4} textAnchor="start" fill="var(--text-muted, #64748b)" fontSize="7">100</text>
    </svg>
  );
};

// ─── Main RiskMeter ────────────────────────────────────────────────────────────

const RiskMeter = ({ score = 0, level = 'LOW' }) => {
  const { color, bg, border } = PALETTE[level] ?? PALETTE.LOW;

  return (
    <div>
      {/* SVG arc gauge */}
      <ArcGauge score={score} level={level} />

      {/* Level badge — centred below gauge */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.375rem' }}>
        <div style={{
          padding: '0.3rem 1rem',
          borderRadius: 9999,
          background: bg,
          border: `1px solid ${border}`,
          color,
          fontWeight: 800,
          fontSize: '0.78rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          boxShadow: `0 0 14px ${color}30`,
          userSelect: 'none',
        }}>
          {level} RISK
        </div>
      </div>

      {/* Scale legend */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginTop: '0.625rem',
      }}>
        {['LOW', 'MODERATE', 'HIGH', 'EXTREME'].map((l) => (
          <span key={l} style={{
            fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.04em',
            color: level === l ? PALETTE[l].color : 'var(--text-muted)',
            transition: 'color 0.25s',
          }}>
            {l}
          </span>
        ))}
      </div>
    </div>
  );
};

export default RiskMeter;
