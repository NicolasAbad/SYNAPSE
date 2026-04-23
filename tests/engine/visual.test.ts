// Tests for src/engine/visual.ts — Sprint 7.5 Phase 7.5.5 §16.4 Visual Foresight.

import { describe, expect, test } from 'vitest';
import {
  visualInsightTier,
  hasMutationPreview,
  hasSpontaneousCountdown,
  hasEra3Preview,
  whatIfHorizonCycles,
} from '../../src/engine/visual';
import { createDefaultState } from '../../src/store/gameStore';
import type { GameState } from '../../src/types/GameState';
import type { UpgradeState } from '../../src/types';

function withUpgrades(state: GameState, ids: string[]): GameState {
  const upgrades: UpgradeState[] = ids.map((id) => ({ id, purchased: true, purchasedAt: 0 }));
  return { ...state, upgrades };
}
function atPrestige(state: GameState, p: number): GameState {
  return { ...state, prestigeCount: p };
}

describe('visualInsightTier — prestige-count gates', () => {
  test('P0 = T1', () => {
    expect(visualInsightTier(createDefaultState())).toBe(1);
  });
  test('P5 = T2', () => {
    expect(visualInsightTier(atPrestige(createDefaultState(), 5))).toBe(2);
  });
  test('P11 = T2 (just below T3 gate)', () => {
    expect(visualInsightTier(atPrestige(createDefaultState(), 11))).toBe(2);
  });
  test('P12 = T3', () => {
    expect(visualInsightTier(atPrestige(createDefaultState(), 12))).toBe(3);
  });
  test('P19 = T4', () => {
    expect(visualInsightTier(atPrestige(createDefaultState(), 19))).toBe(4);
  });
});

describe('visualInsightTier — Memoria-upgrade unlocks (skip ahead)', () => {
  test('vis_pattern_sight at P0 → T2', () => {
    expect(visualInsightTier(withUpgrades(createDefaultState(), ['vis_pattern_sight']))).toBe(2);
  });
  test('vis_deep_sight at P0 → T3', () => {
    expect(visualInsightTier(withUpgrades(createDefaultState(), ['vis_deep_sight']))).toBe(3);
  });
  test('vis_prophet_sight at P0 → T4', () => {
    expect(visualInsightTier(withUpgrades(createDefaultState(), ['vis_prophet_sight']))).toBe(4);
  });
  test('higher tier dominates (P5 + vis_prophet_sight = T4, not T2)', () => {
    const s = withUpgrades(atPrestige(createDefaultState(), 5), ['vis_prophet_sight']);
    expect(visualInsightTier(s)).toBe(4);
  });
});

describe('visual — UI gating helpers', () => {
  test('hasMutationPreview false at T1, true at T2+', () => {
    expect(hasMutationPreview(createDefaultState())).toBe(false);
    expect(hasMutationPreview(atPrestige(createDefaultState(), 5))).toBe(true);
    expect(hasMutationPreview(atPrestige(createDefaultState(), 19))).toBe(true);
  });
  test('hasSpontaneousCountdown false below T3, true T3+', () => {
    expect(hasSpontaneousCountdown(atPrestige(createDefaultState(), 11))).toBe(false);
    expect(hasSpontaneousCountdown(atPrestige(createDefaultState(), 12))).toBe(true);
    expect(hasSpontaneousCountdown(atPrestige(createDefaultState(), 19))).toBe(true);
  });
  test('hasEra3Preview only T4', () => {
    expect(hasEra3Preview(atPrestige(createDefaultState(), 18))).toBe(false);
    expect(hasEra3Preview(atPrestige(createDefaultState(), 19))).toBe(true);
  });
});

describe('visual — What-if horizon (Sprint 7.5.5 spec change)', () => {
  test('T1 horizon = 3 cycles (was 1 pre-7.5.5)', () => {
    expect(whatIfHorizonCycles()).toBe(3);
  });
});
