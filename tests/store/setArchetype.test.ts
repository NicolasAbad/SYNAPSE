// Sprint 6 Phase 6.2 — setArchetype action tests (GDD §12 permanence).

import { beforeEach, describe, expect, test } from 'vitest';
import { useGameStore } from '../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';

describe('useGameStore.setArchetype — P7+ unlock gate (Sprint 7.6 migration)', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  test('rejects when prestigeCount < archetypeUnlockPrestige (P0-P6)', () => {
    const unlock = SYNAPSE_CONSTANTS.archetypeUnlockPrestige;
    for (let pc = 0; pc < unlock; pc++) {
      useGameStore.getState().reset();
      useGameStore.setState({ prestigeCount: pc });
      const result = useGameStore.getState().setArchetype('analitica');
      expect(result.fired).toBe(false);
      expect(useGameStore.getState().archetype).toBeNull();
      expect(useGameStore.getState().archetypeHistory).toEqual([]);
    }
  });

  test('fires at prestigeCount === archetypeUnlockPrestige (P7)', () => {
    useGameStore.setState({ prestigeCount: SYNAPSE_CONSTANTS.archetypeUnlockPrestige });
    const result = useGameStore.getState().setArchetype('analitica');
    expect(result.fired).toBe(true);
    expect(useGameStore.getState().archetype).toBe('analitica');
    expect(useGameStore.getState().archetypeHistory).toEqual(['analitica']);
  });

  test('fires at prestigeCount > archetypeUnlockPrestige', () => {
    useGameStore.setState({ prestigeCount: SYNAPSE_CONSTANTS.archetypeUnlockPrestige + 3 });
    const result = useGameStore.getState().setArchetype('empatica');
    expect(result.fired).toBe(true);
    expect(useGameStore.getState().archetype).toBe('empatica');
  });
});

describe('useGameStore.setArchetype — irreversibility (GDD §12)', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
    useGameStore.setState({ prestigeCount: SYNAPSE_CONSTANTS.archetypeUnlockPrestige });
  });

  test('second call returns fired=false once archetype is already set', () => {
    const first = useGameStore.getState().setArchetype('analitica');
    expect(first.fired).toBe(true);
    expect(useGameStore.getState().archetype).toBe('analitica');

    const second = useGameStore.getState().setArchetype('creativa');
    expect(second.fired).toBe(false);
    expect(useGameStore.getState().archetype).toBe('analitica');
  });

  test('archetypeHistory keeps the single selection', () => {
    useGameStore.getState().setArchetype('creativa');
    useGameStore.getState().setArchetype('empatica'); // rejected
    useGameStore.getState().setArchetype('analitica'); // rejected
    expect(useGameStore.getState().archetypeHistory).toEqual(['creativa']);
  });

  test('a manual null reset (e.g. Transcendence) unblocks re-selection', () => {
    useGameStore.getState().setArchetype('analitica');
    // Simulate Transcendence clearing the archetype — see GDD §34 TRANSCENDENCE_RESET.
    useGameStore.setState({ archetype: null });
    const again = useGameStore.getState().setArchetype('empatica');
    expect(again.fired).toBe(true);
    expect(useGameStore.getState().archetype).toBe('empatica');
    expect(useGameStore.getState().archetypeHistory).toEqual(['analitica', 'empatica']);
  });
});

describe('useGameStore.setArchetype — Zustand pitfall compliance', () => {
  test('action references preserved (merge-mode setState)', () => {
    useGameStore.setState({ prestigeCount: SYNAPSE_CONSTANTS.archetypeUnlockPrestige });
    const beforeRefs = {
      prestige: useGameStore.getState().prestige,
      setArchetype: useGameStore.getState().setArchetype,
    };
    useGameStore.getState().setArchetype('analitica');
    expect(useGameStore.getState().prestige).toBe(beforeRefs.prestige);
    expect(useGameStore.getState().setArchetype).toBe(beforeRefs.setArchetype);
  });
});
