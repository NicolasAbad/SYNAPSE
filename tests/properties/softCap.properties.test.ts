// Sprint 11a Phase 11a.2 — fast-check property-based tests for softCap.
// Implements the GDD §4 production-formula invariants. Each test runs 100
// random samples by default; properties must hold for ALL of them.

import { describe, expect, test } from 'vitest';
import * as fc from 'fast-check';
import { softCap } from '../../src/engine/production';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';

describe('softCap — property-based invariants (GDD §4)', () => {
  test('PROP-1: monotonic — softCap(a) ≤ softCap(b) when a ≤ b', () => {
    fc.assert(fc.property(
      fc.double({ min: 0, max: 1e12, noNaN: true }),
      fc.double({ min: 0, max: 1e12, noNaN: true }),
      (a, b) => {
        const [lo, hi] = a <= b ? [a, b] : [b, a];
        return softCap(lo) <= softCap(hi);
      },
    ));
  });

  test('PROP-2: identity below threshold — softCap(x) === x for 0 ≤ x ≤ 100', () => {
    fc.assert(fc.property(fc.double({ min: 0, max: 100, noNaN: true }), (x) => softCap(x) === x));
  });

  test('PROP-3: compression above threshold — softCap(x) < x for x > 100', () => {
    fc.assert(fc.property(fc.double({ min: 100.01, max: 1e12, noNaN: true }), (x) => softCap(x) < x));
  });

  test('PROP-4: deterministic — same input → same output', () => {
    fc.assert(fc.property(fc.double({ min: 0, max: 1e12, noNaN: true }), (x) => softCap(x) === softCap(x)));
  });

  test('PROP-5: finite output for finite input', () => {
    fc.assert(fc.property(fc.double({ min: 0, max: 1e12, noNaN: true }), (x) => Number.isFinite(softCap(x))));
  });

  test('PROP-6: zero passes through — softCap(0) === 0', () => {
    expect(softCap(0)).toBe(0);
  });

  test('PROP-7: matches formula — softCap(x) ≈ 100 * (x/100)^exp for x > 100', () => {
    fc.assert(fc.property(fc.double({ min: 101, max: 1e9, noNaN: true }), (x) => {
      const expected = 100 * Math.pow(x / 100, SYNAPSE_CONSTANTS.softCapExponent);
      const actual = softCap(x);
      const diff = Math.abs(expected - actual);
      // Allow tiny float tolerance proportional to magnitude
      return diff < Math.max(1e-6, expected * 1e-9);
    }));
  });

  test('PROP-8: never NaN for valid input', () => {
    fc.assert(fc.property(fc.double({ min: 0, max: 1e15, noNaN: true }), (x) => !Number.isNaN(softCap(x))));
  });
});
