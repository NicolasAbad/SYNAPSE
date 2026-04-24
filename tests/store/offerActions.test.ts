// Sprint 9b Phase 9b.4 — Starter Pack + Genius Pass store action tests.

import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { useGameStore } from '../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';

beforeEach(() => useGameStore.getState().reset());
afterEach(() => useGameStore.getState().reset());

describe('acceptStarterPack', () => {
  test('applies the 3-item bundle (50 Sparks + 5 Memories + neon_pulse)', () => {
    useGameStore.getState().acceptStarterPack();
    const s = useGameStore.getState();
    expect(s.starterPackPurchased).toBe(true);
    expect(s.sparks).toBe(SYNAPSE_CONSTANTS.starterPackSparkReward);
    expect(s.memories).toBe(SYNAPSE_CONSTANTS.starterPackMemoryReward);
    expect(s.ownedCanvasThemes).toContain('neon_pulse');
  });

  test('idempotent — second accept is a no-op', () => {
    useGameStore.getState().acceptStarterPack();
    useGameStore.getState().acceptStarterPack();
    const s = useGameStore.getState();
    expect(s.sparks).toBe(SYNAPSE_CONSTANTS.starterPackSparkReward); // not doubled
    expect(s.memories).toBe(SYNAPSE_CONSTANTS.starterPackMemoryReward);
    expect(s.ownedCanvasThemes.filter((id) => id === 'neon_pulse')).toHaveLength(1);
  });

  test('preserves existing Sparks + Memories when accepting', () => {
    useGameStore.setState({ sparks: 10, memories: 3 });
    useGameStore.getState().acceptStarterPack();
    const s = useGameStore.getState();
    expect(s.sparks).toBe(10 + SYNAPSE_CONSTANTS.starterPackSparkReward);
    expect(s.memories).toBe(3 + SYNAPSE_CONSTANTS.starterPackMemoryReward);
  });
});

describe('dismissStarterPack', () => {
  test('sets dismissed flag', () => {
    useGameStore.getState().dismissStarterPack();
    expect(useGameStore.getState().starterPackDismissed).toBe(true);
  });

  test('no-op when already purchased', () => {
    useGameStore.getState().acceptStarterPack();
    useGameStore.getState().dismissStarterPack();
    expect(useGameStore.getState().starterPackDismissed).toBe(false);
  });
});

describe('stampStarterPackExpiry', () => {
  test('stamps expiry the first time', () => {
    const now = 1_700_000_000_000;
    useGameStore.getState().stampStarterPackExpiry(now);
    expect(useGameStore.getState().starterPackExpiresAt).toBe(now + SYNAPSE_CONSTANTS.starterPackExpiryMs);
  });

  test('idempotent — second stamp does NOT reset expiry', () => {
    const first = 1_700_000_000_000;
    const second = 1_800_000_000_000;
    useGameStore.getState().stampStarterPackExpiry(first);
    useGameStore.getState().stampStarterPackExpiry(second);
    expect(useGameStore.getState().starterPackExpiresAt).toBe(first + SYNAPSE_CONSTANTS.starterPackExpiryMs);
  });
});

describe('dismissGeniusPassOffer', () => {
  test('bumps geniusPassDismissals counter', () => {
    const now = 1_700_000_000_000;
    useGameStore.getState().dismissGeniusPassOffer(now);
    expect(useGameStore.getState().geniusPassDismissals).toBe(1);
    expect(useGameStore.getState().geniusPassLastOfferTimestamp).toBe(now);
  });

  test('stamps latest timestamp on each dismissal', () => {
    useGameStore.getState().dismissGeniusPassOffer(1_000);
    useGameStore.getState().dismissGeniusPassOffer(5_000);
    expect(useGameStore.getState().geniusPassDismissals).toBe(2);
    expect(useGameStore.getState().geniusPassLastOfferTimestamp).toBe(5_000);
  });
});

describe('recordGeniusPassOfferShown', () => {
  test('stamps geniusPassLastOfferTimestamp without bumping dismissals', () => {
    useGameStore.getState().recordGeniusPassOfferShown(1_000);
    const s = useGameStore.getState();
    expect(s.geniusPassLastOfferTimestamp).toBe(1_000);
    expect(s.geniusPassDismissals).toBe(0);
  });
});
