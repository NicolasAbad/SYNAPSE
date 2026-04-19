import { memo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { HUD } from '../tokens';

/**
 * Top horizontal Focus Bar. Mockup: x=80 y=76 w=230 h=4 rx=2, cyan
 * fill (#40D0D0) proportional to focusBar [0..1]. Renders below the
 * top HUD row.
 *
 * Phase 5: focusBar default = 0 → empty track visible. Sprint 3 wires
 * tap-fill via `focusFillPerTap`.
 */
export const FocusBar = memo(function FocusBar() {
  const focus = useGameStore((s) => s.focusBar);
  const clamped = Math.max(0, Math.min(1, focus));

  return (
    <div
      data-testid="hud-focus-bar"
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
          width: `${clamped * 100}%`, // CONST-OK: CSS percent conversion (CODE-1 exception)
          height: '100%', // CONST-OK: CSS full-height idiom (CODE-1 exception)
          background: 'var(--color-focus-bar)',
          transition: 'width 200ms linear', // CONST-OK: CSS animation duration (CODE-1 exception)
        }}
      />
    </div>
  );
});
