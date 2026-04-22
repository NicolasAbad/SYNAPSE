// Canonical 15-Mutation pool per GDD §13.
//
// Per CLAUDE.md "Canonical storage file rule", this file lives under
// src/config/ (Gate-3 exempt). Per-mutation tuning values are inlined as
// data, NOT pulled from constants.ts — this file IS the source of truth.
//
// Internal IDs are Spanish snake_case (locked, never translated per
// CLAUDE.md Glossary discipline). Player-facing strings live in
// src/config/strings/{lang}.ts via i18n keys `mutations.${id}.name` and
// `mutations.${id}.description`.
//
// MutationEffect discriminated union is defined in src/types/index.ts
// — one kind per row so engine consumers branch on `.kind` for typed
// runtime behavior (production / discharge / cost / focus / etc.).

import type { Mutation } from '../types';

export const MUTATIONS: readonly Mutation[] = [
  {
    id: 'eficiencia_neural',
    nameKey: 'mutations.eficiencia_neural.name',
    descriptionKey: 'mutations.eficiencia_neural.description',
    category: 'produccion',
    affectsOffline: false,
    effect: { kind: 'neural_efficiency', neuronCostMult: 0.6, neuronProdMult: 0.75 },
  },
  {
    id: 'hiperestimulacion',
    nameKey: 'mutations.hiperestimulacion.name',
    descriptionKey: 'mutations.hiperestimulacion.description',
    category: 'produccion',
    affectsOffline: false,
    effect: { kind: 'hyperstimulation', prodMult: 2.0, focusFillMult: 0.5 },
  },
  {
    id: 'descarga_rapida',
    nameKey: 'mutations.descarga_rapida.name',
    descriptionKey: 'mutations.descarga_rapida.description',
    category: 'disparo',
    affectsOffline: false,
    effect: { kind: 'rapid_discharge', chargeIntervalMin: 12, dischargeBonusMult: 0.6 },
  },
  {
    id: 'disparo_concentrado',
    nameKey: 'mutations.disparo_concentrado.name',
    descriptionKey: 'mutations.disparo_concentrado.description',
    category: 'disparo',
    affectsOffline: false,
    effect: { kind: 'focused_discharge', dischargeMult: 3.0, maxCharges: 1 },
  },
  {
    id: 'neuroplasticidad',
    nameKey: 'mutations.neuroplasticidad.name',
    descriptionKey: 'mutations.neuroplasticidad.description',
    category: 'upgrade',
    affectsOffline: false,
    effect: {
      kind: 'neuroplasticity',
      upgradeCostMult: 0.5,
      postThresholdEffectMult: 0.6,
      consciousnessThreshold: 0.5,
    },
  },
  {
    id: 'especializacion',
    nameKey: 'mutations.especializacion.name',
    descriptionKey: 'mutations.especializacion.description',
    category: 'restriccion',
    affectsOffline: false,
    effect: { kind: 'specialization', selectedTypeProdMult: 4.0 },
  },
  {
    id: 'focus_acelerado',
    nameKey: 'mutations.focus_acelerado.name',
    descriptionKey: 'mutations.focus_acelerado.description',
    category: 'focus',
    affectsOffline: false,
    effect: { kind: 'accelerated_focus', focusFillMult: 3.0, insightDurationS: 5 },
  },
  {
    id: 'meditacion',
    nameKey: 'mutations.meditacion.name',
    descriptionKey: 'mutations.meditacion.description',
    category: 'focus',
    affectsOffline: false,
    effect: { kind: 'meditation', passiveFocusFillRatio: 0.25 },
  },
  {
    id: 'region_dominante',
    nameKey: 'mutations.region_dominante.name',
    descriptionKey: 'mutations.region_dominante.description',
    category: 'regions',
    affectsOffline: false,
    effect: { kind: 'dominant_region', dominantMult: 3.0, otherMult: 0.5 },
  },
  {
    id: 'memoria_fragil',
    nameKey: 'mutations.memoria_fragil.name',
    descriptionKey: 'mutations.memoria_fragil.description',
    category: 'memorias',
    affectsOffline: false,
    effect: {
      kind: 'fragile_memory',
      memoryGainMult: 2.0,
      penaltyMemories: 1,
      penaltyThresholdMin: 20,
    },
  },
  {
    // GDD §13 #11: "Sprint" stays English in source. Internal id matches.
    id: 'sprint',
    nameKey: 'mutations.sprint.name',
    descriptionKey: 'mutations.sprint.description',
    category: 'temporal',
    // MUT-1: temporal mutations affect offline (averaged production).
    affectsOffline: true,
    effect: { kind: 'sprint', earlyMult: 5.0, lateMult: 0.5, splitMin: 5 },
  },
  {
    id: 'crescendo',
    nameKey: 'mutations.crescendo.name',
    descriptionKey: 'mutations.crescendo.description',
    category: 'temporal',
    affectsOffline: true, // MUT-1: linear-with-consciousness is offline-affecting.
    effect: { kind: 'crescendo', startMult: 0.2, endMult: 3.0 },
  },
  {
    id: 'sinestesia',
    nameKey: 'mutations.sinestesia.name',
    descriptionKey: 'mutations.sinestesia.description',
    category: 'especial',
    affectsOffline: false,
    effect: { kind: 'synesthesia', tapsPerMemory: 500, tapThoughtMult: 0.4 },
  },
  {
    id: 'deja_vu',
    nameKey: 'mutations.deja_vu.name',
    descriptionKey: 'mutations.deja_vu.description',
    category: 'especial',
    affectsOffline: false,
    effect: { kind: 'deja_vu', upgradeCostMult: 2.0 },
  },
  {
    id: 'mente_dividida',
    nameKey: 'mutations.mente_dividida.name',
    descriptionKey: 'mutations.mente_dividida.description',
    category: 'especial',
    affectsOffline: false,
    effect: { kind: 'divided_mind', insightLevelMult: 0.5, focusBars: 2 },
  },
] as const;

export const MUTATIONS_BY_ID: Readonly<Record<string, Mutation>> = Object.freeze(
  Object.fromEntries(MUTATIONS.map((m) => [m.id, m])),
);

/**
 * MUT-3 (GDD §13): on the first cycle of a Run (`prestigeCount === 0`),
 * filter mutations that reference "previous cycle" state to prevent
 * Transcendence-break edge cases.
 *
 * Currently flagged: Déjà Vu (carries upgrades), Neuroplasticidad
 * (post-50%-consciousness behavior is fine alone but pairs poorly with
 * fresh state per GDD §13 INT-6 fix). If GDD adds rows here, update
 * this set in lockstep.
 */
export const MUT3_FIRST_CYCLE_FILTER: ReadonlySet<string> = new Set(['deja_vu', 'neuroplasticidad']);
