// Canonical 3-Archetype data per GDD §12. Irreversible-for-Run choice at P5+.
//
// Per CLAUDE.md "Canonical storage file rule", lives in src/config/
// (Gate-3 exempt). Per-archetype bonus values inlined as data — this file
// is the source of truth for Archetype effects.
//
// Internal ID union ('analitica' | 'empatica' | 'creativa') is locked
// in src/types/index.ts (`Archetype` type) and never translated. Display
// strings live in src/config/strings/{lang}.ts via i18n keys.
//
// Permanent for the Run — cannot change until Transcendence (GDD §12 +
// §34 TRANSCENDENCE_RESET). Each archetype unlocks 15 exclusive narrative
// fragments (Phase 6.3).

import type { ArchetypeDef } from '../types';

export const ARCHETYPES: readonly ArchetypeDef[] = [
  {
    id: 'analitica',
    nameKey: 'archetypes.analitica.name',
    descriptionKey: 'archetypes.analitica.description',
    bonuses: {
      activeProductionMult: 1.15, // GDD §12 Analítica
      focusFillRateMult: 1.25,
      insightDurationAddSec: 2,
    },
  },
  {
    id: 'empatica',
    nameKey: 'archetypes.empatica.name',
    descriptionKey: 'archetypes.empatica.description',
    bonuses: {
      offlineEfficiencyMult: 2.5, // GDD §12 Empática — stacks into OFFLINE-4 cap (2.0 final ratio)
      lucidDreamRate: 1.0, // 100% vs 0.33 default (P10+)
      activeProductionMult: 0.85, // active tradeoff
      memoryMult: 1.25,
    },
  },
  {
    id: 'creativa',
    nameKey: 'archetypes.creativa.name',
    descriptionKey: 'archetypes.creativa.description',
    bonuses: {
      mutationBonusOptions: 1, // GDD §12 Creativa — matches SYNAPSE_CONSTANTS.creativaMutationBonusOptions
      resonanceGainMult: 1.5,
      spontaneousEventRateMult: 1.5,
    },
  },
] as const;

export const ARCHETYPES_BY_ID: Readonly<Record<string, ArchetypeDef>> = Object.freeze(
  Object.fromEntries(ARCHETYPES.map((a) => [a.id, a])),
);
