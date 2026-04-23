// Implements docs/GDD.md §16.2 (Corteza Prefrontal — Pre-commitments) — canonical storage.
// Sprint 7.5 Phase 7.5.4.
//
// CANONICAL STORAGE FILE per CLAUDE.md "Canonical storage file rule" — this file
// is the source of truth for the 8 v1.0 Pre-commit goal templates. It contains
// ONLY data + pure-function eligibility checks. Gate 3 (constants coverage) of
// scripts/check-invention.sh excludes this file from the literal count.
//
// Display names + descriptions live in src/config/strings/en.ts under the
// `precommit_goals` domain per CODE-1.
//
// Per PRECOMMIT-5: time-based goals use lenient `<=` comparison.

import type { GameState } from '../types/GameState';
import { SYNAPSE_CONSTANTS } from './constants';

export interface PrecommitGoalDef {
  id: string;
  /** Memorias spent at cycle start. */
  wager: number;
  /** Bonus Sparks added on success (in addition to base 2× Memoria reward). */
  sparksOnSuccess: number;
  /**
   * Pure check evaluated at prestige time against the cycle's pre-RESET state.
   * Returns true iff the goal was achieved.
   */
  isAchieved: (state: GameState, cycleDurationMs: number) => boolean;
}

const TWELVE_MIN_MS = 12 * 60_000; // CONST-OK §16.2 pc_under_12min
const EIGHT_MIN_MS = 8 * 60_000;   // CONST-OK §16.2 pc_under_8min
const PC_FIVE_CASCADES_THRESHOLD = 5;     // CONST-OK §16.2 pc_five_cascades
const PC_TWENTY_NEURONS_THRESHOLD = 20;   // CONST-OK §16.2 pc_20_neurons
const PC_NEURON_PRESTIGE_LIMIT = 3;       // CONST-OK §16.2 pc_20_neurons "before P3"
const PC_MAX_FOCUS_CROSSINGS = 3;         // CONST-OK §16.2 pc_max_focus_3x
const PC_SPONTANEOUS_HUNTER_THRESHOLD = 3; // CONST-OK §16.2 pc_spontaneous_hunter

export const PRECOMMIT_GOALS: readonly PrecommitGoalDef[] = [
  {
    id: 'pc_under_12min',
    wager: 1,
    sparksOnSuccess: 2,
    isAchieved: (_s, dur) => dur <= TWELVE_MIN_MS,
  },
  {
    id: 'pc_under_8min',
    wager: 2,
    sparksOnSuccess: 5,
    isAchieved: (_s, dur) => dur <= EIGHT_MIN_MS,
  },
  {
    id: 'pc_no_discharge',
    wager: 2,
    sparksOnSuccess: 5,
    isAchieved: (s) => s.cycleDischargesUsed === 0,
  },
  {
    id: 'pc_five_cascades',
    wager: 2,
    sparksOnSuccess: 5,
    isAchieved: (s) => s.cycleCascades >= PC_FIVE_CASCADES_THRESHOLD,
  },
  {
    id: 'pc_20_neurons',
    wager: 1,
    sparksOnSuccess: 2,
    isAchieved: (s) => s.cycleNeuronsBought >= PC_TWENTY_NEURONS_THRESHOLD && s.prestigeCount < PC_NEURON_PRESTIGE_LIMIT,
  },
  {
    id: 'pc_no_tap_idle',
    wager: 3,
    sparksOnSuccess: 8,
    // "Without tapping" — checked via lastTapTimestamps emptiness at prestige time.
    // Tap timestamps are reset by PRESTIGE_RESET so a fresh-cycle empty buffer
    // means no taps this cycle.
    isAchieved: (s) => s.lastTapTimestamps.length === 0,
  },
  {
    id: 'pc_max_focus_3x',
    wager: 1,
    sparksOnSuccess: 2,
    // Approximated via lifetimeInsights count delta within the cycle. Each Insight
    // activation requires Focus to fill to threshold, so 3 Insights ≈ 3 Focus fills.
    // True per-cycle Focus-fill counter would require a new GameState field; v1.0
    // approximation is acceptable given Insight is the player-visible Focus payoff.
    isAchieved: (s) => {
      const cycleInsights = s.insightTimestamps.filter((t) => t >= s.cycleStartTimestamp).length;
      return cycleInsights >= PC_MAX_FOCUS_CROSSINGS;
    },
  },
  {
    id: 'pc_spontaneous_hunter',
    wager: 2,
    sparksOnSuccess: 5,
    isAchieved: (s) => s.cyclePositiveSpontaneous >= PC_SPONTANEOUS_HUNTER_THRESHOLD,
  },
] as const;

export const PRECOMMIT_GOALS_BY_ID: Readonly<Record<string, PrecommitGoalDef>> = Object.freeze(
  PRECOMMIT_GOALS.reduce<Record<string, PrecommitGoalDef>>((acc, g) => {
    acc[g.id] = g;
    return acc;
  }, {}),
);

/** True iff the player can pick a Pre-commit at this prestige (PRECOMMIT-1: P5+). */
export function isPrecommitUnlocked(prestigeCount: number): boolean {
  return prestigeCount >= SYNAPSE_CONSTANTS.precommitUnlockPrestige;
}
