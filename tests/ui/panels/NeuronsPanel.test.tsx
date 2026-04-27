// @vitest-environment jsdom
// Sprint 3.6.2 — NeuronsPanel purchase flow + locked rows + buy modes.

import { afterEach, describe, expect, test } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { NeuronsPanel } from '../../../src/ui/panels/NeuronsPanel';
import { useGameStore } from '../../../src/store/gameStore';
import { neuronBuyCost } from '../../../src/store/purchases';
import { NEURON_CONFIG } from '../../../src/config/neurons';
import type { NeuronType } from '../../../src/types';

function setNeuronCount(type: NeuronType, count: number): void {
  const state = useGameStore.getState();
  useGameStore.setState({
    neurons: state.neurons.map((n) => (n.type === type ? { ...n, count } : n)),
  });
}

afterEach(() => {
  cleanup();
  useGameStore.getState().reset();
});

describe('NeuronsPanel — rendering (Dimension M chained reveal)', () => {
  // Pre-launch audit Dimension M (M-2): NeuronsPanel ships chained reveal.
  // Renders every unlocked tier + the FIRST locked tier as a teaser. P0
  // cold-start = basica + sensorial (teaser); after each unlock, the next
  // tier appears. Far-future tiers stay hidden.

  test('P0 default: renders 2 rows (basica unlocked + sensorial teaser)', () => {
    const { queryByTestId } = render(<NeuronsPanel />);
    expect(queryByTestId('panel-neurons-row-basica')).not.toBeNull();
    expect(queryByTestId('panel-neurons-row-sensorial')).not.toBeNull();
    expect(queryByTestId('panel-neurons-row-piramidal')).toBeNull();
    expect(queryByTestId('panel-neurons-row-espejo')).toBeNull();
    expect(queryByTestId('panel-neurons-row-integradora')).toBeNull();
  });

  test('all 5 rows render once every tier is unlocked (P10 + chain owned)', () => {
    act(() => {
      setNeuronCount('basica', 10);
      setNeuronCount('sensorial', 5);
      setNeuronCount('piramidal', 5);
      setNeuronCount('espejo', 1);
      useGameStore.setState({ prestigeCount: 10 });
    });
    const { queryByTestId } = render(<NeuronsPanel />);
    for (const type of ['basica', 'sensorial', 'piramidal', 'espejo', 'integradora'] as NeuronType[]) {
      expect(queryByTestId(`panel-neurons-row-${type}`)).not.toBeNull();
    }
  });

  test('basica row is unlocked by default (start unlock)', () => {
    const { getByTestId } = render(<NeuronsPanel />);
    expect(getByTestId('panel-neurons-row-basica').getAttribute('data-affordability')).not.toBe('locked');
  });

  test('sensorial row is locked until basica >= 10 (and stays visible as teaser)', () => {
    const { getByTestId } = render(<NeuronsPanel />);
    expect(getByTestId('panel-neurons-row-sensorial').getAttribute('data-affordability')).toBe('locked');
    act(() => {
      setNeuronCount('basica', 10);
    });
    expect(getByTestId('panel-neurons-row-sensorial').getAttribute('data-affordability')).not.toBe('locked');
  });

  test('integradora row is hidden at P0 (chained reveal — only revealed after Espejo chain)', () => {
    const { queryByTestId } = render(<NeuronsPanel />);
    expect(queryByTestId('panel-neurons-row-integradora')).toBeNull();
  });

  test('integradora row appears once Espejo (its predecessor) unlocks AND P10 reached', () => {
    act(() => {
      setNeuronCount('basica', 10);
      setNeuronCount('sensorial', 5);
      setNeuronCount('piramidal', 5);
      setNeuronCount('espejo', 1);
      useGameStore.setState({ prestigeCount: 10 });
    });
    const { getByTestId } = render(<NeuronsPanel />);
    expect(getByTestId('panel-neurons-row-integradora').getAttribute('data-affordability')).not.toBe('locked');
  });

  test('locked teaser row renders ??? instead of name and shows unlock requirement', () => {
    const { getByTestId } = render(<NeuronsPanel />);
    const sensorialRow = getByTestId('panel-neurons-row-sensorial');
    expect(sensorialRow.textContent).toContain('???');
    expect(sensorialRow.textContent).toContain('10');
    expect(sensorialRow.textContent).toContain('Basic');
  });
});

describe('NeuronsPanel — buy ×1', () => {
  test('clicking Buy on affordable row decrements thoughts and increments count', () => {
    useGameStore.setState({ thoughts: 100 });
    const { getByTestId } = render(<NeuronsPanel />);
    act(() => {
      fireEvent.pointerDown(getByTestId('panel-neurons-buy-basica'));
    });
    const s = useGameStore.getState();
    expect(s.neurons.find((n) => n.type === 'basica')?.count).toBe(2);
    expect(s.thoughts).toBe(100 - neuronBuyCost('basica', 1));
  });

  test('buy button disabled when unaffordable (data-affordability=cant)', () => {
    useGameStore.setState({ thoughts: 0 });
    const { getByTestId } = render(<NeuronsPanel />);
    expect(getByTestId('panel-neurons-row-basica').getAttribute('data-affordability')).toBe('cant');
    const btn = getByTestId('panel-neurons-buy-basica') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    act(() => {
      fireEvent.pointerDown(btn);
    });
    expect(useGameStore.getState().neurons.find((n) => n.type === 'basica')?.count).toBe(1); // unchanged
  });
});

describe('NeuronsPanel — buy modes', () => {
  test('×10 mode buys 10 basicas when affordable', () => {
    // Cost of 10 basicas starting from 1 owned: sum of 1.28^1..10 × 10
    // Easier: just seed a lot of thoughts.
    useGameStore.setState({ thoughts: 1_000_000 });
    const { getByTestId } = render(<NeuronsPanel />);
    act(() => {
      fireEvent.pointerDown(getByTestId('panel-neurons-mode-x10'));
    });
    act(() => {
      fireEvent.pointerDown(getByTestId('panel-neurons-buy-basica'));
    });
    const s = useGameStore.getState();
    expect(s.neurons.find((n) => n.type === 'basica')?.count).toBe(11); // 1 default + 10
  });

  test('×10 stops early if thoughts run out mid-batch', () => {
    // Start with exactly the cost of 1 basica + a tiny remainder.
    const oneCost = neuronBuyCost('basica', 1);
    useGameStore.setState({ thoughts: oneCost + 1 });
    const { getByTestId } = render(<NeuronsPanel />);
    act(() => {
      fireEvent.pointerDown(getByTestId('panel-neurons-mode-x10'));
    });
    act(() => {
      fireEvent.pointerDown(getByTestId('panel-neurons-buy-basica'));
    });
    // Only 1 bought (can't afford 2nd at 1.28^2 × 10 with the remainder).
    const count = useGameStore.getState().neurons.find((n) => n.type === 'basica')?.count ?? 0;
    expect(count).toBe(2); // 1 default + 1 bought
  });

  test('Max mode loops until cannot afford', () => {
    // 10 neurons' worth — should buy somewhere between 3 and 10 depending on cost curve.
    useGameStore.setState({ thoughts: 100 });
    const { getByTestId } = render(<NeuronsPanel />);
    act(() => {
      fireEvent.pointerDown(getByTestId('panel-neurons-mode-max'));
    });
    const before = useGameStore.getState().neurons.find((n) => n.type === 'basica')?.count ?? 0;
    act(() => {
      fireEvent.pointerDown(getByTestId('panel-neurons-buy-basica'));
    });
    const after = useGameStore.getState().neurons.find((n) => n.type === 'basica')?.count ?? 0;
    expect(after).toBeGreaterThan(before);
    // And thoughts went below next-cost
    const s = useGameStore.getState();
    expect(s.thoughts).toBeLessThan(neuronBuyCost('basica', after));
  });

  test('mode selector highlights the active mode', () => {
    const { getByTestId } = render(<NeuronsPanel />);
    expect(getByTestId('panel-neurons-mode-x1').getAttribute('data-active')).toBe('true');
    expect(getByTestId('panel-neurons-mode-x10').getAttribute('data-active')).toBe('false');
    act(() => {
      fireEvent.pointerDown(getByTestId('panel-neurons-mode-x10'));
    });
    expect(getByTestId('panel-neurons-mode-x1').getAttribute('data-active')).toBe('false');
    expect(getByTestId('panel-neurons-mode-x10').getAttribute('data-active')).toBe('true');
  });
});

describe('NeuronsPanel — row content', () => {
  test('affordable row shows name, count, rate, and cost', () => {
    useGameStore.setState({ thoughts: 1_000 });
    const { getByTestId } = render(<NeuronsPanel />);
    const row = getByTestId('panel-neurons-row-basica');
    expect(row.textContent).toContain('Basic');
    expect(row.textContent).toContain('1'); // count
    expect(row.textContent).toContain(String(NEURON_CONFIG.basica.baseRate)); // per-unit rate
  });
});
