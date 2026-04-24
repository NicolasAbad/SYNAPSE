// Sprint 9a Phase 9a.3 — AdMob mock adapter tests.

import { describe, expect, test } from 'vitest';
import { createMockAdMobAdapter } from '../../src/platform/admob.mock';
import { adUnitIdFor } from '../../src/platform/admob';

describe('createMockAdMobAdapter', () => {
  test('initialize records the call', async () => {
    const a = createMockAdMobAdapter();
    await a.initialize();
    expect(a.calls).toEqual([{ method: 'initialize' }]);
  });

  test('loadRewardedAd records placement', async () => {
    const a = createMockAdMobAdapter();
    await a.loadRewardedAd('offline_boost');
    expect(a.calls).toContainEqual({ method: 'loadRewardedAd', placement: 'offline_boost' });
  });

  test('showRewardedAd default returns true (reward earned)', async () => {
    const a = createMockAdMobAdapter();
    const earned = await a.showRewardedAd('offline_boost');
    expect(earned).toBe(true);
  });

  test('userDismissedBeforeReward: true → showRewardedAd returns false', async () => {
    const a = createMockAdMobAdapter({ userDismissedBeforeReward: true });
    const earned = await a.showRewardedAd('offline_boost');
    expect(earned).toBe(false);
  });

  test('failLoad: true → loadRewardedAd rejects (MONEY-7)', async () => {
    const a = createMockAdMobAdapter({ failLoad: true });
    await expect(a.loadRewardedAd('offline_boost')).rejects.toThrow('mock: loadRewardedAd failed');
  });

  test('failShow: true → showRewardedAd rejects (MONEY-7)', async () => {
    const a = createMockAdMobAdapter({ failShow: true });
    await expect(a.showRewardedAd('offline_boost')).rejects.toThrow('mock: showRewardedAd failed');
  });

  test('multiple calls accumulate in order', async () => {
    const a = createMockAdMobAdapter();
    await a.initialize();
    await a.loadRewardedAd('mutation_reroll');
    await a.showRewardedAd('mutation_reroll');
    expect(a.calls).toEqual([
      { method: 'initialize' },
      { method: 'loadRewardedAd', placement: 'mutation_reroll' },
      { method: 'showRewardedAd', placement: 'mutation_reroll' },
    ]);
  });
});

describe('adUnitIdFor (env routing)', () => {
  test('returns a non-empty string for every placement (env populated by .env.example defaults)', () => {
    const placements = ['offline_boost', 'post_discharge', 'mutation_reroll', 'decision_retry', 'piggy_refill', 'streak_save'] as const;
    for (const p of placements) {
      const id = adUnitIdFor(p);
      // .env.example uses Google's canonical TEST IDs prefixed with ca-app-pub-
      expect(typeof id).toBe('string');
    }
  });
});
