// Sprint 9b Phase 9b.5 — Limited-Time Offer modal (GDD §26).
// Generic shell for the 3 v1.0 offers defined in config/limitedTimeOffers.ts.
// 48h countdown in header; Accept calls `acceptLimitedTimeOffer` (applies
// bundle contents); Dismiss calls `consumeLimitedTimeOffer` (flags as seen,
// never re-triggers).

import { memo, useCallback, useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { findLimitedTimeOffer } from '../../config/limitedTimeOffers';
import { en } from '../../config/strings/en';

const t = en.limitedTimeOffer;

const overlayStyle = { // CONST-OK CSS style object
  position: 'fixed' as const,
  inset: 0,
  background: 'rgba(5, 7, 13, 0.94)', // CONST-OK CSS dim-overlay alpha
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 947, // CONST-OK HUD layer band
  padding: 'var(--spacing-5)', // CONST-OK CSS spacing token
  pointerEvents: 'auto' as const, // playtest fix — modal mounts under HUD wrapper which sets none
};

const cardStyle = { // CONST-OK CSS style object
  background: 'var(--color-bg-deep, #0a0e1a)',
  border: '1px solid var(--color-accent, #4090E0)', // CONST-OK CSS fallback
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--spacing-6)', // CONST-OK CSS spacing token
  maxWidth: '420px', // CONST-OK CSS readable width
  width: '100%', // CONST-OK CSS full-width idiom
};

const titleStyle = { // CONST-OK CSS style object
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--text-xl)',
  fontWeight: 'var(--font-weight-light)',
  margin: 0,
  marginBottom: 'var(--spacing-1)', // CONST-OK CSS spacing token
};

const descStyle = { // CONST-OK CSS style object
  color: 'var(--color-text-secondary)',
  fontSize: 'var(--text-sm)',
  marginBottom: 'var(--spacing-4)', // CONST-OK CSS spacing token
  fontStyle: 'italic' as const,
};

const timerStyle = { // CONST-OK CSS style object
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-secondary)',
  marginBottom: 'var(--spacing-4)', // CONST-OK CSS spacing token
};

const primaryButtonStyle = { // CONST-OK CSS style object
  display: 'block',
  width: '100%', // CONST-OK CSS full-width idiom
  marginTop: 'var(--spacing-3)', // CONST-OK CSS spacing token
  padding: 'var(--spacing-3) var(--spacing-4)', // CONST-OK CSS spacing tokens
  background: 'var(--color-accent, #4090E0)', // CONST-OK CSS fallback
  color: 'var(--color-text-on-accent, #fff)',
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

function offerName(offerId: string): string {
  const offer = t[offerId as 'dual_nature_pack' | 'mutant_bundle' | 'deep_mind_pack'];
  return offer ? offer.name : offerId;
}

function offerDescription(offerId: string): string {
  const offer = t[offerId as 'dual_nature_pack' | 'mutant_bundle' | 'deep_mind_pack'];
  return offer ? offer.description : '';
}

export interface LimitedTimeOfferModalProps {
  open: boolean;
  offerId: string;
  onClose: () => void;
}

export const LimitedTimeOfferModal = memo(function LimitedTimeOfferModal({ open, offerId, onClose }: LimitedTimeOfferModalProps) {
  const activeLimitedOffer = useGameStore((s) => s.activeLimitedOffer);
  const acceptLimitedTimeOffer = useGameStore((s) => s.acceptLimitedTimeOffer);
  const consumeLimitedTimeOffer = useGameStore((s) => s.consumeLimitedTimeOffer);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setNow(Date.now()), 30_000); // CONST-OK UI timing — 30s countdown tick
    return () => clearInterval(id);
  }, [open]);

  const def = findLimitedTimeOffer(offerId);

  const onAccept = useCallback(() => {
    acceptLimitedTimeOffer(offerId);
    onClose();
  }, [acceptLimitedTimeOffer, offerId, onClose]);

  const onDismiss = useCallback(() => {
    consumeLimitedTimeOffer(offerId);
    onClose();
  }, [consumeLimitedTimeOffer, offerId, onClose]);

  if (!open || !def) return null;

  const expiresAt = activeLimitedOffer?.id === offerId ? activeLimitedOffer.expiresAt : now;
  const remaining = expiresAt - now;

  return (
    <div data-testid={`limited-offer-${offerId}`} role="dialog" aria-modal="true" aria-labelledby={`limited-offer-title-${offerId}`} style={overlayStyle}>
      <div style={cardStyle}>
        <h2 id={`limited-offer-title-${offerId}`} data-testid={`limited-offer-title-${offerId}`} style={titleStyle}>
          {offerName(offerId)}
        </h2>
        <p style={descStyle}>{offerDescription(offerId)}</p>
        <p data-testid={`limited-offer-timer-${offerId}`} style={timerStyle}>
          {t.timerLabel}: {formatCountdown(remaining)}
        </p>

        <button type="button" data-testid={`limited-offer-accept-${offerId}`} onClick={onAccept} style={primaryButtonStyle}>
          {t.buyButton} ${def.priceUsd.toFixed(2)/* CONST-OK 2-decimal price display */}
        </button>
        <button type="button" data-testid={`limited-offer-dismiss-${offerId}`} onClick={onDismiss} style={secondaryButtonStyle}>
          {t.dismissButton}
        </button>
      </div>
    </div>
  );
});
