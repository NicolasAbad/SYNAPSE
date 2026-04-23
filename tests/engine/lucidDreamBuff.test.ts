// Sprint 7.10 Phase 7.10.5 — Lucid Dream Option A buff tests (GDD §19).
// Engine helper `lucidDreamProductionMult` + tick.ts integration (expire + apply).

import { describe, expect, test } from 'vitest';
import { lucidDreamProductionMult } from '../../src/engine/offline';
import { tick } from '../../src/engine/tick';
import { createDefaultState } from '../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';
import type { GameState } from '../../src/types/GameState';

function s(overrides: Partial<GameState> = {}): GameState {
  return { ...createDefaultState(), ...overrides };
}

describe('lucidDreamProductionMult — pure helper', () => {
  test('null lucidDreamActiveUntil → 1.0 (identity)', () => {
    expect(lucidDreamProductionMult({ lucidDreamActiveUntil: null }, 1_000_000)).toBe(1);
  });

  test('expiry in past → 1.0 (identity)', () => {
    expect(lucidDreamProductionMult({ lucidDreamActiveUntil: 500_000 }, 1_000_000)).toBe(1);
  });

  test('expiry in future → lucidDreamOptionAProductionMult (1.10)', () => {
    expect(lucidDreamProductionMult({ lucidDreamActiveUntil: 2_000_000 }, 1_000_000))
      .toBe(SYNAPSE_CONSTANTS.lucidDreamOptionAProductionMult);
  });

  test('expiry exactly === now → 1.0 (boundary: expired)', () => {
    expect(lucidDreamProductionMult({ lucidDreamActiveUntil: 1_000_000 }, 1_000_000)).toBe(1);
  });
});

describe('tick integration — expire + apply', () => {
  test('stepExpireModifiers clears lucidDreamActiveUntil when expired', () => {
    const state = s({
      lucidDreamActiveUntil: 999_999,
      baseProductionPerSecond: 100,
    });
    const result = tick(state, 1_000_000);
    expect(result.state.lucidDreamActiveUntil).toBeNull();
  });

  test('stepExpireModifiers preserves lucidDreamActiveUntil when still active', () => {
    const state = s({
      lucidDreamActiveUntil: 2_000_000,
      baseProductionPerSecond: 100,
    });
    const result = tick(state, 1_000_000);
    expect(result.state.lucidDreamActiveUntil).toBe(2_000_000);
  });

  test('active buff → effectiveProductionPerSecond reflects 1.10 mult', () => {
    const noBuffState = s({ baseProductionPerSecond: 100, mood: 30 });
    const buffState = s({ baseProductionPerSecond: 100, mood: 30, lucidDreamActiveUntil: 2_000_000 });
    const noBuffEff = tick(noBuffState, 1_000_000).state.effectiveProductionPerSecond;
    const buffEff = tick(buffState, 1_000_000).state.effectiveProductionPerSecond;
    expect(buffEff / noBuffEff).toBeCloseTo(SYNAPSE_CONSTANTS.lucidDreamOptionAProductionMult, 4);
  });
});
