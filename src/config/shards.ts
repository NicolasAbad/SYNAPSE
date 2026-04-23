// Implements docs/GDD.md §16.1 (Hipocampo Memory Shard upgrades) — canonical storage.
//
// CANONICAL STORAGE FILE per CLAUDE.md "Canonical storage file rule" —
// this file is the source of truth for the 6 v1.0 Hipocampo shard upgrade
// definitions. It contains ONLY data (no logic). All game-logic values
// (cost, effect parameters) are copied verbatim from GDD §16.1 table.
// Gate 3 (constants coverage) of scripts/check-invention.sh excludes
// this file from the literal count — these are canonical spec values,
// not inventions.
//
// Display names: approved English translations per Sprint 7.5.2 kickoff
// (Nico approval, see PROGRESS.md). Effect descriptions live in
// src/config/strings/en.ts under the `shard_upgrades` domain per CODE-1.
//
// Internal IDs (snake_case) stay in the project's prefix style (`shard_*`).
//
// Sprint 7.5.2 shipped 6 of 8 upgrades. Sprint 7.5.3 landed shard_emo_deep
// alongside the Mood engine consumer. Sprint 7.7 landed shard_proc_mastery
// alongside the Mastery engine — catalog now complete at 8 upgrades.

import type { UpgradeDef } from '../types';

/**
 * The 8 Hipocampo Memory Shard upgrades (catalog complete post-Sprint-7.7).
 * Each has a typed-shard cost (emotional_shards / procedural_shards / episodic_shards).
 * Branch counts: 3 Emotional + 3 Procedural + 2 Episodic.
 */
export const SHARD_UPGRADES: readonly UpgradeDef[] = [
  // ── Emotional (3 of 3 — shard_emo_deep landed Sprint 7.5.3 with Mood engine) ──
  { id: 'shard_emo_pulse',     category: 'mem', cost: 20,  costCurrency: 'emotional_shards',  unlockPrestige: 1, effect: { kind: 'cascade_spark_bonus',     sparks: 1 } },
  { id: 'shard_emo_resonance', category: 'mem', cost: 50,  costCurrency: 'emotional_shards',  unlockPrestige: 3, effect: { kind: 'fragment_memory_bonus',   memory: 2 } },
  { id: 'shard_emo_deep',      category: 'mem', cost: 120, costCurrency: 'emotional_shards',  unlockPrestige: 7, effect: { kind: 'mood_event_scaling',      scale: 0.5 } },
  // ── Procedural (3 of 3 — shard_proc_mastery landed Sprint 7.7 with Mastery engine, GDD §16.1 + §38) ──
  { id: 'shard_proc_flow',     category: 'mem', cost: 20,  costCurrency: 'procedural_shards', unlockPrestige: 1, effect: { kind: 'tap_contribution_pct_add', pct: 0.05 } },
  { id: 'shard_proc_pattern',  category: 'mem', cost: 50,  costCurrency: 'procedural_shards', unlockPrestige: 3, effect: { kind: 'charge_interval_mult',     mult: 0.90 } },
  { id: 'shard_proc_mastery',  category: 'mem', cost: 120, costCurrency: 'procedural_shards', unlockPrestige: 7, effect: { kind: 'mastery_xp_gain_mult',    mult: 1.25 } },
  // ── Episodic (2 of 2 — full branch shipping) ──
  { id: 'shard_epi_imprint',    category: 'mem', cost: 10, costCurrency: 'episodic_shards',   unlockPrestige: 1, effect: { kind: 'memory_per_prestige_add',  memory: 1 } },
  { id: 'shard_epi_reflection', category: 'mem', cost: 30, costCurrency: 'episodic_shards',   unlockPrestige: 5, effect: { kind: 'rp_spark_bonus',           sparks: 10 } },
] as const;

/** O(1) lookup by id. Frozen snapshot of SHARD_UPGRADES. */
export const SHARD_UPGRADES_BY_ID: Readonly<Record<string, UpgradeDef>> = Object.freeze(
  SHARD_UPGRADES.reduce<Record<string, UpgradeDef>>((acc, u) => {
    acc[u.id] = u;
    return acc;
  }, {}),
);

/** Maps a shard-cost currency to the GameState.memoryShards key. */
export const SHARD_CURRENCY_TO_KEY: Readonly<Record<string, 'emotional' | 'procedural' | 'episodic'>> = Object.freeze({
  emotional_shards: 'emotional',
  procedural_shards: 'procedural',
  episodic_shards: 'episodic',
});
