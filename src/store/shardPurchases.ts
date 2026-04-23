// Implements docs/GDD.md §16.1 (Hipocampo Memory Shard upgrade purchases).
// Sprint 7.5 Phase 7.5.2.
//
// Shard upgrades are priced in typed shards (emotional/procedural/episodic),
// stored in `state.memoryShardUpgrades: string[]` (NOT `state.upgrades`) to
// keep the canonical 34-upgrade list semantically pure. The bank lookup
// dispatches off costCurrency through SHARD_CURRENCY_TO_KEY → memoryShards key.
//
// Companion to src/store/purchases.ts (legacy thoughts/memorias upgrades);
// kept in a separate module per CODE-2.

import { SHARD_UPGRADES_BY_ID, SHARD_CURRENCY_TO_KEY } from '../config/shards';
import { SYNAPSE_CONSTANTS } from '../config/constants';
import type { GameState } from '../types/GameState';
import type { BuyReason, BuyResult, UndoToast } from './purchases';

/** True iff cost is large enough (>10% of currency bank) to warrant an undo toast (UI-4). */
function shouldShowUndo(bankBefore: number, cost: number): boolean {
  if (bankBefore <= 0) return false;
  return cost > bankBefore * SYNAPSE_CONSTANTS.undoExpensiveThresholdPct;
}

/** Returns 'ok' iff the shard upgrade is unlocked, unowned, and affordable. */
export function canBuyShardUpgrade(state: GameState, id: string): { reason: BuyReason; cost: number } {
  const def = SHARD_UPGRADES_BY_ID[id];
  if (!def) return { reason: 'unknown', cost: 0 };
  if (state.memoryShardUpgrades.includes(id)) return { reason: 'already_owned', cost: 0 };
  if (state.prestigeCount < def.unlockPrestige) return { reason: 'locked', cost: def.cost };
  const shardKey = SHARD_CURRENCY_TO_KEY[def.costCurrency];
  if (shardKey === undefined) return { reason: 'unknown', cost: def.cost };
  if (state.memoryShards[shardKey] < def.cost) return { reason: 'insufficient_funds', cost: def.cost };
  return { reason: 'ok', cost: def.cost };
}

function buildShardUndoSnapshot(state: GameState): Partial<GameState> {
  return {
    memoryShards: state.memoryShards,
    memoryShardUpgrades: state.memoryShardUpgrades,
    lastPurchaseTimestamp: state.lastPurchaseTimestamp,
  };
}

export function tryBuyShardUpgrade(state: GameState, id: string, nowTimestamp: number): BuyResult {
  const check = canBuyShardUpgrade(state, id);
  if (check.reason !== 'ok') return { ok: false, reason: check.reason };
  const def = SHARD_UPGRADES_BY_ID[id]!;
  const shardKey = SHARD_CURRENCY_TO_KEY[def.costCurrency]!;
  const snapshot = buildShardUndoSnapshot(state);
  const nextShards = { ...state.memoryShards, [shardKey]: state.memoryShards[shardKey] - check.cost };
  const updates: Partial<GameState> = {
    memoryShards: nextShards,
    memoryShardUpgrades: [...state.memoryShardUpgrades, id],
    lastPurchaseTimestamp: nowTimestamp,
  };
  const bank = state.memoryShards[shardKey];
  const undoToast: UndoToast | null = shouldShowUndo(bank, check.cost)
    ? { kind: 'shard_upgrade', id, refund: check.cost, currency: def.costCurrency, expiresAt: nowTimestamp + SYNAPSE_CONSTANTS.undoToastDurationMs, snapshot }
    : null;
  return { ok: true, updates, undoToast };
}
