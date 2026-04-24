// Sprint 9a Phase 9a.3 — lastAdWatchedAt field tests (V-2, MONEY-6).
// Validates: defaults to 0, recordAdWatched stamps the field, survives prestige
// + Transcendence (anti-exploit: prestige can't reset the cooldown).

import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { useGameStore } from '../../src/store/gameStore';
import { handlePrestige } from '../../src/engine/prestige';
import { handleTranscendence } from '../../src/engine/transcendence';
import type { GameState } from '../../src/types/GameState';

beforeEach(() => useGameStore.getState().reset());
afterEach(() => useGameStore.getState().reset());

describe('lastAdWatchedAt + recordAdWatched action', () => {
  test('default value is 0', () => {
    expect(useGameStore.getState().lastAdWatchedAt).toBe(0);
  });

  test('recordAdWatched stamps the now timestamp', () => {
    useGameStore.getState().recordAdWatched(5_000_000);
    expect(useGameStore.getState().lastAdWatchedAt).toBe(5_000_000);
  });

  test('recordAdWatched is idempotent: replaying the same timestamp is a no-op', () => {
    useGameStore.getState().recordAdWatched(5_000_000);
    useGameStore.getState().recordAdWatched(5_000_000);
    expect(useGameStore.getState().lastAdWatchedAt).toBe(5_000_000);
  });

  test('recordAdWatched accepts later timestamps (cooldown advances forward)', () => {
    useGameStore.getState().recordAdWatched(5_000_000);
    useGameStore.getState().recordAdWatched(10_000_000);
    expect(useGameStore.getState().lastAdWatchedAt).toBe(10_000_000);
  });
});

describe('lastAdWatchedAt — PRESERVE on prestige', () => {
  test('survives a prestige cycle (anti-exploit: cooldown bypass via prestige spam blocked)', () => {
    const state = {
      ...useGameStore.getState(),
      lastAdWatchedAt: 5_000_000,
      cycleGenerated: 25_000,
      currentThreshold: 25_000,
    } as GameState;
    const { state: post } = handlePrestige(state, 5_500_000);
    expect(post.lastAdWatchedAt).toBe(5_000_000);
  });
});

describe('lastAdWatchedAt — PRESERVE on Transcendence', () => {
  test('survives Transcendence (cooldown carries into Run 2)', () => {
    const state = {
      ...useGameStore.getState(),
      lastAdWatchedAt: 5_000_000,
      prestigeCount: 26,
      archetype: 'analitica' as const,
    } as GameState;
    const { state: post } = handleTranscendence(state, 'equation', 6_000_000);
    expect(post.lastAdWatchedAt).toBe(5_000_000);
  });
});
