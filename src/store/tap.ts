// Implements docs/GDD.md §6 (Focus Bar & Insight — TAP-2 + FOCUS-1) + §35 TAP-1.
// Sprint 3 Phase 4. Pure helper called by the gameStore `onTap` action.
// FOCUS-1: Focus Bar only fills via taps (NOT during offline, NOT during idle on
// canvas — unless Meditación Mutation is active). computeFocusFillPerTap below
// is the entire "fills via taps" surface.
//
// TAP-2 formula per §6:
//   tapThought = Math.max(baseTapThoughtMin, effectiveProductionPerSecond × baseTapThoughtPct)
// Upgrade modifications (applied in this order):
//   - Potencial Sináptico → REPLACES baseTapThoughtPct (0.05 → 0.10)
//   - Dopamina → multiplies result by tap_bonus_mult (×1.5)
//   - Sinestesia Mutation (§13, Sprint 5) → multiplies by sinestesiaTapMult (×0.4)
//   - Anti-spam TAP-1 → multiplies by antiSpamPenaltyMultiplier (×0.10) when active
// Focus Bar fill per tap:
//   - state.focusFillRate (stored; reflects Concentración Profunda ×2 applied at buy time)
//   - Mielina → adds tap_focus_fill_add (+0.02) per tap (order-independent)
// Last tap timestamps:
//   - Push to circular buffer of size antiSpamBufferSize (20). Oldest dropped when full.

import { SYNAPSE_CONSTANTS } from '../config/constants';
import { UPGRADES_BY_ID } from '../config/upgrades';
import { tryActivateInsight } from '../engine/insight';
import { focusFillRateDecisionMult } from '../engine/patternDecisions';
import { archetypeFocusFillRateMult } from '../engine/archetypes';
import { spontaneousFocusFillMult } from '../engine/spontaneous';
import { era3FocusFillBlocked } from '../engine/era3';
import { tapContributionShardMult } from '../engine/shards';
import { upgradeMasteryMult } from '../engine/mastery';
import type { GameState } from '../types/GameState';

function ownedUpgradeIds(state: Pick<GameState, 'upgrades'>): Set<string> {
  const out = new Set<string>();
  for (const u of state.upgrades) if (u.purchased) out.add(u.id);
  return out;
}

/**
 * Compute the thought contribution from a single tap. Pure.
 * Returns the exact numeric value (UI rounds on display per CODE-5).
 */
export function computeTapThought(state: GameState, antiSpamActive: boolean): number {
  const owned = ownedUpgradeIds(state);
  const { baseTapThoughtMin, baseTapThoughtPct, potencialSinapticoTapPct, sinestesiaTapMult, antiSpamPenaltyMultiplier } = SYNAPSE_CONSTANTS;
  const tapPct = owned.has('potencial_sinaptico') ? potencialSinapticoTapPct : baseTapThoughtPct;
  let tapThought = Math.max(baseTapThoughtMin, state.effectiveProductionPerSecond * tapPct);
  for (const id of owned) {
    const effect = UPGRADES_BY_ID[id]?.effect;
    if (effect?.kind === 'tap_bonus_mult') tapThought *= effect.mult * upgradeMasteryMult(state, id);
  }
  if (state.currentMutation?.id === 'sinestesia') tapThought *= sinestesiaTapMult;
  if (antiSpamActive) tapThought *= antiSpamPenaltyMultiplier;
  // Sprint 7.5.2 §16.1 shard_proc_flow: tap contribution +5%.
  tapThought *= tapContributionShardMult(state);
  return tapThought;
}

/**
 * Compute per-tap Focus Bar fill. Pure.
 * `state.focusFillRate` already reflects Concentración Profunda's ×2 from buy time (Phase 3).
 * Mielina's +0.02 is applied here from ownership, keeping the formula order-independent.
 */
export function computeFocusFillPerTap(state: GameState): number {
  // GDD §23 P23 Dreamer's Dream — active play doesn't fill Focus.
  if (era3FocusFillBlocked(state)) return 0;
  const owned = ownedUpgradeIds(state);
  let fill = state.focusFillRate;
  for (const id of owned) {
    const effect = UPGRADES_BY_ID[id]?.effect;
    if (effect?.kind === 'tap_focus_fill_add') fill += effect.add;
  }
  // GDD §10 Node 15 B: Focus fills +20 % faster if chosen.
  fill *= focusFillRateDecisionMult(state);
  // GDD §12 Analítica: Focus fills ×1.25 (Sprint 6 Phase 6.2 wired).
  fill *= archetypeFocusFillRateMult(state);
  // GDD §8 Spontaneous events — Claridad Momentánea ×3 / Pausa Neural ×5.
  fill *= spontaneousFocusFillMult(state);
  return fill;
}

/** Append `nowTimestamp` to the circular buffer, dropping the oldest if at capacity. */
function pushTapTimestamp(stamps: readonly number[], nowTimestamp: number): number[] {
  const cap = SYNAPSE_CONSTANTS.antiSpamBufferSize;
  const next = stamps.length >= cap ? [...stamps.slice(-(cap - 1)), nowTimestamp] : [...stamps, nowTimestamp];
  return next;
}

/**
 * Pure tap reducer: given current state + derived antiSpamActive + now, returns
 * the GameState partial to merge. The store action applies via `set(partial)`.
 *
 * FOCUS-2 (§6): Focus Bar does NOT reset on Insight activation — it can overflow
 * above 1.0 to pre-charge next Insight. Phase 5 Insight auto-activation will
 * consume the crossing; Phase 4 just adds fill without capping.
 */
export function applyTap(state: GameState, antiSpamActive: boolean, nowTimestamp: number): Partial<GameState> {
  const thoughtGain = computeTapThought(state, antiSpamActive);
  const focusGain = computeFocusFillPerTap(state);
  const newFocusBar = state.focusBar + focusGain;
  const base: Partial<GameState> = {
    thoughts: state.thoughts + thoughtGain,
    cycleGenerated: state.cycleGenerated + thoughtGain,
    totalGenerated: state.totalGenerated + thoughtGain,
    focusBar: newFocusBar,
    lastTapTimestamps: pushTapTimestamp(state.lastTapTimestamps, nowTimestamp),
  };
  // Immediate tap-driven Insight activation (Phase 5) — players feel the
  // payoff on the tap that crosses the threshold rather than waiting up to
  // 100ms for the next tick. The engine step 2.5 still handles post-expiry
  // re-fires when bar is already pre-charged (FOCUS-2).
  const probeState = { ...state, focusBar: newFocusBar };
  const insightUpdates = tryActivateInsight(probeState, nowTimestamp);
  return { ...base, ...insightUpdates };
}
