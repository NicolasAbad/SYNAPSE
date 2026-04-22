// Sprint 5 Phase 5.6 — Pathway engine tests.
//
// Covers:
//   - isUpgradeBlocked respects each pathway's `blocks` list
//   - dampenUpgradeBonus identity vs Equilibrada damp
//   - Pathway bonus accessors return correct values per pathway

import { describe, test, expect } from 'vitest';
import { createDefaultState } from '../../src/store/gameStore';
import {
  isUpgradeBlocked,
  pathwayCostMod,
  pathwayUpgradeBonusDamp,
  dampenUpgradeBonus,
  pathwayInsightDurationMult,
  pathwayChargeRateMult,
  pathwayMemoriesPerPrestigeMult,
  pathwayFocusFillRateMult,
} from '../../src/engine/pathways';
import type { GameState } from '../../src/types/GameState';
import type { Pathway } from '../../src/types';

function freshState(overrides: Partial<GameState> = {}): GameState {
  const raw = createDefaultState() as unknown as Record<string, unknown>;
  for (const k of ['activeTab', 'activeMindSubtab', 'undoToast', 'antiSpamActive']) delete raw[k];
  return { ...(raw as unknown as GameState), ...overrides };
}

function withPathway(p: Pathway): GameState {
  return freshState({ currentPathway: p });
}

describe('isUpgradeBlocked', () => {
  test('no active pathway → never blocked', () => {
    const s = freshState();
    expect(isUpgradeBlocked(s, 'tap')).toBe(false);
    expect(isUpgradeBlocked(s, 'reg')).toBe(false);
  });

  test('Rápida blocks reg/con/new, allows tap/foc/syn/met (and neu — not in either list)', () => {
    const s = withPathway('rapida');
    expect(isUpgradeBlocked(s, 'tap')).toBe(false);
    expect(isUpgradeBlocked(s, 'foc')).toBe(false);
    expect(isUpgradeBlocked(s, 'syn')).toBe(false);
    expect(isUpgradeBlocked(s, 'met')).toBe(false);
    expect(isUpgradeBlocked(s, 'neu')).toBe(false); // not in either list → enabled
    expect(isUpgradeBlocked(s, 'reg')).toBe(true);
    expect(isUpgradeBlocked(s, 'con')).toBe(true);
    expect(isUpgradeBlocked(s, 'new')).toBe(true);
  });

  test('Profunda blocks tap/foc/syn, allows neu/reg/con/new (and met — not listed)', () => {
    const s = withPathway('profunda');
    expect(isUpgradeBlocked(s, 'tap')).toBe(true);
    expect(isUpgradeBlocked(s, 'foc')).toBe(true);
    expect(isUpgradeBlocked(s, 'syn')).toBe(true);
    expect(isUpgradeBlocked(s, 'neu')).toBe(false);
    expect(isUpgradeBlocked(s, 'reg')).toBe(false);
    expect(isUpgradeBlocked(s, 'con')).toBe(false);
    expect(isUpgradeBlocked(s, 'new')).toBe(false);
    expect(isUpgradeBlocked(s, 'met')).toBe(false); // not listed → enabled
  });

  test('Equilibrada blocks none', () => {
    const s = withPathway('equilibrada');
    for (const cat of ['tap', 'foc', 'syn', 'neu', 'reg', 'con', 'met', 'new'] as const) {
      expect(isUpgradeBlocked(s, cat)).toBe(false);
    }
  });
});

describe('pathwayCostMod (COST-1)', () => {
  test('all v1.0 pathways carry 1.0', () => {
    expect(pathwayCostMod(freshState())).toBe(1);
    expect(pathwayCostMod(withPathway('rapida'))).toBe(1);
    expect(pathwayCostMod(withPathway('profunda'))).toBe(1);
    expect(pathwayCostMod(withPathway('equilibrada'))).toBe(1);
  });
});

describe('pathwayUpgradeBonusDamp + dampenUpgradeBonus', () => {
  test('damp factor — Equilibrada=0.85, others=1.0', () => {
    expect(pathwayUpgradeBonusDamp(freshState())).toBe(1);
    expect(pathwayUpgradeBonusDamp(withPathway('rapida'))).toBe(1);
    expect(pathwayUpgradeBonusDamp(withPathway('profunda'))).toBe(1);
    expect(pathwayUpgradeBonusDamp(withPathway('equilibrada'))).toBe(0.85);
  });

  test('dampenUpgradeBonus — identity multiplier (1.0) stays 1.0 even with damp', () => {
    expect(dampenUpgradeBonus(1, 0.85)).toBe(1);
  });

  test('dampenUpgradeBonus — applies to delta only', () => {
    // 1.5 = +50% bonus; with 0.85 damp → 1 + 0.5*0.85 = 1.425
    expect(dampenUpgradeBonus(1.5, 0.85)).toBeCloseTo(1.425, 5);
    // 2.0 = +100% bonus; with 0.85 damp → 1 + 1.0*0.85 = 1.85
    expect(dampenUpgradeBonus(2.0, 0.85)).toBeCloseTo(1.85, 5);
    // identity damp → no change
    expect(dampenUpgradeBonus(1.5, 1)).toBe(1.5);
  });
});

describe('Per-pathway bonus accessors', () => {
  test('Rápida insight duration ×2', () => {
    expect(pathwayInsightDurationMult(withPathway('rapida'))).toBe(2);
    expect(pathwayInsightDurationMult(withPathway('profunda'))).toBe(1);
    expect(pathwayInsightDurationMult(withPathway('equilibrada'))).toBe(1);
  });

  test('Rápida charge rate ×1.5', () => {
    expect(pathwayChargeRateMult(withPathway('rapida'))).toBe(1.5);
    expect(pathwayChargeRateMult(withPathway('profunda'))).toBe(1);
  });

  test('Profunda memories per prestige ×2', () => {
    expect(pathwayMemoriesPerPrestigeMult(withPathway('profunda'))).toBe(2);
    expect(pathwayMemoriesPerPrestigeMult(withPathway('rapida'))).toBe(1);
    expect(pathwayMemoriesPerPrestigeMult(withPathway('equilibrada'))).toBe(1);
  });

  test('Profunda focus fill rate ×0.5 (malus)', () => {
    expect(pathwayFocusFillRateMult(withPathway('profunda'))).toBe(0.5);
    expect(pathwayFocusFillRateMult(withPathway('rapida'))).toBe(1);
  });
});
