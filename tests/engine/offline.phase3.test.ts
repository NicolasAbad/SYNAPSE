// Sprint 7.10 Phase 7.10.3 — Offline engine extensions (GDD §19 MUT-1 +
// OFFLINE-9 shard drip + Lucid Dream RNG roll per §30 RNG-1).

import { describe, expect, test } from 'vitest';
import {
  effectiveOfflineProductionPerSecond,
  offlineProceduralShardDrip,
  rollLucidDream,
  applyOfflineProgress,
} from '../../src/engine/offline';
import { createDefaultState } from '../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';
import { MUTATIONS_BY_ID } from '../../src/config/mutations';
import type { GameState } from '../../src/types/GameState';

function s(overrides: Partial<GameState> = {}): GameState {
  return { ...createDefaultState(), ...overrides };
}

describe('effectiveOfflineProductionPerSecond — MUT-1 temporal averaging', () => {
  test('no current mutation → peak rate unchanged', () => {
    const state = s({ baseProductionPerSecond: 100 });
    expect(effectiveOfflineProductionPerSecond(state)).toBe(100);
  });

  test('Sprint mutation → peak × (earlyMult + lateMult) / 2', () => {
    const m = MUTATIONS_BY_ID['sprint'];
    expect(m.effect.kind).toBe('sprint');
    const state = s({
      baseProductionPerSecond: 100,
      currentMutation: { id: 'sprint' },
    });
    const e = m.effect as { kind: 'sprint'; earlyMult: number; lateMult: number };
    const expected = 100 * (e.earlyMult + e.lateMult) * 0.5;
    expect(effectiveOfflineProductionPerSecond(state)).toBeCloseTo(expected, 6);
  });

  test('Crescendo mutation → peak × (startMult + endMult) / 2', () => {
    const m = MUTATIONS_BY_ID['crescendo'];
    const state = s({
      baseProductionPerSecond: 100,
      currentMutation: { id: 'crescendo' },
    });
    const e = m.effect as { kind: 'crescendo'; startMult: number; endMult: number };
    const expected = 100 * (e.startMult + e.endMult) * 0.5;
    expect(effectiveOfflineProductionPerSecond(state)).toBeCloseTo(expected, 6);
  });

  test('non-temporal mutation (affectsOffline=false) → peak unchanged', () => {
    const state = s({
      baseProductionPerSecond: 100,
      currentMutation: { id: 'hiperestimulacion' },
    });
    expect(effectiveOfflineProductionPerSecond(state)).toBe(100);
  });
});

describe('offlineProceduralShardDrip — OFFLINE-9', () => {
  test('0 ms elapsed → 0 drip', () => {
    expect(offlineProceduralShardDrip(0)).toBe(0);
  });

  test('1 minute elapsed → base × offlineRateMult shards', () => {
    const drip = offlineProceduralShardDrip(60_000);
    const expected = SYNAPSE_CONSTANTS.shardDripBasePerMinute * SYNAPSE_CONSTANTS.shardDripOfflineRateMult;
    expect(drip).toBeCloseTo(expected, 10);
  });

  test('10 minutes elapsed → 10× the 1-min rate (linear)', () => {
    const one = offlineProceduralShardDrip(60_000);
    const ten = offlineProceduralShardDrip(600_000);
    expect(ten).toBeCloseTo(one * 10, 6);
  });
});

describe('rollLucidDream — P10+ + min-elapsed gates + seeded RNG', () => {
  const THIRTY_MIN = 30 * 60 * 1000;

  test('prestigeCount < unlockPrestige → false regardless of archetype', () => {
    const state = s({ prestigeCount: 9, archetype: 'empatica', lastActiveTimestamp: 0 });
    expect(rollLucidDream(state, THIRTY_MIN, THIRTY_MIN)).toBe(false);
  });

  test('elapsed < minMinutes → false', () => {
    const state = s({ prestigeCount: 10, archetype: 'empatica', lastActiveTimestamp: 0 });
    expect(rollLucidDream(state, 20 * 60 * 1000, 20 * 60 * 1000)).toBe(false);
  });

  test('P10 + Empática + elapsed ≥ 30min → always true (probability 1.0)', () => {
    const state = s({ prestigeCount: 10, archetype: 'empatica', lastActiveTimestamp: 0 });
    // Multiple timestamps — Empática is always 1.0, so all must be true regardless of seed.
    for (const now of [THIRTY_MIN, 2 * THIRTY_MIN, 10 * THIRTY_MIN, 37_777_777]) {
      expect(rollLucidDream(state, now, THIRTY_MIN)).toBe(true);
    }
  });

  test('deterministic — same (lastActiveTimestamp, nowTimestamp) → same result', () => {
    const state = s({ prestigeCount: 10, archetype: 'analitica', lastActiveTimestamp: 12345 });
    const r1 = rollLucidDream(state, 67890, THIRTY_MIN);
    const r2 = rollLucidDream(state, 67890, THIRTY_MIN);
    expect(r1).toBe(r2);
  });

  test('different (last, now) seeds produce a mix of true/false across the default 33% cohort', () => {
    // At probability 0.33 across a distribution of hashes, expect roughly a third true.
    // This is a sanity check that the roll isn't wired to always-false.
    let trues = 0;
    const trials = 200;
    for (let i = 0; i < trials; i++) {
      const state = s({ prestigeCount: 10, archetype: 'analitica', lastActiveTimestamp: i });
      if (rollLucidDream(state, 1_000_000 + i * 7919, 60 * 60 * 1000)) trues++;
    }
    // 33% of 200 = 66; tolerate ±40% drift across this tiny sample.
    expect(trues).toBeGreaterThan(30);
    expect(trues).toBeLessThan(110);
  });
});

describe('applyOfflineProgress — Phase 7.10.3 integration', () => {
  const HOUR_MS = 3600 * 1000;

  test('Sprint mutation uses AVG mult (2.75×) for offline gain', () => {
    const mut = MUTATIONS_BY_ID['sprint'].effect as { earlyMult: number; lateMult: number };
    const avgMult = (mut.earlyMult + mut.lateMult) * 0.5;
    const state = s({
      lastActiveTimestamp: 0,
      baseProductionPerSecond: 100,
      currentThreshold: 1e12,
      currentMutation: { id: 'sprint' },
    });
    const r = applyOfflineProgress(state, HOUR_MS);
    // 1h @ 100/sec × base efficiency 0.5 × Calm mood 1.0 × avgMult
    const expected = 100 * 3600 * 0.5 * 1.0 * avgMult;
    expect(r.summary.gained).toBeCloseTo(expected, 4);
  });

  test('Procedural shards accumulate during offline at 50% rate', () => {
    const state = s({
      lastActiveTimestamp: 0,
      baseProductionPerSecond: 1,
      currentThreshold: 1e12,
    });
    const before = state.memoryShards.procedural;
    const r = applyOfflineProgress(state, HOUR_MS);
    const expectedDrip = SYNAPSE_CONSTANTS.shardDripBasePerMinute * SYNAPSE_CONSTANTS.shardDripOfflineRateMult * 60;
    expect(r.state.memoryShards.procedural - before).toBeCloseTo(expectedDrip, 6);
  });

  test('Emotional + Episodic shards do NOT drip offline (OFFLINE-9)', () => {
    const state = s({
      lastActiveTimestamp: 0,
      baseProductionPerSecond: 1,
      currentThreshold: 1e12,
      memoryShards: { emotional: 7, procedural: 0, episodic: 11 },
    });
    const r = applyOfflineProgress(state, 4 * HOUR_MS);
    expect(r.state.memoryShards.emotional).toBe(7);
    expect(r.state.memoryShards.episodic).toBe(11);
    expect(r.state.memoryShards.procedural).toBeGreaterThan(0);
  });

  test('Lucid Dream triggers for P10 Empática after ≥30min offline', () => {
    const state = s({
      lastActiveTimestamp: 0,
      baseProductionPerSecond: 1,
      currentThreshold: 1e12,
      prestigeCount: 10,
      archetype: 'empatica',
    });
    const r = applyOfflineProgress(state, HOUR_MS);
    expect(r.summary.lucidDreamTriggered).toBe(true);
  });

  test('Lucid Dream blocked below P10 (summary.lucidDreamTriggered false)', () => {
    const state = s({
      lastActiveTimestamp: 0,
      baseProductionPerSecond: 1,
      currentThreshold: 1e12,
      prestigeCount: 9,
      archetype: 'empatica',
    });
    const r = applyOfflineProgress(state, HOUR_MS);
    expect(r.summary.lucidDreamTriggered).toBe(false);
  });

  test('skip branch (<1min) does not drip shards or roll Lucid Dream', () => {
    const state = s({
      lastActiveTimestamp: 0,
      baseProductionPerSecond: 100,
      prestigeCount: 10,
      archetype: 'empatica',
    });
    const r = applyOfflineProgress(state, 30_000); // 30s < 1min
    expect(r.state.memoryShards.procedural).toBe(state.memoryShards.procedural);
    expect(r.summary.lucidDreamTriggered).toBe(false);
  });
});
