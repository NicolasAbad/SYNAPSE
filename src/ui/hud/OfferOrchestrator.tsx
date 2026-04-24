// Sprint 9b Phase 9b.5 — Offer Orchestrator (V-d).
// Single component that owns trigger detection + modal rendering for:
//   - Starter Pack (post-P2 first-open)
//   - Genius Pass offer (5 contexts: post-P1/PB/P5/P10/Transcendence)
//   - Limited-Time Offer (3 milestones per catalog)
//   - Piggy Bank claim (via HUD chip)
//   - Spark Pack purchase (opened via future HUD link)
//
// Sprint 9b.3 wires RevenueCat `purchasePackage()` into each Accept callback;
// for 9b.5 the accept paths call store actions directly (stub path for
// dev/sandbox testing without a real RevenueCat connection).

import { memo, useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { StarterPackModal } from '../modals/StarterPackModal';
import { GeniusPassOfferModal } from '../modals/GeniusPassOfferModal';
import { LimitedTimeOfferModal } from '../modals/LimitedTimeOfferModal';
import { PiggyBankClaimModal } from '../modals/PiggyBankClaimModal';
import { SparkPackPurchaseModal } from '../modals/SparkPackPurchaseModal';
import { PiggyBankClaimChip } from './PiggyBankClaimChip';
import { isStarterPackVisible } from '../../engine/starterPackTrigger';
import { activeLimitedTimeOffer } from '../../engine/limitedTimeOfferTrigger';

export const OfferOrchestrator = memo(function OfferOrchestrator() {
  // Modal open states (React-local, no GameState bump).
  const [starterPackOpen, setStarterPackOpen] = useState(false);
  const [geniusPassOpen, setGeniusPassOpen] = useState(false);
  const [piggyOpen, setPiggyOpen] = useState(false);
  const [sparkPackOpen, setSparkPackOpen] = useState(false);
  const [limitedOfferId, setLimitedOfferId] = useState<string | null>(null);

  // Track one-shot triggers: each offer type should auto-open at most once
  // per app session even if the condition stays true afterwards.
  const [hasAutoOpenedStarter, setHasAutoOpenedStarter] = useState(false);
  const [hasAutoOpenedLimited, setHasAutoOpenedLimited] = useState<string | null>(null);

  const prestigeCount = useGameStore((s) => s.prestigeCount);
  const starterPackPurchased = useGameStore((s) => s.starterPackPurchased);
  const starterPackDismissed = useGameStore((s) => s.starterPackDismissed);
  const starterPackExpiresAt = useGameStore((s) => s.starterPackExpiresAt);
  const purchasedLimitedOffers = useGameStore((s) => s.purchasedLimitedOffers);
  const activeLimitedOffer = useGameStore((s) => s.activeLimitedOffer);
  const stampLimitedTimeOffer = useGameStore((s) => s.stampLimitedTimeOffer);

  // Starter Pack auto-open: fires once per app session the first time the
  // player sees a state where the pack is eligible (post-P2 + not terminal).
  useEffect(() => {
    if (hasAutoOpenedStarter) return;
    const visible = isStarterPackVisible({
      state: { prestigeCount, starterPackPurchased, starterPackDismissed, starterPackExpiresAt },
      nowTimestamp: Date.now(),
    });
    if (visible) {
      setStarterPackOpen(true);
      setHasAutoOpenedStarter(true);
    }
  }, [prestigeCount, starterPackPurchased, starterPackDismissed, starterPackExpiresAt, hasAutoOpenedStarter]);

  // Limited-Time Offer auto-open: fires when a new eligible offer appears
  // at the current prestige level. Stamps expiry on first detection.
  useEffect(() => {
    const offer = activeLimitedTimeOffer({
      state: { prestigeCount, purchasedLimitedOffers, activeLimitedOffer },
      nowTimestamp: Date.now(),
    });
    if (!offer) return;
    if (hasAutoOpenedLimited === offer.id) return;
    stampLimitedTimeOffer(offer.id, Date.now());
    setLimitedOfferId(offer.id);
    setHasAutoOpenedLimited(offer.id);
  }, [prestigeCount, purchasedLimitedOffers, activeLimitedOffer, hasAutoOpenedLimited, stampLimitedTimeOffer]);

  // Genius Pass auto-open triggers land in Phase 9b.7 when the 5 contexts
  // have dedicated listeners (post-P1 in AwakeningFlow, post-Personal-Best
  // in personal-best side-effect, post-P5/P10 on prestige milestones,
  // post-Transcendence in handleTranscendence callback). For 9b.5 the modal
  // is mountable on demand via future callers but does not auto-open.
  void geniusPassOpen;
  void setGeniusPassOpen;
  void sparkPackOpen;
  void setSparkPackOpen;

  return (
    <>
      <PiggyBankClaimChip onOpen={() => setPiggyOpen(true)} />
      <StarterPackModal open={starterPackOpen} onClose={() => setStarterPackOpen(false)} />
      <GeniusPassOfferModal open={geniusPassOpen} onClose={() => setGeniusPassOpen(false)} />
      {limitedOfferId !== null && (
        <LimitedTimeOfferModal
          open
          offerId={limitedOfferId}
          onClose={() => setLimitedOfferId(null)}
        />
      )}
      <PiggyBankClaimModal open={piggyOpen} onClose={() => setPiggyOpen(false)} />
      <SparkPackPurchaseModal open={sparkPackOpen} onClose={() => setSparkPackOpen(false)} />
    </>
  );
});
