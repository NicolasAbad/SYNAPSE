// Sprint 11a Phase 11a.2 — fast-check properties for neuronCost (GDD §4 cost scaling).

import { describe, expect, test } from 'vitest';
import * as fc from 'fast-check';
import { neuronCost, NEURON_BASE_COSTS, NEURON_TYPES } from '../../src/config/neurons';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';

const neuronTypeArb = fc.constantFrom(...NEURON_TYPES);

describe('neuronCost — property-based invariants (GDD §4 cost scaling)', () => {
  test('PROP-9: monotonic in owned count — buying more makes the next cost more', () => {
    fc.assert(fc.property(
      neuronTypeArb,
      fc.integer({ min: 0, max: 99 }),
      (type, n) => neuronCost(type, n) <= neuronCost(type, n + 1),
    ));
  });

  test('PROP-10: base case — neuronCost(type, 0) === NEURON_BASE_COSTS[type]', () => {
    fc.assert(fc.property(neuronTypeArb, (type) => neuronCost(type, 0) === NEURON_BASE_COSTS[type]));
  });

  test('PROP-11: geometric scaling — neuronCost(type, n+1) ≈ neuronCost(type, n) × costMult', () => {
    fc.assert(fc.property(
      neuronTypeArb,
      fc.integer({ min: 0, max: 50 }),
      (type, n) => {
        const a = neuronCost(type, n);
        const b = neuronCost(type, n + 1);
        const ratio = b / a;
        return Math.abs(ratio - SYNAPSE_CONSTANTS.costMult) < 1e-9;
      },
    ));
  });

  test('PROP-12: strictly positive for all valid n', () => {
    fc.assert(fc.property(
      neuronTypeArb,
      fc.integer({ min: 0, max: 200 }),
      (type, n) => neuronCost(type, n) > 0,
    ));
  });

  test('PROP-13: finite up to n=100 (sanity bound — no Infinity escape)', () => {
    fc.assert(fc.property(
      neuronTypeArb,
      fc.integer({ min: 0, max: 100 }),
      (type, n) => Number.isFinite(neuronCost(type, n)),
    ));
  });

  test('PROP-14: deterministic — same input → same output', () => {
    fc.assert(fc.property(
      neuronTypeArb,
      fc.integer({ min: 0, max: 100 }),
      (type, n) => neuronCost(type, n) === neuronCost(type, n),
    ));
  });

  test('PROP-15: cross-type ordering preserved at the base — basica < sensorial < piramidal < espejo < integradora', () => {
    expect(neuronCost('basica', 0)).toBeLessThan(neuronCost('sensorial', 0));
    expect(neuronCost('sensorial', 0)).toBeLessThan(neuronCost('piramidal', 0));
    expect(neuronCost('piramidal', 0)).toBeLessThan(neuronCost('espejo', 0));
    expect(neuronCost('espejo', 0)).toBeLessThan(neuronCost('integradora', 0));
  });
});
