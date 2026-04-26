// Sprint 11a Phase 11a.2 — fast-check properties for handlePrestige (PREST-1, GDD §33).

import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import { handlePrestige } from '../../src/engine/prestige';
import { createDefaultState } from '../../src/store/gameStore';
import { PRESTIGE_PRESERVE_FIELDS, PRESTIGE_RESET_FIELDS, PRESTIGE_UPDATE_FIELDS, PRESTIGE_LIFETIME_FIELDS } from '../../src/config/prestige';
import type { GameState } from '../../src/types/GameState';

const cycleGenArb = fc.double({ min: 1_000_000, max: 1e10, noNaN: true });
const prestigeArb = fc.integer({ min: 0, max: 25 });
const timestampArb = fc.integer({ min: 1_000_000, max: 9_999_999_999 });

function freshState(overrides: Partial<GameState> = {}): GameState {
  return { ...createDefaultState(), ...overrides };
}

describe('handlePrestige — property-based invariants (PREST-1, GDD §33)', () => {
  test('PROP-33: deterministic — same input state + timestamp → identical output', () => {
    fc.assert(fc.property(prestigeArb, cycleGenArb, timestampArb, (p, gen, ts) => {
      const state = freshState({ prestigeCount: p, cycleGenerated: gen, currentThreshold: gen, isTutorialCycle: false });
      const a = handlePrestige(state, ts);
      const b = handlePrestige(state, ts);
      return JSON.stringify(a.state) === JSON.stringify(b.state) && JSON.stringify(a.outcome) === JSON.stringify(b.outcome);
    }));
  });

  test('PROP-34: prestigeCount strictly increments by 1', () => {
    fc.assert(fc.property(prestigeArb, cycleGenArb, timestampArb, (p, gen, ts) => {
      const state = freshState({ prestigeCount: p, cycleGenerated: gen, currentThreshold: gen, isTutorialCycle: false });
      const { state: next } = handlePrestige(state, ts);
      return next.prestigeCount === p + 1;
    }));
  });

  test('PROP-35: lifetimePrestiges strictly increments by 1', () => {
    fc.assert(fc.property(prestigeArb, cycleGenArb, timestampArb, fc.integer({ min: 0, max: 1000 }), (p, gen, ts, lifetime) => {
      const state = freshState({ prestigeCount: p, cycleGenerated: gen, currentThreshold: gen, isTutorialCycle: false, lifetimePrestiges: lifetime });
      const { state: next } = handlePrestige(state, ts);
      return next.lifetimePrestiges === lifetime + 1;
    }));
  });

  test('PROP-36: cycleStartTimestamp set to the timestamp param (PREST-1 step)', () => {
    fc.assert(fc.property(prestigeArb, cycleGenArb, timestampArb, (p, gen, ts) => {
      const state = freshState({ prestigeCount: p, cycleGenerated: gen, currentThreshold: gen, isTutorialCycle: false });
      const { state: next } = handlePrestige(state, ts);
      return next.cycleStartTimestamp === ts;
    }));
  });

  test('PROP-37: dischargeLastTimestamp set to timestamp param (BUG-02 fix)', () => {
    fc.assert(fc.property(prestigeArb, cycleGenArb, timestampArb, (p, gen, ts) => {
      const state = freshState({ prestigeCount: p, cycleGenerated: gen, currentThreshold: gen, isTutorialCycle: false });
      const { state: next } = handlePrestige(state, ts);
      return next.dischargeLastTimestamp === ts;
    }));
  });

  test('PROP-38: neurons reset to all-zero counts', () => {
    fc.assert(fc.property(prestigeArb, cycleGenArb, timestampArb, (p, gen, ts) => {
      const state = freshState({
        prestigeCount: p, cycleGenerated: gen, currentThreshold: gen, isTutorialCycle: false,
        neurons: [
          { type: 'basica' as const, count: 50 },
          { type: 'sensorial' as const, count: 20 },
          { type: 'piramidal' as const, count: 10 },
          { type: 'espejo' as const, count: 5 },
          { type: 'integradora' as const, count: 1 },
        ],
      });
      const { state: next } = handlePrestige(state, ts);
      return next.neurons.every((n) => n.count === 0);
    }));
  });

  test('PROP-39: upgrades array reset to empty', () => {
    fc.assert(fc.property(prestigeArb, cycleGenArb, timestampArb, (p, gen, ts) => {
      const state = freshState({
        prestigeCount: p, cycleGenerated: gen, currentThreshold: gen, isTutorialCycle: false,
        upgrades: [{ id: 'test', purchased: true, purchasedAt: 0 }],
      });
      const { state: next } = handlePrestige(state, ts);
      return next.upgrades.length === 0;
    }));
  });

  test('PROP-40: memories monotonically grow per prestige', () => {
    fc.assert(fc.property(prestigeArb, cycleGenArb, timestampArb, fc.integer({ min: 0, max: 10000 }), (p, gen, ts, mem) => {
      const state = freshState({ prestigeCount: p, cycleGenerated: gen, currentThreshold: gen, isTutorialCycle: false, memories: mem });
      const { state: next } = handlePrestige(state, ts);
      return next.memories >= mem;
    }));
  });
});

describe('PRESTIGE field-set invariants (GDD §33)', () => {
  test('PROP-41: RESET ∩ PRESERVE === ∅ (disjoint)', () => {
    const reset = new Set<string>(PRESTIGE_RESET_FIELDS);
    const overlap = PRESTIGE_PRESERVE_FIELDS.filter((f) => reset.has(f));
    expect(overlap).toEqual([]);
  });

  test('PROP-42: RESET + PRESERVE + UPDATE + LIFETIME = exactly 133 fields with no duplicates', () => {
    const all = new Set<string>([
      ...PRESTIGE_RESET_FIELDS,
      ...PRESTIGE_PRESERVE_FIELDS,
      ...PRESTIGE_UPDATE_FIELDS,
      ...PRESTIGE_LIFETIME_FIELDS,
    ]);
    expect(all.size).toBe(PRESTIGE_RESET_FIELDS.length + PRESTIGE_PRESERVE_FIELDS.length + PRESTIGE_UPDATE_FIELDS.length + PRESTIGE_LIFETIME_FIELDS.length);
    expect(all.size).toBe(133);
  });
});
