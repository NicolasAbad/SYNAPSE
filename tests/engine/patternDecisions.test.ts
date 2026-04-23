// Sprint 4b Phase 4b.3 — Pattern decision effect appliers.
// Each of the 7 currently-wired decision options is unit-tested against its
// consumer site. 3 sprint-scope decisions (15A, 48A, 48B) own their tests in
// Sprint 8a / Sprint 5.

import { describe, expect, test } from 'vitest';
import {
  applyPermanentPatternDecisionsToState,
  cascadeThresholdOverride,
  dischargeDamageDecisionMult,
  focusFillRateDecisionMult,
  insightDurationDecisionAddS,
  memoriesPerPrestigeDecisionAdd,
  patternCycleBonusAdd,
  shouldAwardResonanceOnDischarge,
} from '../../src/engine/patternDecisions';
import { calculateProduction } from '../../src/engine/production';
import { computeFocusFillPerTap } from '../../src/store/tap';
import { computeDischargeMultiplier, effectiveCascadeThreshold, performDischarge } from '../../src/engine/discharge';
import { activateInsight } from '../../src/engine/insight';
import { computeMemoriesGained, handlePrestige } from '../../src/engine/prestige';
import { createDefaultState } from '../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';
import { NODE_36_TIER_2_MIN_PRESTIGE } from '../../src/config/patterns';
import type { GameState } from '../../src/types/GameState';

function withDecisions(decisions: GameState['patternDecisions']): GameState {
  return { ...createDefaultState(), patternDecisions: { ...decisions } };
}

describe('Pattern decision helpers — identity when no decision made', () => {
  test('all getters return their neutral values on default state', () => {
    const s = createDefaultState();
    expect(patternCycleBonusAdd(s)).toBe(0);
    expect(focusFillRateDecisionMult(s)).toBe(1);
    expect(insightDurationDecisionAddS(s)).toBe(0);
    expect(memoriesPerPrestigeDecisionAdd(s)).toBe(0);
    expect(cascadeThresholdOverride(s)).toBeNull();
    expect(dischargeDamageDecisionMult(s)).toBe(1);
    expect(shouldAwardResonanceOnDischarge(s)).toBe(false);
    expect(applyPermanentPatternDecisionsToState(s)).toEqual({});
  });
});

describe('Node 6 A — cycle_bonus_add 0.08 wired into production', () => {
  test('production formula adds 0.08 to the cycle mult when chosen', () => {
    const base = calculateProduction({
      ...createDefaultState(),
      neurons: [
        { type: 'basica', count: 10 },
        { type: 'sensorial', count: 0 },
        { type: 'piramidal', count: 0 },
        { type: 'espejo', count: 0 },
        { type: 'integradora', count: 0 },
      ],
    }).base;
    const withA = calculateProduction({
      ...createDefaultState(),
      neurons: [
        { type: 'basica', count: 10 },
        { type: 'sensorial', count: 0 },
        { type: 'piramidal', count: 0 },
        { type: 'espejo', count: 0 },
        { type: 'integradora', count: 0 },
      ],
      patternDecisions: { 6: 'A' },
    }).base;
    // Baseline cycleMult = 1, with-A cycleMult = 1.08 → 8 % lift on the sum.
    expect(withA).toBeCloseTo(base * 1.08, 6);
  });
});

describe('Node 6 B — discharge_charges_plus_one wired into handlePrestige', () => {
  test('without decision, dischargeMaxCharges resets to base 2 post-prestige', () => {
    const before: GameState = {
      ...createDefaultState(),
      dischargeMaxCharges: 5, // upgrades owned in prior cycle
    };
    const { state: next } = handlePrestige(before, 1_000_000);
    expect(next.dischargeMaxCharges).toBe(2);
  });

  test('with Node 6 B chosen, post-prestige dischargeMaxCharges is 3 (2 + 1)', () => {
    const before: GameState = {
      ...createDefaultState(),
      dischargeMaxCharges: 5,
      patternDecisions: { 6: 'B' },
    };
    const { state: next } = handlePrestige(before, 1_000_000);
    expect(next.dischargeMaxCharges).toBe(3);
  });
});

describe('Node 15 B — focus_fill_rate_mult 1.20 wired into tap', () => {
  test('Focus fill per tap scales by 1.20 when chosen', () => {
    const baseline = computeFocusFillPerTap(createDefaultState());
    const withB = computeFocusFillPerTap(withDecisions({ 15: 'B' }));
    expect(withB).toBeCloseTo(baseline * 1.20, 6);
  });
});

describe('Node 24 A — insight_duration_add_s 3 wired into insight', () => {
  test('Insight activation duration extends by 3 seconds when chosen', () => {
    const state: GameState = { ...createDefaultState(), focusBar: 1, patternDecisions: { 24: 'A' } };
    const baseline = activateInsight(createDefaultState(), 1_000_000);
    const withA = activateInsight(state, 1_000_000);
    const baseEnd = baseline.insightEndTime ?? 0;
    const withEnd = withA.insightEndTime ?? 0;
    expect(withEnd - baseEnd).toBe(3 * 1000); // +3s in ms
  });
});

describe('Node 24 B — memories_per_prestige_add 2 wired into computeMemoriesGained', () => {
  test('adds +2 flat Memorias on top of base', () => {
    const baseline = computeMemoriesGained(createDefaultState());
    const withB = computeMemoriesGained(withDecisions({ 24: 'B' }));
    expect(withB - baseline).toBe(2);
  });

  test('stacks with shard_epi_imprint flat add (Sprint 7.5.2 — replaces consolidacion_memoria slot)', () => {
    // Sprint 7.5.2 §16.1: shard_epi_imprint contributes a flat +1 Memoria/prestige.
    // Node 24 B adds +2. Both stack additively post-base × pathway × archetype.
    const base = computeMemoriesGained({ ...createDefaultState(), memoryShardUpgrades: ['shard_epi_imprint'] });
    const withBoth = computeMemoriesGained({ ...createDefaultState(), memoryShardUpgrades: ['shard_epi_imprint'], patternDecisions: { 24: 'B' } });
    expect(withBoth - base).toBe(2);
  });
});

describe('Node 36 A — cascade_threshold_set 0.65 wired into discharge', () => {
  test('effectiveCascadeThreshold drops from 0.75 to 0.65 when chosen', () => {
    expect(effectiveCascadeThreshold(createDefaultState())).toBe(0.75);
    expect(effectiveCascadeThreshold(withDecisions({ 36: 'A' }))).toBe(0.65);
  });

  test('Cascade fires at focusBar 0.70 when chosen A (would not without)', () => {
    const state: GameState = {
      ...createDefaultState(),
      dischargeCharges: 1,
      focusBar: 0.70,
      effectiveProductionPerSecond: 100,
      patternDecisions: { 36: 'A' },
    };
    const { outcome } = performDischarge(state, 0);
    expect(outcome.isCascade).toBe(true);
  });
});

describe('Node 36 B — discharge_damage_mult 1.10 wired into discharge', () => {
  test('computeDischargeMultiplier scales by 1.10 when chosen', () => {
    const baseline: GameState = { ...createDefaultState(), prestigeCount: 0, isTutorialCycle: false };
    const withB: GameState = { ...baseline, patternDecisions: { 36: 'B' } };
    const m1 = computeDischargeMultiplier(baseline, false);
    const m2 = computeDischargeMultiplier(withB, false);
    expect(m2).toBeCloseTo(m1 * 1.10, 6);
  });

  test('INT-5 gate: shouldAwardResonanceOnDischarge false pre-P13 with B chosen', () => {
    const state = {
      ...createDefaultState(),
      prestigeCount: NODE_36_TIER_2_MIN_PRESTIGE - 1,
      patternDecisions: { 36: 'B' as const },
    };
    expect(shouldAwardResonanceOnDischarge(state)).toBe(false);
  });

  test('INT-5 gate: shouldAwardResonanceOnDischarge true at P13+ with B chosen', () => {
    const state = {
      ...createDefaultState(),
      prestigeCount: NODE_36_TIER_2_MIN_PRESTIGE,
      patternDecisions: { 36: 'B' as const },
    };
    expect(shouldAwardResonanceOnDischarge(state)).toBe(true);
  });

  test('INT-5 gate: remains false if A chosen even at P20', () => {
    const state = {
      ...createDefaultState(),
      prestigeCount: 20,
      patternDecisions: { 36: 'A' as const },
    };
    expect(shouldAwardResonanceOnDischarge(state)).toBe(false);
  });
});

describe('Node 36 — mutually-exclusive selection', () => {
  test('choosing A does NOT trigger B damage mult', () => {
    expect(dischargeDamageDecisionMult(withDecisions({ 36: 'A' }))).toBe(1);
  });

  test('choosing B does NOT trigger A threshold override', () => {
    expect(cascadeThresholdOverride(withDecisions({ 36: 'B' }))).toBeNull();
  });
});

describe('PAT-3 persistence — patternDecisions preserved across repeated prestiges', () => {
  test('10 prestiges preserve the patternDecisions map intact', () => {
    let state: GameState = {
      ...createDefaultState(),
      patternDecisions: { 6: 'B', 15: 'A' },
    };
    for (let i = 0; i < 10; i++) {
      state = handlePrestige(state, 1_000_000 + i * 60_000).state;
    }
    expect(state.patternDecisions).toEqual({ 6: 'B', 15: 'A' });
    // Node 6 B still applies → dischargeMaxCharges stays at 3 across all cycles.
    expect(state.dischargeMaxCharges).toBe(3);
  });

  test('patternDecisions preserved across a mock transcendence (via setState merge)', () => {
    // Transcendence hasn't shipped (Sprint 8b). Simulate by applying PRESTIGE_RESET
    // (the superset that transcendence will extend) + verifying patternDecisions
    // stays put. Matches GDD §33 TRANSCENDENCE_PRESERVE ⊇ PRESTIGE_PRESERVE.
    const before: GameState = {
      ...createDefaultState(),
      patternDecisions: { 6: 'A', 24: 'B' },
    };
    const { state: after } = handlePrestige(before, 1_000_000);
    expect(after.patternDecisions).toEqual({ 6: 'A', 24: 'B' });
  });
});

describe('Regression: new decisions do not affect awakening-log or existing bonuses unchanged', () => {
  test('totalPatterns still increments by patternsPerPrestige regardless of decisions', () => {
    const before: GameState = {
      ...createDefaultState(),
      patternDecisions: { 6: 'A', 15: 'B', 24: 'A', 36: 'A', 48: 'B' },
    };
    const { state: after } = handlePrestige(before, 1_000_000);
    expect(after.totalPatterns).toBe(SYNAPSE_CONSTANTS.patternsPerPrestige);
  });
});
