// Implements GDD §15 — 13 Resonance upgrades across 3 tiers (T1 P13+ / T2 P18+
// req ≥1 T1 / T3 P23+ req ≥2 T2). Sprint 6.8 pulled 5 from v1.5 POSTLAUNCH —
// all 13 are v1.0 canonical per GDD §15 (SPRINTS.md §8b says "8" but is stale
// pre-Sprint-6.8; the GDD is authoritative post-6.8).
//
// CANONICAL STORAGE FILE per CLAUDE.md "Canonical storage file rule": pure data,
// no logic. Costs + effect values come verbatim from GDD §15 tables. Gate 3
// auto-excludes src/config/ from its literal count.
//
// Sprint 8b Phase 8b.4 consumer status:
//   WIRED:   eco_neural / patron_estable / cascada_eterna / mente_despierta /
//            meta_consciousness / resonancia_profunda / time_dilation (7 effects)
//   STUBBED: deep_listening / cosmic_voice / memoria_longeva / eureka_frecuente /
//            consciencia_eterna / eternal_witness (6 effects — state-owned, engine
//            consumer deferred; these gate features that don't exist yet or need
//            cross-system work outside Sprint 8b's scope)

import type { ResonanceUpgradeDef } from '../types';

export const RESONANCE_UPGRADES: readonly ResonanceUpgradeDef[] = [
  // ─── Tier 1 (P13+) ─────────────────────────────────────
  { id: 'eco_neural',        tier: 1, costResonance:  50, effect: { kind: 'all_production_mult_per_resonance_upgrade', per: 0.05 } },
  { id: 'patron_estable',    tier: 1, costResonance:  50, effect: { kind: 'pattern_cycle_cap_set', cap: 1.8 } },
  { id: 'cascada_eterna',    tier: 1, costResonance:  80, effect: { kind: 'cascade_mult_set', mult: 3.0 } },
  { id: 'deep_listening',    tier: 1, costResonance: 120, effect: { kind: 'inner_voice_dream_mult', mult: 2.0 } },
  { id: 'cosmic_voice',      tier: 1, costResonance: 100, effect: { kind: 'fragment_reread_memory_bonus', memory: 1 } },
  // ─── Tier 2 (P18+, requires ≥1 Tier 1) ────────────────
  { id: 'mente_despierta',   tier: 2, costResonance: 150, effect: { kind: 'focus_fill_rate_mult', mult: 1.25 } },
  { id: 'memoria_longeva',   tier: 2, costResonance: 150, effect: { kind: 'memory_carryover_cap', cap: 3 } },
  { id: 'eureka_frecuente',  tier: 2, costResonance: 200, effect: { kind: 'spontaneous_frequency_mult', mult: 1.3 } },
  { id: 'time_dilation',     tier: 2, costResonance: 250, effect: { kind: 'offline_cap_add_hours', hours: 4 } },
  { id: 'meta_consciousness',tier: 2, costResonance: 300, effect: { kind: 'patterns_per_prestige_mult', mult: 1.5 } },
  // ─── Tier 3 (P23+, requires ≥2 Tier 2) ────────────────
  { id: 'resonancia_profunda', tier: 3, costResonance: 400, effect: { kind: 'resonance_earn_mult', mult: 1.5 } },
  { id: 'consciencia_eterna',  tier: 3, costResonance: 500, effect: { kind: 'unlocks_modo_ascension' } },
  { id: 'eternal_witness',     tier: 3, costResonance: 600, effect: { kind: 'unlocks_dual_archetype' } },
] as const;

export const RESONANCE_UPGRADES_BY_ID: Readonly<Record<string, ResonanceUpgradeDef>> = Object.freeze(
  Object.fromEntries(RESONANCE_UPGRADES.map((u) => [u.id, u])),
);

/** Tier-gate unlock prestige thresholds per GDD §15. */
export const RESONANCE_TIER_UNLOCK_PRESTIGE: Readonly<Record<1 | 2 | 3, number>> = Object.freeze({
  1: 13,
  2: 18,
  3: 23,
});

/** Tier-2 requires ≥1 Tier-1 owned; Tier-3 requires ≥2 Tier-2 owned. GDD §15. */
export const RESONANCE_TIER_PREREQ_COUNTS: Readonly<Record<2 | 3, number>> = Object.freeze({
  2: 1, // ≥1 Tier 1
  3: 2, // ≥2 Tier 2
});
