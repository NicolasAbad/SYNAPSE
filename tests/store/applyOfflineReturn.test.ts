// Sprint 7.10 Phase 7.10.4 — Store integration tests for applyOfflineReturn.
// Covers: order of operations, idempotency, force-quit protection, pending
// summary dismiss flow, PRESTIGE_RESET clears the summary.

import { describe, expect, test, beforeEach } from 'vitest';
import { useGameStore, createDefaultState } from '../../src/store/gameStore';
import { handlePrestige } from '../../src/engine/prestige';
import type { GameState } from '../../src/types/GameState';

function freshState(overrides: Partial<GameState> = {}): GameState {
  return { ...createDefaultState(), ...overrides };
}

describe('applyOfflineReturn action — integration', () => {
  beforeEach(() => {
    // Reset to clean default between tests (preserves actions — no second arg).
    useGameStore.setState({ ...createDefaultState() });
  });

  test('fresh save (lastActiveTimestamp === now) → no-op, no summary stashed', () => {
    const now = 1_000_000;
    useGameStore.setState({
      ...createDefaultState(),
      lastActiveTimestamp: now,
      baseProductionPerSecond: 100,
    });
    useGameStore.getState().applyOfflineReturn(now);
    expect(useGameStore.getState().pendingOfflineSummary).toBeNull();
    expect(useGameStore.getState().thoughts).toBe(0);
  });

  test('30-minute gap → summary stashed on pendingOfflineSummary', () => {
    useGameStore.setState({
      ...createDefaultState(),
      lastActiveTimestamp: 0,
      baseProductionPerSecond: 100,
      currentThreshold: 1e12,
    });
    useGameStore.getState().applyOfflineReturn(30 * 60 * 1000);
    const summary = useGameStore.getState().pendingOfflineSummary;
    expect(summary).not.toBeNull();
    expect(summary!.gained).toBeGreaterThan(0);
    expect(summary!.elapsedMs).toBe(30 * 60 * 1000);
  });

  test('thoughts + lastActiveTimestamp both advance atomically', () => {
    const before = useGameStore.getState().thoughts;
    useGameStore.setState({
      ...createDefaultState(),
      thoughts: before,
      lastActiveTimestamp: 0,
      baseProductionPerSecond: 100,
      currentThreshold: 1e12,
    });
    useGameStore.getState().applyOfflineReturn(2 * 60 * 60 * 1000);
    const state = useGameStore.getState();
    expect(state.thoughts).toBeGreaterThan(0);
    expect(state.lastActiveTimestamp).toBe(2 * 60 * 60 * 1000);
  });

  test('force-quit protection: second call after first yields no new summary', () => {
    useGameStore.setState({
      ...createDefaultState(),
      lastActiveTimestamp: 0,
      baseProductionPerSecond: 100,
      currentThreshold: 1e12,
    });
    const resumeMs = 30 * 60 * 1000;
    useGameStore.getState().applyOfflineReturn(resumeMs);
    const firstGained = useGameStore.getState().thoughts;
    // Simulate force-quit + reopen within the same "now" tick — timestamp already advanced.
    useGameStore.getState().applyOfflineReturn(resumeMs);
    expect(useGameStore.getState().thoughts).toBe(firstGained);
  });

  test('backward clock → no thoughts gained, timestamp still advances, no summary stashed', () => {
    useGameStore.setState({
      ...createDefaultState(),
      lastActiveTimestamp: 10_000_000,
      baseProductionPerSecond: 100,
    });
    useGameStore.getState().applyOfflineReturn(5_000_000);
    expect(useGameStore.getState().thoughts).toBe(0);
    // lastActiveTimestamp advances even on backward-clock per OFFLINE-5
    expect(useGameStore.getState().lastActiveTimestamp).toBe(5_000_000);
  });

  test('under-1-minute gap → skip branch, no summary stashed', () => {
    useGameStore.setState({
      ...createDefaultState(),
      lastActiveTimestamp: 0,
      baseProductionPerSecond: 100,
    });
    useGameStore.getState().applyOfflineReturn(30_000); // 30s
    expect(useGameStore.getState().pendingOfflineSummary).toBeNull();
  });

  test('dismissOfflineSummary clears pendingOfflineSummary', () => {
    useGameStore.setState({
      ...createDefaultState(),
      lastActiveTimestamp: 0,
      baseProductionPerSecond: 100,
      currentThreshold: 1e12,
    });
    useGameStore.getState().applyOfflineReturn(30 * 60 * 1000);
    expect(useGameStore.getState().pendingOfflineSummary).not.toBeNull();
    useGameStore.getState().dismissOfflineSummary();
    expect(useGameStore.getState().pendingOfflineSummary).toBeNull();
  });
});

describe('PRESTIGE_RESET — pendingOfflineSummary clears on prestige', () => {
  test('prestige clears stale pendingOfflineSummary (noise prevention per Phase 7.10.4)', () => {
    // Build a state that HAS a pending summary AND meets prestige threshold.
    const base = createDefaultState();
    const state = freshState({
      thoughts: 100_000,
      cycleGenerated: 100_000,
      currentThreshold: 25_000,
      pendingOfflineSummary: {
        elapsedMs: 3_600_000, gained: 50, efficiency: 0.5, avgMood: 30,
        avgMoodTier: 1, capHours: 4, cappedHit: false, timeAnomaly: null,
        enhancedDischargeAvailable: false, lucidDreamTriggered: false,
      },
      isTutorialCycle: base.isTutorialCycle,
    });
    const outcome = handlePrestige(state, 2_000_000_000);
    expect(outcome.state.pendingOfflineSummary).toBeNull();
  });
});
