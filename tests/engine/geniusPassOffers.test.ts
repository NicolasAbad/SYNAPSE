// Sprint 9b Phase 9b.4 — geniusPassOffers tests (MONEY-9 dismissal cap + 72h interval).

import { describe, expect, test } from 'vitest';
import { shouldOfferGeniusPass, type GeniusPassOfferContext } from '../../src/engine/geniusPassOffers';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';

const INTERVAL_MS = SYNAPSE_CONSTANTS.geniusPassOfferMinIntervalMs;
const MAX_DISMISSALS = SYNAPSE_CONSTANTS.geniusPassMaxDismissals;

function baseState(overrides: Partial<{ isSubscribed: boolean; geniusPassLastOfferTimestamp: number; geniusPassDismissals: number }> = {}) {
  return {
    isSubscribed: false,
    geniusPassLastOfferTimestamp: 0,
    geniusPassDismissals: 0,
    ...overrides,
  };
}

const NOW = 1_700_000_000_000;

describe('shouldOfferGeniusPass — subscribed short-circuit', () => {
  test('never offer when isSubscribed=true', () => {
    for (const context of ['post_p1', 'post_personal_best', 'post_p5', 'post_p10', 'post_transcendence'] as GeniusPassOfferContext[]) {
      expect(shouldOfferGeniusPass({ state: baseState({ isSubscribed: true }), nowTimestamp: NOW, context })).toBe(false);
    }
  });
});

describe('shouldOfferGeniusPass — max dismissals cap', () => {
  test('never offer once geniusPassDismissals >= max (3)', () => {
    expect(shouldOfferGeniusPass({
      state: baseState({ geniusPassDismissals: MAX_DISMISSALS }),
      nowTimestamp: NOW,
      context: 'post_p1',
    })).toBe(false);
  });

  test('offer allowed just below the cap', () => {
    expect(shouldOfferGeniusPass({
      state: baseState({ geniusPassDismissals: MAX_DISMISSALS - 1 }),
      nowTimestamp: NOW,
      context: 'post_p1',
    })).toBe(true);
  });
});

describe('shouldOfferGeniusPass — 72h interval gate', () => {
  test('blocked when last offer was recent (<72h)', () => {
    const lastOffer = NOW - INTERVAL_MS + 1; // 1ms inside window
    expect(shouldOfferGeniusPass({
      state: baseState({ geniusPassLastOfferTimestamp: lastOffer }),
      nowTimestamp: NOW,
      context: 'post_p5',
    })).toBe(false);
  });

  test('allowed exactly at the 72h boundary', () => {
    const lastOffer = NOW - INTERVAL_MS; // exactly 72h ago
    expect(shouldOfferGeniusPass({
      state: baseState({ geniusPassLastOfferTimestamp: lastOffer }),
      nowTimestamp: NOW,
      context: 'post_p5',
    })).toBe(true);
  });

  test('lastOfferTimestamp === 0 means no prior offer → interval gate open', () => {
    expect(shouldOfferGeniusPass({
      state: baseState({ geniusPassLastOfferTimestamp: 0 }),
      nowTimestamp: NOW,
      context: 'post_p1',
    })).toBe(true);
  });
});

describe('shouldOfferGeniusPass — happy path', () => {
  test('all 5 trigger contexts return true when not subscribed + under cap + interval clear', () => {
    for (const context of ['post_p1', 'post_personal_best', 'post_p5', 'post_p10', 'post_transcendence'] as GeniusPassOfferContext[]) {
      expect(shouldOfferGeniusPass({
        state: baseState(),
        nowTimestamp: NOW,
        context,
      }), `context=${context}`).toBe(true);
    }
  });
});
