// Tests for src/ui/util/formatNumber.ts — Sprint 2 test checklist items 1-2.

import { describe, expect, test } from 'vitest';
import { formatNumber } from '../../../src/ui/util/formatNumber';

describe('formatNumber — SPRINTS.md explicit examples', () => {
  test('formatNumber(1234) === "1.23K"', () => {
    expect(formatNumber(1234)).toBe('1.23K');
  });
  test('formatNumber(1.5e9) === "1.5B"', () => {
    expect(formatNumber(1.5e9)).toBe('1.5B');
  });
  test('formatNumber(1.5e12) === "1.5T"', () => {
    expect(formatNumber(1.5e12)).toBe('1.5T');
  });
  test('formatNumber(2.34e15) === "2.34Q"', () => {
    expect(formatNumber(2.34e15)).toBe('2.34Q');
  });
});

describe('formatNumber — precision rules (< 10, < 100, ≥ 100)', () => {
  test('< 10 → up to 2 decimals', () => {
    expect(formatNumber(3.14159)).toBe('3.14');
    expect(formatNumber(9.999)).toBe('10'); // rounds; crosses boundary to 0 decimals
    expect(formatNumber(7)).toBe('7');
  });
  test('< 100 → up to 1 decimal', () => {
    expect(formatNumber(31.4159)).toBe('31.4');
    expect(formatNumber(99.9)).toBe('99.9');
  });
  test('≥ 100 → 0 decimals', () => {
    expect(formatNumber(314.159)).toBe('314');
    expect(formatNumber(999)).toBe('999');
  });
});

describe('formatNumber — suffix boundary transitions', () => {
  test('1000 → "1K" (exact K transition, trimmed)', () => {
    expect(formatNumber(1000)).toBe('1K');
  });
  test('999 → "999" (below K, no suffix)', () => {
    expect(formatNumber(999)).toBe('999');
  });
  test('1_000_000 → "1M"', () => {
    expect(formatNumber(1_000_000)).toBe('1M');
  });
  test('12_345 → "12.3K" (< 100, 1 decimal)', () => {
    expect(formatNumber(12_345)).toBe('12.3K');
  });
  test('123_456 → "123K" (≥ 100, 0 decimals)', () => {
    expect(formatNumber(123_456)).toBe('123K');
  });
});

describe('formatNumber — trailing-zero trimming', () => {
  test('1500 → "1.5K" (not "1.50K")', () => {
    expect(formatNumber(1500)).toBe('1.5K');
  });
  test('2000 → "2K" (not "2.0K" or "2.00K")', () => {
    expect(formatNumber(2000)).toBe('2K');
  });
  test('preserves 2-decimal when both digits non-zero', () => {
    expect(formatNumber(1230)).toBe('1.23K');
  });
});

describe('formatNumber — edge cases', () => {
  test('0 → "0"', () => {
    expect(formatNumber(0)).toBe('0');
  });
  test('negative values get "-" prefix', () => {
    expect(formatNumber(-1234)).toBe('-1.23K');
    expect(formatNumber(-1.5e9)).toBe('-1.5B');
  });
  test('values < 1 → preserve decimals with trim', () => {
    expect(formatNumber(0.5)).toBe('0.5');
    expect(formatNumber(0.25)).toBe('0.25');
  });
  test('above 999Q → "999Q+" cap', () => {
    expect(formatNumber(1e18)).toBe('999Q+');
    expect(formatNumber(1.5e20)).toBe('999Q+');
    expect(formatNumber(-1e18)).toBe('-999Q+');
  });
  test('999Q exactly → "999Q" (not capped)', () => {
    expect(formatNumber(999e15)).toBe('999Q');
  });
});

describe('formatNumber — determinism (no Date.now / Math.random usage)', () => {
  // If formatNumber used non-deterministic inputs, repeated calls could
  // vary. Assert identical output for identical input.
  test('repeated calls return identical results', () => {
    for (let i = 0; i < 100; i++) {
      expect(formatNumber(1234.5678)).toBe('1.23K');
    }
  });
});
