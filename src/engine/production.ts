import { SYNAPSE_CONSTANTS } from '@/config/constants';
import type { GameState } from '@/types';

export interface ProductionResult {
  base: number;
  effective: number;
}

export function softCap(x: number): number {
  const knee = SYNAPSE_CONSTANTS.softCapKnee;
  if (x <= knee) return x;
  return knee * Math.pow(x / knee, SYNAPSE_CONSTANTS.softCapExponent);
}

function sumNeuronProduction(state: GameState): number {
  let total = 0;
  for (const n of state.neurons) {
    total += n.owned * n.baseRate;
  }
  return total;
}

function gatherRawMultiplier(state: GameState): number {
  let mult = 1;
  mult *= state.connectionMult;
  if (state.currentPolarity === 'excitatory') {
    mult *= SYNAPSE_CONSTANTS.polarityExcitatoryProdMult;
  } else if (state.currentPolarity === 'inhibitory') {
    mult *= SYNAPSE_CONSTANTS.polarityInhibitoryProdMult;
  }
  return mult;
}

export function calculateProduction(state: GameState): ProductionResult {
  const baseRate = sumNeuronProduction(state);
  const totalMult = softCap(gatherRawMultiplier(state));
  const base = baseRate * totalMult;

  let effective = base;
  if (state.insightActive) {
    effective *= state.insightMultiplier;
  }
  return { base, effective };
}
