// Sprint 4b Phase 4b.4 — Zustand resetPatternDecisions action (PAT-3).
// Double-confirmation is a UI concern; this action fires immediately when
// called, but only if the Resonance gate is met.

import { beforeEach, describe, expect, test } from 'vitest';
import { useGameStore } from '../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';

describe('useGameStore.resetPatternDecisions — Resonance gate (GDD §10 PAT-3)', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  test('returns { fired: false } when resonance < patternResetCostResonance', () => {
    useGameStore.setState({ resonance: SYNAPSE_CONSTANTS.patternResetCostResonance - 1, patternDecisions: { 6: 'A' } });
    const result = useGameStore.getState().resetPatternDecisions();
    expect(result.fired).toBe(false);
    // State untouched.
    expect(useGameStore.getState().patternDecisions).toEqual({ 6: 'A' });
  });

  test('fires when resonance exactly equals the cost', () => {
    useGameStore.setState({ resonance: SYNAPSE_CONSTANTS.patternResetCostResonance, patternDecisions: { 6: 'A' } });
    const result = useGameStore.getState().resetPatternDecisions();
    expect(result.fired).toBe(true);
    expect(useGameStore.getState().resonance).toBe(0);
    expect(useGameStore.getState().patternDecisions).toEqual({});
  });

  test('consumes exactly patternResetCostResonance when firing', () => {
    useGameStore.setState({
      resonance: SYNAPSE_CONSTANTS.patternResetCostResonance + 500,
      patternDecisions: { 6: 'A', 15: 'B', 24: 'A' },
    });
    useGameStore.getState().resetPatternDecisions();
    expect(useGameStore.getState().resonance).toBe(500);
  });
});

describe('useGameStore.resetPatternDecisions — Node 6 B state rollback', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  test('reverses the dischargeMaxCharges +1 bump if 6 B was chosen', () => {
    useGameStore.setState({
      resonance: SYNAPSE_CONSTANTS.patternResetCostResonance,
      patternDecisions: { 6: 'B' },
      dischargeMaxCharges: 3, // 2 base + 1 decision
    });
    useGameStore.getState().resetPatternDecisions();
    expect(useGameStore.getState().dischargeMaxCharges).toBe(2);
  });

  test('does NOT touch dischargeMaxCharges if 6 B was not chosen', () => {
    useGameStore.setState({
      resonance: SYNAPSE_CONSTANTS.patternResetCostResonance,
      patternDecisions: { 6: 'A' },
      dischargeMaxCharges: 5, // say upgrades got it there
    });
    useGameStore.getState().resetPatternDecisions();
    expect(useGameStore.getState().dischargeMaxCharges).toBe(5);
  });

  test('clears patternDecisions regardless of which keys were set', () => {
    useGameStore.setState({
      resonance: SYNAPSE_CONSTANTS.patternResetCostResonance,
      patternDecisions: { 6: 'A', 15: 'B', 24: 'A', 36: 'B', 48: 'A' },
    });
    useGameStore.getState().resetPatternDecisions();
    expect(useGameStore.getState().patternDecisions).toEqual({});
  });
});

describe('useGameStore.resetPatternDecisions — Zustand pitfall compliance', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  test('action references preserved after reset (no `true` flag used)', () => {
    useGameStore.setState({ resonance: SYNAPSE_CONSTANTS.patternResetCostResonance });
    const beforeRefs = {
      prestige: useGameStore.getState().prestige,
      resetPatternDecisions: useGameStore.getState().resetPatternDecisions,
    };
    useGameStore.getState().resetPatternDecisions();
    expect(useGameStore.getState().prestige).toBe(beforeRefs.prestige);
    expect(useGameStore.getState().resetPatternDecisions).toBe(beforeRefs.resetPatternDecisions);
  });
});
