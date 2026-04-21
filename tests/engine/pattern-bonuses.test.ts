// Sprint 4b Phase 4b.2 — Pattern Tree bonuses wired into production formula.
// Covers GDD §10 `patternFlatBonusPerNode` (additive thoughts/sec per lifetime
// pattern, pre-multiplier) and `patternCycleBonusPerNode` (post-softCap mult,
// capped at `patternCycleCap = 1.5`). Also the `countCyclePatterns` helper.

import { describe, expect, test } from 'vitest';
import {
  calculateProduction,
  countCyclePatterns,
  patternCycleBonus,
} from '../../src/engine/production';
import { createDefaultState } from '../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';
import type { GameState } from '../../src/types/GameState';
import type { PatternNode } from '../../src/types';

function mkPattern(index: number, acquiredAt: number, isDecisionNode = false): PatternNode {
  return { index, isDecisionNode, acquiredAt };
}

describe('countCyclePatterns — acquiredAt ≥ cycleStartTimestamp filter', () => {
  test('zero when no patterns', () => {
    expect(countCyclePatterns({ patterns: [], cycleStartTimestamp: 1000 })).toBe(0);
  });

  test('counts only patterns with acquiredAt ≥ cycleStartTimestamp', () => {
    const patterns: PatternNode[] = [
      mkPattern(0, 500),  // before cycle — lifetime only
      mkPattern(1, 1000), // at cycle start — counts
      mkPattern(2, 1500), // during cycle — counts
    ];
    expect(countCyclePatterns({ patterns, cycleStartTimestamp: 1000 })).toBe(2);
  });

  test('post-prestige patterns (acquiredAt=timestamp) count as this-cycle', () => {
    // Matches handlePrestige's behavior: new patterns get acquiredAt=timestamp
    // which is the new cycleStartTimestamp, so they count as this-cycle.
    const ts = 1_000_000;
    const patterns: PatternNode[] = [mkPattern(0, ts), mkPattern(1, ts), mkPattern(2, ts)];
    expect(countCyclePatterns({ patterns, cycleStartTimestamp: ts })).toBe(3);
  });
});

describe('patternCycleBonus — capped multiplier (GDD §10)', () => {
  test('returns 1 when 0 cycle patterns (identity)', () => {
    expect(patternCycleBonus(0)).toBe(1);
  });

  test('1 + count × 0.04 below cap', () => {
    expect(patternCycleBonus(3)).toBeCloseTo(1.12, 6);
    expect(patternCycleBonus(10)).toBeCloseTo(1.4, 6);
  });

  test('hard-capped at patternCycleCap = 1.5', () => {
    expect(patternCycleBonus(12)).toBeCloseTo(1.48, 6); // near cap
    expect(patternCycleBonus(13)).toBe(SYNAPSE_CONSTANTS.patternCycleCap); // hits cap
    expect(patternCycleBonus(37)).toBe(SYNAPSE_CONSTANTS.patternCycleCap); // §10 boundary
    expect(patternCycleBonus(10_000)).toBe(SYNAPSE_CONSTANTS.patternCycleCap); // adversarial
  });
});

describe('calculateProduction — patternFlatBonusPerNode wiring (GDD §10)', () => {
  function baselineState(overrides: Partial<GameState> = {}): GameState {
    return {
      ...createDefaultState(),
      neurons: [
        { type: 'basica', count: 10 }, // 0.5/sec × 10 = 5 sum
        { type: 'sensorial', count: 0 },
        { type: 'piramidal', count: 0 },
        { type: 'espejo', count: 0 },
        { type: 'integradora', count: 0 },
      ],
      ...overrides,
    };
  }

  test('totalPatterns=0 → no flat bonus (matches pre-4b.2 baseline)', () => {
    const s = baselineState({ totalPatterns: 0, patterns: [] });
    const { base } = calculateProduction(s);
    // 10 Básicas × 0.5 × 1 (connection, all-neurons, softCap all identity) = 5.
    expect(base).toBeCloseTo(5, 6);
  });

  test('totalPatterns=10 adds 10 × patternFlatBonusPerNode (2 thoughts/sec each) to sum', () => {
    const s = baselineState({ totalPatterns: 10, patterns: [] });
    const { base } = calculateProduction(s);
    // sum = 5 + 10 × 2 = 25; mult = 1; no cycle bonus.
    expect(base).toBeCloseTo(25, 6);
  });

  test('flat bonus scales linearly with totalPatterns', () => {
    const base10 = calculateProduction(baselineState({ totalPatterns: 10, patterns: [] })).base;
    const base20 = calculateProduction(baselineState({ totalPatterns: 20, patterns: [] })).base;
    // Linear delta: +10 patterns → +20 sec (before any multiplier).
    expect(base20 - base10).toBeCloseTo(20, 6);
  });
});

describe('calculateProduction — patternCycleBonus wiring (GDD §10)', () => {
  function stateWithCyclePatterns(count: number): GameState {
    const cycleStart = 1000;
    const patterns: PatternNode[] = Array.from({ length: count }, (_, i) =>
      mkPattern(i, cycleStart),
    );
    return {
      ...createDefaultState(),
      neurons: [
        { type: 'basica', count: 10 },
        { type: 'sensorial', count: 0 },
        { type: 'piramidal', count: 0 },
        { type: 'espejo', count: 0 },
        { type: 'integradora', count: 0 },
      ],
      patterns,
      totalPatterns: count,
      cycleStartTimestamp: cycleStart,
    };
  }

  test('0 cycle patterns → no cycle bonus (identity mult)', () => {
    const { base } = calculateProduction(stateWithCyclePatterns(0));
    expect(base).toBeCloseTo(5, 6); // baseline sum, no bonus.
  });

  test('3 cycle patterns → 1.12 × multiplier (after flat bonus adds 6 to sum)', () => {
    const s = stateWithCyclePatterns(3);
    const { base } = calculateProduction(s);
    // sum = 5 (basicas) + 3 × 2 (flat) = 11; cycle mult = 1.12; base = 11 × 1.12 = 12.32
    expect(base).toBeCloseTo(12.32, 6);
  });

  test('cycle bonus capped at 1.5 even with 100 cycle patterns', () => {
    const s = stateWithCyclePatterns(100);
    const { base } = calculateProduction(s);
    // sum = 5 + 100 × 2 = 205; cycle mult clamped to 1.5; base = 205 × 1.5 = 307.5
    expect(base).toBeCloseTo(307.5, 6);
  });

  test('lifetime patterns (pre-cycle) contribute flat but NOT cycle bonus', () => {
    const s: GameState = {
      ...createDefaultState(),
      neurons: [
        { type: 'basica', count: 10 },
        { type: 'sensorial', count: 0 },
        { type: 'piramidal', count: 0 },
        { type: 'espejo', count: 0 },
        { type: 'integradora', count: 0 },
      ],
      patterns: Array.from({ length: 10 }, (_, i) => mkPattern(i, 500)), // all pre-cycle
      totalPatterns: 10,
      cycleStartTimestamp: 1000,
    };
    const { base } = calculateProduction(s);
    // sum = 5 + 10 × 2 = 25; 0 cycle patterns → mult = 1.
    expect(base).toBeCloseTo(25, 6);
  });
});
