// Tests for src/engine/integratedMind.ts — Sprint 7.5 Phase 7.5.8 §16.6.

import { describe, expect, test } from 'vitest';
import {
  isHipocampoActive,
  isPrefrontalActive,
  isLimbicoActive,
  isVisualActive,
  isBrocaActive,
  activeRegionCount,
  integratedMindMaxChargeBonus,
  integratedMindMemoryMult,
  isFullyIntegrated,
} from '../../src/engine/integratedMind';
import { createDefaultState } from '../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';
import type { GameState } from '../../src/types/GameState';

function fullyActive(): GameState {
  return {
    ...createDefaultState(),
    memoryShardUpgrades: ['shard_emo_pulse'],         // Hipocampo active
    precommitmentStreak: 1,                            // Prefrontal active
    mood: 80,                                          // Límbico active (Engaged+)
    prestigeCount: 5,                                  // Visual active (T2 via prestige)
    brocaNamedMoments: [{ momentId: 'first_awakening', phrase: 'I begin.' }], // Broca active
  };
}

describe('integratedMind — per-region active checks', () => {
  test('default state: all regions inactive', () => {
    const s = createDefaultState();
    expect(isHipocampoActive(s)).toBe(false);
    expect(isPrefrontalActive(s)).toBe(false);
    expect(isLimbicoActive(s)).toBe(false);
    expect(isVisualActive(s)).toBe(false);
    expect(isBrocaActive(s)).toBe(false);
  });
  test('Hipocampo active when any shard upgrade owned', () => {
    expect(isHipocampoActive({ ...createDefaultState(), memoryShardUpgrades: ['shard_emo_pulse'] })).toBe(true);
  });
  test('Prefrontal active when precommitmentStreak > 0', () => {
    expect(isPrefrontalActive({ ...createDefaultState(), precommitmentStreak: 1 })).toBe(true);
  });
  test('Límbico active at mood 40+ (Engaged tier threshold)', () => {
    expect(isLimbicoActive({ ...createDefaultState(), mood: 39 })).toBe(false);
    expect(isLimbicoActive({ ...createDefaultState(), mood: 40 })).toBe(true);
  });
  test('Visual active at T2+ (prestige >= 5 OR vis_pattern_sight)', () => {
    expect(isVisualActive({ ...createDefaultState(), prestigeCount: 4 })).toBe(false);
    expect(isVisualActive({ ...createDefaultState(), prestigeCount: 5 })).toBe(true);
  });
  test('Broca active when at least one Named Moment authored', () => {
    expect(isBrocaActive({ ...createDefaultState(), brocaNamedMoments: [{ momentId: 'first_awakening', phrase: 'X' }] })).toBe(true);
  });
});

describe('integratedMind — tier bonuses', () => {
  test('default state: 0 active regions = no bonuses', () => {
    const s = createDefaultState();
    expect(activeRegionCount(s)).toBe(0);
    expect(integratedMindMaxChargeBonus(s)).toBe(0);
    expect(integratedMindMemoryMult(s)).toBe(1);
    expect(isFullyIntegrated(s)).toBe(false);
  });
  test('3 active: +1 max charge, no Memoria mult', () => {
    const s: GameState = {
      ...createDefaultState(),
      memoryShardUpgrades: ['shard_emo_pulse'],
      mood: 80,
      brocaNamedMoments: [{ momentId: 'first_awakening', phrase: 'X' }],
    };
    expect(activeRegionCount(s)).toBe(3);
    expect(integratedMindMaxChargeBonus(s)).toBe(1);
    expect(integratedMindMemoryMult(s)).toBe(1);
  });
  test('4 active: +1 max charge AND Memoria ×1.10', () => {
    const s: GameState = {
      ...createDefaultState(),
      memoryShardUpgrades: ['shard_emo_pulse'],
      precommitmentStreak: 1,
      mood: 80,
      brocaNamedMoments: [{ momentId: 'first_awakening', phrase: 'X' }],
    };
    expect(activeRegionCount(s)).toBe(4);
    expect(integratedMindMaxChargeBonus(s)).toBe(1);
    expect(integratedMindMemoryMult(s)).toBe(SYNAPSE_CONSTANTS.integratedMindMemoryBonus);
  });
  test('5 active: full synergy (isFullyIntegrated true)', () => {
    expect(activeRegionCount(fullyActive())).toBe(5);
    expect(isFullyIntegrated(fullyActive())).toBe(true);
  });
});
