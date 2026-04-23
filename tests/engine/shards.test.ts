// Tests for src/engine/shards.ts — Sprint 7.5 Phase 7.5.2 Hipocampo Memory Shards.
//
// Coverage:
//   - Drip eligibility derivation (Emo / Proc) from existing GameState fields.
//   - REG-6: drip pauses when cycle complete.
//   - Per-tick drip math (deterministic, fractional accumulation, CODE-9).
//   - Eligibility flags don't double-count or drip from wrong source.
//   - Per-event burst (fragment-read +1 Emo, prestige Episodic burst).
//   - 6 effect helpers return correct values when shipping upgrades owned.
//   - Property: shard counters never go negative; never decrease within a tick.

import { describe, expect, test } from 'vitest';
import {
  hasFragmentReadThisCycle,
  isEmoEligible,
  isProcEligible,
  stepShardDrip,
  episodicShardsAtPrestige,
  emoShardsOnFragmentRead,
  cascadeSparkBonus,
  fragmentMemoryBonus,
  tapContributionShardMult,
  chargeIntervalShardMult,
  rpSparkShardBonus,
} from '../../src/engine/shards';
import { createDefaultState } from '../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';
import type { GameState } from '../../src/types/GameState';

const PER_TICK = SYNAPSE_CONSTANTS.shardDripBasePerMinute * (SYNAPSE_CONSTANTS.tickIntervalMs / 60_000);

describe('shards — drip eligibility derivation', () => {
  test('Emo eligible when cycleCascades > 0', () => {
    const s = { ...createDefaultState(), cycleCascades: 1 };
    expect(isEmoEligible(s)).toBe(true);
  });

  test('Emo eligible when cyclePositiveSpontaneous > 0', () => {
    const s = { ...createDefaultState(), cyclePositiveSpontaneous: 1 };
    expect(isEmoEligible(s)).toBe(true);
  });

  test('Emo eligible when a fragment was read this cycle', () => {
    const s: GameState = {
      ...createDefaultState(),
      cycleStartTimestamp: 100,
      diaryEntries: [{ timestamp: 200, type: 'fragment', data: { fragmentId: 'BASE-01' } }],
    };
    expect(isEmoEligible(s)).toBe(true);
    expect(hasFragmentReadThisCycle(s)).toBe(true);
  });

  test('Emo NOT eligible when fragment read happened in a prior cycle', () => {
    const s: GameState = {
      ...createDefaultState(),
      cycleStartTimestamp: 1000,
      diaryEntries: [{ timestamp: 50, type: 'fragment', data: { fragmentId: 'BASE-01' } }],
    };
    expect(isEmoEligible(s)).toBe(false);
  });

  test('Emo NOT eligible at fresh cycle (no events)', () => {
    expect(isEmoEligible(createDefaultState())).toBe(false);
  });

  test('Proc eligible when cycleNeuronsBought > 0', () => {
    const s = { ...createDefaultState(), cycleNeuronsBought: 1 };
    expect(isProcEligible(s)).toBe(true);
  });

  test('Proc eligible when cycleUpgradesBought > 0', () => {
    const s = { ...createDefaultState(), cycleUpgradesBought: 1 };
    expect(isProcEligible(s)).toBe(true);
  });

  test('Proc eligible when at least one tap recorded', () => {
    const s = { ...createDefaultState(), lastTapTimestamps: [1000] };
    expect(isProcEligible(s)).toBe(true);
  });

  test('Proc NOT eligible at fresh cycle', () => {
    expect(isProcEligible(createDefaultState())).toBe(false);
  });
});

describe('shards — stepShardDrip drip math', () => {
  function freshActiveCycle(overrides: Partial<GameState> = {}): GameState {
    return {
      ...createDefaultState(),
      currentThreshold: 100_000,
      cycleGenerated: 0,
      cycleCascades: 1, // Emo eligible
      lastTapTimestamps: [1000], // Proc eligible
      ...overrides,
    };
  }

  test('drip adds PER_TICK to both Emo and Proc when both eligible', () => {
    const s = freshActiveCycle();
    stepShardDrip(s);
    expect(s.memoryShards.emotional).toBeCloseTo(PER_TICK, 10);
    expect(s.memoryShards.procedural).toBeCloseTo(PER_TICK, 10);
    expect(s.memoryShards.episodic).toBe(0);
  });

  test('drip is deterministic across N ticks (CODE-9)', () => {
    const s1 = freshActiveCycle();
    const s2 = freshActiveCycle();
    for (let i = 0; i < 10; i++) {
      stepShardDrip(s1);
      stepShardDrip(s2);
    }
    expect(s1.memoryShards).toEqual(s2.memoryShards);
  });

  test('REG-6: drip pauses when cycle complete (cycleGenerated >= currentThreshold)', () => {
    const s = freshActiveCycle({ cycleGenerated: 100_000, currentThreshold: 100_000 });
    stepShardDrip(s);
    expect(s.memoryShards).toEqual({ emotional: 0, procedural: 0, episodic: 0 });
  });

  test('drip skips Emo when only Proc eligible', () => {
    const s = freshActiveCycle({ cycleCascades: 0 }); // Emo flag off
    stepShardDrip(s);
    expect(s.memoryShards.emotional).toBe(0);
    expect(s.memoryShards.procedural).toBeCloseTo(PER_TICK, 10);
  });

  test('drip skips Proc when only Emo eligible', () => {
    const s = freshActiveCycle({ lastTapTimestamps: [] }); // Proc flag off
    stepShardDrip(s);
    expect(s.memoryShards.emotional).toBeCloseTo(PER_TICK, 10);
    expect(s.memoryShards.procedural).toBe(0);
  });

  test('drip never goes negative (property)', () => {
    const s = freshActiveCycle();
    for (let i = 0; i < 100; i++) {
      stepShardDrip(s);
      expect(s.memoryShards.emotional).toBeGreaterThanOrEqual(0);
      expect(s.memoryShards.procedural).toBeGreaterThanOrEqual(0);
    }
  });

  test('drip never decreases within a cycle (property — monotonic non-decreasing)', () => {
    const s = freshActiveCycle();
    let lastEmo = 0;
    let lastProc = 0;
    for (let i = 0; i < 50; i++) {
      stepShardDrip(s);
      expect(s.memoryShards.emotional).toBeGreaterThanOrEqual(lastEmo);
      expect(s.memoryShards.procedural).toBeGreaterThanOrEqual(lastProc);
      lastEmo = s.memoryShards.emotional;
      lastProc = s.memoryShards.procedural;
    }
  });

  test('drip per minute aggregates to ~0.5 (matches GDD §16.1 spec rate)', () => {
    const s = freshActiveCycle();
    const ticksPerMinute = 60_000 / SYNAPSE_CONSTANTS.tickIntervalMs;
    for (let i = 0; i < ticksPerMinute; i++) stepShardDrip(s);
    expect(s.memoryShards.emotional).toBeCloseTo(SYNAPSE_CONSTANTS.shardDripBasePerMinute, 6);
  });
});

describe('shards — burst grants', () => {
  test('episodicShardsAtPrestige(0 RPs) = base only', () => {
    expect(episodicShardsAtPrestige(0)).toBe(SYNAPSE_CONSTANTS.episodicShardPerPrestige);
  });

  test('episodicShardsAtPrestige(2 RPs) = base + 2 × per-RP', () => {
    expect(episodicShardsAtPrestige(2)).toBe(
      SYNAPSE_CONSTANTS.episodicShardPerPrestige + 2 * SYNAPSE_CONSTANTS.episodicShardPerRp,
    );
  });

  test('emoShardsOnFragmentRead returns 1 (per-fragment burst)', () => {
    expect(emoShardsOnFragmentRead()).toBe(1);
  });
});

describe('shards — 6 effect helpers (only fire when upgrade owned)', () => {
  function withShard(id: string): GameState {
    return { ...createDefaultState(), memoryShardUpgrades: [id] };
  }

  test('cascadeSparkBonus = 1 when shard_emo_pulse owned, 0 otherwise', () => {
    expect(cascadeSparkBonus(createDefaultState())).toBe(0);
    expect(cascadeSparkBonus(withShard('shard_emo_pulse'))).toBe(SYNAPSE_CONSTANTS.shardEmoPulseCascadeSparkBonus);
  });

  test('fragmentMemoryBonus = 2 when shard_emo_resonance owned, 0 otherwise', () => {
    expect(fragmentMemoryBonus(createDefaultState())).toBe(0);
    expect(fragmentMemoryBonus(withShard('shard_emo_resonance'))).toBe(SYNAPSE_CONSTANTS.shardEmoResonanceFragmentMemoryBonus);
  });

  test('tapContributionShardMult = 1.05 when shard_proc_flow owned, 1.0 otherwise', () => {
    expect(tapContributionShardMult(createDefaultState())).toBe(1);
    expect(tapContributionShardMult(withShard('shard_proc_flow'))).toBeCloseTo(1.05, 6);
  });

  test('chargeIntervalShardMult = 0.90 when shard_proc_pattern owned, 1.0 otherwise', () => {
    expect(chargeIntervalShardMult(createDefaultState())).toBe(1);
    expect(chargeIntervalShardMult(withShard('shard_proc_pattern'))).toBe(SYNAPSE_CONSTANTS.shardProcPatternChargeIntervalMult);
  });

  test('rpSparkShardBonus = 10 when shard_epi_reflection owned, 0 otherwise', () => {
    expect(rpSparkShardBonus(createDefaultState())).toBe(0);
    expect(rpSparkShardBonus(withShard('shard_epi_reflection'))).toBe(SYNAPSE_CONSTANTS.shardEpiReflectionRpSparkBonus);
  });
});
