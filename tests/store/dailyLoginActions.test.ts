// Sprint 10 Phase 10.4 — daily login store actions.
// Validates: claimDailyLoginReward awards sparks + advances streak + stamps date;
// resolveStreakSave subscriber/ad/reset paths; recordNotificationPermissionAsked
// at gates 1 + 3 (idempotent at each gate).

import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createDefaultState, useGameStore } from '../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';

vi.mock('../../src/platform/firebase', () => ({
  initFirebase: vi.fn(),
  logEvent: vi.fn(),
  logEventOnce: vi.fn((_n, _p, _c, before: string[]) => before),
}));

vi.mock('../../src/platform/audio', () => ({
  playSfx: vi.fn(),
}));

beforeEach(() => {
  useGameStore.setState(createDefaultState());
});

describe('claimDailyLoginReward', () => {
  test('first-ever claim awards Day 1 (5 sparks) + advances to streak 1', () => {
    const o = useGameStore.getState().claimDailyLoginReward('2026-04-24');
    expect(o.kind).toBe('normal_claim');
    const s = useGameStore.getState();
    expect(s.sparks).toBe(SYNAPSE_CONSTANTS.dailyLoginRewards[0]);
    expect(s.dailyLoginStreak).toBe(1);
    expect(s.lastDailyClaimDate).toBe('2026-04-24');
  });

  test('same-day re-claim is no-op (no_action)', () => {
    useGameStore.getState().claimDailyLoginReward('2026-04-24');
    const sparksAfterFirst = useGameStore.getState().sparks;
    const o = useGameStore.getState().claimDailyLoginReward('2026-04-24');
    expect(o.kind).toBe('no_action');
    expect(useGameStore.getState().sparks).toBe(sparksAfterFirst);
  });

  test('next-day claim continues streak (streak 1 → 2, awards Day 2 = 5)', () => {
    useGameStore.setState({ lastDailyClaimDate: '2026-04-23', dailyLoginStreak: 1, sparks: 0 });
    useGameStore.getState().claimDailyLoginReward('2026-04-24');
    const s = useGameStore.getState();
    expect(s.dailyLoginStreak).toBe(2);
    expect(s.sparks).toBe(SYNAPSE_CONSTANTS.dailyLoginRewards[1]);
  });

  test('Day 7 claim wraps streak to 0 + awards 50 sparks', () => {
    useGameStore.setState({ lastDailyClaimDate: '2026-04-23', dailyLoginStreak: 6, sparks: 0 });
    useGameStore.getState().claimDailyLoginReward('2026-04-24');
    const s = useGameStore.getState();
    expect(s.dailyLoginStreak).toBe(0);
    expect(s.sparks).toBe(50);
  });

  test('streak save outcome does NOT award sparks here (UI must call resolveStreakSave)', () => {
    useGameStore.setState({ lastDailyClaimDate: '2026-04-22', dailyLoginStreak: 3, sparks: 0, isSubscribed: false });
    const o = useGameStore.getState().claimDailyLoginReward('2026-04-24');
    expect(o.kind).toBe('streak_save_eligible');
    expect(useGameStore.getState().sparks).toBe(0); // NOT awarded yet
    expect(useGameStore.getState().dailyLoginStreak).toBe(3); // unchanged
  });

  test('streak reset (3+ missed days) awards Day 1 + resets streak to 1', () => {
    useGameStore.setState({ lastDailyClaimDate: '2026-04-20', dailyLoginStreak: 5, sparks: 0 });
    const o = useGameStore.getState().claimDailyLoginReward('2026-04-24');
    expect(o.kind).toBe('streak_reset');
    const s = useGameStore.getState();
    expect(s.sparks).toBe(SYNAPSE_CONSTANTS.dailyLoginRewards[0]);
    expect(s.dailyLoginStreak).toBe(1);
  });
});

describe('resolveStreakSave', () => {
  test('subscriber path: awards eligible reward + advances streak', () => {
    useGameStore.setState({ lastDailyClaimDate: '2026-04-22', dailyLoginStreak: 3, sparks: 0, isSubscribed: true });
    useGameStore.getState().resolveStreakSave('2026-04-24', 'subscriber');
    const s = useGameStore.getState();
    expect(s.sparks).toBe(SYNAPSE_CONSTANTS.dailyLoginRewards[3]); // Day 4 = 10
    expect(s.dailyLoginStreak).toBe(4);
    expect(s.lastDailyClaimDate).toBe('2026-04-24');
  });

  test('ad path: awards eligible reward + advances streak (subscriber=false ok)', () => {
    useGameStore.setState({ lastDailyClaimDate: '2026-04-22', dailyLoginStreak: 3, sparks: 0, isSubscribed: false });
    useGameStore.getState().resolveStreakSave('2026-04-24', 'ad');
    const s = useGameStore.getState();
    expect(s.sparks).toBe(10);
    expect(s.dailyLoginStreak).toBe(4);
  });

  test('reset path: awards Day 1 only + resets streak to 1', () => {
    useGameStore.setState({ lastDailyClaimDate: '2026-04-22', dailyLoginStreak: 4, sparks: 0, isSubscribed: false });
    useGameStore.getState().resolveStreakSave('2026-04-24', 'reset');
    const s = useGameStore.getState();
    expect(s.sparks).toBe(SYNAPSE_CONSTANTS.dailyLoginRewards[0]);
    expect(s.dailyLoginStreak).toBe(1);
  });

  test('idempotent: calling twice when no eligible save state is no-op', () => {
    useGameStore.setState({ lastDailyClaimDate: '2026-04-24', dailyLoginStreak: 3, sparks: 0 });
    useGameStore.getState().resolveStreakSave('2026-04-24', 'subscriber');
    expect(useGameStore.getState().sparks).toBe(0);
  });
});

describe('recordNotificationPermissionAsked', () => {
  test('sets to gate value when below it', () => {
    useGameStore.setState({ notificationPermissionAsked: 0 });
    useGameStore.getState().recordNotificationPermissionAsked(1);
    expect(useGameStore.getState().notificationPermissionAsked).toBe(1);
  });

  test('does NOT downgrade if already past', () => {
    useGameStore.setState({ notificationPermissionAsked: 3 });
    useGameStore.getState().recordNotificationPermissionAsked(1);
    expect(useGameStore.getState().notificationPermissionAsked).toBe(3);
  });

  test('advances to gate 3 when at gate 1', () => {
    useGameStore.setState({ notificationPermissionAsked: 1 });
    useGameStore.getState().recordNotificationPermissionAsked(3);
    expect(useGameStore.getState().notificationPermissionAsked).toBe(3);
  });
});
