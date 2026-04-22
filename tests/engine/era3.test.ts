// Sprint 6 Phase 6.5 — Era 3 event engine tests (GDD §23 + NARRATIVE.md §7).

import { describe, expect, test } from 'vitest';
import { createDefaultState } from '../../src/store/gameStore';
import {
  getCurrentEra3Event,
  hasUnseenEra3Event,
  getAllEra3Events,
  era3MutationBonusOptions,
  era3PolarityStrengthMult,
  era3ProductionMult,
  era3ResonanceGainMult,
  era3OfflineMult,
  era3FocusFillBlocked,
  era3AutoPrestigeAt45MinElapsed,
  era3NeuronCostMult,
  era3DischargeMultOverride,
  era3IsLastChoice,
} from '../../src/engine/era3';
import { ERA3_EVENTS } from '../../src/config/era3Events';
import type { GameState } from '../../src/types/GameState';

function freshState(overrides: Partial<GameState> = {}): GameState {
  const raw = createDefaultState() as unknown as Record<string, unknown>;
  for (const k of ['activeTab', 'activeMindSubtab', 'undoToast', 'antiSpamActive']) delete raw[k];
  return { ...(raw as unknown as GameState), ...overrides };
}

describe('8 Era 3 events catalogued (GDD §23)', () => {
  test('exactly 8 entries for prestiges 19..26', () => {
    expect(ERA3_EVENTS).toHaveLength(8);
    expect(getAllEra3Events()).toHaveLength(8);
  });

  test('each id prefixed era3_pXX', () => {
    for (const e of ERA3_EVENTS) {
      expect(e.id).toBe(`era3_p${e.prestigeCount}`);
      expect(e.prestigeCount).toBeGreaterThanOrEqual(19);
      expect(e.prestigeCount).toBeLessThanOrEqual(26);
    }
  });
});

describe('getCurrentEra3Event / hasUnseenEra3Event', () => {
  test('null for P0-P18', () => {
    expect(getCurrentEra3Event({ prestigeCount: 0 })).toBeNull();
    expect(getCurrentEra3Event({ prestigeCount: 18 })).toBeNull();
  });

  test('resolves to matching event for P19..P26', () => {
    for (let p = 19; p <= 26; p++) {
      const def = getCurrentEra3Event({ prestigeCount: p });
      expect(def?.prestigeCount).toBe(p);
    }
  });

  test('hasUnseenEra3Event is true when id absent from narrativeFragmentsSeen', () => {
    expect(hasUnseenEra3Event({ prestigeCount: 19, narrativeFragmentsSeen: [] })).toBe(true);
  });

  test('hasUnseenEra3Event is false when id present', () => {
    expect(hasUnseenEra3Event({ prestigeCount: 19, narrativeFragmentsSeen: ['era3_p19'] })).toBe(false);
  });
});

describe('Per-event effect helpers', () => {
  test('P19 First Fracture — mutation bonus options +2', () => {
    expect(era3MutationBonusOptions({ prestigeCount: 18 })).toBe(0);
    expect(era3MutationBonusOptions({ prestigeCount: 19 })).toBe(2);
    expect(era3MutationBonusOptions({ prestigeCount: 20 })).toBe(0);
  });

  test('P21 Mirror Cycle — polarity ×2', () => {
    expect(era3PolarityStrengthMult({ prestigeCount: 20 })).toBe(1);
    expect(era3PolarityStrengthMult({ prestigeCount: 21 })).toBe(2);
    expect(era3PolarityStrengthMult({ prestigeCount: 22 })).toBe(1);
  });

  test('P22 Silent Resonance — production ×0.8 + resonance ×3', () => {
    expect(era3ProductionMult({ prestigeCount: 22 })).toBe(0.8);
    expect(era3ResonanceGainMult({ prestigeCount: 22 })).toBe(3);
    expect(era3ProductionMult({ prestigeCount: 21 })).toBe(1);
  });

  test('P23 Dreamer — offline ×3 + focus blocked', () => {
    expect(era3OfflineMult({ prestigeCount: 23 })).toBe(3);
    expect(era3FocusFillBlocked({ prestigeCount: 23 })).toBe(true);
    expect(era3FocusFillBlocked({ prestigeCount: 22 })).toBe(false);
  });

  test('P24 Long Thought — auto-prestige at 45 min elapsed', () => {
    const s = freshState({ prestigeCount: 24, cycleStartTimestamp: 1000 });
    const fortyFourMin = 1000 + 44 * 60_000;
    const fortyFiveMin = 1000 + 45 * 60_000;
    expect(era3AutoPrestigeAt45MinElapsed(s, fortyFourMin)).toBe(false);
    expect(era3AutoPrestigeAt45MinElapsed(s, fortyFiveMin)).toBe(true);
  });

  test('P24 auto-prestige does NOT fire for other prestiges', () => {
    const s = freshState({ prestigeCount: 23, cycleStartTimestamp: 0 });
    expect(era3AutoPrestigeAt45MinElapsed(s, 10_000_000)).toBe(false);
  });

  test('P25 Final — neuron cost ×0.5 + discharge override', () => {
    expect(era3NeuronCostMult({ prestigeCount: 25 })).toBe(0.5);
    expect(era3DischargeMultOverride({ prestigeCount: 25 })).toBe(5);
    expect(era3DischargeMultOverride({ prestigeCount: 24 })).toBeNull();
  });

  test('P26 Last Choice flag', () => {
    expect(era3IsLastChoice({ prestigeCount: 25 })).toBe(false);
    expect(era3IsLastChoice({ prestigeCount: 26 })).toBe(true);
  });
});
