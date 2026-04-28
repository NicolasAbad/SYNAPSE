// Sprint 9b Phase 9b.4 — Starter Pack modal (GDD §26).
// Appears post-P2, 48h window, one-time-only. Per V-e, layered as a separate
// modal AFTER AwakeningScreen completes (not inside the awakening flow).
//
// Bundle contents shown as a 3-item list. 48h countdown in the header. "Accept"
// calls `acceptStarterPack` store action (unlocks bundle). "Not now" calls
// `dismissStarterPack` (closes the window permanently). If 48h expires while
// modal is closed, component returns null on re-render (isStarterPackVisible
// gates).

import { memo, useCallback, useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { isStarterPackVisible } from '../../engine/starterPackTrigger';
import { SYNAPSE_CONSTANTS } from '../../config/constants';
import { en } from '../../config/strings/en';

const t = en.starterPack;

const overlayStyle = { // CONST-OK CSS style object
  position: 'fixed' as const,
  inset: 0,
  background: 'rgba(5, 7, 13, 0.94)', // CONST-OK CSS dim-overlay alpha
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 948, // CONST-OK HUD layer band
  padding: 'var(--spacing-5)', // CONST-OK CSS spacing token
  // Mi A3 playtest fix: this modal mounts via OfferOrchestrator which lives
  // inside HUD (whose wrapper sets pointerEvents: 'none'). Without this
  // explicit override the Accept / Not now buttons are dead and the player
  // is softlocked.
  pointerEvents: 'auto' as const,
};

const cardStyle = { // CONST-OK CSS style object
  background: 'var(--color-bg-deep, #0a0e1a)',
  border: '1px solid var(--color-warning, #ffb454)', // CONST-OK CSS fallback — warm accent for offer
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--spacing-6)', // CONST-OK CSS spacing token
  maxWidth: '440px', // CONST-OK CSS max-width readable
  width: '100%', // CONST-OK CSS full-width idiom
};

const titleStyle = { // CONST-OK CSS style object
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--text-xl)',
  fontWeight: 'var(--font-weight-light)',
  margin: 0,
  marginBottom: 'var(--spacing-1)', // CONST-OK CSS spacing token
};

const subtitleStyle = { // CONST-OK CSS style object
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-secondary)',
  marginBottom: 'var(--spacing-4)', // CONST-OK CSS spacing token
  fontStyle: 'italic' as const,
};

const bundleListStyle = { // CONST-OK CSS style object
  listStyle: 'none' as const,
  padding: 0,
  margin: 0,
  marginBottom: 'var(--spacing-4)', // CONST-OK CSS spacing token
};

const bundleItemStyle = { // CONST-OK CSS style object
  padding: 'var(--spacing-2) 0', // CONST-OK CSS spacing token
  borderBottom: '1px solid var(--color-border-subtle, #1f2937)', // CONST-OK CSS fallback
  fontSize: 'var(--text-sm)',
};

const timerStyle = { // CONST-OK CSS style object
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-secondary)',
  marginBottom: 'var(--spacing-3)', // CONST-OK CSS spacing token
};

const primaryButtonStyle = { // CONST-OK CSS style object
  display: 'block',
  width: '100%', // CONST-OK CSS full-width idiom
  marginTop: 'var(--spacing-3)', // CONST-OK CSS spacing token
  padding: 'var(--spacing-3) var(--spacing-4)', // CONST-OK CSS spacing tokens
  background: 'var(--color-warning, #ffb454)', // CONST-OK CSS fallback
  color: 'var(--color-bg-deep, #0a0e1a)',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-md)',
  fontWeight: 'var(--font-weight-semibold)',
  cursor: 'pointer',
  touchAction: 'manipulation' as const,
};

const secondaryButtonStyle = { // CONST-OK CSS style object
  ...primaryButtonStyle,
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  border: '1px solid var(--color-border-subtle, #1f2937)', // CONST-OK CSS fallback
  fontWeight: 'var(--font-weight-normal)',
};

function formatCountdown(msRemaining: number): string {
  if (msRemaining <= 0) return '0h 0m';
  const totalMinutes = Math.floor(msRemaining / 60_000); // CONST-OK ms→min
  const hours = Math.floor(totalMinutes / 60); // CONST-OK min→h
  const minutes = totalMinutes - hours * 60; // CONST-OK min→h
  return `${hours}h ${minutes}m`;
}

export interface StarterPackModalProps {
  open: boolean;
  onClose: () => void;
}

export const StarterPackModal = memo(function StarterPackModal({ open, onClose }: StarterPackModalProps) {
  const state = useGameStore((s) => ({
    prestigeCount: s.prestigeCount,
    starterPackPurchased: s.starterPackPurchased,
    starterPackDismissed: s.starterPackDismissed,
    starterPackExpiresAt: s.starterPackExpiresAt,
  }));
  const acceptStarterPack = useGameStore((s) => s.acceptStarterPack);
  const dismissStarterPack = useGameStore((s) => s.dismissStarterPack);
  const stampStarterPackExpiry = useGameStore((s) => s.stampStarterPackExpiry);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    if (!open) return;
    if (state.starterPackExpiresAt === 0) stampStarterPackExpiry(Date.now());
    const id = setInterval(() => setNow(Date.now()), 30_000); // CONST-OK UI timing — 30s countdown tick
    return () => clearInterval(id);
  }, [open, state.starterPackExpiresAt, stampStarterPackExpiry]);

  const onAccept = useCallback(() => {
    acceptStarterPack();
    onClose();
  }, [acceptStarterPack, onClose]);

  const onDismiss = useCallback(() => {
    dismissStarterPack();
    onClose();
  }, [dismissStarterPack, onClose]);

  if (!open) return null;
  if (!isStarterPackVisible({ state, nowTimestamp: now })) return null;

  const expiresAt = state.starterPackExpiresAt === 0
    ? now + SYNAPSE_CONSTANTS.starterPackExpiryMs
    : state.starterPackExpiresAt;
  const remaining = expiresAt - now;

  return (
    <div data-testid="starter-pack-modal" role="dialog" aria-modal="true" aria-labelledby="starter-pack-title" style={overlayStyle}>
      <div style={cardStyle}>
        <h2 id="starter-pack-title" data-testid="starter-pack-title" style={titleStyle}>{t.title}</h2>
        <p style={subtitleStyle}>{t.subtitle}</p>

        <p data-testid="starter-pack-timer" style={timerStyle}>{t.timerLabel}: {formatCountdown(remaining)}</p>

        <ul data-testid="starter-pack-bundle" style={bundleListStyle}>
          <li style={bundleItemStyle}>{t.itemSparks}</li>
          <li style={bundleItemStyle}>{t.itemMemories}</li>
          <li style={bundleItemStyle}>{t.itemTheme}</li>
        </ul>

        <button type="button" data-testid="starter-pack-accept" onClick={onAccept} style={primaryButtonStyle}>
          {t.buyButton}
        </button>
        <button type="button" data-testid="starter-pack-dismiss" onClick={onDismiss} style={secondaryButtonStyle}>
          {t.dismissButton}
        </button>
      </div>
    </div>
  );
});
