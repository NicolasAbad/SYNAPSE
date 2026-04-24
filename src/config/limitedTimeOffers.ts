// Sprint 9b Phase 9b.5 — Limited-Time Offers catalog (GDD §26).
//
// 3 offers ship in v1.0 per V-c approved (Run 2 "50% off all cosmetics"
// offer dropped — requires RevenueCat Offering-swap logic out of scope
// for 9b.5; pushed to POSTLAUNCH v1.1 per V-c rationale).
//
// Per V-b approved: offers #1 and #2 bundle RANDOM not-yet-owned cosmetics
// (deterministic per install via mulberry32 seeded by offer ID + installedAt).
// If all cosmetics already owned, offer still fires but awards only the
// Sparks/Memories portion (Sprint 9b.5 `acceptLimitedTimeOffer` logic).

export interface LimitedTimeOfferDef {
  id: string;
  /** Prestige milestone that triggers the offer. */
  triggerPrestige: number;
  /** RevenueCat product ID. */
  productId: string;
  /** Fallback USD price for pre-Offerings UI rendering (MONEY-1). */
  priceUsd: number;
  /** i18n key for offer display name. */
  nameKey: string;
  /** i18n key for offer description. */
  descriptionKey: string;
  /** Bundle contents — what the player receives on accept. */
  contents: {
    sparks?: number;
    memories?: number;
    /** 1 random not-yet-owned neuron skin. */
    randomNeuronSkin?: boolean;
    /** 1 random not-yet-owned glow pack. */
    randomGlowPack?: boolean;
    /** 1 random not-yet-owned canvas theme (store-category only, excludes exclusives). */
    randomCanvasTheme?: boolean;
  };
}

export const LIMITED_TIME_OFFERS: readonly LimitedTimeOfferDef[] = [
  {
    id: 'dual_nature_pack',
    triggerPrestige: 3,
    productId: 'limited_dual_nature_pack',
    priceUsd: 1.99,
    nameKey: 'limitedTimeOffer.dual_nature_pack.name',
    descriptionKey: 'limitedTimeOffer.dual_nature_pack.description',
    contents: { sparks: 30, randomNeuronSkin: true },
  },
  {
    id: 'mutant_bundle',
    triggerPrestige: 7,
    productId: 'limited_mutant_bundle',
    priceUsd: 1.99,
    nameKey: 'limitedTimeOffer.mutant_bundle.name',
    descriptionKey: 'limitedTimeOffer.mutant_bundle.description',
    contents: { randomGlowPack: true, randomCanvasTheme: true },
  },
  {
    id: 'deep_mind_pack',
    triggerPrestige: 13,
    productId: 'limited_deep_mind_pack',
    priceUsd: 2.99,
    nameKey: 'limitedTimeOffer.deep_mind_pack.name',
    descriptionKey: 'limitedTimeOffer.deep_mind_pack.description',
    contents: { sparks: 50, memories: 3 },
  },
] as const;

export function findLimitedTimeOffer(id: string): LimitedTimeOfferDef | null {
  return LIMITED_TIME_OFFERS.find((o) => o.id === id) ?? null;
}
