// @vitest-environment jsdom
// Sprint 2 Phase 6 — UI-9 step 1 splash tests.

import { afterEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { SplashScreen } from '../../../src/ui/modals/SplashScreen';
import { SYNAPSE_CONSTANTS } from '../../../src/config/constants';
import { MOTION } from '../../../src/ui/tokens';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('SplashScreen', () => {
  test('renders with app name', () => {
    const { getByTestId } = render(<SplashScreen onComplete={() => {}} />);
    expect(getByTestId('splash-title').textContent).toBe('SYNAPSE');
  });

  test('calls onComplete after splashDurationMs + fade-out', () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    render(<SplashScreen onComplete={onComplete} />);
    expect(onComplete).not.toHaveBeenCalled();

    // Still visible during hold period.
    act(() => {
      vi.advanceTimersByTime(SYNAPSE_CONSTANTS.splashDurationMs - 1);
    });
    expect(onComplete).not.toHaveBeenCalled();

    // After full hold + fade-out duration, onComplete fires.
    act(() => {
      vi.advanceTimersByTime(MOTION.durSlow + 1);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test('fade-out marker applied before onComplete fires', () => {
    vi.useFakeTimers();
    const { getByTestId } = render(<SplashScreen onComplete={() => {}} />);
    expect(getByTestId('splash-screen').dataset.fading).toBe('false');

    act(() => {
      vi.advanceTimersByTime(SYNAPSE_CONSTANTS.splashDurationMs);
    });
    expect(getByTestId('splash-screen').dataset.fading).toBe('true');
  });
});
