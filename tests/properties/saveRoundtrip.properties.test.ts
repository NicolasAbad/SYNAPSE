// Sprint 11a Phase 11a.2 — fast-check properties for save round-trip + state integrity.

import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import { createDefaultState } from '../../src/store/gameStore';
import { migrateState } from '../../src/store/migrate';
import type { GameState } from '../../src/types/GameState';

describe('Save round-trip + migrate — property invariants (CODE-6, MIG-1)', () => {
  test('PROP-43: createDefaultState always returns 133 fields', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 1 }), () => {
      const s = createDefaultState();
      return Object.keys(s).length === 133;
    }));
  });

  test('PROP-44: createDefaultState is deterministic — JSON-equal across calls (INIT-1)', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 1 }), () => {
      const a = createDefaultState();
      const b = createDefaultState();
      return JSON.stringify(a) === JSON.stringify(b);
    }));
  });

  test('PROP-45: JSON round-trip preserves all 133 fields', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 1 }), () => {
      const s = createDefaultState();
      const back = JSON.parse(JSON.stringify(s)) as GameState;
      return Object.keys(back).length === 133;
    }));
  });

  test('PROP-46: migrateState is idempotent on a current 133-field default', () => {
    fc.assert(fc.property(fc.integer({ min: 1, max: 5 }), (n) => {
      let m = createDefaultState() as unknown;
      for (let i = 0; i < n; i++) m = migrateState(m);
      const final = m as Record<string, unknown>;
      return Object.keys(final).length === 133;
    }));
  });

  test('PROP-47: migrateState passes through bad input (defensive — null / array / primitive)', () => {
    expect(migrateState(null)).toBeNull();
    fc.assert(fc.property(fc.array(fc.anything()), (arr) => migrateState(arr) === arr));
    fc.assert(fc.property(fc.string(), (s) => migrateState(s) === s));
    fc.assert(fc.property(fc.integer(), (n) => migrateState(n) === n));
  });

  test('PROP-48: pre-existing field values not clobbered by migration', () => {
    fc.assert(fc.property(
      fc.double({ min: 0, max: 1e10, noNaN: true }),
      fc.integer({ min: 0, max: 26 }),
      (thoughts, prestige) => {
        const s = { ...createDefaultState(), thoughts, prestigeCount: prestige } as unknown;
        const m = migrateState(s) as Record<string, unknown>;
        return m.thoughts === thoughts && m.prestigeCount === prestige;
      },
    ));
  });

  test('PROP-49: every field in createDefaultState() survives JSON round-trip with same value', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 1 }), () => {
      const s = createDefaultState() as unknown as Record<string, unknown>;
      const back = JSON.parse(JSON.stringify(s)) as Record<string, unknown>;
      for (const key of Object.keys(s)) {
        if (JSON.stringify(s[key]) !== JSON.stringify(back[key])) return false;
      }
      return true;
    }));
  });

  test('PROP-50: createDefaultState session/cycle timestamps stay at pure defaults (INIT-1)', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 1 }), () => {
      const s = createDefaultState();
      return s.cycleStartTimestamp === 0
        && s.lastActiveTimestamp === 0
        && s.dischargeLastTimestamp === 0
        && s.sessionStartTimestamp === null;
    }));
  });
});
