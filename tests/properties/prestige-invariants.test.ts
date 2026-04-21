// Property-based tests for src/engine/prestige.ts (Sprint 4a Phase 4a.3).
//
// Covers the Sprint 4a §TEST-3 property-based requirement:
// for any valid pre-prestige state + any valid timestamp, the post-prestige
// state satisfies the §33/§35 invariants — specifically PREST-1 step 10
// (lifetimePrestiges +1), UPDATE (prestigeCount +1, TUTOR-2 flip), and
// CORE-8 amended (momentum ≤ nextThreshold × maxMomentumPct).
//
// fast-check generates adversarial inputs (including the edge cases the
// deterministic unit tests miss — negative zero, 0-PPS, boundary thresholds).

import { describe, test } from 'vitest';
import * as fc from 'fast-check';
import { handlePrestige } from '../../src/engine/prestige';
import { createDefaultState } from '../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';
import type { GameState } from '../../src/types/GameState';

const validPrestige = fc.integer({ min: 0, max: 25 }); // stay below final-tier boundary so nextThreshold is defined
const validTranscendence = fc.integer({ min: 0, max: SYNAPSE_CONSTANTS.runThresholdMult.length - 1 });
const validPPS = fc.double({ min: 0, max: 1e12, noNaN: true, noDefaultInfinity: true });
const validLifetime = fc.integer({ min: 0, max: 1000 });
const validTimestamp = fc.integer({ min: 1, max: 10 * 365 * 24 * 60 * 60 * 1000 }); // up to 10 years
const validCycleDuration = fc.integer({ min: 1, max: 60 * 60 * 1000 }); // up to 1 hour

function buildState(
  pc: number,
  tc: number,
  pps: number,
  lp: number,
  cycleDurationMs: number,
  timestamp: number,
  isTutorial: boolean,
): GameState {
  return {
    ...createDefaultState(),
    prestigeCount: pc,
    transcendenceCount: tc,
    effectiveProductionPerSecond: pps,
    lifetimePrestiges: lp,
    cycleStartTimestamp: Math.max(0, timestamp - cycleDurationMs),
    isTutorialCycle: isTutorial,
  };
}

describe('Invariant: prestigeCount strictly increments by 1 on every prestige', () => {
  test('for any valid state, post.prestigeCount === pre.prestigeCount + 1', () => {
    fc.assert(
      fc.property(
        validPrestige,
        validTranscendence,
        validPPS,
        validLifetime,
        validCycleDuration,
        validTimestamp,
        fc.boolean(),
        (pc, tc, pps, lp, dur, ts, isTut) => {
          const state = buildState(pc, tc, pps, lp, dur, ts, isTut);
          const { state: next } = handlePrestige(state, ts);
          return next.prestigeCount === pc + 1;
        },
      ),
    );
  });
});

describe('Invariant: TUTOR-2 one-way flip — isTutorialCycle always false post-prestige', () => {
  test('regardless of pre-prestige value', () => {
    fc.assert(
      fc.property(
        validPrestige,
        validTranscendence,
        validPPS,
        validTimestamp,
        fc.boolean(),
        (pc, tc, pps, ts, isTut) => {
          const state = buildState(pc, tc, pps, 0, 1000, ts, isTut);
          const { state: next } = handlePrestige(state, ts);
          return next.isTutorialCycle === false;
        },
      ),
    );
  });
});

describe('Invariant: CORE-8 amended — momentumBonus ≤ nextThreshold × maxMomentumPct', () => {
  test('cap engages for any valid PPS and threshold combination', () => {
    fc.assert(
      fc.property(
        validPrestige,
        validTranscendence,
        validPPS,
        validTimestamp,
        (pc, tc, pps, ts) => {
          const state = buildState(pc, tc, pps, 0, 1000, ts, false);
          const { outcome } = handlePrestige(state, ts);
          const cap = outcome.nextThreshold * SYNAPSE_CONSTANTS.maxMomentumPct;
          // ε tolerance for fp noise at the boundary (cap can equal raw when
          // PPS × 30 exactly equals threshold × 0.10).
          return outcome.momentumBonus <= cap + 1e-6;
        },
      ),
    );
  });

  test('momentumBonus never exceeds raw formula (PPS × momentumBonusSeconds)', () => {
    fc.assert(
      fc.property(
        validPrestige,
        validTranscendence,
        validPPS,
        validTimestamp,
        (pc, tc, pps, ts) => {
          const state = buildState(pc, tc, pps, 0, 1000, ts, false);
          const { outcome } = handlePrestige(state, ts);
          const raw = pps * SYNAPSE_CONSTANTS.momentumBonusSeconds;
          return outcome.momentumBonus <= raw + 1e-6;
        },
      ),
    );
  });
});

describe('Invariant: lifetimePrestiges strictly increments by 1', () => {
  test('regardless of any other state', () => {
    fc.assert(
      fc.property(
        validPrestige,
        validTranscendence,
        validPPS,
        validLifetime,
        validTimestamp,
        (pc, tc, pps, lp, ts) => {
          const state = buildState(pc, tc, pps, lp, 1000, ts, false);
          const { state: next } = handlePrestige(state, ts);
          return next.lifetimePrestiges === lp + 1;
        },
      ),
    );
  });
});

describe('Invariant: Memories gained is ≥ baseMemoriesPerPrestige', () => {
  test('never drops below the §2 base (no upgrade path reduces Memorias)', () => {
    fc.assert(
      fc.property(
        validPrestige,
        validTranscendence,
        validPPS,
        validTimestamp,
        (pc, tc, pps, ts) => {
          const state = buildState(pc, tc, pps, 0, 1000, ts, false);
          const { outcome } = handlePrestige(state, ts);
          return outcome.memoriesGained >= SYNAPSE_CONSTANTS.baseMemoriesPerPrestige;
        },
      ),
    );
  });
});

describe('Invariant: personalBests[prestigeCount] defined after prestige', () => {
  test('post.personalBests has an entry at the PRE-increment prestigeCount', () => {
    fc.assert(
      fc.property(
        validPrestige,
        validTranscendence,
        validPPS,
        validCycleDuration,
        validTimestamp,
        (pc, tc, pps, dur, ts) => {
          const state = buildState(pc, tc, pps, 0, dur, ts, false);
          const { state: next } = handlePrestige(state, ts);
          return next.personalBests[pc] !== undefined;
        },
      ),
    );
  });
});

describe('Invariant: awakeningLog appends exactly one entry per prestige', () => {
  test('post.awakeningLog.length === pre.awakeningLog.length + 1', () => {
    fc.assert(
      fc.property(
        validPrestige,
        validTranscendence,
        validPPS,
        validTimestamp,
        (pc, tc, pps, ts) => {
          const state = buildState(pc, tc, pps, 0, 1000, ts, false);
          const preLen = state.awakeningLog.length;
          const { state: next } = handlePrestige(state, ts);
          return next.awakeningLog.length === preLen + 1;
        },
      ),
    );
  });
});

describe('Invariant: totalGenerated is preserved (lifetime currency)', () => {
  test('post.totalGenerated === pre.totalGenerated', () => {
    fc.assert(
      fc.property(
        validPrestige,
        validTranscendence,
        validPPS,
        validTimestamp,
        fc.double({ min: 0, max: 1e15, noNaN: true, noDefaultInfinity: true }),
        (pc, tc, pps, ts, totalGen) => {
          const state: GameState = {
            ...buildState(pc, tc, pps, 0, 1000, ts, false),
            totalGenerated: totalGen,
          };
          const { state: next } = handlePrestige(state, ts);
          return next.totalGenerated === totalGen;
        },
      ),
    );
  });
});
