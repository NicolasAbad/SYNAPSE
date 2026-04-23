// @vitest-environment jsdom
// Sprint 3 Phase 7 — tutorial hint stack (UI-9 hint 1 + Sprint 3 hints 2/3/4).

import { afterEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { TutorialHints } from '../../../src/ui/modals/TutorialHints';
import { SYNAPSE_CONSTANTS } from '../../../src/config/constants';
import { NEURON_CONFIG, neuronCost } from '../../../src/config/neurons';
import { useGameStore } from '../../../src/store/gameStore';
import type { NeuronType } from '../../../src/types';

function setBasicaCount(count: number): void {
  const state = useGameStore.getState();
  useGameStore.setState({
    neurons: state.neurons.map((n) => (n.type === 'basica' ? { ...n, count } : n)),
  });
}

function setNeuronCount(type: NeuronType, count: number): void {
  const state = useGameStore.getState();
  useGameStore.setState({
    neurons: state.neurons.map((n) => (n.type === type ? { ...n, count } : n)),
  });
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  useGameStore.getState().reset();
});

describe('TutorialHints — hint 1 (tap)', () => {
  test('does NOT show immediately', () => {
    vi.useFakeTimers();
    const { queryByTestId } = render(<TutorialHints />);
    expect(queryByTestId('tutorial-hint')).toBeNull();
  });

  test('shows after firstOpenTutorialHintIdleMs when isTutorialCycle=true', () => {
    vi.useFakeTimers();
    const { queryByTestId } = render(<TutorialHints />);
    act(() => {
      vi.advanceTimersByTime(SYNAPSE_CONSTANTS.firstOpenTutorialHintIdleMs);
    });
    expect(queryByTestId('tutorial-hint')?.textContent).toBe('Tap the neuron');
  });

  test('does NOT show if isTutorialCycle=false', () => {
    vi.useFakeTimers();
    useGameStore.setState({ isTutorialCycle: false });
    const { queryByTestId } = render(<TutorialHints />);
    act(() => {
      vi.advanceTimersByTime(SYNAPSE_CONSTANTS.firstOpenTutorialHintIdleMs * 3);
    });
    expect(queryByTestId('tutorial-hint')).toBeNull();
  });

  test('dismisses on pointerdown', () => {
    vi.useFakeTimers();
    const { queryByTestId } = render(<TutorialHints />);
    act(() => {
      vi.advanceTimersByTime(SYNAPSE_CONSTANTS.firstOpenTutorialHintIdleMs);
    });
    expect(queryByTestId('tutorial-hint')).not.toBeNull();
    act(() => {
      fireEvent.pointerDown(document);
    });
    expect(queryByTestId('tutorial-hint')).toBeNull();
  });
});

describe('TutorialHints — hint 2 (buy)', () => {
  test('shows when thoughts >= cost and basica count === 1 (after first tap)', () => {
    vi.useFakeTimers();
    const { queryByTestId } = render(<TutorialHints />);
    act(() => {
      vi.advanceTimersByTime(SYNAPSE_CONSTANTS.firstOpenTutorialHintIdleMs);
      fireEvent.pointerDown(document);
    });
    act(() => {
      useGameStore.setState({ thoughts: neuronCost('basica', 1) });
    });
    expect(queryByTestId('tutorial-hint-buy')?.textContent).toBe('Buy your first neuron');
  });

  test('auto-dismisses when player buys a second Basica (count becomes 2)', () => {
    vi.useFakeTimers();
    const { queryByTestId } = render(<TutorialHints />);
    act(() => {
      vi.advanceTimersByTime(SYNAPSE_CONSTANTS.firstOpenTutorialHintIdleMs);
      fireEvent.pointerDown(document);
    });
    act(() => {
      useGameStore.setState({ thoughts: neuronCost('basica', 1) });
    });
    expect(queryByTestId('tutorial-hint-buy')).not.toBeNull();
    act(() => {
      setBasicaCount(2);
    });
    expect(queryByTestId('tutorial-hint-buy')).toBeNull();
  });

  test('does NOT show when thoughts below cost', () => {
    vi.useFakeTimers();
    const { queryByTestId } = render(<TutorialHints />);
    act(() => {
      vi.advanceTimersByTime(SYNAPSE_CONSTANTS.firstOpenTutorialHintIdleMs);
      fireEvent.pointerDown(document);
    });
    act(() => {
      useGameStore.setState({ thoughts: neuronCost('basica', 1) - 1 });
    });
    expect(queryByTestId('tutorial-hint-buy')).toBeNull();
  });
});

describe('TutorialHints — hint 3 (discharge)', () => {
  test('shows when dischargeCharges > 0 and cycleDischargesUsed === 0', () => {
    vi.useFakeTimers();
    // Suppress hint 1 by dismissing first.
    const { queryByTestId } = render(<TutorialHints />);
    act(() => {
      vi.advanceTimersByTime(SYNAPSE_CONSTANTS.firstOpenTutorialHintIdleMs);
      fireEvent.pointerDown(document);
    });
    act(() => {
      useGameStore.setState({ dischargeCharges: 1, cycleDischargesUsed: 0 });
    });
    expect(queryByTestId('tutorial-hint-discharge')?.textContent).toBe('Use Discharge');
  });

  test('auto-dismisses after first Discharge (cycleDischargesUsed >= 1)', () => {
    vi.useFakeTimers();
    const { queryByTestId } = render(<TutorialHints />);
    act(() => {
      vi.advanceTimersByTime(SYNAPSE_CONSTANTS.firstOpenTutorialHintIdleMs);
      fireEvent.pointerDown(document);
    });
    act(() => {
      useGameStore.setState({ dischargeCharges: 1, cycleDischargesUsed: 0 });
    });
    expect(queryByTestId('tutorial-hint-discharge')).not.toBeNull();
    act(() => {
      useGameStore.setState({ cycleDischargesUsed: 1 });
    });
    expect(queryByTestId('tutorial-hint-discharge')).toBeNull();
  });
});

describe('TutorialHints — hint 4 (variety, Decision B)', () => {
  test('shows when basica >= Sensorial unlock threshold and can afford Sensorial', () => {
    vi.useFakeTimers();
    const { queryByTestId } = render(<TutorialHints />);
    act(() => {
      vi.advanceTimersByTime(SYNAPSE_CONSTANTS.firstOpenTutorialHintIdleMs);
      fireEvent.pointerDown(document);
    });
    const unlock = NEURON_CONFIG.sensorial.unlock;
    const threshold = unlock.kind === 'neuron_count' ? unlock.count : 0;
    act(() => {
      setBasicaCount(threshold);
      useGameStore.setState({ thoughts: neuronCost('sensorial', 0) });
    });
    expect(queryByTestId('tutorial-hint-variety')?.textContent).toBe(
      'Buy a different type for +5% production',
    );
  });

  test('auto-dismisses after first Sensorial purchased', () => {
    vi.useFakeTimers();
    const { queryByTestId } = render(<TutorialHints />);
    act(() => {
      vi.advanceTimersByTime(SYNAPSE_CONSTANTS.firstOpenTutorialHintIdleMs);
      fireEvent.pointerDown(document);
    });
    const unlock = NEURON_CONFIG.sensorial.unlock;
    const threshold = unlock.kind === 'neuron_count' ? unlock.count : 0;
    act(() => {
      setBasicaCount(threshold);
      useGameStore.setState({ thoughts: neuronCost('sensorial', 0) });
    });
    expect(queryByTestId('tutorial-hint-variety')).not.toBeNull();
    act(() => {
      setNeuronCount('sensorial', 1);
    });
    expect(queryByTestId('tutorial-hint-variety')).toBeNull();
  });

  test('does NOT show before Sensorial unlock threshold reached', () => {
    vi.useFakeTimers();
    const { queryByTestId } = render(<TutorialHints />);
    act(() => {
      vi.advanceTimersByTime(SYNAPSE_CONSTANTS.firstOpenTutorialHintIdleMs);
      fireEvent.pointerDown(document);
    });
    const unlock = NEURON_CONFIG.sensorial.unlock;
    const threshold = unlock.kind === 'neuron_count' ? unlock.count : 0;
    act(() => {
      setBasicaCount(threshold - 1);
      useGameStore.setState({ thoughts: neuronCost('sensorial', 0) });
    });
    expect(queryByTestId('tutorial-hint-variety')).toBeNull();
  });
});

describe('TutorialHints — Sprint 7.6 cycle 2-5 extension (§37)', () => {
  test('cycle 2 (prestigeCount=1 + sparks>0 + cycleUpgradesBought=0) → upgrades_tab hint', () => {
    useGameStore.setState({ isTutorialCycle: false, prestigeCount: 1, sparks: 5, cycleUpgradesBought: 0 });
    const { queryByTestId } = render(<TutorialHints />);
    expect(queryByTestId('tutorial-hint-upgrades-tab')?.textContent).toBe('Spend Sparks in the Upgrades tab');
  });

  test('cycle 2 hint auto-dismisses after a cycle upgrade is bought', () => {
    useGameStore.setState({ isTutorialCycle: false, prestigeCount: 1, sparks: 5, cycleUpgradesBought: 0 });
    const { queryByTestId } = render(<TutorialHints />);
    expect(queryByTestId('tutorial-hint-upgrades-tab')).not.toBeNull();
    act(() => {
      useGameStore.setState({ cycleUpgradesBought: 1 });
    });
    expect(queryByTestId('tutorial-hint-upgrades-tab')).toBeNull();
  });

  test('cycle 3 (prestigeCount=2 + focusBar < cascadeThreshold + no discharge yet) → focus_discharge hint', () => {
    useGameStore.setState({ isTutorialCycle: false, prestigeCount: 2, focusBar: 0, cycleDischargesUsed: 0 });
    const { queryByTestId } = render(<TutorialHints />);
    expect(queryByTestId('tutorial-hint-focus-discharge')?.textContent).toBe('Fill Focus to 75% for a Cascade burst');
  });

  test('cycle 3 hint auto-dismisses after the player Discharges', () => {
    useGameStore.setState({ isTutorialCycle: false, prestigeCount: 2, focusBar: 0, cycleDischargesUsed: 0 });
    const { queryByTestId } = render(<TutorialHints />);
    expect(queryByTestId('tutorial-hint-focus-discharge')).not.toBeNull();
    act(() => {
      useGameStore.setState({ cycleDischargesUsed: 1 });
    });
    expect(queryByTestId('tutorial-hint-focus-discharge')).toBeNull();
  });

  test('cycle 4 (prestigeCount=3 + threshold reached + no polarity) → polarity hint', () => {
    useGameStore.setState({ isTutorialCycle: false, prestigeCount: 3, cycleGenerated: 1_000_000, currentThreshold: 1_000_000, currentPolarity: null });
    const { queryByTestId } = render(<TutorialHints />);
    expect(queryByTestId('tutorial-hint-polarity')?.textContent).toBe('Before Awakening, pick a Polarity');
  });

  test('cycle 4 hint auto-dismisses once Polarity is chosen', () => {
    useGameStore.setState({ isTutorialCycle: false, prestigeCount: 3, cycleGenerated: 1_000_000, currentThreshold: 1_000_000, currentPolarity: null });
    const { queryByTestId } = render(<TutorialHints />);
    expect(queryByTestId('tutorial-hint-polarity')).not.toBeNull();
    act(() => {
      useGameStore.setState({ currentPolarity: 'excitatory' });
    });
    expect(queryByTestId('tutorial-hint-polarity')).toBeNull();
  });

  test('cycle 5 (prestigeCount=4) → patterns_hipocampo reveal hint', () => {
    useGameStore.setState({ isTutorialCycle: false, prestigeCount: 4 });
    const { queryByTestId } = render(<TutorialHints />);
    expect(queryByTestId('tutorial-hint-patterns-hipocampo')?.textContent).toBe(
      'Mind tab: Patterns tree + Hipocampo shards are live',
    );
  });

  test('post-tutorial (prestigeCount=5+) renders no tutorial-track hint', () => {
    useGameStore.setState({ isTutorialCycle: false, prestigeCount: 5, sparks: 99, cycleUpgradesBought: 0 });
    const { queryByTestId } = render(<TutorialHints />);
    expect(queryByTestId('tutorial-hint-upgrades-tab')).toBeNull();
    expect(queryByTestId('tutorial-hint-focus-discharge')).toBeNull();
    expect(queryByTestId('tutorial-hint-polarity')).toBeNull();
    expect(queryByTestId('tutorial-hint-patterns-hipocampo')).toBeNull();
  });
});

describe('TutorialHints — priority', () => {
  test('hint 1 (tap) wins over hint 2 (buy) when both predicates hold', () => {
    vi.useFakeTimers();
    // Pre-set thoughts so hint 2 predicate is true, but hint 1 is still
    // active (no pointerdown yet).
    useGameStore.setState({ thoughts: neuronCost('basica', 1) });
    const { queryByTestId } = render(<TutorialHints />);
    act(() => {
      vi.advanceTimersByTime(SYNAPSE_CONSTANTS.firstOpenTutorialHintIdleMs);
    });
    expect(queryByTestId('tutorial-hint')?.textContent).toBe('Tap the neuron');
    expect(queryByTestId('tutorial-hint-buy')).toBeNull();
  });

  test('hint 2 (buy) wins over hint 3 (discharge) when both predicates hold', () => {
    vi.useFakeTimers();
    const { queryByTestId } = render(<TutorialHints />);
    act(() => {
      vi.advanceTimersByTime(SYNAPSE_CONSTANTS.firstOpenTutorialHintIdleMs);
      fireEvent.pointerDown(document);
    });
    act(() => {
      useGameStore.setState({
        thoughts: neuronCost('basica', 1),
        dischargeCharges: 1,
        cycleDischargesUsed: 0,
      });
    });
    expect(queryByTestId('tutorial-hint-buy')).not.toBeNull();
    expect(queryByTestId('tutorial-hint-discharge')).toBeNull();
  });

  test('no hints rendered after isTutorialCycle flips false mid-session', () => {
    vi.useFakeTimers();
    const { queryByTestId } = render(<TutorialHints />);
    act(() => {
      vi.advanceTimersByTime(SYNAPSE_CONSTANTS.firstOpenTutorialHintIdleMs);
      fireEvent.pointerDown(document);
    });
    act(() => {
      useGameStore.setState({
        isTutorialCycle: false,
        thoughts: neuronCost('basica', 1),
      });
    });
    expect(queryByTestId('tutorial-hint')).toBeNull();
    expect(queryByTestId('tutorial-hint-buy')).toBeNull();
    expect(queryByTestId('tutorial-hint-discharge')).toBeNull();
    expect(queryByTestId('tutorial-hint-variety')).toBeNull();
  });
});
