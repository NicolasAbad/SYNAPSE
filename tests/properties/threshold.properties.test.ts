// Sprint 11a Phase 11a.2 — fast-check properties for calculateThreshold (THRES-1, GDD §9).

import { describe, test } from 'vitest';
import * as fc from 'fast-check';
import { calculateCurrentThreshold, calculateThreshold } from '../../src/engine/production';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';
import type { GameState } from '../../src/types/GameState';

const validP = fc.integer({ min: 0, max: 25 });
const validT = fc.integer({ min: 0, max: 5 });

describe('calculateThreshold — property-based invariants (THRES-1)', () => {
  test('PROP-16: monotonic in transcendenceCount — higher Run = higher threshold for same prestige', () => {
    fc.assert(fc.property(validP, validT, validT, (p, ta, tb) => {
      const [lo, hi] = ta <= tb ? [ta, tb] : [tb, ta];
      return calculateThreshold(p, lo) <= calculateThreshold(p, hi);
    }));
  });

  test('PROP-17: matches formula — calculateThreshold(p, t) === baseThresholdTable[p] × runThresholdMult[t]', () => {
    fc.assert(fc.property(validP, validT, (p, t) => {
      const expected = SYNAPSE_CONSTANTS.baseThresholdTable[p] * SYNAPSE_CONSTANTS.runThresholdMult[t];
      return calculateThreshold(p, t) === expected;
    }));
  });

  test('PROP-18: clamps p above 25 to baseThresholdTable[25]', () => {
    fc.assert(fc.property(fc.integer({ min: 26, max: 100_000 }), (p) => {
      return calculateThreshold(p, 0) === SYNAPSE_CONSTANTS.baseThresholdTable[25];
    }));
  });

  test('PROP-19: clamps p below 0 to baseThresholdTable[0]', () => {
    fc.assert(fc.property(fc.integer({ min: -100_000, max: -1 }), (p) => {
      return calculateThreshold(p, 0) === SYNAPSE_CONSTANTS.baseThresholdTable[0];
    }));
  });

  test('PROP-20: clamps t above max to last runThresholdMult', () => {
    const lastMult = SYNAPSE_CONSTANTS.runThresholdMult[SYNAPSE_CONSTANTS.runThresholdMult.length - 1];
    fc.assert(fc.property(fc.integer({ min: 6, max: 100_000 }), (t) => {
      return calculateThreshold(0, t) === SYNAPSE_CONSTANTS.baseThresholdTable[0] * lastMult;
    }));
  });

  test('PROP-21: deterministic — same (p, t) → same output', () => {
    fc.assert(fc.property(validP, validT, (p, t) => calculateThreshold(p, t) === calculateThreshold(p, t)));
  });

  test('PROP-22: always positive', () => {
    fc.assert(fc.property(validP, validT, (p, t) => calculateThreshold(p, t) > 0));
  });
});

describe('calculateCurrentThreshold — TUTOR-2 override invariants', () => {
  test('PROP-23: tutorial cycle returns tutorialThreshold × runThresholdMult[t]', () => {
    fc.assert(fc.property(validT, (t) => {
      const result = calculateCurrentThreshold({
        isTutorialCycle: true,
        prestigeCount: 0,
        transcendenceCount: t,
      } as GameState);
      return result === SYNAPSE_CONSTANTS.tutorialThreshold * SYNAPSE_CONSTANTS.runThresholdMult[t];
    }));
  });

  test('PROP-24: non-tutorial cycle returns calculateThreshold(p, t) for any prestige', () => {
    fc.assert(fc.property(validP, validT, (p, t) => {
      const result = calculateCurrentThreshold({
        isTutorialCycle: false,
        prestigeCount: p,
        transcendenceCount: t,
      } as GameState);
      return result === calculateThreshold(p, t);
    }));
  });

  test('PROP-25: tutorial override ignores prestigeCount (returns same value for any p when isTutorialCycle=true)', () => {
    // calculateCurrentThreshold returns tutorialThreshold × runMult whenever
    // isTutorialCycle=true, REGARDLESS of prestigeCount. (TUTOR-2 design: the
    // flag only flips false during P0→P1 transition, so in practice p===0 is
    // the only "live" combination, but the function itself is p-agnostic when
    // the flag is on.)
    fc.assert(fc.property(fc.integer({ min: 0, max: 25 }), fc.integer({ min: 0, max: 25 }), validT, (pa, pb, t) => {
      const a = calculateCurrentThreshold({ isTutorialCycle: true, prestigeCount: pa, transcendenceCount: t } as GameState);
      const b = calculateCurrentThreshold({ isTutorialCycle: true, prestigeCount: pb, transcendenceCount: t } as GameState);
      return a === b;
    }));
  });
});
