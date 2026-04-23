// Implements docs/GDD.md §16.4 (Corteza Visual — Foresight Tiers) — engine.
// Sprint 7.5 Phase 7.5.5. FORESIGHT-1..4 + visualInsightTier derivation.
//
// 4 tiers (T1 → T4) unlock via prestigeCount OR an explicit Memoria upgrade:
//   T1 — P0+ always-on. What-if Preview shows 3-cycle horizon (was 1 pre-7.5.5).
//   T2 — P5+ OR vis_pattern_sight (2 Mem). Mutation pool preview at Pattern Tree.
//   T3 — P12+ OR vis_deep_sight (8 Mem). Spontaneous events show 20s countdown.
//   T4 — P19+ OR vis_prophet_sight (20 Mem). Era 3 event preview at Awakening.
//
// Tier is DERIVED, not stored — keeps GameState field count at 119 per FORESIGHT-1.
//
// Sprint 7.5.5 scope: engine derivation + 3 upgrades shipped. UI surfaces (3-cycle
// What-if / T2 preview cards / T3 countdown badge / T4 Era 3 preview) ship in
// Phase 7.5.7 alongside the brain-canvas Region tab redesign per scope-deferral
// documented in PROGRESS.md.
//
// Senior-dev correction: PROGRESS.md (pre-7.5.5) framed MUT-2 as a BREAKING
// refactor moving seed compute from prestige-START to prestige-END. The existing
// `mutationSeed(cycleStartTimestamp, prestigeCount)` is ALREADY deterministic
// from post-prestige state, so PatternTreeView can call getMutationOptions()
// without any engine refactor. Saves ~23 mutation tests from churn.

import type { GameState } from '../types/GameState';
import { SYNAPSE_CONSTANTS } from '../config/constants';

export type VisualInsightTier = 1 | 2 | 3 | 4; // CONST-OK §16.4 4-tier enum

function ownsLimUpgrade(state: Pick<GameState, 'upgrades'>, id: string): boolean {
  for (const u of state.upgrades) if (u.purchased && u.id === id) return true;
  return false;
}

/**
 * Derive the player's currently-active Visual Foresight tier (1..4). Higher tier
 * dominates: a P5 player with vis_prophet_sight bought is at T4, not T2.
 */
export function visualInsightTier(state: Pick<GameState, 'prestigeCount' | 'upgrades'>): VisualInsightTier {
  if (state.prestigeCount >= SYNAPSE_CONSTANTS.visualT4PrestigeGate || ownsLimUpgrade(state, 'vis_prophet_sight')) return 4; // CONST-OK VisualInsightTier T4
  if (state.prestigeCount >= SYNAPSE_CONSTANTS.visualT3PrestigeGate || ownsLimUpgrade(state, 'vis_deep_sight')) return 3;    // CONST-OK VisualInsightTier T3
  if (state.prestigeCount >= SYNAPSE_CONSTANTS.visualT2PrestigeGate || ownsLimUpgrade(state, 'vis_pattern_sight')) return 2; // CONST-OK VisualInsightTier T2
  return 1; // CONST-OK VisualInsightTier T1 always-on
}

/** True iff T2+ is active (used to gate Mutation pool preview UI). */
export function hasMutationPreview(state: Pick<GameState, 'prestigeCount' | 'upgrades'>): boolean {
  return visualInsightTier(state) >= 2; // CONST-OK VisualInsightTier: T2 threshold
}

/** True iff T3+ is active (used to gate Spontaneous countdown HUD badge). */
export function hasSpontaneousCountdown(state: Pick<GameState, 'prestigeCount' | 'upgrades'>): boolean {
  return visualInsightTier(state) >= 3; // CONST-OK VisualInsightTier: T3 threshold
}

/** True iff T4 is active (used to gate Era 3 event preview at Awakening). */
export function hasEra3Preview(state: Pick<GameState, 'prestigeCount' | 'upgrades'>): boolean {
  return visualInsightTier(state) >= 4; // CONST-OK VisualInsightTier: T4 threshold
}

/** What-if Preview horizon: T1 = 3 cycles (per Sprint 7.5.5 spec change from 1). */
export function whatIfHorizonCycles(): number {
  return SYNAPSE_CONSTANTS.visualWhatIfHorizonCycles;
}
