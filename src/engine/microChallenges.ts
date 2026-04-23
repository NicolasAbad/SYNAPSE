// Implements docs/GDD.md §18 Micro-challenges + MICRO-1..5 rules. CODE-9 deterministic.
// Sprint 7 Phase 7.4. Engine: trigger eligibility, deterministic roll, complete/fail check.

import type { GameState } from '../types/GameState';
import { MICRO_CHALLENGES, MICRO_CHALLENGES_BY_ID } from '../config/microChallenges';
import type { MicroChallengeDef } from '../config/microChallenges';
import { SYNAPSE_CONSTANTS } from '../config/constants';
import { hash, mulberry32 } from './rng';

const MICRO_UNLOCK_PRESTIGE = 15; // CONST-OK §18 (P15 micro-challenges unlock)

/** Should the engine try to roll a new challenge this tick? Per MICRO-1. */
export function shouldTriggerMicroChallenge(
  state: Pick<GameState, 'prestigeCount' | 'cycleGenerated' | 'currentThreshold' | 'activeMicroChallenge' | 'lastMicroChallengeTime' | 'cycleMicroChallengesAttempted'>,
  now: number,
): boolean {
  if (state.prestigeCount < MICRO_UNLOCK_PRESTIGE) return false;
  if (state.activeMicroChallenge !== null) return false;
  if (state.cycleMicroChallengesAttempted >= SYNAPSE_CONSTANTS.microChallengeMaxPerCycle) return false;
  if (now - state.lastMicroChallengeTime < SYNAPSE_CONSTANTS.microChallengeCooldownMs) return false;
  // Cross 30% threshold check
  if (state.currentThreshold === 0) return false;
  return state.cycleGenerated / state.currentThreshold >= SYNAPSE_CONSTANTS.microChallengeTriggerPct;
}

/**
 * MICRO-4: deterministic challenge selection from
 * hash(cycleStartTimestamp + cycleMicroChallengesAttempted). Filters eligible
 * challenges (synergy_master only fires in first 2 min of cycle).
 */
export function rollMicroChallenge(
  state: Pick<GameState, 'cycleStartTimestamp' | 'cycleMicroChallengesAttempted' | 'neurons'>,
  now: number,
): MicroChallengeDef | null {
  const eligible = MICRO_CHALLENGES.filter((m) => m.isEligible(state as GameState, now));
  if (eligible.length === 0) return null;
  const seed = hash(`micro_${state.cycleStartTimestamp}_${state.cycleMicroChallengesAttempted}`);
  const rng = mulberry32(seed);
  return eligible[Math.floor(rng() * eligible.length)];
}

/**
 * MICRO-3: fail = timer expiry (no penalty). Returns true if active challenge
 * has run past its timeLimitMs.
 */
export function isMicroChallengeFailed(
  state: Pick<GameState, 'activeMicroChallenge'>,
  now: number,
): boolean {
  const m = state.activeMicroChallenge;
  if (m === null) return false;
  return now - m.startTime > m.timeLimit;
}

/**
 * Returns true if active challenge's success condition is met.
 * Caller (store) handles reward + clear when true.
 */
export function isMicroChallengeComplete(state: GameState, now: number): boolean {
  const m = state.activeMicroChallenge;
  if (m === null) return false;
  const def = MICRO_CHALLENGES_BY_ID[m.id];
  if (def === undefined) return false;
  return def.isComplete(state, now, m.startTime);
}

/** Activate the rolled challenge — returns Partial<GameState> for caller to merge. */
export function activateMicroChallenge(
  state: Pick<GameState, 'cycleMicroChallengesAttempted'>,
  def: MicroChallengeDef,
  now: number,
): Partial<GameState> {
  return {
    activeMicroChallenge: { id: def.id, startTime: now, timeLimit: def.timeLimitMs },
    lastMicroChallengeTime: now,
    cycleMicroChallengesAttempted: state.cycleMicroChallengesAttempted + 1,
  };
}

/** Clear the active challenge (success or failure). Reward grant is caller's responsibility. */
export function clearMicroChallenge(): Partial<GameState> {
  return { activeMicroChallenge: null };
}
