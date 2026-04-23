// Tests for src/engine/precommits.ts + src/config/precommitGoals.ts.
// Sprint 7.5 Phase 7.5.4 §16.2 PRECOMMIT-1..5 + Mood-fail integration.

import { describe, expect, test } from 'vitest';
import { applyPrecommitResolution, streakPermanentMemoriaBonus } from '../../src/engine/precommits';
import { PRECOMMIT_GOALS, PRECOMMIT_GOALS_BY_ID, isPrecommitUnlocked } from '../../src/config/precommitGoals';
import { createDefaultState } from '../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';
import type { GameState } from '../../src/types/GameState';

function withActive(state: GameState, goalId: string): GameState {
  const def = PRECOMMIT_GOALS_BY_ID[goalId]!;
  return { ...state, activePrecommitment: { goalId, wager: def.wager } };
}

describe('precommitGoals — data integrity', () => {
  test('exactly 8 goals', () => {
    expect(PRECOMMIT_GOALS.length).toBe(8);
  });
  test('all wagers within [precommitMinWager, precommitMaxWager]', () => {
    for (const g of PRECOMMIT_GOALS) {
      expect(g.wager).toBeGreaterThanOrEqual(SYNAPSE_CONSTANTS.precommitMinWager);
      expect(g.wager).toBeLessThanOrEqual(SYNAPSE_CONSTANTS.precommitMaxWager);
    }
  });
  test('isPrecommitUnlocked false at P4, true at P5', () => {
    expect(isPrecommitUnlocked(4)).toBe(false);
    expect(isPrecommitUnlocked(5)).toBe(true);
  });
});

describe('precommit goals — eligibility checks (PRECOMMIT-5 lenient `<=`)', () => {
  test('pc_under_12min: 11:59.999 succeeds (lenient)', () => {
    const def = PRECOMMIT_GOALS_BY_ID['pc_under_12min']!;
    expect(def.isAchieved(createDefaultState(), 12 * 60_000 - 1)).toBe(true);
    expect(def.isAchieved(createDefaultState(), 12 * 60_000)).toBe(true);
    expect(def.isAchieved(createDefaultState(), 12 * 60_000 + 1)).toBe(false);
  });
  test('pc_under_8min: lenient threshold', () => {
    const def = PRECOMMIT_GOALS_BY_ID['pc_under_8min']!;
    expect(def.isAchieved(createDefaultState(), 8 * 60_000)).toBe(true);
    expect(def.isAchieved(createDefaultState(), 8 * 60_000 + 1)).toBe(false);
  });
  test('pc_no_discharge: cycleDischargesUsed === 0', () => {
    const def = PRECOMMIT_GOALS_BY_ID['pc_no_discharge']!;
    expect(def.isAchieved(createDefaultState(), 0)).toBe(true);
    expect(def.isAchieved({ ...createDefaultState(), cycleDischargesUsed: 1 }, 0)).toBe(false);
  });
  test('pc_five_cascades: cycleCascades >= 5', () => {
    const def = PRECOMMIT_GOALS_BY_ID['pc_five_cascades']!;
    expect(def.isAchieved({ ...createDefaultState(), cycleCascades: 4 }, 0)).toBe(false);
    expect(def.isAchieved({ ...createDefaultState(), cycleCascades: 5 }, 0)).toBe(true);
  });
  test('pc_20_neurons: 20+ neurons AND prestige < 3', () => {
    const def = PRECOMMIT_GOALS_BY_ID['pc_20_neurons']!;
    expect(def.isAchieved({ ...createDefaultState(), cycleNeuronsBought: 20 }, 0)).toBe(true);
    expect(def.isAchieved({ ...createDefaultState(), cycleNeuronsBought: 19 }, 0)).toBe(false);
    expect(def.isAchieved({ ...createDefaultState(), cycleNeuronsBought: 20, prestigeCount: 3 }, 0)).toBe(false);
  });
  test('pc_no_tap_idle: lastTapTimestamps empty', () => {
    const def = PRECOMMIT_GOALS_BY_ID['pc_no_tap_idle']!;
    expect(def.isAchieved(createDefaultState(), 0)).toBe(true);
    expect(def.isAchieved({ ...createDefaultState(), lastTapTimestamps: [100] }, 0)).toBe(false);
  });
  test('pc_max_focus_3x: 3+ insightTimestamps within cycle window', () => {
    const def = PRECOMMIT_GOALS_BY_ID['pc_max_focus_3x']!;
    const s: GameState = { ...createDefaultState(), cycleStartTimestamp: 100, insightTimestamps: [200, 300, 400] };
    expect(def.isAchieved(s, 0)).toBe(true);
    expect(def.isAchieved({ ...s, insightTimestamps: [200, 300] }, 0)).toBe(false);
  });
  test('pc_spontaneous_hunter: cyclePositiveSpontaneous >= 3', () => {
    const def = PRECOMMIT_GOALS_BY_ID['pc_spontaneous_hunter']!;
    expect(def.isAchieved({ ...createDefaultState(), cyclePositiveSpontaneous: 3 }, 0)).toBe(true);
    expect(def.isAchieved({ ...createDefaultState(), cyclePositiveSpontaneous: 2 }, 0)).toBe(false);
  });
});

describe('applyPrecommitResolution — outcomes', () => {
  test('no active → neutral baseline', () => {
    const r = applyPrecommitResolution(createDefaultState(), 0, 1000);
    expect(r.outcome).toBe('no_active');
    expect(r.memoryMultiplier).toBe(1.0);
    expect(r.sparksAwarded).toBe(0);
    expect(r.streakDelta).toBe(0);
    expect(r.diaryEntry).toBeNull();
  });
  test('unknown goal id → neutral with outcome=unknown_goal', () => {
    const s: GameState = { ...createDefaultState(), activePrecommitment: { goalId: 'fake', wager: 1 } };
    const r = applyPrecommitResolution(s, 0, 1000);
    expect(r.outcome).toBe('unknown_goal');
  });
  test('success: 2× memory mult + Sparks bonus + streak+1 + diary entry', () => {
    const s = withActive(createDefaultState(), 'pc_no_discharge'); // default cycleDischargesUsed=0 satisfies
    const r = applyPrecommitResolution(s, 0, 1000);
    expect(r.outcome).toBe('success');
    expect(r.memoryMultiplier).toBe(SYNAPSE_CONSTANTS.precommitSuccessMult);
    expect(r.sparksAwarded).toBe(5);
    expect(r.streakDelta).toBe(1);
    expect(r.diaryEntry?.type).toBe('precommit');
    expect(r.diaryEntry?.data.outcome).toBe('success');
  });
  test('fail (no Pass): -15% memory penalty + streak reset + Mood -15 + diary entry', () => {
    // pc_under_8min with cycleDurationMs > 8min fails. Default mood=30 → 30-15=15 (still above 0).
    const s = withActive({ ...createDefaultState(), precommitmentStreak: 3 }, 'pc_under_8min');
    const r = applyPrecommitResolution(s, 9 * 60_000, 1000);
    expect(r.outcome).toBe('fail');
    expect(r.memoryMultiplier).toBeCloseTo(1.0 - SYNAPSE_CONSTANTS.precommitFailurePenalty, 6);
    expect(r.sparksAwarded).toBe(0);
    expect(r.streakDelta).toBe(-3); // resets streak from 3 to 0
    expect(r.moodAfter).toBe(15);
    expect(r.diaryEntry?.data.outcome).toBe('fail');
    expect(r.diaryEntry?.data.passShielded).toBe(false);
  });
  test('fail with Genius Pass: 0% reward (no penalty), streak resets, NO Mood delta', () => {
    const s = withActive({ ...createDefaultState(), isSubscribed: true, precommitmentStreak: 2 }, 'pc_under_8min');
    const r = applyPrecommitResolution(s, 9 * 60_000, 1000);
    expect(r.outcome).toBe('fail');
    expect(r.memoryMultiplier).toBe(1.0); // Pass shield = neutral baseline (no penalty)
    expect(r.streakDelta).toBe(-2);
    expect(r.moodAfter).toBeUndefined();
    expect(r.diaryEntry?.data.passShielded).toBe(true);
  });
});

describe('streakPermanentMemoriaBonus — PRECOMMIT-3 5-streak bonus', () => {
  test('streak < 5 = 0 bonus', () => {
    expect(streakPermanentMemoriaBonus(0)).toBe(0);
    expect(streakPermanentMemoriaBonus(4)).toBe(0);
  });
  test('streak 5 = +1 bonus, streak 10 = +2, etc. (cumulative)', () => {
    expect(streakPermanentMemoriaBonus(5)).toBe(1);
    expect(streakPermanentMemoriaBonus(9)).toBe(1);
    expect(streakPermanentMemoriaBonus(10)).toBe(2);
    expect(streakPermanentMemoriaBonus(15)).toBe(3);
  });
});
