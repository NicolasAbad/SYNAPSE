// @vitest-environment jsdom
// Tests for src/ui/hud/PendingDecisionFlow.tsx (Sprint 4b Phase 4b.5).
// End-to-end: pattern acquired → modal appears → A/B choice → store updated.

import { afterEach, describe, expect, test } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { PendingDecisionFlow } from '../../../src/ui/hud/PendingDecisionFlow';
import { useGameStore } from '../../../src/store/gameStore';

afterEach(() => {
  cleanup();
  useGameStore.getState().reset();
});

function mkPatterns(indices: number[], decisionIndices: Set<number>) {
  return indices.map((i) => ({
    index: i,
    isDecisionNode: decisionIndices.has(i),
    acquiredAt: 1000,
  }));
}

describe('PendingDecisionFlow — visibility gate', () => {
  test('no modal when no decision-node pattern acquired', () => {
    useGameStore.setState({ patterns: mkPatterns([0, 1, 2], new Set()) });
    const { queryByTestId } = render(<PendingDecisionFlow />);
    expect(queryByTestId('decision-modal-6')).toBeNull();
  });

  test('modal appears when decision-node pattern acquired + no choice yet', () => {
    useGameStore.setState({
      patterns: mkPatterns([0, 1, 2, 3, 4, 5, 6], new Set([6])),
      patternDecisions: {},
    });
    const { getByTestId } = render(<PendingDecisionFlow />);
    expect(getByTestId('decision-modal-6')).toBeTruthy();
  });

  test('no modal when decision already locked in', () => {
    useGameStore.setState({
      patterns: mkPatterns([0, 1, 2, 3, 4, 5, 6], new Set([6])),
      patternDecisions: { 6: 'A' },
    });
    const { queryByTestId } = render(<PendingDecisionFlow />);
    expect(queryByTestId('decision-modal-6')).toBeNull();
  });
});

describe('PendingDecisionFlow — priority is lowest-index-first', () => {
  test('shows node 6 modal first when both 6 and 15 are pending', () => {
    useGameStore.setState({
      patterns: mkPatterns([6, 15], new Set([6, 15])),
      patternDecisions: {},
    });
    const { getByTestId, queryByTestId } = render(<PendingDecisionFlow />);
    expect(getByTestId('decision-modal-6')).toBeTruthy();
    expect(queryByTestId('decision-modal-15')).toBeNull();
  });

  test('advances to node 15 after node 6 is resolved', () => {
    useGameStore.setState({
      patterns: mkPatterns([6, 15], new Set([6, 15])),
      patternDecisions: {},
    });
    const { getByTestId, queryByTestId } = render(<PendingDecisionFlow />);
    fireEvent.pointerDown(getByTestId('decision-6-A'));
    expect(queryByTestId('decision-modal-6')).toBeNull();
    expect(getByTestId('decision-modal-15')).toBeTruthy();
  });
});

describe('PendingDecisionFlow — choice side-effects via store', () => {
  test('choosing A on node 6 writes patternDecisions[6] = A', () => {
    useGameStore.setState({
      patterns: mkPatterns([6], new Set([6])),
      patternDecisions: {},
    });
    const { getByTestId } = render(<PendingDecisionFlow />);
    fireEvent.pointerDown(getByTestId('decision-6-A'));
    expect(useGameStore.getState().patternDecisions[6]).toBe('A');
    // A does NOT affect dischargeMaxCharges.
    expect(useGameStore.getState().dischargeMaxCharges).toBe(2);
  });

  test('choosing B on node 6 bumps dischargeMaxCharges by +1', () => {
    useGameStore.setState({
      patterns: mkPatterns([6], new Set([6])),
      patternDecisions: {},
      dischargeMaxCharges: 2,
    });
    const { getByTestId } = render(<PendingDecisionFlow />);
    fireEvent.pointerDown(getByTestId('decision-6-B'));
    expect(useGameStore.getState().patternDecisions[6]).toBe('B');
    expect(useGameStore.getState().dischargeMaxCharges).toBe(3);
  });
});
