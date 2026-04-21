// Golden-file snapshot test (Phase 4.5).
//
// Seeds a deterministic GameState + runs the engine for N ticks. Dumps
// key numeric fields into a snapshot. Any change to the tick pipeline
// (production formula, discharge accumulation, state ordering) shows up
// as a diff in the `.snap` file.
//
// Why this is stronger than hand-written assertions:
//   - I didn't invent the expected numbers — they come from running the
//     actual engine once, then locking them in. If the engine drifts,
//     the snapshot tells me EXACTLY which field changed by how much.
//   - Vitest's inline snapshot syntax means the "expected" value lives
//     next to the test; diffs are obvious in PRs.
//   - Catches refactor regressions the property tests miss (those verify
//     invariants like "thoughts never decrease", not exact accumulation).
//
// When a legitimate change alters the snapshot, update with:
//   npx vitest run tests/properties/tick-golden.test.ts --update
// and review the diff carefully before committing.

import { describe, expect, test } from 'vitest';
import { tick } from '../../src/engine/tick';
import { createDefaultState } from '../../src/store/gameStore';
import type { GameState } from '../../src/types/GameState';
import type { UpgradeState } from '../../src/types';

// Fixed seed state — deterministic across runs. Avoid Date.now() / random.
const SEED_TIMESTAMP = 1_700_000_000_000; // 2023-11-14 arbitrary fixed wall clock
const TICK_INTERVAL_MS = 100;

function seededState(): GameState {
  return {
    ...createDefaultState(),
    // Boot timestamps at seed time (INIT-1 would do this in live app)
    cycleStartTimestamp: SEED_TIMESTAMP,
    sessionStartTimestamp: SEED_TIMESTAMP,
    lastActiveTimestamp: SEED_TIMESTAMP,
    dischargeLastTimestamp: SEED_TIMESTAMP,
    lastSpontaneousCheck: SEED_TIMESTAMP,
    // Mid-game snapshot: 20 Básicas + 5 Sensoriales + 2 Piramidales, a couple upgrades owned.
    neurons: [
      { type: 'basica', count: 20 },
      { type: 'sensorial', count: 5 },
      { type: 'piramidal', count: 2 },
      { type: 'espejo', count: 0 },
      { type: 'integradora', count: 0 },
    ],
    connectionMult: 1.15, // 3 types owned = C(3,2)=3 pairs → 1 + 3×0.05 = 1.15
    upgrades: [
      { id: 'red_neuronal_densa', purchased: true, purchasedAt: SEED_TIMESTAMP },
      { id: 'receptores_ampa', purchased: true, purchasedAt: SEED_TIMESTAMP },
      { id: 'descarga_neural', purchased: true, purchasedAt: SEED_TIMESTAMP },
    ] as UpgradeState[],
    dischargeMaxCharges: 3, // descarga_neural adds +1
    thoughts: 10_000,
    totalGenerated: 50_000,
  };
}

function runTicks(state: GameState, n: number): GameState {
  let s = state;
  for (let i = 0; i < n; i++) {
    const { state: next } = tick(s, SEED_TIMESTAMP + (i + 1) * TICK_INTERVAL_MS);
    s = next;
  }
  return s;
}

// Project the fields that matter for behavior verification.
// Excludes large arrays (lastTapTimestamps, etc.) and booleans that are
// trivially state-restore on every tick.
function projectGoldenFields(s: GameState) {
  return {
    thoughts: Math.round(s.thoughts * 1_000_000) / 1_000_000,
    cycleGenerated: Math.round(s.cycleGenerated * 1_000_000) / 1_000_000,
    totalGenerated: Math.round(s.totalGenerated * 1_000_000) / 1_000_000,
    baseProductionPerSecond: Math.round(s.baseProductionPerSecond * 1_000_000) / 1_000_000,
    effectiveProductionPerSecond: Math.round(s.effectiveProductionPerSecond * 1_000_000) / 1_000_000,
    dischargeCharges: s.dischargeCharges,
    dischargeLastTimestamp: s.dischargeLastTimestamp,
    consciousnessBarUnlocked: s.consciousnessBarUnlocked,
    piggyBankSparks: s.piggyBankSparks,
  };
}

describe('Golden snapshots — deterministic tick sequence from a seeded mid-game state', () => {
  test('after 1 tick (100ms)', () => {
    const s = runTicks(seededState(), 1);
    expect(projectGoldenFields(s)).toMatchInlineSnapshot(`
      {
        "baseProductionPerSecond": 153.09375,
        "consciousnessBarUnlocked": false,
        "cycleGenerated": 15.309375,
        "dischargeCharges": 0,
        "dischargeLastTimestamp": 1700000000000,
        "effectiveProductionPerSecond": 153.09375,
        "piggyBankSparks": 0,
        "thoughts": 10015.309375,
        "totalGenerated": 50015.309375,
      }
    `);
  });

  test('after 10 ticks (1 second)', () => {
    const s = runTicks(seededState(), 10);
    expect(projectGoldenFields(s)).toMatchInlineSnapshot(`
      {
        "baseProductionPerSecond": 153.09375,
        "consciousnessBarUnlocked": false,
        "cycleGenerated": 153.09375,
        "dischargeCharges": 0,
        "dischargeLastTimestamp": 1700000000000,
        "effectiveProductionPerSecond": 153.09375,
        "piggyBankSparks": 0,
        "thoughts": 10153.09375,
        "totalGenerated": 50153.09375,
      }
    `);
  });

  test('after 100 ticks (10 seconds)', () => {
    const s = runTicks(seededState(), 100);
    expect(projectGoldenFields(s)).toMatchInlineSnapshot(`
      {
        "baseProductionPerSecond": 153.09375,
        "consciousnessBarUnlocked": false,
        "cycleGenerated": 1530.9375,
        "dischargeCharges": 0,
        "dischargeLastTimestamp": 1700000000000,
        "effectiveProductionPerSecond": 153.09375,
        "piggyBankSparks": 0,
        "thoughts": 11530.9375,
        "totalGenerated": 51530.9375,
      }
    `);
  });

});
