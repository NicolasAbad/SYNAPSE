// Tests for src/engine/insight.ts (Sprint 3 Phase 5).
// Covers GDD §6: level selection by prestigeCount, tiered fire thresholds,
// FOCUS-2 no-reset, Concentración Profunda +5s duration, pendingHyperfocusBonus
// consumption (level+1 for <3, duration×1.5 for =3), MENTAL-2 buffer push.

import { describe, expect, test } from 'vitest';
import {
  activateInsight,
  getInsightFireThreshold,
  getInsightLevel,
  shouldActivateInsight,
  tryActivateInsight,
  type InsightLevel,
} from '../../src/engine/insight';
import { createDefaultState } from '../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';
import type { GameState } from '../../src/types/GameState';
import type { UpgradeState } from '../../src/types';

function withUpgrades(state: GameState, ids: string[]): GameState {
  const upgrades: UpgradeState[] = ids.map((id) => ({ id, purchased: true, purchasedAt: 0 }));
  return { ...state, upgrades };
}

describe('getInsightLevel — tier boundaries per GDD §6', () => {
  test('P0-P9 → level 1 (Claro)', () => {
    for (const p of [0, 1, 5, 9]) expect(getInsightLevel(p)).toBe(1);
  });
  test('P10-P18 → level 2 (Profundo)', () => {
    for (const p of [10, 15, 18]) expect(getInsightLevel(p)).toBe(2);
  });
  test('P19+ → level 3 (Trascendente)', () => {
    for (const p of [19, 25, 26]) expect(getInsightLevel(p)).toBe(3);
  });
});

describe('getInsightFireThreshold — 1.0 / 2.0 / 3.0 per level', () => {
  test('matches SYNAPSE_CONSTANTS.insightThresholds', () => {
    expect(getInsightFireThreshold(1)).toBe(1.0);
    expect(getInsightFireThreshold(2)).toBe(2.0);
    expect(getInsightFireThreshold(3)).toBe(3.0);
  });
});

describe('shouldActivateInsight — prerequisites', () => {
  test('Returns false if Insight already active', () => {
    const state = { ...createDefaultState(), focusBar: 2.0, insightActive: true };
    expect(shouldActivateInsight(state)).toBe(false);
  });
  test('Returns false if focusBar below level threshold', () => {
    expect(shouldActivateInsight({ ...createDefaultState(), focusBar: 0.99 })).toBe(false);
    expect(shouldActivateInsight({ ...createDefaultState(), focusBar: 1.0, prestigeCount: 10 })).toBe(false); // level 2 needs 2.0
  });
  test('Returns true at exact threshold for each tier', () => {
    expect(shouldActivateInsight({ ...createDefaultState(), focusBar: 1.0 })).toBe(true);
    expect(shouldActivateInsight({ ...createDefaultState(), focusBar: 2.0, prestigeCount: 10 })).toBe(true);
    expect(shouldActivateInsight({ ...createDefaultState(), focusBar: 3.0, prestigeCount: 19 })).toBe(true);
  });
  test('Returns true when focusBar overflows threshold (pre-charge)', () => {
    expect(shouldActivateInsight({ ...createDefaultState(), focusBar: 1.5 })).toBe(true);
    expect(shouldActivateInsight({ ...createDefaultState(), focusBar: 2.5, prestigeCount: 10 })).toBe(true);
  });
});

describe('activateInsight — level 1 (P0-P9)', () => {
  test('Sets insightActive + multiplier ×3.0 + endTime at +15s', () => {
    const state: GameState = { ...createDefaultState(), focusBar: 1.0 };
    const updates = activateInsight(state, 1000);
    expect(updates.insightActive).toBe(true);
    expect(updates.insightMultiplier).toBe(3.0);
    expect(updates.insightEndTime).toBe(1000 + 15_000);
  });
  test('Increments lifetimeInsights', () => {
    const state: GameState = { ...createDefaultState(), focusBar: 1.0, lifetimeInsights: 5 };
    const updates = activateInsight(state, 1000);
    expect(updates.lifetimeInsights).toBe(6);
  });
  test('Pushes to insightTimestamps circular buffer (size 3)', () => {
    const state: GameState = { ...createDefaultState(), focusBar: 1.0, insightTimestamps: [100, 200] };
    const updates = activateInsight(state, 1000);
    expect(updates.insightTimestamps).toEqual([100, 200, 1000]);
  });
  test('Buffer drops oldest when at capacity', () => {
    const state: GameState = { ...createDefaultState(), focusBar: 1.0, insightTimestamps: [100, 200, 300] };
    const updates = activateInsight(state, 1000);
    expect(updates.insightTimestamps).toEqual([200, 300, 1000]);
  });
  test('FOCUS-2: does NOT reset focusBar in the update partial', () => {
    const state: GameState = { ...createDefaultState(), focusBar: 1.5 };
    const updates = activateInsight(state, 1000);
    expect(updates.focusBar).toBeUndefined();
  });
});

describe('activateInsight — level 2 (P10-P18) and 3 (P19+)', () => {
  test('Level 2: mult ×8.0, duration 12s', () => {
    const state: GameState = { ...createDefaultState(), focusBar: 2.0, prestigeCount: 10 };
    const updates = activateInsight(state, 1000);
    expect(updates.insightMultiplier).toBe(8.0);
    expect(updates.insightEndTime).toBe(1000 + 12_000);
  });
  test('Level 3: mult ×18.0, duration 8s', () => {
    const state: GameState = { ...createDefaultState(), focusBar: 3.0, prestigeCount: 19 };
    const updates = activateInsight(state, 1000);
    expect(updates.insightMultiplier).toBe(18.0);
    expect(updates.insightEndTime).toBe(1000 + 8_000);
  });
});

describe('activateInsight — Concentración Profunda extends duration +5s', () => {
  test('Level 1 with Concentración Profunda: 15+5 = 20s', () => {
    const state = withUpgrades({ ...createDefaultState(), focusBar: 1.0, prestigeCount: 4 }, ['concentracion_profunda']);
    const updates = activateInsight(state, 1000);
    expect(updates.insightEndTime).toBe(1000 + 20_000);
  });
  test('Level 3 with Concentración Profunda: 8+5 = 13s', () => {
    const state = withUpgrades({ ...createDefaultState(), focusBar: 3.0, prestigeCount: 19 }, ['concentracion_profunda']);
    const updates = activateInsight(state, 1000);
    expect(updates.insightEndTime).toBe(1000 + 13_000);
  });
});

describe('activateInsight — Hyperfocus bonus consumption (MENTAL-5 §17)', () => {
  test('Level 1 + pendingHyperfocusBonus → fires at level 2 (×8), clears flag', () => {
    const state: GameState = { ...createDefaultState(), focusBar: 1.0, pendingHyperfocusBonus: true };
    const updates = activateInsight(state, 1000);
    expect(updates.insightMultiplier).toBe(8.0); // bumped from level 1
    expect(updates.insightEndTime).toBe(1000 + 12_000); // level-2 duration
    expect(updates.pendingHyperfocusBonus).toBe(false);
  });
  test('Level 2 + bonus → fires at level 3 (×18, 8s)', () => {
    const state: GameState = { ...createDefaultState(), focusBar: 2.0, prestigeCount: 10, pendingHyperfocusBonus: true };
    const updates = activateInsight(state, 1000);
    expect(updates.insightMultiplier).toBe(18.0);
    expect(updates.insightEndTime).toBe(1000 + 8_000);
    expect(updates.pendingHyperfocusBonus).toBe(false);
  });
  test('Level 3 + bonus → stays at level 3 but duration ×1.5 = 12s, clears flag', () => {
    const state: GameState = { ...createDefaultState(), focusBar: 3.0, prestigeCount: 19, pendingHyperfocusBonus: true };
    const updates = activateInsight(state, 1000);
    expect(updates.insightMultiplier).toBe(18.0);
    expect(updates.insightEndTime).toBe(1000 + 12_000); // 8s × 1.5
    expect(updates.pendingHyperfocusBonus).toBe(false);
  });
  test('Level 3 + bonus + Concentración: (8+5)s × 1.5 = 19.5s', () => {
    const state = withUpgrades(
      { ...createDefaultState(), focusBar: 3.0, prestigeCount: 19, pendingHyperfocusBonus: true },
      ['concentracion_profunda'],
    );
    const updates = activateInsight(state, 1000);
    expect(updates.insightEndTime).toBe(1000 + 19_500);
  });
});

describe('tryActivateInsight — composite', () => {
  test('Returns empty partial when prereqs unmet', () => {
    const state = createDefaultState();
    const updates = tryActivateInsight(state, 1000);
    expect(updates).toEqual({});
  });
  test('Returns full activation partial when prereqs met', () => {
    const state: GameState = { ...createDefaultState(), focusBar: 1.0 };
    const updates = tryActivateInsight(state, 1000);
    expect(updates.insightActive).toBe(true);
  });
});

describe('GDD §6 invariants (cross-ref to SYNAPSE_CONSTANTS)', () => {
  test('insightMultiplier = [3.0, 8.0, 18.0]', () => {
    expect(SYNAPSE_CONSTANTS.insightMultiplier).toEqual([3.0, 8.0, 18.0]);
  });
  test('insightDuration = [15, 12, 8] seconds', () => {
    expect(SYNAPSE_CONSTANTS.insightDuration).toEqual([15, 12, 8]);
  });
  test('insightThresholds = [1.0, 2.0, 3.0]', () => {
    expect(SYNAPSE_CONSTANTS.insightThresholds).toEqual([1.0, 2.0, 3.0]);
  });
  test('Level-to-prestige boundaries: 10 and 19', () => {
    expect(SYNAPSE_CONSTANTS.insightLevel2MinPrestige).toBe(10);
    expect(SYNAPSE_CONSTANTS.insightLevel3MinPrestige).toBe(19);
  });
  test('Every InsightLevel is a valid index into the mult/duration arrays', () => {
    const levels: InsightLevel[] = [1, 2, 3];
    for (const l of levels) {
      expect(SYNAPSE_CONSTANTS.insightMultiplier[l - 1]).toBeGreaterThan(1);
      expect(SYNAPSE_CONSTANTS.insightDuration[l - 1]).toBeGreaterThan(0);
    }
  });
});
