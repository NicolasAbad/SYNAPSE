// Implements docs/GDD.md §32 (GameState forwards-compat migration).
//
// Save-format migration: backfills missing fields with safe defaults so legacy
// saves load cleanly after the schema grows. Idempotent — re-running on an
// up-to-date payload returns it unchanged. Defensive — if the payload is not a
// plain object (null, array, primitive), passes through so the validator can
// reject it for the right reason.
//
// Sprint 7.5 Phase 7.5.1: 110 → 119 fields. Backfills the 9 Region/Mastery/
// Auto-buy fields added by the Sprint 6.8 re-architecture. CODE-6 + MIG-1.

import { SYNAPSE_CONSTANTS } from '../config/constants';

export function migrateState(parsed: unknown): unknown {
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return parsed;
  }
  const obj = parsed as Record<string, unknown>;
  const defaults: Record<string, unknown> = {
    memoryShards: { emotional: 0, procedural: 0, episodic: 0 },
    memoryShardUpgrades: [],
    activePrecommitment: null,
    precommitmentStreak: 0,
    mood: SYNAPSE_CONSTANTS.moodInitialValue,
    moodHistory: [],
    brocaNamedMoments: [],
    mastery: {},
    autoBuyConfig: {},
  };
  const out: Record<string, unknown> = { ...obj };
  for (const key of Object.keys(defaults)) {
    if (!(key in out)) out[key] = defaults[key];
  }
  return out;
}
