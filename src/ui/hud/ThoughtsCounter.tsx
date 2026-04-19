import { memo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { formatNumber } from '../util/formatNumber';
import { t } from '../../config/strings';

/**
 * Top-left thoughts counter. Mockup: x=20 y=52 amber JetBrains Mono
 * weight-800 tabular-nums, label x=20 y=66 secondary gray font-9.
 * Replaces the Phase 3.5 placeholder in App.tsx.
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
