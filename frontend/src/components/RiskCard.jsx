/**
 * components/RiskCard.jsx
 * Full wildfire risk analysis card.
 *
 * Shows:
 *  - SVG arc gauge (RiskMeter)
 *  - One-sentence explanation
 *  - Confidence + model type
 *  - Factor breakdown bars (one per input variable)
 *  - "Why this risk?" narrative bullets
 *  - Nearby fire stats (if any)
 *
 * Props:
 *   risk      {Object|null} — risk result from /api/risk
 *   loading   {boolean}
 *   fireStats {Object|null} — { count, avgFRP, maxFRP } (from parent, optional)
 */

import RiskMeter from './RiskMeter';
import { Target, HelpCircle, Thermometer, Droplets, Wind, CloudRain, Flame, Info } from 'lucide-react';

// ─── Colour helpers ────────────────────────────────────────────────────────────
const LEVEL_COLORS = {
  LOW:      '#22c55e',
  MODERATE: '#f59e0b',
  HIGH:     '#f97316',
  EXTREME:  '#ef4444',
};

const IMPACT_COLORS = {
  Low:      '#22c55e',
  Moderate: '#f59e0b',
  High:     '#f97316',
  Extreme:  '#ef4444',
};

const impactColor = (impact) => IMPACT_COLORS[impact] ?? '#8b97b8';
const levelColor  = (level)  => LEVEL_COLORS[level]  ?? '#8b97b8';

// ─── Factor icon map ───────────────────────────────────────────────────────────
const FACTOR_ICONS = {
  thermometer: Thermometer,
  droplets:    Droplets,
  wind:        Wind,
  'cloud-rain': CloudRain,
  flame:       Flame,
};

// ─── Factor breakdown bar ──────────────────────────────────────────────────────
const FactorBar = ({ factor }) => {
  const Icon  = FACTOR_ICONS[factor.icon] ?? Info;
  const color = impactColor(factor.impact);

  return (
    <div style={{ marginBottom: '0.55rem' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '0.2rem',
      }}>
        {/* Label + icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Icon size={11} color={color} strokeWidth={2.5} />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            {factor.label}
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            ({Math.round(factor.weight * 100)}%)
          </span>
        </div>
        {/* Score + value */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            {factor.value}
          </span>
          <span style={{
            fontSize: '0.62rem', fontWeight: 700, color,
            background: `${color}18`, border: `1px solid ${color}40`,
            borderRadius: 4, padding: '0.05rem 0.35rem',
          }}>
            {factor.impact}
          </span>
        </div>
      </div>

      {/* Mini progress bar */}
      <div style={{
        height: 5, borderRadius: 9999,
        background: 'var(--bg-secondary)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${Math.min(factor.score, 100)}%`,
          background: `linear-gradient(90deg, ${color}70, ${color})`,
          borderRadius: 9999,
          transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: `0 0 6px ${color}50`,
        }} />
      </div>
    </div>
  );
};

// ─── Skeleton ──────────────────────────────────────────────────────────────────
const RiskSkeleton = () => (
  <div className="card" style={{ padding: '1.125rem' }}>
    <div className="skeleton" style={{ height: 13, width: 160, marginBottom: '1rem' }} />
    <div className="skeleton" style={{ height: 120, marginBottom: '0.875rem', borderRadius: 8 }} />
    <div className="skeleton" style={{ height: 9, marginBottom: '0.75rem' }} />
    <div className="skeleton" style={{ height: 11, width: 160, marginBottom: '1rem' }} />
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} style={{ marginBottom: '0.6rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <div className="skeleton" style={{ height: 10, width: 80 }} />
          <div className="skeleton" style={{ height: 10, width: 50 }} />
        </div>
        <div className="skeleton" style={{ height: 5, borderRadius: 9999 }} />
      </div>
    ))}
  </div>
);

// ─── Empty state ───────────────────────────────────────────────────────────────
const RiskEmpty = () => (
  <div className="card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
    <Target size={28} color="var(--text-muted)" style={{ marginBottom: '0.75rem' }} />
    <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
      No risk data yet
    </div>
    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.55 }}>
      Select a location to run the wildfire risk analysis
    </div>
  </div>
);

// ─── Main RiskCard ─────────────────────────────────────────────────────────────
const RiskCard = ({ risk, loading }) => {
  if (loading) return <RiskSkeleton />;
  if (!risk)   return <RiskEmpty />;

  const color = levelColor(risk.level);

  return (
    <div className="card" style={{ padding: '1.125rem' }}>
      {/* Header */}
      <div className="section-title" style={{ fontSize: '0.82rem', marginBottom: '0.875rem' }}>
        <Target size={13} color="var(--color-fire)" /> Wildfire Risk Analysis
      </div>

      {/* Arc gauge + level badge */}
      <RiskMeter score={risk.score} level={risk.level} />

      {/* One-sentence explanation */}
      <div style={{
        margin: '0.875rem 0 0.5rem',
        fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6,
        borderLeft: `3px solid ${color}`,
        paddingLeft: '0.625rem',
      }}>
        {risk.explanation}
      </div>

      {/* Confidence + model info */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.375rem',
        fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '1rem',
        flexWrap: 'wrap',
      }}>
        <HelpCircle size={10} />
        <span>Confidence: <strong style={{ color: 'var(--text-secondary)' }}>
          {risk.confidence ? `${Math.round(risk.confidence * 100)}%` : '—'}
        </strong></span>
        <span style={{ color: 'var(--border-color)' }}>·</span>
        <span>{risk.modelType}</span>
      </div>

      {/* Factor breakdown section */}
      {risk.factorBreakdown?.length > 0 && (
        <div style={{ marginBottom: '0.875rem' }}>
          <div style={{
            fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '0.5rem',
          }}>
            Factor Breakdown
          </div>
          {risk.factorBreakdown.map((f) => (
            <FactorBar key={f.key} factor={f} />
          ))}
        </div>
      )}

      {/* Why this risk — narrative bullets */}
      {risk.factors?.length > 0 && (
        <div>
          <div style={{
            fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '0.4rem',
          }}>
            Why this risk?
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {risk.factors.map((factor, i) => (
              <div key={i} style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                padding: '0.4rem 0.6rem',
                background: 'var(--bg-secondary)',
                borderRadius: 7,
                lineHeight: 1.5,
                borderLeft: '2px solid var(--border-color)',
              }}>
                {factor}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nearby fire stats — only when fires exist */}
      {risk.fireStats?.count > 0 && (
        <div style={{
          marginTop: '0.875rem',
          padding: '0.625rem 0.75rem',
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 8,
          fontSize: '0.72rem',
          color: 'var(--text-secondary)',
        }}>
          <div style={{ fontWeight: 700, marginBottom: '0.25rem', color: '#f97316' }}>
            🔥 Nearby fire activity
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <span>{risk.fireStats.count} hotspot{risk.fireStats.count !== 1 ? 's' : ''}</span>
            {risk.fireStats.avgFRP > 0 && (
              <span>Avg FRP: {risk.fireStats.avgFRP.toFixed(1)} MW</span>
            )}
            {risk.fireStats.maxFRP > 0 && (
              <span>Peak FRP: {risk.fireStats.maxFRP.toFixed(1)} MW</span>
            )}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div style={{
        marginTop: '0.875rem',
        paddingTop: '0.625rem',
        borderTop: '1px solid var(--border-color)',
        fontSize: '0.62rem',
        color: 'var(--text-muted)',
        lineHeight: 1.55,
      }}>
        <Info size={9} style={{ display: 'inline', marginRight: 3 }} />
        For educational purposes only. Not a validated scientific forecast.
      </div>
    </div>
  );
};

export default RiskCard;
