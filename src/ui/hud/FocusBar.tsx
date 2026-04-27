import { memo, useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { HUD } from '../tokens';
import { CASCADE_CELEBRATION } from '../../config/constants';
import { subscribeCascadeFlash } from './cascadeFlashEvents';

/**
 * Top horizontal Focus Bar. Mockup: x=80 y=76 w=230 h=4 rx=2, cyan
 * fill (#40D0D0) proportional to focusBar [0..1]. Renders below the
 * top HUD row.
 *
 * Phase 5: focusBar default = 0 → empty track visible. Sprint 3 wires
 * tap-fill via `focusFillPerTap`.
 *
 * Pre-launch audit Day 2: subscribes to cascadeFlash pub/sub. On a
 * Cascade Discharge, renders a brief white overlay on top of the fill
 * so the player visually registers the ×2.5+ moment. Reduced-motion
 * suppresses the visual flash (audio + haptic still fire).
 */
export const FocusBar = memo(function FocusBar() {
  const focus = useGameStore((s) => s.focusBar);
  const reducedMotion = useGameStore((s) => s.reducedMotion);
  const clamped = Math.max(0, Math.min(1, focus));
  const percent = clamped * 100; // CONST-OK CSS percent conversion (CODE-1 exception)

  const [flashing, setFlashing] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsub = subscribeCascadeFlash(() => {
      if (reducedMotion) return;
      setFlashing(true);
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(() => { setFlashing(false); timer = null; }, CASCADE_CELEBRATION.flashDurationMs);
    });
    return () => { unsub(); if (timer !== null) clearTimeout(timer); };
  }, [reducedMotion]);

  return (
    <div
      data-testid="hud-focus-bar"
      role="progressbar"
      aria-label="Focus"
      aria-valuemin={0}
      aria-valuemax={100} // CONST-OK aria-valuemax for 0-100 percent range
      aria-valuenow={Math.round(percent)}
      style={{
        position: 'absolute',
        top: 'calc(var(--spacing-5) + var(--text-3xl) + var(--spacing-2))', // CONST-OK: CSS custom property ref (CODE-1 exception)
        left: 'var(--spacing-16)', // CONST-OK: CSS custom property ref (CODE-1 exception)
        right: 'var(--spacing-16)', // CONST-OK: CSS custom property ref (CODE-1 exception)
        height: HUD.focusBarHeight,
        borderRadius: 'var(--radius-full)',
        background: 'var(--color-border-subtle)',
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <div
        data-testid="hud-focus-bar-fill"
        style={{
          width: `${percent}%`, // CONST-OK CSS percent string
          height: '100%', // CONST-OK: CSS full-height idiom (CODE-1 exception)
          background: 'var(--color-focus-bar)',
          // Sprint 10 Phase 10.5 — reducedMotion suppresses the fill ease.
          // Sprint 10 Phase 10.6 — ease-out replaces linear for smoother tap feedback.
          transition: reducedMotion ? 'none' : 'width 200ms ease-out', // CONST-OK: CSS animation duration (CODE-1 exception)
        }}
      />
      {flashing && (
        <div
          data-testid="hud-focus-bar-flash"
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0, // CONST-OK CSS full-bleed overlay
            background: 'rgba(255, 255, 255, 0.85)', // CONST-OK Cascade flash color
            opacity: 1, // CONST-OK CSS opaque
            pointerEvents: 'none',
            transition: `opacity ${CASCADE_CELEBRATION.flashDurationMs}ms ease-out`,
          }}
        />
      )}
    </div>
  );
});
