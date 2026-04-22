// Implements GDD.md §24.5 Achievements (35 total, 175 Sparks pool). Sprint 7.1
// ships the data + pure checker; Sprint 7.2 wires the store integration (toast
// + diary entry + sparks += reward). CODE-9 deterministic — no Math.random /
// no Date.now inside.
//
// Contract:
//   checkAllAchievements(state): returns IDs of achievements that should newly
//   unlock THIS CHECK (trigger true AND not already in achievementsUnlocked).
//   Caller merges unlocks into state and fires side effects (toast, diary,
//   analytics, sparks reward) per ACH-3.

import type { GameState } from '../types/GameState';
import type { AchievementCheckResult } from '../types';
import { ACHIEVEMENTS } from '../config/achievements';

/**
 * Evaluate all achievements against current state; return IDs that transitioned
 * false → true this check. Per ACH-1: called event-driven by store actions that
 * change relevant state slices (not every tick). Sprint 7.2 handles wiring.
 */
export function checkAllAchievements(state: GameState): AchievementCheckResult {
  const unlockedSet = new Set(state.achievementsUnlocked);
  const newlyUnlocked: string[] = [];
  for (const def of ACHIEVEMENTS) {
    if (unlockedSet.has(def.id)) continue;
    if (def.trigger(state)) newlyUnlocked.push(def.id);
  }
  return { newlyUnlocked };
}

/**
 * Compute total Spark reward for a set of achievement IDs. Caller uses this to
 * add to state.sparks in one atomic merge per ACH-3.
 */
export function achievementRewardSum(ids: readonly string[]): number {
  let sum = 0;
  for (const id of ids) {
    const def = ACHIEVEMENTS.find((a) => a.id === id);
    if (def !== undefined) sum += def.reward;
  }
  return sum;
}

/**
 * True if achievement is hidden AND not yet unlocked — UI should render as ???
 * per ACH-2. Post-unlock, isHidden no longer hides (full name/desc reveal).
 */
export function isAchievementHidden(id: string, unlocked: readonly string[]): boolean {
  const def = ACHIEVEMENTS.find((a) => a.id === id);
  if (def === undefined) return false;
  if (!def.isHidden) return false;
  return !unlocked.includes(id);
}
