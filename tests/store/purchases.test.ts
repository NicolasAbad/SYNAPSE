// Tests for src/store/purchases.ts (Sprint 3 Phase 3).
// Covers: neuron unlock gates, cost scaling, connection-mult recompute on
// new-type entry, upgrade unlock gates, COST-1 Funciones Ejecutivas discount,
// immediate state side-effects at purchase time, undo-toast trigger + restore,
// RP-1 cycleNeuronPurchases push, cycleNeuronsBought / cycleUpgradesBought counters.

import { describe, expect, test, beforeEach } from 'vitest';
import {
  canBuyNeuron,
  canBuyUpgrade,
  isNeuronUnlocked,
  neuronBuyCost,
  tryBuyNeuron,
  tryBuyUpgrade,
} from '../../src/store/purchases';
import { createDefaultState, useGameStore } from '../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';
import type { GameState } from '../../src/types/GameState';
import type { UpgradeState } from '../../src/types';

function withUpgrades(state: GameState, ids: string[]): GameState {
  const upgrades: UpgradeState[] = ids.map((id) => ({ id, purchased: true, purchasedAt: 0 }));
  return { ...state, upgrades };
}

describe('neuronBuyCost (GDD §4 costMult^owned)', () => {
  test('baseCost when 0 owned', () => {
    expect(neuronBuyCost('basica', 0)).toBeCloseTo(10, 6);
    expect(neuronBuyCost('sensorial', 0)).toBeCloseTo(150, 6);
  });
  test('scales by 1.28^owned', () => {
    expect(neuronBuyCost('basica', 5)).toBeCloseTo(10 * Math.pow(1.28, 5), 3);
    expect(neuronBuyCost('piramidal', 10)).toBeCloseTo(2_200 * Math.pow(1.28, 10), 0);
  });
});

describe('isNeuronUnlocked (GDD §5 Unlock column)', () => {
  test('Básica always unlocked', () => {
    expect(isNeuronUnlocked(createDefaultState(), 'basica')).toBe(true);
  });
  test('Sensorial requires 10 Básicas', () => {
    const state = createDefaultState();
    expect(isNeuronUnlocked(state, 'sensorial')).toBe(false); // default has 1 Básica
    state.neurons[0].count = 9;
    expect(isNeuronUnlocked(state, 'sensorial')).toBe(false);
    state.neurons[0].count = 10;
    expect(isNeuronUnlocked(state, 'sensorial')).toBe(true);
  });
  test('Integradora requires prestigeCount >= 10', () => {
    const state = createDefaultState();
    expect(isNeuronUnlocked(state, 'integradora')).toBe(false);
    expect(isNeuronUnlocked({ ...state, prestigeCount: 10 }, 'integradora')).toBe(true);
  });
});

describe('canBuyNeuron / tryBuyNeuron', () => {
  test('locked reason when unlock gate fails', () => {
    const state = { ...createDefaultState(), thoughts: 1_000_000 };
    const check = canBuyNeuron(state, 'sensorial');
    expect(check.reason).toBe('locked');
    const result = tryBuyNeuron(state, 'sensorial', 0);
    expect(result.ok).toBe(false);
  });
  test('insufficient_funds when cost exceeds thoughts', () => {
    const state = { ...createDefaultState(), thoughts: 5 };
    const check = canBuyNeuron(state, 'basica');
    // First básica already owned (default); cost = 10 × 1.28^1 = 12.8
    expect(check.reason).toBe('insufficient_funds');
    expect(check.cost).toBeCloseTo(12.8, 6);
  });
  test('happy path: buy a Básica — cost deducted, count incremented, RP-1 push, counter++', () => {
    const state = { ...createDefaultState(), thoughts: 100 };
    const before = state.thoughts;
    const result = tryBuyNeuron(state, 'basica', 12345);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.updates.thoughts).toBeCloseTo(before - 12.8, 6);
    expect(result.updates.neurons?.find((n) => n.type === 'basica')?.count).toBe(2);
    expect(result.updates.cycleNeuronPurchases).toEqual([{ type: 'basica', timestamp: 12345 }]);
    expect(result.updates.cycleNeuronsBought).toBe(1);
    expect(result.updates.lastPurchaseTimestamp).toBe(12345);
  });
  test('connectionMult recomputes when a new type first enters the owned set', () => {
    // Start: 1 Básica owned, connectionMult = 1 (no pairs yet)
    const state = { ...createDefaultState(), thoughts: 10_000 };
    state.neurons[0].count = 10; // satisfy sensorial unlock
    const result = tryBuyNeuron(state, 'sensorial', 0);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Now 2 types owned → 1 pair → 1.05
    expect(result.updates.connectionMult).toBeCloseTo(1.05, 6);
  });
  test('connectionMult unchanged when buying additional of existing type', () => {
    const state = { ...createDefaultState(), thoughts: 100, connectionMult: 1.0 };
    const result = tryBuyNeuron(state, 'basica', 0);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.updates.connectionMult).toBe(1.0); // no pair change
  });
  test('Sincronía Neural owned: connection recompute doubles', () => {
    const state = withUpgrades({ ...createDefaultState(), thoughts: 100_000 }, ['sincronia_neural']);
    state.neurons[0].count = 10; // ready for sensorial
    state.connectionMult = 2; // doubled 1 × 2 from Sincronía (set when Sincronía was bought)
    const result = tryBuyNeuron(state, 'sensorial', 0);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // New type entry → recompute: 2 types = 1 pair = 1.05; doubled by Sincronía = 2.10
    expect(result.updates.connectionMult).toBeCloseTo(2.10, 6);
  });
});

describe('canBuyUpgrade / tryBuyUpgrade', () => {
  test('unknown upgrade id fails cleanly', () => {
    const result = tryBuyUpgrade(createDefaultState(), 'nonexistent', 0);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('unknown');
  });
  test('locked reason when prestigeCount < unlockPrestige', () => {
    const state = { ...createDefaultState(), thoughts: 1_000_000_000, prestigeCount: 0 };
    expect(canBuyUpgrade(state, 'dopamina').reason).toBe('locked'); // dopamina unlocks P2+
    expect(canBuyUpgrade(state, 'singularidad').reason).toBe('locked'); // P8+
  });
  test('insufficient_funds when thoughts < cost', () => {
    const state = { ...createDefaultState(), thoughts: 100 };
    expect(canBuyUpgrade(state, 'red_neuronal_densa').reason).toBe('insufficient_funds'); // 3K cost
  });
  test('already_owned rejects double-buy', () => {
    const state = withUpgrades({ ...createDefaultState(), thoughts: 10_000 }, ['red_neuronal_densa']);
    expect(canBuyUpgrade(state, 'red_neuronal_densa').reason).toBe('already_owned');
  });
  test('happy path: buy Red Neuronal Densa — upgrade recorded, thoughts deducted, counter++', () => {
    const state = { ...createDefaultState(), thoughts: 10_000 };
    const result = tryBuyUpgrade(state, 'red_neuronal_densa', 42);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.updates.thoughts).toBe(10_000 - 3_000);
    expect(result.updates.upgrades).toEqual([{ id: 'red_neuronal_densa', purchased: true, purchasedAt: 42 }]);
    expect(result.updates.cycleUpgradesBought).toBe(1);
    expect(result.updates.lastPurchaseTimestamp).toBe(42);
  });

  test('COST-1: Funciones Ejecutivas gives −20% on thought-cost upgrades', () => {
    const state = withUpgrades({ ...createDefaultState(), thoughts: 10_000 }, ['funciones_ejecutivas']);
    const check = canBuyUpgrade(state, 'red_neuronal_densa');
    expect(check.cost).toBeCloseTo(3_000 * 0.8, 6); // 2400
  });
  test('COST-1 does NOT apply to memoria-cost region upgrades', () => {
    const state = withUpgrades({ ...createDefaultState(), memories: 100 }, ['funciones_ejecutivas']);
    expect(canBuyUpgrade(state, 'consolidacion_memoria').cost).toBe(2); // unchanged
  });

  test('Memoria-cost upgrade deducts from memories, not thoughts', () => {
    const state = { ...createDefaultState(), memories: 10 };
    const result = tryBuyUpgrade(state, 'consolidacion_memoria', 0);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.updates.memories).toBe(8);
    expect(result.updates.thoughts).toBeUndefined();
  });

  test('insufficient memoria rejects region upgrade', () => {
    const state = { ...createDefaultState(), memories: 1 };
    expect(canBuyUpgrade(state, 'consolidacion_memoria').reason).toBe('insufficient_funds');
  });
});

describe('Immediate state side-effects on purchase', () => {
  test('Descarga Neural: dischargeMaxCharges += 1', () => {
    const state = { ...createDefaultState(), thoughts: 100_000 };
    const result = tryBuyUpgrade(state, 'descarga_neural', 0);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.updates.dischargeMaxCharges).toBe(state.dischargeMaxCharges + 1);
  });
  test('Sueño REM: offline cap 4 → 8', () => {
    const state = { ...createDefaultState(), thoughts: 100_000 };
    const result = tryBuyUpgrade(state, 'sueno_rem', 0);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.updates.currentOfflineCapHours).toBe(8);
  });
  test('Concentración Profunda: focusFillRate doubles', () => {
    const state = { ...createDefaultState(), thoughts: 100_000, prestigeCount: 4 };
    const before = state.focusFillRate;
    const result = tryBuyUpgrade(state, 'concentracion_profunda', 0);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.updates.focusFillRate).toBeCloseTo(before * 2, 6);
  });
  test('Sincronía Neural: connectionMult recomputed with hasSincronia=true', () => {
    const state = { ...createDefaultState(), thoughts: 1_000_000, prestigeCount: 2, connectionMult: 1.15 };
    state.neurons[0].count = 1;
    state.neurons[1].count = 1;
    state.neurons[2].count = 1;
    const result = tryBuyUpgrade(state, 'sincronia_neural', 0);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // 3 types × 2 (Sincronía) = 1.15 × 2 = 2.30
    expect(result.updates.connectionMult).toBeCloseTo(2.30, 6);
  });
  test('Regulación Emocional: offline efficiency ×2', () => {
    const state = { ...createDefaultState(), memories: 10 };
    const result = tryBuyUpgrade(state, 'regulacion_emocional', 0);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.updates.currentOfflineEfficiency).toBeCloseTo(1.0, 6); // 0.5 × 2
  });
  test('Non-immediate effects record ownership only (e.g. tap_bonus_mult)', () => {
    const state = { ...createDefaultState(), thoughts: 1_000_000, prestigeCount: 2 };
    const before = { ...state };
    const result = tryBuyUpgrade(state, 'dopamina', 0);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Only cost, upgrades, counter, timestamp changed — no side-effect field set
    expect(result.updates.dischargeMaxCharges).toBeUndefined();
    expect(result.updates.currentOfflineCapHours).toBeUndefined();
    expect(result.updates.focusFillRate).toBeUndefined();
    expect(result.updates.connectionMult).toBeUndefined();
    expect(result.updates.thoughts).toBe(before.thoughts - 80_000);
  });
});

describe('Undo toast (UI-4) trigger + restore', () => {
  test('no toast when cost ≤ 10% of bank', () => {
    // 1000 thoughts, buy Básica at ~12.8 → 1.28% < 10% threshold → no toast
    const state = { ...createDefaultState(), thoughts: 1000 };
    const result = tryBuyNeuron(state, 'basica', 0);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.undoToast).toBeNull();
  });
  test('toast when cost > 10% of bank (expensive purchase)', () => {
    // 100 thoughts, buy Básica at 12.8 → 12.8% > 10% threshold → toast
    const state = { ...createDefaultState(), thoughts: 100 };
    const result = tryBuyNeuron(state, 'basica', 1000);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.undoToast).not.toBeNull();
    expect(result.undoToast?.kind).toBe('neuron');
    expect(result.undoToast?.currency).toBe('thoughts');
    expect(result.undoToast?.expiresAt).toBe(1000 + SYNAPSE_CONSTANTS.undoToastDurationMs);
  });
  test('undo restores pre-purchase thoughts, neurons, connectionMult, counters', () => {
    // Simulate via store end-to-end (integration check)
    useGameStore.setState(createDefaultState());
    useGameStore.setState({ thoughts: 100 });
    const before = useGameStore.getState();
    const reason = useGameStore.getState().buyNeuron('basica', 1000);
    expect(reason).toBe('ok');
    const mid = useGameStore.getState();
    expect(mid.thoughts).toBeLessThan(before.thoughts);
    expect(mid.undoToast).not.toBeNull();
    useGameStore.getState().undoLastPurchase();
    const after = useGameStore.getState();
    expect(after.thoughts).toBe(before.thoughts);
    expect(after.undoToast).toBeNull();
    expect(after.cycleNeuronsBought).toBe(before.cycleNeuronsBought);
  });
  test('dismissUndoToast clears without restoring', () => {
    useGameStore.setState(createDefaultState());
    useGameStore.setState({ thoughts: 100 });
    useGameStore.getState().buyNeuron('basica', 1000);
    const mid = useGameStore.getState();
    expect(mid.undoToast).not.toBeNull();
    useGameStore.getState().dismissUndoToast();
    const after = useGameStore.getState();
    expect(after.undoToast).toBeNull();
    expect(after.thoughts).toBe(mid.thoughts); // unchanged — purchase stays
  });
});

describe('Store action integration (gameStore wiring)', () => {
  beforeEach(() => {
    useGameStore.setState(createDefaultState());
    useGameStore.setState({ undoToast: null, activeTab: 'mind' });
  });
  test('buyNeuron returns reason codes cleanly', () => {
    expect(useGameStore.getState().buyNeuron('sensorial', 0)).toBe('locked');
    useGameStore.setState({ thoughts: 5 });
    expect(useGameStore.getState().buyNeuron('basica', 0)).toBe('insufficient_funds');
    useGameStore.setState({ thoughts: 1_000 });
    expect(useGameStore.getState().buyNeuron('basica', 0)).toBe('ok');
  });
  test('buyUpgrade returns reason codes cleanly', () => {
    expect(useGameStore.getState().buyUpgrade('dopamina', 0)).toBe('locked');
    useGameStore.setState({ thoughts: 10_000_000, prestigeCount: 10 });
    expect(useGameStore.getState().buyUpgrade('dopamina', 0)).toBe('ok');
    expect(useGameStore.getState().buyUpgrade('dopamina', 0)).toBe('already_owned');
  });
  test('reset clears undoToast', () => {
    useGameStore.setState({ thoughts: 100 });
    useGameStore.getState().buyNeuron('basica', 0);
    expect(useGameStore.getState().undoToast).not.toBeNull();
    useGameStore.getState().reset();
    expect(useGameStore.getState().undoToast).toBeNull();
  });
});
