// Sprint 8b Phase 8b.4 — Resonance upgrade engine tests (GDD §15).

import { describe, expect, test } from 'vitest';
import {
  canBuyResonanceUpgrade,
  tryBuyResonanceUpgrade,
  resonanceAllProductionMult,
  resonancePatternCycleCap,
  resonanceCascadeMult,
  resonanceFocusFillMult,
  resonancePatternsPerPrestigeMult,
  resonanceEarnMult,
  resonanceOfflineCapBonusHours,
} from '../../src/engine/resonanceUpgrades';
import { RESONANCE_UPGRADES, RESONANCE_UPGRADES_BY_ID } from '../../src/config/resonanceUpgrades';
import { createDefaultState } from '../../src/store/gameStore';
import { resonanceGainOnPrestige } from '../../src/engine/resonance';
import { computeOfflineCapHours } from '../../src/engine/offline';
import { calculateProduction } from '../../src/engine/production';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';
import type { GameState } from '../../src/types/GameState';

function s(overrides: Partial<GameState> = {}): GameState {
  return { ...createDefaultState(), ...overrides };
}

describe('RESONANCE_UPGRADES catalog', () => {
  test('exactly 13 upgrades (5 T1 + 5 T2 + 3 T3)', () => {
    expect(RESONANCE_UPGRADES.length).toBe(13);
    expect(RESONANCE_UPGRADES.filter((u) => u.tier === 1).length).toBe(5);
    expect(RESONANCE_UPGRADES.filter((u) => u.tier === 2).length).toBe(5);
    expect(RESONANCE_UPGRADES.filter((u) => u.tier === 3).length).toBe(3);
  });

  test('all ids unique', () => {
    const ids = new Set(RESONANCE_UPGRADES.map((u) => u.id));
    expect(ids.size).toBe(13);
  });

  test('GDD §15 costs match: cascada_eterna 80 / mente_despierta 150 / eternal_witness 600', () => {
    expect(RESONANCE_UPGRADES_BY_ID['cascada_eterna'].costResonance).toBe(80);
    expect(RESONANCE_UPGRADES_BY_ID['mente_despierta'].costResonance).toBe(150);
    expect(RESONANCE_UPGRADES_BY_ID['eternal_witness'].costResonance).toBe(600);
  });
});

describe('canBuyResonanceUpgrade — gate logic', () => {
  test('unknown id → unknown_id', () => {
    expect(canBuyResonanceUpgrade(s(), 'nonexistent').reason).toBe('unknown_id');
  });

  test('already owned → already_owned', () => {
    expect(canBuyResonanceUpgrade(s({ resonanceUpgrades: ['eco_neural'] }), 'eco_neural').reason).toBe('already_owned');
  });

  test('Tier 1 below P13 → tier_locked', () => {
    expect(canBuyResonanceUpgrade(s({ prestigeCount: 12, resonance: 100 }), 'eco_neural').reason).toBe('tier_locked');
  });

  test('Tier 2 below P18 → tier_locked', () => {
    expect(canBuyResonanceUpgrade(s({ prestigeCount: 17, resonance: 500 }), 'mente_despierta').reason).toBe('tier_locked');
  });

  test('Tier 3 below P23 → tier_locked', () => {
    expect(canBuyResonanceUpgrade(s({ prestigeCount: 22, resonance: 1000 }), 'resonancia_profunda').reason).toBe('tier_locked');
  });

  test('Tier 2 without any Tier 1 → prereq_missing', () => {
    expect(canBuyResonanceUpgrade(s({ prestigeCount: 18, resonance: 500 }), 'mente_despierta').reason).toBe('prereq_missing');
  });

  test('Tier 3 without 2× Tier 2 → prereq_missing', () => {
    const state = s({ prestigeCount: 23, resonance: 1000, resonanceUpgrades: ['eco_neural', 'mente_despierta'] });
    expect(canBuyResonanceUpgrade(state, 'resonancia_profunda').reason).toBe('prereq_missing');
  });

  test('insufficient resonance → insufficient_resonance', () => {
    expect(canBuyResonanceUpgrade(s({ prestigeCount: 13, resonance: 10 }), 'eco_neural').reason).toBe('insufficient_resonance');
  });

  test('valid path: P13 + 50 R + Tier 1 purchase allowed', () => {
    expect(canBuyResonanceUpgrade(s({ prestigeCount: 13, resonance: 50 }), 'eco_neural').ok).toBe(true);
  });

  test('Tier 2 with 1× Tier 1 + sufficient R → ok', () => {
    const state = s({ prestigeCount: 18, resonance: 150, resonanceUpgrades: ['eco_neural'] });
    expect(canBuyResonanceUpgrade(state, 'mente_despierta').ok).toBe(true);
  });
});

describe('tryBuyResonanceUpgrade — purchase state mutation', () => {
  test('successful buy: resonance debited, id appended', () => {
    const before = s({ prestigeCount: 13, resonance: 100 });
    const { bought, state } = tryBuyResonanceUpgrade(before, 'eco_neural');
    expect(bought).toBe(true);
    expect(state.resonance).toBe(50);
    expect(state.resonanceUpgrades).toContain('eco_neural');
  });

  test('failed buy: state unchanged', () => {
    const before = s({ prestigeCount: 12, resonance: 100 });
    const { bought, state } = tryBuyResonanceUpgrade(before, 'eco_neural');
    expect(bought).toBe(false);
    expect(state).toBe(before);
  });
});

describe('Accessor helpers', () => {
  test('resonanceAllProductionMult: identity when not owned', () => {
    expect(resonanceAllProductionMult(s())).toBe(1);
  });

  test('resonanceAllProductionMult: +5% per owned Resonance upgrade when eco_neural owned', () => {
    const state = s({ resonanceUpgrades: ['eco_neural', 'patron_estable', 'cascada_eterna'] });
    expect(resonanceAllProductionMult(state)).toBeCloseTo(1 + 0.05 * 3, 6);
  });

  test('resonancePatternCycleCap: returns 1.8 when patron_estable owned, null otherwise', () => {
    expect(resonancePatternCycleCap(s())).toBeNull();
    expect(resonancePatternCycleCap(s({ resonanceUpgrades: ['patron_estable'] }))).toBe(1.8);
  });

  test('resonanceCascadeMult: 3.0 when cascada_eterna owned', () => {
    expect(resonanceCascadeMult(s())).toBeNull();
    expect(resonanceCascadeMult(s({ resonanceUpgrades: ['cascada_eterna'] }))).toBe(3.0);
  });

  test('resonanceFocusFillMult: 1.25 when mente_despierta owned', () => {
    expect(resonanceFocusFillMult(s())).toBe(1);
    expect(resonanceFocusFillMult(s({ resonanceUpgrades: ['mente_despierta'] }))).toBe(1.25);
  });

  test('resonancePatternsPerPrestigeMult: 1.5 when meta_consciousness owned', () => {
    expect(resonancePatternsPerPrestigeMult(s())).toBe(1);
    expect(resonancePatternsPerPrestigeMult(s({ resonanceUpgrades: ['meta_consciousness'] }))).toBe(1.5);
  });

  test('resonanceEarnMult: 1.5 when resonancia_profunda owned', () => {
    expect(resonanceEarnMult(s())).toBe(1);
    expect(resonanceEarnMult(s({ resonanceUpgrades: ['resonancia_profunda'] }))).toBe(1.5);
  });

  test('resonanceOfflineCapBonusHours: 4 when time_dilation owned', () => {
    expect(resonanceOfflineCapBonusHours(s())).toBe(0);
    expect(resonanceOfflineCapBonusHours(s({ resonanceUpgrades: ['time_dilation'] }))).toBe(4);
  });
});

describe('Consumer integrations', () => {
  test('resonanceGainOnPrestige applies resonancia_profunda ×1.5', () => {
    const baseState = s({
      prestigeCount: 23, archetype: 'analitica', cycleCascades: 2, insightTimestamps: [1, 2],
    });
    const without = resonanceGainOnPrestige(baseState, 20 * 60 * 1000);
    const withMult = resonanceGainOnPrestige({ ...baseState, resonanceUpgrades: ['resonancia_profunda'] }, 20 * 60 * 1000);
    expect(withMult).toBe(Math.round(without * 1.5));
  });

  test('computeOfflineCapHours adds time_dilation bonus hours', () => {
    // Base 4h + time_dilation 4h = 8h (same as sueno_rem 8h — use a config that clamps cleanly).
    const state = s({ resonanceUpgrades: ['time_dilation'] });
    expect(computeOfflineCapHours(state)).toBe(4 + 4);
  });

  test('computeOfflineCapHours clamps at maxOfflineHours even with time_dilation', () => {
    // sueno_rem (8h) + sueno_profundo (16h) — wait, sueno_profundo is Run 2+ upgrade.
    // Use just sueno_rem (8h) + consciencia_distribuida (12h) max-of → 12h. + time_dilation 4h = 16h.
    const state = s({
      resonanceUpgrades: ['time_dilation'],
      upgrades: [{ id: 'consciencia_distribuida', purchased: true }],
    });
    expect(computeOfflineCapHours(state)).toBe(SYNAPSE_CONSTANTS.maxOfflineHours);
  });

  test('calculateProduction reflects eco_neural mult (all_production compounds)', () => {
    const noRes = s({ neurons: [{ type: 'basica', count: 10 }, { type: 'sensorial', count: 0 }, { type: 'piramidal', count: 0 }, { type: 'espejo', count: 0 }, { type: 'integradora', count: 0 }] });
    const withRes = s({
      ...noRes,
      resonanceUpgrades: ['eco_neural', 'patron_estable', 'cascada_eterna'],
    });
    const noResProd = calculateProduction(noRes).base;
    const withResProd = calculateProduction(withRes).base;
    // eco_neural: 3 Resonance upgrades × 0.05 = 1.15×. But patron_estable also bumps the pattern cycle cap
    // from 1.5 to 1.8, which may or may not actually matter at 0 cycle patterns. Only eco_neural
    // directly multiplies here.
    expect(withResProd / noResProd).toBeCloseTo(1.15, 4);
  });
});
