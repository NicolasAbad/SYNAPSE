// Implements docs/GDD.md §26 (Limited-Time Offers — 4 milestones in GDD, 3 in v1.0 per Sprint 9b.5 V-c).
// Sprint 9b Phase 9b.5 — Limited-Time Offer trigger helper.
//
// Pure helper (CODE-9). Determines which Limited-Time Offer (if any) should
// be visible for the current state. Logic:
//   1. Find the first offer whose triggerPrestige === state.prestigeCount.
//   2. If already purchased (`purchasedLimitedOffers.includes(offer.id)`), return null.
//   3. If `activeLimitedOffer !== null && activeLimitedOffer.id === offer.id` and
//      the window hasn't expired, return the offer — ongoing.
//   4. If `activeLimitedOffer` is either null or pointing at a DIFFERENT offer,
//      the offer is freshly eligible — return it (caller stamps activeLimitedOffer
//      + expiry on show).
//   5. If the active offer window has expired, the OfferOrchestrator stamps
//      the offer ID into `purchasedLimitedOffers` as "expired-unpurchased" so
//      it never reappears. That case returns null here.

import { LIMITED_TIME_OFFERS, type LimitedTimeOfferDef } from '../config/limitedTimeOffers';
import type { GameState } from '../types/GameState';

export interface LimitedTimeOfferTriggerInput {
  state: Pick<GameState, 'prestigeCount' | 'purchasedLimitedOffers' | 'activeLimitedOffer'>;
  nowTimestamp: number;
}

export function activeLimitedTimeOffer({ state, nowTimestamp }: LimitedTimeOfferTriggerInput): LimitedTimeOfferDef | null {
  // Case (3): an offer is already active + in-window.
  if (state.activeLimitedOffer !== null && state.activeLimitedOffer.expiresAt > nowTimestamp) {
    const def = LIMITED_TIME_OFFERS.find((o) => o.id === state.activeLimitedOffer?.id);
    if (def && !state.purchasedLimitedOffers.includes(def.id)) return def;
  }
  // Case (1+4): find eligible offer for current prestige that hasn't been
  // purchased and isn't already-expired.
  const eligible = LIMITED_TIME_OFFERS.find((o) => o.triggerPrestige === state.prestigeCount);
  if (eligible === undefined) return null;
  if (state.purchasedLimitedOffers.includes(eligible.id)) return null;
  return eligible;
}
