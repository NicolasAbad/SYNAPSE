// Tests for src/store/migrate.ts — Sprint 7.5.1 schema backfill (110 → 119).
//
// These tests are intentionally adversarial and mostly black-box:
// - Verify legacy 110-field saves load cleanly with all 9 new fields backfilled.
// - Verify the migration is idempotent (re-running on a 119-field payload changes nothing).
// - Verify pre-existing values for the new fields are NOT clobbered (player progress wins).
// - Verify defensive behavior on bad inputs (null, array, primitives) — pass-through.
// - Verify defaults match the canonical constants (no invented values).

import { describe, expect, test } from 'vitest';
import { migrateState } from '../../src/store/migrate';
import { createDefaultState } from '../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';

const NEW_FIELDS = [
  'memoryShards',
  'memoryShardUpgrades',
  'activePrecommitment',
  'precommitmentStreak',
  'mood',
  'moodHistory',
  'brocaNamedMoments',
  'mastery',
  'autoBuyConfig',
] as const;

/** Build a synthetic legacy 110-field payload by stripping the 9 new fields from a current default. */
function legacy110(): Record<string, unknown> {
  const current = createDefaultState() as unknown as Record<string, unknown>;
  const stripped: Record<string, unknown> = { ...current };
  for (const key of NEW_FIELDS) delete stripped[key];
  return stripped;
}

describe('migrateState — 110 → 119 backfill (Sprint 7.5.1)', () => {
  test('legacy 110-field payload becomes a 119-field payload', () => {
    const legacy = legacy110();
    expect(Object.keys(legacy).length).toBe(110);
    const migrated = migrateState(legacy) as Record<string, unknown>;
    expect(Object.keys(migrated).length).toBe(119);
  });

  test('all 9 new fields are present after migration', () => {
    const migrated = migrateState(legacy110()) as Record<string, unknown>;
    for (const key of NEW_FIELDS) {
      expect(key in migrated).toBe(true);
    }
  });

  test('default values match canonical constants — no invented numbers', () => {
    const migrated = migrateState(legacy110()) as Record<string, unknown>;
    expect(migrated.memoryShards).toEqual({ emotional: 0, procedural: 0, episodic: 0 });
    expect(migrated.memoryShardUpgrades).toEqual([]);
    expect(migrated.activePrecommitment).toBeNull();
    expect(migrated.precommitmentStreak).toBe(0);
    expect(migrated.mood).toBe(SYNAPSE_CONSTANTS.moodInitialValue);
    expect(migrated.moodHistory).toEqual([]);
    expect(migrated.brocaNamedMoments).toEqual([]);
    expect(migrated.mastery).toEqual({});
    expect(migrated.autoBuyConfig).toEqual({});
  });

  test('migration preserves all pre-existing 110 fields untouched', () => {
    const legacy = legacy110();
    legacy.thoughts = 12_345.67;
    legacy.prestigeCount = 7;
    legacy.memories = 42;
    const migrated = migrateState(legacy) as Record<string, unknown>;
    expect(migrated.thoughts).toBe(12_345.67);
    expect(migrated.prestigeCount).toBe(7);
    expect(migrated.memories).toBe(42);
  });
});

describe('migrateState — idempotency', () => {
  test('a fully-formed 119-field payload passes through unchanged', () => {
    const current = createDefaultState() as unknown as Record<string, unknown>;
    const migrated = migrateState(current) as Record<string, unknown>;
    expect(Object.keys(migrated).length).toBe(119);
    // Deep-equal — defaults didn't override the existing values.
    expect(migrated).toEqual(current);
  });

  test('migration is idempotent across multiple calls', () => {
    const legacy = legacy110();
    const m1 = migrateState(legacy);
    const m2 = migrateState(m1);
    const m3 = migrateState(m2);
    expect(m1).toEqual(m2);
    expect(m2).toEqual(m3);
  });

  test('player progress on new fields is NOT clobbered by re-migration', () => {
    const legacy = legacy110();
    const migrated = migrateState(legacy) as Record<string, unknown>;
    // Simulate the player accumulating progress.
    (migrated.memoryShards as { emotional: number; procedural: number; episodic: number }).emotional = 87;
    migrated.precommitmentStreak = 3;
    migrated.mood = 73;
    (migrated.mastery as Record<string, number>)['mut_dopamine'] = 5;
    // Re-migrate (e.g. on next load).
    const remigrated = migrateState(migrated) as Record<string, unknown>;
    expect((remigrated.memoryShards as { emotional: number }).emotional).toBe(87);
    expect(remigrated.precommitmentStreak).toBe(3);
    expect(remigrated.mood).toBe(73);
    expect((remigrated.mastery as Record<string, number>)['mut_dopamine']).toBe(5);
  });
});

describe('migrateState — defensive behavior on bad input', () => {
  test('returns null for null input (no NPE)', () => {
    expect(migrateState(null)).toBeNull();
  });

  test('returns the input array unchanged (validator rejects later)', () => {
    const arr = [1, 2, 3];
    expect(migrateState(arr)).toBe(arr);
  });

  test('returns primitives unchanged (validator rejects later)', () => {
    expect(migrateState(42)).toBe(42);
    expect(migrateState('string')).toBe('string');
    expect(migrateState(true)).toBe(true);
    expect(migrateState(undefined)).toBe(undefined);
  });
});
