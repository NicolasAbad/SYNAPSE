// Canonical 3-Pathway data per GDD §14.
//
// Per CLAUDE.md "Canonical storage file rule", lives in src/config/
// (Gate-3 exempt). Per-pathway tuning values inlined as data — this file
// is the source of truth for Pathway gating + bonuses.
//
// Internal ID union ('rapida' | 'profunda' | 'equilibrada') is locked
// in src/types/index.ts (`Pathway` type) and never translated. Display
// strings live in src/config/strings/{lang}.ts via i18n keys.
//
// ENABLES / BLOCKS semantics (per GDD §14 + AI check #6 in SPRINTS.md):
// Each Pathway lists enables + blocks explicitly per spec. A category not
// in EITHER list defaults to enabled (PATH-1 only greys explicit blocks).
// `isUpgradeBlocked(pathway, category)` checks BLOCKS only.

import type { PathwayDef } from '../types';

export const PATHWAYS: readonly PathwayDef[] = [
  {
    id: 'rapida',
    nameKey: 'pathways.rapida.name',
    descriptionKey: 'pathways.rapida.description',
    enables: ['tap', 'foc', 'syn', 'met'] as const,
    blocks: ['reg', 'con', 'new'] as const,
    pathwayCostMod: 1.0,
    bonuses: {
      insightDurationMult: 2.0, // GDD §14 Rápida bonus
      chargeRateMult: 1.5,
    },
  },
  {
    id: 'profunda',
    nameKey: 'pathways.profunda.name',
    descriptionKey: 'pathways.profunda.description',
    enables: ['neu', 'reg', 'con', 'new'] as const,
    blocks: ['tap', 'foc', 'syn'] as const,
    pathwayCostMod: 1.0,
    bonuses: {
      memoriesPerPrestigeMult: 2.0, // GDD §14 Profunda bonus
      focusFillRateMult: 0.5, // pathway malus per spec
    },
  },
  {
    id: 'equilibrada',
    nameKey: 'pathways.equilibrada.name',
    descriptionKey: 'pathways.equilibrada.description',
    // GDD §14 "Enables: ALL — Blocks: NONE". Listing all 8 explicitly
    // so reasoning is local — readers don't have to infer "all" elsewhere.
    enables: ['tap', 'foc', 'syn', 'neu', 'reg', 'con', 'met', 'new'] as const,
    blocks: [] as const,
    pathwayCostMod: 1.0,
    bonuses: {
      // GDD §14: "all upgrade bonuses ×0.85". Cross-cutting modifier wired
      // into production formula via SYNAPSE_CONSTANTS.pathwayEquilibradaBonusMult.
      upgradeBonusMult: 0.85,
    },
  },
] as const;

export const PATHWAYS_BY_ID: Readonly<Record<string, PathwayDef>> = Object.freeze(
  Object.fromEntries(PATHWAYS.map((p) => [p.id, p])),
);
