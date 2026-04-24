// Sprint 9a Phase 9a.3 — installedAt field tests (V-5, MONEY-4).
// Validates: defaults to 0, set ONCE on first initSessionTimestamps,
// never overwritten on subsequent calls, survives prestige + Transcendence.

import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { useGameStore } from '../../src/store/gameStore';
import { handlePrestige } from '../../src/engine/prestige';
import { handleTranscendence } from '../../src/engine/transcendence';
import type { GameState } from '../../src/types/GameState';

beforeEach(() => useGameStore.getState().reset());
afterEach(() => useGameStore.getState().reset());

describe('installedAt — default + initSessionTimestamps', () => {
  test('default value is 0 (per createDefaultState)', () => {
    expect(useGameStore.getState().installedAt).toBe(0);
  });

  test('initSessionTimestamps stamps installedAt with the now timestamp', () => {
    useGameStore.getState().initSessionTimestamps(1_700_000_000_000);
    expect(useGameStore.getState().installedAt).toBe(1_700_000_000_000);
  });

  test('subsequent initSessionTimestamps calls do NOT overwrite installedAt', () => {
    useGameStore.getState().initSessionTimestamps(1_700_000_000_000);
    useGameStore.getState().initSessionTimestamps(2_000_000_000_000);
    expect(useGameStore.getState().installedAt).toBe(1_700_000_000_000); // first call wins
  });
});

describe('installedAt — PRESERVE on prestige', () => {
  test('survives a prestige cycle (anti-exploit: prestige spam can\'t reset MONEY-4)', () => {
    const state = {
      ...useGameStore.getState(),
      installedAt: 1_700_000_000_000,
      cycleGenerated: 25_000,
      currentThreshold: 25_000,
    } as GameState;
    const { state: post } = handlePrestige(state, 1_700_000_500_000);
    expect(post.installedAt).toBe(1_700_000_000_000);
  });
});

describe('installedAt — PRESERVE on Transcendence', () => {
  test('survives Transcendence (lifetime install anchor)', () => {
    const state = {
      ...useGameStore.getState(),
      installedAt: 1_700_000_000_000,
      prestigeCount: 26,
      archetype: 'analitica' as const,
    } as GameState;
    const { state: post } = handleTranscendence(state, 'equation', 1_700_000_500_000);
    expect(post.installedAt).toBe(1_700_000_000_000);
  });
});
