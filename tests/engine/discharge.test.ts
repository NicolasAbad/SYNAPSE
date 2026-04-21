// Tests for src/engine/discharge.ts (Sprint 3 Phase 6).
// Covers GDD §7 BUG-07 order, tutorial ×3 override, Amplificador stack,
// Cascade threshold + multiplier stacking (base 2.5, cascada_eterna 3.0,
// Cascada Profunda ×2 compound → max 6.0), Sincronización refund, Potencial
// Latente flat bonus, preconditions (no charges → noop), counter increments.

import { describe, expect, test } from 'vitest';
import {
  computeCascadeMultiplier,
  computeDischargeMultiplier,
  performDischarge,
} from '../../src/engine/discharge';
import { createDefaultState } from '../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';
import type { GameState } from '../../src/types/GameState';
import type { UpgradeState } from '../../src/types';

function withUpgrades(state: GameState, ids: string[]): GameState {
  const upgrades: UpgradeState[] = ids.map((id) => ({ id, purchased: true, purchasedAt: 0 }));
  return { ...state, upgrades };
}

function stateReady(overrides: Partial<GameState> = {}): GameState {
  // Default to post-tutorial (isTutorialCycle=false) — most tests care about
  // non-tutorial behavior. Tutorial-specific tests explicitly opt in.
  return { ...createDefaultState(), dischargeCharges: 1, effectiveProductionPerSecond: 100, isTutorialCycle: false, ...overrides };
}

describe('performDischarge — preconditions', () => {
  test('Returns fired=false when no charges available', () => {
    const s = stateReady({ dischargeCharges: 0 });
    const { updates, outcome } = performDischarge(s, 0);
    expect(outcome.fired).toBe(false);
    expect(updates).toEqual({});
  });
  test('Returns fired=true when charges > 0', () => {
    const s = stateReady();
    const { outcome } = performDischarge(s, 0);
    expect(outcome.fired).toBe(true);
  });
});

describe('performDischarge — base multiplier by prestige (GDD §7)', () => {
  test('P0-P2: base mult = 1.5 (dischargeMultiplier)', () => {
    const s = stateReady({ prestigeCount: 0, isTutorialCycle: false });
    const { outcome } = performDischarge(s, 0);
    // burst = 100 (pps) × 1.5 × 60 = 9000
    expect(outcome.burst).toBeCloseTo(9000, 3);
  });
  test('P3+: base mult = 2.0 (dischargeMultiplierP3Plus)', () => {
    const s = stateReady({ prestigeCount: 3 });
    const { outcome } = performDischarge(s, 0);
    // burst = 100 × 2.0 × 60 = 12000
    expect(outcome.burst).toBeCloseTo(12000, 3);
  });
});

describe('performDischarge — tutorial override (×3.0 on first Discharge of first cycle)', () => {
  test('isTutorialCycle + cycleDischargesUsed=0 → 3.0x multiplier applies', () => {
    const s = stateReady({ prestigeCount: 0, isTutorialCycle: true, cycleDischargesUsed: 0 });
    const { outcome } = performDischarge(s, 0);
    // burst = 100 × 3.0 × 60 = 18000
    expect(outcome.burst).toBeCloseTo(18000, 3);
  });
  test('Tutorial override only on FIRST Discharge — second returns to base (1.5)', () => {
    const s = stateReady({ prestigeCount: 0, isTutorialCycle: true, cycleDischargesUsed: 1 });
    const { outcome } = performDischarge(s, 0);
    expect(outcome.burst).toBeCloseTo(9000, 3); // back to 1.5×
  });
  test('isTutorialCycle=false → no tutorial bonus even at cycleDischargesUsed=0', () => {
    const s = stateReady({ prestigeCount: 0, isTutorialCycle: false, cycleDischargesUsed: 0 });
    const { outcome } = performDischarge(s, 0);
    expect(outcome.burst).toBeCloseTo(9000, 3);
  });
});

describe('performDischarge — Amplificador de Disparo ×1.5 stack', () => {
  test('Amplificador owned: base × 1.5', () => {
    const s = withUpgrades(stateReady({ prestigeCount: 3 }), ['amplificador_de_disparo']);
    const { outcome } = performDischarge(s, 0);
    // 100 × 2.0 × 1.5 × 60 = 18000
    expect(outcome.burst).toBeCloseTo(18000, 3);
  });
});

describe('performDischarge — Cascade BUG-07 order (focusBar >= 0.75 BEFORE consume)', () => {
  test('focusBar=0.74 → NOT Cascade', () => {
    const s = stateReady({ focusBar: 0.74 });
    const { outcome } = performDischarge(s, 0);
    expect(outcome.isCascade).toBe(false);
  });
  test('focusBar=0.75 → Cascade (exact threshold)', () => {
    const s = stateReady({ focusBar: 0.75 });
    const { outcome, updates } = performDischarge(s, 0);
    expect(outcome.isCascade).toBe(true);
    expect(updates.focusBar).toBe(0); // consumed per §7
    expect(updates.cycleCascades).toBe(1);
  });
  test('Cascade mult applies: 100 × 1.5 × 2.5 × 60 = 22500 (P0, base cascadeMult)', () => {
    const s = stateReady({ focusBar: 1.0, prestigeCount: 0, isTutorialCycle: false });
    const { outcome } = performDischarge(s, 0);
    expect(outcome.burst).toBeCloseTo(22500, 3);
  });
  test('Non-Cascade Discharge does NOT consume focusBar', () => {
    const s = stateReady({ focusBar: 0.5 });
    const { updates } = performDischarge(s, 0);
    expect(updates.focusBar).toBeUndefined();
  });
});

describe('computeCascadeMultiplier — stacking rules (GDD §7)', () => {
  test('Base: 2.5', () => {
    const s = createDefaultState();
    expect(computeCascadeMultiplier(s)).toBe(2.5);
  });
  test('Cascada Profunda owned: 2.5 × 2 = 5.0', () => {
    const s = withUpgrades(createDefaultState(), ['cascada_profunda']);
    expect(computeCascadeMultiplier(s)).toBe(5.0);
  });
  test('cascada_eterna (Resonance) owned: base 3.0', () => {
    const s = { ...createDefaultState(), resonanceUpgrades: ['cascada_eterna'] };
    expect(computeCascadeMultiplier(s)).toBe(3.0);
  });
  test('Both stacked: 3.0 × 2 = 6.0 (GDD max achievable)', () => {
    const s = withUpgrades({ ...createDefaultState(), resonanceUpgrades: ['cascada_eterna'] }, ['cascada_profunda']);
    expect(computeCascadeMultiplier(s)).toBe(6.0);
  });
});

describe('performDischarge — Sincronización Total post-Cascade refund (+0.18)', () => {
  test('Cascade + Sincronización owned: focusBar set to 0.18 (refund)', () => {
    const s = withUpgrades(stateReady({ focusBar: 1.0 }), ['sincronizacion_total']);
    const { updates } = performDischarge(s, 0);
    expect(updates.focusBar).toBeCloseTo(0.18, 6);
  });
  test('Cascade without Sincronización: focusBar = 0 (no refund)', () => {
    const s = stateReady({ focusBar: 1.0 });
    const { updates } = performDischarge(s, 0);
    expect(updates.focusBar).toBe(0);
  });
  test('Non-Cascade with Sincronización: focusBar unchanged (refund only fires on Cascade)', () => {
    const s = withUpgrades(stateReady({ focusBar: 0.3 }), ['sincronizacion_total']);
    const { updates } = performDischarge(s, 0);
    expect(updates.focusBar).toBeUndefined();
  });
});

describe('performDischarge — Potencial Latente flat bonus (+1000 × prestigeCount)', () => {
  test('P10, Potencial Latente owned: burst += 10000', () => {
    const s = withUpgrades(stateReady({ prestigeCount: 10 }), ['potencial_latente']);
    const { outcome } = performDischarge(s, 0);
    // 100 × 2.0 × 60 = 12000, + 1000 × 10 = 22000
    expect(outcome.burst).toBeCloseTo(22000, 3);
  });
  test('Without Potencial Latente: no flat bonus', () => {
    const s = stateReady({ prestigeCount: 10 });
    const { outcome } = performDischarge(s, 0);
    expect(outcome.burst).toBeCloseTo(12000, 3);
  });
});

describe('performDischarge — counters and accumulators', () => {
  test('Increments cycleDischargesUsed + lifetimeDischarges', () => {
    const s = stateReady({ cycleDischargesUsed: 2, lifetimeDischarges: 5 });
    const { updates } = performDischarge(s, 0);
    expect(updates.cycleDischargesUsed).toBe(3);
    expect(updates.lifetimeDischarges).toBe(6);
  });
  test('Consumes 1 charge', () => {
    const s = stateReady({ dischargeCharges: 2 });
    const { updates } = performDischarge(s, 0);
    expect(updates.dischargeCharges).toBe(1);
  });
  test('Burst adds to thoughts + cycleGenerated + totalGenerated equally', () => {
    const s = stateReady({ thoughts: 100, cycleGenerated: 200, totalGenerated: 500 });
    const { updates, outcome } = performDischarge(s, 0);
    expect(updates.thoughts).toBeCloseTo(100 + outcome.burst, 3);
    expect(updates.cycleGenerated).toBeCloseTo(200 + outcome.burst, 3);
    expect(updates.totalGenerated).toBeCloseTo(500 + outcome.burst, 3);
  });
  test('Cascade increments cycleCascades', () => {
    const s = stateReady({ focusBar: 1.0, cycleCascades: 2 });
    const { updates } = performDischarge(s, 0);
    expect(updates.cycleCascades).toBe(3);
  });
});

describe('computeDischargeMultiplier — spec-authority spot checks', () => {
  test('P0 + tutorial first + no upgrades + Cascade: 3.0 × 2.5 = 7.5', () => {
    const s = stateReady({ prestigeCount: 0, isTutorialCycle: true, cycleDischargesUsed: 0, focusBar: 1.0 });
    expect(computeDischargeMultiplier(s, true)).toBeCloseTo(7.5, 6);
  });
  test('P10 + Amplificador + Cascade with Cascada Profunda: 2.0 × 1.5 × 5.0 = 15.0', () => {
    const s = withUpgrades(stateReady({ prestigeCount: 10, focusBar: 1.0 }), ['amplificador_de_disparo', 'cascada_profunda']);
    expect(computeDischargeMultiplier(s, true)).toBeCloseTo(15.0, 6);
  });
  test('Max achievable: P10 + Amplificador + cascada_eterna + Cascada Profunda: 2.0 × 1.5 × 6.0 = 18.0', () => {
    const s = withUpgrades(
      { ...stateReady({ prestigeCount: 10, focusBar: 1.0 }), resonanceUpgrades: ['cascada_eterna'] },
      ['amplificador_de_disparo', 'cascada_profunda'],
    );
    expect(computeDischargeMultiplier(s, true)).toBeCloseTo(18.0, 6);
  });
});

describe('GDD §7 constants cross-check (consistency)', () => {
  test('cascadeThreshold = 0.75', () => {
    expect(SYNAPSE_CONSTANTS.cascadeThreshold).toBe(0.75);
  });
  test('cascadeMultiplier = 2.5', () => {
    expect(SYNAPSE_CONSTANTS.cascadeMultiplier).toBe(2.5);
  });
  test('cascadaEternaMult = 3.0', () => {
    expect(SYNAPSE_CONSTANTS.cascadaEternaMult).toBe(3.0);
  });
  test('chargeIntervalMinutes = 20', () => {
    expect(SYNAPSE_CONSTANTS.chargeIntervalMinutes).toBe(20);
  });
});
