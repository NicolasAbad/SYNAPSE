// Pre-launch audit Tier 2 (C-2) — tutorial-skip action tests.

import { describe, expect, test, beforeEach } from 'vitest';
import {
  useGameStore, createDefaultState, TUTORIAL_HINTS_SKIPPED_KEY,
} from '../../src/store/gameStore';

beforeEach(() => {
  useGameStore.setState(createDefaultState());
});

describe('setTutorialHintsSkipped — store action', () => {
  test('default state: tutorial-skipped sentinel absent', () => {
    expect(useGameStore.getState().tabBadgesDismissed).not.toContain(TUTORIAL_HINTS_SKIPPED_KEY);
  });

  test('setTutorialHintsSkipped(true) appends the sentinel', () => {
    useGameStore.getState().setTutorialHintsSkipped(true);
    expect(useGameStore.getState().tabBadgesDismissed).toContain(TUTORIAL_HINTS_SKIPPED_KEY);
  });

  test('setTutorialHintsSkipped(false) removes the sentinel', () => {
    useGameStore.getState().setTutorialHintsSkipped(true);
    useGameStore.getState().setTutorialHintsSkipped(false);
    expect(useGameStore.getState().tabBadgesDismissed).not.toContain(TUTORIAL_HINTS_SKIPPED_KEY);
  });

  test('setTutorialHintsSkipped is idempotent (true twice → still one entry)', () => {
    useGameStore.getState().setTutorialHintsSkipped(true);
    const before = useGameStore.getState().tabBadgesDismissed.length;
    useGameStore.getState().setTutorialHintsSkipped(true);
    const after = useGameStore.getState().tabBadgesDismissed.length;
    expect(after).toBe(before);
  });

  test('does not disturb other dismissed-array entries', () => {
    useGameStore.setState({ tabBadgesDismissed: ['unlock:tab:regions', 'other_key'] });
    useGameStore.getState().setTutorialHintsSkipped(true);
    expect(useGameStore.getState().tabBadgesDismissed).toEqual(
      expect.arrayContaining(['unlock:tab:regions', 'other_key', TUTORIAL_HINTS_SKIPPED_KEY]),
    );
    useGameStore.getState().setTutorialHintsSkipped(false);
    expect(useGameStore.getState().tabBadgesDismissed).toEqual(
      expect.arrayContaining(['unlock:tab:regions', 'other_key']),
    );
    expect(useGameStore.getState().tabBadgesDismissed).not.toContain(TUTORIAL_HINTS_SKIPPED_KEY);
  });
});
