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
 * React contract: no per-frame re-renders. The canvas element is
 * created once; all drawing happens via the ref + imperative ctx.
 * Per CODE-4 "rAF at 60fps (visual only), separate 100ms game tick" —
 * this component is visual-only; game state advances in the 100ms
 * tick (Sprint 1 engine), not in this render loop.
 */

import { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import { setupHiDPICanvas } from './dpr';
import { BIOLUMINESCENT_THEME, draw } from './renderer';

export function NeuronCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let dims = setupHiDPICanvas(canvas, ctx);
    const startTime = performance.now();
    let rafId = 0;
    let paused = false;

    const tick = () => {
      if (paused) return;
      const elapsedMs = performance.now() - startTime;
      const state = useGameStore.getState();
      draw(ctx, state, BIOLUMINESCENT_THEME, dims, elapsedMs);
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

    const handleResize = () => {
      dims = setupHiDPICanvas(canvas, ctx);
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('resize', handleResize);
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-testid="neuron-canvas"
      className="block w-full h-full"
      style={{ touchAction: 'manipulation' }}
    />
  );
}
