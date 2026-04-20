// @vitest-environment jsdom
// Sprint 2 Phase 6 — UI-9 step 5 BASE-01 fragment tests (DOM stub).

import { afterEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { FragmentOverlay } from '../../../src/ui/modals/FragmentOverlay';
import { SYNAPSE_CONSTANTS } from '../../../src/config/constants';
import { MOTION } from '../../../src/ui/tokens';
import { useGameStore } from '../../../src/store/gameStore';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  useGameStore.getState().reset();
});

describe('FragmentOverlay (BASE-01 DOM stub)', () => {
  test('does NOT render before first tap', () => {
    const { queryByTestId } = render(<FragmentOverlay />);
    expect(queryByTestId('fragment-overlay')).toBeNull();
  });

  test('renders BASE-01 text after first pointerdown', () => {
    vi.useFakeTimers();
    const { queryByTestId } = render(<FragmentOverlay />);
    act(() => {
      fireEvent.pointerDown(document);
    });
    const el = queryByTestId('fragment-overlay');
    expect(el).not.toBeNull();
    expect(el?.textContent).toContain('A pulse');
  });

  test('hides after full fade-in + hold + fade-out sequence', () => {
    vi.useFakeTimers();
    const { queryByTestId } = render(<FragmentOverlay />);
    act(() => {
      fireEvent.pointerDown(document);
    });
    expect(queryByTestId('fragment-overlay')).not.toBeNull();

    // Each phase transition schedules its own timer in useEffect, so effects
    // must flush between advances. Separate act() calls match React's real
    // runtime (one render-commit-effect cycle per phase).
    act(() => {
      vi.advanceTimersByTime(MOTION.durSlow);
    });
    expect(queryByTestId('fragment-overlay')?.dataset.phase).toBe('visible');
    act(() => {
      vi.advanceTimersByTime(SYNAPSE_CONSTANTS.narrativeFragmentDisplayMs);
    });
    expect(queryByTestId('fragment-overlay')?.dataset.phase).toBe('fading-out');
    act(() => {
      vi.advanceTimersByTime(MOTION.durSlow + 1);
    });
    expect(queryByTestId('fragment-overlay')).toBeNull();
  });

  test('does NOT render if isTutorialCycle=false', () => {
    useGameStore.setState({ isTutorialCycle: false });
    const { queryByTestId } = render(<FragmentOverlay />);
    act(() => {
      fireEvent.pointerDown(document);
    });
    expect(queryByTestId('fragment-overlay')).toBeNull();
  });

  test('only triggers once per session (second tap does not re-show)', () => {
    vi.useFakeTimers();
    const { queryByTestId } = render(<FragmentOverlay />);
    act(() => {
      fireEvent.pointerDown(document);
    });
    expect(queryByTestId('fragment-overlay')).not.toBeNull();

    // Walk all three phases to completion.
    act(() => {
      vi.advanceTimersByTime(MOTION.durSlow);
    });
    act(() => {
      vi.advanceTimersByTime(SYNAPSE_CONSTANTS.narrativeFragmentDisplayMs);
    });
    act(() => {
      vi.advanceTimersByTime(MOTION.durSlow + 1);
    });
    expect(queryByTestId('fragment-overlay')).toBeNull();

    act(() => {
      fireEvent.pointerDown(document);
      vi.advanceTimersByTime(MOTION.durSlow);
    });
    expect(queryByTestId('fragment-overlay')).toBeNull();
  });
});
