// Sprint 4a Phase 4a.6 integration test.
// Ties the engine (tick + applyTap + handlePrestige) + store wiring
// together in one end-to-end P0 → P1 simulation. Closes the
// SPRINTS.md §4a integration-test checkbox:
//   "simulate P1 tick-by-tick with [typical tap rate] → threshold reached
//    in a reasonable window, then prestige fires cleanly and produces a
//    valid P1 cycle state."
//
// The exact-minute target (TUTOR-1 7–9 min) is tuned by the separate
// scripts/tutorial-timing.ts simulator + the Sprint 4c blind-play. This
// test is a SMOKE integration — it proves the pipeline is wired, not
// that the tuning is optimal.

import { describe, expect, test } from 'vitest';
import { tick } from '../../src/engine/tick';
import { applyTap } from '../../src/store/tap';
import { tryBuyNeuron, tryBuyUpgrade } from '../../src/store/purchases';
import { handlePrestige } from '../../src/engine/prestige';
import { neuronCost } from '../../src/config/neurons';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';
import { createDefaultState } from '../../src/store/gameStore';
import type { GameState } from '../../src/types/GameState';
import type { NeuronType } from '../../src/types';

// CONST-OK: tick dt; mirrors tutorial-timing simulator (CODE-9 fixed tick).
const DT_MS = 100;
const START_TIME = 1_000_000;
const MAX_SIM_MINUTES = 15;
const MAX_TICKS = (MAX_SIM_MINUTES * 60 * 1000) / DT_MS;

function countOf(state: GameState, type: NeuronType): number {
  return state.neurons.find((n) => n.type === type)?.count ?? 0;
}

/** Greedy tutorial playstyle per scripts/tutorial-timing.ts Phase 7 sim. */
function tryGreedyPurchases(state: GameState, now: number): GameState {
  // 1. cheap global upgrade first.
  if (!state.upgrades.some((u) => u.id === 'red_neuronal_densa' && u.purchased)) {
    const r = tryBuyUpgrade(state, 'red_neuronal_densa', now);
    if (r.ok) Object.assign(state, r.updates);
  }
  // 2. tap multiplier.
  if (!state.upgrades.some((u) => u.id === 'potencial_sinaptico' && u.purchased)) {
    const r = tryBuyUpgrade(state, 'potencial_sinaptico', now);
    if (r.ok) Object.assign(state, r.updates);
  }
  // 3. One Sensorial once unlock condition met (10 Básicas owned).
  if (countOf(state, 'basica') >= 10 && countOf(state, 'sensorial') === 0) {
    const r = tryBuyNeuron(state, 'sensorial', now);
    if (r.ok) Object.assign(state, r.updates);
  }
  // 4. Spam Básicas while affordable (simplest fallback; matches Phase 7 sim).
  let i = 0;
  while (i < 20 && state.thoughts >= neuronCost('basica', countOf(state, 'basica'))) {
    const r = tryBuyNeuron(state, 'basica', now);
    if (!r.ok) break;
    Object.assign(state, r.updates);
    i++;
  }
  return state;
}

function simulateToThreshold(tapsPerSec: number): {
  state: GameState;
  minutesToThreshold: number;
  reachedThreshold: boolean;
} {
  let state: GameState = {
    ...createDefaultState(),
    cycleStartTimestamp: START_TIME,
    sessionStartTimestamp: START_TIME,
    lastActiveTimestamp: START_TIME,
    dischargeLastTimestamp: START_TIME,
  };

  let now = START_TIME;
  let tapAccum = 0;
  const tapIntervalMs = 1000 / tapsPerSec; // CONST-OK: ms→sec
  let ticks = 0;
  let antiSpamActive = false;

  while (state.cycleGenerated < state.currentThreshold && ticks < MAX_TICKS) {
    const result = tick(state, now);
    state = result.state as GameState;
    antiSpamActive = result.antiSpamActive;

    tapAccum += DT_MS;
    while (tapAccum >= tapIntervalMs) {
      tapAccum -= tapIntervalMs;
      Object.assign(state, applyTap(state, antiSpamActive, now));
    }

    state = tryGreedyPurchases(state, now);

    now += DT_MS;
    ticks++;
  }

  const minutesToThreshold = (now - START_TIME) / 60_000; // CONST-OK: ms→min
  return {
    state,
    minutesToThreshold,
    reachedThreshold: state.cycleGenerated >= state.currentThreshold,
  };
}

describe('Sprint 4a integration — P0 → P1 end-to-end', () => {
  test('at 5 taps/sec, reaches cycleGenerated ≥ currentThreshold within 15 minutes', () => {
    const { minutesToThreshold, reachedThreshold } = simulateToThreshold(5);
    expect(reachedThreshold).toBe(true);
    expect(minutesToThreshold).toBeLessThan(MAX_SIM_MINUTES);
    // Target is TUTOR-1 7–9 min; sim shows ~9.21 at 5 taps/sec.
    // Guard lets the test remain stable across upgrade-ordering tweaks
    // while still catching regressions (e.g. a 20-min divergence).
    expect(minutesToThreshold).toBeLessThan(12);
  });

  test('at 2 taps/sec (conservative), still reaches threshold within MAX_SIM_MINUTES', () => {
    const { reachedThreshold, minutesToThreshold } = simulateToThreshold(2);
    expect(reachedThreshold).toBe(true);
    expect(minutesToThreshold).toBeLessThan(MAX_SIM_MINUTES);
  });

  test('prestige fires cleanly after threshold reached', () => {
    const { state: ready } = simulateToThreshold(5);
    expect(ready.cycleGenerated).toBeGreaterThanOrEqual(ready.currentThreshold);

    const prestigeAt = START_TIME + 10 * 60 * 1000; // 10 min after start
    const { state: next, outcome } = handlePrestige(ready, prestigeAt);

    // PREST-1 step outcomes.
    expect(outcome.newPrestigeCount).toBe(1);
    expect(next.prestigeCount).toBe(1);
    expect(next.isTutorialCycle).toBe(false); // TUTOR-2 flip.
    expect(next.lifetimePrestiges).toBe(1);

    // P1 cycle begins with fresh RESET (neurons=0, upgrades=empty).
    expect(next.upgrades).toEqual([]);
    expect(next.neurons.every((n) => n.count === 0)).toBe(true);

    // currentThreshold recalculated to baseThresholdTable[1] (P1→P2, Run 1).
    expect(next.currentThreshold).toBe(SYNAPSE_CONSTANTS.baseThresholdTable[1]);

    // Memories credited (at least the base amount).
    expect(next.memories).toBeGreaterThanOrEqual(SYNAPSE_CONSTANTS.baseMemoriesPerPrestige);

    // Momentum applied as thoughts starting balance.
    expect(next.thoughts).toBe(outcome.momentumBonus);
    expect(next.thoughts).toBeLessThanOrEqual(
      next.currentThreshold * SYNAPSE_CONSTANTS.maxMomentumPct + 1e-6,
    );

    // Awakening log + personal best recorded.
    expect(next.awakeningLog).toHaveLength(1);
    expect(next.awakeningLog[0].prestigeCount).toBe(0); // pre-increment.
    expect(next.personalBests[0]).toBeDefined();
    expect(outcome.wasPersonalBest).toBe(true); // first entry — always a new PB.
  });

  test('post-prestige state is a valid starting point for a second cycle', () => {
    const { state: ready } = simulateToThreshold(5);
    const { state: p1 } = handlePrestige(ready, START_TIME + 10 * 60 * 1000);

    // A single tick should not throw and should produce some PPS
    // (P1 has no neurons yet, so PPS stays 0 unless player buys).
    const ticked = tick(p1, START_TIME + 10 * 60 * 1000 + DT_MS);
    expect(ticked.state.cycleGenerated).toBeGreaterThanOrEqual(p1.cycleGenerated);
  });
});
