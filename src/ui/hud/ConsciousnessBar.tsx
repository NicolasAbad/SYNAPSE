import { memo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { HUD } from '../tokens';

/**
 * Right-vertical Consciousness bar. Mockup: x=382 y=120..480 w=3 h=360
 * rx=1.5, violet (#8B7FE8). Fills FROM BOTTOM UP as cycleGenerated
 * approaches currentThreshold.
 *
 * Visibility: only renders when `consciousnessBarUnlocked === true`
 * (CORE-10: triggers at `cycleGenerated >= 0.5 × currentThreshold`,
 * one-way per cycle). Default at P0 = false until the player crosses
 * 50% of the first threshold.
 *
 * Phase 5: wired but will not appear until engine flips the trigger.
 * P26 white-gold override (NARRATIVE.md:476) is NOT wired yet —
 * deferred to Sprint 6 narrative-visual pass.
 *
 * Pre-launch audit Dimension M note: the dynamic 50%-threshold reveal is
 * intentional progressive disclosure on the first cycle. After first
 * prestige, `consciousnessBarUnlocked` is in PRESTIGE_PRESERVE
 * (`src/config/prestige.ts:135`) so the bar stays visible for the
 * lifetime of the save. Audit suggested gating to fixed prestige (P1+),
 * but that would remove the "you're approaching first prestige" reveal
 * moment — the current behavior is correct.
 */
export const ConsciousnessBar = memo(function ConsciousnessBar() {
  const unlocked = useGameStore((s) => s.consciousnessBarUnlocked);
  const generated = useGameStore((s) => s.cycleGenerated);
  const threshold = useGameStore((s) => s.currentThreshold);
  const reducedMotion = useGameStore((s) => s.reducedMotion);

  if (!unlocked) return null;

  const ratio = threshold > 0 ? Math.max(0, Math.min(1, generated / threshold)) : 0;
  const percent = ratio * 100; // CONST-OK CSS percent conversion (CODE-1 exception)

  return (
    <div
      data-testid="hud-consciousness-bar"
      role="progressbar"
      aria-label="Consciousness"
      aria-valuemin={0}
      aria-valuemax={100} // CONST-OK aria-valuemax 0-100 percent range
      aria-valuenow={Math.round(percent)}
      style={{
        position: 'absolute',
        right: 0,
        top: '17%', // CONST-OK: mockup y=120/700 ≈ 17% (CODE-1 CSS exception)
        height: '52%', // CONST-OK: mockup h=360/700 ≈ 52% (CODE-1 CSS exception)
        width: HUD.consciousnessBarWidth,
        borderRadius: 'var(--radius-full)',
        background: 'var(--color-border-subtle)',
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        overflow: 'hidden',
      }}
    >
      <div
        data-testid="hud-consciousness-bar-fill"
        style={{
          width: '100%', // CONST-OK: CSS full-width idiom (CODE-1 exception)
          height: `${percent}%`, // CONST-OK CSS percent string
          background: 'var(--color-consciousness-bar)',
          // Sprint 10 Phase 10.5 — reducedMotion suppresses the height ease.
          transition: reducedMotion ? 'none' : 'height 300ms linear', // CONST-OK: CSS animation duration (CODE-1 exception)
        }}
      />
    </div>
  );
});
