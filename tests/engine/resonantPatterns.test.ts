// Sprint 6 Phase 6.6 — Resonant Patterns (GDD §22 RP-1..RP-4).

import { describe, expect, test } from 'vitest';
import { createDefaultState, useGameStore } from '../../src/store/gameStore';
import {
  checkRP1,
  checkRP2,
  checkRP3,
  checkRP4,
  checkAllResonantPatterns,
  allResonantPatternsDiscovered,
  RP_DISCOVERY_SPARKS,
} from '../../src/engine/resonantPatterns';
import type { GameState } from '../../src/types/GameState';

function freshState(overrides: Partial<GameState> = {}): GameState {
  const raw = createDefaultState() as unknown as Record<string, unknown>;
  for (const k of ['activeTab', 'activeMindSubtab', 'undoToast', 'antiSpamActive']) delete raw[k];
  return { ...(raw as unknown as GameState), ...overrides };
}

describe('RP-1 The Lost Connection — all 5 types within 2 min', () => {
  test('false when no neurons purchased', () => {
    const s = freshState({ cycleStartTimestamp: 0, cycleNeuronPurchases: [] });
    expect(checkRP1(s)).toBe(false);
  });

  test('true when 5 different types purchased within 120s', () => {
    const s = freshState({
      cycleStartTimestamp: 0,
      cycleNeuronPurchases: [
        { type: 'basica', timestamp: 10_000 },
        { type: 'sensorial', timestamp: 20_000 },
        { type: 'piramidal', timestamp: 40_000 },
        { type: 'espejo', timestamp: 60_000 },
        { type: 'integradora', timestamp: 100_000 },
      ],
    });
    expect(checkRP1(s)).toBe(true);
  });

  test('false when 5th type purchased AFTER 120s window', () => {
    const s = freshState({
      cycleStartTimestamp: 0,
      cycleNeuronPurchases: [
        { type: 'basica', timestamp: 10_000 },
        { type: 'sensorial', timestamp: 20_000 },
        { type: 'piramidal', timestamp: 40_000 },
        { type: 'espejo', timestamp: 60_000 },
        { type: 'integradora', timestamp: 150_000 }, // past 120s window
      ],
    });
    expect(checkRP1(s)).toBe(false);
  });
});

describe('RP-2 The Silent Mind — no Discharge used this cycle', () => {
  test('true when cycleDischargesUsed === 0', () => {
    expect(checkRP2({ cycleDischargesUsed: 0 })).toBe(true);
  });
  test('false once any Discharge fired', () => {
    expect(checkRP2({ cycleDischargesUsed: 1 })).toBe(false);
  });
});

describe('RP-3 The Broken Mirror — P10+ with ≥3 Option B decisions', () => {
  test('false pre-P10 even with 3 B decisions', () => {
    expect(checkRP3({ prestigeCount: 9, patternDecisions: { 6: 'B', 15: 'B', 24: 'B' } })).toBe(false);
  });
  test('true at P10 with 3 B decisions', () => {
    expect(checkRP3({ prestigeCount: 10, patternDecisions: { 6: 'B', 15: 'B', 24: 'B' } })).toBe(true);
  });
  test('false with 2 B decisions', () => {
    expect(checkRP3({ prestigeCount: 12, patternDecisions: { 6: 'B', 15: 'B', 24: 'A' } })).toBe(false);
  });
});

describe('RP-4 The Cascade Chorus — 5 Cascades without Cascada Profunda', () => {
  test('true at 5 Cascades with no upgrade', () => {
    expect(checkRP4({ cycleCascades: 5, upgrades: [] })).toBe(true);
  });
  test('false with Cascada Profunda owned', () => {
    expect(checkRP4({
      cycleCascades: 5,
      upgrades: [{ id: 'cascada_profunda', purchased: true, purchasedAt: 0 }],
    })).toBe(false);
  });
  test('false with only 4 Cascades', () => {
    expect(checkRP4({ cycleCascades: 4, upgrades: [] })).toBe(false);
  });
});

describe('checkAllResonantPatterns', () => {
  test('new discoveries flip flags false→true and grant +5 Sparks each', () => {
    const s = freshState({
      prestigeCount: 11,
      patternDecisions: { 6: 'B', 15: 'B', 24: 'B' }, // RP-3
      cycleDischargesUsed: 0, // RP-2
      cycleCascades: 0,
      sparks: 100,
      cycleStartTimestamp: 0,
      cycleNeuronPurchases: [],
    });
    const result = checkAllResonantPatterns(s);
    // RP-2 + RP-3 fire = 2 discoveries × 5 Sparks = +10.
    expect(result.newlyDiscovered).toEqual([1, 2]);
    expect(result.sparks).toBe(100 + 2 * RP_DISCOVERY_SPARKS);
    expect(result.resonantPatternsDiscovered).toEqual([false, true, true, false]);
  });

  test('already-discovered RPs do NOT re-grant Sparks', () => {
    const s = freshState({
      resonantPatternsDiscovered: [false, true, false, false], // RP-2 already known
      cycleDischargesUsed: 0, // RP-2 still satisfied
      sparks: 50,
    });
    const result = checkAllResonantPatterns(s);
    expect(result.newlyDiscovered).toEqual([]);
    expect(result.sparks).toBe(50);
  });

  test('allResonantPatternsDiscovered is false until all 4 flip', () => {
    expect(allResonantPatternsDiscovered({ resonantPatternsDiscovered: [true, true, true, false] })).toBe(false);
    expect(allResonantPatternsDiscovered({ resonantPatternsDiscovered: [true, true, true, true] })).toBe(true);
  });
});

describe('chooseEnding action', () => {
  test('appends id to endingsSeen and is idempotent', () => {
    useGameStore.getState().reset();
    useGameStore.getState().chooseEnding('equation', 'a');
    expect(useGameStore.getState().endingsSeen).toEqual(['equation']);
    useGameStore.getState().chooseEnding('equation', 'b'); // duplicate → no-op
    expect(useGameStore.getState().endingsSeen).toEqual(['equation']);
    useGameStore.getState().chooseEnding('chorus', 'a');
    expect(useGameStore.getState().endingsSeen).toEqual(['equation', 'chorus']);
  });
});
