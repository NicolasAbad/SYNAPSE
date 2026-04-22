// Implements GDD.md §13 Mutations + GDD §35 CODE-9 (engine purity).
//
// Pure helpers — no Math.random(), no Date.now(). Seeds derived deterministic-
// ally from cycleStartTimestamp + prestigeCount (MUT-2). All consumers branch
// on `state.currentMutation?.id` and the corresponding entry in
// MUTATIONS_BY_ID; this module provides the shared math.
//
// Phase 5.2 scope: getMutationOptions (MUT-2/3/4), production / discharge /
// cost helpers covering the SIMPLE-effect mutations (#1-5, #14). Time-based
// (#11 Sprint, #12 Crescendo), tap-based (#13 Sinestesia), and refactor-
// requiring (#15 Mente Dividida) effects are intentionally not wired here —
// each is owned by Phase 5.6 (tests + close) or a follow-up sprint, and the
// helpers return identity in those cases so a player picking those mutations
// gets the headline effect (e.g., Sprint #11 still grants prod ×5 baseline
// via mutationProdMult).

import type { GameState } from '../types/GameState';
import type { Mutation } from '../types';
import { MUTATIONS, MUTATIONS_BY_ID, MUT3_FIRST_CYCLE_FILTER } from '../config/mutations';
import { SYNAPSE_CONSTANTS } from '../config/constants';
import { hash, mulberry32 } from './rng';
import { era3MutationBonusOptions } from './era3';

/**
 * MUT-2: deterministic seed for the Mutation pool draw.
 * Combines cycleStartTimestamp + prestigeCount into a single 32-bit seed via
 * FNV-1a over the joined string. Same (timestamp, prestige) → same options.
 */
export function mutationSeed(cycleStartTimestamp: number, prestigeCount: number): number {
  return hash(`${cycleStartTimestamp}_${prestigeCount}`);
}

/**
 * GDD §13: returns the N Mutation cards drawn for the current cycle.
 * N defaults to `mutationOptionsPerCycle` (3). Add bonuses per archetype
 * (Creativa +1) and Genius Pass (+1). Pattern Tree Node 48 B option B
 * may further `mutation_options_add` (Sprint 4b stub now consumed here).
 *
 * Filters applied (in order):
 *   - MUT-2: lastMutationId excluded (no two cycles in a row).
 *   - MUT-3: prestigeCount === 0 → exclude MUT3_FIRST_CYCLE_FILTER set.
 *   - MUT-4: weeklyChallengeNeuronType set → if Especialización draws,
 *     swap-replace with another option (no challenge-trap).
 *
 * Draw is sampling-without-replacement via mulberry32 keyed on
 * mutationSeed(timestamp, prestigeCount).
 */
export interface MutationOptionsContext {
  /** Sprint 4b Node 48 B grants `mutation_options_add` patterns. Pass the bonus from patternDecisions effects. */
  patternBonusOptions?: number;
  /** Sprint 6: Creativa archetype +1. Pass true once Archetype state ships. */
  creativaArchetype?: boolean;
  /** Sprint 9 monetization: Genius Pass +1. */
  geniusPass?: boolean;
  /** MUT-4 (INT-10): if active Weekly Challenge targets neuron type, filter Especialización. */
  weeklyChallengeNeuronType?: string | null;
}

export function getMutationOptions(state: GameState, ctx: MutationOptionsContext = {}): Mutation[] {
  const lastMutationId = state.currentMutation?.id ?? state.lastCycleConfig?.mutation ?? '';
  const baseN = SYNAPSE_CONSTANTS.mutationOptionsPerCycle;
  const archetypeBonus = ctx.creativaArchetype ? SYNAPSE_CONSTANTS.creativaMutationBonusOptions : 0;
  const geniusBonus = ctx.geniusPass ? SYNAPSE_CONSTANTS.geniusPassMutationBonusOptions : 0;
  const patternBonus = ctx.patternBonusOptions ?? 0;
  // GDD §23 P19 First Fracture: Mutations offer +2 options (5 vs 3) this cycle.
  const era3Bonus = era3MutationBonusOptions(state);
  const targetN = baseN + archetypeBonus + geniusBonus + patternBonus + era3Bonus;

  // Build candidate pool: full pool minus MUT-2 (last) minus MUT-3 (first cycle).
  const isFirstCycle = state.prestigeCount === 0;
  const pool = MUTATIONS.filter((m) => {
    if (m.id === lastMutationId) return false;
    if (isFirstCycle && MUT3_FIRST_CYCLE_FILTER.has(m.id)) return false;
    return true;
  });

  // Sample without replacement using a single mulberry32 advanced per pick.
  const rng = mulberry32(mutationSeed(state.cycleStartTimestamp, state.prestigeCount));
  const remaining = [...pool];
  const draw: Mutation[] = [];
  while (draw.length < targetN && remaining.length > 0) {
    const idx = Math.floor(rng() * remaining.length);
    draw.push(remaining[idx]);
    remaining.splice(idx, 1);
  }

  // MUT-4: if active Weekly Challenge targets a neuron type and Especialización
  // is in the draw, swap it for another option from `remaining` (cleanest path
  // — Sprint 7 will refine when Weekly Challenge state lands).
  if (ctx.weeklyChallengeNeuronType) {
    const espIdx = draw.findIndex((m) => m.id === 'especializacion');
    if (espIdx !== -1 && remaining.length > 0) {
      const replacement = remaining[Math.floor(rng() * remaining.length)];
      draw[espIdx] = replacement;
    }
  }

  return draw;
}

// ─── Per-mutation effect helpers ────────────────────────────────────────
// All helpers take state and return identity (1.0) when no current mutation
// or when current mutation's effect doesn't apply to that consumer slot.
// Time-based / state-mutating mutations (Sprint, Crescendo, Sinestesia,
// Mente Dividida) are deferred — those helpers return identity here.

function activeMutation(state: GameState): Mutation | null {
  const id = state.currentMutation?.id;
  return id ? MUTATIONS_BY_ID[id] ?? null : null;
}

/** Production multiplier from the active mutation (cycle-time-independent only). */
export function mutationProdMult(state: GameState): number {
  const m = activeMutation(state);
  if (!m) return 1;
  const e = m.effect;
  if (e.kind === 'neural_efficiency') return e.neuronProdMult;
  if (e.kind === 'hyperstimulation') return e.prodMult;
  // Especialización doubles down on the chosen type — but we apply that at the
  // per-type production split (Phase 5.4 / Region Dominant pairing). Returns 1
  // here so the cycle-wide rate doesn't double-count.
  return 1;
}

/** Discharge bonus multiplier — applied to the Discharge yield per GDD §13 #3/#4. */
export function mutationDischargeMult(state: GameState): number {
  const m = activeMutation(state);
  if (!m) return 1;
  const e = m.effect;
  if (e.kind === 'rapid_discharge') return e.dischargeBonusMult;
  if (e.kind === 'focused_discharge') return e.dischargeMult;
  return 1;
}

/** Charge interval (ms) override. Falls back to base × upgrades-modifier when no mutation. */
export function mutationChargeIntervalMs(state: GameState, baseMs: number): number {
  const m = activeMutation(state);
  if (m?.effect.kind === 'rapid_discharge') {
    return m.effect.chargeIntervalMin * 60_000; // CONST-OK (min→ms)
  }
  return baseMs;
}

/** Max charges override (only #4 Disparo Concentrado caps at 1). */
export function mutationMaxChargesOverride(state: GameState): number | null {
  const m = activeMutation(state);
  if (m?.effect.kind === 'focused_discharge') return m.effect.maxCharges;
  return null;
}

/** Cost modifier applied to neuron purchases per COST-1 (base × THIS × FE × pathway). */
export function mutationNeuronCostMod(state: GameState): number {
  const m = activeMutation(state);
  if (m?.effect.kind === 'neural_efficiency') return m.effect.neuronCostMult;
  return 1;
}

/** Cost modifier applied to upgrade purchases per COST-1. */
export function mutationUpgradeCostMod(state: GameState): number {
  const m = activeMutation(state);
  if (!m) return 1;
  const e = m.effect;
  if (e.kind === 'neuroplasticity') return e.upgradeCostMult;
  if (e.kind === 'deja_vu') return e.upgradeCostMult;
  return 1;
}
