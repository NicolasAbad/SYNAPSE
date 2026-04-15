import { SYNAPSE_CONSTANTS } from '@/config/constants';
import type { NeuronType } from '@/types';

export interface NeuronDefinition {
  type: NeuronType;
  name: string;
  baseCost: number;
  rate: number;
  requires: number;
  memCost?: number;
}

export const NEURON_DEFINITIONS: readonly NeuronDefinition[] = SYNAPSE_CONSTANTS.neurons;

export const NEURON_BY_TYPE: Readonly<Record<NeuronType, NeuronDefinition>> =
  NEURON_DEFINITIONS.reduce(
    (acc, n) => {
      acc[n.type] = n;
      return acc;
    },
    {} as Record<NeuronType, NeuronDefinition>,
  );
