// Sprint 4c Phase 4c.1 — Zustand setPolarity action (GDD §11 POLAR-1).

import { beforeEach, describe, expect, test } from 'vitest';
import { useGameStore } from '../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';

describe('useGameStore.setPolarity — P3+ unlock gate (POLAR-1)', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  test('rejects when prestigeCount < polarityUnlockPrestige (P0-P2)', () => {
    for (const pc of [0, 1, 2]) {
      useGameStore.getState().reset();
      useGameStore.setState({ prestigeCount: pc });
      const result = useGameStore.getState().setPolarity('excitatory');
      expect(result.fired).toBe(false);
      expect(useGameStore.getState().currentPolarity).toBeNull();
    }
  });

  test('fires at prestigeCount === polarityUnlockPrestige (P3)', () => {
    useGameStore.setState({ prestigeCount: SYNAPSE_CONSTANTS.polarityUnlockPrestige });
    const result = useGameStore.getState().setPolarity('excitatory');
    expect(result.fired).toBe(true);
    expect(useGameStore.getState().currentPolarity).toBe('excitatory');
  });

  test('fires at prestigeCount > polarityUnlockPrestige', () => {
    useGameStore.setState({ prestigeCount: 10 });
    const result = useGameStore.getState().setPolarity('inhibitory');
    expect(result.fired).toBe(true);
    expect(useGameStore.getState().currentPolarity).toBe('inhibitory');
  });
});

describe('useGameStore.setPolarity — switching between polarities mid-cycle', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  test('can flip from excitatory to inhibitory within the same cycle', () => {
    useGameStore.setState({ prestigeCount: 3 });
    useGameStore.getState().setPolarity('excitatory');
    expect(useGameStore.getState().currentPolarity).toBe('excitatory');
    useGameStore.getState().setPolarity('inhibitory');
    expect(useGameStore.getState().currentPolarity).toBe('inhibitory');
  });
});

describe('useGameStore.setPolarity — Zustand pitfall compliance', () => {
  test('action references preserved (merge-mode setState)', () => {
    useGameStore.setState({ prestigeCount: 3 });
    const beforeRefs = {
      prestige: useGameStore.getState().prestige,
      setPolarity: useGameStore.getState().setPolarity,
    };
    useGameStore.getState().setPolarity('excitatory');
    expect(useGameStore.getState().prestige).toBe(beforeRefs.prestige);
    expect(useGameStore.getState().setPolarity).toBe(beforeRefs.setPolarity);
  });
});
