// Sprint 9b Phase 9b.5 — MONEY-8 Spark purchase cap tests.
// GDD §26 required test cases: (a) first-ever purchase resets from 0,
// (b) second purchase same month doesn't reset, (c) month-crossing reset,
// (d) purchase at exactly 00:00:00 UTC on the 1st works.

import { describe, expect, test } from 'vitest';
import { evaluateSparksPurchase, startOfCurrentMonthUTC } from '../../src/engine/sparksPurchaseCap';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';

describe('startOfCurrentMonthUTC', () => {
  test('returns UTC midnight of the 1st of the same month', () => {
    const ts = Date.UTC(2026, 3, 15, 10, 30, 0); // 2026-04-15 10:30 UTC
    const result = startOfCurrentMonthUTC(ts);
    expect(result).toBe(Date.UTC(2026, 3, 1));
  });

  test('works at exactly 00:00:00 UTC on the 1st (MONEY-8 test case d)', () => {
    const firstOfMonth = Date.UTC(2026, 3, 1, 0, 0, 0);
    expect(startOfCurrentMonthUTC(firstOfMonth)).toBe(firstOfMonth);
  });
});

describe('evaluateSparksPurchase — first-ever purchase (case a)', () => {
  test('with default state (monthStart=0, purchased=0), small pack is allowed AND triggers reset', () => {
    const now = Date.UTC(2026, 3, 15);
    const result = evaluateSparksPurchase({
      state: { sparksPurchasedThisMonth: 0, sparksPurchaseMonthStart: 0 },
      packAmount: 20,
      nowTimestamp: now,
    });
    expect(result.allowed).toBe(true);
    if (result.allowed) {
      expect(result.resetApplied).toBe(true);
      expect(result.effectivePurchasedThisMonth).toBe(0);
    }
  });
});

describe('evaluateSparksPurchase — second same-month purchase (case b)', () => {
  test('second purchase does NOT reset — accumulates', () => {
    const now = Date.UTC(2026, 3, 15);
    const monthStart = startOfCurrentMonthUTC(now);
    const result = evaluateSparksPurchase({
      state: { sparksPurchasedThisMonth: 20, sparksPurchaseMonthStart: monthStart },
      packAmount: 110,
      nowTimestamp: now + 60_000, // 1 min later same month
    });
    expect(result.allowed).toBe(true);
    if (result.allowed) {
      expect(result.resetApplied).toBe(false);
      expect(result.effectivePurchasedThisMonth).toBe(20);
    }
  });
});

describe('evaluateSparksPurchase — month crossing (case c)', () => {
  test('purchase crossing into a new month resets the counter', () => {
    const prevMonthStart = Date.UTC(2026, 3, 1); // April 1
    const newMonthNow = Date.UTC(2026, 4, 5); // May 5
    const result = evaluateSparksPurchase({
      state: { sparksPurchasedThisMonth: 900, sparksPurchaseMonthStart: prevMonthStart },
      packAmount: 300,
      nowTimestamp: newMonthNow,
    });
    expect(result.allowed).toBe(true);
    if (result.allowed) {
      expect(result.resetApplied).toBe(true);
      expect(result.effectivePurchasedThisMonth).toBe(0);
    }
  });
});

describe('evaluateSparksPurchase — cap enforcement', () => {
  test('purchase at cap boundary (1000 total) is allowed', () => {
    const now = Date.UTC(2026, 3, 15);
    const monthStart = startOfCurrentMonthUTC(now);
    const result = evaluateSparksPurchase({
      state: { sparksPurchasedThisMonth: 700, sparksPurchaseMonthStart: monthStart },
      packAmount: 300,
      nowTimestamp: now,
    });
    expect(result.allowed).toBe(true);
  });

  test('purchase 1 over cap is blocked with remaining budget', () => {
    const now = Date.UTC(2026, 3, 15);
    const monthStart = startOfCurrentMonthUTC(now);
    const result = evaluateSparksPurchase({
      state: { sparksPurchasedThisMonth: 990, sparksPurchaseMonthStart: monthStart },
      packAmount: 20,
      nowTimestamp: now,
    });
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe('cap_reached');
      expect(result.remaining).toBe(SYNAPSE_CONSTANTS.maxSparksPurchasedPerMonth - 990);
    }
  });

  test('cap applies AFTER month-reset (990 old month → buy 500 new month = allowed)', () => {
    const prevMonth = Date.UTC(2026, 3, 1);
    const newNow = Date.UTC(2026, 4, 3);
    const result = evaluateSparksPurchase({
      state: { sparksPurchasedThisMonth: 990, sparksPurchaseMonthStart: prevMonth },
      packAmount: 500,
      nowTimestamp: newNow,
    });
    expect(result.allowed).toBe(true);
  });
});
