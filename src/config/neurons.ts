// Implements docs/GDD.md §5 (Neurons — 5 types) — canonical storage.
//
// Sprint 1 shipped the raw base-rate + base-cost maps; Sprint 3 Phase 1
// extends this file with NEURON_TYPES ordering, NEURON_CONFIG (unlock
// conditions per §5 "Unlock" column + metadata), and the neuronCost()
// helper (baseCost × costMult^owned, §4 scaling rule).
//
// CANONICAL STORAGE FILE per CLAUDE.md "Canonical storage file rule" —
// this file is excluded from Gate 3's literal count via the src/config/
// rule in scripts/check-invention.sh. Values are copied verbatim from
// GDD §5 table; no logic beyond the cost-scaling helper.

import { SYNAPSE_CONSTANTS } from './constants';
import type { NeuronType } from '../types';

/**
 * Canonical order for the 5 neuron types. Matches GDD §5 table order
 * (unlock progression: basica → sensorial → piramidal → espejo → integradora).
 * Tests + UI iterate in this order for deterministic output.
 */
export const NEURON_TYPES: readonly NeuronType[] = [
  'basica',
  'sensorial',
  'piramidal',
  'espejo',
  'integradora',
] as const;

/** Base production rate (thoughts per second per neuron) from GDD §5 table. */
export const NEURON_BASE_RATES: Record<NeuronType, number> = {
  basica: 0.5,
  sensorial: 4.5,
  piramidal: 32,
  espejo: 220,
  integradora: 1_800,
};

/** Base purchase cost (thoughts) from GDD §5 table. Cost scales via neuronCost() below. */
export const NEURON_BASE_COSTS: Record<NeuronType, number> = {
  basica: 10,
  sensorial: 150,
  piramidal: 2_200,
  espejo: 35_000,
  integradora: 600_000,
};

/**
 * Unlock conditions per GDD §5 "Unlock" column. Discriminated union so the
 * store's unlock-check can mechanically dispatch on `kind` without string parsing.
 *
 * - 'start'        — always available (Básicas)
 * - 'neuron_count' — require ≥N of another type owned (Sensorial/Piramidal/Espejo)
 * - 'prestige'     — require prestigeCount ≥ min (Integradora at Era 2 / P10)
 */
export type NeuronUnlock =
  | { kind: 'start' }
  | { kind: 'neuron_count'; type: NeuronType; count: number }
  | { kind: 'prestige'; min: number };

export interface NeuronConfig {
  type: NeuronType;
  baseCost: number;
  baseRate: number;
  unlock: NeuronUnlock;
}

/**
 * Full per-type config (unlock + base values). Used by the Neurons panel
 * (Sprint 3 Phase 3+) to render unlock gates, by the store's buy action to
 * validate purchases, and by consistency tests to pin §5 values.
 */
export const NEURON_CONFIG: Record<NeuronType, NeuronConfig> = {
  basica: { type: 'basica', baseCost: 10, baseRate: 0.5, unlock: { kind: 'start' } },
  sensorial: { type: 'sensorial', baseCost: 150, baseRate: 4.5, unlock: { kind: 'neuron_count', type: 'basica', count: 10 } },
  piramidal: { type: 'piramidal', baseCost: 2_200, baseRate: 32, unlock: { kind: 'neuron_count', type: 'sensorial', count: 5 } },
  espejo: { type: 'espejo', baseCost: 35_000, baseRate: 220, unlock: { kind: 'neuron_count', type: 'piramidal', count: 5 } },
  integradora: { type: 'integradora', baseCost: 600_000, baseRate: 1_800, unlock: { kind: 'prestige', min: 10 } },
};

/**
 * Purchase cost for the next neuron of `type` given the current owned count.
 * GDD §4 scaling: `baseCost × costMult^owned` where `costMult = 1.28`.
 *
 * Engine is deterministic (CODE-9) — no rounding here; UI floors on display.
 */
export function neuronCost(type: NeuronType, owned: number): number {
  return NEURON_BASE_COSTS[type] * Math.pow(SYNAPSE_CONSTANTS.costMult, owned);
}
