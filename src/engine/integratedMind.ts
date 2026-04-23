// Implements docs/GDD.md §16.6 (Amplitud de Banda — Integrated Mind).
// Sprint 7.5 Phase 7.5.8. INTEGRATED-1..2.
//
// Synergy bonuses unlock when N "actively-engaged" regions cohere this Run:
//   - 3 active: +1 permanent max Discharge charge
//   - 4 active: +10% Memoria gain globally (post-multiplier)
//   - 5 active: secret narrative beat (`integrated_mind_whole` fragment) +
//              unique ending variant + 5 Sparks (once per Run)
//
// "Active" definition (per GDD §16.6 — Run-scoped per spec; v1.0 ships LIFETIME
// proxy for simplicity since TRANSCENDENCE Run reset doesn't ship until 8b):
//   - Hipocampo:   memoryShardUpgrades.length > 0
//   - Prefrontal:  precommitmentStreak > 0 (any successful pre-commit)
//   - Límbico:     mood >= moodTierBoundaries[1] (Engaged or higher right now)
//   - Visual:      visualInsightTier(state) >= 2 (T2+)
//   - Broca:       brocaNamedMoments.length > 0
//
// Run-scoped tracking refinement deferred to Sprint 8b alongside TRANSCENDENCE
// implementation (which actually resets these). Documented in PROGRESS.md.

import type { GameState } from '../types/GameState';
import { SYNAPSE_CONSTANTS } from '../config/constants';
import { visualInsightTier } from './visual';

const TIER_3_REGIONS = 3; // CONST-OK §16.6 +1 charge tier
const TIER_4_REGIONS = 4; // CONST-OK §16.6 +10% Memoria tier
const TIER_5_REGIONS = 5; // CONST-OK §16.6 secret narrative tier

export function isHipocampoActive(state: Pick<GameState, 'memoryShardUpgrades'>): boolean {
  return state.memoryShardUpgrades.length > 0;
}

export function isPrefrontalActive(state: Pick<GameState, 'precommitmentStreak'>): boolean {
  return state.precommitmentStreak > 0;
}

export function isLimbicoActive(state: Pick<GameState, 'mood'>): boolean {
  return state.mood >= SYNAPSE_CONSTANTS.moodTierBoundaries[1]; // CONST-OK Engaged threshold from constants array
}

export function isVisualActive(state: Pick<GameState, 'prestigeCount' | 'upgrades'>): boolean {
  return visualInsightTier(state) >= 2; // CONST-OK VisualInsightTier T2 threshold
}

export function isBrocaActive(state: Pick<GameState, 'brocaNamedMoments'>): boolean {
  return state.brocaNamedMoments.length > 0;
}

/** Count how many of the 5 regions are actively engaged for the current state. */
export function activeRegionCount(state: GameState): number {
  let n = 0;
  if (isHipocampoActive(state)) n++;
  if (isPrefrontalActive(state)) n++;
  if (isLimbicoActive(state)) n++;
  if (isVisualActive(state)) n++;
  if (isBrocaActive(state)) n++;
  return n;
}

/** +1 max Discharge charge bonus when 3+ regions active (caps at hard-cap downstream). */
export function integratedMindMaxChargeBonus(state: GameState): number {
  return activeRegionCount(state) >= TIER_3_REGIONS ? 1 : 0; // CONST-OK INTEGRATED-1 +1 charge
}

/** Memoria gain mult: ×1.10 when 4+ regions active, else ×1.0. Post-multiplier per §16.6. */
export function integratedMindMemoryMult(state: GameState): number {
  return activeRegionCount(state) >= TIER_4_REGIONS ? SYNAPSE_CONSTANTS.integratedMindMemoryBonus : 1;
}

/** True iff all 5 regions are active — gates the secret narrative beat. */
export function isFullyIntegrated(state: GameState): boolean {
  return activeRegionCount(state) === TIER_5_REGIONS;
}
