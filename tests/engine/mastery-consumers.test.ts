// Sprint 7.7 Phase 7.7.4 — Mastery consumer multipliers (Option C: Mutation
// + Pathway + Archetype). Validates that masteryBonus stacks multiplicatively
// on the canonical bonus accessors per GDD §38.2 MASTERY-2. Upgrade consumer
// deferred to Sprint 7.8 after TEST-5 balance pass.

import { describe, expect, test } from 'vitest';
import { createDefaultState } from '../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';
import {
  archetypeActiveProductionMult,
  archetypeFocusFillRateMult,
  archetypeMemoryMult,
  archetypeSpontaneousRateMult,
  archetypeOfflineEfficiencyMult,
  archetypeResonanceGainMult,
  archetypeInsightDurationAddSec,
  archetypeMutationBonusOptions,
  archetypeLucidDreamRate,
} from '../../src/engine/archetypes';
import {
  pathwayInsightDurationMult,
  pathwayChargeRateMult,
  pathwayMemoriesPerPrestigeMult,
  pathwayFocusFillRateMult,
} from '../../src/engine/pathways';
import { mutationProdMult, mutationDischargeMult } from '../../src/engine/mutations';
import type { GameState } from '../../src/types/GameState';

const MAX_BONUS = SYNAPSE_CONSTANTS.masteryMaxLevel * SYNAPSE_CONSTANTS.masteryBonusPerLevel; // +0.05

describe('Mastery consumers — Archetype (multiplicative bonuses)', () => {
  test('Analítica active production: ×1.15 baseline, ×1.15 × 1.05 at L10', () => {
    const s0: GameState = { ...createDefaultState(), archetype: 'analitica' };
    expect(archetypeActiveProductionMult(s0)).toBeCloseTo(1.15, 10);
    const s10: GameState = { ...s0, mastery: { analitica: 10 } };
    expect(archetypeActiveProductionMult(s10)).toBeCloseTo(1.15 * (1 + MAX_BONUS), 10);
  });

  test('Focus fill rate mult stacks Mastery', () => {
    const s0: GameState = { ...createDefaultState(), archetype: 'analitica' };
    const s10: GameState = { ...s0, mastery: { analitica: 10 } };
    expect(archetypeFocusFillRateMult(s10)).toBeCloseTo(1.25 * (1 + MAX_BONUS), 10);
  });

  test('Memory mult (Empática ×1.25) stacks Mastery', () => {
    const s10: GameState = { ...createDefaultState(), archetype: 'empatica', mastery: { empatica: 10 } };
    expect(archetypeMemoryMult(s10)).toBeCloseTo(1.25 * (1 + MAX_BONUS), 10);
  });

  test('Spontaneous/Offline/Resonance mults stack Mastery', () => {
    const s10: GameState = { ...createDefaultState(), archetype: 'creativa', mastery: { creativa: 10 } };
    expect(archetypeSpontaneousRateMult(s10)).toBeCloseTo(1.5 * (1 + MAX_BONUS), 10);
    expect(archetypeResonanceGainMult(s10)).toBeCloseTo(1.5 * (1 + MAX_BONUS), 10);
    const sEmp: GameState = { ...createDefaultState(), archetype: 'empatica', mastery: { empatica: 10 } };
    expect(archetypeOfflineEfficiencyMult(sEmp)).toBeCloseTo(2.5 * (1 + MAX_BONUS), 10);
  });

  test('Additive / override bonuses do NOT stack Mastery (documented exclusion)', () => {
    // Analítica +2 seconds insight duration — no Mastery
    const s10: GameState = { ...createDefaultState(), archetype: 'analitica', mastery: { analitica: 10 } };
    expect(archetypeInsightDurationAddSec(s10)).toBe(2);
    // Creativa +1 mutation option — no Mastery
    const sCre: GameState = { ...createDefaultState(), archetype: 'creativa', mastery: { creativa: 10 } };
    expect(archetypeMutationBonusOptions(sCre)).toBe(1);
    // Empática 1.0 lucid dream rate override — no Mastery (probability cap)
    const sEmp: GameState = { ...createDefaultState(), archetype: 'empatica', mastery: { empatica: 10 } };
    expect(archetypeLucidDreamRate(sEmp)).toBe(1);
  });

  test('no archetype → identity regardless of mastery', () => {
    const s: GameState = { ...createDefaultState(), mastery: { rapida: 10 } };
    expect(archetypeActiveProductionMult(s)).toBe(1);
    expect(archetypeMemoryMult(s)).toBe(1);
  });
});

describe('Mastery consumers — Pathway (multiplicative bonuses)', () => {
  test('Rápida Insight duration ×2.0 stacks Mastery (→ ×2.10 at L10)', () => {
    const s0: GameState = { ...createDefaultState(), currentPathway: 'rapida' };
    expect(pathwayInsightDurationMult(s0)).toBeCloseTo(2.0, 10);
    const s10: GameState = { ...s0, mastery: { rapida: 10 } };
    expect(pathwayInsightDurationMult(s10)).toBeCloseTo(2.0 * (1 + MAX_BONUS), 10);
  });

  test('Rápida charge rate ×1.5 stacks Mastery', () => {
    const s10: GameState = { ...createDefaultState(), currentPathway: 'rapida', mastery: { rapida: 10 } };
    expect(pathwayChargeRateMult(s10)).toBeCloseTo(1.5 * (1 + MAX_BONUS), 10);
  });

  test('Profunda memories-per-prestige ×2.0 stacks Mastery', () => {
    const s10: GameState = { ...createDefaultState(), currentPathway: 'profunda', mastery: { profunda: 10 } };
    expect(pathwayMemoriesPerPrestigeMult(s10)).toBeCloseTo(2.0 * (1 + MAX_BONUS), 10);
  });

  test('Profunda focus fill ×0.5 malus softens with Mastery (×0.525 at L10)', () => {
    const s10: GameState = { ...createDefaultState(), currentPathway: 'profunda', mastery: { profunda: 10 } };
    expect(pathwayFocusFillRateMult(s10)).toBeCloseTo(0.5 * (1 + MAX_BONUS), 10);
  });

  test('no pathway → identity regardless of mastery', () => {
    const s: GameState = { ...createDefaultState(), mastery: { rapida: 10 } };
    expect(pathwayInsightDurationMult(s)).toBe(1);
  });
});

describe('Mastery consumers — Mutation (production + discharge only)', () => {
  test('Hiperestimulación ×2.0 stacks Mastery → ×2.10 at L10 (canonical GDD §38.2 example)', () => {
    const s10: GameState = {
      ...createDefaultState(),
      currentMutation: { id: 'hiperestimulacion' },
      mastery: { hiperestimulacion: 10 },
    };
    expect(mutationProdMult(s10)).toBeCloseTo(2.0 * (1 + MAX_BONUS), 10);
  });

  test('Eficiencia Neural production ×0.75 stacks Mastery (→ ×0.7875 at L10)', () => {
    const s10: GameState = {
      ...createDefaultState(),
      currentMutation: { id: 'eficiencia_neural' },
      mastery: { eficiencia_neural: 10 },
    };
    expect(mutationProdMult(s10)).toBeCloseTo(0.75 * (1 + MAX_BONUS), 10);
  });

  test('Discharge multipliers stack Mastery (Descarga Rápida, Disparo Concentrado)', () => {
    const s1: GameState = {
      ...createDefaultState(),
      currentMutation: { id: 'descarga_rapida' },
      mastery: { descarga_rapida: 10 },
    };
    const base1 = mutationDischargeMult({ ...s1, mastery: {} });
    expect(mutationDischargeMult(s1)).toBeCloseTo(base1 * (1 + MAX_BONUS), 10);

    const s2: GameState = {
      ...createDefaultState(),
      currentMutation: { id: 'disparo_concentrado' },
      mastery: { disparo_concentrado: 10 },
    };
    const base2 = mutationDischargeMult({ ...s2, mastery: {} });
    expect(mutationDischargeMult(s2)).toBeCloseTo(base2 * (1 + MAX_BONUS), 10);
  });

  test('no mutation → identity regardless of mastery', () => {
    const s: GameState = { ...createDefaultState(), mastery: { hiperestimulacion: 10 } };
    expect(mutationProdMult(s)).toBe(1);
    expect(mutationDischargeMult(s)).toBe(1);
  });

  test('L0 uses → baseline (no mastery bonus)', () => {
    const s: GameState = { ...createDefaultState(), currentMutation: { id: 'hiperestimulacion' } };
    expect(mutationProdMult(s)).toBeCloseTo(2.0, 10);
  });
});
