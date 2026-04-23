// Tests for src/store/shardPurchases.ts — Sprint 7.5 Phase 7.5.2.
//
// Coverage:
//   - canBuyShardUpgrade affordability dispatching off typed-shard currency.
//   - tryBuyShardUpgrade deducts from the right shard type bank.
//   - Already-owned, locked, insufficient_funds, unknown reasons.
//   - Buy adds the ID to memoryShardUpgrades (NOT to state.upgrades).
//   - Buy never deducts from Memorias / thoughts.

import { describe, expect, test } from 'vitest';
import { canBuyShardUpgrade, tryBuyShardUpgrade } from '../../src/store/shardPurchases';
import { createDefaultState } from '../../src/store/gameStore';
import type { GameState } from '../../src/types/GameState';

function withEmo(state: GameState, amount: number): GameState {
  return { ...state, memoryShards: { ...state.memoryShards, emotional: amount } };
}
function withProc(state: GameState, amount: number): GameState {
  return { ...state, memoryShards: { ...state.memoryShards, procedural: amount } };
}
function withEpi(state: GameState, amount: number): GameState {
  return { ...state, memoryShards: { ...state.memoryShards, episodic: amount } };
}

describe('canBuyShardUpgrade — affordability checks', () => {
  test('unknown id returns unknown', () => {
    expect(canBuyShardUpgrade(createDefaultState(), 'not_a_real_id').reason).toBe('unknown');
  });

  test('shard_emo_pulse locked at P0 (unlock at P1)', () => {
    const s = withEmo(createDefaultState(), 100);
    expect(canBuyShardUpgrade(s, 'shard_emo_pulse').reason).toBe('locked');
  });

  test('shard_emo_pulse insufficient_funds at P1 with 0 emo', () => {
    const s: GameState = { ...createDefaultState(), prestigeCount: 1 };
    expect(canBuyShardUpgrade(s, 'shard_emo_pulse').reason).toBe('insufficient_funds');
  });

  test('shard_emo_pulse OK at P1 with 20 emo (exact cost)', () => {
    const s: GameState = withEmo({ ...createDefaultState(), prestigeCount: 1 }, 20);
    const check = canBuyShardUpgrade(s, 'shard_emo_pulse');
    expect(check.reason).toBe('ok');
    expect(check.cost).toBe(20);
  });

  test('shard_proc_flow OK at P1 with 20 proc', () => {
    const s: GameState = withProc({ ...createDefaultState(), prestigeCount: 1 }, 20);
    expect(canBuyShardUpgrade(s, 'shard_proc_flow').reason).toBe('ok');
  });

  test('shard_epi_reflection locked at P4 (unlock at P5)', () => {
    const s: GameState = withEpi({ ...createDefaultState(), prestigeCount: 4 }, 100);
    expect(canBuyShardUpgrade(s, 'shard_epi_reflection').reason).toBe('locked');
  });

  test('already-owned returns already_owned', () => {
    const s: GameState = withEmo({ ...createDefaultState(), prestigeCount: 1, memoryShardUpgrades: ['shard_emo_pulse'] }, 100);
    expect(canBuyShardUpgrade(s, 'shard_emo_pulse').reason).toBe('already_owned');
  });
});

describe('tryBuyShardUpgrade — purchase mechanics', () => {
  test('successful buy deducts from correct shard type', () => {
    const s: GameState = withEmo({ ...createDefaultState(), prestigeCount: 1 }, 50);
    const result = tryBuyShardUpgrade(s, 'shard_emo_pulse', 1000);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.updates.memoryShards).toEqual({ emotional: 30, procedural: 0, episodic: 0 });
  });

  test('successful buy appends ID to memoryShardUpgrades', () => {
    const s: GameState = withEmo({ ...createDefaultState(), prestigeCount: 1 }, 50);
    const result = tryBuyShardUpgrade(s, 'shard_emo_pulse', 1000);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.updates.memoryShardUpgrades).toEqual(['shard_emo_pulse']);
  });

  test('successful buy does NOT touch Memorias or Thoughts', () => {
    const s: GameState = withEmo({ ...createDefaultState(), prestigeCount: 1, memories: 50, thoughts: 1000 }, 50);
    const result = tryBuyShardUpgrade(s, 'shard_emo_pulse', 1000);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.updates.memories).toBeUndefined();
    expect(result.updates.thoughts).toBeUndefined();
  });

  test('successful buy does NOT touch state.upgrades (legacy 34-list)', () => {
    const s: GameState = withEmo({ ...createDefaultState(), prestigeCount: 1 }, 50);
    const result = tryBuyShardUpgrade(s, 'shard_emo_pulse', 1000);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.updates.upgrades).toBeUndefined();
  });

  test('insufficient shards rejects without mutation', () => {
    const s: GameState = withEmo({ ...createDefaultState(), prestigeCount: 1 }, 5);
    const result = tryBuyShardUpgrade(s, 'shard_emo_pulse', 1000);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('insufficient_funds');
  });

  test('Procedural-typed buy deducts from procedural bank only', () => {
    const s: GameState = withProc({ ...createDefaultState(), prestigeCount: 1 }, 30);
    const before = { ...s.memoryShards };
    const result = tryBuyShardUpgrade(s, 'shard_proc_flow', 1000);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.updates.memoryShards).toEqual({ ...before, procedural: 10 });
  });

  test('Episodic-typed buy deducts from episodic bank only (shard_epi_imprint, 10 Epi, P1+)', () => {
    const s: GameState = withEpi({ ...createDefaultState(), prestigeCount: 1 }, 30);
    const result = tryBuyShardUpgrade(s, 'shard_epi_imprint', 1000);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.updates.memoryShards).toEqual({ emotional: 0, procedural: 0, episodic: 20 });
  });

  test('lastPurchaseTimestamp updated on successful buy', () => {
    const s: GameState = withEmo({ ...createDefaultState(), prestigeCount: 1 }, 50);
    const result = tryBuyShardUpgrade(s, 'shard_emo_pulse', 7777);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.updates.lastPurchaseTimestamp).toBe(7777);
  });
});
