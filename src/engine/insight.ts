// Implements docs/GDD.md §6 (Focus Bar & Insight — activation).
// Sprint 3 Phase 5. Pure helpers consumed by tick.ts step 2.5 and
// src/store/tap.ts applyTap for immediate tap-driven activation.
//
// Level selection (§6 Levels table):
//   P0-P9   → level 1 (Claro, ×3.0, 15s, fires at focusBar >= 1.0)
//   P10-P18 → level 2 (Profundo, ×8.0, 12s, fires at focusBar >= 2.0)
//   P19+    → level 3 (Trascendente, ×18.0, 8s, fires at focusBar >= 3.0)
//
// FOCUS-2 (§6): Focus Bar does NOT reset on Insight activation — can pre-charge next.
// Bar can overflow the level threshold; after insightActive expires and bar
// is still ≥ threshold, Insight re-fires on the next tick.
//
// Hyperfocus interaction (MENTAL-5 §17, consumed here):
//   If `pendingHyperfocusBonus` is true at activation time:
//     - If level < 3: activate at level + 1, clear flag
//     - If level == 3: activate at level 3 with duration × (1 + hyperfocusLevel3DurationBoost)
//   The flag is set by Sprint 7's Hyperfocus Mental State machinery; Phase 5
//   just consumes it defensively (field already exists in GameState per INT-9).

import { SYNAPSE_CONSTANTS } from '../config/constants';
import { UPGRADES_BY_ID } from '../config/upgrades';
import { insightDurationDecisionAddS } from './patternDecisions';
import { archetypeInsightDurationAddSec } from './archetypes';
import type { GameState } from '../types/GameState';

export type InsightLevel = 1 | 2 | 3; // CONST-OK (structural level enum, §6 3-tier system)

/** Level of Insight unlocked by the player's current prestige tier. */
export function getInsightLevel(prestigeCount: number): InsightLevel {
  if (prestigeCount >= SYNAPSE_CONSTANTS.insightLevel3MinPrestige) return 3; // CONST-OK (InsightLevel enum)
  if (prestigeCount >= SYNAPSE_CONSTANTS.insightLevel2MinPrestige) return 2; // CONST-OK (InsightLevel enum)
  return 1;
}

/**
 * Focus threshold at which Insight auto-fires for the given level. 1.0 / 2.0 / 3.0.
 * Player must fill the bar to this value to trigger. Higher levels demand more.
 */
export function getInsightFireThreshold(level: InsightLevel): number {
  return SYNAPSE_CONSTANTS.insightThresholds[level - 1];
}

/** Should Insight activate right now? Pure — callers apply the state update. */
export function shouldActivateInsight(
  state: Pick<GameState, 'insightActive' | 'focusBar' | 'prestigeCount'>,
): boolean {
  if (state.insightActive) return false;
  const level = getInsightLevel(state.prestigeCount);
  return state.focusBar >= getInsightFireThreshold(level);
}

/** True iff an upgrade with `focus_fill_mult` kind is owned (→ +5s Insight duration). */
function hasConcentracionProfunda(state: Pick<GameState, 'upgrades'>): boolean {
  for (const u of state.upgrades) {
    if (!u.purchased) continue;
    if (UPGRADES_BY_ID[u.id]?.effect.kind === 'focus_fill_mult') return true;
  }
  return false;
}

/**
 * Activate Insight. Returns a GameState partial that the caller merges.
 * Does NOT reset focusBar (FOCUS-2). Does NOT check preconditions — call
 * `shouldActivateInsight` first.
 *
 * Consumes `pendingHyperfocusBonus` if set: bumps level or extends duration.
 */
export function activateInsight(state: GameState, nowTimestamp: number): Partial<GameState> {
  const maxLevel = SYNAPSE_CONSTANTS.insightMultiplier.length;
  const baseLevel = getInsightLevel(state.prestigeCount);
  const hasHyperfocus = state.pendingHyperfocusBonus;
  const effectiveLevel: InsightLevel = hasHyperfocus && baseLevel < maxLevel
    ? (baseLevel + 1) as InsightLevel
    : baseLevel;
  let durationSeconds: number = SYNAPSE_CONSTANTS.insightDuration[effectiveLevel - 1];
  if (hasConcentracionProfunda(state)) durationSeconds += SYNAPSE_CONSTANTS.concentracionInsightDurationAddS;
  // GDD §10 Node 24 A: Insight duration +3 s (stacks with Concentración).
  durationSeconds += insightDurationDecisionAddS(state);
  // GDD §12 Analítica: +2s each level (Sprint 6 Phase 6.2 wired).
  durationSeconds += archetypeInsightDurationAddSec(state);
  if (hasHyperfocus && baseLevel === maxLevel) {
    durationSeconds = durationSeconds * (1 + SYNAPSE_CONSTANTS.hyperfocusLevel3DurationBoost);
  }
  const multiplier = SYNAPSE_CONSTANTS.insightMultiplier[effectiveLevel - 1];
  return {
    insightActive: true,
    insightMultiplier: multiplier,
    insightEndTime: nowTimestamp + durationSeconds * 1000, // CONST-OK (s→ms)
    lifetimeInsights: state.lifetimeInsights + 1,
    insightTimestamps: pushInsightTimestamp(state.insightTimestamps, nowTimestamp),
    pendingHyperfocusBonus: hasHyperfocus ? false : state.pendingHyperfocusBonus,
  };
}

/** Circular buffer size per MENTAL-2 §17 — enables Sprint 7 Eureka Mental State check. */
function pushInsightTimestamp(stamps: readonly number[], nowTimestamp: number): number[] {
  const cap = SYNAPSE_CONSTANTS.insightBufferSize;
  if (stamps.length < cap) return [...stamps, nowTimestamp];
  return [...stamps.slice(1), nowTimestamp];
}

/** Composite: check-and-activate. Returns empty partial if nothing to do. */
export function tryActivateInsight(state: GameState, nowTimestamp: number): Partial<GameState> {
  if (!shouldActivateInsight(state)) return {};
  return activateInsight(state, nowTimestamp);
}
