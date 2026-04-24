// Sprint 9b Phase 9b.4 — starterPackTrigger tests.

import { describe, expect, test } from 'vitest';
import { isStarterPackVisible, computeStarterPackExpiry } from '../../src/engine/starterPackTrigger';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';

function baseState(overrides: Partial<{ prestigeCount: number; starterPackPurchased: boolean; starterPackDismissed: boolean; starterPackExpiresAt: number }> = {}) {
  return {
    prestigeCount: 0,
    starterPackPurchased: false,
    starterPackDismissed: false,
    starterPackExpiresAt: 0,
    ...overrides,
  };
}

describe('isStarterPackVisible', () => {
  test('hidden before P2 (P0/P1)', () => {
    expect(isStarterPackVisible({ state: baseState({ prestigeCount: 0 }), nowTimestamp: 1_000 })).toBe(false);
    expect(isStarterPackVisible({ state: baseState({ prestigeCount: 1 }), nowTimestamp: 1_000 })).toBe(false);
  });

  test('visible at P2 with not-yet-stamped expiry (store stamps on first open)', () => {
    expect(isStarterPackVisible({ state: baseState({ prestigeCount: 2 }), nowTimestamp: 1_000 })).toBe(true);
  });

  test('visible at P3+ with not-yet-stamped expiry', () => {
    expect(isStarterPackVisible({ state: baseState({ prestigeCount: 3 }), nowTimestamp: 1_000 })).toBe(true);
    expect(isStarterPackVisible({ state: baseState({ prestigeCount: 26 }), nowTimestamp: 1_000 })).toBe(true);
  });

  test('hidden after purchase (terminal state)', () => {
    expect(isStarterPackVisible({
      state: baseState({ prestigeCount: 5, starterPackPurchased: true }),
      nowTimestamp: 1_000,
    })).toBe(false);
  });

  test('hidden after dismiss (terminal state)', () => {
    expect(isStarterPackVisible({
      state: baseState({ prestigeCount: 5, starterPackDismissed: true }),
      nowTimestamp: 1_000,
    })).toBe(false);
  });

  test('hidden after 48h window elapsed', () => {
    const expiresAt = 100_000;
    expect(isStarterPackVisible({
      state: baseState({ prestigeCount: 5, starterPackExpiresAt: expiresAt }),
      nowTimestamp: expiresAt + 1, // 1ms past expiry
    })).toBe(false);
  });

  test('visible right at boundary (now === expiresAt → hidden per strict-less-than)', () => {
    const expiresAt = 100_000;
    expect(isStarterPackVisible({
      state: baseState({ prestigeCount: 5, starterPackExpiresAt: expiresAt }),
      nowTimestamp: expiresAt,
    })).toBe(false);
  });

  test('visible 1ms before expiry', () => {
    const expiresAt = 100_000;
    expect(isStarterPackVisible({
      state: baseState({ prestigeCount: 5, starterPackExpiresAt: expiresAt }),
      nowTimestamp: expiresAt - 1,
    })).toBe(true);
  });
});

describe('computeStarterPackExpiry', () => {
  test('returns now + 48h per starterPackExpiryMs constant', () => {
    const now = 1_700_000_000_000;
    expect(computeStarterPackExpiry(now)).toBe(now + SYNAPSE_CONSTANTS.starterPackExpiryMs);
  });
});
