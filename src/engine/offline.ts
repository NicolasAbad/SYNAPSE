// Implements GDD.md §19 OFFLINE-1..11 — pure offline progress engine (CODE-9).
// Sprint 7.10 Phase 7.10.2: base formula + efficiency stack + cap + time anomaly.
// Sprint 7.10 Phase 7.10.3: Mutation temporal averaging (MUT-1), OFFLINE-9
// Procedural shard drip, Lucid Dream deterministic RNG roll (§30 RNG-1).
// Consumer: src/store/gameStore.ts applyOfflineReturn action (Phase 7.10.4).

import { SYNAPSE_CONSTANTS } from '../config/constants';
import { UPGRADES_BY_ID } from '../config/upgrades';
import { MUTATIONS_BY_ID } from '../config/mutations';
import { PATTERN_DECISIONS } from '../config/patterns';
import { effectiveMoodTier, averageMoodOverWindow } from './mood';
import { resonanceOfflineCapBonusHours } from './resonanceUpgrades';
import { seededRandom, hash } from './rng';
import type { GameState } from '../types/GameState';
import type { OfflineSummary } from '../types';

export type { OfflineSummary };

const EMPTY_SUMMARY: OfflineSummary = {
  elapsedMs: 0, gained: 0, efficiency: 0, avgMood: 0, avgMoodTier: 0, capHours: 0,
  cappedHit: false, timeAnomaly: null, enhancedDischargeAvailable: false, lucidDreamTriggered: false,
};

/** OFFLINE-6: effective cap hours = max of all owned `offline_cap_set` effects, clamped to maxOfflineHours. */
export function computeOfflineCapHours(state: Pick<GameState, 'upgrades' | 'resonanceUpgrades'>): number {
  let cap: number = SYNAPSE_CONSTANTS.baseOfflineCapHours;
  for (const u of state.upgrades) {
    if (!u.purchased) continue;
    const e = UPGRADES_BY_ID[u.id]?.effect;
    if (e?.kind === 'offline_cap_set' && e.hours > cap) cap = e.hours;
  }
  // GDD §15 time_dilation (Tier 2) — +4h permanent; stacks ADDITIVELY on top
  // of the max upgrade-set cap. Then clamped at maxOfflineHours.
  cap += resonanceOfflineCapBonusHours(state);
  return Math.min(cap, SYNAPSE_CONSTANTS.maxOfflineHours);
}

/** OFFLINE-1..4/11: base × upgrades × archetype × GP × pattern decisions × avg-mood tier, capped at maxOfflineEfficiencyRatio. */
export function computeOfflineEfficiencyMult(
  state: Pick<GameState, 'upgrades' | 'archetype' | 'isSubscribed' | 'patternDecisions'>,
  avgMoodTierIndex: 0 | 1 | 2 | 3 | 4, // CONST-OK (5-tier MoodTierIndex enum mirror)
): number {
  let eff: number = SYNAPSE_CONSTANTS.baseOfflineEfficiency;
  for (const u of state.upgrades) {
    if (!u.purchased) continue;
    const e = UPGRADES_BY_ID[u.id]?.effect;
    if (e?.kind === 'offline_efficiency_mult') eff *= e.mult;
    else if (e?.kind === 'offline_efficiency_and_autocharge') eff *= e.mult;
  }
  for (const node of SYNAPSE_CONSTANTS.patternDecisionNodes) {
    const choice = state.patternDecisions[node];
    if (choice === undefined) continue;
    const def = PATTERN_DECISIONS[node];
    const effect = def[choice].effect;
    if (effect.kind === 'offline_efficiency_mult') eff *= effect.mult;
  }
  if (state.archetype === 'empatica') eff *= SYNAPSE_CONSTANTS.empaticaOfflineEfficiencyMult;
  if (state.isSubscribed) eff *= SYNAPSE_CONSTANTS.geniusPassOfflineEfficiencyMult;
  eff *= SYNAPSE_CONSTANTS.moodTierProductionMults[avgMoodTierIndex];
  return Math.min(eff, SYNAPSE_CONSTANTS.maxOfflineEfficiencyRatio);
}

/**
 * MUT-1: temporal mutations (`sprint`, `crescendo`) use AVG-over-cycle production
 * during offline (not peak) — averages the two mult poles. Per `affectsOffline` flag
 * in src/config/mutations.ts. Non-temporal mutations leave baseProductionPerSecond
 * unchanged (their mult is already baked into the pre-cached rate by production.ts).
 */
export function effectiveOfflineProductionPerSecond(
  state: Pick<GameState, 'baseProductionPerSecond' | 'currentMutation'>,
): number {
  const peak = state.baseProductionPerSecond;
  const id = state.currentMutation?.id;
  if (id === undefined) return peak;
  const mutation = MUTATIONS_BY_ID[id];
  if (!mutation?.affectsOffline) return peak;
  const e = mutation.effect;
  if (e.kind === 'sprint') return peak * (e.earlyMult + e.lateMult) * 0.5; // CONST-OK arithmetic mean
  if (e.kind === 'crescendo') return peak * (e.startMult + e.endMult) * 0.5; // CONST-OK arithmetic mean
  return peak;
}

/** OFFLINE-9: Procedural shard drip during offline at `shardDripOfflineRateMult × base`. Emo/Epi do NOT drip offline. */
export function offlineProceduralShardDrip(elapsedMs: number): number {
  const elapsedMinutes = elapsedMs / 60_000; // CONST-OK ms→min
  return SYNAPSE_CONSTANTS.shardDripBasePerMinute * SYNAPSE_CONSTANTS.shardDripOfflineRateMult * elapsedMinutes;
}

/**
 * Lucid Dream Option A buff (§19) — production multiplier while
 * `lucidDreamActiveUntil` is in the future. Returns 1.0 when expired/null.
 * Sprint 7.10 Phase 7.10.5 — applied post-Mood mult in tick.ts step 8.
 */
export function lucidDreamProductionMult(
  state: Pick<GameState, 'lucidDreamActiveUntil'>,
  nowTimestamp: number,
): number {
  if (state.lucidDreamActiveUntil === null) return 1;
  if (nowTimestamp >= state.lucidDreamActiveUntil) return 1;
  return SYNAPSE_CONSTANTS.lucidDreamOptionAProductionMult;
}

/**
 * Lucid Dream (§19) deterministic RNG roll via §30 RNG-1. Seed derived from
 * FNV-1a hash over `(lastActiveTimestamp, nowTimestamp)` — stable across replays.
 * Gates: P10+ + elapsed ≥ lucidDreamMinOfflineMinutes. Probability: 33% default,
 * 100% for Empática archetype (stacked with no other mults — GDD §19 override).
 */
export function rollLucidDream(
  state: Pick<GameState, 'prestigeCount' | 'archetype' | 'lastActiveTimestamp'>,
  nowTimestamp: number,
  elapsedMs: number,
): boolean {
  if (state.prestigeCount < SYNAPSE_CONSTANTS.lucidDreamUnlockPrestige) return false;
  const minElapsed = SYNAPSE_CONSTANTS.lucidDreamMinOfflineMinutes * 60_000; // CONST-OK min→ms
  if (elapsedMs < minElapsed) return false;
  const probability = state.archetype === 'empatica'
    ? SYNAPSE_CONSTANTS.lucidDreamEmpaticaProbability
    : SYNAPSE_CONSTANTS.lucidDreamBaseProbability;
  const seed = hash(`lucid_${state.lastActiveTimestamp}_${nowTimestamp}`);
  return seededRandom(seed) < probability;
}

/** OFFLINE-5: detect clock backwards / over-cap. Returns clamped elapsed ms + anomaly kind + cap. */
export function detectTimeAnomaly(
  state: Pick<GameState, 'lastActiveTimestamp' | 'upgrades' | 'resonanceUpgrades'>,
  nowTimestamp: number,
): { anomaly: 'backward' | 'over_cap' | null; clampedElapsedMs: number; capHours: number } {
  const capHours = computeOfflineCapHours(state);
  const capMs = capHours * 3600 * 1000; // CONST-OK h→ms unit conversion
  const rawElapsedMs = nowTimestamp - state.lastActiveTimestamp;
  if (rawElapsedMs < 0) return { anomaly: 'backward', clampedElapsedMs: 0, capHours };
  const overThreshold = capMs * SYNAPSE_CONSTANTS.offlineTimeAnomalyOverCapMult;
  if (rawElapsedMs > overThreshold) return { anomaly: 'over_cap', clampedElapsedMs: capMs, capHours };
  return { anomaly: null, clampedElapsedMs: Math.min(rawElapsedMs, capMs), capHours };
}

/**
 * OFFLINE-1 orchestrator. Pure.
 * Short-circuits when elapsed < offlineMinMinutes (timestamp still advances, summary empty).
 * OFFLINE-2: caps gained at `currentThreshold - cycleGenerated`, sets cappedHit flag.
 * OFFLINE-7: cappedHit + nextDischargeBonus > 0 → enhancedDischargeAvailable.
 */
export function applyOfflineProgress(state: GameState, nowTimestamp: number): { state: GameState; summary: OfflineSummary } {
  const { anomaly, clampedElapsedMs, capHours } = detectTimeAnomaly(state, nowTimestamp);
  if (anomaly === 'backward') {
    return {
      state: { ...state, lastActiveTimestamp: nowTimestamp },
      summary: { ...EMPTY_SUMMARY, timeAnomaly: 'backward', capHours },
    };
  }
  const elapsedMinMs = SYNAPSE_CONSTANTS.offlineMinMinutes * 60_000; // CONST-OK min→ms
  if (clampedElapsedMs < elapsedMinMs) {
    return {
      state: { ...state, lastActiveTimestamp: nowTimestamp },
      summary: { ...EMPTY_SUMMARY, elapsedMs: clampedElapsedMs, capHours, timeAnomaly: anomaly },
    };
  }
  const windowStartMs = nowTimestamp - clampedElapsedMs;
  const avgMood = averageMoodOverWindow(state, windowStartMs);
  const avgMoodTier = effectiveMoodTier({ mood: avgMood, upgrades: state.upgrades });
  const efficiency = computeOfflineEfficiencyMult(state, avgMoodTier);
  const elapsedSec = clampedElapsedMs / 1000; // CONST-OK ms→s
  const prodPerSec = effectiveOfflineProductionPerSecond(state);
  let gained = prodPerSec * elapsedSec * efficiency;
  const remaining = state.currentThreshold - state.cycleGenerated;
  let cappedHit = false;
  if (remaining > 0 && gained >= remaining) {
    gained = remaining;
    cappedHit = true;
  }
  const enhancedDischargeAvailable = cappedHit && state.nextDischargeBonus > 0;
  const procDrip = offlineProceduralShardDrip(clampedElapsedMs);
  const lucidDreamTriggered = rollLucidDream(state, nowTimestamp, clampedElapsedMs);
  return {
    state: {
      ...state,
      thoughts: state.thoughts + gained,
      cycleGenerated: state.cycleGenerated + gained,
      totalGenerated: state.totalGenerated + gained,
      lastActiveTimestamp: nowTimestamp,
      memoryShards: {
        emotional: state.memoryShards.emotional,
        procedural: state.memoryShards.procedural + procDrip,
        episodic: state.memoryShards.episodic,
      },
    },
    summary: {
      elapsedMs: clampedElapsedMs, gained, efficiency, avgMood, avgMoodTier, capHours,
      cappedHit, timeAnomaly: anomaly, enhancedDischargeAvailable, lucidDreamTriggered,
    },
  };
}
