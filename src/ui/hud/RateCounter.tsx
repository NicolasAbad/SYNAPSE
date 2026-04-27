import { memo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { formatNumber } from '../util/formatNumber';
import { t } from '../../config/strings';

/**
 * Top-right production rate. Mockup: x=370 (right-aligned) y=52
 * green JetBrains Mono weight-600 font-13. Format: "+{N}/s".
 *
 * Pre-launch audit Tier 2 (A-3): when the TAP-1 anti-spam penalty is
 * active (`antiSpamActive`), append a small "×0.1" badge in danger red
 * so the player understands why their tap effectiveness suddenly fell.
 * Without the badge a player who taps too fast sees their rate flatten
 * with no explanation — easy to read as a bug. Penalty resolves
 * automatically after the cooldown window (TICK-1 step 12 recomputes).
 */
export const RateCounter = memo(function RateCounter() {
  const rate = useGameStore((s) => s.effectiveProductionPerSecond);
  const antiSpamActive = useGameStore((s) => s.antiSpamActive);
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
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-1)', // CONST-OK CSS spacing token
      }}
    >
      <span>
        {t('hud.rate_prefix')}
        {formatNumber(rate)}
        {t('hud.rate_suffix')}
      </span>
      {antiSpamActive && (
        <span
          data-testid="hud-rate-anti-spam-badge"
          aria-label={t('hud.anti_spam_label')}
          title={t('hud.anti_spam_label')}
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-error, #E85050)', // CONST-OK CSS fallback
            background: 'rgba(232, 80, 80, 0.18)', // CONST-OK CSS warning tint
            border: '1px solid var(--color-error, #E85050)', // CONST-OK CSS fallback
            borderRadius: 'var(--radius-sm)',
            padding: '0 var(--spacing-1)', // CONST-OK CSS spacing
          }}
        >
          {t('hud.anti_spam_badge')}
        </span>
      )}
    </div>
  );
});
