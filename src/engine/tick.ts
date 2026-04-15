import { calculateProduction } from './production';
import { calculateConnectionMult, getThreshold } from './formulas';
import type { GameState } from '@/types';

const MS_PER_SECOND = 1000;

export interface TickPatch {
  thoughts: number;
  cycleGenerated: number;
  totalGenerated: number;
  baseProductionPerSecond: number;
  effectiveProductionPerSecond: number;
  connectionMult: number;
  currentThreshold: number;
  insightActive: boolean;
  insightEndTime: number | null;
  lastActiveTimestamp: number;
}

export function gameTick(state: GameState, dtMs: number): TickPatch {
  const dtSeconds = dtMs / MS_PER_SECOND;
  const now = Date.now();

  const connectionMult = calculateConnectionMult(state);
  const stateForProd: GameState = { ...state, connectionMult };
  const { base, effective } = calculateProduction(stateForProd);

  let insightActive = state.insightActive;
  let insightEndTime = state.insightEndTime;
  if (insightActive && insightEndTime !== null && now >= insightEndTime) {
    insightActive = false;
    insightEndTime = null;
  }

  const generated = effective * dtSeconds;
  const thoughts = state.thoughts + generated;
  const cycleGenerated = state.cycleGenerated + generated;
  const totalGenerated = state.totalGenerated + generated;

  const currentThreshold = getThreshold(state.prestigeCount, state.transcendenceCount);

  return {
    thoughts,
    cycleGenerated,
    totalGenerated,
    baseProductionPerSecond: base,
    effectiveProductionPerSecond: effective,
    connectionMult,
    currentThreshold,
    insightActive,
    insightEndTime,
    lastActiveTimestamp: now,
  };
}
