import type { NeuronType } from '@/types';

export interface NeuronSkinPalette {
  id: string;
  name: string;
  colors: Record<NeuronType, string>;
  connections: string;
}

export const DEFAULT_NEURON_SKIN_ID = 'default';

const SKIN_REGISTRY: Record<string, NeuronSkinPalette> = {
  [DEFAULT_NEURON_SKIN_ID]: {
    id: DEFAULT_NEURON_SKIN_ID,
    name: 'Default',
    colors: {
      basica: '#4060E0',
      sensorial: '#22B07A',
      piramidal: '#8B7FE8',
      espejo: '#E06090',
      integradora: '#40D0D0',
    },
    connections: '#FFFFFF10',
  },
  // TODO Sprint 9: ember, frost, void, solar, toxic, crystal, shadow, prism
};

export function getSkinPalette(id: string | null): NeuronSkinPalette {
  if (id && SKIN_REGISTRY[id]) return SKIN_REGISTRY[id];
  return SKIN_REGISTRY[DEFAULT_NEURON_SKIN_ID];
}

export const DISCHARGE_FLASH_COLOR = '#F0A030';
