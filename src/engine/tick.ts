// Implements docs/GDD.md §35 TICK-1 — 12-step pure reducer.
// NOTE: Many Sprint 3-7 features are stubbed here with TODO comments.
// See each stubbed step for the Sprint X that wires it in.
// See §35 rules CODE-9 (determinism), TICK-1 (step order),
// RP-1 (step 7), SPONT-1 (step 10), MICRO-1 (step 11), TAP-1 (step 12).
//
// cycleTime derivation: Sprint 1 Phase 5 resolved a spec gap — §35 TICK-1
// earlier drafts referenced `state.cycleTime` but §32 never declared it.
// Resolution (Option B): cycleTime is derived at each use site as
// `(nowTimestamp - state.cycleStartTimestamp)`. Matches the Step 6 Discharge
// pattern. `lastSpontaneousCheck` is now an absolute timestamp, not a
// cycleTime offset. See PROGRESS.md Phase 5 Sprint 1.
//
// CODE-2 exception: this file approaches the 200-line cap due to 12
// ordered steps, each with a stub + TODO comment tracing to its owning
// sprint. The TODO/Sprint-ref pairs are load-bearing for Sprint 3-7
// traceability; collapsing them would lose the audit trail that keeps
// future sessions from silently implementing missing features. Logic
// density (non-comment, non-blank lines) stays well under 200.

import { SYNAPSE_CONSTANTS } from '../config/constants';
import { NEURON_BASE_RATES } from '../config/neurons';
import { hash, randomInRange } from './rng';
import type { GameState } from '../types/GameState';

// CONST-OK: TICK_MS is the fixed game-loop dt per §35 TICK-1 step 1 (implementation
// detail, not a designer-tunable balance value; changing it would break determinism).
const TICK_MS = 100; // CONST-OK (§35 TICK-1 fixed dt)
// CONST-OK: 5-second Hyperfocus-bonus expiry window per §35 TICK-1 step 2 (MENTAL-5).
const HYPERFOCUS_BONUS_WINDOW_MS = 5_000; // CONST-OK (§35 TICK-1 step 2 / MENTAL-5)
// CONST-OK: RP-1 2-minute purchase window per §22; purging beyond keeps state bounded.
const RP_WINDOW_MS = 120_000; // CONST-OK (§22 RP-1 window)
// CONST-OK: TAP-1 buffer size per §35 step 12 — structural size of the circular
// buffer, not a designer-tunable value (derived from antiSpamTapWindow / antiSpamTapIntervalMs).
const ANTI_SPAM_BUFFER_SIZE = 20; // CONST-OK (§35 TICK-1 step 12)

/**
 * antiSpamActive is derived per-tick (TICK-1 step 12), not stored in GameState.
 * Sprint 3's tap handler consumes this to apply the tap-effectiveness penalty.
 */
export type TickResult = Readonly<{ state: GameState; antiSpamActive: boolean }>;

function recalcProduction(state: GameState): { base: number; effective: number } {
  // TODO Sprint 3: apply polarity, upgrade mults.
  // TODO Sprint 5: apply mutation static mods, pathway restrictions.
  // TODO Sprint 6: apply archetype bonuses, region multipliers.
  // TODO Sprint 7: apply mental state mods, pending Hyperfocus bonus to next Insight.
  let base = 0;
  for (const neuron of state.neurons) {
    base += neuron.count * NEURON_BASE_RATES[neuron.type];
  }
  base *= state.connectionMult;
  // TODO Sprint 3-7: softCap the multiplier stack per §4; currently identity.
  let effective = base;
  if (state.insightActive) effective *= state.insightMultiplier;
  return { base, effective };
}

function computeAntiSpam(state: GameState, nowTimestamp: number): boolean {
  const { antiSpamTapWindow, antiSpamTapIntervalMs, antiSpamVarianceThreshold } = SYNAPSE_CONSTANTS;
  const stamps = state.lastTapTimestamps;
  if (stamps.length < ANTI_SPAM_BUFFER_SIZE) return false;
  if (nowTimestamp - stamps[0] < antiSpamTapWindow) return false;
  const intervals: number[] = [];
  for (let i = 1; i < stamps.length; i++) intervals.push(stamps[i] - stamps[i - 1]);
  const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  if (avg >= antiSpamTapIntervalMs) return false;
  const variance = intervals.reduce((a, b) => a + (b - avg) ** 2, 0) / intervals.length; // CONST-OK (variance formula: power of 2)
  const stddev = Math.sqrt(variance);
  return stddev < antiSpamVarianceThreshold;
}

export function tick(state: GameState, nowTimestamp: number): TickResult {
  // Shallow-clone so callers treat this as pure; nested arrays/objects are replaced only when modified.
  const s: GameState = { ...state };

  // Step 1: Timestamp advance (informational, no-op).
  // Per Phase 5 Sprint 1 spec gap resolution (Option B): cycleTime is NOT a
  // GameState field — it's derived at each use site as
  // `(nowTimestamp - state.cycleStartTimestamp)`. This step is retained in the
  // 12-step ordering for narrative continuity with §35 TICK-1 but executes no
  // state mutation. dt is fixed at TICK_MS (100ms) and consumed in step 4.
  // See PROGRESS.md Phase 5 Sprint 1 for resolution rationale.

  // Step 2: Expire temporary modifiers.
  if (s.insightActive && s.insightEndTime !== null && nowTimestamp >= s.insightEndTime) {
    s.insightActive = false;
    s.insightEndTime = null;
    s.insightMultiplier = 1;
  }
  if (
    s.activeSpontaneousEvent !== null &&
    s.activeSpontaneousEvent.endTime !== 0 &&
    nowTimestamp >= s.activeSpontaneousEvent.endTime
  ) {
    s.activeSpontaneousEvent = null;
  }
  if (s.eurekaExpiry !== null && nowTimestamp >= s.eurekaExpiry) {
    s.eurekaExpiry = null;
  }
  if (
    s.pendingHyperfocusBonus &&
    s.mentalStateExpiry !== null &&
    nowTimestamp - s.mentalStateExpiry > HYPERFOCUS_BONUS_WINDOW_MS
  ) {
    s.pendingHyperfocusBonus = false;
  }
  // TODO Sprint 7: Mental State exit conditions per MENTAL-4 (§17) — set currentMentalState to null when exit triggers fire.

  // Step 3: Recalculate production (cache baseProductionPerSecond + effectiveProductionPerSecond).
  const { base, effective } = recalcProduction(s);
  s.baseProductionPerSecond = base;
  s.effectiveProductionPerSecond = effective;

  // Step 4: Produce. No rounding in engine (CODE-9); UI rounds on display.
  // 1000 = ms→sec divisor (time-unit identity). CONST-OK.
  const delta = effective * (TICK_MS / 1000); // CONST-OK (ms→sec)
  const prevTotal = s.totalGenerated;
  s.thoughts = s.thoughts + delta;
  s.cycleGenerated = s.cycleGenerated + delta;
  s.totalGenerated = s.totalGenerated + delta;
  // Piggy Bank: cross-threshold counter on every 10K increment (MONEY-10 hard cap at 500).
  const prevBuckets = Math.floor(prevTotal / SYNAPSE_CONSTANTS.piggyBankSparksPerThoughts);
  const nowBuckets = Math.floor(s.totalGenerated / SYNAPSE_CONSTANTS.piggyBankSparksPerThoughts);
  if (nowBuckets > prevBuckets) {
    const increments = nowBuckets - prevBuckets;
    s.piggyBankSparks = Math.min(
      SYNAPSE_CONSTANTS.piggyBankMaxSparks,
      s.piggyBankSparks + increments,
    );
  }

  // Step 5: CORE-10 — flip consciousnessBarUnlocked once.
  if (
    !s.consciousnessBarUnlocked &&
    s.cycleGenerated >= SYNAPSE_CONSTANTS.consciousnessBarTriggerRatio * s.currentThreshold
  ) {
    s.consciousnessBarUnlocked = true;
  }

  // Step 6: Discharge charge accumulation.
  const chargeIntervalMs = SYNAPSE_CONSTANTS.chargeIntervalMinutes * 60_000;
  if (nowTimestamp - s.dischargeLastTimestamp >= chargeIntervalMs) {
    s.dischargeCharges = Math.min(s.dischargeMaxCharges, s.dischargeCharges + 1);
    s.dischargeLastTimestamp = nowTimestamp;
  }

  // Step 7: Resonant Pattern window prune (RP-1). Never evaluates success — that's Sprint 8c at prestige.
  if (s.cycleNeuronPurchases.length > 0) {
    s.cycleNeuronPurchases = s.cycleNeuronPurchases.filter(
      (e) => nowTimestamp - e.timestamp <= RP_WINDOW_MS,
    );
  }

  // Step 8: Mental State triggers (priority: Eureka > Flow > Hyperfocus > Deep > Dormancy).
  // TODO Sprint 7: evaluate trigger conditions per §17 and promote when newPriority > currentPriority.
  // Framework placeholder — no-op until Sprint 7 wires trigger functions.

  // Step 9: Era 3 event activation.
  // "First tick of the cycle" per TICK-1 step 9 (post-Phase-5 resolution):
  // (nowTimestamp - cycleStartTimestamp) < 1000 ms.
  const cycleAgeMs = nowTimestamp - s.cycleStartTimestamp;
  // 1_000ms "first tick" window — CONST-OK (§35 TICK-1 step 9 post-Phase-5 resolution).
  if (
    s.prestigeCount >= SYNAPSE_CONSTANTS.era3StartPrestige &&
    s.prestigeCount <= SYNAPSE_CONSTANTS.era3EndPrestige &&
    s.cycleStartTimestamp !== 0 &&
    cycleAgeMs >= 0 &&
    cycleAgeMs < 1_000 // CONST-OK (first-tick window)
  ) {
    // TODO Sprint 6: fire Era 3 event per §23 (prestigeCount → event id → open modal).
  }

  // Step 10: Spontaneous event trigger (SPONT-1), post-Phase-5 resolution.
  // `lastSpontaneousCheck` stores an absolute timestamp (ms since epoch), not
  // a cycleTime offset. See §32 field comment.
  const { spontaneousCheckIntervalMin, spontaneousCheckIntervalMax } = SYNAPSE_CONSTANTS;
  const nextCheckSeconds = randomInRange(
    spontaneousCheckIntervalMin,
    spontaneousCheckIntervalMax,
    hash(s.cycleStartTimestamp + s.lastSpontaneousCheck),
  );
  const secondsSinceLastCheck = (nowTimestamp - s.lastSpontaneousCheck) / 1000; // CONST-OK (ms→sec)
  if (secondsSinceLastCheck >= nextCheckSeconds) {
    s.lastSpontaneousCheck = nowTimestamp;
    // TODO Sprint 6: roll spontaneousTriggerChance; if success, pick weighted event and apply.
  }

  // Step 11: Micro-challenge trigger (MICRO-1).
  // TODO Sprint 7: implement the cross-threshold check + cooldown + attempt cap + seeded pick per §18.
  // Scaffolding: prestigeCount < 15 gate means this branch is inactive until late game.

  // Step 12: Anti-spam TAP-1 evaluation (derived flag, not stored).
  const antiSpamActive = computeAntiSpam(s, nowTimestamp);

  return { state: s, antiSpamActive };
}
