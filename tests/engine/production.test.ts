// Tests for docs/GDD.md §4 (Production) + §9 (Threshold).
// THRES-1 snapshot values reflect post-Batch-3 4A-1 rebalance — do not adjust silently.

import { describe, expect, test } from 'vitest';
import {
  calculateCurrentThreshold,
  calculateThreshold,
  softCap,
} from '../../src/engine/production';

describe('softCap (GDD §4)', () => {
  test('identity at boundary: softCap(100) === 100', () => {
    expect(softCap(100)).toBe(100);
  });

  test('pass-through below boundary', () => {
    expect(softCap(0)).toBe(0);
    expect(softCap(1)).toBe(1);
    expect(softCap(50)).toBe(50);
    expect(softCap(99)).toBe(99);
  });

  test('softCap(200) ≈ 164.72 (100 × 2^0.72, empirically verified)', () => {
    expect(softCap(200)).toBeCloseTo(164.72, 2);
  });

  test('softCap(1000) ≈ 524.81 (100 × 10^0.72)', () => {
    expect(softCap(1000)).toBeCloseTo(524.81, 2);
  });

  test('softCap(10000) ≈ 2754.23 (100 × 100^0.72)', () => {
    expect(softCap(10_000)).toBeCloseTo(2754.23, 2);
  });

  test('softCap stays positive and below input for large values', () => {
    const result = softCap(1_000_000);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(1_000_000);
  });

  test('purity: same input yields same output', () => {
    expect(softCap(237)).toBe(softCap(237));
  });
});

describe('calculateThreshold (THRES-1, GDD §9)', () => {
  test('calculateThreshold(0, 0) === 800_000 (P0→P1 Run 1)', () => {
    expect(calculateThreshold(0, 0)).toBe(800_000);
  });

  test('calculateThreshold(0, 1) === 2_800_000 (P0→P1 Run 2, 800K × 3.5)', () => {
    expect(calculateThreshold(0, 1)).toBe(2_800_000);
  });

  test('calculateThreshold(25, 2) === 42_000_000_000 (P25→P26 Run 3, post-Batch-3 7B × 6.0)', () => {
    expect(calculateThreshold(25, 2)).toBe(42_000_000_000);
  });

  test('calculateThreshold(25, 5) === 105_000_000_000 (P25→P26 Run 6 max, 7B × 15.0)', () => {
    expect(calculateThreshold(25, 5)).toBe(105_000_000_000);
  });

  test('calculateThreshold(9, 0) === 35_000_000 (P9→P10 Run 1, post-Batch-3 rebalance)', () => {
    expect(calculateThreshold(9, 0)).toBe(35_000_000);
  });

  test('clamp low: calculateThreshold(-5, -5) === calculateThreshold(0, 0)', () => {
    expect(calculateThreshold(-5, -5)).toBe(calculateThreshold(0, 0));
    expect(calculateThreshold(-5, -5)).toBe(800_000);
  });

  test('clamp high: calculateThreshold(999, 999) === calculateThreshold(25, 5)', () => {
    expect(calculateThreshold(999, 999)).toBe(calculateThreshold(25, 5));
    expect(calculateThreshold(999, 999)).toBe(105_000_000_000);
  });

  test('clamp t alone: calculateThreshold(0, 999) === 12_000_000 (800K × 15.0)', () => {
    expect(calculateThreshold(0, 999)).toBe(12_000_000);
  });

  test('clamp p alone: calculateThreshold(999, 0) === 7_000_000_000 (7B × 1.0)', () => {
    expect(calculateThreshold(999, 0)).toBe(7_000_000_000);
  });

  test('clamp idempotent: further out-of-range values clamp to the same result', () => {
    expect(calculateThreshold(0, 0)).toBe(calculateThreshold(-100, -100));
    expect(calculateThreshold(25, 5)).toBe(calculateThreshold(10_000, 10_000));
  });

  test('purity: same input yields same output', () => {
    expect(calculateThreshold(12, 1)).toBe(calculateThreshold(12, 1));
  });
});

describe('calculateCurrentThreshold (TUTOR-2, GDD §9)', () => {
  test('tutorial cycle returns tutorialThreshold (50K) regardless of prestigeCount', () => {
    expect(
      calculateCurrentThreshold({
        isTutorialCycle: true,
        prestigeCount: 0,
        transcendenceCount: 0,
      }),
    ).toBe(50_000);
  });

  test('tutorial cycle on Run 2 uses runThresholdMult: 50K × 3.5 = 175K', () => {
    expect(
      calculateCurrentThreshold({
        isTutorialCycle: true,
        prestigeCount: 0,
        transcendenceCount: 1,
      }),
    ).toBe(175_000);
  });

  test('normal path at P0/Run 1 returns 800_000 (not 50K)', () => {
    expect(
      calculateCurrentThreshold({
        isTutorialCycle: false,
        prestigeCount: 0,
        transcendenceCount: 0,
      }),
    ).toBe(800_000);
  });

  test('normal path mid-game P9/Run 1 returns 35_000_000', () => {
    expect(
      calculateCurrentThreshold({
        isTutorialCycle: false,
        prestigeCount: 9,
        transcendenceCount: 0,
      }),
    ).toBe(35_000_000);
  });

  test('purity: identical partial states yield identical results', () => {
    const s = { isTutorialCycle: false as const, prestigeCount: 5, transcendenceCount: 2 };
    expect(calculateCurrentThreshold(s)).toBe(calculateCurrentThreshold(s));
  });
});
