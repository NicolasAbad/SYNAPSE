// Implements docs/GDD.md §16.2 (Corteza Prefrontal — Pre-commitments) — engine.
// Sprint 7.5 Phase 7.5.4. PRECOMMIT-1..5 + Mood event delta integration.
//
// applyPrecommitResolution is called from prestige.ts handlePrestige BEFORE the
// final Memory grant is committed. Returns a delta block describing the outcome:
//   - success: 2× memory multiplier, +N Sparks, streak++, +1 diary entry
//   - fail (no Pass): -15% memory penalty, +N Sparks=0, streak resets, diary entry,
//     -15 Mood event delta
//   - fail with Genius Pass: 0% reward (no penalty), streak still resets per PRECOMMIT-3
//
// PRECOMMIT-2: cancellation refund logic lives in store actions (cancelPrecommitment)
//   — engine layer just resolves the active wager at prestige.
//
// CODE-9 deterministic. CODE-1 compliant.

import { SYNAPSE_CONSTANTS } from '../config/constants';
import { PRECOMMIT_GOALS_BY_ID } from '../config/precommitGoals';
import { applyMoodEvent } from './mood';
import type { GameState } from '../types/GameState';
import type { DiaryEntry } from '../types';

export type PrecommitOutcome = 'success' | 'fail' | 'no_active' | 'unknown_goal';

export interface PrecommitResolution {
  outcome: PrecommitOutcome;
  // Multiplier applied to baseMemoriesGained: neutral / success / fail-penalty / Pass-shielded-fail.
  memoryMultiplier: number;
  sparksAwarded: number;
  // Sign-aware delta: success → plus one; fail → minus current streak (reset).
  streakDelta: number;
  // Populated on fail to carry the Mood delta result forward.
  moodAfter?: number;
  moodHistoryAfter?: GameState['moodHistory'];
  diaryEntry: DiaryEntry | null;
}

const NEUTRAL: PrecommitResolution = { outcome: 'no_active', memoryMultiplier: 1.0, sparksAwarded: 0, streakDelta: 0, diaryEntry: null };

/**
 * Resolve the active Pre-commit at prestige time. PRE-RESET state required.
 * The caller multiplies its computed `memoriesGained` by `memoryMultiplier` and
 * adds `sparksAwarded` to sparks; updates streak by streakDelta (resetting if
 * negative); appends diaryEntry; replaces mood/moodHistory if outcome === 'fail'.
 */
export function applyPrecommitResolution(state: GameState, cycleDurationMs: number, timestamp: number): PrecommitResolution {
  const active = state.activePrecommitment;
  if (active === null) return NEUTRAL;
  const def = PRECOMMIT_GOALS_BY_ID[active.goalId];
  if (def === undefined) return { ...NEUTRAL, outcome: 'unknown_goal' };
  const success = def.isAchieved(state, cycleDurationMs);
  if (success) {
    const diaryEntry: DiaryEntry = {
      timestamp,
      type: 'precommit',
      data: { goalId: active.goalId, wager: active.wager, outcome: 'success', sparksAwarded: def.sparksOnSuccess },
    };
    return {
      outcome: 'success',
      memoryMultiplier: SYNAPSE_CONSTANTS.precommitSuccessMult,
      sparksAwarded: def.sparksOnSuccess,
      streakDelta: 1,
      diaryEntry,
    };
  }
  // Failure path. PRECOMMIT-3 + R-decision: Genius Pass waives the penalty
  // (treats failure as 0% reward = neutral baseline) but streak STILL resets.
  const passShielded = state.isSubscribed;
  const memoryMultiplier = passShielded ? 1.0 : 1.0 - SYNAPSE_CONSTANTS.precommitFailurePenalty;
  // Fail mood delta -15 only fires for non-Pass-shielded failures.
  let moodAfter: number | undefined;
  let moodHistoryAfter: GameState['moodHistory'] | undefined;
  if (!passShielded) {
    const mu = applyMoodEvent(state, 'precommit_fail', timestamp);
    moodAfter = mu.mood;
    moodHistoryAfter = mu.moodHistory;
  }
  const diaryEntry: DiaryEntry = {
    timestamp,
    type: 'precommit',
    data: { goalId: active.goalId, wager: active.wager, outcome: 'fail', passShielded, memoryMultiplier },
  };
  return {
    outcome: 'fail',
    memoryMultiplier,
    sparksAwarded: 0,
    streakDelta: -state.precommitmentStreak, // reset to 0
    moodAfter,
    moodHistoryAfter,
    diaryEntry,
  };
}

/**
 * Successful 5-streak award per PRECOMMIT-3 + GDD §16.2:
 * "5 consecutive successes → +1 permanent Memoria/cycle (stacking buff, lifetime)".
 *
 * Returns the bonus to add to memoriesGained when streak hits the threshold.
 * Cumulative: a player at streak=10 gets +2 (one per 5-streak hit).
 */
export function streakPermanentMemoriaBonus(streak: number): number {
  return Math.floor(streak / SYNAPSE_CONSTANTS.precommitStreakBonusCycles);
}
