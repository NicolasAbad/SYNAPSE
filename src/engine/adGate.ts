// Implements docs/GDD.md §26 (Monetization) — MONEY-4 / MONEY-5 / MONEY-6 gates.
// Sprint 9a Phase 9a.3.
//
// Pure helper (CODE-9: no Math.random, no Date.now — caller passes nowTimestamp).
// Returns whether a rewarded ad may be shown right now AND a reason code if not.
// Callers (ad placements in Sprint 9a.4) gate `loadRewardedAd` + `showRewardedAd`
// on `canShowAd().allowed`.
//
// Rules per GDD §26:
//   MONEY-4: no ads during first noAdTutorialMinutes from `installedAt`
//   MONEY-5: no ad immediately after a Cascade (cascade is its own reward)
//   MONEY-6: max 1 rewarded ad per minAdCooldownMs (3 min)
//
// MONEY-7 (failure path) is enforced at the adapter call site, not here.
// Genius Pass shielding: MONEY-1 says no ads for subscribers — applied here as
// a 4th gate so ad-trigger sites don't need to special-case it themselves.

import { SYNAPSE_CONSTANTS } from '../config/constants';
import type { GameState } from '../types/GameState';

export type AdGateReason = 'subscribed' | 'tutorial-grace' | 'post-cascade' | 'cooldown';

export interface AdGateDecision {
  allowed: boolean;
  reason?: AdGateReason;
}

/**
 * MONEY-4: tutorial grace measured from installedAt. installedAt = 0 means the
 * field hasn't been stamped yet (mount effect populates on first launch). In
 * that defensive window, deny ads — better to miss an early ad than to show one
 * before the install timestamp is real.
 */
function inTutorialGrace(installedAt: number, nowTimestamp: number): boolean {
  if (installedAt === 0) return true;
  const elapsedMs = nowTimestamp - installedAt;
  return elapsedMs < SYNAPSE_CONSTANTS.noAdTutorialMinutes * 60_000; // CONST-OK min→ms
}

/**
 * MONEY-6: 3-min global cooldown across ALL rewarded ad placements. lastAdWatchedAt
 * = 0 (default / migration backfill) means no prior ad → cooldown satisfied.
 */
function inCooldown(lastAdWatchedAt: number, nowTimestamp: number): boolean {
  if (lastAdWatchedAt === 0) return false;
  return nowTimestamp - lastAdWatchedAt < SYNAPSE_CONSTANTS.minAdCooldownMs;
}

export interface AdGateInput {
  state: Pick<GameState, 'isSubscribed' | 'installedAt' | 'lastAdWatchedAt'>;
  nowTimestamp: number;
  /** True when the trigger is firing in the immediate post-Cascade window (MONEY-5). */
  isPostCascade?: boolean;
}

export function canShowAd({ state, nowTimestamp, isPostCascade = false }: AdGateInput): AdGateDecision {
  // Genius Pass — no ads for subscribers (per GDD §26 Genius Pass benefits).
  if (state.isSubscribed) return { allowed: false, reason: 'subscribed' };
  // MONEY-4
  if (inTutorialGrace(state.installedAt, nowTimestamp)) return { allowed: false, reason: 'tutorial-grace' };
  // MONEY-5
  if (isPostCascade) return { allowed: false, reason: 'post-cascade' };
  // MONEY-6
  if (inCooldown(state.lastAdWatchedAt, nowTimestamp)) return { allowed: false, reason: 'cooldown' };
  return { allowed: true };
}
