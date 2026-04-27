// Sprint 11a Phase 11a.6 follow-up — engine performance budgets for Sprint 11b.
// Asserts that the engine's hot-path reducers (tick, calculateProduction,
// handlePrestige) stay within reasonable runtime budgets. If a future change
// pushes any of these over budget, this test fails — and the regression is
// caught BEFORE Sprint 11b's device matrix runs (where the same regression
// would manifest as low FPS or jank on a real device).
//
// Budgets are intentionally generous (5-10× the typical observed runtime on
// dev hardware) so the test isn't a flake on slow CI / Windows / spinning
// rust. The point is to catch ORDER-OF-MAGNITUDE regressions, not micro-
// optimization; a 2× slowdown will fly under the radar (acceptable).
//
// Hot-path budgets (rationale):
//   - tick: 5ms p95 — runs every 100ms on the main thread; >5ms means the
//     game loop can't keep up with its own cadence on slow devices.
//   - calculateProduction: 2ms p95 — called from tick (so its budget is a
//     subset of tick's) plus from UI render hooks (so it must stay snappy).
//   - handlePrestige: 50ms p95 — fires once per prestige, not per tick;
//     50ms is a single-frame budget at 30fps, which is the worst case the
//     player should observe.

import { describe, expect, test } from 'vitest';
import { tick } from '../../src/engine/tick';
import { calculateProduction } from '../../src/engine/production';
import { handlePrestige } from '../../src/engine/prestige';
import { createDefaultState } from '../../src/store/gameStore';
import type { GameState } from '../../src/types/GameState';

function midGameState(): GameState {
  // Mirrors a P10-ish player: full neuron set, several upgrades owned, mid
  // cycle generated, no active modifiers. The shape exercises every branch
  // of the production formula + tick steps without being pathologically
  // expensive (which would test the wrong thing).
  const s = createDefaultState();
  s.cycleStartTimestamp = 1_000_000;
  s.dischargeLastTimestamp = 1_000_000;
  s.lastSpontaneousCheck = 1_000_000;
  s.prestigeCount = 10;
  s.lifetimePrestiges = 10;
  s.cycleGenerated = 5_000_000;
  s.totalGenerated = 50_000_000;
  s.thoughts = 5_000_000;
  s.neurons = [
    { type: 'basica', count: 80 },
    { type: 'sensorial', count: 40 },
    { type: 'piramidal', count: 25 },
    { type: 'espejo', count: 12 },
    { type: 'integradora', count: 6 },
  ];
  s.connectionMult = 1.5;
  s.isTutorialCycle = false;
  s.currentThreshold = 100_000_000;
  return s;
}

/** Run `fn` `iterations` times and return the p95 latency in ms. */
function p95Latency(fn: () => void, iterations: number): number {
  const samples: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    fn();
    samples.push(performance.now() - t0);
  }
  samples.sort((a, b) => a - b);
  return samples[Math.floor(samples.length * 0.95)];
}

describe('Engine perf budgets — Sprint 11b SLO foundation', () => {
  test('tick p95 < 5ms over 1000 calls (mid-game state)', () => {
    const state = midGameState();
    const p95 = p95Latency(() => tick(state, 2_000_000), 1000);
    // Generous budget — typical observed ~0.1ms on dev hardware. Catches
    // 50× regression. A real spike (e.g. someone adds an O(n²) loop in
    // tick) would show up here before Sprint 11b's device tests run.
    expect(p95).toBeLessThan(5);
  });

  test('calculateProduction p95 < 2ms over 1000 calls (mid-game state)', () => {
    const state = midGameState();
    const p95 = p95Latency(() => calculateProduction(state), 1000);
    expect(p95).toBeLessThan(2);
  });

  test('handlePrestige p95 < 50ms over 100 calls (mid-game state)', () => {
    const state = midGameState();
    state.cycleGenerated = 1_000_000_000_000;
    state.currentThreshold = 100_000_000_000;
    const p95 = p95Latency(() => handlePrestige(state, 9_999_999), 100);
    expect(p95).toBeLessThan(50);
  });
});
