// @vitest-environment jsdom
// Sprint 10 Phase 10.1 (V-4) — SaveSyncIndicator tests.
// Validates: pill hidden by default; appears when notifier fires (true);
// stays visible until fade window after (false); re-arms if (true) fires
// again before the fade completes.

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { SaveSyncIndicator } from '../../../src/ui/hud/SaveSyncIndicator';
import {
  __resetSaveInFlightForTests,
  __notifySaveStatusForTests,
} from '../../../src/store/saveScheduler';
import { SYNAPSE_CONSTANTS } from '../../../src/config/constants';

beforeEach(() => {
  __resetSaveInFlightForTests();
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  __resetSaveInFlightForTests();
});

describe('SaveSyncIndicator — visibility transitions', () => {
  test('hidden by default (no save in flight on mount)', () => {
    const { queryByTestId } = render(<SaveSyncIndicator />);
    expect(queryByTestId('save-sync-indicator')).toBeNull();
  });

  test('renders pill immediately when notifier fires (true)', () => {
    const { queryByTestId } = render(<SaveSyncIndicator />);
    expect(queryByTestId('save-sync-indicator')).toBeNull();
    act(() => { __notifySaveStatusForTests(true); });
    expect(queryByTestId('save-sync-indicator')).not.toBeNull();
  });

  test('stays visible immediately after (false) until fade timer fires', () => {
    const { queryByTestId } = render(<SaveSyncIndicator />);
    act(() => { __notifySaveStatusForTests(true); });
    expect(queryByTestId('save-sync-indicator')).not.toBeNull();
    act(() => { __notifySaveStatusForTests(false); });
    // Still visible during fade hold.
    expect(queryByTestId('save-sync-indicator')).not.toBeNull();
    act(() => { vi.advanceTimersByTime(SYNAPSE_CONSTANTS.saveSyncIndicatorFadeMs + 50); });
    expect(queryByTestId('save-sync-indicator')).toBeNull();
  });

  test('re-arms if (true) fires again before fade completes', () => {
    const { queryByTestId } = render(<SaveSyncIndicator />);
    act(() => { __notifySaveStatusForTests(true); });
    act(() => { __notifySaveStatusForTests(false); });
    // Halfway through the fade window, fire (true) again — pill should stay.
    act(() => { vi.advanceTimersByTime(SYNAPSE_CONSTANTS.saveSyncIndicatorFadeMs / 2); });
    act(() => { __notifySaveStatusForTests(true); });
    // Now advance past the original fade window — should still be visible
    // because the second (true) cancelled the prior timer.
    act(() => { vi.advanceTimersByTime(SYNAPSE_CONSTANTS.saveSyncIndicatorFadeMs); });
    expect(queryByTestId('save-sync-indicator')).not.toBeNull();
  });

  test('role=status + aria-live=polite for screen readers', () => {
    const { getByTestId } = render(<SaveSyncIndicator />);
    act(() => { __notifySaveStatusForTests(true); });
    const pill = getByTestId('save-sync-indicator');
    expect(pill.getAttribute('role')).toBe('status');
    expect(pill.getAttribute('aria-live')).toBe('polite');
  });
});
