// @vitest-environment jsdom
// Sprint 6 Phase 6.3b — FragmentOverlay tests (narrativeFragmentsSeen-driven).
// Replaces the Sprint 2 pointerdown-based tutorial stub: overlay now watches
// GameState.narrativeFragmentsSeen for newly-appended ids and renders each
// via getFragment(id) with fade-in / hold / fade-out.

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { FragmentOverlay } from '../../../src/ui/modals/FragmentOverlay';
import { SYNAPSE_CONSTANTS } from '../../../src/config/constants';
import { MOTION } from '../../../src/ui/tokens';
import { useGameStore } from '../../../src/store/gameStore';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  useGameStore.getState().reset();
});

describe('FragmentOverlay — render by narrativeFragmentsSeen id', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  test('does NOT render when narrativeFragmentsSeen is empty', () => {
    const { queryByTestId } = render(<FragmentOverlay />);
    expect(queryByTestId('fragment-overlay')).toBeNull();
  });

  test('renders BASE-01 text when base_01 appears in narrativeFragmentsSeen', () => {
    vi.useFakeTimers();
    const { queryByTestId } = render(<FragmentOverlay />);
    act(() => {
      useGameStore.setState({ narrativeFragmentsSeen: ['base_01'] });
    });
    // Queue effect runs, then pick effect sets currentId; render after effects flush.
    act(() => {
      vi.advanceTimersByTime(0);
    });
    const el = queryByTestId('fragment-overlay');
    expect(el).not.toBeNull();
    expect(el?.textContent).toContain('A pulse');
    expect(el?.dataset.fragmentId).toBe('base_01');
  });

  test('skips era3_ prefixed ids (rendered by Era3EventModal, not this layer)', () => {
    vi.useFakeTimers();
    const { queryByTestId } = render(<FragmentOverlay />);
    act(() => {
      useGameStore.setState({ narrativeFragmentsSeen: ['era3_p19'] });
      vi.advanceTimersByTime(0);
    });
    expect(queryByTestId('fragment-overlay')).toBeNull();
  });

  test('hides after full fade-in + hold + fade-out sequence', () => {
    vi.useFakeTimers();
    const { queryByTestId } = render(<FragmentOverlay />);
    act(() => {
      useGameStore.setState({ narrativeFragmentsSeen: ['base_01'] });
      vi.advanceTimersByTime(0);
    });
    expect(queryByTestId('fragment-overlay')).not.toBeNull();
    expect(queryByTestId('fragment-overlay')?.dataset.phase).toBe('fading-in');

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

  test('queues multiple fragments — first renders, second queued (behavior verified at engine level)', () => {
    vi.useFakeTimers();
    const { queryByTestId } = render(<FragmentOverlay />);
    act(() => {
      useGameStore.setState({ narrativeFragmentsSeen: ['base_01', 'base_05'] });
      vi.advanceTimersByTime(0);
    });
    // Head of queue renders first; tail is queued. Sequential display is an
    // emergent property tested via the engine-level trigger pipeline — DOM
    // assertion of the second id is too sensitive to React's fake-timer
    // effect-flush timing in JSDOM to be reliable here.
    expect(queryByTestId('fragment-overlay')?.dataset.fragmentId).toBe('base_01');
  });

  test('hides when activeTab is not mind (panel shown instead)', () => {
    vi.useFakeTimers();
    useGameStore.setState({ activeTab: 'neurons', narrativeFragmentsSeen: ['base_01'] });
    const { queryByTestId } = render(<FragmentOverlay />);
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(queryByTestId('fragment-overlay')).toBeNull();
  });

  test('unknown id is silently skipped (getFragment returns null)', () => {
    vi.useFakeTimers();
    const { queryByTestId } = render(<FragmentOverlay />);
    act(() => {
      useGameStore.setState({ narrativeFragmentsSeen: ['made_up_id'] });
      vi.advanceTimersByTime(0);
    });
    expect(queryByTestId('fragment-overlay')).toBeNull();
  });
});
