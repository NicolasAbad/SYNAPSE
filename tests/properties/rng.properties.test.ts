// Sprint 11a Phase 11a.2 — fast-check properties for the RNG layer (CODE-9 RNG-1).

import { describe, test } from 'vitest';
import * as fc from 'fast-check';
import { mulberry32, hash, seededRandom, randomInRange } from '../../src/engine/rng';

const seedArb = fc.integer({ min: 0, max: 2 ** 31 - 1 });

describe('RNG — property-based invariants (CODE-9 RNG-1, GDD §30)', () => {
  test('PROP-26: mulberry32 deterministic — same seed → identical sequence', () => {
    fc.assert(fc.property(seedArb, fc.integer({ min: 1, max: 100 }), (seed, n) => {
      const a = mulberry32(seed);
      const b = mulberry32(seed);
      for (let i = 0; i < n; i++) if (a() !== b()) return false;
      return true;
    }));
  });

  test('PROP-27: mulberry32 outputs in [0, 1)', () => {
    fc.assert(fc.property(seedArb, fc.integer({ min: 1, max: 100 }), (seed, n) => {
      const r = mulberry32(seed);
      for (let i = 0; i < n; i++) {
        const v = r();
        if (!(v >= 0 && v < 1)) return false;
      }
      return true;
    }));
  });

  test('PROP-28: hash deterministic — same input → same output', () => {
    fc.assert(fc.property(fc.string(), (s) => hash(s) === hash(s)));
    fc.assert(fc.property(fc.integer(), (n) => hash(n) === hash(n)));
  });

  test('PROP-29: hash output is uint32 (0 ≤ output < 2^32)', () => {
    fc.assert(fc.property(fc.string(), (s) => {
      const h = hash(s);
      return Number.isInteger(h) && h >= 0 && h < 2 ** 32;
    }));
  });

  test('PROP-30: seededRandom in [0, 1)', () => {
    fc.assert(fc.property(seedArb, (seed) => {
      const v = seededRandom(seed);
      return v >= 0 && v < 1;
    }));
  });

  test('PROP-31: randomInRange respects bounds — min ≤ result ≤ max for any seed (integer domain per jsdoc)', () => {
    // randomInRange is documented as integer-domain ("integer in [min, max] inclusive").
    // Property is asserted over its declared input contract: integer min/max.
    fc.assert(fc.property(
      fc.integer({ min: -1_000_000, max: 1_000_000 }),
      fc.integer({ min: -1_000_000, max: 1_000_000 }),
      seedArb,
      (a, b, seed) => {
        const [min, max] = a <= b ? [a, b] : [b, a];
        const v = randomInRange(min, max, seed);
        return Number.isInteger(v) && v >= min && v <= max;
      },
    ));
  });

  test('PROP-32: randomInRange deterministic — same args → same output', () => {
    fc.assert(fc.property(
      fc.integer({ min: 0, max: 100 }),
      fc.integer({ min: 100, max: 200 }),
      seedArb,
      (min, max, seed) => randomInRange(min, max, seed) === randomInRange(min, max, seed),
    ));
  });
});
