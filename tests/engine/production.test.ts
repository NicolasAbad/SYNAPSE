// Tests for docs/GDD.md §4 (Production) + §9 (Threshold).
// THRES-1 snapshot values reflect post-Batch-3 4A-1 rebalance — do not adjust silently.

import { describe, expect, test } from 'vitest';
import {
  calculateCurrentThreshold,
  calculateThreshold,
  softCap,
} from '../../src/engine/production';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';

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
  test('calculateThreshold(0, 0) === baseThresholdTable[0] (P0→P1 Run 1)', () => {
    expect(calculateThreshold(0, 0)).toBe(SYNAPSE_CONSTANTS.baseThresholdTable[0]);
  });

  test('calculateThreshold(0, 1) === baseThresholdTable[0] × runThresholdMult[1] (P0→P1 Run 2)', () => {
    expect(calculateThreshold(0, 1)).toBe(SYNAPSE_CONSTANTS.baseThresholdTable[0] * SYNAPSE_CONSTANTS.runThresholdMult[1]);
  });

  test('calculateThreshold(25, 2) === baseThresholdTable[25] × runThresholdMult[2] (P25→P26 Run 3)', () => {
    expect(calculateThreshold(25, 2)).toBe(SYNAPSE_CONSTANTS.baseThresholdTable[25] * SYNAPSE_CONSTANTS.runThresholdMult[2]);
  });

  test('calculateThreshold(25, 5) === baseThresholdTable[25] × runThresholdMult[5] (P25→P26 Run 6 max)', () => {
    expect(calculateThreshold(25, 5)).toBe(SYNAPSE_CONSTANTS.baseThresholdTable[25] * SYNAPSE_CONSTANTS.runThresholdMult[5]);
  });

  test('calculateThreshold(9, 0) === baseThresholdTable[9] (P9→P10 Run 1)', () => {
    expect(calculateThreshold(9, 0)).toBe(SYNAPSE_CONSTANTS.baseThresholdTable[9]);
  });

  test('clamp low: calculateThreshold(-5, -5) === calculateThreshold(0, 0)', () => {
    expect(calculateThreshold(-5, -5)).toBe(calculateThreshold(0, 0));
    expect(calculateThreshold(-5, -5)).toBe(SYNAPSE_CONSTANTS.baseThresholdTable[0]);
  });

  test('clamp high: calculateThreshold(999, 999) === calculateThreshold(25, 5)', () => {
    expect(calculateThreshold(999, 999)).toBe(calculateThreshold(25, 5));
    expect(calculateThreshold(999, 999)).toBe(SYNAPSE_CONSTANTS.baseThresholdTable[25] * SYNAPSE_CONSTANTS.runThresholdMult[5]);
  });

  test('clamp t alone: calculateThreshold(0, 999) === baseThresholdTable[0] × max runThresholdMult', () => {
    expect(calculateThreshold(0, 999)).toBe(SYNAPSE_CONSTANTS.baseThresholdTable[0] * SYNAPSE_CONSTANTS.runThresholdMult[5]);
  });

  test('clamp p alone: calculateThreshold(999, 0) === baseThresholdTable[25]', () => {
    expect(calculateThreshold(999, 0)).toBe(SYNAPSE_CONSTANTS.baseThresholdTable[25]);
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
  test('tutorial cycle returns tutorialThreshold regardless of prestigeCount', () => {
    expect(
      calculateCurrentThreshold({
        isTutorialCycle: true,
        prestigeCount: 0,
        transcendenceCount: 0,
      }),
    ).toBe(SYNAPSE_CONSTANTS.tutorialThreshold);
  });

  test('tutorial cycle on Run 2 uses runThresholdMult[1] (3.5×)', () => {
    expect(
      calculateCurrentThreshold({
        isTutorialCycle: true,
        prestigeCount: 0,
        transcendenceCount: 1,
      }),
    ).toBe(SYNAPSE_CONSTANTS.tutorialThreshold * 3.5);
  });

  test('normal path at P0/Run 1 returns baseThresholdTable[0] (not tutorialThreshold)', () => {
    expect(
      calculateCurrentThreshold({
        isTutorialCycle: false,
        prestigeCount: 0,
        transcendenceCount: 0,
      }),
    ).toBe(SYNAPSE_CONSTANTS.baseThresholdTable[0]);
  });

  test('normal path mid-game P9/Run 1 returns baseThresholdTable[9]', () => {
    expect(
      calculateCurrentThreshold({
        isTutorialCycle: false,
        prestigeCount: 9,
        transcendenceCount: 0,
      }),
    ).toBe(SYNAPSE_CONSTANTS.baseThresholdTable[9]);
  });

  test('purity: identical partial states yield identical results', () => {
    const s = { isTutorialCycle: false as const, prestigeCount: 5, transcendenceCount: 2 };
    expect(calculateCurrentThreshold(s)).toBe(calculateCurrentThreshold(s));
  });
});
