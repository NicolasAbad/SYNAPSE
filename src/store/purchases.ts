// Implements docs/GDD.md §4 (COST-1 cost modifier order), §5 (neuron unlocks
// + costMult scaling), §24 (upgrades), §16 (region upgrades), §22 (RP-1
// cycle-neuron-purchases window). Sprint 3 Phase 3.
//
// Pure helpers called by gameStore.ts buyNeuron / buyUpgrade actions. Keeps
// the store thin (CODE-2) and lets tests exercise purchase logic without
// Zustand setup. Store is the impure boundary; these functions are pure.
//
// Cost modifiers applied here (COST-1 §4): `funcionesEjecutivasMod` (×0.80
// on thought-cost upgrades when Funciones Ejecutivas is owned). Mutation
// + Pathway cost mods are deferred to Sprint 5.
//
// Amplitud de Banda's `region_upgrades_boost` effect (GDD §16/§24) is
// recorded on purchase but NOT applied in Phase 3 — deferred to Sprint 10
// when Regions proper lands. See PROGRESS.md Phase 3 handoff.

import { NEURON_CONFIG } from '../config/neurons';
import { UPGRADES_BY_ID } from '../config/upgrades';
import { SYNAPSE_CONSTANTS } from '../config/constants';
import { computeConnectionMult } from '../engine/production';
import type { GameState } from '../types/GameState';
import type { NeuronState, NeuronType } from '../types';

/** Reason code for why a purchase was rejected. 'ok' means it will succeed. */
export type BuyReason = 'ok' | 'locked' | 'insufficient_funds' | 'already_owned' | 'unknown';

/** Build the Set of owned upgrade IDs once; callers iterate on this for O(1) lookup. */
function ownedUpgradeIds(state: Pick<GameState, 'upgrades'>): Set<string> {
  const out = new Set<string>();
  for (const u of state.upgrades) if (u.purchased) out.add(u.id);
  return out;
}

/** Count of a given neuron type currently owned. Returns 0 if the slot is missing. */
function countOf(neurons: readonly NeuronState[], type: NeuronType): number {
  for (const n of neurons) if (n.type === type) return n.count;
  return 0;
}

/** Apply COST-1 modifiers: thought-cost upgrades get −20% if Funciones Ejecutivas is owned. */
function finalUpgradeCost(baseCost: number, costCurrency: 'thoughts' | 'memorias', owned: ReadonlySet<string>): number {
  if (costCurrency !== 'thoughts') return baseCost;
  const funcEjec = UPGRADES_BY_ID['funciones_ejecutivas'];
  if (!funcEjec || !owned.has('funciones_ejecutivas')) return baseCost;
  if (funcEjec.effect.kind !== 'upgrade_cost_reduction') return baseCost;
  return baseCost * (1 - funcEjec.effect.pct);
}

/** Per-neuron cost with COST-1 modifiers applied (Sprint 3: no modifiers for neurons). */
export function neuronBuyCost(type: NeuronType, owned: number): number {
  return NEURON_CONFIG[type].baseCost * Math.pow(SYNAPSE_CONSTANTS.costMult, owned);
}

/** True iff a neuron type's unlock gate is satisfied in `state`. Pure. */
export function isNeuronUnlocked(state: Pick<GameState, 'neurons' | 'prestigeCount'>, type: NeuronType): boolean {
  const unlock = NEURON_CONFIG[type].unlock;
  if (unlock.kind === 'start') return true;
  if (unlock.kind === 'prestige') return state.prestigeCount >= unlock.min;
  if (unlock.kind === 'neuron_count') return countOf(state.neurons, unlock.type) >= unlock.count;
  return false;
}

/** Reason code + cost snapshot. UI can use this to grey out / tooltip without attempting a buy. */
export function canBuyNeuron(state: GameState, type: NeuronType): { reason: BuyReason; cost: number } {
  if (!isNeuronUnlocked(state, type)) return { reason: 'locked', cost: 0 };
  const cost = neuronBuyCost(type, countOf(state.neurons, type));
  if (state.thoughts < cost) return { reason: 'insufficient_funds', cost };
  return { reason: 'ok', cost };
}

export function canBuyUpgrade(state: GameState, id: string): { reason: BuyReason; cost: number } {
  const def = UPGRADES_BY_ID[id];
  if (!def) return { reason: 'unknown', cost: 0 };
  const owned = ownedUpgradeIds(state);
  if (owned.has(id)) return { reason: 'already_owned', cost: 0 };
  if (state.prestigeCount < def.unlockPrestige) return { reason: 'locked', cost: def.cost };
  const cost = finalUpgradeCost(def.cost, def.costCurrency, owned);
  const bank = def.costCurrency === 'thoughts' ? state.thoughts : state.memories;
  if (bank < cost) return { reason: 'insufficient_funds', cost };
  return { reason: 'ok', cost };
}

/**
 * Ephemeral undo-toast record. UI-local (not persisted). `snapshot` holds the
 * GameState fields to restore on undo — Zustand merge-mode set(snapshot) applies it.
 */
export interface UndoToast {
  kind: 'neuron' | 'upgrade';
  id: string;
  refund: number;
  currency: 'thoughts' | 'memorias';
  expiresAt: number;
  snapshot: Partial<GameState>;
}

/** Result of a successful purchase: GameState delta + (optional) undo toast. */
export interface BuyOk {
  ok: true;
  updates: Partial<GameState>;
  undoToast: UndoToast | null;
}
export interface BuyFail {
  ok: false;
  reason: BuyReason;
}
export type BuyResult = BuyOk | BuyFail;

/** True iff cost is large enough (>10% of currency bank BEFORE purchase) to warrant an undo toast (UI-4). */
function shouldShowUndo(bankBefore: number, cost: number): boolean {
  if (bankBefore <= 0) return false;
  return cost > bankBefore * SYNAPSE_CONSTANTS.undoExpensiveThresholdPct;
}

/**
 * Build a snapshot of the fields the buy mutated; `set(snapshot)` restores pre-buy state.
 * Includes time-accumulating fields (cycleGenerated, totalGenerated, piggyBankSparks,
 * consciousnessBarUnlocked) so the 3-second undo window doesn't silently skew
 * progress meters. See Phase 3.5 audit Finding #3.
 */
function buildNeuronUndoSnapshot(state: GameState): Partial<GameState> {
  return {
    thoughts: state.thoughts,
    neurons: state.neurons,
    connectionMult: state.connectionMult,
    cycleNeuronPurchases: state.cycleNeuronPurchases,
    cycleNeuronsBought: state.cycleNeuronsBought,
    lastPurchaseTimestamp: state.lastPurchaseTimestamp,
    cycleGenerated: state.cycleGenerated,
    totalGenerated: state.totalGenerated,
    consciousnessBarUnlocked: state.consciousnessBarUnlocked,
    piggyBankSparks: state.piggyBankSparks,
  };
}

export function tryBuyNeuron(state: GameState, type: NeuronType, nowTimestamp: number): BuyResult {
  const check = canBuyNeuron(state, type);
  if (check.reason !== 'ok') return { ok: false, reason: check.reason };
  const prevCount = countOf(state.neurons, type);
  const newNeurons: NeuronState[] = state.neurons.map((n) => n.type === type ? { ...n, count: n.count + 1 } : n);
  const connectionChanges = prevCount === 0; // a brand-new type entered the owned set → recompute pairs
  const hasSincronia = ownedUpgradeIds(state).has('sincronia_neural');
  const newConnectionMult = connectionChanges ? computeConnectionMult(newNeurons, hasSincronia) : state.connectionMult;
  const snapshot = buildNeuronUndoSnapshot(state);
  const updates: Partial<GameState> = {
    thoughts: state.thoughts - check.cost,
    neurons: newNeurons,
    connectionMult: newConnectionMult,
    cycleNeuronPurchases: [...state.cycleNeuronPurchases, { type, timestamp: nowTimestamp }],
    cycleNeuronsBought: state.cycleNeuronsBought + 1,
    lastPurchaseTimestamp: nowTimestamp,
  };
  const undoToast: UndoToast | null = shouldShowUndo(state.thoughts, check.cost)
    ? { kind: 'neuron', id: type, refund: check.cost, currency: 'thoughts', expiresAt: nowTimestamp + SYNAPSE_CONSTANTS.undoToastDurationMs, snapshot }
    : null;
  return { ok: true, updates, undoToast };
}

/**
 * Build an upgrade-undo snapshot: capture every field the buyUpgrade side-effect
 * touches + time-accumulating progress meters (see buildNeuronUndoSnapshot).
 */
function buildUpgradeUndoSnapshot(state: GameState): Partial<GameState> {
  return {
    thoughts: state.thoughts,
    memories: state.memories,
    upgrades: state.upgrades,
    connectionMult: state.connectionMult,
    dischargeMaxCharges: state.dischargeMaxCharges,
    currentOfflineCapHours: state.currentOfflineCapHours,
    currentOfflineEfficiency: state.currentOfflineEfficiency,
    focusFillRate: state.focusFillRate,
    cycleUpgradesBought: state.cycleUpgradesBought,
    lastPurchaseTimestamp: state.lastPurchaseTimestamp,
    cycleGenerated: state.cycleGenerated,
    totalGenerated: state.totalGenerated,
    consciousnessBarUnlocked: state.consciousnessBarUnlocked,
    piggyBankSparks: state.piggyBankSparks,
  };
}

export function tryBuyUpgrade(state: GameState, id: string, nowTimestamp: number): BuyResult {
  const check = canBuyUpgrade(state, id);
  if (check.reason !== 'ok') return { ok: false, reason: check.reason };
  const def = UPGRADES_BY_ID[id]!;
  const snapshot = buildUpgradeUndoSnapshot(state);
  const updates: Partial<GameState> = {
    upgrades: [...state.upgrades, { id, purchased: true, purchasedAt: nowTimestamp }],
    cycleUpgradesBought: state.cycleUpgradesBought + 1,
    lastPurchaseTimestamp: nowTimestamp,
  };
  if (def.costCurrency === 'thoughts') updates.thoughts = state.thoughts - check.cost;
  else updates.memories = state.memories - check.cost;

  // Immediate state side-effects at purchase time (effects consumed at event time
  // are handled in their respective phases — TAP-2, Discharge, Cascade, Insight, offline).
  const effect = def.effect;
  if (effect.kind === 'discharge_max_charges_add') {
    updates.dischargeMaxCharges = state.dischargeMaxCharges + effect.add;
  } else if (effect.kind === 'offline_cap_set') {
    updates.currentOfflineCapHours = Math.max(state.currentOfflineCapHours, effect.hours);
  } else if (effect.kind === 'focus_fill_mult') {
    updates.focusFillRate = state.focusFillRate * effect.focusMult;
  } else if (effect.kind === 'connection_mult_double') {
    const nowNeurons = state.neurons;
    updates.connectionMult = computeConnectionMult(nowNeurons, true);
  } else if (effect.kind === 'offline_efficiency_mult' || effect.kind === 'offline_efficiency_and_autocharge') {
    updates.currentOfflineEfficiency = state.currentOfflineEfficiency * effect.mult;
  }

  const bank = def.costCurrency === 'thoughts' ? state.thoughts : state.memories;
  const undoToast: UndoToast | null = shouldShowUndo(bank, check.cost)
    ? { kind: 'upgrade', id, refund: check.cost, currency: def.costCurrency, expiresAt: nowTimestamp + SYNAPSE_CONSTANTS.undoToastDurationMs, snapshot }
    : null;
  return { ok: true, updates, undoToast };
}
