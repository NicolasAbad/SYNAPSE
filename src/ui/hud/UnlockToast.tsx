// Pre-launch audit Dim M Phase 2 — top-of-screen toast that fires when a
// new tab/subtab is revealed. Auto-dismisses after `durationMs` (default
// 3.5s — long enough to read, short enough to not block the canvas).
//
// Visual: pill at top-of-screen, primary-violet border + sparkle icon,
// soft fade-in via CSS opacity transition (gated on reducedMotion: when
// the player has reducedMotion enabled, the toast appears instantly so
// it doesn't violate WCAG 2.3.3).

import { memo, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { MOTION } from '../tokens';

const DEFAULT_DURATION_MS = 3500; // CONST-OK: UI display-duration idiom (CODE-1 exception)

export interface UnlockToastProps {
  message: string | null;
  onDismiss: () => void;
  durationMs?: number;
}

export const UnlockToast = memo(function UnlockToast({
  message, onDismiss, durationMs = DEFAULT_DURATION_MS,
}: UnlockToastProps) {
  const reducedMotion = useGameStore((s) => s.reducedMotion);

  useEffect(() => {
    if (message === null) return;
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [message, durationMs, onDismiss]);

  if (message === null) return null;

  return (
    <div
      data-testid="hud-unlock-toast"
      role="status"
      aria-live="polite"
      onPointerDown={onDismiss}
      style={{
        position: 'absolute',
        top: 'calc(env(safe-area-inset-top, 0) + var(--spacing-4))', // CONST-OK: layout
        left: '50%', // CONST-OK: CSS centering
        transform: 'translateX(-50%)', // CONST-OK: CSS centering
        padding: 'var(--spacing-2) var(--spacing-5)', // CONST-OK
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-primary)',
        borderRadius: 'var(--radius-full)',
        color: 'var(--color-text-primary)',
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--font-weight-semibold)',
        pointerEvents: 'auto',
        touchAction: 'manipulation',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)', // CONST-OK: drop-shadow idiom
        transition: reducedMotion ? 'none' : `opacity ${MOTION.durFast}ms ease-out`,
        zIndex: 950, // CONST-OK: above HUD, below modals
        maxWidth: 'calc(100vw - var(--spacing-8))', // CONST-OK: viewport-fit idiom
        textAlign: 'center',
      }}
    >
      ✨ {message}
    </div>
  );
});
