// Sprint 9b Phase 9b.4 — Genius Pass offer modal (GDD §26 + MONEY-9).
// Trigger contexts per GDD §26: post-P1 / post-Personal Best / post-P5 /
// post-P10 / post-Transcendence. Respects `geniusPassOfferMinIntervalMs` (72h)
// and `geniusPassMaxDismissals` (3) via `shouldOfferGeniusPass` pure helper.
//
// MONEY-9 compliance: the "All content accessible for free" badge appears
// BEFORE the subscribe CTAs. Auto-renew + cancel instructions per MONEY-2.
// Prices come from RevenueCat Offerings in Phase 9b.3 — for Phase 9b.4 we use
// placeholder price strings ($4.99 / $1.99) as pre-fetch fallback.

import { memo, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import { en } from '../../config/strings/en';

const t = en.geniusPassOffer;

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
  border: '1px solid var(--color-accent, #4090E0)', // CONST-OK CSS fallback
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
  marginBottom: 'var(--spacing-3)', // CONST-OK CSS spacing token
};

const freeBadgeStyle = { // CONST-OK CSS style object — MONEY-9 required disclosure
  padding: 'var(--spacing-2) var(--spacing-3)', // CONST-OK CSS spacing token
  background: 'rgba(64, 144, 224, 0.15)', // CONST-OK CSS subtle-blue-tint
  border: '1px solid var(--color-accent, #4090E0)', // CONST-OK CSS fallback
  borderRadius: 'var(--radius-sm)',
  fontSize: 'var(--text-xs)',
  fontStyle: 'italic' as const,
  marginBottom: 'var(--spacing-4)', // CONST-OK CSS spacing token
};

const benefitsListStyle = { // CONST-OK CSS style object
  listStyle: 'none' as const,
  padding: 0,
  margin: 0,
  marginBottom: 'var(--spacing-4)', // CONST-OK CSS spacing token
};

const benefitItemStyle = { // CONST-OK CSS style object
  padding: 'var(--spacing-1) 0', // CONST-OK CSS spacing token
  fontSize: 'var(--text-sm)',
};

const legalStyle = { // CONST-OK CSS style object — MONEY-2 required disclosure
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-secondary)',
  marginBottom: 'var(--spacing-3)', // CONST-OK CSS spacing token
  lineHeight: 1.4, // CONST-OK CSS readability
};

const primaryButtonStyle = { // CONST-OK CSS style object
  display: 'block',
  width: '100%', // CONST-OK CSS full-width idiom
  marginTop: 'var(--spacing-2)', // CONST-OK CSS spacing token
  padding: 'var(--spacing-3) var(--spacing-4)', // CONST-OK CSS spacing tokens
  background: 'var(--color-accent, #4090E0)', // CONST-OK CSS fallback
  color: 'var(--color-text-on-accent, #fff)',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-md)',
  cursor: 'pointer',
  touchAction: 'manipulation' as const,
};

const secondaryButtonStyle = { // CONST-OK CSS style object
  ...primaryButtonStyle,
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  border: '1px solid var(--color-border-subtle, #1f2937)', // CONST-OK CSS fallback
};

// Placeholder prices used pre-RevenueCat Offerings resolve. Real prices come
// from `product.priceString` in Phase 9b.3. Per MONEY-1 these are NEVER the
// displayed price at purchase time — only a render-pre-fetch fallback.
const PLACEHOLDER_PRICE_MONTHLY = '$4.99'; // CONST-OK GDD §26 Genius Pass monthly sticker price
const PLACEHOLDER_PRICE_WEEKLY = '$1.99';  // CONST-OK GDD §26 Genius Pass weekly sticker price

export interface GeniusPassOfferModalProps {
  open: boolean;
  onClose: () => void;
  /** Sprint 9b.3 will wire this to `revenueCatAdapter.purchasePackage()`. */
  onSubscribeMonthly?: () => void;
  onSubscribeWeekly?: () => void;
}

export const GeniusPassOfferModal = memo(function GeniusPassOfferModal({ open, onClose, onSubscribeMonthly, onSubscribeWeekly }: GeniusPassOfferModalProps) {
  const dismissOffer = useGameStore((s) => s.dismissGeniusPassOffer);

  const onDismiss = useCallback(() => {
    dismissOffer(Date.now());
    onClose();
  }, [dismissOffer, onClose]);

  if (!open) return null;

  return (
    <div data-testid="genius-pass-offer" role="dialog" aria-modal="true" aria-labelledby="genius-pass-title" style={overlayStyle}>
      <div style={cardStyle}>
        <h2 id="genius-pass-title" data-testid="genius-pass-title" style={titleStyle}>{t.title}</h2>

        {/* MONEY-9: free-badge appears BEFORE subscribe CTAs (Apple compliance). */}
        <p data-testid="genius-pass-free-badge" style={freeBadgeStyle}>{t.freeBadge}</p>

        <ul style={benefitsListStyle}>
          <li style={benefitItemStyle}>• {t.benefitNoAds}</li>
          <li style={benefitItemStyle}>• {t.benefitOfflineBoost}</li>
          <li style={benefitItemStyle}>• {t.benefitMutation}</li>
          <li style={benefitItemStyle}>• {t.benefitWeeklySparks}</li>
          <li style={benefitItemStyle}>• {t.benefitHdSnapshot}</li>
          <li style={benefitItemStyle}>• {t.benefitGoldTheme}</li>
        </ul>

        {/* MONEY-2: auto-renew statement + cancel instructions BEFORE subscribe. */}
        <p data-testid="genius-pass-auto-renew" style={legalStyle}>{t.autoRenewStatement}</p>
        <p data-testid="genius-pass-cancel-instructions" style={legalStyle}>{t.cancelInstructions}</p>

        <button type="button" data-testid="genius-pass-subscribe-monthly" onClick={onSubscribeMonthly} style={primaryButtonStyle}>
          {t.subscribeMonthly} — {PLACEHOLDER_PRICE_MONTHLY}
        </button>
        <button type="button" data-testid="genius-pass-subscribe-weekly" onClick={onSubscribeWeekly} style={primaryButtonStyle}>
          {t.subscribeWeekly} — {PLACEHOLDER_PRICE_WEEKLY}
        </button>
        <button type="button" data-testid="genius-pass-dismiss" onClick={onDismiss} style={secondaryButtonStyle}>
          {t.dismissButton}
        </button>
      </div>
    </div>
  );
});
