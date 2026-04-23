// Sprint 7.7 Phase 7.7.3 — Mastery XP dispatcher integration.
// Verifies prestige (mutation + pathway + archetype +1 each) and buyUpgrade
// (upgrade +1 per purchase) wire `applyMasteryXpGain` through to the store,
// with shard_proc_mastery multiplier applied when owned.

import { beforeEach, describe, expect, test } from 'vitest';
import { useGameStore } from '../../src/store/gameStore';
import { masteryGainMult, masteryUses } from '../../src/engine/mastery';
import { UPGRADES } from '../../src/config/upgrades';
import type { GameState } from '../../src/types/GameState';

beforeEach(() => {
  useGameStore.getState().reset();
});

function forcePrestige(timestamp: number): void {
  const result = useGameStore.getState().prestige(timestamp, true);
  expect(result.fired).toBe(true);
}

describe('Mastery XP — prestige hook', () => {
  test('prestige with active mutation grants +1 to that mutation', () => {
    useGameStore.setState({ currentMutation: { id: 'hiperestimulacion' } } as Partial<GameState>);
    forcePrestige(1_000);
    expect(masteryUses(useGameStore.getState(), 'hiperestimulacion')).toBe(1);
  });

  test('prestige with active pathway grants +1 to that pathway', () => {
    useGameStore.setState({ currentPathway: 'rapida' });
    forcePrestige(1_000);
    expect(masteryUses(useGameStore.getState(), 'rapida')).toBe(1);
  });

  test('prestige with archetype set grants +1 to that archetype', () => {
    useGameStore.setState({ archetype: 'analitica' });
    forcePrestige(1_000);
    expect(masteryUses(useGameStore.getState(), 'analitica')).toBe(1);
  });

  test('prestige with no archetype / no mutation / no pathway is a no-op for mastery', () => {
    forcePrestige(1_000);
    const s = useGameStore.getState();
    expect(Object.keys(s.mastery).length).toBe(0);
  });

  test('prestige with all three slots filled grants +1 to each', () => {
    useGameStore.setState({
      currentMutation: { id: 'meditacion' },
      currentPathway: 'profunda',
      archetype: 'empatica',
    } as Partial<GameState>);
    forcePrestige(1_000);
    const s = useGameStore.getState();
    expect(masteryUses(s, 'meditacion')).toBe(1);
    expect(masteryUses(s, 'profunda')).toBe(1);
    expect(masteryUses(s, 'empatica')).toBe(1);
  });

  test('XP accumulates across repeated prestiges', () => {
    useGameStore.setState({ currentPathway: 'rapida' });
    forcePrestige(1_000);
    // Re-set after PRESTIGE_RESET cleared currentPathway.
    useGameStore.setState({ currentPathway: 'rapida' });
    forcePrestige(2_000);
    useGameStore.setState({ currentPathway: 'rapida' });
    forcePrestige(3_000);
    expect(masteryUses(useGameStore.getState(), 'rapida')).toBe(3);
  });
});

describe('Mastery XP — buyUpgrade hook', () => {
  test('successful buyUpgrade grants +1 to that upgrade', () => {
    const upgrade = UPGRADES.find((u) => u.unlockPrestige === 0 && u.costCurrency === 'thoughts')!;
    useGameStore.setState({ thoughts: upgrade.cost * 10 });
    const result = useGameStore.getState().buyUpgrade(upgrade.id, 1_000);
    expect(result).toBe('ok');
    expect(masteryUses(useGameStore.getState(), upgrade.id)).toBe(1);
  });

  test('failed buyUpgrade does NOT grant XP (insufficient_funds)', () => {
    const upgrade = UPGRADES.find((u) => u.unlockPrestige === 0 && u.costCurrency === 'thoughts')!;
    useGameStore.setState({ thoughts: 0 });
    const result = useGameStore.getState().buyUpgrade(upgrade.id, 1_000);
    expect(result).not.toBe('ok');
    expect(masteryUses(useGameStore.getState(), upgrade.id)).toBe(0);
  });
});

describe('Mastery XP — shard_proc_mastery multiplier', () => {
  test('owning shard_proc_mastery multiplies prestige XP gains', () => {
    useGameStore.setState({
      currentPathway: 'rapida',
      memoryShardUpgrades: ['shard_proc_mastery'],
    });
    const mult = masteryGainMult(useGameStore.getState());
    forcePrestige(1_000);
    expect(masteryUses(useGameStore.getState(), 'rapida')).toBe(mult);
  });

  test('multiplier does NOT apply when the shard is not owned', () => {
    useGameStore.setState({ currentPathway: 'rapida' });
    forcePrestige(1_000);
    expect(masteryUses(useGameStore.getState(), 'rapida')).toBe(1);
  });
});

describe('Mastery — PRESERVE across prestige', () => {
  test('mastery accumulator survives prestige PRESTIGE_RESET', () => {
    useGameStore.setState({ mastery: { 'hiperestimulacion': 5 } });
    useGameStore.setState({ currentMutation: { id: 'hiperestimulacion' } } as Partial<GameState>);
    forcePrestige(1_000);
    // Pre-existing 5 + fresh +1 = 6.
    expect(masteryUses(useGameStore.getState(), 'hiperestimulacion')).toBe(6);
  });
});
