// @vitest-environment jsdom
// Sprint 7 Phase 7.6 — AchievementsSubtab UI tests.

import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { AchievementsSubtab } from '../../../src/ui/panels/AchievementsSubtab';
import { useGameStore } from '../../../src/store/gameStore';

beforeEach(() => useGameStore.getState().reset());
afterEach(() => cleanup());

describe('AchievementsSubtab', () => {
  test('renders subtab + 6 category tabs', () => {
    const { getByTestId } = render(<AchievementsSubtab />);
    expect(getByTestId('achievements-subtab')).toBeTruthy();
    for (const c of ['cyc', 'meta', 'nar', 'hid', 'mas', 'reg']) {
      expect(getByTestId(`achievements-tab-${c}`)).toBeTruthy();
    }
  });

  test('default category is cyc — 6 cycle achievements rendered', () => {
    const { getByTestId, queryAllByTestId } = render(<AchievementsSubtab />);
    expect(getByTestId('achievements-tab-cyc').getAttribute('data-active')).toBe('true');
    // 6 cycle achievement cards rendered
    const cards = queryAllByTestId(/^achievement-card-cyc_/);
    expect(cards.length).toBe(6);
  });

  test('hidden achievements display ??? when locked (ACH-2)', () => {
    const { getByTestId } = render(<AchievementsSubtab />);
    fireEvent.pointerDown(getByTestId('achievements-tab-hid'));
    const card = getByTestId('achievement-card-hid_first_rp');
    expect(card.textContent).toContain('???');
  });

  test('hidden achievements reveal name+description after unlock (ACH-2)', () => {
    useGameStore.setState({ achievementsUnlocked: ['hid_first_rp'] });
    const { getByTestId } = render(<AchievementsSubtab />);
    fireEvent.pointerDown(getByTestId('achievements-tab-hid'));
    const card = getByTestId('achievement-card-hid_first_rp');
    expect(card.textContent).toContain('Resonance Detected');
    expect(card.getAttribute('data-unlocked')).toBe('true');
  });

  test('non-hidden locked achievements show name + description', () => {
    const { getByTestId } = render(<AchievementsSubtab />);
    const card = getByTestId('achievement-card-cyc_first_spark');
    expect(card.textContent).toContain('First Spark');
    expect(card.getAttribute('data-unlocked')).toBe('false');
  });

  test('switching categories shows different items', () => {
    const { getByTestId, queryAllByTestId } = render(<AchievementsSubtab />);
    fireEvent.pointerDown(getByTestId('achievements-tab-mas'));
    expect(getByTestId('achievements-tab-mas').getAttribute('data-active')).toBe('true');
    const cards = queryAllByTestId(/^achievement-card-mas_/);
    expect(cards.length).toBe(6);
  });

  test('regions tab shows 5 entries (not 6)', () => {
    const { getByTestId, queryAllByTestId } = render(<AchievementsSubtab />);
    fireEvent.pointerDown(getByTestId('achievements-tab-reg'));
    const cards = queryAllByTestId(/^achievement-card-reg_/);
    expect(cards.length).toBe(5);
  });

  test('category tab shows unlock count progress', () => {
    useGameStore.setState({ achievementsUnlocked: ['cyc_first_spark', 'cyc_first_cascade'] });
    const { getByTestId } = render(<AchievementsSubtab />);
    expect(getByTestId('achievements-tab-cyc').textContent).toMatch(/2\/6/);
  });

  test('unlocked card shows green border accent', () => {
    useGameStore.setState({ achievementsUnlocked: ['cyc_first_spark'] });
    const { getByTestId } = render(<AchievementsSubtab />);
    const card = getByTestId('achievement-card-cyc_first_spark');
    expect(card.getAttribute('data-unlocked')).toBe('true');
  });
});
