// Implements docs/GDD.md §26 (Monetization — retention) + Sprint 10 SPRINTS.md
// "Daily Login Bonus 7-day streak (5/5/10/10/15/20/50)" + "7th rewarded ad
// placement: streak save".
//
// Pure function (CODE-9): consumer passes nowDate (YYYY-MM-DD string) and the
// helper returns one of four outcome kinds. Side effects (claiming reward,
// firing analytics, showing modal) are the caller's responsibility — store
// actions in src/store/dailyLoginActions.ts.

import { SYNAPSE_CONSTANTS } from '../config/constants';
import type { GameState } from '../types/GameState';

/** ISO date string (YYYY-MM-DD). Caller must use a stable timezone (local). */
export type DateString = string;

export type DailyLoginOutcome =
  | { kind: 'no_action' } // already claimed today
  | { kind: 'normal_claim'; rewardSparks: number; nextStreak: number; rewardDay: number }
  | { kind: 'streak_save_eligible'; rewardSparks: number; nextStreak: number; rewardDay: number; canAutoSave: boolean }
  | { kind: 'streak_reset'; rewardSparks: number; nextStreak: number; rewardDay: number };

/** Diff in whole days between two YYYY-MM-DD strings. Returns NaN on bad input. */
export function dayDiff(from: DateString, to: DateString): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return NaN;
  return Math.round((b - a) / (24 * 60 * 60 * 1000)); // CONST-OK ms→days conversion
}

/** Format a JS timestamp (epoch ms) as a YYYY-MM-DD local-time date string. */
export function toLocalDateString(timestamp: number): DateString {
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0'); // CONST-OK 0-indexed Date.getMonth + zero-pad
  const day = String(d.getDate()).padStart(2, '0'); // CONST-OK zero-pad day
  return `${y}-${m}-${day}`;
}

/**
 * Pure evaluator. Inspects state.lastDailyClaimDate vs nowDate and returns the
 * outcome. Caller commits state changes (sparks += rewardSparks, dailyLoginStreak,
 * lastDailyClaimDate). On `streak_save_eligible`, caller decides whether to show
 * the ad-watch modal or auto-save (subscriber).
 *
 * Reward indexing: streak 0 → rewards[0] (Day 1, 5 sparks); streak 6 → rewards[6]
 * (Day 7, 50 sparks); after claim, nextStreak = (streak + 1) mod 7.
 */
export function evaluateDailyLogin(state: GameState, nowDate: DateString): DailyLoginOutcome {
  const {
    dailyLoginRewards,
    dailyLoginCycleLength,
    dailyLoginStreakSaveDayDiff,
    dailyLoginStreakSaveDayDiffMax,
    dailyLoginResetThresholdDayDiff,
  } = SYNAPSE_CONSTANTS;
  const last = state.lastDailyClaimDate;
  const currentStreak = state.dailyLoginStreak;

  // First-ever claim path or after reset.
  if (last === null) {
    const reward = dailyLoginRewards[0];
    return { kind: 'normal_claim', rewardSparks: reward, nextStreak: 1 % dailyLoginCycleLength, rewardDay: 1 };
  }

  const diff = dayDiff(last, nowDate);
  if (Number.isNaN(diff) || diff <= 0) {
    // Same day or future-shifted clock — no claim. Diff <= 0 can happen on
    // device clock rollback (rare) or same calendar day.
    return { kind: 'no_action' };
  }

  if (diff === 1) {
    // Normal continuation.
    const rewardIdx = currentStreak % dailyLoginCycleLength;
    const reward = dailyLoginRewards[rewardIdx];
    const next = (currentStreak + 1) % dailyLoginCycleLength;
    return { kind: 'normal_claim', rewardSparks: reward, nextStreak: next, rewardDay: rewardIdx + 1 };
  }

  if (diff >= dailyLoginStreakSaveDayDiff && diff <= dailyLoginStreakSaveDayDiffMax) {
    // Pre-launch audit Day 3 (B3): save window widened from diff===2 to
    // diff in [2..3]. Missed 1-2 days → streak save offer. Pre-compute the
    // reward the player WOULD claim if they save (continues current streak)
    // so the modal can render it. Subscribers auto-save (caller decides).
    const rewardIdx = currentStreak % dailyLoginCycleLength;
    const reward = dailyLoginRewards[rewardIdx];
    const next = (currentStreak + 1) % dailyLoginCycleLength;
    const canAutoSave = state.isSubscribed; // Genius Pass auto-preserves
    return { kind: 'streak_save_eligible', rewardSparks: reward, nextStreak: next, rewardDay: rewardIdx + 1, canAutoSave };
  }

  if (diff >= dailyLoginResetThresholdDayDiff) {
    // 2+ missed days → reset. Player still claims today's Day 1 reward.
    const reward = dailyLoginRewards[0];
    return { kind: 'streak_reset', rewardSparks: reward, nextStreak: 1 % dailyLoginCycleLength, rewardDay: 1 };
  }

  // Defensive — should not reach here given the gating above. Treat as no_action.
  return { kind: 'no_action' };
}
