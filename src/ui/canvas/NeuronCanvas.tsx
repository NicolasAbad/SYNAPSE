/**
 * <NeuronCanvas /> — mounts a Canvas 2D element for the game world.
 *
 * Responsibilities (Sprint 2 Phase 2):
 * - Create canvas, attach 2D context, apply DPR scaling
 * - rAF loop: read Zustand state imperatively, call draw() per frame
 * - Pause rAF when document.hidden === true (visibilitychange event)
 * - Re-apply DPR on window resize
 * - Clean up listeners + cancel rAF on unmount
 *
 * Phase 3 additions:
 * - onPointerDown handler: hit-test + minimum-thought increment + AudioContext unlock
 * - First-tap stub: console.debug('tap:first-tap') — Sprint 6 wires to narrative fragment fade-in
 *
 * Event type choice: React `onPointerDown` covers touch + mouse + pen with a
 * unified API and fires immediately (no 300ms click delay). CODE-4 says
 * "touchstart not click" — PointerEvent satisfies the intent while enabling
 * desktop dev/test. `touch-action: manipulation` on the canvas suppresses
 * double-tap zoom while preserving pan/pinch per mobile expectations.
 *
 * React contract: no per-frame re-renders. The canvas element is created
 * once; all drawing happens via the ref + imperative ctx. Per CODE-4
 * "rAF at 60fps (visual only), separate 100ms game tick" — this component
 * is visual-only; game state advances in the 100ms tick.
 */

import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useActiveTheme } from '../theme/useActiveTheme';
import { hapticLight } from '../haptics';
import { unlockAudioOnFirstTap } from './audioUnlock';
import { resizeHiDPICanvas, setupHiDPICanvas } from './dpr';
import { draw } from './renderer';
import { testHit } from './tapHandler';
import { installPerfInstrument } from './perfInstrument';
import { publishTapFloater } from './tapFloaterEvents';

export function NeuronCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dimsRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const firstTapFiredRef = useRef(false);
  const theme = useActiveTheme();
  const themeRef = useRef(theme);
  themeRef.current = theme;

  const handlePointerDown = (ev: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const tapX = ev.clientX - rect.left;
    const tapY = ev.clientY - rect.top;

    // AudioContext unlock — iOS Safari requires first user gesture (CODE-5).
    void unlockAudioOnFirstTap();

    const state = useGameStore.getState();
    const result = testHit(tapX, tapY, state, dimsRef.current.width, dimsRef.current.height);
    if (!result.hit) return;

    // First-tap side effect stub — Sprint 6 replaces with narrative event bus.
    if (!firstTapFiredRef.current) {
      firstTapFiredRef.current = true;
      console.debug('tap:first-tap');
    }

    // Sprint 3 Phase 4: full TAP-2 via store action + light haptic feedback.
    // hapticLight() silently no-ops on web/dev/jsdom (see src/ui/haptics.ts).
    const beforeThoughts = state.thoughts;
    useGameStore.getState().onTap(Date.now());
    void hapticLight();
    // Sprint 10 Phase 10.6 — emit a "+N" floater at the tap point (skip when
    // reducedMotion or zero gain). Uses viewport-relative coords for the
    // floater layer's fixed-position rendering.
    const after = useGameStore.getState();
    const delta = Math.max(0, Math.floor(after.thoughts) - Math.floor(beforeThoughts));
    if (delta > 0 && !after.reducedMotion) {
      publishTapFloater({ x: ev.clientX, y: ev.clientY, amount: delta });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // alpha:false = opaque canvas; avoids Chrome 83 compositor transparency bug
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const startTime = performance.now();
    let rafId = 0;
    let paused = false;
    const perf = installPerfInstrument();

    const tick = (timestamp: number) => {
      if (paused) return;
      perf.onFrame(timestamp);
      // Chrome 83 WebView may report window.innerWidth=0 for the first few
      // frames. Re-measure every frame until dims are valid, then draw.
      if (dimsRef.current.width === 0 || dimsRef.current.height === 0) {
        dimsRef.current = setupHiDPICanvas(canvas, ctx);
      }
      const elapsedMs = performance.now() - startTime;
      const state = useGameStore.getState();
      draw(ctx, state, themeRef.current, dimsRef.current, elapsedMs);
      rafId = requestAnimationFrame(tick);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        paused = true;
        cancelAnimationFrame(rafId);
      } else if (paused) {
        paused = false;
        rafId = requestAnimationFrame(tick);
      }
    };

    // ResizeObserver keeps dims fresh as WebView layout settles.
    // entry.contentRect is the exact CSS layout size — accounts for Android
    // nav bars and safe areas that window.innerHeight does not exclude.
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect && rect.width > 0 && rect.height > 0) {
        // Guard: skip if CSS dims unchanged — prevents ResizeObserver loop error
        // that fires when setting canvas.width inside the callback re-triggers the observer.
        if (
          Math.round(rect.width) === Math.round(dimsRef.current.width) &&
          Math.round(rect.height) === Math.round(dimsRef.current.height)
        ) return;
        dimsRef.current = resizeHiDPICanvas(canvas, ctx, rect.width, rect.height);
      } else {
        dimsRef.current = setupHiDPICanvas(canvas, ctx);
      }
    });
    ro.observe(canvas);

    dimsRef.current = setupHiDPICanvas(canvas, ctx);
    rafId = requestAnimationFrame(tick);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('visibilitychange', handleVisibility);
      ro.disconnect();
      perf.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-testid="neuron-canvas"
      style={{
        position: 'absolute', // CONST-OK: CSS layout (CODE-1 exception)
        top: 0,    // CONST-OK: CSS full-bleed — inset shorthand unsupported in Chrome 83
        right: 0,  // CONST-OK: CSS full-bleed (CODE-1 exception)
        bottom: 0, // CONST-OK: CSS full-bleed (CODE-1 exception)
        left: 0,   // CONST-OK: CSS full-bleed (CODE-1 exception)
        touchAction: 'manipulation',
      }}
      onPointerDown={handlePointerDown}
    />
  );
}
