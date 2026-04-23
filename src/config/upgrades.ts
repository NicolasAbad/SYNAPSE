// Implements docs/GDD.md §24 (The 34 upgrades, categorized) — canonical storage.
//
// CANONICAL STORAGE FILE per CLAUDE.md "Canonical storage file rule" —
// this file is the source of truth for the 34 upgrade definitions. It
// contains ONLY data (no logic). All game-logic values (cost, effect
// parameters) are copied verbatim from GDD §24 tables + §16 Regions table
// (Region upgrades priced in Memorias). Gate 3 (constants coverage) of
// scripts/check-invention.sh excludes this file from the literal count —
// the 34 upgrade costs are canonical spec values, not inventions.
//
// Display names: approved English translations per Sprint 3 Phase 1 kickoff
// (Nico approval, see PROGRESS.md). Effect descriptions live in
// src/config/strings/en.ts under the `upgrades` domain per CODE-1.
//
// Internal IDs (snake_case) stay Spanish-origin per CLAUDE.md Glossary —
// never player-facing; user-facing labels flow through `t('upgrades.${id}.name')`.
//
// Scope: Sprint 3 Phase 1 ships the data shape only. Phase 2 wires each
// `kind` into the production/focus/discharge stack. No behavior change here.

import type { UpgradeDef } from '../types';

/**
 * The 40 upgrades per GDD §24 (v1.0, excluding the 4 run-exclusive in §21, the
 * Resonance upgrades in §15, and the 6 Hipocampo shard upgrades in shards.ts).
 * Sprint 7.5.2 retired `consolidacion_memoria`; Sprint 7.5.3 retired
 * `regulacion_emocional` AND added 6 Límbico mood upgrades + ondas_theta.
 *
 * Category counts: tap=3, foc=1, syn=5, neu=8, reg=9 (3 surviving regions +
 * 6 Límbico mood markers), con=5 (incl. ondas_theta), met=3, new=6. Total=40.
 */
export const UPGRADES: readonly UpgradeDef[] = [
  // ── Tap (⚡, 3) ──
  { id: 'potencial_sinaptico', category: 'tap', cost: 5_000, costCurrency: 'thoughts', unlockPrestige: 0, effect: { kind: 'tap_replace_pct', pct: 0.10 } },
  { id: 'mielina', category: 'tap', cost: 15_000, costCurrency: 'thoughts', unlockPrestige: 0, effect: { kind: 'tap_focus_fill_add', add: 0.02 } },
  { id: 'dopamina', category: 'tap', cost: 80_000, costCurrency: 'thoughts', unlockPrestige: 2, effect: { kind: 'tap_bonus_mult', mult: 1.5 } },

  // ── Focus (🎯, 1) ──
  { id: 'concentracion_profunda', category: 'foc', cost: 25_000, costCurrency: 'thoughts', unlockPrestige: 4, effect: { kind: 'focus_fill_mult', focusMult: 2, insightDurationAddS: 5 } },

  // ── Synapsis / Discharge (◎, 5) ──
  { id: 'descarga_neural', category: 'syn', cost: 8_000, costCurrency: 'thoughts', unlockPrestige: 0, effect: { kind: 'discharge_max_charges_add', add: 1 } },
  { id: 'amplificador_de_disparo', category: 'syn', cost: 40_000, costCurrency: 'thoughts', unlockPrestige: 2, effect: { kind: 'discharge_mult', mult: 1.5 } },
  { id: 'red_alta_velocidad', category: 'syn', cost: 100_000, costCurrency: 'thoughts', unlockPrestige: 2, effect: { kind: 'charge_rate_mult', mult: 1.25 } },
  { id: 'cascada_profunda', category: 'syn', cost: 200_000, costCurrency: 'thoughts', unlockPrestige: 4, effect: { kind: 'cascade_mult_double' } },
  { id: 'sincronizacion_total', category: 'syn', cost: 500_000, costCurrency: 'thoughts', unlockPrestige: 5, effect: { kind: 'post_cascade_focus_refund', amount: 0.18 } },

  // ── Neurons (⬡, 8) ──
  { id: 'red_neuronal_densa', category: 'neu', cost: 3_000, costCurrency: 'thoughts', unlockPrestige: 0, effect: { kind: 'all_neurons_mult', mult: 1.25 } },
  { id: 'receptores_ampa', category: 'neu', cost: 12_000, costCurrency: 'thoughts', unlockPrestige: 1, effect: { kind: 'neuron_type_mult', neuronType: 'basica', mult: 2 } },
  { id: 'transduccion_sensorial', category: 'neu', cost: 50_000, costCurrency: 'thoughts', unlockPrestige: 1, effect: { kind: 'neuron_type_mult', neuronType: 'sensorial', mult: 3 } },
  { id: 'axones_proyeccion', category: 'neu', cost: 180_000, costCurrency: 'thoughts', unlockPrestige: 2, effect: { kind: 'neuron_type_mult', neuronType: 'piramidal', mult: 3 } },
  { id: 'sincronia_neural', category: 'neu', cost: 600_000, costCurrency: 'thoughts', unlockPrestige: 2, effect: { kind: 'connection_mult_double' } },
  { id: 'ltp_potenciacion_larga', category: 'neu', cost: 2_000_000, costCurrency: 'thoughts', unlockPrestige: 3, effect: { kind: 'all_neurons_mult', mult: 1.5 } },
  { id: 'espejo_resonantes', category: 'neu', cost: 150_000, costCurrency: 'thoughts', unlockPrestige: 2, effect: { kind: 'neuron_type_mult', neuronType: 'espejo', mult: 4 } },
  { id: 'neurogenesis', category: 'neu', cost: 5_000_000, costCurrency: 'thoughts', unlockPrestige: 5, effect: { kind: 'all_neurons_mult', mult: 1.10 } },

  // ── Regions (◈, 3) — costs in Memorias per GDD §16. Sprint 7.5.2 retired
  // `consolidacion_memoria` (effect absorbed into Hipocampo shard_emo_resonance,
  // GDD §16.8). Sprint 7.5.3 retired `regulacion_emocional` (offline path moved
  // to new `ondas_theta` upgrade in `con` category + Mood-applies-offline §19);
  // procesamiento_visual retires Sprint 7.5.5 with the Visual Foresight engine. ──
  { id: 'procesamiento_visual', category: 'reg', cost: 8, costCurrency: 'memorias', unlockPrestige: 0, effect: { kind: 'best_upgrade_indicator' } },
  { id: 'funciones_ejecutivas', category: 'reg', cost: 3, costCurrency: 'memorias', unlockPrestige: 2, effect: { kind: 'upgrade_cost_reduction', pct: 0.20 } },
  { id: 'amplitud_banda', category: 'reg', cost: 15, costCurrency: 'memorias', unlockPrestige: 2, effect: { kind: 'region_upgrades_boost', mult: 1.5 } },

  // ── Límbico (lim, 6) — Sprint 7.5.3 §16.3 Mood upgrades, Memorias-priced.
  // Effects consumed by src/engine/mood.ts (lim_steady_heart for offline mood
  // decay halving, others wired via ownsLimUpgrade helper). All have inline
  // tuning literals justified by GDD §16.3 table cell values (CONST-OK at
  // engine-side helpers). Effect kind 'limbico_passive' is a marker — engine
  // consumers branch on owned-id, not effect.kind shape. ──
  { id: 'lim_steady_heart',     category: 'reg', cost: 3,  costCurrency: 'memorias', unlockPrestige: 5,  effect: { kind: 'mood_passive_marker' } },
  { id: 'lim_empathic_spark',   category: 'reg', cost: 5,  costCurrency: 'memorias', unlockPrestige: 5,  effect: { kind: 'mood_passive_marker' } },
  { id: 'lim_resilience',       category: 'reg', cost: 8,  costCurrency: 'memorias', unlockPrestige: 8,  effect: { kind: 'mood_passive_marker' } },
  { id: 'lim_elevation',        category: 'reg', cost: 12, costCurrency: 'memorias', unlockPrestige: 10, effect: { kind: 'mood_passive_marker' } },
  { id: 'lim_euphoric_echo',    category: 'reg', cost: 20, costCurrency: 'memorias', unlockPrestige: 13, effect: { kind: 'mood_passive_marker' } },
  { id: 'lim_emotional_wisdom', category: 'reg', cost: 30, costCurrency: 'memorias', unlockPrestige: 15, effect: { kind: 'mood_passive_marker' } },

  // ── Consciousness & Offline (✦, 5) — Sprint 7.5.3 added `ondas_theta` (replaces
  // retired `regulacion_emocional`'s offline path; Thoughts-priced per GDD §24 Wave 2). ──
  { id: 'sueno_rem', category: 'con', cost: 50_000, costCurrency: 'thoughts', unlockPrestige: 0, effect: { kind: 'offline_cap_set', hours: 8 } },
  { id: 'umbral_consciencia', category: 'con', cost: 100_000, costCurrency: 'thoughts', unlockPrestige: 0, effect: { kind: 'consciousness_fill_mult', mult: 1.3 } },
  { id: 'ritmo_circadiano', category: 'con', cost: 200_000, costCurrency: 'thoughts', unlockPrestige: 2, effect: { kind: 'offline_efficiency_and_autocharge', mult: 1.5 } },
  { id: 'hiperconciencia', category: 'con', cost: 500_000, costCurrency: 'thoughts', unlockPrestige: 4, effect: { kind: 'consciousness_fill_mult', mult: 2 } },
  { id: 'ondas_theta', category: 'con', cost: 300_000, costCurrency: 'thoughts', unlockPrestige: 3, effect: { kind: 'offline_efficiency_mult', mult: 2 } },

  // ── Meta (∞, 3) ──
  { id: 'retroalimentacion_positiva', category: 'met', cost: 1_000_000, costCurrency: 'thoughts', unlockPrestige: 6, effect: { kind: 'all_production_mult', mult: 2 } },
  { id: 'emergencia_cognitiva', category: 'met', cost: 3_000_000, costCurrency: 'thoughts', unlockPrestige: 6, effect: { kind: 'upgrades_scaling_mult', perBucket: 1.5, bucketSize: 5, capMult: 5 } },
  { id: 'singularidad', category: 'met', cost: 10_000_000, costCurrency: 'thoughts', unlockPrestige: 8, effect: { kind: 'prestige_scaling_mult', perPrestige: 1.01 } },

  // ── Tier P10 — Era 2 (★, 6) ──
  { id: 'convergencia_sinaptica', category: 'new', cost: 200_000, costCurrency: 'thoughts', unlockPrestige: 10, effect: { kind: 'lifetime_prestige_add', perLp: 0.015, capAdd: 0.40 } },
  { id: 'consciencia_distribuida', category: 'new', cost: 150_000, costCurrency: 'thoughts', unlockPrestige: 10, effect: { kind: 'offline_cap_set', hours: 12 } },
  { id: 'potencial_latente', category: 'new', cost: 300_000, costCurrency: 'thoughts', unlockPrestige: 10, effect: { kind: 'discharge_prestige_bonus', base: 1_000 } },
  { id: 'resonancia_acumulada', category: 'new', cost: 350_000, costCurrency: 'thoughts', unlockPrestige: 10, effect: { kind: 'post_offline_discharge_bonus', perHour: 0.05, capAdd: 1.0 } },
  { id: 'sintesis_cognitiva', category: 'new', cost: 800_000, costCurrency: 'thoughts', unlockPrestige: 13, effect: { kind: 'pattern_flat_mult', mult: 2 } },
  { id: 'focus_persistente', category: 'new', cost: 600_000, costCurrency: 'thoughts', unlockPrestige: 12, effect: { kind: 'focus_persist', pct: 0.25 } },
] as const;

/** Quick index by id for O(1) lookup. Frozen snapshot of UPGRADES. */
export const UPGRADES_BY_ID: Readonly<Record<string, UpgradeDef>> = Object.freeze(
  UPGRADES.reduce<Record<string, UpgradeDef>>((acc, u) => {
    acc[u.id] = u;
    return acc;
  }, {}),
);
