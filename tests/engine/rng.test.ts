// Snapshot tests for docs/GDD.md §30 RNG-1 implementations.
// Values are empirically verified (second audit Batch 2 2B-6) — not invented.
// Any drift means the implementation diverged from the spec; fix the code, not the test.

import { describe, expect, test } from 'vitest';
import {
  hash,
  mulberry32,
  pickWeightedRandom,
  randomInRange,
  seededRandom,
} from '../../src/engine/rng';

describe('mulberry32 snapshot', () => {
  test('mulberry32(12345)() first 3 values match documented spec', () => {
    const gen = mulberry32(12345);
    expect(gen()).toBe(0.9797282677609473);
    expect(gen()).toBe(0.3067522644996643);
    expect(gen()).toBe(0.484205421525985);
  });

  test('same seed produces identical sequence on fresh generator', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 10; i++) expect(a()).toBe(b());
  });

  test('different seeds produce different first values', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });
});

describe('hash (FNV-1a)', () => {
  test('hash("0") === 890022063', () => {
    expect(hash('0')).toBe(890022063);
  });

  test('hash(0) === 890022063 (number coerces via String(0) === "0")', () => {
    expect(hash(0)).toBe(890022063);
  });

  test('hash("1") === 873244444', () => {
    expect(hash('1')).toBe(873244444);
  });

  test('hash is deterministic', () => {
    expect(hash('synapse')).toBe(hash('synapse'));
  });
});

describe('seededRandom', () => {
  test('seededRandom(12345) === first value of mulberry32(12345)', () => {
    expect(seededRandom(12345)).toBe(0.9797282677609473);
  });

  test('seededRandom is deterministic per seed', () => {
    expect(seededRandom(7)).toBe(seededRandom(7));
  });

  test('different seeds yield different results', () => {
    expect(seededRandom(7)).not.toBe(seededRandom(8));
  });
});

describe('randomInRange', () => {
  test('deterministic per seed', () => {
    expect(randomInRange(1, 10, 42)).toBe(randomInRange(1, 10, 42));
  });

  test('result is integer in [min, max] inclusive', () => {
    for (let s = 0; s < 50; s++) {
      const r = randomInRange(1, 10, s);
      expect(Number.isInteger(r)).toBe(true);
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(10);
    }
  });

  test('min === max returns min', () => {
    expect(randomInRange(5, 5, 123)).toBe(5);
  });
});

describe('pickWeightedRandom', () => {
  const items = [
    { item: 'a', weight: 1 },
    { item: 'b', weight: 2 },
    { item: 'c', weight: 3 },
  ];

  test('deterministic per seed', () => {
    expect(pickWeightedRandom(items, 42)).toBe(pickWeightedRandom(items, 42));
  });

  test('result is one of the provided items', () => {
    const r = pickWeightedRandom(items, 42);
    expect(['a', 'b', 'c']).toContain(r);
  });

  test('weight distribution reflects probabilities across many seeds', () => {
    const counts = { a: 0, b: 0, c: 0 };
    const N = 6000;
    for (let s = 0; s < N; s++) {
      const r = pickWeightedRandom(items, s) as 'a' | 'b' | 'c';
      counts[r]++;
    }
    // Expected ratios: a=1/6, b=2/6, c=3/6. Tolerance ±5% of N.
    expect(counts.a).toBeGreaterThan(N / 6 - N * 0.05);
    expect(counts.a).toBeLessThan(N / 6 + N * 0.05);
    expect(counts.b).toBeGreaterThan(N / 3 - N * 0.05);
    expect(counts.b).toBeLessThan(N / 3 + N * 0.05);
    expect(counts.c).toBeGreaterThan(N / 2 - N * 0.05);
    expect(counts.c).toBeLessThan(N / 2 + N * 0.05);
  });

  test('single item returns that item regardless of seed', () => {
    const single = [{ item: 'only', weight: 1 }];
    expect(pickWeightedRandom(single, 999)).toBe('only');
  });
});
