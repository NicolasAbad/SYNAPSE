import { memo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { formatNumber } from '../util/formatNumber';
import { t } from '../../config/strings';

/**
 * Top-right production rate. Mockup: x=370 (right-aligned) y=52
 * green JetBrains Mono weight-600 font-13. Format: "+{N}/s".
 */
export const RateCounter = memo(function RateCounter() {
  const rate = useGameStore((s) => s.effectiveProductionPerSecond);
  return (
    <div
      data-testid="hud-rate"
      style={{
        position: 'absolute',
        top: 'var(--spacing-5)', // CONST-OK: CSS custom property ref (CODE-1 exception)
        right: 'var(--spacing-5)', // CONST-OK: CSS custom property ref (CODE-1 exception)
        color: 'var(--color-rate-counter)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-lg)',
        fontWeight: 'var(--font-weight-semibold)',
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1,
        pointerEvents: 'none',
      }}
    >
      {t('hud.rate_prefix')}
      {formatNumber(rate)}
      {t('hud.rate_suffix')}
    </div>
  );
});
