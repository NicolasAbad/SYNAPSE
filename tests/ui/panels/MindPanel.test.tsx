// @vitest-environment jsdom
// Tests for src/ui/panels/MindPanel.tsx (Sprint 4b Phase 4b.4 subtab router).

import { afterEach, describe, expect, test } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { MindPanel } from '../../../src/ui/panels/MindPanel';
import { useGameStore } from '../../../src/store/gameStore';

afterEach(() => {
  cleanup();
  useGameStore.getState().reset();
});

// Pre-launch audit Dimension M (M-3) — subtabs are gated by prestige.
// P0 cold-start renders 2 subtabs (home + achievements). Patterns/diary
// at P1; mastery at P5; archetypes at P7; resonance at P13.
// Tests seed prestigeCount when they need a gated subtab.

describe('MindPanel — subtab bar rendering (Dimension M)', () => {
  test('P0 default: renders 2 subtab buttons (home + achievements)', () => {
    const { queryByTestId } = render(<MindPanel />);
    expect(queryByTestId('mind-subtab-home')).not.toBeNull();
    expect(queryByTestId('mind-subtab-achievements')).not.toBeNull();
    expect(queryByTestId('mind-subtab-patterns')).toBeNull();
    expect(queryByTestId('mind-subtab-archetypes')).toBeNull();
    expect(queryByTestId('mind-subtab-diary')).toBeNull();
    expect(queryByTestId('mind-subtab-resonance')).toBeNull();
    expect(queryByTestId('mind-subtab-mastery')).toBeNull();
  });

  test('P1+: patterns + diary subtabs unlock', () => {
    useGameStore.setState({ prestigeCount: 1 });
    const { queryByTestId } = render(<MindPanel />);
    expect(queryByTestId('mind-subtab-patterns')).not.toBeNull();
    expect(queryByTestId('mind-subtab-diary')).not.toBeNull();
    expect(queryByTestId('mind-subtab-mastery')).toBeNull(); // still gated
  });

  test('P5+: mastery subtab unlocks', () => {
    useGameStore.setState({ prestigeCount: 5 });
    const { queryByTestId } = render(<MindPanel />);
    expect(queryByTestId('mind-subtab-mastery')).not.toBeNull();
    expect(queryByTestId('mind-subtab-archetypes')).toBeNull(); // still gated
  });

  test('P7+: archetypes subtab unlocks', () => {
    useGameStore.setState({ prestigeCount: 7 });
    const { queryByTestId } = render(<MindPanel />);
    expect(queryByTestId('mind-subtab-archetypes')).not.toBeNull();
    expect(queryByTestId('mind-subtab-resonance')).toBeNull(); // still gated
  });

  test('P13+: resonance subtab unlocks (all 7 subtabs visible)', () => {
    useGameStore.setState({ prestigeCount: 13 });
    const { queryByTestId } = render(<MindPanel />);
    for (const id of ['home', 'patterns', 'archetypes', 'diary', 'achievements', 'resonance', 'mastery']) {
      expect(queryByTestId(`mind-subtab-${id}`)).not.toBeNull();
    }
  });

  test('default subtab is home — no body overlay', () => {
    const { queryByTestId } = render(<MindPanel />);
    for (const key of ['patterns', 'archetypes', 'diary', 'achievements', 'resonance']) {
      expect(queryByTestId(`mind-subtab-body-${key}`)).toBeNull();
    }
  });
});

describe('MindPanel — switching to non-home subtab overlays body (gated)', () => {
  test('P1: clicking patterns opens the pattern tree body', () => {
    useGameStore.setState({ prestigeCount: 1 });
    const { getByTestId } = render(<MindPanel />);
    fireEvent.pointerDown(getByTestId('mind-subtab-patterns'));
    expect(getByTestId('mind-subtab-body-patterns')).toBeTruthy();
    expect(getByTestId('pattern-tree-view')).toBeTruthy();
  });

  test('P7: clicking archetypes shows the placeholder', () => {
    useGameStore.setState({ prestigeCount: 7 });
    const { getByTestId } = render(<MindPanel />);
    fireEvent.pointerDown(getByTestId('mind-subtab-archetypes'));
    const body = getByTestId('mind-subtab-body-archetypes');
    const placeholder = body.querySelector('[data-testid="mind-subtab-placeholder"]');
    expect(placeholder).toBeTruthy();
    expect(placeholder?.textContent).toContain('archetype');
  });

  test('P1: clicking diary shows the DiarySubtab', () => {
    useGameStore.setState({ prestigeCount: 1 });
    const { getByTestId } = render(<MindPanel />);
    fireEvent.pointerDown(getByTestId('mind-subtab-diary'));
    expect(getByTestId('diary-subtab-empty')).toBeTruthy();
  });

  test('P0: clicking achievements shows the AchievementsSubtab (always available)', () => {
    const { getByTestId } = render(<MindPanel />);
    fireEvent.pointerDown(getByTestId('mind-subtab-achievements'));
    expect(getByTestId('achievements-subtab')).toBeTruthy();
  });

  test('P13: clicking resonance shows Sprint 8b placeholder', () => {
    useGameStore.setState({ prestigeCount: 13 });
    const { getByTestId } = render(<MindPanel />);
    fireEvent.pointerDown(getByTestId('mind-subtab-resonance'));
    expect(getByTestId('mind-subtab-body-resonance').textContent).toContain('Sprint 8b');
  });
});

describe('MindPanel — home subtab restoration + snap-back', () => {
  test('P1: clicking home after a non-home subtab closes the body', () => {
    useGameStore.setState({ prestigeCount: 1 });
    const { getByTestId, queryByTestId } = render(<MindPanel />);
    fireEvent.pointerDown(getByTestId('mind-subtab-patterns'));
    expect(queryByTestId('mind-subtab-body-patterns')).toBeTruthy();
    fireEvent.pointerDown(getByTestId('mind-subtab-home'));
    expect(queryByTestId('mind-subtab-body-patterns')).toBeNull();
  });

  test('M-3 snap-back: legacy save with activeMindSubtab=resonance at P0 snaps to home', () => {
    useGameStore.setState({ prestigeCount: 0, activeMindSubtab: 'resonance' });
    render(<MindPanel />);
    expect(useGameStore.getState().activeMindSubtab).toBe('home');
  });
});
