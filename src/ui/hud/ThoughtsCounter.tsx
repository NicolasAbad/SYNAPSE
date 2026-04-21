import { memo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { formatNumber } from '../util/formatNumber';
import { t } from '../../config/strings';

/**
 * Top-left thoughts counter. Mockup: x=20 y=52 amber JetBrains Mono
 * weight-800 tabular-nums, label x=20 y=66 secondary gray font-9.
 * Replaces the Phase 3.5 placeholder in App.tsx.
 *
 * Sprint 4c Phase 4c.6 — adds a cycle-progress subtitle "X% to Awakening"
 * so the player always knows how close to prestige they are. Previously
 * the Consciousness Bar (CORE-10, 50% threshold flip) was the only
 * progress cue, leaving players blind through the first half of every
 * cycle.
 */
export const ThoughtsCounter = memo(function ThoughtsCounter() {
  const thoughts = useGameStore((s) => s.thoughts);
  const cycleGenerated = useGameStore((s) => s.cycleGenerated);
  const currentThreshold = useGameStore((s) => s.currentThreshold);
  const pct = currentThreshold > 0 ? Math.min(100, Math.floor((cycleGenerated / currentThreshold) * 100)) : 0;
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
      <div
        data-testid="hud-awakening-progress"
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-xs)',
          fontWeight: 'var(--font-weight-regular)',
          color: 'var(--color-text-secondary)',
          marginTop: 2, // CONST-OK: tight spacing
          opacity: 0.8, // CONST-OK: subtle secondary info
        }}
      >
        {pct}% {t('hud_explain.awakening_progress')}
      </div>
    </div>
  );
});
