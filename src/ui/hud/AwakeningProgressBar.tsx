// Mi A3 playtest UX redesign Option C — Awakening progress bar.
//
// Replaces the inline "X% of Awakening threshold" subtitle that lived inside
// ThoughtsCounter. A thin horizontal progress bar reads at-a-glance and
// avoids the cramped vertical stacking on narrow screens. Positioned just
// below the hero row (thoughts + rate) so it visually anchors the hero pair
// to the cycle progress signal.
//
// Renders only when prestige progress > 0 to avoid empty-bar visual noise
// at the very start of a fresh cycle.

import { memo } from 'react';
import { useGameStore } from '../../store/gameStore';

export const AwakeningProgressBar = memo(function AwakeningProgressBar() {
  const cycleGenerated = useGameStore((s) => s.cycleGenerated);
  const currentThreshold = useGameStore((s) => s.currentThreshold);
  const reducedMotion = useGameStore((s) => s.reducedMotion);
  const fraction = currentThreshold > 0 ? Math.min(1, cycleGenerated / currentThreshold) : 0;
  const percent = fraction * 100; // CONST-OK CSS percent conversion (CODE-1 exception)

  return (
    <div
      data-testid="hud-awakening-progress"
      role="progressbar"
      aria-label="Awakening progress"
      aria-valuemin={0}
      aria-valuemax={100} // CONST-OK aria-valuemax for 0-100 percent range
      aria-valuenow={Math.round(percent)}
      style={{
        position: 'absolute',
        // Top: hero row baseline + breathing room. Row 1 is at top: spacing-5
        // and uses text-3xl (~32px) so we offset below that.
        top: 'calc(var(--spacing-5) + var(--text-3xl) + var(--spacing-2))', // CONST-OK CSS layout
        left: 'var(--spacing-5)', // CONST-OK CSS spacing token
        right: 'var(--spacing-5)', // CONST-OK CSS spacing token
        height: 3, // CONST-OK thin progress-bar height (px)
        borderRadius: 'var(--radius-full)',
        background: 'var(--color-border-subtle)',
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <div
        data-testid="hud-awakening-progress-fill"
        style={{
          width: `${percent}%`, // CONST-OK CSS percent string
          height: '100%', // CONST-OK CSS full-height
          background: 'var(--color-thoughts-counter)', // matches ThoughtsCounter amber so the visual link is obvious
          transition: reducedMotion ? 'none' : 'width 250ms ease-out', // CONST-OK CSS animation duration
        }}
      />
    </div>
  );
});
