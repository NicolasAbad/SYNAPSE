// Sprint 4b Phase 4b.5 — Zustand choosePatternDecision action.

import { beforeEach, describe, expect, test } from 'vitest';
import { useGameStore } from '../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';

describe('useGameStore.choosePatternDecision — validation', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  test('rejects non-decision-node indices', () => {
    const result = useGameStore.getState().choosePatternDecision(0, 'A');
    expect(result.fired).toBe(false);
    expect(useGameStore.getState().patternDecisions).toEqual({});
  });

  test('rejects indices outside patternDecisionNodes range', () => {
    const result = useGameStore.getState().choosePatternDecision(7, 'A');
    expect(result.fired).toBe(false);
  });

  test('accepts each of the 5 canonical decision-node indices', () => {
    for (const nodeIndex of SYNAPSE_CONSTANTS.patternDecisionNodes) {
      useGameStore.getState().reset();
      const result = useGameStore.getState().choosePatternDecision(nodeIndex, 'A');
      expect(result.fired).toBe(true);
      expect(useGameStore.getState().patternDecisions[nodeIndex]).toBe('A');
    }
  });
});

describe('useGameStore.choosePatternDecision — one-shot per node (requires PAT-3 to re-choose)', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  test('rejects a second choice on the same node', () => {
    useGameStore.getState().choosePatternDecision(6, 'A');
    const second = useGameStore.getState().choosePatternDecision(6, 'B');
    expect(second.fired).toBe(false);
    // First choice persists.
    expect(useGameStore.getState().patternDecisions[6]).toBe('A');
  });

  test('allows re-choice after PAT-3 reset', () => {
    useGameStore.setState({ resonance: SYNAPSE_CONSTANTS.patternResetCostResonance });
    useGameStore.getState().choosePatternDecision(6, 'A');
    useGameStore.getState().resetPatternDecisions();
    const retry = useGameStore.getState().choosePatternDecision(6, 'B');
    expect(retry.fired).toBe(true);
    expect(useGameStore.getState().patternDecisions[6]).toBe('B');
  });
});

describe('useGameStore.choosePatternDecision — Node 6 B dischargeMaxCharges bump', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  test('6 B adds +1 to dischargeMaxCharges immediately', () => {
    useGameStore.setState({ dischargeMaxCharges: 2 });
    useGameStore.getState().choosePatternDecision(6, 'B');
    expect(useGameStore.getState().dischargeMaxCharges).toBe(3);
  });

  test('6 A does NOT touch dischargeMaxCharges', () => {
    useGameStore.setState({ dischargeMaxCharges: 2 });
    useGameStore.getState().choosePatternDecision(6, 'A');
    expect(useGameStore.getState().dischargeMaxCharges).toBe(2);
  });

  test('other decision nodes do not bump dischargeMaxCharges', () => {
    useGameStore.setState({ dischargeMaxCharges: 2 });
    useGameStore.getState().choosePatternDecision(15, 'A');
    useGameStore.getState().choosePatternDecision(24, 'B');
    useGameStore.getState().choosePatternDecision(36, 'B');
    useGameStore.getState().choosePatternDecision(48, 'A');
    expect(useGameStore.getState().dischargeMaxCharges).toBe(2);
  });
});
