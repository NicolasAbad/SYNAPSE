// Sprint 7 Phase 7.3 — Mental States engine tests (GDD §17 + MENTAL-1..8).

import { describe, expect, test } from 'vitest';
import {
  checkMentalState,
  mentalStateProductionMult,
  consumePendingHyperfocusBonus,
  updateHyperfocusTracking,
  mentalStateDuration,
} from '../../src/engine/mentalStates';
import { createDefaultState } from '../../src/store/gameStore';
import type { GameState } from '../../src/types/GameState';

function fresh(overrides: Partial<GameState> = {}): GameState {
  const base = createDefaultState() as unknown as Record<string, unknown>;
  for (const k of ['activeTab', 'activeMindSubtab', 'undoToast', 'antiSpamActive', 'achievementToast']) delete base[k];
  return { ...(base as unknown as GameState), ...overrides };
}

describe('Eureka trigger (3 Insights in 2 min, priority 1)', () => {
  test('false with <3 insightTimestamps', () => {
    const s = fresh({ insightTimestamps: [0, 1000] });
    expect(checkMentalState(s, 5000)).not.toBe('eureka');
  });

  test('true when 3 insights occurred within 2 minutes', () => {
    const s = fresh({ insightTimestamps: [0, 60_000, 110_000] });
    expect(checkMentalState(s, 115_000)).toBe('eureka');
  });

  test('false when 3rd insight is outside 2 min window from 1st', () => {
    const s = fresh({ insightTimestamps: [0, 60_000, 121_000] });
    expect(checkMentalState(s, 121_000)).not.toBe('eureka');
  });
});

describe('Flow trigger (10+ taps in 15s, priority 2)', () => {
  test('false with 9 recent taps', () => {
    const taps = Array.from({ length: 9 }, (_, i) => 1000 + i * 1000);
    const s = fresh({ lastTapTimestamps: taps });
    expect(checkMentalState(s, 10_000)).not.toBe('flow');
  });

  test('true with 10 recent taps within 15s', () => {
    const taps = Array.from({ length: 10 }, (_, i) => 1000 + i * 1000);
    const s = fresh({ lastTapTimestamps: taps });
    expect(checkMentalState(s, 12_000)).toBe('flow');
  });

  test('false when taps are stale (>15s old)', () => {
    const taps = Array.from({ length: 10 }, (_, i) => i * 100);
    const s = fresh({ lastTapTimestamps: taps });
    expect(checkMentalState(s, 50_000)).not.toBe('flow');
  });
});

describe('Hyperfocus trigger (focus >50% for 30s, priority 3)', () => {
  test('false when focusAbove50Since is null', () => {
    const s = fresh({ focusAbove50Since: null });
    expect(checkMentalState(s, 30_001)).not.toBe('hyperfocus');
  });

  test('false when held <30s', () => {
    const s = fresh({ focusAbove50Since: 0, lastTapTimestamps: [], lastPurchaseTimestamp: 999_999 });
    expect(checkMentalState(s, 29_000)).not.toBe('hyperfocus');
  });

  test('true when held >=30s', () => {
    const s = fresh({
      focusAbove50Since: 0,
      lastTapTimestamps: Array.from({ length: 5 }, (_, i) => 25_000 + i * 100), // recent enough to NOT trigger Deep
      lastPurchaseTimestamp: 30_000,
    });
    expect(checkMentalState(s, 30_001)).toBe('hyperfocus');
  });
});

describe('Deep trigger (no taps 60s + ≥5 neurons, priority 4)', () => {
  test('false when <5 neurons', () => {
    const s = fresh({
      neurons: [{ type: 'basica', count: 4 }, { type: 'sensorial', count: 0 }, { type: 'piramidal', count: 0 }, { type: 'espejo', count: 0 }, { type: 'integradora', count: 0 }],
      lastTapTimestamps: [],
      lastPurchaseTimestamp: 200_000,
    });
    expect(checkMentalState(s, 200_000)).not.toBe('deep');
  });

  test('true with ≥5 neurons + no taps for 60s+', () => {
    const s = fresh({
      neurons: [{ type: 'basica', count: 5 }, { type: 'sensorial', count: 0 }, { type: 'piramidal', count: 0 }, { type: 'espejo', count: 0 }, { type: 'integradora', count: 0 }],
      lastTapTimestamps: [10_000],
      lastPurchaseTimestamp: 200_000,
    });
    expect(checkMentalState(s, 75_000)).toBe('deep');
  });

  test('false when recent tap', () => {
    const s = fresh({
      neurons: [{ type: 'basica', count: 5 }, { type: 'sensorial', count: 0 }, { type: 'piramidal', count: 0 }, { type: 'espejo', count: 0 }, { type: 'integradora', count: 0 }],
      lastTapTimestamps: [70_000],
      lastPurchaseTimestamp: 200_000,
    });
    expect(checkMentalState(s, 75_000)).not.toBe('deep');
  });
});

describe('Dormancy trigger (no taps no buys 120s, priority 5)', () => {
  test('true when both idle for 120s+ (with prior session activity)', () => {
    // session-activity guard: lastPurchaseTimestamp=1 satisfies "session existed"
    // without triggering recent-purchase exclusion (1ms < 120s window from now=130_000)
    const s = fresh({ lastTapTimestamps: [], lastPurchaseTimestamp: 1 });
    expect(checkMentalState(s, 130_000)).toBe('dormancy');
  });

  test('false when recent purchase', () => {
    const s = fresh({ lastTapTimestamps: [], lastPurchaseTimestamp: 100_000 });
    expect(checkMentalState(s, 130_000)).not.toBe('dormancy');
  });
});

describe('Priority hierarchy (MENTAL-1: Eureka > Flow > Hyperfocus > Deep > Dormancy)', () => {
  test('Eureka beats Flow when both would trigger', () => {
    // Both: 3 insights AND 10 recent taps
    const s = fresh({
      insightTimestamps: [0, 60_000, 110_000],
      lastTapTimestamps: Array.from({ length: 10 }, (_, i) => 100_000 + i * 1000),
    });
    expect(checkMentalState(s, 115_000)).toBe('eureka');
  });

  test('Flow beats Hyperfocus when both would trigger', () => {
    const s = fresh({
      focusAbove50Since: 0,
      lastTapTimestamps: Array.from({ length: 10 }, (_, i) => 25_000 + i * 100),
    });
    expect(checkMentalState(s, 30_500)).toBe('flow');
  });

  test('Hyperfocus beats Deep when both would trigger', () => {
    const s = fresh({
      focusAbove50Since: 0,
      neurons: [{ type: 'basica', count: 5 }, { type: 'sensorial', count: 0 }, { type: 'piramidal', count: 0 }, { type: 'espejo', count: 0 }, { type: 'integradora', count: 0 }],
      lastTapTimestamps: [],
      lastPurchaseTimestamp: 999_999,
    });
    expect(checkMentalState(s, 35_000)).toBe('hyperfocus');
  });

  test('Deep beats Dormancy when both would trigger', () => {
    // Deep needs ≥5 neurons; Dormancy doesn't care
    const s = fresh({
      neurons: [{ type: 'basica', count: 5 }, { type: 'sensorial', count: 0 }, { type: 'piramidal', count: 0 }, { type: 'espejo', count: 0 }, { type: 'integradora', count: 0 }],
      lastTapTimestamps: [],
      lastPurchaseTimestamp: 1, // session-activity guard
    });
    expect(checkMentalState(s, 130_000)).toBe('deep');
  });
});

describe('mentalStateProductionMult — effect values per §17', () => {
  test('Eureka × all production = 1.5', () => {
    const s = fresh({
      insightTimestamps: [0, 60_000, 110_000],
    });
    expect(mentalStateProductionMult(s, 115_000)).toBe(1.5);
  });

  test('Flow × tap production = 1.2', () => {
    const taps = Array.from({ length: 10 }, (_, i) => 1000 + i * 1000);
    const s = fresh({ lastTapTimestamps: taps });
    expect(mentalStateProductionMult(s, 12_000)).toBe(1.2);
  });

  test('Deep × passive production = 1.3', () => {
    const s = fresh({
      neurons: [{ type: 'basica', count: 5 }, { type: 'sensorial', count: 0 }, { type: 'piramidal', count: 0 }, { type: 'espejo', count: 0 }, { type: 'integradora', count: 0 }],
      lastTapTimestamps: [10_000],
      lastPurchaseTimestamp: 200_000,
    });
    expect(mentalStateProductionMult(s, 75_000)).toBe(1.3);
  });

  test('Dormancy bonus enhanced at high mood (MENTAL-8): 1.30 vs 1.15 base', () => {
    // mood field added by Sprint 7.5; tests pass it via type cast to verify
    // forwards-compat behavior.
    const baseSetup = fresh({ lastTapTimestamps: [], lastPurchaseTimestamp: 1 });
    const withMood = (mood: number) => ({ ...baseSetup, mood } as unknown as Parameters<typeof mentalStateProductionMult>[0]);
    expect(mentalStateProductionMult(withMood(50), 130_000)).toBe(1.15);
    expect(mentalStateProductionMult(withMood(60), 130_000)).toBe(1.30);
    expect(mentalStateProductionMult(withMood(80), 130_000)).toBe(1.30);
  });

  test('No state active → 1.0 mult (identity)', () => {
    const s = fresh();
    expect(mentalStateProductionMult(s, 0)).toBe(1);
  });

  test('Hyperfocus does NOT modify production directly (boosts NEXT Insight)', () => {
    const s = fresh({
      focusAbove50Since: 0,
      lastTapTimestamps: Array.from({ length: 5 }, (_, i) => 25_000 + i * 100),
      lastPurchaseTimestamp: 30_000,
    });
    expect(mentalStateProductionMult(s, 35_000)).toBe(1);
  });
});

describe('MENTAL-5: pendingHyperfocusBonus consumption', () => {
  test('no bonus pending → returns level unchanged', () => {
    const r = consumePendingHyperfocusBonus({ pendingHyperfocusBonus: false }, 1);
    expect(r.effectiveLevel).toBe(1);
    expect(r.consumed).toBe(false);
    expect(r.durationBoost).toBe(0);
  });

  test('level 1 → bumps to 2 with bonus', () => {
    const r = consumePendingHyperfocusBonus({ pendingHyperfocusBonus: true }, 1);
    expect(r.effectiveLevel).toBe(2);
    expect(r.consumed).toBe(true);
    expect(r.durationBoost).toBe(0);
  });

  test('level 2 → bumps to 3 with bonus', () => {
    const r = consumePendingHyperfocusBonus({ pendingHyperfocusBonus: true }, 2);
    expect(r.effectiveLevel).toBe(3);
    expect(r.consumed).toBe(true);
  });

  test('level 3 + bonus → stays at 3, durationBoost = 0.5 (MENTAL-4 cap rule)', () => {
    const r = consumePendingHyperfocusBonus({ pendingHyperfocusBonus: true }, 3);
    expect(r.effectiveLevel).toBe(3);
    expect(r.consumed).toBe(true);
    expect(r.durationBoost).toBe(0.5);
  });
});

describe('updateHyperfocusTracking — focus-above-50 timestamp', () => {
  test('focus > 0.5 starts tracking', () => {
    const r = updateHyperfocusTracking({ focusBar: 0.6, focusAbove50Since: null }, 5000);
    expect(r.focusAbove50Since).toBe(5000);
  });

  test('focus stays > 0.5 → no change', () => {
    const r = updateHyperfocusTracking({ focusBar: 0.7, focusAbove50Since: 1000 }, 5000);
    expect(r).toEqual({});
  });

  test('focus drops to 0.5 (boundary) — resets tracking', () => {
    const r = updateHyperfocusTracking({ focusBar: 0.5, focusAbove50Since: 1000 }, 5000);
    expect(r.focusAbove50Since).toBe(null);
  });

  test('focus stays <= 0.5 — no change when null', () => {
    const r = updateHyperfocusTracking({ focusBar: 0.3, focusAbove50Since: null }, 5000);
    expect(r).toEqual({});
  });
});

describe('mentalStateDuration — §17 duration table', () => {
  test('Flow = 20s', () => {
    expect(mentalStateDuration('flow')).toBe(20_000);
  });
  test('Deep = 90s', () => {
    expect(mentalStateDuration('deep')).toBe(90_000);
  });
  test('Eureka = 30s', () => {
    expect(mentalStateDuration('eureka')).toBe(30_000);
  });
  test('Dormancy = 5min', () => {
    expect(mentalStateDuration('dormancy')).toBe(300_000);
  });
  test('Hyperfocus = MAX_SAFE_INTEGER (consumed by Insight, not time)', () => {
    expect(mentalStateDuration('hyperfocus')).toBe(Number.MAX_SAFE_INTEGER);
  });
});
