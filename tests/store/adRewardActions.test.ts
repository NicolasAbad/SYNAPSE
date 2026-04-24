// Sprint 9a Phase 9a.4 — ad reward payout + reroll/retry store actions.

import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { useGameStore } from '../../src/store/gameStore';

beforeEach(() => useGameStore.getState().reset());
afterEach(() => useGameStore.getState().reset());

describe('applyAdRewardOfflineDouble', () => {
  test('no-op when pendingOfflineSummary is null', () => {
    const before = useGameStore.getState().thoughts;
    useGameStore.getState().applyAdRewardOfflineDouble();
    expect(useGameStore.getState().thoughts).toBe(before);
    expect(useGameStore.getState().pendingOfflineSummary).toBeNull();
  });

  test('adds summary.gained extra thoughts and dismisses summary', () => {
    useGameStore.setState({
      pendingOfflineSummary: {
        elapsedMs: 30 * 60_000,
        gained: 1000,
        efficiency: 0.5,
        avgMood: 50,
        avgMoodTier: 1,
        capHours: 4,
        cappedHit: false,
        timeAnomaly: null,
        enhancedDischargeAvailable: false,
        lucidDreamTriggered: false,
      },
      thoughts: 5_000,
      cycleGenerated: 5_000,
      totalGenerated: 100_000,
    });
    useGameStore.getState().applyAdRewardOfflineDouble();
    const s = useGameStore.getState();
    expect(s.thoughts).toBe(6_000);
    expect(s.cycleGenerated).toBe(6_000);
    expect(s.totalGenerated).toBe(101_000);
    expect(s.pendingOfflineSummary).toBeNull();
  });
});

describe('applyAdRewardDischargeDouble', () => {
  test('adds burst extra thoughts to thoughts/cycleGenerated/totalGenerated', () => {
    useGameStore.setState({ thoughts: 100, cycleGenerated: 200, totalGenerated: 50_000 });
    useGameStore.getState().applyAdRewardDischargeDouble(500);
    const s = useGameStore.getState();
    expect(s.thoughts).toBe(600);
    expect(s.cycleGenerated).toBe(700);
    expect(s.totalGenerated).toBe(50_500);
  });

  test('no-op when burst <= 0', () => {
    useGameStore.setState({ thoughts: 100 });
    useGameStore.getState().applyAdRewardDischargeDouble(0);
    useGameStore.getState().applyAdRewardDischargeDouble(-50);
    expect(useGameStore.getState().thoughts).toBe(100);
  });
});

describe('rerollMutationOptions', () => {
  test('clears currentMutation and increments mutationSeed', () => {
    useGameStore.setState({
      isTutorialCycle: false,
      currentMutation: { id: 'sprint' },
      mutationSeed: 7,
    });
    useGameStore.getState().rerollMutationOptions();
    const s = useGameStore.getState();
    expect(s.currentMutation).toBeNull();
    expect(s.mutationSeed).toBe(8);
  });

  test('no-op during tutorial cycle (mutations not yet unlocked)', () => {
    useGameStore.setState({ isTutorialCycle: true, currentMutation: null, mutationSeed: 3 });
    useGameStore.getState().rerollMutationOptions();
    const s = useGameStore.getState();
    expect(s.mutationSeed).toBe(3);
  });
});

describe('retryPatternDecision', () => {
  test('removes a previously-locked decision', () => {
    useGameStore.setState({ patternDecisions: { 6: 'A', 15: 'B' } });
    useGameStore.getState().retryPatternDecision(6);
    expect(useGameStore.getState().patternDecisions).toEqual({ 15: 'B' });
  });

  test('no-op when decision was never made', () => {
    useGameStore.setState({ patternDecisions: { 15: 'B' } });
    useGameStore.getState().retryPatternDecision(6);
    expect(useGameStore.getState().patternDecisions).toEqual({ 15: 'B' });
  });
});
