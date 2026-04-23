// Sprint 7.7 Phase 7.7.2 — Mastery engine tests (GDD §38 MASTERY-1..4).

import { describe, expect, test } from 'vitest';
import {
  MASTERY_ENTITY_IDS,
  MASTERY_TOTAL_ENTITIES,
  masteryClassOf,
  masteryUses,
  masteryLevel,
  masteryBonus,
  masteryGainMult,
  applyMasteryXpGain,
  masteryLevelUps,
} from '../../src/engine/mastery';
import { createDefaultState } from '../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';
import type { GameState } from '../../src/types/GameState';

describe('Mastery — canonical entity registry', () => {
  test('derives 15 mutations + 42 upgrades + 3 pathways + 3 archetypes (Sprint 7.5.3 post-retune)', () => {
    expect(MASTERY_ENTITY_IDS.mutation.length).toBe(15);
    expect(MASTERY_ENTITY_IDS.upgrade.length).toBe(42);
    expect(MASTERY_ENTITY_IDS.pathway.length).toBe(3);
    expect(MASTERY_ENTITY_IDS.archetype.length).toBe(3);
    expect(MASTERY_TOTAL_ENTITIES).toBe(63);
  });

  test('masteryClassOf returns the correct class or null', () => {
    expect(masteryClassOf('hiperestimulacion')).toBe('mutation');
    expect(masteryClassOf('rapida')).toBe('pathway');
    expect(masteryClassOf('analitica')).toBe('archetype');
    expect(masteryClassOf(MASTERY_ENTITY_IDS.upgrade[0])).toBe('upgrade');
    expect(masteryClassOf('not_a_real_id')).toBeNull();
    expect(masteryClassOf('')).toBeNull();
  });

  test('shard upgrades are intentionally NOT tracked (§38 scope exclusion)', () => {
    expect(masteryClassOf('shard_emo_pulse')).toBeNull();
    expect(masteryClassOf('shard_proc_mastery')).toBeNull();
    expect(masteryClassOf('shard_epi_imprint')).toBeNull();
  });
});

describe('Mastery — level + bonus accessors', () => {
  test('default state: 0 uses → level 0, bonus 0', () => {
    const s = createDefaultState();
    const id = 'hiperestimulacion';
    expect(masteryUses(s, id)).toBe(0);
    expect(masteryLevel(s, id)).toBe(0);
    expect(masteryBonus(s, id)).toBe(0);
  });

  test('fractional uses floor to integer level', () => {
    const s: GameState = { ...createDefaultState(), mastery: { rapida: 3.75 } };
    expect(masteryLevel(s, 'rapida')).toBe(3);
    expect(masteryBonus(s, 'rapida')).toBe(3 * SYNAPSE_CONSTANTS.masteryBonusPerLevel);
  });

  test('level caps at masteryMaxLevel even with uses >> 10', () => {
    const s: GameState = { ...createDefaultState(), mastery: { analitica: 99 } };
    expect(masteryUses(s, 'analitica')).toBe(99); // raw uses accumulate freely
    expect(masteryLevel(s, 'analitica')).toBe(SYNAPSE_CONSTANTS.masteryMaxLevel);
    expect(masteryBonus(s, 'analitica')).toBeCloseTo(SYNAPSE_CONSTANTS.masteryMaxLevel * SYNAPSE_CONSTANTS.masteryBonusPerLevel, 10);
  });

  test('max bonus is +5% (masteryMaxLevel × masteryBonusPerLevel)', () => {
    const s: GameState = { ...createDefaultState(), mastery: { rapida: 10 } };
    expect(masteryBonus(s, 'rapida')).toBeCloseTo(0.05, 10);
  });
});

describe('Mastery — XP gain multiplier (shard_proc_mastery)', () => {
  test('default state: identity ×1', () => {
    expect(masteryGainMult(createDefaultState())).toBe(1);
  });

  test('owning shard_proc_mastery returns the configured multiplier', () => {
    const s: GameState = { ...createDefaultState(), memoryShardUpgrades: ['shard_proc_mastery'] };
    expect(masteryGainMult(s)).toBeGreaterThan(1);
  });

  test('other shard upgrades do NOT change gain mult', () => {
    const s: GameState = { ...createDefaultState(), memoryShardUpgrades: ['shard_emo_pulse', 'shard_proc_flow', 'shard_epi_imprint'] };
    expect(masteryGainMult(s)).toBe(1);
  });
});

describe('Mastery — applyMasteryXpGain', () => {
  test('grants baseXp to valid id (no shard owned)', () => {
    const s = createDefaultState();
    const next = applyMasteryXpGain(s, 'hiperestimulacion', 1);
    expect(next['hiperestimulacion']).toBe(1);
  });

  test('applies shard_proc_mastery multiplier', () => {
    const s: GameState = { ...createDefaultState(), memoryShardUpgrades: ['shard_proc_mastery'] };
    const next = applyMasteryXpGain(s, 'hiperestimulacion', 1);
    expect(next['hiperestimulacion']).toBe(masteryGainMult(s));
  });

  test('accumulates across calls (fractional ok)', () => {
    let s = createDefaultState();
    for (let i = 0; i < 3; i++) {
      s = { ...s, mastery: applyMasteryXpGain(s, 'rapida', 1) };
    }
    expect(s.mastery['rapida']).toBe(3);
  });

  test('invalid ids return the original object (identity check)', () => {
    const s = createDefaultState();
    const next = applyMasteryXpGain(s, 'not_a_real_id', 1);
    expect(next).toBe(s.mastery);
  });

  test('zero or negative baseXp is a no-op', () => {
    const s = createDefaultState();
    expect(applyMasteryXpGain(s, 'rapida', 0)).toBe(s.mastery);
    expect(applyMasteryXpGain(s, 'rapida', -5)).toBe(s.mastery);
  });

  test('shard upgrades (excluded from tracking) are no-ops even if passed as id', () => {
    const s = createDefaultState();
    expect(applyMasteryXpGain(s, 'shard_proc_mastery', 10)).toBe(s.mastery);
  });
});

describe('Mastery — level-up detection (MASTERY-4 analytics)', () => {
  test('no level-up when uses accumulate within same integer level', () => {
    const before: GameState = { ...createDefaultState(), mastery: { rapida: 3.2 } };
    const after: GameState = { ...before, mastery: { rapida: 3.9 } };
    expect(masteryLevelUps(before, after)).toEqual([]);
  });

  test('detects level-up when crossing an integer boundary', () => {
    const before: GameState = { ...createDefaultState(), mastery: { rapida: 3.9 } };
    const after: GameState = { ...before, mastery: { rapida: 4.0 } };
    expect(masteryLevelUps(before, after)).toEqual([{ id: 'rapida', newLevel: 4 }]);
  });

  test('caps newLevel at masteryMaxLevel even if raw uses go higher', () => {
    const before: GameState = { ...createDefaultState(), mastery: { rapida: 9.9 } };
    const after: GameState = { ...before, mastery: { rapida: 50 } };
    expect(masteryLevelUps(before, after)).toEqual([{ id: 'rapida', newLevel: SYNAPSE_CONSTANTS.masteryMaxLevel }]);
  });

  test('no duplicate level-up reported once capped (10 → 10 stays flat)', () => {
    const before: GameState = { ...createDefaultState(), mastery: { rapida: 10 } };
    const after: GameState = { ...before, mastery: { rapida: 99 } };
    expect(masteryLevelUps(before, after)).toEqual([]);
  });

  test('multiple entities level up in the same tick', () => {
    const before: GameState = { ...createDefaultState(), mastery: { rapida: 2.9, analitica: 0.5 } };
    const after: GameState = { ...before, mastery: { rapida: 3, analitica: 1 } };
    const ups = masteryLevelUps(before, after);
    expect(ups.length).toBe(2);
    expect(ups.map((u) => u.id).sort()).toEqual(['analitica', 'rapida']);
  });
});
