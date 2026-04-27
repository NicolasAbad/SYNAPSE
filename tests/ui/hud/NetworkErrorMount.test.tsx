// @vitest-environment jsdom
// Pre-launch audit Day 2 — NetworkErrorMount integration tests.

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { NetworkErrorMount } from '../../../src/ui/hud/NetworkErrorMount';
import { useGameStore } from '../../../src/store/gameStore';

beforeEach(() => {
  useGameStore.getState().reset();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('NetworkErrorMount', () => {
  test('renders nothing when networkError is null', () => {
    const { queryByTestId } = render(<NetworkErrorMount />);
    expect(queryByTestId('hud-network-error-toast')).toBeNull();
  });

  test('renders toast when networkError is set', () => {
    act(() => {
      useGameStore.getState().setNetworkError('Ad unavailable. Try again later.');
    });
    const { getByTestId } = render(<NetworkErrorMount />);
    const toast = getByTestId('hud-network-error-toast');
    expect(toast.textContent).toBe('Ad unavailable. Try again later.');
    expect(toast.getAttribute('role')).toBe('alert');
  });

  test('tapping toast dismisses (clears networkError)', () => {
    act(() => {
      useGameStore.getState().setNetworkError('Store unavailable.');
    });
    const { getByTestId } = render(<NetworkErrorMount />);
    fireEvent.pointerDown(getByTestId('hud-network-error-toast'));
    expect(useGameStore.getState().networkError).toBeNull();
  });
});
