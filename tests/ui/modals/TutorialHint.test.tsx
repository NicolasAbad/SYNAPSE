// @vitest-environment jsdom
// Sprint 2 Phase 6 — UI-9 step 4 tutorial hint tests.

import { afterEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { TutorialHint } from '../../../src/ui/modals/TutorialHint';
import { SYNAPSE_CONSTANTS } from '../../../src/config/constants';
import { useGameStore } from '../../../src/store/gameStore';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  useGameStore.getState().reset();
});

describe('TutorialHint', () => {
  test('does NOT show immediately', () => {
    vi.useFakeTimers();
    const { queryByTestId } = render(<TutorialHint />);
    expect(queryByTestId('tutorial-hint')).toBeNull();
  });

  test('shows after firstOpenTutorialHintIdleMs when isTutorialCycle=true', () => {
    vi.useFakeTimers();
    const { queryByTestId } = render(<TutorialHint />);
    expect(queryByTestId('tutorial-hint')).toBeNull();
    act(() => {
      vi.advanceTimersByTime(SYNAPSE_CONSTANTS.firstOpenTutorialHintIdleMs);
    });
    expect(queryByTestId('tutorial-hint')?.textContent).toBe('Tap the neuron');
  });

  test('does NOT show if isTutorialCycle=false', () => {
    vi.useFakeTimers();
    useGameStore.setState({ isTutorialCycle: false });
    const { queryByTestId } = render(<TutorialHint />);
    act(() => {
      vi.advanceTimersByTime(SYNAPSE_CONSTANTS.firstOpenTutorialHintIdleMs * 3);
    });
    expect(queryByTestId('tutorial-hint')).toBeNull();
  });

  test('dismisses on pointerdown', () => {
    vi.useFakeTimers();
    const { queryByTestId } = render(<TutorialHint />);
    act(() => {
      vi.advanceTimersByTime(SYNAPSE_CONSTANTS.firstOpenTutorialHintIdleMs);
    });
    expect(queryByTestId('tutorial-hint')).not.toBeNull();
    act(() => {
      fireEvent.pointerDown(document);
    });
    expect(queryByTestId('tutorial-hint')).toBeNull();
  });
});
