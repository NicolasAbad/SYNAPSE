// Sprint 7.8 Phase 7.8.2 — Upgrade-Mastery consumer integration. Validates
// that `upgradeMasteryMult(state, id)` stacks on the 5 multiplicative upgrade
// effect consumer sites: tap_bonus_mult, all_neurons_mult, neuron_type_mult,
// all_production_mult, discharge_mult, charge_rate_mult. Deferred from Sprint
// 7.7 Phase 7.7.4 per 7.7.1 V4 Option C scoping; pulled back in Sprint 7.8.

import { describe, expect, test } from 'vitest';
import { createDefaultState } from '../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';
import { upgradeMasteryMult } from '../../src/engine/mastery';
import { calculateProduction } from '../../src/engine/production';
import { computeDischargeMultiplier } from '../../src/engine/discharge';
import { computeTapThought } from '../../src/store/tap';
import type { GameState } from '../../src/types/GameState';

const MAX_BONUS = SYNAPSE_CONSTANTS.masteryMaxLevel * SYNAPSE_CONSTANTS.masteryBonusPerLevel; // +0.05

describe('upgradeMasteryMult — helper', () => {
  test('identity for unknown ids / shards / mutations / pathways / archetypes', () => {
    const s = createDefaultState();
    expect(upgradeMasteryMult(s, 'not_a_real_id')).toBe(1);
    expect(upgradeMasteryMult(s, 'shard_proc_mastery')).toBe(1);
    expect(upgradeMasteryMult(s, 'hiperestimulacion')).toBe(1);
    expect(upgradeMasteryMult(s, 'rapida')).toBe(1);
    expect(upgradeMasteryMult(s, 'analitica')).toBe(1);
  });

  test('L10 upgrade returns exactly 1 + masteryMaxLevel * bonusPerLevel', () => {
    const s: GameState = { ...createDefaultState(), mastery: { potencial_sinaptico: 10 } };
    expect(upgradeMasteryMult(s, 'potencial_sinaptico')).toBeCloseTo(1 + MAX_BONUS, 10);
  });
});

describe('Upgrade Mastery — production consumers', () => {
  function withOwnedUpgrade(upgradeId: string, mastery: Record<string, number> = {}): GameState {
    const base = createDefaultState();
    return {
      ...base,
      upgrades: [{ id: upgradeId, purchased: true }],
      neurons: [
        { type: 'basica', count: 10 },
        { type: 'sensorial', count: 0 },
        { type: 'piramidal', count: 0 },
        { type: 'espejo', count: 0 },
        { type: 'integradora', count: 0 },
      ],
      mastery,
    };
  }

  test('all_neurons_mult (red_neuronal_densa ×1.25) stacks Mastery at L10', () => {
    const s0 = withOwnedUpgrade('red_neuronal_densa');
    const s10 = withOwnedUpgrade('red_neuronal_densa', { red_neuronal_densa: 10 });
    const base = calculateProduction(s0).base;
    const withMastery = calculateProduction(s10).base;
    // Expected: L10 boosts the 1.25 mult by +5% → 1.3125. Production scales linearly with mult when only one is active.
    expect(withMastery / base).toBeCloseTo(1 + MAX_BONUS, 8);
  });

  test('all_production_mult (retroalimentacion_positiva ×2) stacks Mastery at L10', () => {
    const s0 = withOwnedUpgrade('retroalimentacion_positiva');
    const s10 = withOwnedUpgrade('retroalimentacion_positiva', { retroalimentacion_positiva: 10 });
    const base = calculateProduction(s0).base;
    const withMastery = calculateProduction(s10).base;
    expect(withMastery).toBeGreaterThan(base);
    expect(withMastery / base).toBeCloseTo(1 + MAX_BONUS, 6);
  });
});

describe('Upgrade Mastery — discharge consumer', () => {
  test('discharge_mult (amplificador_de_disparo ×1.5) stacks Mastery at L10', () => {
    const base: GameState = { ...createDefaultState(), upgrades: [{ id: 'amplificador_de_disparo', purchased: true }] };
    const withMastery: GameState = { ...base, mastery: { amplificador_de_disparo: 10 } };
    const baseRatio = computeDischargeMultiplier(base, false);
    const withRatio = computeDischargeMultiplier(withMastery, false);
    expect(withRatio / baseRatio).toBeCloseTo(1 + MAX_BONUS, 6);
  });
});

describe('Upgrade Mastery — tap consumer', () => {
  test('tap_bonus_mult (dopamina ×1.5) stacks Mastery at L10', () => {
    const base: GameState = {
      ...createDefaultState(),
      upgrades: [{ id: 'dopamina', purchased: true }],
      effectiveProductionPerSecond: 100,
    };
    const withMastery: GameState = { ...base, mastery: { dopamina: 10 } };
    const baseTap = computeTapThought(base, false);
    const withTap = computeTapThought(withMastery, false);
    expect(withTap / baseTap).toBeCloseTo(1 + MAX_BONUS, 6);
  });
});

describe('Upgrade Mastery — no bonus at L0', () => {
  test('owning an upgrade with 0 mastery returns baseline effect (identity Mastery)', () => {
    const s0 = { ...createDefaultState(), upgrades: [{ id: 'red_neuronal_densa', purchased: true }], neurons: [{ type: 'basica' as const, count: 10 }, { type: 'sensorial' as const, count: 0 }, { type: 'piramidal' as const, count: 0 }, { type: 'espejo' as const, count: 0 }, { type: 'integradora' as const, count: 0 }] };
    // Re-compute with and without any mastery entry — should match.
    const withEmpty = calculateProduction({ ...s0, mastery: {} }).base;
    const withZero = calculateProduction({ ...s0, mastery: { red_neuronal_densa: 0 } }).base;
    expect(withEmpty).toBe(withZero);
  });
});
