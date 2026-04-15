import { SYNAPSE_CONSTANTS } from '@/config/constants';
import type { GameState } from '@/types';

const ERA1_END = 12;
const ERA2_END = 19;

export function getThreshold(prestigeCount: number, transcendenceCount: number): number {
  const base = SYNAPSE_CONSTANTS.consciousnessThreshold;
  let th: number;
  if (prestigeCount <= ERA1_END) {
    th = base * Math.pow(SYNAPSE_CONSTANTS.thresholdScaleEra1, prestigeCount);
  } else if (prestigeCount <= ERA2_END) {
    th =
      base *
      Math.pow(SYNAPSE_CONSTANTS.thresholdScaleEra1, ERA1_END) *
      Math.pow(SYNAPSE_CONSTANTS.thresholdScaleEra2, prestigeCount - ERA1_END);
  } else {
    th =
      base *
      Math.pow(SYNAPSE_CONSTANTS.thresholdScaleEra1, ERA1_END) *
      Math.pow(SYNAPSE_CONSTANTS.thresholdScaleEra2, ERA2_END - ERA1_END) *
      Math.pow(SYNAPSE_CONSTANTS.thresholdScaleEra3, prestigeCount - ERA2_END);
  }
  const runMultArr = SYNAPSE_CONSTANTS.runThresholdMult;
  const idx = Math.min(transcendenceCount, runMultArr.length - 1);
  const runMult = runMultArr[idx] ?? 1;
  return th * runMult;
}

export function calculateConnectionMult(state: GameState): number {
  const types = new Set(state.neurons.filter((n) => n.owned > 0).map((n) => n.type));
  const size = types.size;
  const pairs = (size * (size - 1)) / 2;
  return 1 + pairs * SYNAPSE_CONSTANTS.connectionBonusPerPair;
}

export function calculateNeuronCost(baseCost: number, owned: number): number {
  return Math.ceil(baseCost * Math.pow(SYNAPSE_CONSTANTS.costMultiplier, owned));
}
