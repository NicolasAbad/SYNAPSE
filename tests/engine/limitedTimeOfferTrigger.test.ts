// Sprint 9b Phase 9b.5 — Limited-Time Offer trigger helper tests.

import { describe, expect, test } from 'vitest';
import { activeLimitedTimeOffer } from '../../src/engine/limitedTimeOfferTrigger';

function baseState(overrides: Partial<{ prestigeCount: number; purchasedLimitedOffers: string[]; activeLimitedOffer: { id: string; expiresAt: number } | null }> = {}) {
  return {
    prestigeCount: 0,
    purchasedLimitedOffers: [],
    activeLimitedOffer: null,
    ...overrides,
  };
}

const NOW = 1_700_000_000_000;

describe('activeLimitedTimeOffer — milestone detection', () => {
  test('P3 triggers dual_nature_pack', () => {
    const offer = activeLimitedTimeOffer({ state: baseState({ prestigeCount: 3 }), nowTimestamp: NOW });
    expect(offer?.id).toBe('dual_nature_pack');
  });

  test('P7 triggers mutant_bundle', () => {
    const offer = activeLimitedTimeOffer({ state: baseState({ prestigeCount: 7 }), nowTimestamp: NOW });
    expect(offer?.id).toBe('mutant_bundle');
  });

  test('P13 triggers deep_mind_pack', () => {
    const offer = activeLimitedTimeOffer({ state: baseState({ prestigeCount: 13 }), nowTimestamp: NOW });
    expect(offer?.id).toBe('deep_mind_pack');
  });

  test('non-milestone prestige returns null', () => {
    for (const p of [0, 1, 2, 4, 5, 6, 8, 9, 10, 11, 12, 14, 20, 26]) {
      expect(activeLimitedTimeOffer({ state: baseState({ prestigeCount: p }), nowTimestamp: NOW })?.id).toBeUndefined();
    }
  });
});

describe('activeLimitedTimeOffer — purchase / consume state', () => {
  test('purchased offer does NOT re-trigger', () => {
    const offer = activeLimitedTimeOffer({
      state: baseState({ prestigeCount: 3, purchasedLimitedOffers: ['dual_nature_pack'] }),
      nowTimestamp: NOW,
    });
    expect(offer).toBeNull();
  });
});

describe('activeLimitedTimeOffer — active-window rendering', () => {
  test('ongoing offer (in-window) continues to return the offer', () => {
    const offer = activeLimitedTimeOffer({
      state: baseState({
        prestigeCount: 5, // past P3 trigger but offer still active
        activeLimitedOffer: { id: 'dual_nature_pack', expiresAt: NOW + 60_000 }, // still in window
      }),
      nowTimestamp: NOW,
    });
    expect(offer?.id).toBe('dual_nature_pack');
  });

  test('expired offer does NOT continue (even with activeLimitedOffer set)', () => {
    const offer = activeLimitedTimeOffer({
      state: baseState({
        prestigeCount: 5,
        activeLimitedOffer: { id: 'dual_nature_pack', expiresAt: NOW - 1000 }, // expired
      }),
      nowTimestamp: NOW,
    });
    expect(offer).toBeNull();
  });
});
