// Sprint 8b Phase 8b.5 — Run-exclusive upgrade tests (GDD §21).

import { describe, expect, test } from 'vitest';
import {
  canBuyRunUpgrade,
  tryBuyRunUpgrade,
  runUpgradeOfflineCapBonusHours,
  runUpgradeEarlyPrestigeThresholdMult,
} from '../../src/engine/runUpgrades';
import { RUN_UPGRADES, RUN_UPGRADES_BY_ID } from '../../src/config/runUpgrades';
import { computeOfflineCapHours } from '../../src/engine/offline';
import { calculateThreshold } from '../../src/engine/production';
import { createDefaultState } from '../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';
import type { GameState } from '../../src/types/GameState';

function s(overrides: Partial<GameState> = {}): GameState {
  return { ...createDefaultState(), ...overrides };
}

describe('RUN_UPGRADES catalog', () => {
  test('exactly 4 upgrades for v1.0 (2 Run 2 + 2 Run 3)', () => {
    expect(RUN_UPGRADES.length).toBe(4);
    expect(RUN_UPGRADES.filter((u) => u.unlockAtTranscendenceCount === 1).length).toBe(2);
    expect(RUN_UPGRADES.filter((u) => u.unlockAtTranscendenceCount === 2).length).toBe(2);
  });

  test('expected ids: eco_ancestral / sueno_profundo / neurona_pionera / despertar_acelerado', () => {
    expect(RUN_UPGRADES_BY_ID['eco_ancestral']).toBeDefined();
    expect(RUN_UPGRADES_BY_ID['sueno_profundo']).toBeDefined();
    expect(RUN_UPGRADES_BY_ID['neurona_pionera']).toBeDefined();
    expect(RUN_UPGRADES_BY_ID['despertar_acelerado']).toBeDefined();
  });

  test('GDD §21 costs match: 100K / 200K / 150K / 300K thoughts', () => {
    expect(RUN_UPGRADES_BY_ID['eco_ancestral'].costThoughts).toBe(100_000);
    expect(RUN_UPGRADES_BY_ID['sueno_profundo'].costThoughts).toBe(200_000);
    expect(RUN_UPGRADES_BY_ID['neurona_pionera'].costThoughts).toBe(150_000);
    expect(RUN_UPGRADES_BY_ID['despertar_acelerado'].costThoughts).toBe(300_000);
  });
});

describe('canBuyRunUpgrade — gate logic', () => {
  test('unknown id → unknown_id', () => {
    expect(canBuyRunUpgrade(s(), 'nonexistent').reason).toBe('unknown_id');
  });

  test('Run 2 upgrade locked at transcendenceCount 0 → run_locked', () => {
    expect(canBuyRunUpgrade(s({ transcendenceCount: 0, thoughts: 1_000_000 }), 'eco_ancestral').reason).toBe('run_locked');
  });

  test('Run 2 upgrade unlocked at transcendenceCount 1', () => {
    expect(canBuyRunUpgrade(s({ transcendenceCount: 1, thoughts: 200_000 }), 'eco_ancestral').ok).toBe(true);
  });

  test('Run 3 upgrade locked at transcendenceCount 1 → run_locked', () => {
    expect(canBuyRunUpgrade(s({ transcendenceCount: 1, thoughts: 1_000_000 }), 'neurona_pionera').reason).toBe('run_locked');
  });

  test('Run 3 upgrade unlocked at transcendenceCount 2', () => {
    expect(canBuyRunUpgrade(s({ transcendenceCount: 2, thoughts: 200_000 }), 'neurona_pionera').ok).toBe(true);
  });

  test('insufficient thoughts → insufficient_thoughts', () => {
    expect(canBuyRunUpgrade(s({ transcendenceCount: 1, thoughts: 50_000 }), 'eco_ancestral').reason).toBe('insufficient_thoughts');
  });

  test('already owned → already_owned', () => {
    expect(canBuyRunUpgrade(s({ transcendenceCount: 1, thoughts: 200_000, runUpgradesPurchased: ['eco_ancestral'] }), 'eco_ancestral').reason).toBe('already_owned');
  });
});

describe('tryBuyRunUpgrade', () => {
  test('successful buy: thoughts debited, id appended', () => {
    const before = s({ transcendenceCount: 1, thoughts: 250_000 });
    const { bought, state } = tryBuyRunUpgrade(before, 'eco_ancestral');
    expect(bought).toBe(true);
    expect(state.thoughts).toBe(150_000);
    expect(state.runUpgradesPurchased).toContain('eco_ancestral');
  });

  test('failed buy: state unchanged', () => {
    const before = s({ transcendenceCount: 0, thoughts: 1_000_000 });
    const { bought, state } = tryBuyRunUpgrade(before, 'eco_ancestral');
    expect(bought).toBe(false);
    expect(state).toBe(before);
  });
});

describe('Consumer integrations', () => {
  test('sueno_profundo adds +4h offline cap', () => {
    const without = s({ runUpgradesPurchased: [] });
    const withRun = s({ runUpgradesPurchased: ['sueno_profundo'] });
    expect(computeOfflineCapHours(withRun) - computeOfflineCapHours(without)).toBe(4);
  });

  test('sueno_profundo + Distribuida + time_dilation stack and clamp at maxOfflineHours (16)', () => {
    const state = s({
      runUpgradesPurchased: ['sueno_profundo'],
      resonanceUpgrades: ['time_dilation'],
      upgrades: [{ id: 'consciencia_distribuida', purchased: true }],
    });
    expect(computeOfflineCapHours(state)).toBe(SYNAPSE_CONSTANTS.maxOfflineHours);
  });

  test('despertar_acelerado: threshold ×0.8 for P1-P3, identity from P4', () => {
    const without: ReadonlyArray<string> = [];
    const withRun: ReadonlyArray<string> = ['despertar_acelerado'];
    const t0_without = calculateThreshold(0, 1, without);
    const t0_with = calculateThreshold(0, 1, withRun);
    expect(t0_with / t0_without).toBeCloseTo(0.8, 6);
    const t3_with = calculateThreshold(3, 1, withRun);
    const t3_without = calculateThreshold(3, 1, without);
    expect(t3_with).toBe(t3_without);
  });

  test('runUpgradeOfflineCapBonusHours — 0 when not owned', () => {
    expect(runUpgradeOfflineCapBonusHours(s())).toBe(0);
  });

  test('runUpgradeEarlyPrestigeThresholdMult — identity when not owned', () => {
    expect(runUpgradeEarlyPrestigeThresholdMult(s(), 0)).toBe(1);
  });
});
