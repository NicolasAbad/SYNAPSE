import { memo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { formatCurrency } from '../util/formatNumber';
import { t } from '../../config/strings';

/**
 * HUD Memorias counter — added Sprint 4c Phase 4c.6.5 after Nico's
 * playtest feedback flagged the gap. GDD §29 HUD layout originally
 * omitted Memories from the top row; meta-currency persistence is a
 * genre-standard display (Cookie Clicker Heavenly Chips, Antimatter
 * Dimensions Infinity Points, Melvor Prayer Points).
 *
 * Renders only when `memories > 0` — pre-first-prestige there's nothing
 * to show and the counter would add visual noise at zero. Positioned
 * below the thoughts counter + progress subtitle on the left column so
 * it's always visible without crowding the right-side rate stack.
 */
export const MemoriesCounter = memo(function MemoriesCounter() {
  const memories = useGameStore((s) => s.memories);
  if (memories <= 0) return null;
  return (
    <div
      data-testid="hud-memories"
      style={{
        position: 'absolute',
        // Left column, below thoughts + progress subtitle (thoughts row
        // ~spacing-5 top + ~72px content). Stays left-aligned with the
        // thoughts counter for visual grouping.
        top: 'calc(var(--spacing-16) + var(--spacing-6))', // CONST-OK: CSS custom property math
        left: 'var(--spacing-5)', // CONST-OK: CSS custom property ref
        color: 'var(--color-text-primary)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-base)',
        fontWeight: 'var(--font-weight-semibold)',
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1,
        pointerEvents: 'none',
      }}
    >
      {formatCurrency(memories)}
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-xs)',
          fontWeight: 'var(--font-weight-regular)',
          color: 'var(--color-text-secondary)',
          marginLeft: 'var(--spacing-1)', // CONST-OK: CSS custom property ref
        }}
      >
        {t('hud_explain.memories_label')}
      </span>
    </div>
  );
});
