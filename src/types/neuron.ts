export type NeuronType = 'basica' | 'sensorial' | 'piramidal' | 'espejo' | 'integradora';

export interface NeuronState {
  type: NeuronType;
  owned: number;
  baseCost: number;
  baseRate: number;
  requires: number;
  memCost?: number;
}

export interface NeuronSnapshot {
  prestigeNumber: number;
  neurons: { type: NeuronType; owned: number }[];
  archetype: string | null;
  polarity: string | null;
}
