// Implements GDD.md §38 (Mastery System — Sprint 6.8 addition, wired Sprint 7.7).
//
// Cross-system lifetime tracking. Each entity (Mutation / Upgrade / Pathway /
// Archetype) accrues uses across the player's lifetime (PRESERVE through both
// prestige AND Transcendence). Each Mastery level grants +0.5% effectiveness
// (MASTERY-2), capped at level 10 (MASTERY-1) = max +5% per entity.
//
// Storage: `mastery: Record<string, number>` — id → lifetime uses. Fractional
// values allowed (shard_proc_mastery gain multiplier ×1.25 produces fractions).
// Level is computed at read time via `floor(min(uses, maxLevel))` so uses can
// accumulate freely past 10 (forward-compat with v1.5+ cap raises).
//
// Scope exclusion: Hipocampo shard upgrades (src/config/shards.ts) are NOT
// counted in the Upgrade class. Shards are a distinct typed-shard economy;
// counting them here would double-reward a single player choice.

import { SYNAPSE_CONSTANTS } from '../config/constants';
import { UPGRADES } from '../config/upgrades';
import { SHARD_UPGRADES_BY_ID } from '../config/shards';
import { MUTATIONS } from '../config/mutations';
import { PATHWAYS } from '../config/pathways';
import { ARCHETYPES } from '../config/archetypes';
import type { GameState } from '../types/GameState';

export type MasteryClass = 'mutation' | 'upgrade' | 'pathway' | 'archetype';

/** Derived canonical-id sets per class, frozen at module load. */
export const MASTERY_ENTITY_IDS: Readonly<Record<MasteryClass, readonly string[]>> = Object.freeze({
  mutation: MUTATIONS.map((m) => m.id),
  upgrade: UPGRADES.map((u) => u.id),
  pathway: PATHWAYS.map((p) => p.id),
  archetype: ARCHETYPES.map((a) => a.id),
});

/** Total trackable entities — derived from canonical arrays (not hardcoded). */
export const MASTERY_TOTAL_ENTITIES =
  MASTERY_ENTITY_IDS.mutation.length +
  MASTERY_ENTITY_IDS.upgrade.length +
  MASTERY_ENTITY_IDS.pathway.length +
  MASTERY_ENTITY_IDS.archetype.length;

/** O(1) class lookup from id. Builds once at module load. */
const ID_TO_CLASS: Readonly<Record<string, MasteryClass>> = (() => {
  const out: Record<string, MasteryClass> = {};
  for (const id of MASTERY_ENTITY_IDS.mutation) out[id] = 'mutation';
  for (const id of MASTERY_ENTITY_IDS.upgrade) out[id] = 'upgrade';
  for (const id of MASTERY_ENTITY_IDS.pathway) out[id] = 'pathway';
  for (const id of MASTERY_ENTITY_IDS.archetype) out[id] = 'archetype';
  return Object.freeze(out);
})();

/** Returns which Mastery class an id belongs to, or null if unknown. */
export function masteryClassOf(id: string): MasteryClass | null {
  return ID_TO_CLASS[id] ?? null;
}

/** Raw accumulated uses (includes fractional; never capped at the store). */
export function masteryUses(state: Pick<GameState, 'mastery'>, id: string): number {
  return state.mastery[id] ?? 0;
}

/** Current Mastery level: floor(min(uses, maxLevel)). 0..masteryMaxLevel. */
export function masteryLevel(state: Pick<GameState, 'mastery'>, id: string): number {
  const uses = masteryUses(state, id);
  return Math.floor(Math.min(uses, SYNAPSE_CONSTANTS.masteryMaxLevel));
}

/** Multiplicative bonus: 0 at L0, +0.005 per level, max +0.05 at L10 (§38.2). */
export function masteryBonus(state: Pick<GameState, 'mastery'>, id: string): number {
  return masteryLevel(state, id) * SYNAPSE_CONSTANTS.masteryBonusPerLevel;
}

/**
 * Upgrade-class Mastery multiplier helper: `(1 + masteryBonus)` for upgrade ids
 * in the canonical UPGRADES catalog, identity (1) for any other id (shards,
 * mutations, pathways, archetypes, unknown). Use at consumer sites where an
 * upgrade's multiplicative effect value is being applied: `effect.mult *
 * upgradeMasteryMult(state, id)`. Sprint 7.8 Phase 7.8.2 pulls the 7.7.4-
 * deferred Upgrade consumer wiring forward per §38.2 MASTERY-2 coverage.
 */
export function upgradeMasteryMult(state: Pick<GameState, 'mastery'>, upgradeId: string): number {
  if (masteryClassOf(upgradeId) !== 'upgrade') return 1;
  return 1 + masteryBonus(state, upgradeId);
}

/**
 * XP gain multiplier: shard_proc_mastery (when owned) multiplies every XP
 * accrual by `masteryXpGainMult` before the value lands in `mastery[id]`.
 * Base identity 1.0 when the shard upgrade isn't owned.
 */
export function masteryGainMult(state: Pick<GameState, 'memoryShardUpgrades'>): number {
  for (const id of state.memoryShardUpgrades) {
    const effect = SHARD_UPGRADES_BY_ID[id]?.effect;
    if (effect?.kind === 'mastery_xp_gain_mult') return effect.mult;
  }
  return 1;
}

/**
 * Returns a new `mastery` record with `id`'s counter incremented by
 * `baseXp × masteryGainMult(state)`. Pure — caller assigns the result.
 * Invalid ids (not in MASTERY_ENTITY_IDS) are ignored (returns the original).
 */
export function applyMasteryXpGain(
  state: Pick<GameState, 'mastery' | 'memoryShardUpgrades'>,
  id: string,
  baseXp: number,
): Record<string, number> {
  if (masteryClassOf(id) === null) return state.mastery;
  if (baseXp <= 0) return state.mastery;
  const gain = baseXp * masteryGainMult(state);
  return { ...state.mastery, [id]: (state.mastery[id] ?? 0) + gain };
}

/**
 * Detects level-ups between a before/after mastery snapshot for analytics
 * emission (MASTERY-4 `mastery_level_up`). Returns the ids that crossed a
 * new integer-level boundary (one entry per crossing; may include multiple
 * ids if a tick grants XP to several entities at once).
 */
export function masteryLevelUps(
  before: Pick<GameState, 'mastery'>,
  after: Pick<GameState, 'mastery'>,
): readonly { id: string; newLevel: number }[] {
  const crossings: { id: string; newLevel: number }[] = [];
  for (const id of Object.keys(after.mastery)) {
    const beforeLevel = Math.floor(Math.min(before.mastery[id] ?? 0, SYNAPSE_CONSTANTS.masteryMaxLevel));
    const afterLevel = Math.floor(Math.min(after.mastery[id] ?? 0, SYNAPSE_CONSTANTS.masteryMaxLevel));
    if (afterLevel > beforeLevel) crossings.push({ id, newLevel: afterLevel });
  }
  return crossings;
}
