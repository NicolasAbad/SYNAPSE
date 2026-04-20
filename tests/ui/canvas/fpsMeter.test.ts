// Tests for src/ui/canvas/fpsMeter.ts — pure utility, no DOM required.

import { describe, expect, test } from 'vitest';
import { FPSMeter } from '../../../src/ui/canvas/fpsMeter';
import { SYNAPSE_CONSTANTS } from '../../../src/config/constants';

describe('FPSMeter', () => {
  test('empty report when no frames fed', () => {
    const meter = new FPSMeter(0);
    const r = meter.report();
    expect(r.avg).toBe(0);
    expect(r.frameCount).toBe(0);
    expect(r.droppedFrames).toBe(0);
  });

  test('computes avg fps from steady 16.67ms deltas (≈60 fps)', () => {
    const meter = new FPSMeter(0); // no warmup for test determinism
    // 101 frames → 100 deltas of ~16.67ms each
    for (let i = 0; i <= 100; i++) {
      meter.frame(i * (1000 / 60)); // CONST-OK: 60fps test fixture delta
    }
    const r = meter.report();
    expect(r.frameCount).toBe(100);
    expect(r.avg).toBeCloseTo(60, 1);
    expect(r.droppedFrames).toBe(0);
  });

  test('counts dropped frames when delta > 33.33ms (≈30 fps budget)', () => {
    const meter = new FPSMeter(0);
    // 10 deltas: 5 good (16.67ms), 5 bad (50ms)
    let t = 0;
    meter.frame(t);
    for (let i = 0; i < 5; i++) {
      t += 1000 / 60;
      meter.frame(t);
    }
    for (let i = 0; i < 5; i++) {
      t += 50; // CONST-OK: bad-frame test fixture (>30fps budget)
      meter.frame(t);
    }
    const r = meter.report();
    expect(r.droppedFrames).toBe(5);
  });

  test('discards warmup frames from statistics', () => {
    const meter = new FPSMeter(5); // skip first 5 deltas
    // 10 warmup frames at 1000ms each (would average 1 fps if counted)
    let t = 0;
    for (let i = 0; i <= 5; i++) {
      t += 1000;
      meter.frame(t);
    }
    // Now feed steady 60fps frames
    for (let i = 0; i < 60; i++) {
      t += 1000 / 60;
      meter.frame(t);
    }
    const r = meter.report();
    expect(r.avg).toBeCloseTo(60, 1);
  });

  test('min reflects slowest (single-frame worst) fps', () => {
    const meter = new FPSMeter(0);
    let t = 0;
    meter.frame(t);
    // Nine good frames + one 100ms stall
    for (let i = 0; i < 9; i++) {
      t += 1000 / 60;
      meter.frame(t);
    }
    t += 100;
    meter.frame(t);
    const r = meter.report();
    expect(r.min).toBeCloseTo(10, 1); // 1000 / 100ms = 10 fps
  });

  test('p5 catches jank hidden by high average', () => {
    const meter = new FPSMeter(0);
    let t = 0;
    meter.frame(t);
    // 95 good frames, 5 bad (200ms) → avg stays high, p5 dives
    for (let i = 0; i < 95; i++) {
      t += 1000 / 60;
      meter.frame(t);
    }
    for (let i = 0; i < 5; i++) {
      t += 200;
      meter.frame(t);
    }
    const r = meter.report();
    expect(r.avg).toBeGreaterThan(30); // avg still OK
    expect(r.p5).toBeLessThan(10); // p5 catches the stall
  });

  test('default warmup reads from SYNAPSE_CONSTANTS.perfFpsWarmupFrames', () => {
    const meter = new FPSMeter();
    // Feed warmup + 1 frame → 0 measured (first post-warmup sets lastTimestamp; need 2 post-warmup for a delta)
    let t = 0;
    for (let i = 0; i <= SYNAPSE_CONSTANTS.perfFpsWarmupFrames + 1; i++) {
      t += 1000 / 60;
      meter.frame(t);
    }
    const r = meter.report();
    expect(r.frameCount).toBeGreaterThan(0);
    expect(r.avg).toBeCloseTo(60, 0);
  });

  test('reset clears state', () => {
    const meter = new FPSMeter(0);
    meter.frame(0);
    meter.frame(16.67);
    expect(meter.report().frameCount).toBe(1);
    meter.reset();
    expect(meter.report().frameCount).toBe(0);
  });

  test('ignores non-monotonic or zero deltas defensively', () => {
    const meter = new FPSMeter(0);
    meter.frame(100);
    meter.frame(100); // zero delta
    meter.frame(50); // negative delta
    meter.frame(116.67); // legitimate 60fps frame from baseline 100
    const r = meter.report();
    // Only the 16.67ms delta (from 100 → 116.67 after 50 → 116.67 = 66.67)
    // Deltas recorded: 100→100 = 0 (skipped), 100→50 = -50 (skipped), 50→116.67 = 66.67
    expect(r.frameCount).toBe(1);
  });
});
