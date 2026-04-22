// Canonical 12 Spontaneous events per GDD §8. Internal ids snake_case
// Spanish (code-only, never player-facing); display name + description via
// i18n. Weights live in SYNAPSE_CONSTANTS.spontaneousWeights by type.
// Picker (engine/spontaneous.ts) does two-step: weighted type roll, then
// uniform pick within type pool.
//
// Sprint 6 Phase 6.4 translations approved pre-code (en.ts):
//   eureka → "Eureka"
//   rafaga_dopaminica → "Dopamine Burst"
//   claridad_momentanea → "Fleeting Clarity"
//   conexion_profunda → "Deep Connection"
//   disparo_latente → "Latent Discharge"
//   memoria_fugaz → "Fleeting Memory"
//   polaridad_fluctuante → "Polarity Flux"
//   mutacion_temporal → "Temporal Mutation"
//   eco_distante → "Distant Echo"
//   pausa_neural → "Neural Pause"
//   fatiga_sinaptica → "Synaptic Fatigue"
//   interferencia → "Interference"

import type { SpontaneousDef } from '../types';

export const SPONTANEOUS_EVENTS: readonly SpontaneousDef[] = [
  // ── Positive (50%) ──────────────────────────────────────
  {
    id: 'eureka',
    nameKey: 'spontaneous.eureka.name',
    descriptionKey: 'spontaneous.eureka.description',
    type: 'positive',
    effect: { kind: 'free_next_upgrade' },
  },
  {
    id: 'rafaga_dopaminica',
    nameKey: 'spontaneous.rafaga_dopaminica.name',
    descriptionKey: 'spontaneous.rafaga_dopaminica.description',
    type: 'positive',
    effect: { kind: 'production_mult', mult: 2.0, durationMs: 30_000 },
  },
  {
    id: 'claridad_momentanea',
    nameKey: 'spontaneous.claridad_momentanea.name',
    descriptionKey: 'spontaneous.claridad_momentanea.description',
    type: 'positive',
    effect: { kind: 'focus_fill_mult', mult: 3.0, durationMs: 45_000 },
  },
  {
    id: 'conexion_profunda',
    nameKey: 'spontaneous.conexion_profunda.name',
    descriptionKey: 'spontaneous.conexion_profunda.description',
    type: 'positive',
    effect: { kind: 'connection_mult', mult: 2.0, durationMs: 60_000 },
  },
  {
    id: 'disparo_latente',
    nameKey: 'spontaneous.disparo_latente.name',
    descriptionKey: 'spontaneous.disparo_latente.description',
    type: 'positive',
    effect: { kind: 'discharge_charge_add', add: 1 },
  },
  {
    id: 'memoria_fugaz',
    nameKey: 'spontaneous.memoria_fugaz.name',
    descriptionKey: 'spontaneous.memoria_fugaz.description',
    type: 'positive',
    effect: { kind: 'memory_add', add: 1 },
  },
  // ── Neutral (33%) ───────────────────────────────────────
  {
    id: 'polaridad_fluctuante',
    nameKey: 'spontaneous.polaridad_fluctuante.name',
    descriptionKey: 'spontaneous.polaridad_fluctuante.description',
    type: 'neutral',
    effect: { kind: 'polarity_reverse', durationMs: 45_000 },
  },
  {
    id: 'mutacion_temporal',
    nameKey: 'spontaneous.mutacion_temporal.name',
    descriptionKey: 'spontaneous.mutacion_temporal.description',
    type: 'neutral',
    effect: { kind: 'mutation_stack_random', durationMs: 60_000 },
  },
  {
    id: 'eco_distante',
    nameKey: 'spontaneous.eco_distante.name',
    descriptionKey: 'spontaneous.eco_distante.description',
    type: 'neutral',
    effect: { kind: 'extra_fragment' },
  },
  {
    id: 'pausa_neural',
    nameKey: 'spontaneous.pausa_neural.name',
    descriptionKey: 'spontaneous.pausa_neural.description',
    type: 'neutral',
    effect: { kind: 'production_and_focus_mult', prodMult: 0, focusMult: 5.0, durationMs: 10_000 },
  },
  // ── Negative (17%) ──────────────────────────────────────
  {
    id: 'fatiga_sinaptica',
    nameKey: 'spontaneous.fatiga_sinaptica.name',
    descriptionKey: 'spontaneous.fatiga_sinaptica.description',
    type: 'negative',
    effect: { kind: 'production_mult', mult: 0.7, durationMs: 45_000 },
  },
  {
    id: 'interferencia',
    nameKey: 'spontaneous.interferencia.name',
    descriptionKey: 'spontaneous.interferencia.description',
    type: 'negative',
    effect: { kind: 'focus_reset' },
  },
];

export const SPONTANEOUS_BY_ID: Readonly<Record<string, SpontaneousDef>> = Object.freeze(
  Object.fromEntries(SPONTANEOUS_EVENTS.map((e) => [e.id, e])),
);

export const SPONTANEOUS_BY_TYPE: Readonly<Record<'positive' | 'neutral' | 'negative', readonly SpontaneousDef[]>> = {
  positive: SPONTANEOUS_EVENTS.filter((e) => e.type === 'positive'),
  neutral: SPONTANEOUS_EVENTS.filter((e) => e.type === 'neutral'),
  negative: SPONTANEOUS_EVENTS.filter((e) => e.type === 'negative'),
};
