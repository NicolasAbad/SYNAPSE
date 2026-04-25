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
//   - Sprint 7.10.4: 119 → 120 fields. Backfills `pendingOfflineSummary: null`
//     so legacy saves load cleanly; null is the correct "no pending" default.
//   - Sprint 7.10.5: 120 → 121 fields. Backfills `lucidDreamActiveUntil: null`
//     for Lucid Dream Option A timed-buff expiry per GDD §19.
//   - Sprint 9a Phase 9a.3: 121 → 123 fields. Backfills `installedAt: 0`
//     (V-5, MONEY-4 install-time anchor — initSessionTimestamps stamps it on
//     next launch since legacy save means we don't know real install date) and
//     `lastAdWatchedAt: 0` (V-2, MONEY-6 cooldown — 0 means "no prior ad,
//     cooldown immediately satisfied").
//   - Sprint 9b Phase 9b.4: 123 → 124 fields. Backfills `geniusPassDismissals: 0`
//     (V-7, lifetime counter for MONEY-9 max-3-dismissals enforcement).
//   - Sprint 10 Phase 10.1: 124 → 132 fields. Backfills 8 Settings fields with
//     conservative defaults so legacy saves load with sensible audio + accessibility
//     state. All settings are PRESERVE on prestige + Transcendence; only Hard
//     Reset wipes them via createDefaultState.
//   - Sprint 10 Phase 10.3: 132 → 133 fields. Backfills `firstEventsFired: []`
//     for analytics fire-once tracking. Empty array means a legacy save will
//     re-fire its funnel events (app_first_open etc.) once on this load — a
//     one-time noise spike acceptable for v1.0.

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
    pendingOfflineSummary: null,
    lucidDreamActiveUntil: null, // Sprint 7.10.5 — Lucid Dream Option A buff expiry
    installedAt: 0, // Sprint 9a Phase 9a.3 — initSessionTimestamps stamps post-load
    lastAdWatchedAt: 0, // Sprint 9a Phase 9a.3 — 0 means cooldown satisfied
    geniusPassDismissals: 0, // Sprint 9b Phase 9b.4 — V-7 MONEY-9 counter
    // Sprint 10 Phase 10.1 — Settings (8). Defaults match createDefaultState
    // so a legacy save loads with audible-but-not-loud audio, English UI, no
    // accessibility tweaks, and notifications opt-in (consumer in 10.4 still
    // requires platform permission grant before scheduling anything).
    sfxVolume: SYNAPSE_CONSTANTS.defaultSfxVolume,
    musicVolume: SYNAPSE_CONSTANTS.defaultMusicVolume,
    language: 'en',
    colorblindMode: false,
    reducedMotion: false,
    highContrast: false,
    fontSize: 'medium',
    notificationsEnabled: true,
    // Sprint 10 Phase 10.3 — analytics fire-once tracking, empty for legacy saves.
    firstEventsFired: [],
  };
  const out: Record<string, unknown> = { ...obj };
  for (const key of Object.keys(defaults)) {
    if (!(key in out)) out[key] = defaults[key];
  }
  // Sprint 7.5.2: strip retired upgrade IDs (no Memoria refund per GDD §16.8).
  if ('upgrades' in out) out.upgrades = stripRetiredUpgrades(out.upgrades);
  return out;
}
