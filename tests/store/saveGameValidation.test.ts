// Pre-launch audit Day 1 — deep type-aware validation tests for validateLoadedState.
// Pre-audit, validateLoadedState only checked field count (133); a save with
// `thoughts: "NaN"` would pass and crash the engine on first tick. These tests
// confirm the new critical-field validators reject the audit-flagged corruptions.

import { describe, expect, test } from 'vitest';
import { validateLoadedState } from '../../src/store/saveGame';
import { createDefaultState } from '../../src/store/gameStore';

function buildValidState() {
  return createDefaultState();
}

describe('validateLoadedState — pre-launch audit hardening', () => {
  test('accepts a clean default state', () => {
    expect(validateLoadedState(buildValidState())).not.toBeNull();
  });

  test('rejects null', () => {
    expect(validateLoadedState(null)).toBeNull();
  });

  test('rejects an array', () => {
    expect(validateLoadedState([])).toBeNull();
  });

  test('rejects wrong field count', () => {
    const state = buildValidState() as unknown as Record<string, unknown>;
    delete state.thoughts;
    expect(validateLoadedState(state)).toBeNull();
  });

  test('rejects thoughts: "NaN" (string in numeric slot)', () => {
    const state = buildValidState() as unknown as Record<string, unknown>;
    state.thoughts = 'NaN';
    expect(validateLoadedState(state)).toBeNull();
  });

  test('rejects thoughts: NaN (literal)', () => {
    const state = buildValidState() as unknown as Record<string, unknown>;
    state.thoughts = Number.NaN;
    expect(validateLoadedState(state)).toBeNull();
  });

  test('rejects thoughts: Infinity', () => {
    const state = buildValidState() as unknown as Record<string, unknown>;
    state.thoughts = Number.POSITIVE_INFINITY;
    expect(validateLoadedState(state)).toBeNull();
  });

  test('rejects dischargeCharges: null (audit-flagged)', () => {
    const state = buildValidState() as unknown as Record<string, unknown>;
    state.dischargeCharges = null;
    expect(validateLoadedState(state)).toBeNull();
  });

  test('rejects focusBar: undefined', () => {
    const state = buildValidState() as unknown as Record<string, unknown>;
    state.focusBar = undefined;
    expect(validateLoadedState(state)).toBeNull();
  });

  test('accepts insightEndTime: null (nullable numeric field)', () => {
    const state = buildValidState() as unknown as Record<string, unknown>;
    state.insightEndTime = null;
    expect(validateLoadedState(state)).not.toBeNull();
  });

  test('rejects insightEndTime: "later" (string in nullable numeric slot)', () => {
    const state = buildValidState() as unknown as Record<string, unknown>;
    state.insightEndTime = 'later';
    expect(validateLoadedState(state)).toBeNull();
  });

  test('rejects firstEventsFired: not-an-array', () => {
    const state = buildValidState() as unknown as Record<string, unknown>;
    state.firstEventsFired = 'first_tap';
    expect(validateLoadedState(state)).toBeNull();
  });

  test('accepts firstEventsFired: []', () => {
    const state = buildValidState() as unknown as Record<string, unknown>;
    state.firstEventsFired = [];
    expect(validateLoadedState(state)).not.toBeNull();
  });

  test('rejects sparks: -Infinity', () => {
    const state = buildValidState() as unknown as Record<string, unknown>;
    state.sparks = Number.NEGATIVE_INFINITY;
    expect(validateLoadedState(state)).toBeNull();
  });

  test('rejects prestigeCount: object', () => {
    const state = buildValidState() as unknown as Record<string, unknown>;
    state.prestigeCount = { value: 5 };
    expect(validateLoadedState(state)).toBeNull();
  });
});
