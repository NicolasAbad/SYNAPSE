// Canonical 5-Region data per GDD §16.
//
// Per CLAUDE.md "Canonical storage file rule", lives in src/config/
// (Gate-3 exempt). Region upgrades themselves live in src/config/upgrades.ts
// (priced in 'memorias') — this file maps each region to its upgradeIds and
// stores unlock-prestige metadata.
//
// Internal RegionId union ('hipocampo' | 'prefrontal' | 'limbico' | 'visual'
// | 'broca') is locked in src/types/index.ts and never translated. Display
// strings live in en.ts via i18n keys `regions.${id}.name`.
//
// Amplitud de Banda (`amplitud_banda` in upgrades.ts) is a META upgrade
// that affects ALL regions. It does NOT belong to a single region — the
// RegionsPanel UI renders it in its own "Meta" section. Constant
// REGION_META_UPGRADE_ID exposed for that consumer.

import type { RegionDef } from '../types';

export const REGIONS: readonly RegionDef[] = [
  {
    id: 'hipocampo',
    nameKey: 'regions.hipocampo.name',
    unlockPrestige: 0,
    // Sprint 7.5.2: legacy `consolidacion_memoria` retired (GDD §16.8). Hipocampo
    // now hosts a typed-shard upgrade tree (Memory Shards) priced in shard currencies,
    // declared in src/config/shards.ts and rendered by RegionsPanel via SHARD_UPGRADES.
    // No `upgradeIds` here keeps the region card legacy-clean; the shard tree renders
    // as a Hipocampo-specific section above this card list.
    upgradeIds: [] as const,
  },
  {
    id: 'prefrontal',
    nameKey: 'regions.prefrontal.name',
    // GDD §16: Corteza Prefrontal "P0 visible, first upgrade needs P2+".
    // The region itself is visible at P0 (greyed/empty); the upgrade
    // (funciones_ejecutivas) carries its own unlockPrestige=2 in upgrades.ts.
    unlockPrestige: 0,
    upgradeIds: ['funciones_ejecutivas'] as const,
  },
  {
    id: 'limbico',
    nameKey: 'regions.limbico.name',
    unlockPrestige: 0,
    // Sprint 7.5.3 §16.3: regulacion_emocional retired (offline path → ondas_theta
    // in `con` category + Mood-applies-offline §19). Límbico card now lists the
    // 6 Mood upgrades in unlock order. The 5-tier Moodometer + 24h chart land
    // alongside this card via a dedicated section component.
    upgradeIds: ['lim_steady_heart', 'lim_empathic_spark', 'lim_resilience', 'lim_elevation', 'lim_euphoric_echo', 'lim_emotional_wisdom'] as const,
  },
  {
    id: 'visual',
    nameKey: 'regions.visual.name',
    unlockPrestige: 0,
    upgradeIds: ['procesamiento_visual'] as const,
  },
  {
    id: 'broca',
    nameKey: 'regions.broca.name',
    // GDD §16: Área de Broca unlocks at P14. Identity layer — no upgrade
    // entries (player names their mind; +1 passive Memory/cycle is engine-
    // driven via SYNAPSE_CONSTANTS.brocaPassiveMemoryPerCycle).
    unlockPrestige: 14,
    upgradeIds: [] as const,
  },
] as const;

export const REGIONS_BY_ID: Readonly<Record<string, RegionDef>> = Object.freeze(
  Object.fromEntries(REGIONS.map((r) => [r.id, r])),
);

/**
 * GDD §16: Amplitud de Banda is a META upgrade — affects ALL regions, not
 * tied to any single one. RegionsPanel renders it in a dedicated "Meta"
 * section above (or below) the per-region columns.
 */
export const REGION_META_UPGRADE_ID = 'amplitud_banda';
