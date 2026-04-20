/**
 * Stress state generator for Sprint 2 Phase 7 perf spike.
 *
 * Produces a `NeuronState[]` with `perfStressNeuronsPerType` (20) per type
 * across all 5 types = 100 neurons total. Paired with the 80-node render
 * cap, the renderer draws min(100, 80) = 80 nodes with full glow per frame.
 *
 * Kept in ui/canvas/ (not tests/) so the dev-mode `__SYNAPSE_PERF__`
 * runtime API on window can import it from production code, enabling
 * Mi A3 remote DevTools testing without a test harness.
 */

import type { NeuronState, NeuronType } from '../../types';
import { SYNAPSE_CONSTANTS } from '../../config/constants';

const ALL_NEURON_TYPES: readonly NeuronType[] = [
  'basica',
  'sensorial',
  'piramidal',
  'espejo',
  'integradora',
] as const;

export function createStressNeurons(): NeuronState[] {
  return ALL_NEURON_TYPES.map((type) => ({
    type,
    count: SYNAPSE_CONSTANTS.perfStressNeuronsPerType,
  }));
}

export function totalStressCount(): number {
  return ALL_NEURON_TYPES.length * SYNAPSE_CONSTANTS.perfStressNeuronsPerType;
}
