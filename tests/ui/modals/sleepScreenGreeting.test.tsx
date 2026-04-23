// @vitest-environment jsdom
// Sprint 7.10 Phase 7.10.6 — OFFLINE-10 returning-player greeting tests.

import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { SleepScreen } from '../../../src/ui/modals/SleepScreen';
import { useGameStore, createDefaultState } from '../../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../../src/config/constants';
import { en } from '../../../src/config/strings/en';
import type { OfflineSummary } from '../../../src/types';

const LONG_OFFLINE_MS = SYNAPSE_CONSTANTS.lucidDreamMinOfflineMinutes * 60 * 1000;

function summaryWith(tier: 0 | 1 | 2 | 3 | 4, elapsedMs: number = LONG_OFFLINE_MS): OfflineSummary {
  return {
    elapsedMs, gained: 1000, efficiency: 0.5, avgMood: 30, avgMoodTier: tier,
    capHours: 4, cappedHit: false, timeAnomaly: null,
    enhancedDischargeAvailable: false, lucidDreamTriggered: false,
  };
}

afterEach(() => {
  cleanup();
  useGameStore.getState().reset();
});

describe('OFFLINE-10 greeting — render gates', () => {
  beforeEach(() => {
    useGameStore.setState({ ...createDefaultState() });
  });

  test('greeting shows when elapsed ≥ lucidDreamMinOfflineMinutes', () => {
    act(() => {
      useGameStore.setState({ pendingOfflineSummary: summaryWith(2) });
    });
    const { queryByTestId } = render(<SleepScreen />);
    expect(queryByTestId('sleep-greeting')).not.toBeNull();
  });

  test('greeting does NOT show when elapsed < lucidDreamMinOfflineMinutes', () => {
    act(() => {
      useGameStore.setState({ pendingOfflineSummary: summaryWith(2, 5 * 60 * 1000) }); // 5 min
    });
    const { queryByTestId } = render(<SleepScreen />);
    expect(queryByTestId('sleep-greeting')).toBeNull();
  });
});

describe('OFFLINE-10 greeting — mood tier → correct string', () => {
  beforeEach(() => {
    useGameStore.setState({ ...createDefaultState() });
  });

  test('Numb (tier 0) → numb greeting', () => {
    act(() => {
      useGameStore.setState({ pendingOfflineSummary: summaryWith(0) });
    });
    const { getByTestId } = render(<SleepScreen />);
    expect(getByTestId('sleep-greeting').textContent).toBe(en.sleep.greetings.numb);
  });

  test('Calm (tier 1) → calm greeting', () => {
    act(() => {
      useGameStore.setState({ pendingOfflineSummary: summaryWith(1) });
    });
    const { getByTestId } = render(<SleepScreen />);
    expect(getByTestId('sleep-greeting').textContent).toBe(en.sleep.greetings.calm);
  });

  test('Engaged (tier 2) → engaged greeting', () => {
    act(() => {
      useGameStore.setState({ pendingOfflineSummary: summaryWith(2) });
    });
    const { getByTestId } = render(<SleepScreen />);
    expect(getByTestId('sleep-greeting').textContent).toBe(en.sleep.greetings.engaged);
  });

  test('Elevated (tier 3) → elevated greeting', () => {
    act(() => {
      useGameStore.setState({ pendingOfflineSummary: summaryWith(3) });
    });
    const { getByTestId } = render(<SleepScreen />);
    expect(getByTestId('sleep-greeting').textContent).toBe(en.sleep.greetings.elevated);
  });

  test('Euphoric (tier 4) → euphoric greeting', () => {
    act(() => {
      useGameStore.setState({ pendingOfflineSummary: summaryWith(4) });
    });
    const { getByTestId } = render(<SleepScreen />);
    expect(getByTestId('sleep-greeting').textContent).toBe(en.sleep.greetings.euphoric);
  });
});
