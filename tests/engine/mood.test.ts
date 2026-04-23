// Tests for src/engine/mood.ts — Sprint 7.5 Phase 7.5.3 §16.3 Sistema Límbico.
//
// Coverage:
//   - Tier resolver (default Calm, climbs Engaged/Elevated/Euphoric)
//   - lim_elevation shifts Engaged→Elevated boundary 60→55
//   - Production mult per tier; lim_euphoric_echo bumps top tier to 1.40
//   - Focus fill mult, max charges bonus, insight potential bonus
//   - applyMoodEvent: cascade/prestige/fragment/RP deltas, scaling, floors, caps
//   - shard_emo_deep ±50% scaling (additive per MOOD-4)
//   - lim_resilience floor 25, Genius Pass floor 40

import { describe, expect, test } from 'vitest';
import {
  moodTier,
  effectiveMoodTier,
  moodProductionMult,
  moodFocusFillMult,
  moodMaxChargesBonus,
  moodInsightPotentialBonus,
  applyMoodEvent,
  averageMoodOverWindow,
} from '../../src/engine/mood';
import { createDefaultState } from '../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';
import type { GameState } from '../../src/types/GameState';
import type { UpgradeState } from '../../src/types';

function withLim(state: GameState, ids: string[]): GameState {
  const upgrades: UpgradeState[] = ids.map((id) => ({ id, purchased: true, purchasedAt: 0 }));
  return { ...state, upgrades };
}
function withMood(state: GameState, mood: number): GameState {
  return { ...state, mood };
}

describe('mood — tier resolver', () => {
  test('default state (mood=30) is Calm tier (1)', () => {
    expect(moodTier(createDefaultState())).toBe(1);
  });
  test('mood 0 → Numb (0)', () => {
    expect(moodTier(withMood(createDefaultState(), 0))).toBe(0);
  });
  test('mood 19 → Numb (0); 20 → Calm (1)', () => {
    expect(moodTier(withMood(createDefaultState(), 19))).toBe(0);
    expect(moodTier(withMood(createDefaultState(), 20))).toBe(1);
  });
  test('mood 50 → Engaged (2)', () => {
    expect(moodTier(withMood(createDefaultState(), 50))).toBe(2);
  });
  test('mood 79 → Elevated (3); 80 → Euphoric (4)', () => {
    expect(moodTier(withMood(createDefaultState(), 79))).toBe(3);
    expect(moodTier(withMood(createDefaultState(), 80))).toBe(4);
  });
});

describe('mood — lim_elevation shifts Engaged→Elevated boundary 60 → 55', () => {
  test('without upgrade: mood 58 = Engaged (2); 60 = Elevated (3)', () => {
    expect(effectiveMoodTier(withMood(createDefaultState(), 58))).toBe(2);
    expect(effectiveMoodTier(withMood(createDefaultState(), 60))).toBe(3);
  });
  test('with lim_elevation: mood 55 = Elevated (3) (was 2 without)', () => {
    const s = withLim(withMood(createDefaultState(), 55), ['lim_elevation']);
    expect(effectiveMoodTier(s)).toBe(3);
    expect(effectiveMoodTier(withMood(createDefaultState(), 55))).toBe(2);
  });
});

describe('mood — production multiplier per tier', () => {
  test('default state mult = 1.00 (Calm)', () => {
    expect(moodProductionMult(createDefaultState())).toBe(1.00);
  });
  test('Numb = 0.90', () => {
    expect(moodProductionMult(withMood(createDefaultState(), 10))).toBe(0.90);
  });
  test('Engaged = 1.05', () => {
    expect(moodProductionMult(withMood(createDefaultState(), 50))).toBe(1.05);
  });
  test('Elevated = 1.15', () => {
    expect(moodProductionMult(withMood(createDefaultState(), 70))).toBe(1.15);
  });
  test('Euphoric = 1.30', () => {
    expect(moodProductionMult(withMood(createDefaultState(), 95))).toBe(1.30);
  });
  test('lim_euphoric_echo bumps Euphoric to 1.40', () => {
    const s = withLim(withMood(createDefaultState(), 95), ['lim_euphoric_echo']);
    expect(moodProductionMult(s)).toBe(1.40);
  });
  test('lim_euphoric_echo does NOT affect lower tiers', () => {
    const s = withLim(withMood(createDefaultState(), 50), ['lim_euphoric_echo']);
    expect(moodProductionMult(s)).toBe(1.05);
  });
});

describe('mood — focus, charges, insight bonuses', () => {
  test('focus fill mult = 1.0 below Engaged, 1.10 Engaged+', () => {
    expect(moodFocusFillMult(createDefaultState())).toBe(1.0); // Calm
    expect(moodFocusFillMult(withMood(createDefaultState(), 50))).toBe(1.10); // Engaged
    expect(moodFocusFillMult(withMood(createDefaultState(), 70))).toBe(1.10); // Elevated
  });
  test('max charges +0 below Elevated, +1 Elevated/Euphoric', () => {
    expect(moodMaxChargesBonus(createDefaultState())).toBe(0);
    expect(moodMaxChargesBonus(withMood(createDefaultState(), 50))).toBe(0);
    expect(moodMaxChargesBonus(withMood(createDefaultState(), 70))).toBe(1);
    expect(moodMaxChargesBonus(withMood(createDefaultState(), 95))).toBe(1);
  });
  test('insight potential +1 only at Euphoric', () => {
    expect(moodInsightPotentialBonus(createDefaultState())).toBe(0);
    expect(moodInsightPotentialBonus(withMood(createDefaultState(), 70))).toBe(0);
    expect(moodInsightPotentialBonus(withMood(createDefaultState(), 95))).toBe(1);
  });
});

describe('mood — applyMoodEvent deltas', () => {
  test('cascade adds +5', () => {
    const next = applyMoodEvent(createDefaultState(), 'cascade', 1000);
    expect(next.mood).toBe(35); // 30 + 5
    expect(next.moodHistory.length).toBe(1);
    expect(next.moodHistory[0]).toEqual({ timestamp: 1000, mood: 35 });
  });
  test('prestige adds +10', () => {
    const next = applyMoodEvent(createDefaultState(), 'prestige', 1000);
    expect(next.mood).toBe(40);
  });
  test('fragment_read adds +3', () => {
    const next = applyMoodEvent(createDefaultState(), 'fragment_read', 1000);
    expect(next.mood).toBe(33);
  });
  test('resonant_pattern adds +15', () => {
    const next = applyMoodEvent(createDefaultState(), 'resonant_pattern', 1000);
    expect(next.mood).toBe(45);
  });
  test('precommit_fail subtracts 15', () => {
    const s = withMood(createDefaultState(), 50);
    const next = applyMoodEvent(s, 'precommit_fail', 1000);
    expect(next.mood).toBe(35);
  });
  test('floored at 0', () => {
    const s = withMood(createDefaultState(), 5);
    const next = applyMoodEvent(s, 'precommit_fail', 1000);
    expect(next.mood).toBe(0);
  });
  test('capped at 100 (moodMaxValue)', () => {
    const s = withMood(createDefaultState(), 95);
    const next = applyMoodEvent(s, 'resonant_pattern', 1000);
    expect(next.mood).toBe(SYNAPSE_CONSTANTS.moodMaxValue);
  });
});

describe('mood — floors (lim_resilience + Genius Pass)', () => {
  test('lim_resilience floors mood at 25 (anti-despair)', () => {
    const s = withLim(withMood(createDefaultState(), 30), ['lim_resilience']);
    const next = applyMoodEvent(s, 'precommit_fail', 1000);
    expect(next.mood).toBe(25);
  });
  test('Genius Pass floors mood at 40 (overrides lim_resilience when higher)', () => {
    const s = { ...withMood(createDefaultState(), 50), isSubscribed: true };
    const next = applyMoodEvent(s, 'precommit_fail', 1000);
    expect(next.mood).toBe(40);
  });
});

describe('mood — shard_emo_deep MOOD-4 scaling', () => {
  test('without shard: Cascade = +5', () => {
    expect(applyMoodEvent(createDefaultState(), 'cascade', 1000).mood).toBe(35);
  });
  test('with shard_emo_deep: Cascade ×1.5 → +7.5 → 37.5 → floored display 37 but raw value 37.5', () => {
    const s = { ...createDefaultState(), memoryShardUpgrades: ['shard_emo_deep'] };
    const next = applyMoodEvent(s, 'cascade', 1000);
    expect(next.mood).toBe(37.5);
  });
});

describe('mood — lim_empathic_spark adds +5 to Cascade specifically', () => {
  test('Cascade with lim_empathic_spark = +5 base + +5 = +10', () => {
    const s = withLim(createDefaultState(), ['lim_empathic_spark']);
    const next = applyMoodEvent(s, 'cascade', 1000);
    expect(next.mood).toBe(40); // 30 + 10
  });
  test('lim_empathic_spark does NOT affect non-cascade events', () => {
    const s = withLim(createDefaultState(), ['lim_empathic_spark']);
    const next = applyMoodEvent(s, 'prestige', 1000);
    expect(next.mood).toBe(40); // 30 + 10 (just prestige base)
  });
});

describe('mood — moodHistory circular buffer', () => {
  test('appends a sample on each event', () => {
    let s = createDefaultState();
    for (let i = 0; i < 3; i++) {
      const u = applyMoodEvent(s, 'cascade', 1000 + i);
      s = { ...s, mood: u.mood, moodHistory: u.moodHistory };
    }
    expect(s.moodHistory.length).toBe(3);
  });
  test('caps at 48 samples', () => {
    let s = createDefaultState();
    for (let i = 0; i < 60; i++) {
      const u = applyMoodEvent(s, 'cascade', 1000 + i);
      s = { ...s, mood: u.mood, moodHistory: u.moodHistory };
    }
    expect(s.moodHistory.length).toBe(48);
  });
});

describe('mood — averageMoodOverWindow (offline-aware helper for Sprint 8a)', () => {
  test('returns current mood when buffer is empty', () => {
    const s = withMood(createDefaultState(), 65);
    expect(averageMoodOverWindow(s, 0)).toBe(65);
  });
  test('averages samples in the window', () => {
    const s: GameState = { ...createDefaultState(), moodHistory: [
      { timestamp: 100, mood: 50 },
      { timestamp: 200, mood: 60 },
      { timestamp: 300, mood: 70 },
    ] };
    expect(averageMoodOverWindow(s, 0)).toBe(60);
  });
  test('filters samples outside the window', () => {
    const s: GameState = { ...createDefaultState(), moodHistory: [
      { timestamp: 100, mood: 50 },
      { timestamp: 200, mood: 60 },
      { timestamp: 300, mood: 70 },
    ], mood: 99 };
    // Only samples >= timestamp 250.
    expect(averageMoodOverWindow(s, 250)).toBe(70);
  });
});
