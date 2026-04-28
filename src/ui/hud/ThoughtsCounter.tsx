import { memo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { formatNumber } from '../util/formatNumber';
import { t } from '../../config/strings';

/**
 * Top-left thoughts counter (hero element). Big amber tabular-nums number
 * with the small "thoughts" label inline below.
 *
 * Mi A3 playtest UX redesign Option C: removed the inline "X% of Awakening
 * threshold" subtitle. That signal moved to AwakeningProgressBar — a thin
 * horizontal bar below the hero row — so the hero pair (thoughts + rate)
 * stays clean and the cycle progress reads at-a-glance.
 */
export const ThoughtsCounter = memo(function ThoughtsCounter() {
  const thoughts = useGameStore((s) => s.thoughts);
  return (
    <div
      data-testid="hud-thoughts"
      style={{
        position: 'absolute',
        top: 'var(--spacing-5)', // CONST-OK: CSS custom property ref (CODE-1 exception)
        left: 'var(--spacing-5)', // CONST-OK: CSS custom property ref (CODE-1 exception)
        color: 'var(--color-thoughts-counter)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-3xl)',
        fontWeight: 'var(--font-weight-black)',
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1,
        pointerEvents: 'none',
      }}
    >
      {formatNumber(Math.floor(thoughts))}
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-xs)',
          fontWeight: 'var(--font-weight-regular)',
          color: 'var(--color-text-secondary)',
          marginTop: 'var(--spacing-1)', // CONST-OK: CSS custom property ref (CODE-1 exception)
        }}
      >
        {t('hud.thoughts_label')}
      </div>
    </div>
  );
});
