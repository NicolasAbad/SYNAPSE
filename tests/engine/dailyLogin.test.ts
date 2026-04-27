// Sprint 10 Phase 10.4 — pure dailyLogin engine tests.
// CODE-9: pure function, no Date.now / Math.random — caller passes nowDate.

import { describe, expect, test } from 'vitest';
import { evaluateDailyLogin, dayDiff, toLocalDateString } from '../../src/engine/dailyLogin';
import { createDefaultState } from '../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';
import type { GameState } from '../../src/types/GameState';

function withDailyState(overrides: Partial<GameState>): GameState {
  return { ...createDefaultState(), ...overrides };
}

describe('dayDiff helper', () => {
  test('whole-day diff between two ISO dates', () => {
    expect(dayDiff('2026-04-24', '2026-04-25')).toBe(1);
    expect(dayDiff('2026-04-24', '2026-04-26')).toBe(2);
    expect(dayDiff('2026-04-24', '2026-04-30')).toBe(6);
  });

  test('zero diff for same date', () => {
    expect(dayDiff('2026-04-24', '2026-04-24')).toBe(0);
  });

  test('negative diff for clock rollback', () => {
    expect(dayDiff('2026-04-25', '2026-04-24')).toBe(-1);
  });

  test('crosses month boundaries cleanly', () => {
    expect(dayDiff('2026-04-30', '2026-05-01')).toBe(1);
    expect(dayDiff('2026-12-31', '2027-01-01')).toBe(1);
  });

  test('returns NaN on invalid input', () => {
    expect(dayDiff('not-a-date', '2026-04-25')).toBeNaN();
  });
});

describe('toLocalDateString', () => {
  test('formats epoch ms as YYYY-MM-DD local-time', () => {
    // Use a fixed timestamp; result depends on local TZ but format is stable.
    const result = toLocalDateString(Date.UTC(2026, 3, 24, 12, 0, 0)); // April 24 noon UTC
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('zero-pads month + day', () => {
    const result = toLocalDateString(Date.UTC(2026, 0, 5, 12, 0, 0)); // Jan 5
    expect(result).toMatch(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/);
  });
});

describe('evaluateDailyLogin — first-ever claim', () => {
  test('returns normal_claim with Day 1 reward when lastDailyClaimDate is null', () => {
    const state = withDailyState({ lastDailyClaimDate: null, dailyLoginStreak: 0 });
    const outcome = evaluateDailyLogin(state, '2026-04-24');
    expect(outcome.kind).toBe('normal_claim');
    if (outcome.kind === 'normal_claim') {
      expect(outcome.rewardSparks).toBe(SYNAPSE_CONSTANTS.dailyLoginRewards[0]);
      expect(outcome.nextStreak).toBe(1);
      expect(outcome.rewardDay).toBe(1);
    }
  });
});

describe('evaluateDailyLogin — same-day no-action', () => {
  test('returns no_action when lastDailyClaimDate equals nowDate', () => {
    const state = withDailyState({ lastDailyClaimDate: '2026-04-24', dailyLoginStreak: 3 });
    expect(evaluateDailyLogin(state, '2026-04-24').kind).toBe('no_action');
  });

  test('returns no_action on clock rollback (negative diff)', () => {
    const state = withDailyState({ lastDailyClaimDate: '2026-04-25', dailyLoginStreak: 3 });
    expect(evaluateDailyLogin(state, '2026-04-24').kind).toBe('no_action');
  });
});

describe('evaluateDailyLogin — normal continuation (diff=1)', () => {
  test('streak 0 → claim 5 sparks (Day 1) + advance to streak 1', () => {
    const state = withDailyState({ lastDailyClaimDate: '2026-04-23', dailyLoginStreak: 0 });
    const o = evaluateDailyLogin(state, '2026-04-24');
    expect(o).toEqual({ kind: 'normal_claim', rewardSparks: 5, nextStreak: 1, rewardDay: 1 });
  });

  test('streak 6 → claim 50 sparks (Day 7) + wrap to streak 0', () => {
    const state = withDailyState({ lastDailyClaimDate: '2026-04-23', dailyLoginStreak: 6 });
    const o = evaluateDailyLogin(state, '2026-04-24');
    expect(o).toEqual({ kind: 'normal_claim', rewardSparks: 50, nextStreak: 0, rewardDay: 7 });
  });

  test('all 7 reward tiers in cycle order', () => {
    const expected = [5, 5, 10, 10, 15, 20, 50];
    for (let streak = 0; streak < 7; streak++) {
      const state = withDailyState({ lastDailyClaimDate: '2026-04-23', dailyLoginStreak: streak });
      const o = evaluateDailyLogin(state, '2026-04-24');
      expect(o.kind).toBe('normal_claim');
      if (o.kind === 'normal_claim') expect(o.rewardSparks).toBe(expected[streak]);
    }
  });
});

describe('evaluateDailyLogin — streak save (diff=2, missed exactly 1 day)', () => {
  test('non-subscriber → streak_save_eligible with canAutoSave=false', () => {
    const state = withDailyState({ lastDailyClaimDate: '2026-04-22', dailyLoginStreak: 3, isSubscribed: false });
    const o = evaluateDailyLogin(state, '2026-04-24');
    expect(o.kind).toBe('streak_save_eligible');
    if (o.kind === 'streak_save_eligible') {
      expect(o.canAutoSave).toBe(false);
      expect(o.rewardSparks).toBe(10); // streak 3 → Day 4 reward
      expect(o.nextStreak).toBe(4);
    }
  });

  test('subscriber (Genius Pass) → streak_save_eligible with canAutoSave=true', () => {
    const state = withDailyState({ lastDailyClaimDate: '2026-04-22', dailyLoginStreak: 3, isSubscribed: true });
    const o = evaluateDailyLogin(state, '2026-04-24');
    expect(o.kind).toBe('streak_save_eligible');
    if (o.kind === 'streak_save_eligible') expect(o.canAutoSave).toBe(true);
  });
});

describe('evaluateDailyLogin — streak reset (pre-launch audit Day 3 B3: diff>=4, 3+ missed days)', () => {
  test('diff=3 → streak_save_eligible (still in widened save window)', () => {
    const state = withDailyState({ lastDailyClaimDate: '2026-04-21', dailyLoginStreak: 5 });
    const o = evaluateDailyLogin(state, '2026-04-24');
    expect(o.kind).toBe('streak_save_eligible');
  });

  test('diff=4 → streak_reset back to Day 1 reward (just past widened save window)', () => {
    const state = withDailyState({ lastDailyClaimDate: '2026-04-21', dailyLoginStreak: 5 });
    const o = evaluateDailyLogin(state, '2026-04-25');
    expect(o).toEqual({ kind: 'streak_reset', rewardSparks: 5, nextStreak: 1, rewardDay: 1 });
  });

  test('diff=10 → streak_reset (long absence)', () => {
    const state = withDailyState({ lastDailyClaimDate: '2026-04-14', dailyLoginStreak: 2 });
    const o = evaluateDailyLogin(state, '2026-04-24');
    expect(o.kind).toBe('streak_reset');
  });
});
