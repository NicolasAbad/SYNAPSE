// Implements docs/GDD.md §7 (Discharge, Cascade, Charges). Sprint 3 Phase 6.
// Pure helpers consumed by the gameStore `discharge` action and the tap
// handler. Order-of-operations per BUG-07:
//   1. Precondition: dischargeCharges > 0.
//   2. Cascade check reads focusBar BEFORE consuming bar (≥ cascadeThreshold).
//   3. Compute multiplier stack (base × tutorial override × Amplificador × Cascade).
//   4. Execute burst: effectivePPS × finalMult × 60 + Potencial Latente flat.
//   5. If Cascade: focusBar = 0, then + Sincronización Total refund if owned.
//   6. Increment counters (cycleDischarges, cycleCascades, lifetimeDischarges).
//
// Non-Cascade Discharge does NOT consume Focus Bar (§7 "Consumes Focus Bar
// entirely" is under the Cascade section only).

import { SYNAPSE_CONSTANTS } from '../config/constants';
import { UPGRADES_BY_ID } from '../config/upgrades';
import { cascadeThresholdOverride, dischargeDamageDecisionMult } from './patternDecisions';
import { mutationDischargeMult } from './mutations';
import { era3DischargeMultOverride } from './era3';
import { cascadeSparkBonus } from './shards';
import type { GameState } from '../types/GameState';
import type { Polarity } from '../types';

/** GDD §11 Discharge multiplier by Polarity (Excit −15%, Inhib +30%, null = identity). */
export function polarityDischargeMult(polarity: Polarity | null): number {
  if (polarity === 'excitatory') return SYNAPSE_CONSTANTS.excitatoryDischargeMult;
  if (polarity === 'inhibitory') return SYNAPSE_CONSTANTS.inhibitoryDischargeMult;
  return 1;
}

/** GDD §11 Cascade threshold multiplier from Inhibitory Polarity (Option A). */
export function polarityCascadeThresholdMult(polarity: Polarity | null): number {
  if (polarity === 'inhibitory') return SYNAPSE_CONSTANTS.inhibitoryCascadeThresholdMult;
  return 1;
}

function ownedUpgradeIds(state: Pick<GameState, 'upgrades'>): Set<string> {
  const out = new Set<string>();
  for (const u of state.upgrades) if (u.purchased) out.add(u.id);
  return out;
}

/** Base Discharge multiplier by prestige + tutorial override + §23 P25 override. */
function baseDischargeMultiplier(state: Pick<GameState, 'prestigeCount' | 'isTutorialCycle' | 'cycleDischargesUsed'>): number {
  const { dischargeMultiplier, dischargeMultiplierP3Plus, tutorialDischargeMult } = SYNAPSE_CONSTANTS;
  // GDD §23 P25 Final Awakening — Discharge ×5 overrides base.
  const era3Override = era3DischargeMultOverride(state);
  if (era3Override !== null) return era3Override;
  // Tutorial override applies to the FIRST Discharge of the first-ever cycle
  // (isTutorialCycle=true && cycleDischargesUsed===0). After that, back to prestige-based base.
  if (state.isTutorialCycle && state.cycleDischargesUsed === 0) return tutorialDischargeMult;
  return state.prestigeCount >= SYNAPSE_CONSTANTS.dischargeMultBoostMinPrestige ? dischargeMultiplierP3Plus : dischargeMultiplier;
}

/** Amplificador de Disparo + other tap_bonus-style mults on the Discharge side. */
function dischargeUpgradeMult(ownedIds: ReadonlySet<string>): number {
  let mult = 1;
  for (const id of ownedIds) {
    const effect = UPGRADES_BY_ID[id]?.effect;
    if (effect?.kind === 'discharge_mult') mult *= effect.mult;
  }
  return mult;
}

/**
 * Cascade multiplier per §7 stacking rules.
 * Base 2.5 (cascadeMultiplier). cascada_eterna (Sprint 8b resonance upgrade)
 * raises base to 3.0. Cascada Profunda (§24) doubles the base → 5.0 or 6.0.
 * Phase 6 checks `cascada_eterna` via resonanceUpgrades (Sprint 8b-owned field).
 */
export function computeCascadeMultiplier(state: Pick<GameState, 'upgrades' | 'resonanceUpgrades'>): number {
  const { cascadeMultiplier, cascadaEternaMult } = SYNAPSE_CONSTANTS;
  const owned = ownedUpgradeIds(state);
  const base = state.resonanceUpgrades.includes('cascada_eterna') ? cascadaEternaMult : cascadeMultiplier;
  let mult = base;
  for (const id of owned) {
    if (UPGRADES_BY_ID[id]?.effect.kind === 'cascade_mult_double') mult *= 2; // CONST-OK (§24 literal "×2")
  }
  return mult;
}

/** Final multiplier stack on Discharge burst. Cascade mult applied only on Cascade. */
export function computeDischargeMultiplier(state: GameState, isCascade: boolean): number {
  const base = baseDischargeMultiplier(state);
  const amp = dischargeUpgradeMult(ownedUpgradeIds(state));
  const cascade = isCascade ? computeCascadeMultiplier(state) : 1;
  // GDD §10 Node 36 B: +10 % Discharge damage (always applied when chosen).
  const decisionMult = dischargeDamageDecisionMult(state);
  // GDD §11 Polarity Discharge mult (Excit −15%, Inhib +30%).
  const polMult = polarityDischargeMult(state.currentPolarity);
  // GDD §13 Mutation Discharge mult (#3 Descarga Rápida −40% bonus, #4 Disparo
  // Concentrado ×3). Wired Sprint 5 Phase 5.2.
  const mutMult = mutationDischargeMult(state);
  return base * amp * cascade * decisionMult * polMult * mutMult;
}

/**
 * Effective Cascade threshold: stacks Node 36 A set-override with Inhibitory's
 * multiplicative shift. When BOTH apply, pick MIN (lower = easier to Cascade,
 * more favorable to player). Without either, base `cascadeThreshold` (0.75).
 */
export function effectiveCascadeThreshold(state: Pick<GameState, 'patternDecisions' | 'currentPolarity'>): number {
  const withPolarity = SYNAPSE_CONSTANTS.cascadeThreshold * polarityCascadeThresholdMult(state.currentPolarity);
  const override = cascadeThresholdOverride(state);
  return override === null ? withPolarity : Math.min(withPolarity, override);
}

/** Potencial Latente flat bonus (GDD §24: "+1,000 × prestigeCount per Discharge"). */
function potencialLatenteBonus(state: Pick<GameState, 'upgrades' | 'prestigeCount'>): number {
  const owned = ownedUpgradeIds(state);
  for (const id of owned) {
    const effect = UPGRADES_BY_ID[id]?.effect;
    if (effect?.kind === 'discharge_prestige_bonus') return effect.base * state.prestigeCount;
  }
  return 0;
}

/** Sincronización Total refund on Cascade (GDD §24: "Focus regains +0.18"). */
function sincronizacionRefund(state: Pick<GameState, 'upgrades'>): number {
  const owned = ownedUpgradeIds(state);
  for (const id of owned) {
    const effect = UPGRADES_BY_ID[id]?.effect;
    if (effect?.kind === 'post_cascade_focus_refund') return effect.amount;
  }
  return 0;
}

/** Shape returned to the UI so it can fire appropriate haptics / animations. */
export interface DischargeOutcome {
  fired: boolean;
  isCascade: boolean;
  burst: number;
}

/**
 * Execute a Discharge. Returns the GameState partial to merge + outcome
 * metadata for the UI (haptic tier, visual glow, analytics event).
 */
export function performDischarge(
  state: GameState,
  nowTimestamp: number,
): { updates: Partial<GameState>; outcome: DischargeOutcome } {
  if (state.dischargeCharges <= 0) {
    return { updates: {}, outcome: { fired: false, isCascade: false, burst: 0 } };
  }
  // BUG-07: evaluate Cascade BEFORE consuming anything.
  const isCascade = state.focusBar >= effectiveCascadeThreshold(state);
  const finalMult = computeDischargeMultiplier(state, isCascade);
  // CONST-OK: 60 = seconds-per-minute (§7 "= 1 minute of production compressed")
  const burst = state.effectiveProductionPerSecond * finalMult * 60 + potencialLatenteBonus(state); // CONST-OK (sec→min)
  const updates: Partial<GameState> = {
    thoughts: state.thoughts + burst,
    cycleGenerated: state.cycleGenerated + burst,
    totalGenerated: state.totalGenerated + burst,
    dischargeCharges: state.dischargeCharges - 1,
    cycleDischargesUsed: state.cycleDischargesUsed + 1,
    lifetimeDischarges: state.lifetimeDischarges + 1,
  };
  if (isCascade) {
    // Step 4+5 per BUG-07 order: bar → 0, then post-Cascade refund.
    updates.focusBar = sincronizacionRefund(state);
    updates.cycleCascades = state.cycleCascades + 1;
    // Sprint 7.5.2 §16.1 shard_emo_pulse: +1 Spark per Cascade.
    const sparkBonus = cascadeSparkBonus(state);
    if (sparkBonus > 0) updates.sparks = state.sparks + sparkBonus;
  }
  // lastPurchaseTimestamp NOT touched — Discharge isn't a purchase; Mental State
  // Dormancy triggers on idle taps+purchases, Discharge doesn't count (per §17).
  void nowTimestamp; // reserved for future analytics / per-Discharge timing
  return { updates, outcome: { fired: true, isCascade, burst } };
}
