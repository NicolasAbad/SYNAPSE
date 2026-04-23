// Sprint 7.10 Phase 7.10.2 — Offline engine unit tests (GDD §19 OFFLINE-1..11).

import { describe, expect, test } from 'vitest';
import {
  computeOfflineCapHours,
  computeOfflineEfficiencyMult,
  detectTimeAnomaly,
  applyOfflineProgress,
} from '../../src/engine/offline';
import { createDefaultState } from '../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';
import type { GameState } from '../../src/types/GameState';

function s(overrides: Partial<GameState> = {}): GameState {
  return { ...createDefaultState(), ...overrides };
}

function upgrade(id: string) {
  return { id, purchased: true };
}

describe('computeOfflineCapHours — OFFLINE-6', () => {
  test('base 4h with no upgrades', () => {
    expect(computeOfflineCapHours(s())).toBe(SYNAPSE_CONSTANTS.baseOfflineCapHours);
  });

  test('sueno_rem → 8h', () => {
    expect(computeOfflineCapHours(s({ upgrades: [upgrade('sueno_rem')] }))).toBe(8);
  });

  test('consciencia_distribuida (12h) overrides sueno_rem (8h) — max wins', () => {
    expect(
      computeOfflineCapHours(s({ upgrades: [upgrade('sueno_rem'), upgrade('consciencia_distribuida')] })),
    ).toBe(12);
  });

  test('clamped at maxOfflineHours ceiling', () => {
    const cap = computeOfflineCapHours(
      s({ upgrades: [upgrade('sueno_rem'), upgrade('consciencia_distribuida')] }),
    );
    expect(cap).toBeLessThanOrEqual(SYNAPSE_CONSTANTS.maxOfflineHours);
  });
});

describe('computeOfflineEfficiencyMult — OFFLINE-1..4/11 stack', () => {
  test('base 0.5 with no upgrades / archetype / decisions / Calm mood', () => {
    expect(computeOfflineEfficiencyMult(s(), 1)).toBeCloseTo(0.5 * 1.0, 10);
  });

  test('ritmo_circadiano stacks ×1.5', () => {
    const eff = computeOfflineEfficiencyMult(s({ upgrades: [upgrade('ritmo_circadiano')] }), 1);
    expect(eff).toBeCloseTo(0.5 * 1.5, 10);
  });

  test('ondas_theta stacks ×2.0', () => {
    const eff = computeOfflineEfficiencyMult(s({ upgrades: [upgrade('ondas_theta')] }), 1);
    expect(eff).toBeCloseTo(0.5 * 2.0, 10);
  });

  test('Empática archetype stacks ×2.5', () => {
    const eff = computeOfflineEfficiencyMult(s({ archetype: 'empatica' }), 1);
    expect(eff).toBeCloseTo(0.5 * SYNAPSE_CONSTANTS.empaticaOfflineEfficiencyMult, 10);
  });

  test('Genius Pass stacks ×1.25', () => {
    const eff = computeOfflineEfficiencyMult(s({ isSubscribed: true }), 1);
    expect(eff).toBeCloseTo(0.5 * SYNAPSE_CONSTANTS.geniusPassOfflineEfficiencyMult, 10);
  });

  test('Pattern Decision 15 Option A stacks ×1.15 (GDD §10)', () => {
    const eff = computeOfflineEfficiencyMult(s({ patternDecisions: { 15: 'A' } }), 1);
    expect(eff).toBeCloseTo(0.5 * 1.15, 10);
  });

  test('Pattern Decision 15 Option B does NOT stack offline mult', () => {
    const eff = computeOfflineEfficiencyMult(s({ patternDecisions: { 15: 'B' } }), 1);
    expect(eff).toBeCloseTo(0.5, 10);
  });

  test('Euphoric avg-mood tier applies ×1.30', () => {
    expect(computeOfflineEfficiencyMult(s(), 4)).toBeCloseTo(0.5 * 1.30, 10);
  });

  test('OFFLINE-4/11: full stack capped at maxOfflineEfficiencyRatio', () => {
    const fullStack = s({
      archetype: 'empatica',
      isSubscribed: true,
      patternDecisions: { 15: 'A' },
      upgrades: [
        upgrade('sueno_rem'),
        upgrade('consciencia_distribuida'),
        upgrade('ritmo_circadiano'),
        upgrade('ondas_theta'),
      ],
    });
    const eff = computeOfflineEfficiencyMult(fullStack, 4);
    expect(eff).toBe(SYNAPSE_CONSTANTS.maxOfflineEfficiencyRatio);
  });
});

describe('detectTimeAnomaly — OFFLINE-5', () => {
  const HOUR_MS = 3600 * 1000;

  test('clock backward → anomaly: backward, clampedElapsed 0', () => {
    const r = detectTimeAnomaly(s({ lastActiveTimestamp: 10_000 }), 5_000);
    expect(r.anomaly).toBe('backward');
    expect(r.clampedElapsedMs).toBe(0);
  });

  test('normal 2h elapsed within 4h cap → no anomaly', () => {
    const r = detectTimeAnomaly(s({ lastActiveTimestamp: 0 }), 2 * HOUR_MS);
    expect(r.anomaly).toBeNull();
    expect(r.clampedElapsedMs).toBe(2 * HOUR_MS);
  });

  test('elapsed beyond cap but under over-cap threshold → clamped to cap, no anomaly', () => {
    const r = detectTimeAnomaly(s({ lastActiveTimestamp: 0 }), 6 * HOUR_MS);
    expect(r.anomaly).toBeNull();
    expect(r.clampedElapsedMs).toBe(4 * HOUR_MS);
  });

  test('elapsed > cap × 2 → anomaly: over_cap, clamped to cap', () => {
    const r = detectTimeAnomaly(s({ lastActiveTimestamp: 0 }), 10 * HOUR_MS);
    expect(r.anomaly).toBe('over_cap');
    expect(r.clampedElapsedMs).toBe(4 * HOUR_MS);
  });
});

describe('applyOfflineProgress — orchestrator', () => {
  const HOUR_MS = 3600 * 1000;

  test('elapsed < 1 min → skip calc, timestamp still advances', () => {
    const state = s({ lastActiveTimestamp: 0, baseProductionPerSecond: 100 });
    const r = applyOfflineProgress(state, 30_000); // 30s < 1min
    expect(r.state.thoughts).toBe(state.thoughts);
    expect(r.state.lastActiveTimestamp).toBe(30_000);
    expect(r.summary.gained).toBe(0);
  });

  test('30 min offline at base config → gained = prod × seconds × 0.5 efficiency', () => {
    const state = s({
      lastActiveTimestamp: 0,
      baseProductionPerSecond: 100,
      mood: 30, // Calm tier → 1.00 mult
      currentThreshold: 1e12, // large enough to avoid cycle cap
    });
    const r = applyOfflineProgress(state, 30 * 60 * 1000);
    const expected = 100 * 30 * 60 * 0.5 * 1.0;
    expect(r.summary.gained).toBeCloseTo(expected, 6);
    expect(r.state.thoughts).toBeCloseTo(expected, 6);
    expect(r.summary.cappedHit).toBe(false);
    expect(r.state.lastActiveTimestamp).toBe(30 * 60 * 1000);
  });

  test('OFFLINE-2: cycle-cap halts gain at (currentThreshold - cycleGenerated)', () => {
    const state = s({
      lastActiveTimestamp: 0,
      baseProductionPerSecond: 1_000_000, // huge rate forces cycle cap
      cycleGenerated: 0,
      currentThreshold: 50_000,
    });
    const r = applyOfflineProgress(state, HOUR_MS);
    expect(r.summary.cappedHit).toBe(true);
    expect(r.summary.gained).toBeCloseTo(50_000, 6);
    expect(r.state.cycleGenerated).toBeCloseTo(50_000, 6);
  });

  test('OFFLINE-7: cycle cap + nextDischargeBonus > 0 → enhancedDischargeAvailable', () => {
    const state = s({
      lastActiveTimestamp: 0,
      baseProductionPerSecond: 1_000_000,
      currentThreshold: 50_000,
      nextDischargeBonus: 1,
    });
    const r = applyOfflineProgress(state, HOUR_MS);
    expect(r.summary.enhancedDischargeAvailable).toBe(true);
  });

  test('time anomaly backward → timestamp advances, no gain, anomaly reported', () => {
    const state = s({ lastActiveTimestamp: 1_000_000, baseProductionPerSecond: 100 });
    const r = applyOfflineProgress(state, 500_000);
    expect(r.summary.timeAnomaly).toBe('backward');
    expect(r.summary.gained).toBe(0);
    expect(r.state.lastActiveTimestamp).toBe(500_000);
  });

  test('lucidDreamTriggered always false in Phase 7.10.2 (reserved for 7.10.3)', () => {
    const state = s({ lastActiveTimestamp: 0, baseProductionPerSecond: 100, archetype: 'empatica' });
    const r = applyOfflineProgress(state, 2 * HOUR_MS);
    expect(r.summary.lucidDreamTriggered).toBe(false);
  });
});
