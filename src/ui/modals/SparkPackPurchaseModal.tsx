// Sprint 9b Phase 9b.5 — Spark Pack purchase modal (GDD §26, MONEY-8).
// 3 tiers: 20 / 110 / 300 Sparks at $0.99 / $3.99 / $7.99.
// MONEY-8 cap (1000/month) displayed BEFORE purchase (Apple compliance).
// Sprint 9b.6 wires RevenueCat `purchasePackage()`; for 9b.5 the buy buttons
// call `purchaseSparks` directly as a stub path.

import { memo, useCallback, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../config/constants';
import { startOfCurrentMonthUTC } from '../../engine/sparksPurchaseCap';
import { en } from '../../config/strings/en';

const t = en.sparkPack;

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

const subtitleStyle = { // CONST-OK CSS style object
  color: 'var(--color-text-secondary)',
  fontSize: 'var(--text-sm)',
  marginBottom: 'var(--spacing-4)', // CONST-OK CSS spacing token
  fontStyle: 'italic' as const,
};

const capLineStyle = { // CONST-OK CSS style object
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-secondary)',
  marginBottom: 'var(--spacing-4)', // CONST-OK CSS spacing token
};

const tierRowStyle = { // CONST-OK CSS style object
  display: 'flex' as const,
  justifyContent: 'space-between' as const,
  alignItems: 'center' as const,
  padding: 'var(--spacing-3) 0', // CONST-OK CSS spacing token
  borderBottom: '1px solid var(--color-border-subtle, #1f2937)', // CONST-OK CSS fallback
};

const tierInfoStyle = { // CONST-OK CSS style object
  display: 'flex' as const,
  flexDirection: 'column' as const,
};

const buyButtonStyle = { // CONST-OK CSS style object
  padding: 'var(--spacing-2) var(--spacing-4)', // CONST-OK CSS spacing tokens
  background: 'var(--color-accent, #4090E0)', // CONST-OK CSS fallback
  color: 'var(--color-text-on-accent, #fff)',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  fontSize: 'var(--text-sm)',
  touchAction: 'manipulation' as const,
};

const disabledButtonStyle = { ...buyButtonStyle, opacity: 0.5, cursor: 'not-allowed' as const }; // CONST-OK CSS disabled

const toastStyle = { // CONST-OK CSS style object
  marginTop: 'var(--spacing-3)', // CONST-OK CSS spacing token
  padding: 'var(--spacing-2) var(--spacing-3)', // CONST-OK CSS spacing tokens
  background: 'rgba(255, 180, 84, 0.15)', // CONST-OK CSS warm-warning tint
  borderRadius: 'var(--radius-sm)',
  fontSize: 'var(--text-sm)',
  color: 'var(--color-warning, #ffb454)', // CONST-OK CSS fallback
};

const closeButtonStyle = { // CONST-OK CSS style object
  ...buyButtonStyle,
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  border: '1px solid var(--color-border-subtle, #1f2937)', // CONST-OK CSS fallback
  width: '100%', // CONST-OK CSS full-width idiom
  marginTop: 'var(--spacing-4)', // CONST-OK CSS spacing token
};

// GDD §26 "Spark Packs": 3 tiers. 10% + 25% bonuses on top of linear $0.99/$3.99/$7.99.
const TIERS: readonly { id: 'small' | 'medium' | 'large'; amount: number; priceUsd: number; nameKey: string; amountKey: string }[] = [
  { id: 'small', amount: 20, priceUsd: 0.99, nameKey: 'smallTier', amountKey: 'smallAmount' },   // CONST-OK GDD §26 Spark Pack tier — verbatim
  { id: 'medium', amount: 110, priceUsd: 3.99, nameKey: 'mediumTier', amountKey: 'mediumAmount' }, // CONST-OK GDD §26 Spark Pack tier — verbatim
  { id: 'large', amount: 300, priceUsd: 7.99, nameKey: 'largeTier', amountKey: 'largeAmount' },   // CONST-OK GDD §26 Spark Pack tier — verbatim
];

export interface SparkPackPurchaseModalProps {
  open: boolean;
  onClose: () => void;
}

export const SparkPackPurchaseModal = memo(function SparkPackPurchaseModal({ open, onClose }: SparkPackPurchaseModalProps) {
  const sparksPurchasedThisMonth = useGameStore((s) => s.sparksPurchasedThisMonth);
  const sparksPurchaseMonthStart = useGameStore((s) => s.sparksPurchaseMonthStart);
  const purchaseSparks = useGameStore((s) => s.purchaseSparks);
  const [toast, setToast] = useState<string>('');

  const onBuy = useCallback((amount: number) => {
    const result = purchaseSparks(amount, Date.now());
    if (result === 'cap_reached') setToast(t.capReachedToast);
    else { setToast(''); onClose(); }
  }, [purchaseSparks, onClose]);

  if (!open) return null;

  // Compute effective purchased-this-month (respecting UTC month rollover).
  const now = Date.now();
  const monthStart = startOfCurrentMonthUTC(now);
  const effectivePurchased = sparksPurchaseMonthStart === monthStart ? sparksPurchasedThisMonth : 0;
  const remaining = Math.max(0, SYNAPSE_CONSTANTS.maxSparksPurchasedPerMonth - effectivePurchased);

  return (
    <div data-testid="spark-pack-modal" role="dialog" aria-modal="true" aria-labelledby="spark-pack-title" style={overlayStyle}>
      <div style={cardStyle}>
        <h2 id="spark-pack-title" data-testid="spark-pack-title" style={titleStyle}>{t.modalTitle}</h2>
        <p style={subtitleStyle}>{t.subtitle}</p>

        <p data-testid="spark-pack-cap" style={capLineStyle}>
          {t.monthlyCapLabel}: {remaining} {t.capRemaining}
        </p>

        {TIERS.map((tier) => {
          const wouldExceedCap = effectivePurchased + tier.amount > SYNAPSE_CONSTANTS.maxSparksPurchasedPerMonth;
          return (
            <div key={tier.id} data-testid={`spark-pack-tier-${tier.id}`} style={tierRowStyle}>
              <div style={tierInfoStyle}>
                <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>{t[tier.nameKey as 'smallTier']}</span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{t[tier.amountKey as 'smallAmount']}</span>
              </div>
              <button
                type="button"
                data-testid={`spark-pack-buy-${tier.id}`}
                disabled={wouldExceedCap}
                onClick={() => onBuy(tier.amount)}
                style={wouldExceedCap ? disabledButtonStyle : buyButtonStyle}
              >
                {t.buyButton} ${tier.priceUsd.toFixed(2)/* CONST-OK 2-decimal price display */}
              </button>
            </div>
          );
        })}

        {toast !== '' && <p data-testid="spark-pack-toast" style={toastStyle}>{toast}</p>}

        <button type="button" data-testid="spark-pack-close" onClick={onClose} style={closeButtonStyle}>
          {t.closeButton}
        </button>
      </div>
    </div>
  );
});
