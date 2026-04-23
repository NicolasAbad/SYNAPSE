// Implements GDD.md §19 OFFLINE-1..11 — pure offline progress engine (CODE-9).
// Sprint 7.10 Phase 7.10.2: base formula + upgrade/archetype/GP/decision/mood
// stack + ratio cap + time anomaly detection. Phase 7.10.3 layers Lucid Dream
// roll + Procedural shard drip + Mutation temporal averaging on top.
// Consumer: src/store/gameStore.ts applyOfflineReturn action (Phase 7.10.4).

import { SYNAPSE_CONSTANTS } from '../config/constants';
import { UPGRADES_BY_ID } from '../config/upgrades';
import { PATTERN_DECISIONS } from '../config/patterns';
import { effectiveMoodTier, averageMoodOverWindow } from './mood';
import type { GameState } from '../types/GameState';

export interface OfflineSummary {
  readonly elapsedMs: number;
  readonly gained: number;
  readonly efficiency: number;
  readonly avgMood: number;
  readonly avgMoodTier: number;
  readonly capHours: number;
  readonly cappedHit: boolean;
  readonly timeAnomaly: 'backward' | 'over_cap' | null;
  readonly enhancedDischargeAvailable: boolean;
  readonly lucidDreamTriggered: boolean; // next phase wires the Lucid Dream roll
}

const EMPTY_SUMMARY: OfflineSummary = {
  elapsedMs: 0, gained: 0, efficiency: 0, avgMood: 0, avgMoodTier: 0, capHours: 0,
  cappedHit: false, timeAnomaly: null, enhancedDischargeAvailable: false, lucidDreamTriggered: false,
};

/** OFFLINE-6: effective cap hours = max of all owned `offline_cap_set` effects, clamped to maxOfflineHours. */
export function computeOfflineCapHours(state: Pick<GameState, 'upgrades'>): number {
  let cap: number = SYNAPSE_CONSTANTS.baseOfflineCapHours;
  for (const u of state.upgrades) {
    if (!u.purchased) continue;
    const e = UPGRADES_BY_ID[u.id]?.effect;
    if (e?.kind === 'offline_cap_set' && e.hours > cap) cap = e.hours;
  }
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

/** OFFLINE-5: detect clock backwards / over-cap. Returns clamped elapsed ms + anomaly kind + cap. */
export function detectTimeAnomaly(
  state: Pick<GameState, 'lastActiveTimestamp' | 'upgrades'>,
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
  let gained = state.baseProductionPerSecond * elapsedSec * efficiency;
  const remaining = state.currentThreshold - state.cycleGenerated;
  let cappedHit = false;
  if (remaining > 0 && gained >= remaining) {
    gained = remaining;
    cappedHit = true;
  }
  const enhancedDischargeAvailable = cappedHit && state.nextDischargeBonus > 0;
  return {
    state: {
      ...state,
      thoughts: state.thoughts + gained,
      cycleGenerated: state.cycleGenerated + gained,
      totalGenerated: state.totalGenerated + gained,
      lastActiveTimestamp: nowTimestamp,
    },
    summary: {
      elapsedMs: clampedElapsedMs, gained, efficiency, avgMood, avgMoodTier, capHours,
      cappedHit, timeAnomaly: anomaly, enhancedDischargeAvailable, lucidDreamTriggered: false,
    },
  };
}
