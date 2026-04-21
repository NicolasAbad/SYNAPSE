// @vitest-environment jsdom
// Tests for src/ui/panels/PatternTreeView.tsx (Sprint 4b Phase 4b.4).
// Pattern Tree viz + PAT-3 double-confirmation reset flow.

import { afterEach, describe, expect, test } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { PatternTreeView } from '../../../src/ui/panels/PatternTreeView';
import { useGameStore } from '../../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../../src/config/constants';

afterEach(() => {
  cleanup();
  useGameStore.getState().reset();
});

describe('PatternTreeView — header + grid', () => {
  test('renders 50 cells (patternTreeSize)', () => {
    const { container } = render(<PatternTreeView />);
    const cells = container.querySelectorAll('[data-testid^="pattern-cell-"]');
    expect(cells.length).toBe(SYNAPSE_CONSTANTS.patternTreeSize);
  });

  test('header shows current progress "X / 50 patterns"', () => {
    useGameStore.setState({ totalPatterns: 12 });
    const { getByTestId } = render(<PatternTreeView />);
    const header = getByTestId('pattern-tree-header');
    expect(header.textContent).toContain('12 / 50');
  });

  test('acquired non-decision cells render with filled background', () => {
    useGameStore.setState({
      patterns: [{ index: 0, isDecisionNode: false, acquiredAt: 0 }],
      totalPatterns: 1,
    });
    const { getByTestId } = render(<PatternTreeView />);
    const cell = getByTestId('pattern-cell-0');
    expect(cell.getAttribute('data-pending')).toBe('false');
  });

  test('acquired decision cell WITHOUT decision renders as pending', () => {
    useGameStore.setState({
      patterns: [...Array(7)].map((_, i) => ({
        index: i,
        isDecisionNode: i === 6,
        acquiredAt: 0,
      })),
      totalPatterns: 7,
    });
    const { getByTestId } = render(<PatternTreeView />);
    const cell = getByTestId('pattern-cell-6');
    expect(cell.getAttribute('data-pending')).toBe('true');
    expect(cell.textContent).toBe('?');
  });

  test('acquired decision cell with decision shows "A" or "B"', () => {
    useGameStore.setState({
      patterns: [...Array(7)].map((_, i) => ({
        index: i,
        isDecisionNode: i === 6,
        acquiredAt: 0,
      })),
      totalPatterns: 7,
      patternDecisions: { 6: 'A' },
    });
    const { getByTestId } = render(<PatternTreeView />);
    const cell = getByTestId('pattern-cell-6');
    expect(cell.getAttribute('data-decision')).toBe('A');
    expect(cell.textContent).toBe('A');
  });
});

describe('PatternTreeView — PAT-3 reset button', () => {
  test('disabled when resonance < cost OR no decisions made', () => {
    useGameStore.setState({ resonance: 500, patternDecisions: {} });
    const { getByTestId } = render(<PatternTreeView />);
    expect((getByTestId('pattern-reset-button') as HTMLButtonElement).disabled).toBe(true);
  });

  test('enabled when resonance ≥ cost AND at least one decision made', () => {
    useGameStore.setState({
      resonance: SYNAPSE_CONSTANTS.patternResetCostResonance,
      patternDecisions: { 6: 'A' },
    });
    const { getByTestId } = render(<PatternTreeView />);
    expect((getByTestId('pattern-reset-button') as HTMLButtonElement).disabled).toBe(false);
  });

  test('disabled when resonance ≥ cost but NO decisions made', () => {
    useGameStore.setState({
      resonance: SYNAPSE_CONSTANTS.patternResetCostResonance,
      patternDecisions: {},
    });
    const { getByTestId } = render(<PatternTreeView />);
    expect((getByTestId('pattern-reset-button') as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('PatternTreeView — double-confirmation flow (PAT-3)', () => {
  function setupReadyState() {
    useGameStore.setState({
      resonance: SYNAPSE_CONSTANTS.patternResetCostResonance,
      patternDecisions: { 6: 'B' },
      dischargeMaxCharges: 3,
    });
  }

  test('first click opens stage 1 confirm modal', () => {
    setupReadyState();
    const { getByTestId, queryByTestId } = render(<PatternTreeView />);
    expect(queryByTestId('pattern-reset-1-root')).toBeNull();
    fireEvent.pointerDown(getByTestId('pattern-reset-button'));
    expect(getByTestId('pattern-reset-1-root')).toBeTruthy();
  });

  test('stage 1 confirm opens stage 2 confirm', () => {
    setupReadyState();
    const { getByTestId, queryByTestId } = render(<PatternTreeView />);
    fireEvent.pointerDown(getByTestId('pattern-reset-button'));
    fireEvent.pointerDown(getByTestId('pattern-reset-1-confirm'));
    expect(queryByTestId('pattern-reset-1-root')).toBeNull();
    expect(getByTestId('pattern-reset-2-root')).toBeTruthy();
  });

  test('stage 1 cancel does NOT fire reset and closes modal', () => {
    setupReadyState();
    const { getByTestId, queryByTestId } = render(<PatternTreeView />);
    fireEvent.pointerDown(getByTestId('pattern-reset-button'));
    fireEvent.pointerDown(getByTestId('pattern-reset-1-cancel'));
    expect(queryByTestId('pattern-reset-1-root')).toBeNull();
    // State untouched.
    expect(useGameStore.getState().patternDecisions).toEqual({ 6: 'B' });
    expect(useGameStore.getState().resonance).toBe(SYNAPSE_CONSTANTS.patternResetCostResonance);
  });

  test('stage 2 cancel does NOT fire reset', () => {
    setupReadyState();
    const { getByTestId } = render(<PatternTreeView />);
    fireEvent.pointerDown(getByTestId('pattern-reset-button'));
    fireEvent.pointerDown(getByTestId('pattern-reset-1-confirm'));
    fireEvent.pointerDown(getByTestId('pattern-reset-2-cancel'));
    expect(useGameStore.getState().patternDecisions).toEqual({ 6: 'B' });
    expect(useGameStore.getState().resonance).toBe(SYNAPSE_CONSTANTS.patternResetCostResonance);
  });

  test('stage 2 confirm fires reset — clears decisions, drains resonance, reverses 6B bump', () => {
    setupReadyState();
    const { getByTestId } = render(<PatternTreeView />);
    fireEvent.pointerDown(getByTestId('pattern-reset-button'));
    fireEvent.pointerDown(getByTestId('pattern-reset-1-confirm'));
    fireEvent.pointerDown(getByTestId('pattern-reset-2-confirm'));
    expect(useGameStore.getState().patternDecisions).toEqual({});
    expect(useGameStore.getState().resonance).toBe(0);
    expect(useGameStore.getState().dischargeMaxCharges).toBe(2); // 3 - 1 (6B rollback)
  });
});
