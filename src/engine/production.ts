// Implements docs/GDD.md §4 (Production formula) + §5 (Neurons — connection multiplier)
// + §9 (Threshold). Sprint 3 Phase 2 wires the §4 formula stack: per-neuron
// rate mults (all_neurons_mult, neuron_type_mult) stack on the sum; global
// mults (all_production_mult, prestige_scaling_mult,
// lifetime_prestige_add, upgrades_scaling_mult) stack on rawMult; softCap
// applies to rawMult per §4 line 209-211 ("NOT to the sum"). Stubs for
// Sprint 5-7 modifiers (archetype, region, mutation, polarity, mental state,
// spontaneous event, mutation temporal) are identity until their sprints ship.
//
// See §35 rules THRES-1, TUTOR-2, CORE-9.
//
// Emergencia Cognitiva interpretation: Sprint 3 Phase 2 kickoff, Nico-approved
// **Interpretation B (multiplicative)**: mult = min(1.5^floor(ownedCount/5), capMult).
// See scripts/analyze-emergencia.mjs for the decision rationale (Run 1 shape,
// cap engagement, idle-genre convention, Era 1→Era 2 power spike).
//
// connection_mult_double interpretation: Sprint 3 Phase 1 kickoff, Nico-approved
// **literal reading**: `connectionMult *= 2` at the time Sincronía Neural is
// bought (store action, Phase 3). Phase 2 provides computeConnectionMult() as
// the single helper that accepts `hasSincroniaNeural` and produces the final
// applied value.

import { SYNAPSE_CONSTANTS } from '../config/constants';
import { NEURON_BASE_RATES } from '../config/neurons';
import { UPGRADES_BY_ID } from '../config/upgrades';
import { patternCycleBonusAdd } from './patternDecisions';
import { mutationProdMult } from './mutations';
import { dampenUpgradeBonus, pathwayUpgradeBonusDamp } from './pathways';
import { archetypeActiveProductionMult } from './archetypes';
import { spontaneousProdMult, spontaneousConnectionMult } from './spontaneous';
import { era3ProductionMult } from './era3';
import type { GameState } from '../types/GameState';
import type { NeuronState, NeuronType, Polarity, UpgradeEffect } from '../types';

/**
 * Soft cap per GDD §4. Pass-through below 100; diminishing-returns power curve above.
 * Identity at x === 100. Used to temper runaway multiplier stacking.
 *
 * The number 100 is the formula's normalization anchor (softCap(x) = 100 × (x/100)^exp).
 * Not a tunable balance value — changing it breaks the math's identity property
 * and invalidates the §4 "Verified values" snapshot tests. The tunable is
 * `softCapExponent` (0.72), which lives in SYNAPSE_CONSTANTS.
 */
export function softCap(x: number): number {
  if (x <= 100) return x; // CONST-OK (softCap normalization anchor, §4)
  return 100 * Math.pow(x / 100, SYNAPSE_CONSTANTS.softCapExponent); // CONST-OK
}

export function calculateThreshold(prestigeCount: number, transcendenceCount: number): number {
  const { baseThresholdTable, runThresholdMult } = SYNAPSE_CONSTANTS;
  const safeP = Math.max(0, Math.min(baseThresholdTable.length - 1, prestigeCount));
  const safeT = Math.max(0, Math.min(runThresholdMult.length - 1, transcendenceCount));
  return baseThresholdTable[safeP] * runThresholdMult[safeT];
}

export function calculateCurrentThreshold(
  state: Pick<GameState, 'isTutorialCycle' | 'prestigeCount' | 'transcendenceCount'>,
): number {
  if (state.isTutorialCycle) {
    const { tutorialThreshold, runThresholdMult } = SYNAPSE_CONSTANTS;
    const safeT = Math.max(0, Math.min(runThresholdMult.length - 1, state.transcendenceCount));
    return tutorialThreshold * runThresholdMult[safeT];
  }
  return calculateThreshold(state.prestigeCount, state.transcendenceCount);
}

/**
 * Connection multiplier per GDD §5: for every PAIR of neuron types with ≥1
 * owned, connectionMult += 0.05. All 5 types owned → 1 + 10 × 0.05 = 1.5.
 * Sincronía Neural (§24 `sincronia_neural`, `connection_mult_double`) doubles
 * the applied value per Sprint 3 Phase 1 Nico approval.
 *
 * Used by the Phase 3 store actions (buy-neuron recomputes after count change,
 * buy-sincronia recomputes after ownership change).
 */
export function computeConnectionMult(neurons: readonly NeuronState[], hasSincroniaNeural: boolean): number {
  let ownedTypes = 0;
  for (const n of neurons) {
    if (n.count > 0) ownedTypes++;
  }
  const pairs = ownedTypes < 2 ? 0 : (ownedTypes * (ownedTypes - 1)) / 2; // CONST-OK (C(n,2) mathematical identity)
  const base = 1 + SYNAPSE_CONSTANTS.connectionMultPerPair * pairs;
  return hasSincroniaNeural ? base * SYNAPSE_CONSTANTS.sincroniaNeuralMult : base;
}

/** Product of every owned `all_neurons_mult` upgrade effect (Red Neuronal Densa, LTP, Neurogénesis). */
function computeAllNeuronsMult(ownedIds: ReadonlySet<string>): number {
  let mult = 1;
  for (const id of ownedIds) {
    const effect = UPGRADES_BY_ID[id]?.effect;
    if (effect?.kind === 'all_neurons_mult') mult *= effect.mult;
  }
  return mult;
}

/**
 * Product of every owned per-type rate-mult upgrade for `type`. Covers
 * `neuron_type_mult` (Receptores AMPA / Transducción / Axones / Espejo
 * Resonantes). Sprint 7.5.2: removed the `basica_mult_and_memory_gain`
 * branch (consolidacion_memoria retired per GDD §16.8).
 */
function computePerTypeMult(type: NeuronType, ownedIds: ReadonlySet<string>): number {
  let mult = 1;
  for (const id of ownedIds) {
    const effect = UPGRADES_BY_ID[id]?.effect;
    if (!effect) continue;
    if (effect.kind === 'neuron_type_mult' && effect.neuronType === type) mult *= effect.mult;
  }
  return mult;
}

/**
 * Product of owned global production mults: `all_production_mult`,
 * `prestige_scaling_mult`, `lifetime_prestige_add`, `upgrades_scaling_mult`
 * (Interpretation B: `min(1.5^⌊n/5⌋, capMult)` per Sprint 3 Phase 2 Nico approval).
 * State-scaling kinds depend on prestigeCount / lifetimePrestiges / ownedCount.
 */
function computeGlobalUpgradeMult(
  state: Pick<GameState, 'prestigeCount' | 'lifetimePrestiges'>,
  ownedIds: ReadonlySet<string>,
): number {
  const ownedCount = ownedIds.size;
  let mult = 1;
  for (const id of ownedIds) {
    const effect: UpgradeEffect | undefined = UPGRADES_BY_ID[id]?.effect;
    if (!effect) continue;
    if (effect.kind === 'all_production_mult') mult *= effect.mult;
    else if (effect.kind === 'prestige_scaling_mult') mult *= Math.pow(effect.perPrestige, state.prestigeCount);
    else if (effect.kind === 'lifetime_prestige_add') mult *= 1 + Math.min(effect.perLp * state.lifetimePrestiges, effect.capAdd);
    else if (effect.kind === 'upgrades_scaling_mult') {
      const buckets = Math.floor(ownedCount / effect.bucketSize);
      mult *= Math.min(Math.pow(effect.perBucket, buckets), effect.capMult);
    }
  }
  return mult;
}

/**
 * GDD §10 pattern bonuses (Sprint 4b Phase 4b.2):
 *   flat  = totalPatterns × patternFlatBonusPerNode (thoughts/sec, pre-mult)
 *   cycle = min(1 + patternsAcquiredThisCycle × patternCycleBonusPerNode, patternCycleCap)
 * Cycle bonus stacks multiplicatively AFTER softCap (same placement as Insight
 * — per-cycle modifier, not a stack the softCap should dampen).
 */
export function countCyclePatterns(state: Pick<GameState, 'patterns' | 'cycleStartTimestamp'>): number {
  let n = 0;
  for (const p of state.patterns) if (p.acquiredAt >= state.cycleStartTimestamp) n++;
  return n;
}

export function patternCycleBonus(cyclePatterns: number, decisionAdd = 0): number {
  const { patternCycleBonusPerNode, patternCycleCap } = SYNAPSE_CONSTANTS;
  return Math.min(1 + cyclePatterns * patternCycleBonusPerNode + decisionAdd, patternCycleCap);
}

/** GDD §11 production modifier by cycle-selected Polarity (identity when null). */
export function polarityProdMult(polarity: Polarity | null): number {
  if (polarity === 'excitatory') return SYNAPSE_CONSTANTS.excitatoryProdMult;
  if (polarity === 'inhibitory') return SYNAPSE_CONSTANTS.inhibitoryProdMult;
  return 1;
}

/**
 * Full production formula per GDD §4. Returns both the softCap-tempered
 * `baseProductionPerSecond` (pre-temporary-modifier) and `effectiveProductionPerSecond`
 * (post-Insight; adds Mental State + Spontaneous + mutation temporal when those ship).
 */
export function calculateProduction(state: GameState): { base: number; effective: number } {
  const ownedIds = new Set<string>();
  for (const u of state.upgrades) {
    if (u.purchased) ownedIds.add(u.id);
  }

  const allNeuronsMult = computeAllNeuronsMult(ownedIds);
  let sum = 0;
  for (const neuron of state.neurons) {
    const perType = computePerTypeMult(neuron.type, ownedIds);
    sum += neuron.count * NEURON_BASE_RATES[neuron.type] * allNeuronsMult * perType;
  }

  // GDD §10 pattern flat bonus — per-lifetime-pattern thoughts/sec addon, applied
  // to the pre-multiplier sum so the upgrade × connection chain multiplies it too.
  sum += state.totalPatterns * SYNAPSE_CONSTANTS.patternFlatBonusPerNode;

  // GDD §14 Equilibrada: dampen the upgrade-bonus delta by 0.85 cross-cutting.
  // Identity for Rápida / Profunda / no-pathway. Wired Sprint 5 Phase 5.3.
  const globalMult = dampenUpgradeBonus(computeGlobalUpgradeMult(state, ownedIds), pathwayUpgradeBonusDamp(state));
  // Archetype × polarity × mutation × spontaneous × Era3 modifiers.
  const rawMult = state.connectionMult * spontaneousConnectionMult(state) * globalMult * polarityProdMult(state.currentPolarity) * mutationProdMult(state) * archetypeActiveProductionMult(state) * spontaneousProdMult(state) * era3ProductionMult(state);
  const finalMult = softCap(rawMult);
  // Pattern cycle bonus: post-softCap mult, capped at patternCycleCap (§10).
  const cycleMult = patternCycleBonus(countCyclePatterns(state), patternCycleBonusAdd(state));
  const base = sum * finalMult * cycleMult;
  // Mental State + Mood multipliers applied in tick.ts (clock-dependent).
  const effective = state.insightActive ? base * state.insightMultiplier : base;
  return { base, effective };
}
