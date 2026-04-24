// Implements GDD.md §15 RESON-1..3 — Resonance currency earned at prestige (P13+).
// Sprint 8b Phase 8b.3. Pure (CODE-9). Consumer: src/engine/prestige.ts handlePrestige.
//
// RESON-3: Resonance earning is atomic at prestige completion. Display: "+X
// Resonance" on Awakening screen (UI consumer at Phase 8b.4).

import { SYNAPSE_CONSTANTS } from '../config/constants';
import { resonanceEarnMult } from './resonanceUpgrades';
import type { GameState } from '../types/GameState';

/** Per-cycle metrics consumed by the §15 formula. */
export interface ResonanceCycleMetrics {
  readonly cascadesTriggered: number;
  readonly insightsLevel2Plus: number;
  readonly durationMinutes: number;
}

/**
 * Build cycle metrics from current state at the moment of prestige.
 *
 * `insightsLevel2Plus`: per V15, all insights this cycle were at the same
 * level (prestigeCount stable mid-cycle). If `prestigeCount >=
 * insightLevel2MinPrestige`, every insight in `insightTimestamps` counts as
 * level 2+; otherwise 0. No new state field needed.
 */
export function buildResonanceCycleMetrics(
  state: Pick<GameState, 'cycleCascades' | 'insightTimestamps' | 'prestigeCount'>,
  cycleDurationMs: number,
): ResonanceCycleMetrics {
  const insightsLevel2Plus = state.prestigeCount >= SYNAPSE_CONSTANTS.insightLevel2MinPrestige
    ? state.insightTimestamps.length
    : 0;
  return {
    cascadesTriggered: state.cycleCascades,
    insightsLevel2Plus,
    durationMinutes: cycleDurationMs / 60_000, // CONST-OK ms→min
  };
}

/**
 * GDD §15 formula. Returns 0 below `resonanceUnlockPrestige` (P13).
 *
 *   r = base + min(cascades, MAX_CASCADES) + min(insightsL2+, MAX_INSIGHTS)
 *   if duration < FAST_CYCLE_THRESHOLD_MIN: r += FAST_CYCLE_BONUS
 *   if archetype === 'creativa': r = round(r × CREATIVA_MULT)
 */
export function resonanceGainOnPrestige(
  state: Pick<GameState, 'archetype' | 'cycleCascades' | 'insightTimestamps' | 'prestigeCount' | 'resonanceUpgrades'>,
  cycleDurationMs: number,
): number {
  if (state.prestigeCount < SYNAPSE_CONSTANTS.resonanceUnlockPrestige) return 0;
  const m = buildResonanceCycleMetrics(state, cycleDurationMs);
  let r: number = SYNAPSE_CONSTANTS.resonanceBasePerPrestige;
  r += Math.min(m.cascadesTriggered, SYNAPSE_CONSTANTS.resonanceMaxCascadesCount);
  r += Math.min(m.insightsLevel2Plus, SYNAPSE_CONSTANTS.resonanceMaxInsightsCount);
  if (m.durationMinutes < SYNAPSE_CONSTANTS.resonanceFastCycleThresholdMin) {
    r += SYNAPSE_CONSTANTS.resonanceFastCycleBonus;
  }
  if (state.archetype === 'creativa') {
    r = Math.round(r * SYNAPSE_CONSTANTS.resonanceCreativaArchetypeMult);
  }
  // GDD §15 resonancia_profunda (Tier 3) — earn rate ×1.5 stacks AFTER Creativa.
  r = Math.round(r * resonanceEarnMult(state));
  return r;
}
