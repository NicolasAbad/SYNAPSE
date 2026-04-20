/**
 * FPS meter for the rAF loop.
 *
 * Sprint 2 Phase 7 — performance spike instrumentation.
 *
 * Usage:
 *   const meter = new FPSMeter();
 *   function tick(timestamp: number) {
 *     meter.frame(timestamp);
 *     // ... draw ...
 *     requestAnimationFrame(tick);
 *   }
 *   // later:
 *   console.log(meter.report());
 *
 * Discards the first `warmupFrames` samples (layout settle, GPU warmup,
 * font loading). Tracks avg, min, p5 (5th percentile — jank sentinel),
 * total frames, and dropped frames (>33.33ms ≈ below 30 fps).
 *
 * Pure, no React/DOM dependency — testable with injected timestamps.
 */

import { SYNAPSE_CONSTANTS } from '../../config/constants';

// Frame budget at 30 fps. A delta above this means the frame "missed" a
// 30 fps budget (≈ 33.33ms). Source: 1000 / 30. Kept as a local derived
// constant — it's a standard unit, not a gameplay value.
const FRAME_30FPS_BUDGET_MS = 1000 / 30; // CONST-OK: derived from universal 30fps rate (not a tunable)

export interface FPSReport {
  /** Average fps across measured frames (post-warmup). */
  avg: number;
  /** Slowest instantaneous fps in the window. */
  min: number;
  /** 5th percentile fps — jank sentinel. If low, the renderer spikes even if avg looks OK. */
  p5: number;
  /** Total frames counted (post-warmup). */
  frameCount: number;
  /** Count of frames whose delta exceeded the 30 fps budget. */
  droppedFrames: number;
}

export class FPSMeter {
  private deltas: number[] = [];
  private lastTimestamp: number | null = null;
  private framesSeen = 0;
  private readonly warmupFrames: number;

  constructor(warmupFrames: number = SYNAPSE_CONSTANTS.perfFpsWarmupFrames) {
    this.warmupFrames = warmupFrames;
  }

  frame(timestamp: number): void {
    this.framesSeen++;
    if (this.lastTimestamp === null) {
      this.lastTimestamp = timestamp;
      return;
    }
    const delta = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;
    // Skip warmupFrames + 1 frames total: +1 because the first frame only
    // seeds lastTimestamp (produces no delta). This guarantees the transition
    // delta (last-warmup → first-measured) is also discarded.
    if (this.framesSeen <= this.warmupFrames + 1) return; // CONST-OK: +1 seed-frame offset
    if (delta <= 0) return; // defensive: monotonic clocks should not regress
    this.deltas.push(delta);
  }

  report(): FPSReport {
    if (this.deltas.length === 0) {
      return { avg: 0, min: 0, p5: 0, frameCount: 0, droppedFrames: 0 };
    }
    const sorted = [...this.deltas].sort((a, b) => a - b); // CONST-OK: sort compare idiom (CODE-1 exception)
    const sum = sorted.reduce((acc, d) => acc + d, 0); // CONST-OK: reduce seed 0 (CODE-1 exception)
    const avgDelta = sum / sorted.length;
    const maxDelta = sorted[sorted.length - 1];
    // P5 of fps = fps at the 95th slowest delta (bad frames cluster at slow end).
    const p95Index = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95)); // CONST-OK: 95th percentile idiom
    const p95Delta = sorted[p95Index];
    const droppedFrames = sorted.filter((d) => d > FRAME_30FPS_BUDGET_MS).length;

    return {
      avg: 1000 / avgDelta, // CONST-OK: 1 second in ms (universal unit)
      min: 1000 / maxDelta, // slowest frame → lowest fps
      p5: 1000 / p95Delta,
      frameCount: sorted.length,
      droppedFrames,
    };
  }

  reset(): void {
    this.deltas = [];
    this.lastTimestamp = null;
    this.framesSeen = 0;
  }
}
