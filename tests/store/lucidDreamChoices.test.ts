// Sprint 7.10 Phase 7.10.5 — Lucid Dream choice store action tests.

import { beforeEach, describe, expect, test } from 'vitest';
import { useGameStore, createDefaultState } from '../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';

describe('chooseLucidDreamOptionA — +10% production for 1 hour', () => {
  beforeEach(() => {
    useGameStore.setState({ ...createDefaultState() });
  });

  test('sets lucidDreamActiveUntil to now + lucidDreamOptionADurationMs', () => {
    const now = 5_000_000;
    useGameStore.getState().chooseLucidDreamOptionA(now);
    expect(useGameStore.getState().lucidDreamActiveUntil).toBe(now + SYNAPSE_CONSTANTS.lucidDreamOptionADurationMs);
  });

  test('clears pendingOfflineSummary on choice', () => {
    useGameStore.setState({
      ...createDefaultState(),
      pendingOfflineSummary: {
        elapsedMs: 3_600_000, gained: 100, efficiency: 0.5, avgMood: 30,
        avgMoodTier: 1, capHours: 4, cappedHit: false, timeAnomaly: null,
        enhancedDischargeAvailable: false, lucidDreamTriggered: true,
      },
    });
    useGameStore.getState().chooseLucidDreamOptionA(1_000_000);
    expect(useGameStore.getState().pendingOfflineSummary).toBeNull();
  });
});

describe('chooseLucidDreamOptionB — +N Memories one-shot', () => {
  beforeEach(() => {
    useGameStore.setState({ ...createDefaultState() });
  });

  test('grants lucidDreamOptionBMemoryGain memories', () => {
    const before = useGameStore.getState().memories;
    useGameStore.getState().chooseLucidDreamOptionB();
    expect(useGameStore.getState().memories).toBe(before + SYNAPSE_CONSTANTS.lucidDreamOptionBMemoryGain);
  });

  test('clears pendingOfflineSummary on choice', () => {
    useGameStore.setState({
      ...createDefaultState(),
      pendingOfflineSummary: {
        elapsedMs: 3_600_000, gained: 100, efficiency: 0.5, avgMood: 30,
        avgMoodTier: 1, capHours: 4, cappedHit: false, timeAnomaly: null,
        enhancedDischargeAvailable: false, lucidDreamTriggered: true,
      },
    });
    useGameStore.getState().chooseLucidDreamOptionB();
    expect(useGameStore.getState().pendingOfflineSummary).toBeNull();
  });

  test('does NOT set lucidDreamActiveUntil', () => {
    useGameStore.getState().chooseLucidDreamOptionB();
    expect(useGameStore.getState().lucidDreamActiveUntil).toBeNull();
  });
});
