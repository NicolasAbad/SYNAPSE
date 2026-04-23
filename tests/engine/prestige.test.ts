// Tests for src/engine/prestige.ts (Sprint 4a Phase 4a.2).
// Covers PREST-1 step order + BUG-01 (insightActive post-prestige),
// BUG-02 (dischargeLastTimestamp=timestamp, dischargeCharges=0),
// BUG-04 (personalBest at PRE-increment prestigeCount),
// BUG-06 (Focus Persistente 25 % focusBar retention),
// CORE-8 amended (Momentum raw × 30 with maxMomentumPct cap),
// TUTOR-2 (isTutorialCycle one-way flip), §33 field-set discipline.
//
// Momentum cap property test + full integration (P0→P1 tick-by-tick)
// live in later phases (4a.3 + 4a.6).

import { describe, expect, test } from 'vitest';
import {
  computeMemoriesGained,
  computeMomentumBonus,
  handlePrestige,
} from '../../src/engine/prestige';
import {
  PRESTIGE_PRESERVE_FIELDS,
  PRESTIGE_RESET,
  PRESTIGE_RESET_FIELDS,
} from '../../src/config/prestige';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';
import { createDefaultState } from '../../src/store/gameStore';
import type { GameState } from '../../src/types/GameState';
import type { UpgradeState } from '../../src/types';

function withUpgrades(state: GameState, ids: string[]): GameState {
  const upgrades: UpgradeState[] = ids.map((id) => ({ id, purchased: true, purchasedAt: 0 }));
  return { ...state, upgrades };
}

// PRESERVE-side fields that handlePrestige legitimately reads + updates as part
// of its numbered PREST-1 steps (step 7 Memories, awakening log append, personal
// bests, resonance gain stub, Sprint 4b 4b.2 patterns grant). These are "not in
// PRESTIGE_RESET" — they DO survive prestige; their value just isn't identical
// pre→post because the step logic updates them. The strict subset of PRESERVE
// that passes through UNCHANGED is the complement.
const PRESERVE_UPDATED_BY_HANDLEPRESTIGE = new Set<keyof GameState>([
  'memories',
  'awakeningLog',
  'personalBests',
  'personalBestsBeaten',
  'resonance',
  'patterns',        // 4b.2: +patternsPerPrestige nodes appended.
  'totalPatterns',   // 4b.2: incremented by patternsPerPrestige.
  'lastCycleConfig', // 4c.1: POLAR-1 / SAME AS LAST snapshot of just-ended cycle.
  'sparks',                      // 6.6: +5 per newly-discovered Resonant Pattern.
  'resonantPatternsDiscovered', // 6.6: RP check flips false→true on discovery.
]);

describe('handlePrestige — PRESTIGE_RESET field-level behavior (§33)', () => {
  test('resets the 46 RESET fields to their PRESTIGE_RESET values (except engine-side overrides)', () => {
    const before: GameState = {
      ...createDefaultState(),
      thoughts: 999_999,
      cycleGenerated: 500_000,
      effectiveProductionPerSecond: 100,
      baseProductionPerSecond: 80,
      neurons: [
        { type: 'basica', count: 50 },
        { type: 'sensorial', count: 20 },
        { type: 'piramidal', count: 5 },
        { type: 'espejo', count: 0 },
        { type: 'integradora', count: 0 },
      ],
      cycleStartTimestamp: 0,
    };
    const { state: next } = handlePrestige(before, 1_000_000);

    // All 45 reset fields match PRESTIGE_RESET, except these engine-side
    // overrides applied after RESET in handlePrestige:
    //   - dischargeLastTimestamp → timestamp (BUG-02)
    //   - focusBar → 0 OR focusBar × 0.25 if Focus Persistente owned (BUG-06)
    //   - thoughts + cycleGenerated → Momentum Bonus (PREST-1 step 11)
    //   - lastCycleEndProduction → pre-reset PPS (PREST-1 step 1)
    //   - momentumBonus → computed capped Momentum (PREST-1 step 11)
    const RESET_OVERRIDES = new Set<keyof GameState>([
      'dischargeLastTimestamp', 'focusBar',
      'thoughts', 'cycleGenerated',
      'lastCycleEndProduction', 'momentumBonus',
    ]);
    for (const field of PRESTIGE_RESET_FIELDS) {
      if (RESET_OVERRIDES.has(field)) continue;
      expect(next[field], `RESET field ${String(field)}`).toEqual(
        PRESTIGE_RESET[field as keyof typeof PRESTIGE_RESET],
      );
    }
  });

  test('BUG-02: dischargeCharges=0 AND dischargeLastTimestamp=timestamp', () => {
    const before: GameState = { ...createDefaultState(), dischargeCharges: 2, dischargeLastTimestamp: 500 };
    const { state: next } = handlePrestige(before, 1_000_000);
    expect(next.dischargeCharges).toBe(0);
    expect(next.dischargeLastTimestamp).toBe(1_000_000);
  });

  test('BUG-01: insightActive=false post-prestige regardless of prior state', () => {
    const before: GameState = {
      ...createDefaultState(),
      insightActive: true,
      insightMultiplier: 8,
      insightEndTime: 999_999,
    };
    const { state: next } = handlePrestige(before, 1_000_000);
    expect(next.insightActive).toBe(false);
    expect(next.insightMultiplier).toBe(1);
    expect(next.insightEndTime).toBeNull();
  });

  test('BUG-06: focusBar resets to 0 without Focus Persistente', () => {
    const before: GameState = { ...createDefaultState(), focusBar: 0.8 };
    const { state: next } = handlePrestige(before, 1_000_000);
    expect(next.focusBar).toBe(0);
  });

  test('BUG-06: focusBar × 0.25 retained when Focus Persistente owned', () => {
    const before = withUpgrades({ ...createDefaultState(), focusBar: 0.8 }, ['focus_persistente']);
    const { state: next } = handlePrestige(before, 1_000_000);
    expect(next.focusBar).toBeCloseTo(0.2, 6); // 0.8 × 0.25
  });
});

describe('handlePrestige — PRESTIGE_UPDATE + lifetime (§33)', () => {
  test('prestigeCount increments by exactly 1', () => {
    const before: GameState = { ...createDefaultState(), prestigeCount: 5 };
    const { state: next } = handlePrestige(before, 1_000_000);
    expect(next.prestigeCount).toBe(6);
  });

  test('currentThreshold recalculated per calculateThreshold(newCount, transcendenceCount)', () => {
    const before: GameState = { ...createDefaultState(), prestigeCount: 0, transcendenceCount: 0 };
    const { state: next } = handlePrestige(before, 1_000_000);
    // New P1, Run 1 → baseThresholdTable[1] × runThresholdMult[0] = 450_000 × 1.0
    expect(next.currentThreshold).toBe(450_000);
  });

  test('cycleStartTimestamp set to the timestamp param', () => {
    const before: GameState = { ...createDefaultState(), cycleStartTimestamp: 100 };
    const { state: next } = handlePrestige(before, 1_234_567);
    expect(next.cycleStartTimestamp).toBe(1_234_567);
  });

  test('TUTOR-2: isTutorialCycle flips to false on first prestige', () => {
    const before: GameState = { ...createDefaultState(), isTutorialCycle: true, prestigeCount: 0 };
    const { state: next } = handlePrestige(before, 1_000_000);
    expect(next.isTutorialCycle).toBe(false);
  });

  test('TUTOR-2: stays false on subsequent prestiges', () => {
    const before: GameState = { ...createDefaultState(), isTutorialCycle: false, prestigeCount: 5 };
    const { state: next } = handlePrestige(before, 1_000_000);
    expect(next.isTutorialCycle).toBe(false);
  });

  test('lifetimePrestiges increments by exactly 1', () => {
    const before: GameState = { ...createDefaultState(), lifetimePrestiges: 7 };
    const { state: next } = handlePrestige(before, 1_000_000);
    expect(next.lifetimePrestiges).toBe(8);
  });
});

describe('handlePrestige — PRESTIGE_PRESERVE pass-through (§33)', () => {
  test('the 58 strictly-unchanged PRESERVE fields are identical pre→post', () => {
    const before: GameState = {
      ...createDefaultState(),
      memories: 42,
      sparks: 10,
      totalGenerated: 999_999,
      patternDecisions: { 6: 'A', 15: 'B' },
      transcendenceCount: 1,
      eraVisualTheme: 'digital',
      geniusPassLastOfferTimestamp: 111,
    };
    const { state: next } = handlePrestige(before, 1_000_000);
    for (const field of PRESTIGE_PRESERVE_FIELDS) {
      if (PRESERVE_UPDATED_BY_HANDLEPRESTIGE.has(field)) continue;
      expect(next[field], `PRESERVE field ${String(field)}`).toEqual(before[field]);
    }
  });

  test('patternDecisions NEVER resets (GDD §10 PAT-3)', () => {
    const before: GameState = {
      ...createDefaultState(),
      patternDecisions: { 6: 'A', 15: 'B', 24: 'A' },
    };
    const { state: next } = handlePrestige(before, 1_000_000);
    expect(next.patternDecisions).toEqual({ 6: 'A', 15: 'B', 24: 'A' });
  });
});

// Sprint 7.5.1 — Region scaffolding fields PRESTIGE behavior (§16 + §32).
describe('handlePrestige — Sprint 7.5.1 region/mastery/auto-buy fields', () => {
  test('activePrecommitment RESETS to null on prestige (cycle-scoped, §16.2 PRECOMMIT-2)', () => {
    const before: GameState = {
      ...createDefaultState(),
      activePrecommitment: { goalId: 'pc_under_8min', wager: 2 },
    };
    const { state: next } = handlePrestige(before, 1_000_000);
    expect(next.activePrecommitment).toBeNull();
  });

  test('memoryShards PRESERVE across prestige (§16.1 lifetime shards)', () => {
    const before: GameState = {
      ...createDefaultState(),
      memoryShards: { emotional: 12, procedural: 47, episodic: 5 },
      memoryShardUpgrades: ['shard_emo_pulse'],
    };
    const { state: next } = handlePrestige(before, 1_000_000);
    expect(next.memoryShards).toEqual({ emotional: 12, procedural: 47, episodic: 5 });
    expect(next.memoryShardUpgrades).toEqual(['shard_emo_pulse']);
  });

  test('precommitmentStreak PRESERVES across prestige (RESET only on Transcendence per §16.2)', () => {
    const before: GameState = { ...createDefaultState(), precommitmentStreak: 3 };
    const { state: next } = handlePrestige(before, 1_000_000);
    expect(next.precommitmentStreak).toBe(3);
  });

  test('mood + moodHistory PRESERVE across prestige (§16.3 MOOD-1)', () => {
    const history = [{ timestamp: 100, mood: 60 }, { timestamp: 200, mood: 65 }];
    const before: GameState = { ...createDefaultState(), mood: 73, moodHistory: history };
    const { state: next } = handlePrestige(before, 1_000_000);
    expect(next.mood).toBe(73);
    expect(next.moodHistory).toEqual(history);
  });

  test('brocaNamedMoments PRESERVE across prestige (§16.5 lifetime identity)', () => {
    const moments = [{ momentId: 'first_awakening', phrase: 'I am.' }];
    const before: GameState = { ...createDefaultState(), brocaNamedMoments: moments };
    const { state: next } = handlePrestige(before, 1_000_000);
    expect(next.brocaNamedMoments).toEqual(moments);
  });

  test('mastery PRESERVES across prestige (§38 lifetime use counts)', () => {
    const before: GameState = {
      ...createDefaultState(),
      mastery: { mut_dopamine: 5, path_rapida: 2 },
    };
    const { state: next } = handlePrestige(before, 1_000_000);
    expect(next.mastery).toEqual({ mut_dopamine: 5, path_rapida: 2 });
  });

  test('autoBuyConfig PRESERVES across prestige (Sprint 6.8 QoL)', () => {
    const config = { basica: { enabled: true, cap: 50 } };
    const before: GameState = { ...createDefaultState(), autoBuyConfig: config };
    const { state: next } = handlePrestige(before, 1_000_000);
    expect(next.autoBuyConfig).toEqual(config);
  });
});

// Sprint 4c Phase 4c.1 — POLAR-1 lastCycleConfig snapshot.
describe('handlePrestige — lastCycleConfig snapshot for POLAR-1 / SAME AS LAST', () => {
  test('writes polarity from currentPolarity into lastCycleConfig before RESET', () => {
    const before: GameState = { ...createDefaultState(), currentPolarity: 'excitatory' };
    const { state: next } = handlePrestige(before, 1_000_000);
    expect(next.lastCycleConfig).toEqual({ polarity: 'excitatory', mutation: '', pathway: '', upgrades: [] });
  });

  test('snapshots inhibitory too', () => {
    const before: GameState = { ...createDefaultState(), currentPolarity: 'inhibitory' };
    const { state: next } = handlePrestige(before, 1_000_000);
    expect(next.lastCycleConfig?.polarity).toBe('inhibitory');
  });

  test('snapshots empty strings when fields are null (pre-P3 first prestige)', () => {
    const before: GameState = {
      ...createDefaultState(),
      currentPolarity: null,
      currentMutation: null,
      currentPathway: null,
    };
    const { state: next } = handlePrestige(before, 1_000_000);
    expect(next.lastCycleConfig).toEqual({ polarity: '', mutation: '', pathway: '', upgrades: [] });
  });

  test('currentPolarity itself RESETs to null (cycle-scoped) — only lastCycleConfig preserves the choice', () => {
    const before: GameState = { ...createDefaultState(), currentPolarity: 'excitatory' };
    const { state: next } = handlePrestige(before, 1_000_000);
    expect(next.currentPolarity).toBeNull();
    expect(next.lastCycleConfig?.polarity).toBe('excitatory');
  });
});

// Sprint 4b Phase 4b.2 — pattern grant on prestige (GDD §10).
describe('handlePrestige — pattern grant (Sprint 4b Phase 4b.2)', () => {
  test('first prestige adds exactly patternsPerPrestige new PatternNodes', () => {
    const before: GameState = { ...createDefaultState(), patterns: [], totalPatterns: 0 };
    const { state: next } = handlePrestige(before, 1_000_000);
    expect(next.patterns).toHaveLength(SYNAPSE_CONSTANTS.patternsPerPrestige);
    expect(next.totalPatterns).toBe(SYNAPSE_CONSTANTS.patternsPerPrestige);
  });

  test('new pattern nodes have sequential indices starting from totalPatterns', () => {
    const before: GameState = {
      ...createDefaultState(),
      patterns: [],
      totalPatterns: 5, // as if a prior prestige already granted some
    };
    const { state: next } = handlePrestige(before, 1_000_000);
    const added = next.patterns.slice(-3).map((p) => p.index);
    expect(added).toEqual([5, 6, 7]);
    // index 6 is a decision node per §10.
    expect(next.patterns.find((p) => p.index === 6)?.isDecisionNode).toBe(true);
  });

  test('acquiredAt equals the prestige timestamp (so new patterns count as this-cycle)', () => {
    const before: GameState = { ...createDefaultState(), totalPatterns: 0 };
    const { state: next } = handlePrestige(before, 2_500_000);
    for (const p of next.patterns) {
      expect(p.acquiredAt).toBe(2_500_000);
    }
  });

  test('isDecisionNode flags match patternDecisionNodes for each crossed threshold', () => {
    const before: GameState = { ...createDefaultState(), totalPatterns: 4 };
    // 4, 5, 6 → index 6 is a decision node, others are not.
    const { state: next } = handlePrestige(before, 1_000_000);
    const flags = next.patterns
      .slice(-3)
      .map((p) => ({ index: p.index, isDecisionNode: p.isDecisionNode }));
    expect(flags).toEqual([
      { index: 4, isDecisionNode: false },
      { index: 5, isDecisionNode: false },
      { index: 6, isDecisionNode: true },
    ]);
  });

  test('stops granting when tree cap (50) is reached', () => {
    const before: GameState = { ...createDefaultState(), totalPatterns: 49 };
    const { state: next } = handlePrestige(before, 1_000_000);
    // Only 1 slot available (49 → 50).
    expect(next.totalPatterns).toBe(SYNAPSE_CONSTANTS.patternTreeSize);
    expect(next.patterns.slice(-1)[0]!.index).toBe(49);
  });

  test('no-op when tree is already full', () => {
    const existing = Array.from({ length: 50 }, (_, i) => ({ // CONST-OK tree size mirror for fixture
      index: i,
      isDecisionNode: false,
      acquiredAt: 0,
    }));
    const before: GameState = {
      ...createDefaultState(),
      patterns: existing,
      totalPatterns: 50, // CONST-OK mirrors patternTreeSize for fixture
    };
    const { state: next, outcome } = handlePrestige(before, 1_000_000);
    expect(next.totalPatterns).toBe(before.totalPatterns);
    expect(next.patterns.length).toBe(existing.length);
    // patternsGained in AwakeningLog reflects the real 0.
    expect(next.awakeningLog[0].patternsGained).toBe(0);
    expect(outcome).toBeDefined();
  });
});

describe('computeMemoriesGained — GDD §2 Memory generation table', () => {
  test('base +2 per prestige with no upgrades', () => {
    expect(computeMemoriesGained(createDefaultState())).toBe(2);
  });

  test('Consolidación de Memoria contributes +50 % → 2 × 1.5 = 3', () => {
    const state = withUpgrades(createDefaultState(), ['consolidacion_memoria']);
    expect(computeMemoriesGained(state)).toBeCloseTo(3, 6);
  });
});

describe('handlePrestige — Memories + awakening log (PREST-1 step 7)', () => {
  test('memories increments by baseMemoriesPerPrestige (2)', () => {
    const before: GameState = { ...createDefaultState(), memories: 10 };
    const { state: next, outcome } = handlePrestige(before, 1_000_000);
    expect(outcome.memoriesGained).toBe(2);
    expect(next.memories).toBe(12);
  });

  test('memories increments by 3 with Consolidación de Memoria', () => {
    const before = withUpgrades({ ...createDefaultState(), memories: 10 }, ['consolidacion_memoria']);
    const { state: next, outcome } = handlePrestige(before, 1_000_000);
    expect(outcome.memoriesGained).toBeCloseTo(3, 6);
    expect(next.memories).toBeCloseTo(13, 6);
  });

  test('appends an AwakeningEntry with the pre-reset cycle snapshot', () => {
    const before: GameState = {
      ...createDefaultState(),
      prestigeCount: 2,
      cycleStartTimestamp: 500_000,
      effectiveProductionPerSecond: 150,
      currentPolarity: 'excitatory',
    };
    const { state: next } = handlePrestige(before, 800_000);
    expect(next.awakeningLog).toHaveLength(1);
    const entry = next.awakeningLog[0];
    expect(entry.prestigeCount).toBe(2); // pre-increment, BUG-04 style
    expect(entry.timestamp).toBe(800_000);
    expect(entry.cycleDurationMs).toBe(300_000);
    expect(entry.endProduction).toBe(150);
    expect(entry.polarity).toBe('excitatory');
    expect(entry.memoriesGained).toBe(2);
    expect(entry.patternsGained).toBe(3); // 4b.2: patternsPerPrestige
  });
});

describe('handlePrestige — Personal best tracking (BUG-04)', () => {
  test('creates a personalBests entry keyed by PRE-increment prestigeCount on first cycle', () => {
    const before: GameState = {
      ...createDefaultState(),
      prestigeCount: 0,
      cycleStartTimestamp: 0,
      personalBests: {},
    };
    const { state: next, outcome } = handlePrestige(before, 480_000); // 8 min
    expect(next.personalBests[0]).toEqual({ minutes: 8, rewardGiven: false });
    expect(next.personalBestsBeaten).toBe(1);
    expect(outcome.wasPersonalBest).toBe(true);
  });

  test('updates personalBests only when faster (strict <)', () => {
    const before: GameState = {
      ...createDefaultState(),
      prestigeCount: 3,
      cycleStartTimestamp: 0,
      personalBests: { 3: { minutes: 9, rewardGiven: false } },
      personalBestsBeaten: 5,
    };
    const faster = handlePrestige(before, 420_000); // 7 min — faster
    expect(faster.state.personalBests[3].minutes).toBe(7);
    expect(faster.state.personalBestsBeaten).toBe(6);
    expect(faster.outcome.wasPersonalBest).toBe(true);

    const slower = handlePrestige(before, 600_000); // 10 min — slower
    expect(slower.state.personalBests[3].minutes).toBe(9);
    expect(slower.state.personalBestsBeaten).toBe(5);
    expect(slower.outcome.wasPersonalBest).toBe(false);
  });

  test('keyed by PRE-increment prestigeCount (BUG-04)', () => {
    const before: GameState = {
      ...createDefaultState(),
      prestigeCount: 5,
      cycleStartTimestamp: 0,
      personalBests: {},
    };
    const { state: next } = handlePrestige(before, 300_000);
    expect(next.personalBests[5]).toBeDefined();
    expect(next.personalBests[6]).toBeUndefined();
  });
});

describe('computeMomentumBonus — CORE-8 amended cap (4A-2)', () => {
  test('raw × 30 when raw < cap (no-clamp, early-game)', () => {
    // PPS 60/sec, threshold 450_000 → raw = 1800, cap = 45_000 → no clamp
    const result = computeMomentumBonus(60, 450_000);
    expect(result).toBe(1800);
  });

  test('clamped to nextThreshold × 0.10 when raw > cap (late-game)', () => {
    // PPS 1_000_000/sec, threshold 1_200_000 → raw = 30M, cap = 120K → clamped
    const result = computeMomentumBonus(1_000_000, 1_200_000);
    expect(result).toBe(120_000);
  });

  test('identity at boundary (raw === cap)', () => {
    // raw = cap: PPS × 30 === threshold × 0.1 ⇒ threshold = 300 × PPS
    const result = computeMomentumBonus(100, 30_000);
    expect(result).toBe(3000);
  });
});

describe('handlePrestige — Momentum applied to thoughts (PREST-1 step 11)', () => {
  test('thoughts set to the capped Momentum Bonus on new cycle', () => {
    const before: GameState = {
      ...createDefaultState(),
      thoughts: 999_999, // cycle-end balance, irrelevant — gets reset
      effectiveProductionPerSecond: 60, // raw = 60 × 30 = 1800
      prestigeCount: 0, // new P1 → threshold 450_000 → cap 45_000 → no clamp
      transcendenceCount: 0,
    };
    const { state: next, outcome } = handlePrestige(before, 1_000_000);
    expect(outcome.momentumBonus).toBe(1800);
    expect(next.thoughts).toBe(1800);
    expect(next.cycleGenerated).toBe(1800);
    expect(next.momentumBonus).toBe(1800);
  });

  test('late-game clamp applies cap (10 % of next threshold)', () => {
    const before: GameState = {
      ...createDefaultState(),
      effectiveProductionPerSecond: 1_000_000, // raw = 30M
      prestigeCount: 2, // new P3 → baseThresholdTable[3] = 2_000_000 → cap 200K
      transcendenceCount: 0,
    };
    const { state: next, outcome } = handlePrestige(before, 1_000_000);
    const expectedCap = SYNAPSE_CONSTANTS.baseThresholdTable[3] * SYNAPSE_CONSTANTS.maxMomentumPct;
    expect(outcome.momentumBonus).toBe(expectedCap);
    expect(next.thoughts).toBe(expectedCap);
  });
});

describe('handlePrestige — outcome metadata for Awakening UI', () => {
  test('returns prevPrestigeCount, newPrestigeCount, nextThreshold, cycleDurationMs', () => {
    const before: GameState = {
      ...createDefaultState(),
      prestigeCount: 3,
      cycleStartTimestamp: 100,
      effectiveProductionPerSecond: 50,
    };
    const { outcome } = handlePrestige(before, 600_100);
    expect(outcome.prevPrestigeCount).toBe(3);
    expect(outcome.newPrestigeCount).toBe(4);
    expect(outcome.cycleDurationMs).toBe(600_000);
    expect(outcome.nextThreshold).toBe(SYNAPSE_CONSTANTS.baseThresholdTable[4]);
    expect(outcome.memoriesGained).toBe(2);
  });
});
