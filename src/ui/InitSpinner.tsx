// Pre-launch audit Day 2 — RevenueCat init spinner.
//
// On Capacitor cold-start, RevenueCat.initialize() can block 2-5s on slow
// networks. Pre-audit, the live game rendered immediately and any IAP intents
// silently hung. This overlay tells the player the store is loading.
//
// Suppresses display for the first ~700ms (no flash on fast inits). After
// that window, fades in a centered "Loading store…" pill with subtle pulse.

import { memo, useEffect, useState } from 'react';

const SUPPRESS_FLASH_MS = 700; // CONST-OK don't show overlay on fast inits

export interface InitSpinnerProps {
  show: boolean;
  label: string;
}

export const InitSpinner = memo(function InitSpinner({ show, label }: InitSpinnerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!show) { setVisible(false); return; }
    const timer = setTimeout(() => setVisible(true), SUPPRESS_FLASH_MS);
    return () => clearTimeout(timer);
  }, [show]);

  if (!show || !visible) return null;
  return (
    <div
      data-testid="init-spinner"
      role="status"
      aria-live="polite"
      style={overlayStyle}
    >
      <div style={pillStyle}>
        <span style={dotStyle} aria-hidden="true">●</span>
        <span>{label}</span>
      </div>
    </div>
  );
});

// CONST-OK CSS style objects only.
const overlayStyle = {
  position: 'fixed' as const,
  top: 0, right: 0, bottom: 0, left: 0,
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + var(--spacing-12))', // CONST-OK CSS
  pointerEvents: 'none' as const,
  zIndex: 800, // CONST-OK below modals (900+) but above HUD chrome
};

const pillStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--spacing-2)', // CONST-OK CSS
  padding: 'var(--spacing-2) var(--spacing-4)', // CONST-OK CSS
  background: 'rgba(15, 23, 42, 0.92)', // CONST-OK alpha pill bg
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-pill, 999px)',
  color: 'var(--color-text-secondary)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-sm)',
  pointerEvents: 'none' as const,
};

const dotStyle = {
  color: 'var(--color-primary)',
  animation: 'synapse-tap-floater 1200ms ease-in-out infinite alternate', // CONST-OK piggyback existing animation
};
