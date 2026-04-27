// @vitest-environment jsdom
// Pre-launch audit Day 1 — SaveSyncIndicator error-banner tests.

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { SaveSyncIndicator } from '../../../src/ui/hud/SaveSyncIndicator';
import { useGameStore } from '../../../src/store/gameStore';
import { __resetSaveInFlightForTests } from '../../../src/store/saveScheduler';

beforeEach(() => {
  useGameStore.getState().reset();
  __resetSaveInFlightForTests();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('SaveSyncIndicator — error banner (audit Day 1)', () => {
  test('renders nothing when no save in flight and no error', () => {
    const { queryByTestId } = render(<SaveSyncIndicator />);
    expect(queryByTestId('save-error-banner')).toBeNull();
    expect(queryByTestId('save-sync-indicator')).toBeNull();
  });

  test('renders error banner when lastSaveError is set', () => {
    act(() => {
      useGameStore.getState().setLastSaveError('Quota exceeded');
    });
    const { getByTestId, queryByTestId } = render(<SaveSyncIndicator />);
    expect(getByTestId('save-error-banner')).toBeTruthy();
    expect(getByTestId('save-error-message').textContent).toBe('Quota exceeded');
    expect(getByTestId('save-error-retry')).toBeTruthy();
    expect(getByTestId('save-error-dismiss')).toBeTruthy();
    // The neutral pill should NOT render when the error banner is visible.
    expect(queryByTestId('save-sync-indicator')).toBeNull();
  });

  test('dismiss button clears the error', () => {
    act(() => {
      useGameStore.getState().setLastSaveError('Disk full');
    });
    const { getByTestId, queryByTestId } = render(<SaveSyncIndicator />);
    fireEvent.click(getByTestId('save-error-dismiss'));
    expect(useGameStore.getState().lastSaveError).toBeNull();
    expect(queryByTestId('save-error-banner')).toBeNull();
  });

  test('error banner uses role="alert" + aria-live="assertive" for screen readers', () => {
    act(() => {
      useGameStore.getState().setLastSaveError('Permission denied');
    });
    const { getByTestId } = render(<SaveSyncIndicator />);
    const banner = getByTestId('save-error-banner');
    expect(banner.getAttribute('role')).toBe('alert');
    expect(banner.getAttribute('aria-live')).toBe('assertive');
  });
});
