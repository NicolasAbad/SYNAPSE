// Pre-launch audit Day 3 (Tier 1 enhancement #2) — one-time-per-session
// full-screen "CASCADE!" overlay on the player's first Cascade Discharge.
//
// Audit finding: the genre's biggest "aha" moment (Cascade burst x2.5+) was
// previously presentationally identical to a normal Discharge. This overlay
// crystallizes the moment without obscuring gameplay (1.5s auto-dismiss,
// pointer-events none).
//
// Reduced-motion: skipped entirely (the audio + haptic from the discharge
// action still fire). Triggers via subscribeFirstCascadeOverlay pub/sub.

import { memo, useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { subscribeFirstCascadeOverlay } from './cascadeFlashEvents';

const OVERLAY_DURATION_MS = 1500; // CONST-OK once-per-session UX timing

export const CascadeFirstOverlay = memo(function CascadeFirstOverlay() {
  const reducedMotion = useGameStore((s) => s.reducedMotion);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsub = subscribeFirstCascadeOverlay(() => {
      if (reducedMotion) return;
      setVisible(true);
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(() => { setVisible(false); timer = null; }, OVERLAY_DURATION_MS);
    });
    return () => { unsub(); if (timer !== null) clearTimeout(timer); };
  }, [reducedMotion]);

  if (!visible) return null;
  return (
    <div data-testid="cascade-first-overlay" role="status" aria-live="assertive" style={overlayStyle}>
      <div style={textStyle}>CASCADE!</div>
    </div>
  );
});

const overlayStyle = {
  position: 'fixed' as const,
  top: 0, right: 0, bottom: 0, left: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none' as const,
  zIndex: 950, // CONST-OK above HUD pills, below modals
  background: 'transparent',
  animation: 'synapse-cascade-first-fade 1500ms ease-out forwards', // CONST-OK matches OVERLAY_DURATION_MS
};

const textStyle = {
  fontFamily: 'var(--font-display)',
  fontSize: '4rem', // CONST-OK CSS large hero text
  fontWeight: 'var(--font-weight-heaviest)',
  color: 'var(--color-cyan, #40D0D0)', // CONST-OK CSS fallback
  textShadow: '0 0 24px rgba(64, 208, 208, 0.85), 0 0 48px rgba(64, 208, 208, 0.45)', // CONST-OK glow
  letterSpacing: '0.15em', // CONST-OK CSS hero-text spacing
};
