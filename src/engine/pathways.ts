// Implements docs/GDD.md §14 Neural Pathways + GDD §35 CODE-9 (engine purity).
//
// Pure helpers — branch on `state.currentPathway` and read PATHWAYS_BY_ID.
// Phase 5.3 wires the high-impact bonuses: PATH-1 category gating, COST-1
// pathwayCostMod, Equilibrada upgrade-bonus dampening, Rápida charge-rate
// + insight-duration multipliers, Profunda memories-per-prestige multiplier.
//
// Deferred to Phase 5.6 / Sprint 6 polish (no spec gap, just scope cut):
//   - Profunda focusFillRateMult (×0.5 malus): not yet integrated into
//     the focus accumulation path — current code reads focusFillRate
//     directly from upgrades; needs an indirection layer.
//
// All v1.0 pathways carry pathwayCostMod=1.0 per GDD §14, so that helper
// returns 1 for every pathway today — kept for spec correctness so any
// future pathway tuning lands in one place.

import type { GameState } from '../types/GameState';
import type { PathwayDef, UpgradeCategory } from '../types';
import { PATHWAYS_BY_ID } from '../config/pathways';

function activePathway(state: GameState): PathwayDef | null {
  return state.currentPathway ? PATHWAYS_BY_ID[state.currentPathway] ?? null : null;
}

/**
 * PATH-1: returns true iff the upgrade's category is in the active pathway's
 * `blocks` list. UI greys (not hides) blocked rows + shows a tooltip.
 *
 * No active pathway → never blocked. Categories not mentioned in either list
 * default to enabled (matches GDD §14 literal listing — Rápida doesn't list
 * `neu`, doesn't block it; Profunda doesn't list `met`, doesn't block it).
 */
export function isUpgradeBlocked(state: GameState, category: UpgradeCategory): boolean {
  const p = activePathway(state);
  if (!p) return false;
  return p.blocks.includes(category);
}

/**
 * COST-1 (GDD §4) pathway slot. v1.0: every pathway has pathwayCostMod=1.0,
 * so this returns identity. Wired now so the formula stack stays correct
 * if a future pathway introduces a cost modifier.
 */
export function pathwayCostMod(state: GameState): number {
  return activePathway(state)?.pathwayCostMod ?? 1;
}

/**
 * GDD §14 Equilibrada: "All upgrade bonuses ×0.85". Returns the dampening
 * factor applied to the (multiplier − 1) delta of upgrade contributions.
 * Cross-cutting: production global mult, discharge mult, charge rate, etc.
 *
 * Phase 5.3 wires PRODUCTION dampening only (highest impact). Discharge/
 * charge/focus dampening sits in Phase 5.6 / Sprint 6 polish.
 *
 * Returns 1.0 when no Equilibrada or no active pathway — `dampenUpgradeBonus`
 * helper below applies it as `1 + (mult − 1) * damp`.
 */
export function pathwayUpgradeBonusDamp(state: GameState): number {
  return activePathway(state)?.bonuses.upgradeBonusMult ?? 1;
}

/**
 * Apply the Equilibrada dampening to a multiplicative bonus. Identity when
 * `damp === 1`. For example: dampenUpgradeBonus(1.5, 0.85) = 1.425
 * (the upgrade's +50% becomes +42.5%).
 */
export function dampenUpgradeBonus(rawMult: number, damp: number): number {
  if (damp === 1) return rawMult;
  return 1 + (rawMult - 1) * damp;
}

/** Rápida bonus: Insight duration ×2.0. Caller multiplies the base seconds. */
export function pathwayInsightDurationMult(state: GameState): number {
  return activePathway(state)?.bonuses.insightDurationMult ?? 1;
}

/**
 * Rápida bonus: Discharge charge rate ×1.5 (= interval × 1/1.5). Returns the
 * multiplier; caller divides intervalMs by it (matches existing tick step-6
 * upgrade pattern).
 */
export function pathwayChargeRateMult(state: GameState): number {
  return activePathway(state)?.bonuses.chargeRateMult ?? 1;
}

/**
 * Profunda bonus: Memories per prestige ×2.0 — applied this cycle only.
 * Wired into computeMemoriesGained (engine/prestige.ts) — multiplies AFTER
 * baseMemoriesPerPrestige + memoryGainAdd contributions.
 */
export function pathwayMemoriesPerPrestigeMult(state: GameState): number {
  return activePathway(state)?.bonuses.memoriesPerPrestigeMult ?? 1;
}

/**
 * Profunda bonus: Focus fill rate ×0.5 (pathway malus). Phase 5.6 hooks
 * this into focus accumulation; currently exposed for completeness so
 * consumers don't double-implement and future-me has a known indirection.
 */
export function pathwayFocusFillRateMult(state: GameState): number {
  return activePathway(state)?.bonuses.focusFillRateMult ?? 1;
}
