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

describe('MindPanel — subtab bar rendering', () => {
  test('renders all 6 subtab buttons', () => {
    const { getByTestId } = render(<MindPanel />);
    expect(getByTestId('mind-subtab-home')).toBeTruthy();
    expect(getByTestId('mind-subtab-patterns')).toBeTruthy();
    expect(getByTestId('mind-subtab-archetypes')).toBeTruthy();
    expect(getByTestId('mind-subtab-diary')).toBeTruthy();
    expect(getByTestId('mind-subtab-achievements')).toBeTruthy();
    expect(getByTestId('mind-subtab-resonance')).toBeTruthy();
  });

  test('default subtab is home — no body overlay', () => {
    const { queryByTestId } = render(<MindPanel />);
    for (const key of ['patterns', 'archetypes', 'diary', 'achievements', 'resonance']) {
      expect(queryByTestId(`mind-subtab-body-${key}`)).toBeNull();
    }
  });
});

describe('MindPanel — switching to non-home subtab overlays body', () => {
  test('clicking patterns opens the pattern tree body', () => {
    const { getByTestId } = render(<MindPanel />);
    fireEvent.pointerDown(getByTestId('mind-subtab-patterns'));
    expect(getByTestId('mind-subtab-body-patterns')).toBeTruthy();
    expect(getByTestId('pattern-tree-view')).toBeTruthy();
  });

  test('clicking archetypes shows the placeholder (Sprint 7.6 will replace with real panel)', () => {
    const { getByTestId } = render(<MindPanel />);
    fireEvent.pointerDown(getByTestId('mind-subtab-archetypes'));
    const body = getByTestId('mind-subtab-body-archetypes');
    const placeholder = body.querySelector('[data-testid="mind-subtab-placeholder"]');
    expect(placeholder).toBeTruthy();
    expect(placeholder?.textContent).toContain('archetype');
  });

  test('clicking diary shows the DiarySubtab (Sprint 7.5 wired)', () => {
    const { getByTestId } = render(<MindPanel />);
    fireEvent.pointerDown(getByTestId('mind-subtab-diary'));
    // Empty default state → DiarySubtab renders empty-state component
    expect(getByTestId('diary-subtab-empty')).toBeTruthy();
  });

  test('clicking achievements shows the AchievementsSubtab (Sprint 7.6 wired)', () => {
    const { getByTestId } = render(<MindPanel />);
    fireEvent.pointerDown(getByTestId('mind-subtab-achievements'));
    expect(getByTestId('achievements-subtab')).toBeTruthy();
  });

  test('clicking resonance shows Sprint 8b placeholder', () => {
    const { getByTestId } = render(<MindPanel />);
    fireEvent.pointerDown(getByTestId('mind-subtab-resonance'));
    expect(getByTestId('mind-subtab-body-resonance').textContent).toContain('Sprint 8b');
  });
});

describe('MindPanel — home subtab restoration', () => {
  test('clicking home after a non-home subtab closes the body', () => {
    const { getByTestId, queryByTestId } = render(<MindPanel />);
    fireEvent.pointerDown(getByTestId('mind-subtab-patterns'));
    expect(queryByTestId('mind-subtab-body-patterns')).toBeTruthy();
    fireEvent.pointerDown(getByTestId('mind-subtab-home'));
    expect(queryByTestId('mind-subtab-body-patterns')).toBeNull();
  });
});
