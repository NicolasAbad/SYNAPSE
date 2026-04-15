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

function polarityProdMult(state: GameState): number {
  if (state.currentPolarity === 'excitatory') {
    return SYNAPSE_CONSTANTS.polarityExcitatoryProdMult;
  }
  if (state.currentPolarity === 'inhibitory') {
    return SYNAPSE_CONSTANTS.polarityInhibitoryProdMult;
  }
  return 1;
}

function mentalStateBaseMult(state: GameState): number {
  // 'deep' grants baseProduction +5%
  if (state.currentMentalState === 'deep') return 1.05;
  return 1;
}

function mentalStateEffectiveMult(state: GameState): number {
  // 'eureka' grants production +15% during its window
  if (state.currentMentalState === 'eureka') return 1.15;
  return 1;
}

function applyProductionCap(value: number): number {
  const cap = SYNAPSE_CONSTANTS.productionCap;
  if (value <= cap) return value;
  // Above cap, the excess is softCapped (knee curve from constants).
  return cap + softCap(value - cap);
}

/**
 * Full multiplier chain (per GDD):
 *   base = softCap(sumNeurons) × connectionMult × polarityProd × mentalStateBase × momentum
 *   base is then capped by productionCap with softCap curve above.
 *   effective = base × insight × mentalStateEffective
 *
 * `base` drives offline accrual, discharge bonus, momentum.
 * `effective` drives UI display, tick accrual, tap floor.
 */
export function calculateProduction(state: GameState): ProductionResult {
  const raw = sumNeuronProduction(state);
  const capped = softCap(raw);

  let base = capped;
  base *= state.connectionMult;
  base *= polarityProdMult(state);
  base *= mentalStateBaseMult(state);
  if (state.momentumBonus > 0) base *= 1 + state.momentumBonus;
  base = applyProductionCap(base);

  let effective = base;
  if (state.insightActive) effective *= state.insightMultiplier;
  effective *= mentalStateEffectiveMult(state);

  return { base, effective };
}
