// Implements docs/GDD.md §4 (Production) + §9 (Threshold) — primitives only
// See §35 rules THRES-1, TUTOR-2, CORE-9
//
// Scope: this file ships ONLY the production/threshold primitives that Sprint 1
// needs (softCap, calculateThreshold, calculateCurrentThreshold). The full
// calculateProduction() pipeline depends on neurons + archetypes + polarity +
// mutations + connection multiplier + mental states + insight + patterns, all
// of which are introduced progressively across Sprints 3-7. Sprint 3 will add
// the scaffolded calculateProduction() with TODO markers for pending features.

import { SYNAPSE_CONSTANTS } from '../config/constants';
import type { GameState } from '../types/GameState';

/**
 * Soft cap per GDD §4. Pass-through below 100; diminishing-returns power curve above.
 * Identity at x === 100. Used to temper runaway snowball effects.
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

/**
 * Scheduled threshold for (prestigeCount, transcendenceCount). Pure; callers
 * must handle TUTOR-2 override externally via calculateCurrentThreshold().
 * Defensively clamps out-of-range inputs against save corruption or spec drift.
 */
export function calculateThreshold(prestigeCount: number, transcendenceCount: number): number {
  const { baseThresholdTable, runThresholdMult } = SYNAPSE_CONSTANTS;
  const safeP = Math.max(0, Math.min(baseThresholdTable.length - 1, prestigeCount));
  const safeT = Math.max(0, Math.min(runThresholdMult.length - 1, transcendenceCount));
  return baseThresholdTable[safeP] * runThresholdMult[safeT];
}

/**
 * Effective threshold for the current cycle with TUTOR-2 override applied.
 * Use Pick<> so callers can pass partial state in tests without constructing
 * a full 110-field object — makes the dependency set explicit.
 */
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
