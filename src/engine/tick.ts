// Implements docs/GDD.md §35 TICK-1 — 12-step pure reducer.
// Rules: CODE-9 (determinism), TICK-1 (order), RP-1 (§22 step 7), SPONT-1 (step 10),
// MICRO-1 (step 11), TAP-1 (step 12).
// cycleTime derived per-site as `nowTimestamp - state.cycleStartTimestamp` (Phase 5
// Sprint 1 Option B resolution). `lastSpontaneousCheck` is an absolute timestamp.
// Phase 3.5: extracted each step into its own function (CODE-2 50-line rule).

import { SYNAPSE_CONSTANTS } from '../config/constants';
import { calculateProduction } from './production';
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
// CONST-OK: Era 3 "first tick of the cycle" window per §35 TICK-1 step 9 post-Phase-5.
const ERA3_FIRST_TICK_WINDOW_MS = 1_000; // CONST-OK (§35 TICK-1 step 9)

/**
 * antiSpamActive is derived per-tick (TICK-1 step 12), not stored in GameState.
 * Sprint 3's tap handler consumes this to apply the tap-effectiveness penalty.
 */
export type TickResult = Readonly<{ state: GameState; antiSpamActive: boolean }>;

/** Step 2: Expire temporary modifiers that have passed their endTime. */
function stepExpireModifiers(s: GameState, nowTimestamp: number): void {
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
}

/** Step 3: Cache base/effective production-per-second for tick + UI consumers (production.ts owns the §4 formula). */
function stepRecalcProduction(s: GameState): void {
  const { base, effective } = calculateProduction(s);
  s.baseProductionPerSecond = base;
  s.effectiveProductionPerSecond = effective;
}

/** Step 4: Produce thoughts over dt. No rounding (CODE-9). Tracks Piggy Bank bucket crossings. */
function stepProduce(s: GameState): void {
  const delta = s.effectiveProductionPerSecond * (TICK_MS / 1000); // CONST-OK (ms→sec)
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
}

/** Step 5: CORE-10 — flip consciousnessBarUnlocked once when cycleGenerated crosses 50% of the threshold. */
function stepConsciousnessBarUnlock(s: GameState): void {
  if (
    !s.consciousnessBarUnlocked &&
    s.cycleGenerated >= SYNAPSE_CONSTANTS.consciousnessBarTriggerRatio * s.currentThreshold
  ) {
    s.consciousnessBarUnlocked = true;
  }
}

/** Step 6: Accumulate Discharge charges (1 per 20 min; capped at dischargeMaxCharges). */
function stepDischargeChargeAccumulation(s: GameState, nowTimestamp: number): void {
  const chargeIntervalMs = SYNAPSE_CONSTANTS.chargeIntervalMinutes * 60_000;
  if (nowTimestamp - s.dischargeLastTimestamp >= chargeIntervalMs) {
    s.dischargeCharges = Math.min(s.dischargeMaxCharges, s.dischargeCharges + 1);
    s.dischargeLastTimestamp = nowTimestamp;
  }
}

/** Step 7: RP-1 — prune the 2-minute neuron-purchase window (evaluated at prestige in Sprint 8c). */
function stepResonantPatternPrune(s: GameState, nowTimestamp: number): void {
  if (s.cycleNeuronPurchases.length > 0) {
    s.cycleNeuronPurchases = s.cycleNeuronPurchases.filter(
      (e) => nowTimestamp - e.timestamp <= RP_WINDOW_MS,
    );
  }
}

/**
 * Step 8: Mental State triggers (priority: Eureka > Flow > Hyperfocus > Deep > Dormancy).
 * TODO Sprint 7: evaluate trigger conditions per §17; promote when newPriority > currentPriority.
 */
function stepMentalStateTriggers(_s: GameState, _nowTimestamp: number): void {
  // Framework placeholder — no-op until Sprint 7 wires MENTAL-4 trigger functions.
}

/**
 * Step 9: Era 3 event activation on the first tick of a cycle (cycleAge < 1s) when
 * prestigeCount is in [era3StartPrestige, era3EndPrestige].
 * TODO Sprint 6: fire Era 3 event per §23 (prestigeCount → event id → open modal).
 */
function stepEra3EventActivation(s: GameState, nowTimestamp: number): void {
  const cycleAgeMs = nowTimestamp - s.cycleStartTimestamp;
  if (
    s.prestigeCount >= SYNAPSE_CONSTANTS.era3StartPrestige &&
    s.prestigeCount <= SYNAPSE_CONSTANTS.era3EndPrestige &&
    s.cycleStartTimestamp !== 0 &&
    cycleAgeMs >= 0 &&
    cycleAgeMs < ERA3_FIRST_TICK_WINDOW_MS
  ) {
    // TODO Sprint 6: modal dispatch goes here.
  }
}

/**
 * Step 10: Spontaneous event scheduling (SPONT-1). `lastSpontaneousCheck` stores an
 * absolute timestamp (ms since epoch), not a cycleTime offset. See §32 field comment.
 * TODO Sprint 6: roll spontaneousTriggerChance; if success, pick weighted event + apply.
 */
function stepSpontaneousEventTrigger(s: GameState, nowTimestamp: number): void {
  const { spontaneousCheckIntervalMin, spontaneousCheckIntervalMax } = SYNAPSE_CONSTANTS;
  const nextCheckSeconds = randomInRange(
    spontaneousCheckIntervalMin,
    spontaneousCheckIntervalMax,
    hash(s.cycleStartTimestamp + s.lastSpontaneousCheck),
  );
  const secondsSinceLastCheck = (nowTimestamp - s.lastSpontaneousCheck) / 1000; // CONST-OK (ms→sec)
  if (secondsSinceLastCheck >= nextCheckSeconds) {
    s.lastSpontaneousCheck = nowTimestamp;
    // Sprint 6 adds the roll + pick + apply here.
  }
}

/**
 * Step 11: Micro-challenge trigger (MICRO-1).
 * TODO Sprint 7: cross-threshold check + cooldown + attempt cap + seeded pick per §18.
 * Scaffolding: prestigeCount < 15 gate means this branch is inactive until late game.
 */
function stepMicroChallengeTrigger(_s: GameState, _nowTimestamp: number): void {
  // Framework placeholder — no-op until Sprint 7 wires MICRO-1 trigger functions.
}

/** Step 12: Anti-spam TAP-1 — derived per-tick flag, not stored. Consumed by the tap handler. */
function computeAntiSpam(state: GameState, nowTimestamp: number): boolean {
  const { antiSpamTapWindow, antiSpamTapIntervalMs, antiSpamVarianceThreshold } = SYNAPSE_CONSTANTS;
  const stamps = state.lastTapTimestamps;
  if (stamps.length < ANTI_SPAM_BUFFER_SIZE) return false;
  if (nowTimestamp - stamps[0] < antiSpamTapWindow) return false;
  const intervals: number[] = [];
  for (let i = 1; i < stamps.length; i++) intervals.push(stamps[i] - stamps[i - 1]);
  const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  if (avg >= antiSpamTapIntervalMs) return false;
  const variance = intervals.reduce((a, b) => a + (b - avg) ** 2, 0) / intervals.length; // CONST-OK (variance: power of 2)
  const stddev = Math.sqrt(variance);
  return stddev < antiSpamVarianceThreshold;
}

export function tick(state: GameState, nowTimestamp: number): TickResult {
  const s: GameState = { ...state };
  // Step 1: Timestamp advance — no-op (Phase 5 Sprint 1 spec gap resolution).
  stepExpireModifiers(s, nowTimestamp);
  stepRecalcProduction(s);
  stepProduce(s);
  stepConsciousnessBarUnlock(s);
  stepDischargeChargeAccumulation(s, nowTimestamp);
  stepResonantPatternPrune(s, nowTimestamp);
  stepMentalStateTriggers(s, nowTimestamp);
  stepEra3EventActivation(s, nowTimestamp);
  stepSpontaneousEventTrigger(s, nowTimestamp);
  stepMicroChallengeTrigger(s, nowTimestamp);
  const antiSpamActive = computeAntiSpam(s, nowTimestamp);
  return { state: s, antiSpamActive };
}
