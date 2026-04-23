// Implements docs/GDD.md §32 (GameState forwards-compat migration) + §16.8
// (Sprint 6.8 retired-upgrade cleanup).
//
// Save-format migration: backfills missing fields with safe defaults so legacy
// saves load cleanly after the schema grows; strips retired upgrade IDs as the
// Sprint 6.8 re-architecture sunsets them. Idempotent — re-running on an
// up-to-date payload returns it unchanged. Defensive — if the payload is not a
// plain object (null, array, primitive), passes through so the validator can
// reject it for the right reason.
//
// History:
//   - Sprint 7.5.1: 110 → 119 fields. Backfills the 9 Region/Mastery/Auto-buy
//     fields added by the Sprint 6.8 re-architecture. CODE-6 + MIG-1.
//   - Sprint 7.5.2: strips `consolidacion_memoria` from saved upgrades (retired
//     per GDD §16.8 — effect absorbed into Hipocampo `shard_emo_resonance`).
//     Memorias spent are NOT refunded ("value-neutral to sunset").
//   - Sprint 7.5.3: strips `regulacion_emocional` (offline path moved to new
//     `ondas_theta` upgrade per GDD §24 + Mood-applies-offline §19).

import { SYNAPSE_CONSTANTS } from '../config/constants';

/**
 * Upgrade IDs sunsetted by the Sprint 6.8 re-architecture. Stripped from
 * `state.upgrades` on load. Sprint 7.5.3 will add `regulacion_emocional` and
 * Sprint 7.5.5 will add `procesamiento_visual` to this list with their
 * consumer-phase commits.
 */
const RETIRED_UPGRADE_IDS = new Set<string>([
  'consolidacion_memoria', // Sprint 7.5.2 — replaced by shard_emo_resonance
  'regulacion_emocional',  // Sprint 7.5.3 — replaced by ondas_theta + Mood-applies-offline
  'procesamiento_visual',  // Sprint 7.5.5 — replaced by Visual Foresight T1 Pattern Recognition toggle
]);

function stripRetiredUpgrades(value: unknown): unknown {
  if (!Array.isArray(value)) return value;
  return value.filter((u) => {
    if (u === null || typeof u !== 'object') return true;
    const id = (u as { id?: unknown }).id;
    return typeof id !== 'string' || !RETIRED_UPGRADE_IDS.has(id);
  });
}

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
  // Sprint 7.5.2: strip retired upgrade IDs (no Memoria refund per GDD §16.8).
  if ('upgrades' in out) out.upgrades = stripRetiredUpgrades(out.upgrades);
  return out;
}
