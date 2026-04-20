// Tests for src/ui/canvas/stressState.ts — structural invariants only.

import { describe, expect, test } from 'vitest';
import { createStressNeurons, totalStressCount } from '../../../src/ui/canvas/stressState';
import { SYNAPSE_CONSTANTS } from '../../../src/config/constants';

describe('createStressNeurons', () => {
  test('returns one entry per neuron type (5)', () => {
    const ns = createStressNeurons();
    expect(ns).toHaveLength(5);
    const types = ns.map((n) => n.type);
    expect(new Set(types).size).toBe(5);
    expect(types).toEqual(['basica', 'sensorial', 'piramidal', 'espejo', 'integradora']);
  });

  test('every type uses perfStressNeuronsPerType count', () => {
    const ns = createStressNeurons();
    for (const n of ns) {
      expect(n.count).toBe(SYNAPSE_CONSTANTS.perfStressNeuronsPerType);
    }
  });

  test('total count is 100 (= 20 × 5)', () => {
    expect(totalStressCount()).toBe(100);
    const ns = createStressNeurons();
    expect(ns.reduce((acc, n) => acc + n.count, 0)).toBe(100);
  });

  test('total exceeds the 80-node visible cap (so the cap is exercised)', () => {
    expect(totalStressCount()).toBeGreaterThan(SYNAPSE_CONSTANTS.maxVisibleNodes);
  });
});
