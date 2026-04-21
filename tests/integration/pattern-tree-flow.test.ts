// Sprint 4b close — multi-prestige pattern accumulation integration test.
// Exercises the full Pattern Tree pipeline: prestige grants patterns → cycle
// bonus ramps → decision at node 6 locks in permanent effect → subsequent
// prestiges PRESERVE the decision → reset rolls back cleanly.

import { describe, expect, test } from 'vitest';
import { handlePrestige } from '../../src/engine/prestige';
import { calculateProduction, countCyclePatterns } from '../../src/engine/production';
import { createDefaultState } from '../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';
import type { GameState } from '../../src/types/GameState';

const START = 1_000_000;

function prestige(state: GameState, nthPrestigeTimestamp: number): GameState {
  return handlePrestige(state, nthPrestigeTimestamp).state;
}

describe('Sprint 4b integration — multi-prestige pattern accumulation', () => {
  test('patterns accumulate 3/prestige; totalPatterns monotonically increases', () => {
    let s: GameState = createDefaultState();
    for (let i = 0; i < 5; i++) {
      s = prestige(s, START + i * 60_000);
      expect(s.totalPatterns).toBe((i + 1) * SYNAPSE_CONSTANTS.patternsPerPrestige);
    }
    expect(s.patterns.length).toBe(s.totalPatterns);
  });

  test('decision node flags land at the correct indices', () => {
    let s: GameState = createDefaultState();
    // 3 prestiges → 9 patterns (indices 0..8). Index 6 is a decision node.
    for (let i = 0; i < 3; i++) {
      s = prestige(s, START + i * 60_000);
    }
    const six = s.patterns.find((p) => p.index === 6);
    expect(six?.isDecisionNode).toBe(true);
    const five = s.patterns.find((p) => p.index === 5);
    expect(five?.isDecisionNode).toBe(false);
  });

  test('cycle bonus grows with cycle patterns (post-decision)', () => {
    // Prestige once to earn 3 patterns; all acquired at the new cycleStartTimestamp.
    const s1 = prestige(createDefaultState(), START);
    expect(countCyclePatterns(s1)).toBe(3);
    // Add 10 Básicas so there's some baseline PPS to multiply.
    s1.neurons = [
      { type: 'basica', count: 10 },
      { type: 'sensorial', count: 0 },
      { type: 'piramidal', count: 0 },
      { type: 'espejo', count: 0 },
      { type: 'integradora', count: 0 },
    ];
    const baseline = calculateProduction(s1).base;

    // Same state but with Node 6 A chosen → +0.08 cycle bonus add.
    const s1WithA: GameState = { ...s1, patternDecisions: { 6: 'A' } };
    const withA = calculateProduction(s1WithA).base;
    expect(withA).toBeGreaterThan(baseline);
  });
});

describe('Sprint 4b integration — patternDecisions persistence across prestige', () => {
  test('decisions preserved through 10 prestiges (PAT-3 invariant)', () => {
    let s: GameState = { ...createDefaultState(), patternDecisions: { 6: 'B', 24: 'A' } };
    for (let i = 0; i < 10; i++) {
      s = prestige(s, START + i * 60_000);
    }
    expect(s.patternDecisions).toEqual({ 6: 'B', 24: 'A' });
    // Node 6 B's dischargeMaxCharges bump survives: after each RESET (to base 2)
    // the permanent-decision applier re-bumps to 3.
    expect(s.dischargeMaxCharges).toBe(3);
  });
});

describe('Sprint 4b integration — cycle-scoped decisions take effect immediately', () => {
  test('Node 6 A boosts the CURRENT cycle production (not a next-cycle only effect)', () => {
    let s: GameState = createDefaultState();
    s = prestige(s, START);
    s.neurons = [
      { type: 'basica', count: 10 },
      { type: 'sensorial', count: 0 },
      { type: 'piramidal', count: 0 },
      { type: 'espejo', count: 0 },
      { type: 'integradora', count: 0 },
    ];
    const without = calculateProduction(s).base;
    const withA: GameState = { ...s, patternDecisions: { 6: 'A' } };
    const withAProd = calculateProduction(withA).base;
    // 8 % cycle-bonus lift (base cycleMult 1.12 for 3 cycle patterns → 1.20 with A).
    expect(withAProd / without).toBeCloseTo(1.20 / 1.12, 4);
  });
});
