// Implements GDD.md §17 Mental States + MENTAL-1..8 rules.
// Priority: Eureka > Flow > Hyperfocus > Deep > Dormancy. CODE-9 pure.

import type { GameState } from '../types/GameState';
import { SYNAPSE_CONSTANTS } from '../config/constants';

export type MentalStateId = 'flow' | 'deep' | 'eureka' | 'dormancy' | 'hyperfocus';

interface MentalStateContext {
  lastTapTimestamps: readonly number[];
  lastPurchaseTimestamp: number;
  insightTimestamps: readonly number[];
  focusAbove50Since: number | null;
  neurons: GameState['neurons'];
  currentMentalState: string | null;
  pendingHyperfocusBonus: boolean;
}

/**
 * Eureka trigger: 3 Insights activated within 2 minutes.
 * Reads insightTimestamps circular buffer (size 3 per MENTAL-2).
 */
function checkEureka(ctx: MentalStateContext, now: number): boolean {
  const { mentalStateEurekaInsightCount, mentalStateEurekaWindowMs } = SYNAPSE_CONSTANTS;
  if (ctx.insightTimestamps.length < mentalStateEurekaInsightCount) return false;
  // Take the last N timestamps (circular buffer keeps newest tail).
  const recent = ctx.insightTimestamps.slice(-mentalStateEurekaInsightCount);
  return now - recent[0] <= mentalStateEurekaWindowMs;
}

/** Flow trigger: 10+ taps in last 15s. */
function checkFlow(ctx: MentalStateContext, now: number): boolean {
  const { mentalStateFlowTapCount, mentalStateFlowWindowMs } = SYNAPSE_CONSTANTS;
  let count = 0;
  for (const t of ctx.lastTapTimestamps) {
    if (now - t <= mentalStateFlowWindowMs) count++;
  }
  return count >= mentalStateFlowTapCount;
}

/** Hyperfocus trigger: focusBar > 50% continuously for 30s. */
function checkHyperfocus(ctx: MentalStateContext, now: number): boolean {
  if (ctx.focusAbove50Since === null) return false;
  return now - ctx.focusAbove50Since >= SYNAPSE_CONSTANTS.mentalStateHyperfocusDurationMs;
}

/** Deep trigger: no taps for 60s AND ≥5 neurons owned (any type). */
function checkDeep(ctx: MentalStateContext, now: number): boolean {
  const { mentalStateDeepIdleMs, mentalStateDeepMinNeurons } = SYNAPSE_CONSTANTS;
  // Sum all neuron counts across types.
  const totalNeurons = ctx.neurons.reduce((sum, n) => sum + n.count, 0);
  if (totalNeurons < mentalStateDeepMinNeurons) return false;
  // No tap for 60s — check the most recent tap.
  if (ctx.lastTapTimestamps.length === 0) return true; // never tapped
  const newestTap = ctx.lastTapTimestamps[ctx.lastTapTimestamps.length - 1];
  return now - newestTap >= mentalStateDeepIdleMs;
}

/** Dormancy trigger: no taps AND no purchases for 120s. */
function checkDormancy(ctx: MentalStateContext, now: number): boolean {
  const { mentalStateDormancyIdleMs } = SYNAPSE_CONSTANTS;
  const newestTap = ctx.lastTapTimestamps.length === 0 ? 0 : ctx.lastTapTimestamps[ctx.lastTapTimestamps.length - 1];
  const idleSinceTap = now - newestTap;
  const idleSincePurchase = now - ctx.lastPurchaseTimestamp;
  return Math.min(idleSinceTap, idleSincePurchase) >= mentalStateDormancyIdleMs;
}

/**
 * Resolve current Mental State per priority hierarchy (MENTAL-1).
 * Returns null when no state is active. Pure — does NOT mutate state.
 *
 * Session-activity guard: if the player has done NOTHING (no taps, no purchases
 * registered, no insights, no focus event), return null. Prevents fresh sessions
 * with stale lastPurchaseTimestamp=0 from triggering Dormancy on the first tick
 * after a long absence. Mental States only meaningful when there's a baseline
 * of player activity to compare against.
 */
export function checkMentalState(
  state: Pick<GameState, 'lastTapTimestamps' | 'lastPurchaseTimestamp' | 'insightTimestamps' | 'focusAbove50Since' | 'neurons' | 'currentMentalState' | 'pendingHyperfocusBonus'>,
  now: number,
): MentalStateId | null {
  const ctx: MentalStateContext = state;
  // Session-activity guard: no recorded activity → no mental state.
  const hasActivity = ctx.lastTapTimestamps.length > 0 || ctx.lastPurchaseTimestamp > 0 || ctx.insightTimestamps.length > 0 || ctx.focusAbove50Since !== null;
  if (!hasActivity) return null;
  // Priority: Eureka > Flow > Hyperfocus > Deep > Dormancy
  if (checkEureka(ctx, now)) return 'eureka';
  if (checkFlow(ctx, now)) return 'flow';
  if (checkHyperfocus(ctx, now)) return 'hyperfocus';
  if (checkDeep(ctx, now)) return 'deep';
  if (checkDormancy(ctx, now)) return 'dormancy';
  return null;
}

/**
 * Production multiplier from active Mental State per §17 effect table.
 * MENTAL-8 (Sprint 6.8): Dormancy bonus enhanced when Mood ≥ 60 (Elevated/Euphoric).
 *
 * Note: `mood` field is added by Sprint 7.5 (GDD §16.3 Límbico). Until then,
 * the optional access defaults to undefined → enhanced-dormancy branch is skipped
 * (always 1.15 baseline). Sprint 7.5 wires the Mood field; this function works
 * forwards-compatibly without changes when mood appears.
 */
/**
 * Per-mental-state production multiplier per GDD §17 + MENTAL-3 (mental-state mult
 * stacking rule — applied multiplicatively post-softCap, NOT inside the softCap
 * input. Stacks alongside Mood mult per §16.3 in tick.ts step 8). Identity (×1) when
 * no mental state is active, or when the active state's effect is non-production
 * (e.g. Hyperfocus boosts NEXT Insight, not current production).
 */
export function mentalStateProductionMult(
  state: Pick<GameState, 'lastTapTimestamps' | 'lastPurchaseTimestamp' | 'insightTimestamps' | 'focusAbove50Since' | 'neurons' | 'currentMentalState' | 'pendingHyperfocusBonus'>,
  now: number,
): number {
  const ms = checkMentalState(state, now);
  if (ms === 'eureka') return 1.5; // CONST-OK: §17 effect table
  if (ms === 'flow') return 1.2;   // CONST-OK: §17 (tap production — applied at production layer)
  if (ms === 'hyperfocus') return 1; // Hyperfocus boosts NEXT Insight, not current production
  if (ms === 'deep') return 1.3;   // CONST-OK: §17
  if (ms === 'dormancy') {
    // MENTAL-8: high Mood (≥60) enhances Dormancy +30% vs base +15%. Mood field
    // ships Sprint 7.5; treat undefined as 50 (Calm) → baseline 1.15 fallback.
    const mood = (state as unknown as { mood?: number }).mood ?? 50; // CONST-OK: §16.3 Calm tier baseline
    return mood >= 60 ? 1.30 : 1.15; // CONST-OK: §17 + MENTAL-8 (Sprint 6.8 R-decision)
  }
  return 1;
}

/**
 * MENTAL-5: Discharge while Hyperfocus active sets Focus to 0 (exiting Hyperfocus)
 * but the "+1 Insight level" bonus is preserved as pendingHyperfocusBonus,
 * consumed by next Insight within 5 seconds (pendingHyperfocusBonusWindowMs).
 *
 * Returns: { effectiveLevel: 1|2|3, consumed: boolean }
 * - level: requested Insight level (1=Claro, 2=Profundo, 3=Trascendente)
 * - effectiveLevel: bumped by +1 if pending bonus active and not yet at level 3
 *                   At level 3, bonus extends DURATION instead per MENTAL-4 table
 * - consumed: whether the bonus was applied this call
 */
// Insight levels per §6: Claro=1, Profundo=2, Trascendente=3. INSIGHT_MAX_LEVEL is the hard cap.
const INSIGHT_MAX_LEVEL = SYNAPSE_CONSTANTS.insightMultiplier.length; // 3, derived from §6 multiplier table length
export type InsightLevel = 1 | 2 | 3; // CONST-OK: §6 Insight level union (matches INSIGHT_MAX_LEVEL)

export function consumePendingHyperfocusBonus(
  state: Pick<GameState, 'pendingHyperfocusBonus'>,
  level: InsightLevel,
): { effectiveLevel: InsightLevel; consumed: boolean; durationBoost: number } {
  if (!state.pendingHyperfocusBonus) {
    return { effectiveLevel: level, consumed: false, durationBoost: 0 };
  }
  // At max level (Trascendente per §6 MENTAL-4), bonus extends duration instead of bumping level.
  if (level >= INSIGHT_MAX_LEVEL) {
    return { effectiveLevel: level, consumed: true, durationBoost: SYNAPSE_CONSTANTS.hyperfocusLevel3DurationBoost };
  }
  return { effectiveLevel: (level + 1) as InsightLevel, consumed: true, durationBoost: 0 };
}

/**
 * Update focusAbove50Since tracking based on current focusBar.
 * Called from tick.ts after focus is updated. Returns Partial for merging.
 *
 * Logic:
 * - If focusBar > 0.5 and focusAbove50Since is null → start tracking (set to now)
 * - If focusBar <= 0.5 and focusAbove50Since is non-null → reset to null
 * - Otherwise no change
 */
export function updateHyperfocusTracking(
  state: Pick<GameState, 'focusBar' | 'focusAbove50Since'>,
  now: number,
): Partial<GameState> {
  const threshold = SYNAPSE_CONSTANTS.mentalStateHyperfocusFocusThreshold;
  if (state.focusBar > threshold) {
    if (state.focusAbove50Since === null) {
      return { focusAbove50Since: now };
    }
    return {};
  }
  // focusBar <= threshold
  if (state.focusAbove50Since !== null) {
    return { focusAbove50Since: null };
  }
  return {};
}

/**
 * Compute new mentalStateExpiry timestamp when state changes. Per §17 duration table.
 * Hyperfocus has no expiry (consumed by Insight); all others have fixed durations.
 */
export function mentalStateDuration(id: MentalStateId): number {
  if (id === 'flow') return SYNAPSE_CONSTANTS.mentalStateFlowDurationMs;
  if (id === 'deep') return SYNAPSE_CONSTANTS.mentalStateDeepDurationMs;
  if (id === 'eureka') return SYNAPSE_CONSTANTS.mentalStateEurekaDurationMs;
  if (id === 'dormancy') return SYNAPSE_CONSTANTS.mentalStateDormancyDurationMs;
  // hyperfocus: no expiry (consumed by Insight) — sentinel value
  return Number.MAX_SAFE_INTEGER;
}
