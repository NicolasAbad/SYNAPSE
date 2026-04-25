// @vitest-environment jsdom
// Sprint 10 Phase 10.4 close — usePushRuntime hook tests.
// pushScheduler is mocked at module level so we can assert on calls without
// touching @capacitor/local-notifications (which requires a native runtime).

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';

const ensurePermission = vi.fn(async () => true);
const scheduleDailyReminder = vi.fn(async () => {});
const scheduleOfflineCapReached = vi.fn(async () => {});
const scheduleStreakAboutToBreak = vi.fn(async () => {});
const cancelAll = vi.fn(async () => {});

vi.mock('../../src/platform/pushScheduler', () => ({
  createPushScheduler: () => ({
    ensurePermission,
    scheduleDailyReminder,
    scheduleOfflineCapReached,
    scheduleStreakAboutToBreak,
    cancelAll,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

// Render a tiny harness so we can drive the hook with the real Zustand store.
async function mountHookWith(stateOverrides: Partial<import('../../src/types/GameState').GameState> = {}): Promise<void> {
  const { useGameStore, createDefaultState } = await import('../../src/store/gameStore');
  useGameStore.setState({ ...createDefaultState(), ...stateOverrides });
  const { usePushRuntime } = await import('../../src/platform/usePushRuntime');
  function Harness(): null { usePushRuntime(); return null; }
  render(<Harness />);
  // Allow the inside-effect promises (ensurePermission etc) to settle.
  await act(async () => { await Promise.resolve(); await Promise.resolve(); });
}

describe('usePushRuntime — notificationsEnabled toggle', () => {
  test('with notificationsEnabled=true on mount → ensures permission + schedules daily reminder', async () => {
    await mountHookWith({ notificationsEnabled: true });
    expect(ensurePermission).toHaveBeenCalled();
    expect(scheduleDailyReminder).toHaveBeenCalled();
    expect(cancelAll).not.toHaveBeenCalled();
  });

  test('with notificationsEnabled=false on mount → cancels all + does NOT ask permission', async () => {
    await mountHookWith({ notificationsEnabled: false });
    expect(cancelAll).toHaveBeenCalled();
    expect(ensurePermission).not.toHaveBeenCalled();
    expect(scheduleDailyReminder).not.toHaveBeenCalled();
  });
});

describe('usePushRuntime — permission ask cadence', () => {
  test('prestige 1+ with notificationPermissionAsked=0 → asks gate 1 + records', async () => {
    await mountHookWith({
      notificationsEnabled: true,
      prestigeCount: 1,
      notificationPermissionAsked: 0,
    });
    // ensurePermission called for both the toggle effect AND the gate-1 effect.
    expect(ensurePermission.mock.calls.length).toBeGreaterThanOrEqual(1);
    const { useGameStore } = await import('../../src/store/gameStore');
    expect(useGameStore.getState().notificationPermissionAsked).toBeGreaterThanOrEqual(1);
  });

  test('prestige 3+ with notificationPermissionAsked=1 → asks gate 3', async () => {
    await mountHookWith({
      notificationsEnabled: true,
      prestigeCount: 3,
      notificationPermissionAsked: 1,
    });
    const { useGameStore } = await import('../../src/store/gameStore');
    expect(useGameStore.getState().notificationPermissionAsked).toBe(3);
  });

  test('prestige 0 → does NOT trigger a permission ask via gate', async () => {
    await mountHookWith({
      notificationsEnabled: true,
      prestigeCount: 0,
      notificationPermissionAsked: 0,
    });
    const { useGameStore } = await import('../../src/store/gameStore');
    // gate-1 ask requires prestigeCount >= 1; only the toggle-effect ensurePermission fired.
    expect(useGameStore.getState().notificationPermissionAsked).toBe(0);
  });

  test('notificationsEnabled=false suppresses gate asks even at high prestige', async () => {
    await mountHookWith({
      notificationsEnabled: false,
      prestigeCount: 5,
      notificationPermissionAsked: 0,
    });
    const { useGameStore } = await import('../../src/store/gameStore');
    expect(useGameStore.getState().notificationPermissionAsked).toBe(0);
  });
});

describe('usePushRuntime — visibilitychange→hidden scheduling', () => {
  async function mountAndHide(state: Partial<import('../../src/types/GameState').GameState> = {}): Promise<void> {
    await mountHookWith({ notificationsEnabled: true, ...state });
    // Drive the visibility transition.
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    await act(async () => { await Promise.resolve(); });
  }

  test('schedules offline cap reached push on hidden when permission granted', async () => {
    await mountAndHide({ currentOfflineCapHours: 4 });
    expect(scheduleOfflineCapReached).toHaveBeenCalled();
  });

  test('schedules streak-about-to-break only when dailyLoginStreak > 0', async () => {
    await mountAndHide({ dailyLoginStreak: 3 });
    expect(scheduleStreakAboutToBreak).toHaveBeenCalled();
  });

  test('does NOT schedule streak-about-to-break when dailyLoginStreak === 0', async () => {
    await mountAndHide({ dailyLoginStreak: 0 });
    expect(scheduleStreakAboutToBreak).not.toHaveBeenCalled();
  });

  test('does NOT schedule pushes when notificationsEnabled=false', async () => {
    await mountHookWith({ notificationsEnabled: false, dailyLoginStreak: 3, currentOfflineCapHours: 4 });
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    await act(async () => { await Promise.resolve(); });
    expect(scheduleOfflineCapReached).not.toHaveBeenCalled();
    expect(scheduleStreakAboutToBreak).not.toHaveBeenCalled();
  });
});
