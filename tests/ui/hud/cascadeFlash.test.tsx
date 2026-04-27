// @vitest-environment jsdom
// Pre-launch audit Day 2 — FocusBar Cascade flash overlay test.

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { FocusBar } from '../../../src/ui/hud/FocusBar';
import { useGameStore } from '../../../src/store/gameStore';
import { _resetCascadeFlashListeners, publishCascadeFlash } from '../../../src/ui/hud/cascadeFlashEvents';

beforeEach(() => {
  useGameStore.getState().reset();
  _resetCascadeFlashListeners();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('FocusBar Cascade flash', () => {
  test('does not render flash overlay by default', () => {
    const { queryByTestId } = render(<FocusBar />);
    expect(queryByTestId('hud-focus-bar-flash')).toBeNull();
  });

  test('renders flash overlay when cascadeFlash is published', () => {
    const { queryByTestId } = render(<FocusBar />);
    act(() => { publishCascadeFlash(); });
    expect(queryByTestId('hud-focus-bar-flash')).toBeTruthy();
  });

  test('reducedMotion suppresses the visual flash', () => {
    act(() => { useGameStore.getState().setReducedMotion(true); });
    const { queryByTestId } = render(<FocusBar />);
    act(() => { publishCascadeFlash(); });
    expect(queryByTestId('hud-focus-bar-flash')).toBeNull();
  });
});
