// @vitest-environment jsdom
// Sprint 7.5 Phase 7.5.7 — NamedMomentPrompt modal smoke tests.

import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { NamedMomentPrompt } from '../../../src/ui/modals/NamedMomentPrompt';
import { useGameStore } from '../../../src/store/gameStore';

beforeEach(() => useGameStore.getState().reset());
afterEach(() => cleanup());

describe('NamedMomentPrompt — visibility', () => {
  test('renders nothing when no Named Moment is pending (default state)', () => {
    const { queryByTestId } = render(<NamedMomentPrompt />);
    expect(queryByTestId('named-moment-prompt')).toBeNull();
  });

  test('renders first_awakening prompt at prestigeCount=1 with no logged moments', () => {
    useGameStore.setState({ prestigeCount: 1 });
    const { getByTestId } = render(<NamedMomentPrompt />);
    const modal = getByTestId('named-moment-prompt');
    expect(modal.getAttribute('data-moment-id')).toBe('first_awakening');
  });

  test('hides after the moment is logged', () => {
    useGameStore.setState({ prestigeCount: 1, brocaNamedMoments: [{ momentId: 'first_awakening', phrase: 'I begin.' }] });
    const { queryByTestId } = render(<NamedMomentPrompt />);
    expect(queryByTestId('named-moment-prompt')).toBeNull();
  });
});

describe('NamedMomentPrompt — author + skip flow', () => {
  test('skip button calls skipNamedMoment and substitutes default phrase', () => {
    useGameStore.setState({ prestigeCount: 1 });
    const { getByTestId, queryByTestId } = render(<NamedMomentPrompt />);
    fireEvent.pointerDown(getByTestId('named-moment-skip'));
    // After skip, the moment is logged and modal disappears.
    expect(queryByTestId('named-moment-prompt')).toBeNull();
    const moments = useGameStore.getState().brocaNamedMoments;
    expect(moments.length).toBe(1);
    expect(moments[0].momentId).toBe('first_awakening');
    expect(moments[0].phrase).toBe('I begin.'); // null-archetype neutral fallback
  });

  test('author button is disabled when input is empty', () => {
    useGameStore.setState({ prestigeCount: 1 });
    const { getByTestId } = render(<NamedMomentPrompt />);
    const btn = getByTestId('named-moment-author') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  test('author flow saves the player-provided phrase', () => {
    useGameStore.setState({ prestigeCount: 1 });
    const { getByTestId, queryByTestId } = render(<NamedMomentPrompt />);
    fireEvent.change(getByTestId('named-moment-input'), { target: { value: 'My very first thought.' } });
    fireEvent.pointerDown(getByTestId('named-moment-author'));
    expect(queryByTestId('named-moment-prompt')).toBeNull();
    const moments = useGameStore.getState().brocaNamedMoments;
    expect(moments[0].phrase).toBe('My very first thought.');
  });
});
