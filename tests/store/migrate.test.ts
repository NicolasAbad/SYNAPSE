// Tests for src/store/migrate.ts — schema backfill (110 → 123 current).
// Originally 7.5.1 (110→119, +9 region/mastery fields); extended 7.10.4 (+pendingOfflineSummary)
// and 7.10.5 (+lucidDreamActiveUntil).
//
// These tests are intentionally adversarial and mostly black-box:
// - Verify legacy 110-field saves load cleanly with all 11 new fields backfilled.
// - Verify the migration is idempotent (re-running on a 123-field payload changes nothing).
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
  'pendingOfflineSummary', // Sprint 7.10.4
  'lucidDreamActiveUntil', // Sprint 7.10.5
  'installedAt',           // Sprint 9a Phase 9a.3 — V-5
  'lastAdWatchedAt',       // Sprint 9a Phase 9a.3 — V-2
] as const;

/** Build a synthetic legacy 110-field payload by stripping the 13 backfill fields from a current default. */
function legacy110(): Record<string, unknown> {
  const current = createDefaultState() as unknown as Record<string, unknown>;
  const stripped: Record<string, unknown> = { ...current };
  for (const key of NEW_FIELDS) delete stripped[key];
  return stripped;
}

describe('migrateState — 110 → 123 backfill (Sprint 7.5.1 + 7.10.4 + 7.10.5 + 9a.3)', () => {
  test('legacy 110-field payload becomes a 123-field payload', () => {
    const legacy = legacy110();
    expect(Object.keys(legacy).length).toBe(110);
    const migrated = migrateState(legacy) as Record<string, unknown>;
    expect(Object.keys(migrated).length).toBe(123);
  });

  test('all 11 new fields are present after migration', () => {
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
    expect(migrated.pendingOfflineSummary).toBeNull();
    expect(migrated.lucidDreamActiveUntil).toBeNull();
    expect(migrated.installedAt).toBe(0);
    expect(migrated.lastAdWatchedAt).toBe(0);
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
  test('a fully-formed 123-field payload passes through unchanged', () => {
    const current = createDefaultState() as unknown as Record<string, unknown>;
    const migrated = migrateState(current) as Record<string, unknown>;
    expect(Object.keys(migrated).length).toBe(123);
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

describe('migrateState — Sprint 7.5.2 retired upgrade strip (consolidacion_memoria)', () => {
  test('strips consolidacion_memoria from saved upgrades array', () => {
    const legacy = legacy110();
    legacy.upgrades = [
      { id: 'consolidacion_memoria', purchased: true, purchasedAt: 0 },
      { id: 'descarga_neural', purchased: true, purchasedAt: 0 },
    ];
    const migrated = migrateState(legacy) as Record<string, unknown>;
    const upgrades = migrated.upgrades as Array<{ id: string }>;
    expect(upgrades).toHaveLength(1);
    expect(upgrades[0].id).toBe('descarga_neural');
  });

  test('preserves other upgrades and Memorias balance (no refund per GDD §16.8)', () => {
    const legacy = legacy110();
    legacy.upgrades = [{ id: 'consolidacion_memoria', purchased: true, purchasedAt: 0 }];
    legacy.memories = 7;
    const migrated = migrateState(legacy) as Record<string, unknown>;
    expect(migrated.memories).toBe(7); // not refunded — value-neutral sunset
    expect((migrated.upgrades as unknown[]).length).toBe(0);
  });

  test('idempotent — re-migrating an already-stripped save changes nothing', () => {
    const legacy = legacy110();
    legacy.upgrades = [{ id: 'consolidacion_memoria', purchased: true, purchasedAt: 0 }];
    const m1 = migrateState(legacy) as Record<string, unknown>;
    const m2 = migrateState(m1) as Record<string, unknown>;
    expect(m1).toEqual(m2);
  });

  test('preserves shape on saves that never had consolidacion_memoria', () => {
    const legacy = legacy110();
    legacy.upgrades = [{ id: 'descarga_neural', purchased: true, purchasedAt: 0 }];
    const migrated = migrateState(legacy) as Record<string, unknown>;
    expect((migrated.upgrades as unknown[]).length).toBe(1);
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
