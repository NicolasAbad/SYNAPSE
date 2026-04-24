// Sprint 9b Phase 9b.5 — Piggy claim + Spark purchase + Limited-Time Offer store actions.

import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { useGameStore } from '../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';

beforeEach(() => useGameStore.getState().reset());
afterEach(() => useGameStore.getState().reset());

describe('claimPiggyBank', () => {
  test('transfers piggyBankSparks to sparks and sets piggyBankBroken', () => {
    useGameStore.setState({ piggyBankSparks: 500, sparks: 10 });
    useGameStore.getState().claimPiggyBank();
    const s = useGameStore.getState();
    expect(s.sparks).toBe(510);
    expect(s.piggyBankSparks).toBe(0);
    expect(s.piggyBankBroken).toBe(true);
  });

  test('no-op when piggyBankBroken is already true', () => {
    useGameStore.setState({ piggyBankSparks: 500, sparks: 10, piggyBankBroken: true });
    useGameStore.getState().claimPiggyBank();
    const s = useGameStore.getState();
    expect(s.sparks).toBe(10); // not doubled
    expect(s.piggyBankSparks).toBe(500); // not transferred
  });
});

describe('purchaseSparks', () => {
  test('20-Spark pack succeeds, MONEY-8 counter increments', () => {
    const now = Date.UTC(2026, 3, 15);
    const result = useGameStore.getState().purchaseSparks(20, now);
    expect(result).toBe('ok');
    const s = useGameStore.getState();
    expect(s.sparks).toBe(20);
    expect(s.sparksPurchasedThisMonth).toBe(20);
  });

  test('second pack in same month accumulates (no reset)', () => {
    const now = Date.UTC(2026, 3, 15);
    useGameStore.getState().purchaseSparks(20, now);
    useGameStore.getState().purchaseSparks(110, now + 60_000);
    const s = useGameStore.getState();
    expect(s.sparks).toBe(130);
    expect(s.sparksPurchasedThisMonth).toBe(130);
  });

  test('returns cap_reached when MONEY-8 cap exceeded', () => {
    const now = Date.UTC(2026, 3, 15);
    useGameStore.setState({
      sparksPurchasedThisMonth: 990,
      sparksPurchaseMonthStart: Date.UTC(2026, 3, 1),
    });
    const result = useGameStore.getState().purchaseSparks(20, now);
    expect(result).toBe('cap_reached');
    expect(useGameStore.getState().sparksPurchasedThisMonth).toBe(990); // unchanged
  });

  test('month crossing resets counter', () => {
    useGameStore.setState({
      sparksPurchasedThisMonth: 900,
      sparksPurchaseMonthStart: Date.UTC(2026, 3, 1),
    });
    const newMonth = Date.UTC(2026, 4, 3);
    useGameStore.getState().purchaseSparks(300, newMonth);
    const s = useGameStore.getState();
    expect(s.sparksPurchasedThisMonth).toBe(300); // reset + new purchase
    expect(s.sparksPurchaseMonthStart).toBe(Date.UTC(2026, 4, 1));
  });
});

describe('stampLimitedTimeOffer + consumeLimitedTimeOffer', () => {
  test('stampLimitedTimeOffer sets activeLimitedOffer with 48h expiry', () => {
    const now = 1_700_000_000_000;
    useGameStore.getState().stampLimitedTimeOffer('dual_nature_pack', now);
    const active = useGameStore.getState().activeLimitedOffer;
    expect(active?.id).toBe('dual_nature_pack');
    expect(active?.expiresAt).toBe(now + SYNAPSE_CONSTANTS.limitedOfferExpiryMs);
  });

  test('stampLimitedTimeOffer is idempotent for same offer id', () => {
    const first = 1_000;
    const second = 5_000;
    useGameStore.getState().stampLimitedTimeOffer('dual_nature_pack', first);
    useGameStore.getState().stampLimitedTimeOffer('dual_nature_pack', second);
    expect(useGameStore.getState().activeLimitedOffer?.expiresAt).toBe(first + SYNAPSE_CONSTANTS.limitedOfferExpiryMs);
  });

  test('consumeLimitedTimeOffer adds to purchasedLimitedOffers + clears active', () => {
    useGameStore.getState().stampLimitedTimeOffer('dual_nature_pack', 1_000);
    useGameStore.getState().consumeLimitedTimeOffer('dual_nature_pack');
    const s = useGameStore.getState();
    expect(s.purchasedLimitedOffers).toContain('dual_nature_pack');
    expect(s.activeLimitedOffer).toBeNull();
  });
});

describe('acceptLimitedTimeOffer', () => {
  test('dual_nature_pack: +30 Sparks + 1 random neuron skin', () => {
    useGameStore.setState({ installedAt: 1_700_000_000_000 });
    useGameStore.getState().stampLimitedTimeOffer('dual_nature_pack', 1_000);
    useGameStore.getState().acceptLimitedTimeOffer('dual_nature_pack');
    const s = useGameStore.getState();
    expect(s.sparks).toBe(30);
    expect(s.ownedNeuronSkins.length).toBe(1);
    expect(s.purchasedLimitedOffers).toContain('dual_nature_pack');
    expect(s.activeLimitedOffer).toBeNull();
  });

  test('deep_mind_pack: +50 Sparks + +3 Memories (no cosmetic)', () => {
    useGameStore.getState().acceptLimitedTimeOffer('deep_mind_pack');
    const s = useGameStore.getState();
    expect(s.sparks).toBe(50);
    expect(s.memories).toBe(3);
    expect(s.ownedNeuronSkins).toEqual([]);
  });

  test('mutant_bundle: random glow + random canvas theme', () => {
    useGameStore.setState({ installedAt: 1_700_000_000_000 });
    useGameStore.getState().acceptLimitedTimeOffer('mutant_bundle');
    const s = useGameStore.getState();
    expect(s.ownedGlowPacks.length).toBe(1);
    expect(s.ownedCanvasThemes.length).toBe(1);
  });

  test('no-op when offer already purchased', () => {
    useGameStore.getState().acceptLimitedTimeOffer('deep_mind_pack');
    useGameStore.getState().acceptLimitedTimeOffer('deep_mind_pack');
    expect(useGameStore.getState().sparks).toBe(50); // not doubled
  });

  test('deterministic random per (installedAt, offerId): same inputs → same cosmetic', () => {
    const fresh1 = useGameStore.getState().reset;
    fresh1();
    useGameStore.setState({ installedAt: 42 });
    useGameStore.getState().acceptLimitedTimeOffer('dual_nature_pack');
    const pick1 = useGameStore.getState().ownedNeuronSkins[0];
    useGameStore.getState().reset();
    useGameStore.setState({ installedAt: 42 });
    useGameStore.getState().acceptLimitedTimeOffer('dual_nature_pack');
    const pick2 = useGameStore.getState().ownedNeuronSkins[0];
    expect(pick1).toBe(pick2);
  });
});
