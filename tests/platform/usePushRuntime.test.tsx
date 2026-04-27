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
const scheduleStarterPackExpiringSoon = vi.fn(async () => {});
const cancelStarterPackExpiringSoon = vi.fn(async () => {});
const cancelAll = vi.fn(async () => {});

vi.mock('../../src/platform/pushScheduler', () => ({
  createPushScheduler: () => ({
    ensurePermission,
    scheduleDailyReminder,
    scheduleOfflineCapReached,
    scheduleStreakAboutToBreak,
    scheduleStarterPackExpiringSoon,
    cancelStarterPackExpiringSoon,
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
  // Reset UI ephemeral state alongside the GameState defaults — these fields
  // live on the store but are not part of GameState (and so not reset by
  // createDefaultState alone). Without this, soft-prompt state leaks across
  // tests via the singleton store.
  useGameStore.setState({ ...createDefaultState(), pendingPushSoftPrompt: null, ...stateOverrides });
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

describe('usePushRuntime — soft-prompt gate cadence (audit Tier-2 D)', () => {
  test('prestige 1+ with notificationPermissionAsked=0 → opens soft-prompt for gate 1', async () => {
    await mountHookWith({
      notificationsEnabled: true,
      prestigeCount: 1,
      notificationPermissionAsked: 0,
    });
    const { useGameStore } = await import('../../src/store/gameStore');
    expect(useGameStore.getState().pendingPushSoftPrompt).toBe(1);
    // notificationPermissionAsked is NOT advanced here — the modal does that.
    expect(useGameStore.getState().notificationPermissionAsked).toBe(0);
  });

  test('prestige 3+ with notificationPermissionAsked=1 → opens soft-prompt for gate 3', async () => {
    await mountHookWith({
      notificationsEnabled: true,
      prestigeCount: 3,
      notificationPermissionAsked: 1,
    });
    const { useGameStore } = await import('../../src/store/gameStore');
    expect(useGameStore.getState().pendingPushSoftPrompt).toBe(3);
  });

  test('prestige 0 → soft-prompt stays null', async () => {
    await mountHookWith({
      notificationsEnabled: true,
      prestigeCount: 0,
      notificationPermissionAsked: 0,
    });
    const { useGameStore } = await import('../../src/store/gameStore');
    expect(useGameStore.getState().pendingPushSoftPrompt).toBeNull();
  });

  test('notificationsEnabled=false suppresses soft-prompt at any prestige', async () => {
    await mountHookWith({
      notificationsEnabled: false,
      prestigeCount: 5,
      notificationPermissionAsked: 0,
    });
    const { useGameStore } = await import('../../src/store/gameStore');
    expect(useGameStore.getState().pendingPushSoftPrompt).toBeNull();
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

describe('usePushRuntime — Starter Pack expiry reminder (audit Tier-2 D)', () => {
  test('schedules at expiresAt minus 24h when offer is live + permission granted', async () => {
    const expiresAt = Date.now() + 48 * 60 * 60 * 1000; // 48h ahead
    await mountHookWith({
      notificationsEnabled: true,
      starterPackExpiresAt: expiresAt,
      starterPackPurchased: false,
      starterPackDismissed: false,
    });
    expect(scheduleStarterPackExpiringSoon).toHaveBeenCalled();
    const firstCall = scheduleStarterPackExpiringSoon.mock.calls[0] as unknown as [number] | undefined;
    expect(firstCall).toBeDefined();
    const fireAt = firstCall?.[0] ?? 0;
    // Within ±1s of expiresAt - 24h.
    const expected = expiresAt - 24 * 60 * 60 * 1000;
    expect(Math.abs(fireAt - expected)).toBeLessThan(1000);
  });

  test('does NOT schedule when starterPackExpiresAt === 0 (no offer active)', async () => {
    await mountHookWith({ notificationsEnabled: true, starterPackExpiresAt: 0 });
    expect(scheduleStarterPackExpiringSoon).not.toHaveBeenCalled();
  });

  test('cancels when player has purchased the pack', async () => {
    await mountHookWith({
      notificationsEnabled: true,
      starterPackExpiresAt: Date.now() + 48 * 60 * 60 * 1000,
      starterPackPurchased: true,
    });
    expect(cancelStarterPackExpiringSoon).toHaveBeenCalled();
    expect(scheduleStarterPackExpiringSoon).not.toHaveBeenCalled();
  });

  test('cancels when player has dismissed the offer', async () => {
    await mountHookWith({
      notificationsEnabled: true,
      starterPackExpiresAt: Date.now() + 48 * 60 * 60 * 1000,
      starterPackDismissed: true,
    });
    expect(cancelStarterPackExpiringSoon).toHaveBeenCalled();
    expect(scheduleStarterPackExpiringSoon).not.toHaveBeenCalled();
  });

  test('does NOT schedule when computed fireAt is already in the past (offer ends in <24h)', async () => {
    await mountHookWith({
      notificationsEnabled: true,
      starterPackExpiresAt: Date.now() + 60 * 60 * 1000, // 1h ahead
    });
    expect(scheduleStarterPackExpiringSoon).not.toHaveBeenCalled();
  });

  test('does NOT schedule when notificationsEnabled=false even if offer is live', async () => {
    await mountHookWith({
      notificationsEnabled: false,
      starterPackExpiresAt: Date.now() + 48 * 60 * 60 * 1000,
    });
    expect(scheduleStarterPackExpiringSoon).not.toHaveBeenCalled();
  });
});
