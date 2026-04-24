// Sprint 9b Phase 9b.5 — Piggy Bank claim modal (GDD §26, MONEY-10).
// Replaces the Sprint 9a.4 PiggyBankAdChip stub. Per V-4 approved: break is
// $0.99-only; no ad-refill path. On claim, adds current `piggyBankSparks` to
// `sparks` and flips `piggyBankBroken: true`.
//
// Sprint 9b.6 wires the $0.99 RevenueCat `piggy_break` product purchase flow;
// for 9b.5 the button calls `claimPiggyBank` directly (stub path — replaced
// by purchase-success callback in 9b.6).

import { memo, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import { en } from '../../config/strings/en';

const t = en.piggyBank;

const overlayStyle = { // CONST-OK CSS style object
  position: 'fixed' as const,
  inset: 0,
  background: 'rgba(5, 7, 13, 0.94)', // CONST-OK CSS dim-overlay alpha
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 947, // CONST-OK HUD layer band
  padding: 'var(--spacing-5)', // CONST-OK CSS spacing token
};

const cardStyle = { // CONST-OK CSS style object
  background: 'var(--color-bg-deep, #0a0e1a)',
  border: '1px solid var(--color-warning, #ffb454)', // CONST-OK CSS fallback
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--spacing-6)', // CONST-OK CSS spacing token
  maxWidth: '400px', // CONST-OK CSS readable width
  width: '100%', // CONST-OK CSS full-width idiom
};

const titleStyle = { // CONST-OK CSS style object
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--text-xl)',
  fontWeight: 'var(--font-weight-light)',
  margin: 0,
  marginBottom: 'var(--spacing-2)', // CONST-OK CSS spacing token
};

const subtitleStyle = { // CONST-OK CSS style object
  color: 'var(--color-text-secondary)',
  fontSize: 'var(--text-sm)',
  marginBottom: 'var(--spacing-4)', // CONST-OK CSS spacing token
};

const sparksStyle = { // CONST-OK CSS style object
  display: 'flex' as const,
  justifyContent: 'space-between' as const,
  padding: 'var(--spacing-3) 0', // CONST-OK CSS spacing token
  borderTop: '1px solid var(--color-border-subtle, #1f2937)', // CONST-OK CSS fallback
  borderBottom: '1px solid var(--color-border-subtle, #1f2937)', // CONST-OK CSS fallback
  marginBottom: 'var(--spacing-4)', // CONST-OK CSS spacing token
  fontWeight: 'var(--font-weight-semibold)',
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

export interface PiggyBankClaimModalProps {
  open: boolean;
  onClose: () => void;
}

export const PiggyBankClaimModal = memo(function PiggyBankClaimModal({ open, onClose }: PiggyBankClaimModalProps) {
  const piggyBankSparks = useGameStore((s) => s.piggyBankSparks);
  const piggyBankBroken = useGameStore((s) => s.piggyBankBroken);
  const claimPiggyBank = useGameStore((s) => s.claimPiggyBank);

  const onClaim = useCallback(() => {
    claimPiggyBank();
    onClose();
  }, [claimPiggyBank, onClose]);

  if (!open) return null;

  return (
    <div data-testid="piggy-claim-modal" role="dialog" aria-modal="true" aria-labelledby="piggy-claim-title" style={overlayStyle}>
      <div style={cardStyle}>
        <h2 id="piggy-claim-title" data-testid="piggy-claim-title" style={titleStyle}>{t.modalTitle}</h2>
        <p style={subtitleStyle}>{t.modalBody}</p>

        <div data-testid="piggy-claim-sparks" style={sparksStyle}>
          <span>{t.sparksAvailable}</span>
          <span>{piggyBankSparks}</span>
        </div>

        {piggyBankBroken ? (
          <p data-testid="piggy-claim-broken-note" style={subtitleStyle}>{t.brokenNote}</p>
        ) : (
          <button type="button" data-testid="piggy-claim-break" onClick={onClaim} style={primaryButtonStyle}>
            {t.breakButton}
          </button>
        )}

        <button type="button" data-testid="piggy-claim-dismiss" onClick={onClose} style={secondaryButtonStyle}>
          {t.dismissButton}
        </button>
      </div>
    </div>
  );
});
