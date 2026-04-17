// Implements docs/GDD.md §5 (Neurons — 5 types) — base spec values.
//
// Scope: Sprint 1 ships ONLY the base rates and base costs from §5 table.
// Sprint 3 adds full neuron metadata: unlock conditions (e.g., "10 Básicas
// owned" for Sensorial), display names + localized strings, cost-scaling
// helpers, per-type canvas rendering config, and analytics event wiring.
//
// Data here is spec, not scaffolding — values copied verbatim from GDD §5.

import type { NeuronType } from '../types';

/** Base production rate (thoughts per second per neuron) from GDD §5 table. */
export const NEURON_BASE_RATES: Record<NeuronType, number> = {
  basica: 0.5,
  sensorial: 4.5,
  piramidal: 32,
  espejo: 220,
  integradora: 1_800,
};

/** Base purchase cost (thoughts) from GDD §5 table. Cost scales by `costMult^owned` (§4). */
export const NEURON_BASE_COSTS: Record<NeuronType, number> = {
  basica: 10,
  sensorial: 150,
  piramidal: 2_200,
  espejo: 35_000,
  integradora: 600_000,
};

// TODO Sprint 3: add unlock conditions — Sensorial needs 10 Básicas, Piramidal
// needs 5 Sensoriales, Espejo needs 5 Piramidales, Integradora unlocks at P10+.
// See GDD §5 "Unlock" column.
// TODO Sprint 3: add display metadata — localized name + effect description strings,
// canvas render hints (color, size scale, glow), unlock-tease copy.
// TODO Sprint 3: add helper neuronCost(type, owned) = baseCost × costMult^owned.
