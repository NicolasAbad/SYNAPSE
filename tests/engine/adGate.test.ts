// Sprint 9a Phase 9a.3 — adGate.canShowAd tests (MONEY-4 / MONEY-5 / MONEY-6 + GP).

import { describe, expect, test } from 'vitest';
import { canShowAd } from '../../src/engine/adGate';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';

const MIN = 60_000;
const TUTORIAL_GRACE_MS = SYNAPSE_CONSTANTS.noAdTutorialMinutes * MIN; // 10 min
const COOLDOWN_MS = SYNAPSE_CONSTANTS.minAdCooldownMs;                  // 3 min

function baseState(overrides: Partial<{ isSubscribed: boolean; installedAt: number; lastAdWatchedAt: number }> = {}) {
  return {
    isSubscribed: false,
    installedAt: 0,
    lastAdWatchedAt: 0,
    ...overrides,
  };
}

describe('canShowAd — MONEY-4 tutorial grace', () => {
  test('denies during the first 10 min after install', () => {
    const installedAt = 1_000_000;
    const now = installedAt + TUTORIAL_GRACE_MS - 1; // 1ms inside grace
    const decision = canShowAd({ state: baseState({ installedAt }), nowTimestamp: now });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('tutorial-grace');
  });

  test('allows exactly at the grace boundary', () => {
    const installedAt = 1_000_000;
    const now = installedAt + TUTORIAL_GRACE_MS; // boundary == 10 min flat
    const decision = canShowAd({ state: baseState({ installedAt }), nowTimestamp: now });
    expect(decision.allowed).toBe(true);
  });

  test('denies (defensive) when installedAt is still 0 (not yet stamped)', () => {
    // Defensive default: until initSessionTimestamps stamps the field, we must
    // not show ads — we don't know whether the player just installed.
    const decision = canShowAd({ state: baseState({ installedAt: 0 }), nowTimestamp: 5_000_000 });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('tutorial-grace');
  });
});

describe('canShowAd — MONEY-5 post-Cascade exclusion', () => {
  test('denies when isPostCascade=true even after grace + cooldown clear', () => {
    const installedAt = 0; // bypass MONEY-4 by setting now well past
    const decision = canShowAd({
      state: baseState({ installedAt: 1, lastAdWatchedAt: 0 }), // installedAt=1 keeps us out of defensive
      nowTimestamp: 100_000_000,
      isPostCascade: true,
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('post-cascade');
    void installedAt;
  });

  test('allows when isPostCascade=false (default)', () => {
    const decision = canShowAd({
      state: baseState({ installedAt: 1, lastAdWatchedAt: 0 }),
      nowTimestamp: 100_000_000,
    });
    expect(decision.allowed).toBe(true);
  });
});

describe('canShowAd — MONEY-6 cooldown', () => {
  test('denies inside the cooldown window', () => {
    const lastAdWatchedAt = 5_000_000;
    const now = lastAdWatchedAt + COOLDOWN_MS - 1; // 1ms inside cooldown
    const decision = canShowAd({
      state: baseState({ installedAt: 1, lastAdWatchedAt }),
      nowTimestamp: now,
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('cooldown');
  });

  test('allows exactly at the cooldown boundary', () => {
    const lastAdWatchedAt = 5_000_000;
    const now = lastAdWatchedAt + COOLDOWN_MS; // boundary == 3 min flat
    const decision = canShowAd({
      state: baseState({ installedAt: 1, lastAdWatchedAt }),
      nowTimestamp: now,
    });
    expect(decision.allowed).toBe(true);
  });

  test('lastAdWatchedAt=0 means cooldown satisfied (no prior ad)', () => {
    const decision = canShowAd({
      state: baseState({ installedAt: 1, lastAdWatchedAt: 0 }),
      nowTimestamp: 100_000_000,
    });
    expect(decision.allowed).toBe(true);
  });
});

describe('canShowAd — Genius Pass shielding', () => {
  test('subscribers get no ads even when all other gates pass', () => {
    const decision = canShowAd({
      state: baseState({ isSubscribed: true, installedAt: 1, lastAdWatchedAt: 0 }),
      nowTimestamp: 100_000_000,
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('subscribed');
  });

  test('Genius Pass takes priority over tutorial-grace (subscribed reason wins)', () => {
    const decision = canShowAd({
      state: baseState({ isSubscribed: true, installedAt: 0 }),
      nowTimestamp: 1_000,
    });
    expect(decision.reason).toBe('subscribed'); // not tutorial-grace
  });
});

describe('canShowAd — happy path', () => {
  test('all gates pass → allowed=true with no reason', () => {
    const decision = canShowAd({
      state: baseState({ installedAt: 1, lastAdWatchedAt: 0 }),
      nowTimestamp: 100_000_000,
    });
    expect(decision.allowed).toBe(true);
    expect(decision.reason).toBeUndefined();
  });
});
