// @vitest-environment jsdom
// Sprint 3.6.5 — NetworkErrorToast scaffold (GDD §29 UI-8).

import { afterEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { NetworkErrorToast } from '../../../src/ui/hud/NetworkErrorToast';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('NetworkErrorToast', () => {
  test('renders nothing when message is null', () => {
    const { queryByTestId } = render(<NetworkErrorToast message={null} onDismiss={() => {}} />);
    expect(queryByTestId('hud-network-error-toast')).toBeNull();
  });

  test('renders the message when non-null', () => {
    const { queryByTestId } = render(
      <NetworkErrorToast message="Store temporarily unavailable" onDismiss={() => {}} />,
    );
    const toast = queryByTestId('hud-network-error-toast');
    expect(toast).not.toBeNull();
    expect(toast?.textContent).toBe('Store temporarily unavailable');
    expect(toast?.getAttribute('role')).toBe('alert');
  });

  test('pointerdown calls onDismiss', () => {
    const onDismiss = vi.fn();
    const { getByTestId } = render(<NetworkErrorToast message="x" onDismiss={onDismiss} />);
    fireEvent.pointerDown(getByTestId('hud-network-error-toast'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test('auto-dismisses after durationMs', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(<NetworkErrorToast message="timeout test" onDismiss={onDismiss} durationMs={3000} />);
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test('without durationMs, no auto-dismiss', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(<NetworkErrorToast message="persistent" onDismiss={onDismiss} />);
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
