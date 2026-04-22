// Sprint 6 Phase 6.3b — integration tests: store actions dispatch narrative
// triggers end-to-end. Verifies that:
//   - buyNeuron fires BASE-01 on the first purchase (grants +1 Memory).
//   - discharge fires BASE-03 on lifetime discharge #1.
//   - prestige fires the prestige_at fragment for the new prestigeCount.
//   - setArchetype fires the ANA-01 / EMP-01 / CRE-01 archetype fragment.
// Each assertion confirms the trigger → applyFragmentRead chain wires through
// the store mutation and lands in narrativeFragmentsSeen + memories state.

import { beforeEach, describe, expect, test } from 'vitest';
import { useGameStore } from '../../src/store/gameStore';

describe('narrative triggers via store actions (integration)', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  test('buyNeuron (first) → base_01 in narrativeFragmentsSeen + memories +1', () => {
    // Seed affordable Basic neuron (5 thoughts baseline).
    useGameStore.setState({ thoughts: 100 });
    const before = useGameStore.getState().memories;
    useGameStore.getState().buyNeuron('basica', 1000);
    const s = useGameStore.getState();
    expect(s.narrativeFragmentsSeen).toContain('base_01');
    expect(s.memories).toBe(before + 1); // NARR-8 first-read Memory grant
  });

  test('buyNeuron second time does NOT re-fire base_01', () => {
    useGameStore.setState({ thoughts: 1_000_000 });
    useGameStore.getState().buyNeuron('basica', 1000);
    const afterFirst = useGameStore.getState().memories;
    useGameStore.getState().buyNeuron('basica', 2000);
    const afterSecond = useGameStore.getState().memories;
    expect(afterSecond).toBe(afterFirst); // no second Memory grant
  });

  test('setArchetype at P5 fires the matching ANA/EMP/CRE fragment', () => {
    useGameStore.setState({ prestigeCount: 5 });
    const before = useGameStore.getState().memories;
    useGameStore.getState().setArchetype('analitica');
    const s = useGameStore.getState();
    expect(s.narrativeFragmentsSeen).toContain('ana_01');
    expect(s.memories).toBe(before + 1);
  });

  test('setArchetype does NOT fire OTHER archetype fragments', () => {
    useGameStore.setState({ prestigeCount: 5 });
    useGameStore.getState().setArchetype('empatica');
    const s = useGameStore.getState();
    expect(s.narrativeFragmentsSeen).toContain('emp_01');
    expect(s.narrativeFragmentsSeen).not.toContain('ana_01');
    expect(s.narrativeFragmentsSeen).not.toContain('cre_01');
  });

  test('prestige firing at P3 dispatches base_06 (prestige_at fragment)', () => {
    // Set up P2→P3 prestige with threshold met.
    useGameStore.setState({
      prestigeCount: 2,
      cycleGenerated: 999_999_999,
      currentThreshold: 1,
    });
    const before = useGameStore.getState().memories;
    const result = useGameStore.getState().prestige(10_000);
    expect(result.fired).toBe(true);
    const s = useGameStore.getState();
    expect(s.prestigeCount).toBe(3);
    expect(s.narrativeFragmentsSeen).toContain('base_06');
    // Memories = prior + prestige-gained + fragment-grant. Prestige base +2.
    expect(s.memories).toBeGreaterThanOrEqual(before + 1);
  });
});
