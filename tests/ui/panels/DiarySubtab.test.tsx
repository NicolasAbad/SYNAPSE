// @vitest-environment jsdom
// Sprint 7 Phase 7.5 — DiarySubtab UI tests.

import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { render, cleanup, screen } from '@testing-library/react';
import { DiarySubtab } from '../../../src/ui/panels/DiarySubtab';
import { useGameStore } from '../../../src/store/gameStore';

beforeEach(() => {
  useGameStore.getState().reset();
});

afterEach(() => {
  cleanup();
});

describe('DiarySubtab', () => {
  test('renders empty state when no diary entries', () => {
    render(<DiarySubtab />);
    expect(screen.getByTestId('diary-subtab-empty')).toBeTruthy();
  });

  test('renders entry count when entries exist', () => {
    useGameStore.setState({
      diaryEntries: [
        { timestamp: 1000, type: 'prestige', data: { prestigeCount: 1, cycleDurationMs: 600_000, memoriesGained: 2, wasPersonalBest: false } },
      ],
    });
    render(<DiarySubtab />);
    expect(screen.getByTestId('diary-subtab')).toBeTruthy();
    expect(screen.getByText(/1 entries/)).toBeTruthy();
  });

  test('renders prestige entry with title + subtitle', () => {
    useGameStore.setState({
      diaryEntries: [
        { timestamp: 1000, type: 'prestige', data: { prestigeCount: 5, cycleDurationMs: 720_000, memoriesGained: 3, wasPersonalBest: true } },
      ],
    });
    render(<DiarySubtab />);
    expect(screen.getByTestId('diary-entry-prestige')).toBeTruthy();
    expect(screen.getByText(/Awakening #5/)).toBeTruthy();
  });

  test('renders achievement entry by id lookup', () => {
    useGameStore.setState({
      diaryEntries: [
        { timestamp: 1000, type: 'achievement', data: { achievementId: 'cyc_first_spark', reward: 3 } },
      ],
    });
    render(<DiarySubtab />);
    expect(screen.getByTestId('diary-entry-achievement')).toBeTruthy();
    expect(screen.getByText(/First Spark/)).toBeTruthy();
  });

  test('renders resonant_pattern entry', () => {
    useGameStore.setState({
      diaryEntries: [
        { timestamp: 1000, type: 'resonant_pattern', data: { rpIndex: 0, rpNumber: 1 } },
      ],
    });
    render(<DiarySubtab />);
    expect(screen.getByTestId('diary-entry-resonant_pattern')).toBeTruthy();
    expect(screen.getByText(/Resonant Pattern #1/)).toBeTruthy();
  });

  test('renders ending entry', () => {
    useGameStore.setState({
      diaryEntries: [
        { timestamp: 1000, type: 'ending', data: { endingId: 'equation', option: 'a' } },
      ],
    });
    render(<DiarySubtab />);
    expect(screen.getByTestId('diary-entry-ending')).toBeTruthy();
    expect(screen.getByText(/Choice: A/)).toBeTruthy();
  });

  test('renders spontaneous entry', () => {
    useGameStore.setState({
      diaryEntries: [
        { timestamp: 1000, type: 'spontaneous', data: { spontaneousId: 'eureka', eventType: 'positive' } },
      ],
    });
    render(<DiarySubtab />);
    expect(screen.getByTestId('diary-entry-spontaneous')).toBeTruthy();
    expect(screen.getByText(/Eureka/)).toBeTruthy();
  });

  test('renders entries reverse-chronologically (latest first)', () => {
    useGameStore.setState({
      diaryEntries: [
        { timestamp: 1000, type: 'prestige', data: { prestigeCount: 1, cycleDurationMs: 600_000, memoriesGained: 2, wasPersonalBest: false } },
        { timestamp: 2000, type: 'achievement', data: { achievementId: 'cyc_first_spark', reward: 3 } },
        { timestamp: 3000, type: 'prestige', data: { prestigeCount: 2, cycleDurationMs: 580_000, memoriesGained: 2, wasPersonalBest: true } },
      ],
    });
    render(<DiarySubtab />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    // First rendered = latest entry (Awakening #2)
    expect(items[0].textContent).toContain('Awakening #2');
    expect(items[1].textContent).toContain('First Spark');
    expect(items[2].textContent).toContain('Awakening #1');
  });

  test('handles 100+ entries without crash (UI scalability)', () => {
    const entries = Array.from({ length: 100 }, (_, i) => ({
      timestamp: i,
      type: 'prestige' as const,
      data: { prestigeCount: i, cycleDurationMs: 600_000, memoriesGained: 2, wasPersonalBest: false },
    }));
    useGameStore.setState({ diaryEntries: entries });
    render(<DiarySubtab />);
    expect(screen.getByText(/100 entries/)).toBeTruthy();
  });
});

describe('DiarySubtab — engine wirings (Sprint 7.2 + 7.5 integration)', () => {
  test('prestige writes prestige + RP + personal_best diary entries', () => {
    useGameStore.setState({
      cycleGenerated: 25_000,
      currentThreshold: 25_000,
      cycleStartTimestamp: 0,
      cycleDischargesUsed: 0,
      cycleNeuronPurchases: [
        { type: 'basica', timestamp: 10_000 },
        { type: 'sensorial', timestamp: 20_000 },
        { type: 'piramidal', timestamp: 40_000 },
        { type: 'espejo', timestamp: 60_000 },
        { type: 'integradora', timestamp: 100_000 },
      ],
    });
    useGameStore.getState().prestige(110_000);
    const after = useGameStore.getState();
    const types = after.diaryEntries.map((e) => e.type);
    expect(types).toContain('prestige');
    expect(types).toContain('personal_best');
    // RP-1 should fire (5 types within 2 min) and write resonant_pattern entry
    expect(types).toContain('resonant_pattern');
  });
});
