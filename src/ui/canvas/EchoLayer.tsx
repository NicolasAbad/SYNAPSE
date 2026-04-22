// Sprint 6 Phase 6.3b — ambient Echoes renderer (GDD NARRATIVE.md §5 + NARR-3).
// Max 1 echo per echoCooldownMs (90 s). Deterministic pick via mulberry32 keyed
// on Date.now() — non-replayable by design (cosmetic flavor, no gameplay effect).
// Hides on non-Mind / non-home subtabs like FragmentOverlay. Lives in
// src/ui/canvas/ to signal it's a canvas-adjacent ambient layer rather than a
// modal/dialog.

import { memo, useEffect, useRef, useState } from 'react';
import { SYNAPSE_CONSTANTS } from '../../config/constants';
import { useGameStore } from '../../store/gameStore';
import { pickEcho } from '../../engine/narrative';
import type { EchoDef } from '../../types';

const POLL_MS = 10_000; // CONST-OK: UI scheduler granularity (cooldown is 90s)
const FADE_IN_MS = 800; // CONST-OK: CSS fade duration
const HOLD_MS = 3_200; // CONST-OK: total on-screen ≈ 4s per NARR-3
const FADE_OUT_MS = 800; // CONST-OK: CSS fade duration

export const EchoLayer = memo(function EchoLayer() {
  const prestigeCount = useGameStore((s) => s.prestigeCount);
  const activeTab = useGameStore((s) => s.activeTab);
  const activeMindSubtab = useGameStore((s) => s.activeMindSubtab);

  const [echo, setEcho] = useState<EchoDef | null>(null);
  const [fadeOut, setFadeOut] = useState(false);
  const lastShownRef = useRef<number>(0);

  // Poll every POLL_MS; if no echo is visible AND cooldown elapsed, pick one.
  useEffect(() => {
    const interval = setInterval(() => {
      if (echo !== null) return;
      const now = Date.now();
      if (now - lastShownRef.current < SYNAPSE_CONSTANTS.echoCooldownMs) return;
      const next = pickEcho(prestigeCount, now);
      if (!next) return;
      setEcho(next);
      setFadeOut(false);
      lastShownRef.current = now;
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [echo, prestigeCount]);

  // Life-cycle: fade-in → hold → fade-out → clear.
  useEffect(() => {
    if (echo === null) return;
    const t1 = setTimeout(() => setFadeOut(true), FADE_IN_MS + HOLD_MS);
    const t2 = setTimeout(() => setEcho(null), FADE_IN_MS + HOLD_MS + FADE_OUT_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [echo]);

  if (echo === null) return null;
  if (activeTab !== 'mind' || activeMindSubtab !== 'home') return null;

  const opacity = fadeOut ? 0 : 0.15; // CONST-OK: NARR-3 echo opacity

  return (
    <div
      data-testid="echo-layer"
      data-echo-id={echo.id}
      style={{
        position: 'absolute',
        top: '45%', // CONST-OK: middle third of canvas (NARR-3)
        left: 'var(--spacing-6)', // CONST-OK
        right: 'var(--spacing-6)', // CONST-OK
        textAlign: 'center',
        color: 'var(--color-text-secondary)',
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-sm)',
        fontStyle: 'italic',
        opacity,
        transition: `opacity ${FADE_IN_MS}ms ease-in-out`,
        pointerEvents: 'none',
        zIndex: 450, // CONST-OK: below FragmentOverlay (500), above canvas
      }}
    >
      {echo.text}
    </div>
  );
});
