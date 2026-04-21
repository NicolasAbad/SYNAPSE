// Tests for src/store/tap.ts (Sprint 3 Phase 4).
// Covers: TAP-2 formula, Potencial Sináptico replacement, Dopamina mult,
// Sinestesia Mutation mult, anti-spam penalty, focus fill + Mielina, circular
// buffer push/drop, FOCUS-2 (no reset on Insight activation — tests do not
// apply focus cap here; Phase 5 adds auto-Insight crossing).

import { describe, expect, test } from 'vitest';
import { applyTap, computeFocusFillPerTap, computeTapThought } from '../../src/store/tap';
import { createDefaultState } from '../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';
import type { GameState } from '../../src/types/GameState';
import type { UpgradeState } from '../../src/types';

function withUpgrades(state: GameState, ids: string[]): GameState {
  const upgrades: UpgradeState[] = ids.map((id) => ({ id, purchased: true, purchasedAt: 0 }));
  return { ...state, upgrades };
}

describe('computeTapThought — TAP-2 base formula (GDD §6)', () => {
  test('P0 no upgrades, effectivePPS=0 → hits min floor (1)', () => {
    const state = createDefaultState(); // effectivePPS=0 until tick recalcs
    expect(computeTapThought(state, false)).toBe(1);
  });

  test('P0 no upgrades, effectivePPS=0.5 (1 Básica) → still hits floor (0.5×0.05 = 0.025 < 1)', () => {
    const state = { ...createDefaultState(), effectiveProductionPerSecond: 0.5 };
    expect(computeTapThought(state, false)).toBe(1);
  });

  test('effectivePPS=100 × baseTapThoughtPct=0.05 = 5 thoughts (above floor)', () => {
    const state = { ...createDefaultState(), effectiveProductionPerSecond: 100 };
    expect(computeTapThought(state, false)).toBeCloseTo(5, 6);
  });
});

describe('computeTapThought — Potencial Sináptico replaces baseTapThoughtPct', () => {
  test('owned Potencial → tapPct becomes 0.10 (REPLACES, not additive)', () => {
    const state = withUpgrades({ ...createDefaultState(), effectiveProductionPerSecond: 100 }, ['potencial_sinaptico']);
    expect(computeTapThought(state, false)).toBeCloseTo(10, 6); // 100 × 0.10
  });
  test('Potencial at effectivePPS=5 → max(1, 5×0.10)=1 (still floor)', () => {
    const state = withUpgrades({ ...createDefaultState(), effectiveProductionPerSecond: 5 }, ['potencial_sinaptico']);
    expect(computeTapThought(state, false)).toBe(1);
  });
});

describe('computeTapThought — Dopamina ×1.5 final mult', () => {
  test('Dopamina owned: tapThought × 1.5', () => {
    const state = withUpgrades({ ...createDefaultState(), effectiveProductionPerSecond: 100 }, ['dopamina']);
    expect(computeTapThought(state, false)).toBeCloseTo(7.5, 6); // 5 × 1.5
  });
  test('Dopamina applied AFTER Potencial replacement', () => {
    const state = withUpgrades({ ...createDefaultState(), effectiveProductionPerSecond: 100 }, ['potencial_sinaptico', 'dopamina']);
    expect(computeTapThought(state, false)).toBeCloseTo(15, 6); // 10 × 1.5
  });
  test('Dopamina applied to floor result', () => {
    const state = withUpgrades({ ...createDefaultState(), effectiveProductionPerSecond: 0 }, ['dopamina']);
    expect(computeTapThought(state, false)).toBeCloseTo(1.5, 6); // 1 × 1.5
  });
});

describe('computeTapThought — Sinestesia Mutation ×0.4 (Sprint 5 hook, Phase 4 defensive)', () => {
  test('currentMutation.id=sinestesia: tapThought × 0.4', () => {
    const state = { ...createDefaultState(), effectiveProductionPerSecond: 100, currentMutation: { id: 'sinestesia' } };
    expect(computeTapThought(state, false)).toBeCloseTo(2, 6); // 5 × 0.4
  });
  test('No Mutation active → no effect', () => {
    const state = { ...createDefaultState(), effectiveProductionPerSecond: 100, currentMutation: null };
    expect(computeTapThought(state, false)).toBeCloseTo(5, 6);
  });
});

describe('computeTapThought — TAP-1 anti-spam penalty ×0.10', () => {
  test('antiSpamActive=true → tapThought × 0.10', () => {
    const state = { ...createDefaultState(), effectiveProductionPerSecond: 100 };
    expect(computeTapThought(state, true)).toBeCloseTo(0.5, 6); // 5 × 0.10
  });
  test('Anti-spam applies AFTER all other multipliers', () => {
    const state = withUpgrades(
      { ...createDefaultState(), effectiveProductionPerSecond: 100, currentMutation: { id: 'sinestesia' } },
      ['potencial_sinaptico', 'dopamina'],
    );
    // 10 (Potencial) × 1.5 (Dopamina) × 0.4 (Sinestesia) × 0.10 (anti-spam) = 0.6
    expect(computeTapThought(state, true)).toBeCloseTo(0.6, 6);
  });
});

describe('computeFocusFillPerTap — state.focusFillRate + Mielina add', () => {
  test('default: matches focusFillPerTap constant (0.01)', () => {
    const state = createDefaultState();
    expect(computeFocusFillPerTap(state)).toBeCloseTo(SYNAPSE_CONSTANTS.focusFillPerTap, 6);
  });
  test('Mielina owned: adds +0.02 (order-independent)', () => {
    const state = withUpgrades(createDefaultState(), ['mielina']);
    expect(computeFocusFillPerTap(state)).toBeCloseTo(0.03, 6); // 0.01 + 0.02
  });
  test('Concentración Profunda already baked into focusFillRate (Phase 3 buy action)', () => {
    // Simulate state post-Concentración buy: focusFillRate = 0.01 × 2 = 0.02
    const state = { ...createDefaultState(), focusFillRate: 0.02 };
    expect(computeFocusFillPerTap(state)).toBeCloseTo(0.02, 6);
  });
  test('Concentración + Mielina stack: 0.02 (CP-affected rate) + 0.02 (Mielina add) = 0.04', () => {
    const state = withUpgrades({ ...createDefaultState(), focusFillRate: 0.02 }, ['mielina']);
    expect(computeFocusFillPerTap(state)).toBeCloseTo(0.04, 6);
  });
});

describe('applyTap — circular buffer push/drop (antiSpamBufferSize = 20)', () => {
  test('push to empty buffer', () => {
    const state = createDefaultState();
    const partial = applyTap(state, false, 1000);
    expect(partial.lastTapTimestamps).toEqual([1000]);
  });
  test('push 20 times keeps all 20 (no drop yet)', () => {
    let state: GameState = createDefaultState();
    for (let i = 0; i < 20; i++) {
      const partial = applyTap(state, false, i * 100);
      state = { ...state, ...partial } as GameState;
    }
    expect(state.lastTapTimestamps.length).toBe(20);
    expect(state.lastTapTimestamps[0]).toBe(0);
    expect(state.lastTapTimestamps[19]).toBe(1900);
  });
  test('21st push drops oldest, keeps buffer at 20', () => {
    let state: GameState = createDefaultState();
    for (let i = 0; i < 21; i++) {
      const partial = applyTap(state, false, i * 100);
      state = { ...state, ...partial } as GameState;
    }
    expect(state.lastTapTimestamps.length).toBe(20);
    expect(state.lastTapTimestamps[0]).toBe(100); // 0 was dropped
    expect(state.lastTapTimestamps[19]).toBe(2000);
  });
});

describe('applyTap — updates thoughts, cycleGenerated, totalGenerated, focusBar', () => {
  test('all four accumulators increment by thoughtGain (cycle/total) + focusBar by fill', () => {
    const state = { ...createDefaultState(), effectiveProductionPerSecond: 100 };
    const partial = applyTap(state, false, 1000);
    expect(partial.thoughts).toBeCloseTo(5, 6);
    expect(partial.cycleGenerated).toBeCloseTo(5, 6);
    expect(partial.totalGenerated).toBeCloseTo(5, 6);
    expect(partial.focusBar).toBeCloseTo(0.01, 6);
  });
});

describe('applyTap — immediate Insight activation when focusBar crosses threshold (Phase 5)', () => {
  test('Tap that pushes focusBar to 1.0 activates Insight in same update', () => {
    // focusBar at 0.995 + focusFillPerTap (0.01) = 1.005 ≥ 1.0 → fire level 1
    const state = { ...createDefaultState(), focusBar: 0.995 };
    const partial = applyTap(state, false, 1000);
    expect(partial.insightActive).toBe(true);
    expect(partial.insightMultiplier).toBe(3.0);
    expect(partial.insightEndTime).toBe(1000 + 15_000);
  });
  test('Tap below threshold does NOT activate', () => {
    const state = { ...createDefaultState(), focusBar: 0.5 };
    const partial = applyTap(state, false, 1000);
    expect(partial.insightActive).toBeUndefined();
  });
  test('Tap while Insight already active does NOT re-trigger', () => {
    const state = { ...createDefaultState(), focusBar: 1.5, insightActive: true, insightMultiplier: 3.0, insightEndTime: 9999 };
    const partial = applyTap(state, false, 1000);
    expect(partial.insightActive).toBeUndefined();
    expect(partial.insightEndTime).toBeUndefined();
  });
});

describe('GDD §6 TAP-2 worked examples (spec-authority spot checks)', () => {
  test('P0, 1 Básica (effectivePPS=0.5), no upgrades → tap yields 1 thought (floor)', () => {
    const state = { ...createDefaultState(), effectiveProductionPerSecond: 0.5 };
    expect(computeTapThought(state, false)).toBe(1);
  });
  test('Potencial Sináptico owned, effectivePPS=100 → tap yields 10 thoughts', () => {
    const state = withUpgrades({ ...createDefaultState(), effectiveProductionPerSecond: 100 }, ['potencial_sinaptico']);
    expect(computeTapThought(state, false)).toBe(10);
  });
  test('Potencial + Sinestesia Mutation active → tap yields 10 × 0.4 = 4 thoughts (§6 example)', () => {
    const state = withUpgrades(
      { ...createDefaultState(), effectiveProductionPerSecond: 100, currentMutation: { id: 'sinestesia' } },
      ['potencial_sinaptico'],
    );
    expect(computeTapThought(state, false)).toBeCloseTo(4, 6);
  });
});
