// Implements docs/GDD.md §26 (Starter Pack — "Neural Awakening Pack").
// Sprint 9b Phase 9b.4.
//
// Pure helpers (CODE-9: no Math.random, no Date.now — caller passes
// nowTimestamp). Determines whether the Starter Pack modal should be
// visible given current game state + elapsed time since the pack window
// opened.
//
// Trigger rules per GDD §26:
//   - Appears post-P2 (starterPackShownAtPrestige: 2) — tonal fix from P1
//   - 48h window from the first time the player reaches P2
//   - One-time only (starterPackPurchased OR starterPackDismissed = terminal)
//   - Never re-shows after the 48h expires, even if not purchased/dismissed

import { SYNAPSE_CONSTANTS } from '../config/constants';
import type { GameState } from '../types/GameState';

export interface StarterPackVisibilityInput {
  state: Pick<GameState, 'prestigeCount' | 'starterPackPurchased' | 'starterPackDismissed' | 'starterPackExpiresAt'>;
  nowTimestamp: number;
}

export function isStarterPackVisible({ state, nowTimestamp }: StarterPackVisibilityInput): boolean {
  if (state.starterPackPurchased) return false;
  if (state.starterPackDismissed) return false;
  if (state.prestigeCount < SYNAPSE_CONSTANTS.starterPackShownAtPrestige) return false;
  // starterPackExpiresAt is set the moment the pack first becomes eligible
  // (see store/gameStore.ts `maybeStampStarterPackExpiry`). Once stamped, 48h
  // countdown is ticking.
  if (state.starterPackExpiresAt === 0) return true; // not yet stamped — show, let store stamp on open
  return nowTimestamp < state.starterPackExpiresAt;
}

/**
 * Computes the expiry timestamp for a freshly-triggered Starter Pack window.
 * Called from the store action that first sees the pack become eligible.
 */
export function computeStarterPackExpiry(nowTimestamp: number): number {
  return nowTimestamp + SYNAPSE_CONSTANTS.starterPackExpiryMs;
}
