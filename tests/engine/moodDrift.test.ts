// Sprint 7.9 Phase 7.9.2 — Mood online drift tests (GDD §16.3 MOOD-3 extended).

import { describe, expect, test } from 'vitest';
import { applyMoodDrift, moodOnlineDriftRate } from '../../src/engine/mood';
import { createDefaultState } from '../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';
import type { GameState } from '../../src/types/GameState';

const TICK_MS = 100;

function s(overrides: Partial<GameState> = {}): GameState {
  return { ...createDefaultState(), ...overrides };
}

describe('moodOnlineDriftRate — base + multipliers', () => {
  test('default rate is moodOnlineDriftPerMinute', () => {
    expect(moodOnlineDriftRate(s())).toBe(SYNAPSE_CONSTANTS.moodOnlineDriftPerMinute);
  });

  test('Empática archetype halves drift rate', () => {
    const rate = moodOnlineDriftRate(s({ archetype: 'empatica' }));
    expect(rate).toBe(SYNAPSE_CONSTANTS.moodOnlineDriftPerMinute * SYNAPSE_CONSTANTS.moodDriftArchetypeEmpaticaMult);
  });

  test('Analítica / Creativa do NOT halve drift rate', () => {
    expect(moodOnlineDriftRate(s({ archetype: 'analitica' }))).toBe(SYNAPSE_CONSTANTS.moodOnlineDriftPerMinute);
    expect(moodOnlineDriftRate(s({ archetype: 'creativa' }))).toBe(SYNAPSE_CONSTANTS.moodOnlineDriftPerMinute);
  });

  test('lim_steady_heart halves drift rate (stackable with Empática)', () => {
    const upgrades = [{ id: 'lim_steady_heart', purchased: true }];
    const rate = moodOnlineDriftRate(s({ upgrades }));
    expect(rate).toBe(SYNAPSE_CONSTANTS.moodOnlineDriftPerMinute * SYNAPSE_CONSTANTS.moodDriftSteadyHeartMult);
    const both = moodOnlineDriftRate(s({ archetype: 'empatica', upgrades }));
    expect(both).toBe(SYNAPSE_CONSTANTS.moodOnlineDriftPerMinute * SYNAPSE_CONSTANTS.moodDriftArchetypeEmpaticaMult * SYNAPSE_CONSTANTS.moodDriftSteadyHeartMult);
  });
});

describe('applyMoodDrift — direction + target behavior', () => {
  test('mood above 50 drifts DOWN toward 50', () => {
    const next = applyMoodDrift(s({ mood: 100 }), TICK_MS);
    expect(next).toBeLessThan(100);
    expect(next).toBeGreaterThan(50);
  });

  test('mood below 50 drifts UP toward 50', () => {
    const next = applyMoodDrift(s({ mood: 10 }), TICK_MS);
    expect(next).toBeGreaterThan(10);
    expect(next).toBeLessThan(50);
  });

  test('mood at 50 is stable (no drift)', () => {
    expect(applyMoodDrift(s({ mood: 50 }), TICK_MS)).toBe(50);
  });

  test('drift never overshoots target in a single tick', () => {
    // At rate 0.5/min, TICK_MS=100, each tick = 0.000833 mood. Large dt should still cap at target.
    const next = applyMoodDrift(s({ mood: 51 }), 1_000_000);
    expect(next).toBe(50);
    const upNext = applyMoodDrift(s({ mood: 49 }), 1_000_000);
    expect(upNext).toBe(50);
  });
});

describe('applyMoodDrift — floor interactions', () => {
  test('lim_resilience floor 25 binds when mood is below it', () => {
    const upgrades = [{ id: 'lim_resilience', purchased: true }];
    const next = applyMoodDrift(s({ mood: 10, upgrades }), TICK_MS);
    // Without floor, 10 would drift UP toward 50. With floor, still UP but clamped at ≥ 25.
    // In one tick the delta is tiny, so floor pulls up to 25 immediately.
    expect(next).toBeGreaterThanOrEqual(SYNAPSE_CONSTANTS.limResilienceMoodFloor);
  });

  test('Genius Pass floor 40 binds when mood is below it', () => {
    const next = applyMoodDrift(s({ mood: 20, isSubscribed: true }), TICK_MS);
    expect(next).toBeGreaterThanOrEqual(SYNAPSE_CONSTANTS.moodGeniusPassFloor);
  });

  test('Genius Pass floor + lim_resilience: stricter (higher) floor wins', () => {
    const upgrades = [{ id: 'lim_resilience', purchased: true }];
    const next = applyMoodDrift(s({ mood: 10, isSubscribed: true, upgrades }), TICK_MS);
    expect(next).toBeGreaterThanOrEqual(Math.max(SYNAPSE_CONSTANTS.limResilienceMoodFloor, SYNAPSE_CONSTANTS.moodGeniusPassFloor));
  });

  test('floors do NOT push mood ABOVE 50 (drift target wins once mood crosses floor)', () => {
    // Mood above any floor drifts toward 50 normally.
    const upgrades = [{ id: 'lim_resilience', purchased: true }];
    const next = applyMoodDrift(s({ mood: 80, upgrades }), TICK_MS);
    expect(next).toBeLessThan(80);
    expect(next).toBeGreaterThan(50);
  });
});

describe('applyMoodDrift — rate quantification', () => {
  test('per-tick delta matches rate-per-min × (dt/60_000)', () => {
    const mood0 = 100;
    const next = applyMoodDrift(s({ mood: mood0 }), TICK_MS);
    const expectedStep = SYNAPSE_CONSTANTS.moodOnlineDriftPerMinute * (TICK_MS / 60_000);
    expect(mood0 - next).toBeCloseTo(expectedStep, 10);
  });

  test('over 1 minute of ticks, mood drifts ~0.5 points (base rate)', () => {
    const ticksPerMin = 60_000 / TICK_MS; // CONST-OK 600 ticks
    let mood = 100;
    for (let i = 0; i < ticksPerMin; i++) {
      mood = applyMoodDrift(s({ mood }), TICK_MS);
    }
    // Expected: 100 - 0.5 = 99.5 (within floating-point tolerance)
    expect(mood).toBeCloseTo(100 - SYNAPSE_CONSTANTS.moodOnlineDriftPerMinute, 6);
  });

  test('Empática: mood drifts HALF as fast over 1 minute', () => {
    const ticksPerMin = 60_000 / TICK_MS;
    let mood = 100;
    for (let i = 0; i < ticksPerMin; i++) {
      mood = applyMoodDrift(s({ mood, archetype: 'empatica' }), TICK_MS);
    }
    expect(mood).toBeCloseTo(100 - SYNAPSE_CONSTANTS.moodOnlineDriftPerMinute * SYNAPSE_CONSTANTS.moodDriftArchetypeEmpaticaMult, 6);
  });
});

describe('applyMoodDrift — bounds', () => {
  test('never exceeds moodMaxValue', () => {
    expect(applyMoodDrift(s({ mood: SYNAPSE_CONSTANTS.moodMaxValue }), TICK_MS)).toBeLessThanOrEqual(SYNAPSE_CONSTANTS.moodMaxValue);
  });

  test('never goes below 0 (no floor)', () => {
    expect(applyMoodDrift(s({ mood: 0 }), TICK_MS)).toBeGreaterThanOrEqual(0);
  });
});
