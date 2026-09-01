/**
 * components/ErrorMessage.jsx
 * Reusable error state component with retry support.
 */

import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorMessage = ({ message, onRetry, compact = false }) => {
  if (compact) {
    return (
      <div className="alert-error">
        <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>{message}</span>
        {onRetry && (
          <button onClick={onRetry} className="btn-ghost" style={{ marginLeft: 'auto', color: '#fca5a5', padding: '0.2rem 0.5rem', fontSize: '0.75rem', flexShrink: 0 }}>
            <RefreshCw size={12} /> Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '1rem', padding: '3rem 2rem', textAlign: 'center',
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: '50%',
        background: 'rgba(239,68,68,0.12)',
        border: '1px solid rgba(239,68,68,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <AlertCircle size={24} color="var(--color-fire-extreme)" />
      </div>
      <div>
        <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
          Something went wrong
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: 420, lineHeight: 1.65 }}>
          {message}
        </div>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary" style={{ gap: '0.4rem' }}>
          <RefreshCw size={14} /> Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
