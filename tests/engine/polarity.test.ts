// Sprint 4c Phase 4c.2 — Polarity modifier wiring (GDD §11).
// Covers production, discharge, and Cascade threshold integrations including
// the Nico-approved Option A `inhibitoryCascadeThresholdMult` interaction
// with Node 36 A's cascade_threshold_set.

import { describe, expect, test } from 'vitest';
import {
  calculateProduction,
  polarityProdMult,
} from '../../src/engine/production';
import {
  computeDischargeMultiplier,
  effectiveCascadeThreshold,
  performDischarge,
  polarityCascadeThresholdMult,
  polarityDischargeMult,
} from '../../src/engine/discharge';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';
import { createDefaultState } from '../../src/store/gameStore';
import type { GameState } from '../../src/types/GameState';

function baseProdState(): GameState {
  return {
    ...createDefaultState(),
    neurons: [
      { type: 'basica', count: 10 },
      { type: 'sensorial', count: 0 },
      { type: 'piramidal', count: 0 },
      { type: 'espejo', count: 0 },
      { type: 'integradora', count: 0 },
    ],
  };
}

describe('polarityProdMult — identity on null, mult on polarity (GDD §11)', () => {
  test('null polarity → 1 (no modifier)', () => {
    expect(polarityProdMult(null)).toBe(1);
  });
  test('excitatory → excitatoryProdMult (1.10)', () => {
    expect(polarityProdMult('excitatory')).toBe(SYNAPSE_CONSTANTS.excitatoryProdMult);
  });
  test('inhibitory → inhibitoryProdMult (0.94)', () => {
    expect(polarityProdMult('inhibitory')).toBe(SYNAPSE_CONSTANTS.inhibitoryProdMult);
  });
});

describe('calculateProduction — Polarity mult applied to rawMult (pre-softCap)', () => {
  test('excitatory boosts production by 10 % vs null', () => {
    const base = calculateProduction({ ...baseProdState(), currentPolarity: null }).base;
    const excit = calculateProduction({ ...baseProdState(), currentPolarity: 'excitatory' }).base;
    expect(excit / base).toBeCloseTo(SYNAPSE_CONSTANTS.excitatoryProdMult, 6);
  });

  test('inhibitory reduces production by 6 % vs null', () => {
    const base = calculateProduction({ ...baseProdState(), currentPolarity: null }).base;
    const inhib = calculateProduction({ ...baseProdState(), currentPolarity: 'inhibitory' }).base;
    expect(inhib / base).toBeCloseTo(SYNAPSE_CONSTANTS.inhibitoryProdMult, 6);
  });

  test('Polarity applied multiplicatively with connectionMult + globalMult in rawMult chain', () => {
    // Sanity: changing polarity changes base by exactly the expected ratio.
    const excit = calculateProduction({ ...baseProdState(), currentPolarity: 'excitatory' }).base;
    const inhib = calculateProduction({ ...baseProdState(), currentPolarity: 'inhibitory' }).base;
    expect(excit / inhib).toBeCloseTo(
      SYNAPSE_CONSTANTS.excitatoryProdMult / SYNAPSE_CONSTANTS.inhibitoryProdMult,
      6,
    );
  });
});

describe('polarityDischargeMult — identity on null, mult on polarity', () => {
  test('null polarity → 1 (no modifier)', () => {
    expect(polarityDischargeMult(null)).toBe(1);
  });
  test('excitatory → excitatoryDischargeMult (0.85)', () => {
    expect(polarityDischargeMult('excitatory')).toBe(SYNAPSE_CONSTANTS.excitatoryDischargeMult);
  });
  test('inhibitory → inhibitoryDischargeMult (1.30)', () => {
    expect(polarityDischargeMult('inhibitory')).toBe(SYNAPSE_CONSTANTS.inhibitoryDischargeMult);
  });
});

describe('computeDischargeMultiplier — Polarity Discharge mult applied', () => {
  function dischargeReadyState(polarity: GameState['currentPolarity']): GameState {
    return { ...createDefaultState(), prestigeCount: 5, isTutorialCycle: false, currentPolarity: polarity };
  }

  test('excitatory reduces Discharge multiplier by 15 % vs null', () => {
    const base = computeDischargeMultiplier(dischargeReadyState(null), false);
    const excit = computeDischargeMultiplier(dischargeReadyState('excitatory'), false);
    expect(excit / base).toBeCloseTo(SYNAPSE_CONSTANTS.excitatoryDischargeMult, 6);
  });

  test('inhibitory boosts Discharge multiplier by 30 % vs null', () => {
    const base = computeDischargeMultiplier(dischargeReadyState(null), false);
    const inhib = computeDischargeMultiplier(dischargeReadyState('inhibitory'), false);
    expect(inhib / base).toBeCloseTo(SYNAPSE_CONSTANTS.inhibitoryDischargeMult, 6);
  });
});

describe('polarityCascadeThresholdMult — identity unless inhibitory', () => {
  test('null → 1', () => {
    expect(polarityCascadeThresholdMult(null)).toBe(1);
  });
  test('excitatory → 1 (no effect)', () => {
    expect(polarityCascadeThresholdMult('excitatory')).toBe(1);
  });
  test('inhibitory → inhibitoryCascadeThresholdMult (0.90)', () => {
    expect(polarityCascadeThresholdMult('inhibitory')).toBe(SYNAPSE_CONSTANTS.inhibitoryCascadeThresholdMult);
  });
});

describe('effectiveCascadeThreshold — Polarity × Node 36 A stack (Option A)', () => {
  test('no polarity + no Node 36 A → base 0.75', () => {
    expect(effectiveCascadeThreshold(createDefaultState())).toBe(SYNAPSE_CONSTANTS.cascadeThreshold);
  });

  test('inhibitory alone → 0.75 × 0.90 = 0.675', () => {
    const s: GameState = { ...createDefaultState(), currentPolarity: 'inhibitory' };
    expect(effectiveCascadeThreshold(s)).toBeCloseTo(0.675, 6);
  });

  test('Node 36 A alone → 0.65 (absolute set)', () => {
    const s: GameState = { ...createDefaultState(), patternDecisions: { 36: 'A' } };
    expect(effectiveCascadeThreshold(s)).toBe(0.65);
  });

  test('both inhibitory + Node 36 A → min(0.675, 0.65) = 0.65 (Node 36 A wins, easier-to-Cascade)', () => {
    const s: GameState = {
      ...createDefaultState(),
      currentPolarity: 'inhibitory',
      patternDecisions: { 36: 'A' },
    };
    expect(effectiveCascadeThreshold(s)).toBe(0.65);
  });

  test('excitatory has no threshold effect (only prod + discharge mods)', () => {
    const s: GameState = { ...createDefaultState(), currentPolarity: 'excitatory' };
    expect(effectiveCascadeThreshold(s)).toBe(SYNAPSE_CONSTANTS.cascadeThreshold);
  });
});

describe('performDischarge — Inhibitory lowers the Cascade threshold in practice', () => {
  test('focusBar 0.70 Cascades when Inhibitory is active (threshold 0.675)', () => {
    const s: GameState = {
      ...createDefaultState(),
      dischargeCharges: 1,
      focusBar: 0.70,
      effectiveProductionPerSecond: 100,
      currentPolarity: 'inhibitory',
    };
    const { outcome } = performDischarge(s, 0);
    expect(outcome.isCascade).toBe(true);
  });

  test('focusBar 0.70 does NOT Cascade without Inhibitory (threshold 0.75)', () => {
    const s: GameState = {
      ...createDefaultState(),
      dischargeCharges: 1,
      focusBar: 0.70,
      effectiveProductionPerSecond: 100,
      currentPolarity: null,
    };
    const { outcome } = performDischarge(s, 0);
    expect(outcome.isCascade).toBe(false);
  });
});
