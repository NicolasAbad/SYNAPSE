// Implements docs/GDD.md §26 (Genius Pass offer triggers + MONEY-9 compliance).
// Sprint 9b Phase 9b.4.
//
// Pure helpers (CODE-9). Determines whether a Genius Pass offer should fire
// for a given trigger context, respecting the 72h min-interval + max-3-dismissals
// caps per GDD §26. After 3 dismissals the offer becomes Store-only (never
// auto-fires again).
//
// Trigger contexts per GDD §26:
//   - 'post_p1'           — after the first prestige completes
//   - 'post_personal_best' — after a personal-best cycle record
//   - 'post_p5'           — after the 5th prestige
//   - 'post_p10'          — after the 10th prestige
//   - 'post_transcendence' — after any Transcendence

import { SYNAPSE_CONSTANTS } from '../config/constants';
import type { GameState } from '../types/GameState';

export type GeniusPassOfferContext =
  | 'post_p1'
  | 'post_personal_best'
  | 'post_p5'
  | 'post_p10'
  | 'post_transcendence';

export interface GeniusPassOfferInput {
  state: Pick<GameState, 'isSubscribed' | 'geniusPassLastOfferTimestamp' | 'geniusPassDismissals'>;
  nowTimestamp: number;
  context: GeniusPassOfferContext;
}

export function shouldOfferGeniusPass({ state, nowTimestamp }: GeniusPassOfferInput): boolean {
  // Already subscribed — never offer.
  if (state.isSubscribed) return false;
  // Max 3 dismissals — after that the player finds it via the Store manually.
  if (state.geniusPassDismissals >= SYNAPSE_CONSTANTS.geniusPassMaxDismissals) return false;
  // 72h minimum interval between offers (regardless of context).
  if (state.geniusPassLastOfferTimestamp > 0) {
    const elapsed = nowTimestamp - state.geniusPassLastOfferTimestamp;
    if (elapsed < SYNAPSE_CONSTANTS.geniusPassOfferMinIntervalMs) return false;
  }
  return true;
}
