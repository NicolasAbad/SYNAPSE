// Sprint 9a Phase 9a.2 — Settings modal hosting Restore Purchases (MONEY-3, GDD §26).
// Hosts the entry point for: Restore Purchases (here, 9a.2). Subscription tile,
// Genius Pass info, and other monetization surfaces land in 9b/10.
//
// Adapter injection: parent (App.tsx) creates a RevenueCatAdapter on native and
// passes its `restorePurchases` method as a prop. In web preview / tests, prop
// is undefined → button disabled with a "native only" hint. Tests pass a mock.

import { memo, useCallback, useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { en } from '../../config/strings/en';
import type { CustomerInfo } from '../../platform/revenuecat';

const t = en.settings;

type RestoreFn = () => Promise<CustomerInfo>;
type RestoreStatus = 'idle' | 'pending' | 'success' | 'none-found' | 'failed';

export interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  /** When undefined, Restore Purchases is disabled (web/test preview). */
  restorePurchases?: RestoreFn;
  /** Sprint 9b Phase 9b.2 — opens the Cosmetics Store modal. */
  onOpenCosmetics?: () => void;
}

const overlayStyle = { // CONST-OK CSS style object
  position: 'fixed' as const,
  inset: 0,
  background: 'rgba(5, 7, 13, 0.92)', // CONST-OK CSS dim-overlay alpha
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 945, // CONST-OK above HUD, below splash
  padding: 'var(--spacing-6)', // CONST-OK CSS spacing token
};

const cardStyle = { // CONST-OK CSS style object
  background: 'var(--color-bg-deep, #0a0e1a)',
  border: '1px solid var(--color-border-subtle, #1f2937)', // CONST-OK CSS fallback
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--spacing-6)', // CONST-OK CSS spacing token
  maxWidth: '420px', // CONST-OK CSS max-width readable
  width: '100%', // CONST-OK CSS full-width idiom
};

const titleStyle = { // CONST-OK CSS style object
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--text-xl)',
  fontWeight: 'var(--font-weight-light)',
  marginTop: 0,
  marginBottom: 'var(--spacing-4)', // CONST-OK CSS spacing token
};

const buttonStyle = { // CONST-OK CSS style object
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
  cursor: 'pointer',
};

const secondaryButtonStyle = { ...buttonStyle, background: 'transparent', border: '1px solid var(--color-border-subtle, #1f2937)' }; // CONST-OK CSS fallback

const disabledButtonStyle = { ...buttonStyle, opacity: 0.55, cursor: 'not-allowed' as const }; // CONST-OK CSS faded-state

const statusLineStyle = { // CONST-OK CSS style object
  marginTop: 'var(--spacing-3)', // CONST-OK CSS spacing token
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-secondary)',
  minHeight: '1.5em', // CONST-OK CSS reserved line-height to prevent layout shift
};

function statusLabel(status: RestoreStatus): string {
  if (status === 'pending') return t.restorePending;
  if (status === 'success') return t.restoreSuccess;
  if (status === 'none-found') return t.restoreNoneFound;
  if (status === 'failed') return t.restoreFailed;
  return '';
}

export const SettingsModal = memo(function SettingsModal({ open, onClose, restorePurchases, onOpenCosmetics }: SettingsModalProps) {
  const setSubscriptionStatus = useGameStore((s) => s.setSubscriptionStatus);
  const [status, setStatus] = useState<RestoreStatus>('idle');

  // Reset status whenever the modal re-opens, so a prior failure/success
  // toast doesn't linger across opens.
  useEffect(() => {
    if (open) setStatus('idle');
  }, [open]);

  // Esc closes (parity with ConfirmModal).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const onRestoreClick = useCallback(async () => {
    if (!restorePurchases) return;
    setStatus('pending');
    try {
      const info = await restorePurchases();
      const hasPass = info.activeEntitlements.includes('genius_pass');
      setSubscriptionStatus(hasPass);
      setStatus(hasPass ? 'success' : 'none-found');
    } catch {
      setStatus('failed');
    }
  }, [restorePurchases, setSubscriptionStatus]);

  if (!open) return null;

  const restoreDisabled = restorePurchases === undefined || status === 'pending';

  return (
    <div data-testid="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title" style={overlayStyle}>
      <div style={cardStyle}>
        <h2 id="settings-title" data-testid="settings-title" style={titleStyle}>{t.title}</h2>

        <button
          type="button"
          data-testid="settings-restore"
          disabled={restoreDisabled}
          onClick={restoreDisabled ? undefined : onRestoreClick}
          style={restoreDisabled ? disabledButtonStyle : buttonStyle}
        >
          {t.restoreButton}
        </button>

        <p data-testid="settings-restore-status" style={statusLineStyle}>{statusLabel(status)}</p>

        {onOpenCosmetics && (
          <button
            type="button"
            data-testid="settings-cosmetics"
            onClick={onOpenCosmetics}
            style={buttonStyle}
          >
            {t.cosmeticsButton}
          </button>
        )}

        <button
          type="button"
          data-testid="settings-close"
          onClick={onClose}
          style={secondaryButtonStyle}
        >
          {t.closeButton}
        </button>
      </div>
    </div>
  );
});
