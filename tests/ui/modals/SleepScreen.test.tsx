// @vitest-environment jsdom
// Sprint 7.10 Phase 7.10.5 — SleepScreen component tests.

import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { SleepScreen } from '../../../src/ui/modals/SleepScreen';
import { useGameStore, createDefaultState } from '../../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../../src/config/constants';
import type { OfflineSummary } from '../../../src/types';

const baseSummary: OfflineSummary = {
  elapsedMs: 30 * 60 * 1000, // 30 min — well above offlineModalMinSeconds 60s
  gained: 12345.6,
  efficiency: 0.5,
  avgMood: 30,
  avgMoodTier: 1,
  capHours: 4,
  cappedHit: false,
  timeAnomaly: null,
  enhancedDischargeAvailable: false,
  lucidDreamTriggered: false,
};

afterEach(() => {
  cleanup();
  useGameStore.getState().reset();
});

describe('SleepScreen — render gates', () => {
  beforeEach(() => {
    useGameStore.setState({ ...createDefaultState() });
  });

  test('does NOT render when pendingOfflineSummary is null', () => {
    const { queryByTestId } = render(<SleepScreen />);
    expect(queryByTestId('sleep-screen')).toBeNull();
  });

  test('does NOT render when elapsed < offlineModalMinSeconds', () => {
    act(() => {
      useGameStore.setState({
        pendingOfflineSummary: { ...baseSummary, elapsedMs: 30_000 }, // 30s < 60s
      });
    });
    const { queryByTestId } = render(<SleepScreen />);
    expect(queryByTestId('sleep-screen')).toBeNull();
  });

  test('renders when pendingOfflineSummary present + elapsed ≥ threshold', () => {
    act(() => {
      useGameStore.setState({ pendingOfflineSummary: baseSummary });
    });
    const { queryByTestId } = render(<SleepScreen />);
    expect(queryByTestId('sleep-screen')).not.toBeNull();
    expect(queryByTestId('sleep-stats')).not.toBeNull();
  });
});

describe('SleepScreen — conditional banners', () => {
  beforeEach(() => {
    useGameStore.setState({ ...createDefaultState() });
  });

  test('OFFLINE-7 enhanced-Discharge banner shows when flag is true', () => {
    act(() => {
      useGameStore.setState({
        pendingOfflineSummary: { ...baseSummary, enhancedDischargeAvailable: true },
      });
    });
    const { queryByTestId } = render(<SleepScreen />);
    expect(queryByTestId('sleep-enhanced-discharge-banner')).not.toBeNull();
  });

  test('Lucid Dream choice shows when triggered; A/B buttons present', () => {
    act(() => {
      useGameStore.setState({
        pendingOfflineSummary: { ...baseSummary, lucidDreamTriggered: true },
      });
    });
    const { queryByTestId } = render(<SleepScreen />);
    expect(queryByTestId('sleep-lucid-dream-choice')).not.toBeNull();
    expect(queryByTestId('lucid-option-a')).not.toBeNull();
    expect(queryByTestId('lucid-option-b')).not.toBeNull();
  });

  test('rewarded-ad button shows ONLY when elapsed ≥ minOfflineMinutes AND no Lucid Dream AND adapter wired', async () => {
    const { AdProvider } = await import('../../../src/platform/AdContext');
    const { createMockAdMobAdapter } = await import('../../../src/platform/admob.mock');
    act(() => {
      useGameStore.setState({
        pendingOfflineSummary: {
          ...baseSummary,
          elapsedMs: SYNAPSE_CONSTANTS.lucidDreamMinOfflineMinutes * 60 * 1000,
          lucidDreamTriggered: false,
        },
      });
    });
    const { queryByTestId } = render(
      <AdProvider adapter={createMockAdMobAdapter()}>
        <SleepScreen />
      </AdProvider>,
    );
    expect(queryByTestId('sleep-rewarded-ad')).not.toBeNull();
  });

  test('cycle-cap note shows when cappedHit is true', () => {
    act(() => {
      useGameStore.setState({
        pendingOfflineSummary: { ...baseSummary, cappedHit: true },
      });
    });
    const { queryByTestId } = render(<SleepScreen />);
    expect(queryByTestId('sleep-capped-note')).not.toBeNull();
  });
});

describe('SleepScreen — actions', () => {
  beforeEach(() => {
    useGameStore.setState({ ...createDefaultState() });
  });

  test('dismiss button clears pendingOfflineSummary', () => {
    act(() => {
      useGameStore.setState({ pendingOfflineSummary: baseSummary });
    });
    const { getByTestId } = render(<SleepScreen />);
    act(() => {
      getByTestId('sleep-dismiss').click();
    });
    expect(useGameStore.getState().pendingOfflineSummary).toBeNull();
  });

  test('Lucid Dream Option A click sets lucidDreamActiveUntil + dismisses', () => {
    act(() => {
      useGameStore.setState({
        pendingOfflineSummary: { ...baseSummary, lucidDreamTriggered: true },
      });
    });
    const { getByTestId } = render(<SleepScreen />);
    act(() => {
      getByTestId('lucid-option-a').click();
    });
    expect(useGameStore.getState().lucidDreamActiveUntil).not.toBeNull();
    expect(useGameStore.getState().pendingOfflineSummary).toBeNull();
  });

  test('Lucid Dream Option B click grants memories + dismisses', () => {
    const before = useGameStore.getState().memories;
    act(() => {
      useGameStore.setState({
        pendingOfflineSummary: { ...baseSummary, lucidDreamTriggered: true },
      });
    });
    const { getByTestId } = render(<SleepScreen />);
    act(() => {
      getByTestId('lucid-option-b').click();
    });
    expect(useGameStore.getState().memories).toBe(before + SYNAPSE_CONSTANTS.lucidDreamOptionBMemoryGain);
    expect(useGameStore.getState().pendingOfflineSummary).toBeNull();
  });
});
