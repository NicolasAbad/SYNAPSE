// GDD.md §35 TICK-1 12-step pure reducer (CODE-9, TICK-1, RP-1, SPONT-1, MICRO-1, TAP-1).
import { SYNAPSE_CONSTANTS } from '../config/constants';
import { calculateProduction } from './production';
import { tryActivateInsight } from './insight';
import { UPGRADES_BY_ID } from '../config/upgrades';
import { mutationChargeIntervalMs, mutationMaxChargesOverride } from './mutations';
import { pathwayChargeRateMult } from './pathways';
import { checkRegionUnlock } from './regions';
import { shouldCheckSpontaneous, rollSpontaneous, activateSpontaneous } from './spontaneous';
import { archetypeSpontaneousRateMult } from './archetypes';
import { checkMentalState, mentalStateProductionMult, mentalStateDuration, updateHyperfocusTracking } from './mentalStates';
import { shouldTriggerMicroChallenge, rollMicroChallenge, activateMicroChallenge, isMicroChallengeFailed, isMicroChallengeComplete, clearMicroChallenge } from './microChallenges';
import { MICRO_CHALLENGES_BY_ID } from '../config/microChallenges';
import { stepShardDrip, chargeIntervalShardMult } from './shards';
import { moodProductionMult, moodMaxChargesBonus, applyMoodDrift } from './mood';
import { integratedMindMaxChargeBonus } from './integratedMind';
import { upgradeMasteryMult } from './mastery';
import type { GameState } from '../types/GameState';

// Structural intrinsics. Changing breaks determinism / spec.
const TICK_MS = 100; // CONST-OK §35 TICK-1
const HYPERFOCUS_BONUS_WINDOW_MS = 5_000; // CONST-OK §35 MENTAL-5
const RP_WINDOW_MS = 120_000; // CONST-OK §22 RP-1

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
  if (s.pendingHyperfocusBonus && s.mentalStateExpiry !== null && nowTimestamp - s.mentalStateExpiry > HYPERFOCUS_BONUS_WINDOW_MS) {
    s.pendingHyperfocusBonus = false;
  }
  // TODO Sprint 7: Mental State exit conditions per MENTAL-4 (§17).
}

/**
 * Step 2.5 (Phase 5): auto-activate Insight after expiry + before recalc so
 * this tick's effectiveProductionPerSecond reflects any new multiplier.
 * FOCUS-2: bar is pre-charged — a just-expired Insight re-fires immediately.
 */
function stepInsightActivation(s: GameState, nowTimestamp: number): void { Object.assign(s, tryActivateInsight(s, nowTimestamp)); }

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

/** Step 5: CORE-10 — flip consciousnessBarUnlocked at 50% of the threshold crossing. */
function stepConsciousnessBarUnlock(s: GameState): void {
  if (!s.consciousnessBarUnlocked && s.cycleGenerated >= SYNAPSE_CONSTANTS.consciousnessBarTriggerRatio * s.currentThreshold) {
    s.consciousnessBarUnlocked = true;
  }
}

/** Step 6: accumulate Discharge charges. Red de Alta Velocidad shortens interval by 1/mult. */
function stepDischargeChargeAccumulation(s: GameState, nowTimestamp: number): void {
  let intervalMs = SYNAPSE_CONSTANTS.chargeIntervalMinutes * 60_000; // CONST-OK (min→ms)
  for (const u of s.upgrades) {
    if (!u.purchased) continue;
    const e = UPGRADES_BY_ID[u.id]?.effect;
    if (e?.kind === 'charge_rate_mult') intervalMs = intervalMs / (e.mult * upgradeMasteryMult(s, u.id));
  }
  intervalMs = mutationChargeIntervalMs(s, intervalMs / pathwayChargeRateMult(s)) * chargeIntervalShardMult(s);
  const baseMax = mutationMaxChargesOverride(s) ?? s.dischargeMaxCharges;
  const effectiveMax = Math.min(baseMax + moodMaxChargesBonus(s) + integratedMindMaxChargeBonus(s), SYNAPSE_CONSTANTS.dischargeMaxChargesHardCap);
  if (nowTimestamp - s.dischargeLastTimestamp >= intervalMs) {
    s.dischargeCharges = Math.min(effectiveMax, s.dischargeCharges + 1);
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

/** Step 7.5: online Mood drift toward midpoint per §16.3 MOOD-3 (Sprint 7.9). */
function stepMoodDrift(s: GameState): void { s.mood = applyMoodDrift(s, TICK_MS); }

/** Step 8: Mental State + Mood mults per §17 / §16.3 — both stack post-softCap. */
function stepMentalStateTriggers(s: GameState, n: number): void {
  Object.assign(s, updateHyperfocusTracking(s, n));
  const ms = checkMentalState(s, n);
  if (ms !== s.currentMentalState) {
    s.currentMentalState = ms;
    s.mentalStateExpiry = ms === null ? null : n + mentalStateDuration(ms);
  }
  if (ms !== null) s.effectiveProductionPerSecond *= mentalStateProductionMult(s, n);
  s.effectiveProductionPerSecond *= moodProductionMult(s);
}

/** Step 9: Era 3 event activation (§23). No-op; UI reads prestigeCount + cycleAge. */
function stepEra3EventActivation(_s: GameState, _nowTimestamp: number): void {}

/** Step 10: Spontaneous event scheduling (SPONT-1). */
function stepSpontaneousEventTrigger(s: GameState, nowTimestamp: number): void {
  if (!shouldCheckSpontaneous(s, nowTimestamp)) return;
  const rateMult = archetypeSpontaneousRateMult(s); // Creativa ×, identity otherwise
  const def = rollSpontaneous(s, nowTimestamp, rateMult);
  if (def === null) {
    s.lastSpontaneousCheck = nowTimestamp;
    return;
  }
  Object.assign(s, activateSpontaneous(s, def, nowTimestamp));
}

/** Step 11: Micro-challenge resolve + roll per §18 + MICRO-1..5. */
function stepMicroChallengeTrigger(s: GameState, nowTimestamp: number): void {
  if (s.activeMicroChallenge !== null) {
    if (isMicroChallengeComplete(s, nowTimestamp)) {
      const def = MICRO_CHALLENGES_BY_ID[s.activeMicroChallenge.id];
      if (def !== undefined) s.sparks += def.reward;
      Object.assign(s, clearMicroChallenge());
    } else if (isMicroChallengeFailed(s, nowTimestamp)) {
      Object.assign(s, clearMicroChallenge());
    }
  }
  if (!shouldTriggerMicroChallenge(s, nowTimestamp)) return;
  const def = rollMicroChallenge(s, nowTimestamp);
  if (def === null) return;
  Object.assign(s, activateMicroChallenge(s, def, nowTimestamp));
}

/** Step 12: Anti-spam TAP-1 — derived per-tick flag, not stored. Consumed by the tap handler. */
function computeAntiSpam(state: GameState, nowTimestamp: number): boolean {
  const { antiSpamTapWindow, antiSpamTapIntervalMs, antiSpamVarianceThreshold, antiSpamBufferSize } = SYNAPSE_CONSTANTS;
  const stamps = state.lastTapTimestamps;
  if (stamps.length < antiSpamBufferSize) return false;
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
  stepInsightActivation(s, nowTimestamp);
  stepRecalcProduction(s);
  stepMoodDrift(s); // applied before mood mult per Sistema Límbico drift rule
  stepMentalStateTriggers(s, nowTimestamp); // Mental state mult applied before stepProduce
  stepProduce(s);
  stepShardDrip(s); // Hipocampo Memory Shard drip per GDD sixteen point one
  stepConsciousnessBarUnlock(s);
  // REG-1 unlock check (Sprint 5 Phase 5.4).
  checkRegionUnlock(s);
  stepDischargeChargeAccumulation(s, nowTimestamp);
  stepResonantPatternPrune(s, nowTimestamp);
  stepEra3EventActivation(s, nowTimestamp);
  stepSpontaneousEventTrigger(s, nowTimestamp);
  stepMicroChallengeTrigger(s, nowTimestamp);
  const antiSpamActive = computeAntiSpam(s, nowTimestamp);
  return { state: s, antiSpamActive };
}
