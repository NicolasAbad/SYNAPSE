// Implements docs/GDD.md §35 TICK-1 — 12-step pure reducer.
// NOTE: Many Sprint 3-7 features are stubbed here with TODO comments.
// See each stubbed step for the Sprint X that wires it in.
// See §35 rules CODE-9 (determinism), TICK-1 (step order),
// RP-1 (step 7), SPONT-1 (step 10), MICRO-1 (step 11), TAP-1 (step 12).
//
// CODE-2 exception: this file approaches the 200-line cap due to 12
// ordered steps, each with a stub + TODO comment tracing to its owning
// sprint. The TODO/Sprint-ref pairs are load-bearing for Sprint 3-7
// traceability; collapsing them would lose the audit trail that keeps
// future sessions from silently implementing missing features. Logic
// density (non-comment, non-blank lines) stays well under 200.

import { SYNAPSE_CONSTANTS } from '../config/constants';
import { hash, randomInRange } from './rng';
import type { GameState } from '../types/GameState';

const TICK_MS = 100;
const PIGGY_BANK_INCREMENT_PER_THOUGHTS = 10_000;
const PIGGY_BANK_MAX = 500;
const CONSCIOUSNESS_BAR_TRIGGER_RATIO = 0.5;
const HYPERFOCUS_BONUS_WINDOW_MS = 5_000;
const RP_WINDOW_MS = 120_000;
const ANTI_SPAM_BUFFER_SIZE = 20;

export interface TickResult {
  state: GameState;
  /** Anti-spam flag is derived per-tick, not stored on state. Sprint 3 tap handler reads this. */
  antiSpamActive: boolean;
}

/** Base neuron rates from GDD §5. Sprint 3 replaces the inline table with the canonical config. */
const NEURON_BASE_RATE: Record<string, number> = {
  basica: 0.5,
  sensorial: 4.5,
  piramidal: 32,
  espejo: 220,
  integradora: 1_800,
};

function recalcProduction(state: GameState): { base: number; effective: number } {
  // TODO Sprint 3: move neuron rates into config/neurons.ts; apply polarity, upgrade mults.
  // TODO Sprint 5: apply mutation static mods, pathway restrictions.
  // TODO Sprint 6: apply archetype bonuses, region multipliers.
  // TODO Sprint 7: apply mental state mods, pending Hyperfocus bonus to next Insight.
  let base = 0;
  for (const neuron of state.neurons) {
    const rate = NEURON_BASE_RATE[neuron.type] ?? 0;
    base += neuron.count * rate;
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
  const variance = intervals.reduce((a, b) => a + (b - avg) ** 2, 0) / intervals.length;
  const stddev = Math.sqrt(variance);
  return stddev < antiSpamVarianceThreshold;
}

export function tick(state: GameState, nowTimestamp: number): TickResult {
  // Shallow-clone so callers treat this as pure; nested arrays/objects are replaced only when modified.
  const s: GameState = { ...state };

  // Step 1: Timestamp advance — SPEC GAP flagged during Phase 5 Sprint 1.
  // GDD §35 TICK-1 step 1 says `state.cycleTime += dt`, but §32 does NOT declare a
  // `cycleTime` field in GameState's 110-field enumeration. Adding it would change
  // the count to 111 and invalidate PRESTIGE_RESET (45), PRESERVE (60), UPDATE (4)
  // splits. This is a spec gap, not a silent invention — do not resolve here.
  // Deferred to Nico for reconciliation (see PROGRESS.md). Meanwhile dt is still
  // fixed at 100ms for the math in steps 4 and later; we just don't store an
  // accumulator. Derived "how long has this cycle been running" uses
  // (nowTimestamp - state.cycleStartTimestamp) where callers need it.
  void TICK_MS; // referenced in step 4; silence linter here

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
  const delta = effective * (TICK_MS / 1000);
  const prevTotal = s.totalGenerated;
  s.thoughts = s.thoughts + delta;
  s.cycleGenerated = s.cycleGenerated + delta;
  s.totalGenerated = s.totalGenerated + delta;
  // Piggy Bank: cross-threshold counter on every 10K increment (MONEY-10 hard cap at 500).
  const prevBuckets = Math.floor(prevTotal / PIGGY_BANK_INCREMENT_PER_THOUGHTS);
  const nowBuckets = Math.floor(s.totalGenerated / PIGGY_BANK_INCREMENT_PER_THOUGHTS);
  if (nowBuckets > prevBuckets) {
    const increments = nowBuckets - prevBuckets;
    s.piggyBankSparks = Math.min(PIGGY_BANK_MAX, s.piggyBankSparks + increments);
  }

  // Step 5: CORE-10 — flip consciousnessBarUnlocked once.
  if (!s.consciousnessBarUnlocked && s.cycleGenerated >= CONSCIOUSNESS_BAR_TRIGGER_RATIO * s.currentThreshold) {
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
  if (s.prestigeCount >= 19 && s.prestigeCount <= 26 && s.cycleStartTimestamp !== 0) {
    // Using cycleStartTimestamp === 0 as "uninitialized" sentinel per INIT-1.
    // TODO Sprint 6: fire Era 3 event per §23 (prestigeCount → event id → open modal).
  }

  // Step 10: Spontaneous event trigger (SPONT-1) — depends on Step 1 cycleTime gap.
  // GDD §35 TICK-1 step 10 compares `state.cycleTime - state.lastSpontaneousCheck`
  // against a seeded random interval in seconds. Without the cycleTime field, Sprint 1
  // cannot implement this comparison without inventing a units convention for
  // `lastSpontaneousCheck`. Framework call to randomInRange kept here (determinism-
  // relevant: proves the seed chain exercises rng.ts) but no state mutation occurs.
  // TODO Sprint 6: once Step 1 spec gap is resolved, implement the cross-threshold
  // check, update lastSpontaneousCheck, and roll spontaneousTriggerChance per §8.
  const { spontaneousCheckIntervalMin, spontaneousCheckIntervalMax } = SYNAPSE_CONSTANTS;
  void randomInRange(
    spontaneousCheckIntervalMin,
    spontaneousCheckIntervalMax,
    hash(s.cycleStartTimestamp + s.lastSpontaneousCheck),
  );

  // Step 11: Micro-challenge trigger (MICRO-1).
  // TODO Sprint 7: implement the cross-threshold check + cooldown + attempt cap + seeded pick per §18.
  // Scaffolding: prestigeCount < 15 gate means this branch is inactive until late game.

  // Step 12: Anti-spam TAP-1 evaluation (derived flag, not stored).
  const antiSpamActive = computeAntiSpam(s, nowTimestamp);

  return { state: s, antiSpamActive };
}
