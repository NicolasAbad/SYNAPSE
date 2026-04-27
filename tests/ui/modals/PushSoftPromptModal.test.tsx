// @vitest-environment jsdom
// Pre-launch audit Tier-2 item D — push soft-prompt modal tests.

import { describe, expect, test, beforeEach, vi } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import { useGameStore, createDefaultState } from '../../../src/store/gameStore';

// Mock the scheduler so the test doesn't depend on Capacitor.
const ensurePermission = vi.fn(async () => true);
const scheduleDailyReminder = vi.fn(async () => {});
vi.mock('../../../src/platform/pushScheduler', () => ({
  createPushScheduler: () => ({
    ensurePermission,
    scheduleDailyReminder,
    scheduleOfflineCapReached: vi.fn(),
    scheduleStreakAboutToBreak: vi.fn(),
    scheduleStarterPackExpiringSoon: vi.fn(),
    cancelStarterPackExpiringSoon: vi.fn(),
    cancelAll: vi.fn(),
  }),
}));

beforeEach(() => {
  useGameStore.setState({ ...createDefaultState() });
  ensurePermission.mockClear();
  scheduleDailyReminder.mockClear();
});

async function mountModal(): Promise<ReturnType<typeof render>> {
  const { PushSoftPromptModal } = await import('../../../src/ui/modals/PushSoftPromptModal');
  return render(<PushSoftPromptModal />);
}

describe('PushSoftPromptModal', () => {
  test('does not render when pendingPushSoftPrompt is null', async () => {
    const { queryByTestId } = await mountModal();
    expect(queryByTestId('push-soft-prompt-modal')).toBeNull();
  });

  test('renders when pendingPushSoftPrompt is 1 (gate 1)', async () => {
    useGameStore.setState({ pendingPushSoftPrompt: 1 });
    const { getByTestId } = await mountModal();
    expect(getByTestId('push-soft-prompt-modal')).not.toBeNull();
    expect(getByTestId('push-soft-prompt-allow')).not.toBeNull();
    expect(getByTestId('push-soft-prompt-later')).not.toBeNull();
  });

  test('Allow → calls ensurePermission + clears pending + records gate as asked', async () => {
    useGameStore.setState({ pendingPushSoftPrompt: 1 });
    const { getByTestId } = await mountModal();
    await act(async () => {
      fireEvent.click(getByTestId('push-soft-prompt-allow'));
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(ensurePermission).toHaveBeenCalled();
    expect(scheduleDailyReminder).toHaveBeenCalled();
    expect(useGameStore.getState().pendingPushSoftPrompt).toBeNull();
    expect(useGameStore.getState().notificationPermissionAsked).toBeGreaterThanOrEqual(1);
  });

  test('Maybe Later → does NOT call native prompt + clears pending + still records gate', async () => {
    useGameStore.setState({ pendingPushSoftPrompt: 1 });
    const { getByTestId } = await mountModal();
    await act(async () => {
      fireEvent.click(getByTestId('push-soft-prompt-later'));
      await Promise.resolve();
    });
    expect(ensurePermission).not.toHaveBeenCalled();
    expect(useGameStore.getState().pendingPushSoftPrompt).toBeNull();
    expect(useGameStore.getState().notificationPermissionAsked).toBeGreaterThanOrEqual(1);
  });

  test('renders for gate 3 same as gate 1 (one shared modal copy)', async () => {
    useGameStore.setState({ pendingPushSoftPrompt: 3 });
    const { getByTestId } = await mountModal();
    expect(getByTestId('push-soft-prompt-modal')).not.toBeNull();
  });
});
