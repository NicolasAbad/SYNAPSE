// Sprint 11a Phase 11a.3 — migration chain: every historical save-format
// anchor (110 → 119 → 120 → 121 → 123 → 124 → 132 → 133) loads cleanly
// through migrateState() and lands at the canonical 133-field shape with
// every backfilled field at its documented default.
//
// Per SPRINTS.md §Sprint 11a line 1013 + 1040 ("v1.0.0 → v1.0.1 → ... →
// current; 5 version jumps"). 7 jumps tested here (110→119, 119→120,
// 120→121, 121→123, 123→124, 124→132, 132→133); the spec said "5" but
// the actual number grew with sprints — we test what shipped, not what
// was planned.
//
// Anchor synthesis: derive each historical payload by starting from
// createDefaultState() and DELETING the fields added after that anchor.
// This keeps the test in lock-step with the canonical interface — when
// a new field lands in src/types/GameState.ts, this test discovers the
// drift via field-count assertions.

import { describe, test, expect } from 'vitest';
import { migrateState } from '../../src/store/migrate';
import { validateLoadedState } from '../../src/store/saveGame';
import { createDefaultState } from '../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';

/**
 * Fields added per Sprint, ordered by historical landing. Each entry is the
 * set of fields introduced at that anchor; "before this Sprint" means none
 * of these keys existed in the save payload.
 *
 * Anchor field-count = 110 + Σ(prior anchors' field counts), so the cumulative
 * sums must equal: [110, 119, 120, 121, 123, 124, 132, 133]. Verified below.
 */
const ANCHOR_ADDITIONS: Array<{ anchor: number; added: readonly string[]; sprint: string }> = [
  {
    anchor: 119,
    sprint: 'Sprint 7.5.1',
    added: [
      'memoryShards', 'memoryShardUpgrades', 'activePrecommitment',
      'precommitmentStreak', 'mood', 'moodHistory', 'brocaNamedMoments',
      'mastery', 'autoBuyConfig',
    ],
  },
  { anchor: 120, sprint: 'Sprint 7.10.4', added: ['pendingOfflineSummary'] },
  { anchor: 121, sprint: 'Sprint 7.10.5', added: ['lucidDreamActiveUntil'] },
  { anchor: 123, sprint: 'Sprint 9a.3',  added: ['installedAt', 'lastAdWatchedAt'] },
  { anchor: 124, sprint: 'Sprint 9b.4',  added: ['geniusPassDismissals'] },
  {
    anchor: 132,
    sprint: 'Sprint 10.1',
    added: [
      'sfxVolume', 'musicVolume', 'language', 'colorblindMode',
      'reducedMotion', 'highContrast', 'fontSize', 'notificationsEnabled',
    ],
  },
  { anchor: 133, sprint: 'Sprint 10.3',  added: ['firstEventsFired'] },
];

/** Fields added at OR AFTER the given anchor — these get stripped to synthesize legacy. */
function fieldsAddedAfterOrAt(targetAnchor: number): string[] {
  const out: string[] = [];
  for (const entry of ANCHOR_ADDITIONS) {
    if (entry.anchor > targetAnchor) for (const k of entry.added) out.push(k);
  }
  return out;
}

/** Synthesize a legacy payload at the given field count by stripping later additions. */
function synthesizeAnchor(targetCount: number): Record<string, unknown> {
  const base = createDefaultState() as unknown as Record<string, unknown>;
  const out: Record<string, unknown> = { ...base };
  for (const k of fieldsAddedAfterOrAt(targetCount)) delete out[k];
  return out;
}

/** Canonical default values per migrate.ts — assertions for backfilled fields. */
const CANONICAL_DEFAULTS: Record<string, unknown> = {
  memoryShards: { emotional: 0, procedural: 0, episodic: 0 },
  memoryShardUpgrades: [],
  activePrecommitment: null,
  precommitmentStreak: 0,
  mood: SYNAPSE_CONSTANTS.moodInitialValue,
  moodHistory: [],
  brocaNamedMoments: [],
  mastery: {},
  autoBuyConfig: {},
  pendingOfflineSummary: null,
  lucidDreamActiveUntil: null,
  installedAt: 0,
  lastAdWatchedAt: 0,
  geniusPassDismissals: 0,
  sfxVolume: SYNAPSE_CONSTANTS.defaultSfxVolume,
  musicVolume: SYNAPSE_CONSTANTS.defaultMusicVolume,
  language: 'en',
  colorblindMode: false,
  reducedMotion: false,
  highContrast: false,
  fontSize: 'medium',
  notificationsEnabled: true,
  firstEventsFired: [],
};

describe('Migration chain — anchor synthesis matches expected counts', () => {
  test('synthesizing each anchor produces the documented field count', () => {
    expect(Object.keys(synthesizeAnchor(110)).length).toBe(110);
    expect(Object.keys(synthesizeAnchor(119)).length).toBe(119);
    expect(Object.keys(synthesizeAnchor(120)).length).toBe(120);
    expect(Object.keys(synthesizeAnchor(121)).length).toBe(121);
    expect(Object.keys(synthesizeAnchor(123)).length).toBe(123);
    expect(Object.keys(synthesizeAnchor(124)).length).toBe(124);
    expect(Object.keys(synthesizeAnchor(132)).length).toBe(132);
    expect(Object.keys(synthesizeAnchor(133)).length).toBe(133);
  });

  test('cumulative anchor additions match GameState field count (133 invariant)', () => {
    // 110 + Σ additions = 133. If this fails, ANCHOR_ADDITIONS is out of sync
    // with src/types/GameState.ts and a new field landed without updating this test.
    const totalAdded = ANCHOR_ADDITIONS.reduce((sum, e) => sum + e.added.length, 0);
    expect(110 + totalAdded).toBe(SYNAPSE_CONSTANTS.GAMESTATE_FIELD_COUNT);
  });
});

describe('Migration chain — every legacy anchor migrates to current 133-field shape', () => {
  for (const target of [110, 119, 120, 121, 123, 124, 132] as const) {
    test(`legacy ${target}-field payload migrates to 133 fields and validates`, () => {
      const legacy = synthesizeAnchor(target);
      expect(Object.keys(legacy).length).toBe(target);

      const migrated = migrateState(legacy) as Record<string, unknown>;
      expect(Object.keys(migrated).length).toBe(133);

      // validateLoadedState must accept (returns object, not null).
      const validated = validateLoadedState(migrated);
      expect(validated).not.toBeNull();
    });
  }

  test('current 133-field payload is a no-op through migrateState (idempotent)', () => {
    const current = createDefaultState() as unknown as Record<string, unknown>;
    const migrated = migrateState(current) as Record<string, unknown>;
    expect(migrated).toEqual(current);
  });
});

describe('Migration chain — backfilled fields land at canonical defaults', () => {
  // For each anchor, check that fields added after that anchor land at their
  // canonical defaults in the migrated output.
  for (const target of [110, 119, 120, 121, 123, 124, 132] as const) {
    test(`${target} → 133: every backfilled field equals its canonical default`, () => {
      const legacy = synthesizeAnchor(target);
      const migrated = migrateState(legacy) as Record<string, unknown>;

      const backfilled = fieldsAddedAfterOrAt(target);
      for (const key of backfilled) {
        if (key in CANONICAL_DEFAULTS) {
          expect(migrated[key]).toEqual(CANONICAL_DEFAULTS[key]);
        }
      }
    });
  }
});

describe('Migration chain — pre-existing field values are preserved across every anchor', () => {
  for (const target of [110, 119, 120, 121, 123, 124, 132] as const) {
    test(`${target} → 133: thoughts/prestigeCount/memories survive the migration`, () => {
      const legacy = synthesizeAnchor(target);
      legacy.thoughts = 12_345.67;
      legacy.prestigeCount = 7;
      legacy.memories = 42;

      const migrated = migrateState(legacy) as Record<string, unknown>;
      expect(migrated.thoughts).toBe(12_345.67);
      expect(migrated.prestigeCount).toBe(7);
      expect(migrated.memories).toBe(42);
    });
  }
});

describe('Migration chain — sequential migration is idempotent at every anchor', () => {
  test('110 → 119 → 120 → 121 → 123 → 124 → 132 → 133: re-migrating a migrated payload changes nothing', () => {
    // The save format only ever moves forward, but if a save round-trips
    // through migrateState multiple times (as it does on every load + save),
    // the result must stabilize after the first pass.
    for (const target of [110, 119, 120, 121, 123, 124, 132] as const) {
      const legacy = synthesizeAnchor(target);
      const m1 = migrateState(legacy);
      const m2 = migrateState(m1);
      const m3 = migrateState(m2);
      expect(m1).toEqual(m2);
      expect(m2).toEqual(m3);
    }
  });
});
