// Implements docs/GDD.md §33 (PRESTIGE_RESET 45 / PRESTIGE_PRESERVE 60 /
// PRESTIGE_UPDATE 4 / lifetime 1 = 110 total).
//
// Pure data file — no logic. handlePrestige() in src/engine/prestige.ts
// (Sprint 4a Phase 4a.2) consumes these to produce a post-prestige state.
//
// Field-count invariants (asserted by tests/consistency.test.ts §33 block):
//   PRESTIGE_RESET_FIELDS.length === 45
//   PRESTIGE_PRESERVE_FIELDS.length === 60
//   PRESTIGE_UPDATE_FIELDS.length === 4
//   PRESTIGE_LIFETIME_FIELDS.length === 1
//   45 + 60 + 4 + 1 === 110 === Object.keys(createDefaultState()).length
//   RESET ∩ PRESERVE === ∅ (disjoint — no field in both)
//
// Ordering within each tuple mirrors GDD §33 for audit readability, but
// order is not semantically load-bearing — tests assert set equality.

import type { NeuronState } from '../types';
import type { GameState } from '../types/GameState';

/**
 * PRESTIGE_RESET (45 fields) — values applied at the start of a new cycle.
 *
 * `dischargeLastTimestamp: 0` is a placeholder; handlePrestige() overrides it
 * to the `timestamp` parameter so a fresh 20-min charge window starts at the
 * prestige moment (BUG-02 fix, §7). The §33 field-level reset semantic still
 * holds: the field IS reset — its reset value just happens to be `timestamp`
 * rather than a literal. The §33 test that iterates this object's entries
 * should skip dischargeLastTimestamp (handled by Phase 4a.2's test).
 *
 * `focusBar: 0` is the default reset; Focus Persistente upgrade (BUG-06)
 * overrides to `prev.focusBar * 0.25` in handlePrestige(). Same pattern as
 * above — the override lives in engine logic, not in this data object.
 */
export const PRESTIGE_RESET: Partial<GameState> = {
  // Economy (2)
  thoughts: 0,
  cycleGenerated: 0,
  // Production cache (2) — will recalculate immediately from empty upgrades
  baseProductionPerSecond: 0,
  effectiveProductionPerSecond: 0,
  // Neurons (2)
  neurons: [
    { type: 'basica', count: 0 },
    { type: 'sensorial', count: 0 },
    { type: 'piramidal', count: 0 },
    { type: 'espejo', count: 0 },
    { type: 'integradora', count: 0 },
  ] as NeuronState[],
  connectionMult: 1,
  // Focus (5) — focusBar override (Focus Persistente) is engine-side
  focusBar: 0,
  focusFillRate: 0,
  insightActive: false,
  insightMultiplier: 1,
  insightEndTime: null,
  // Discharge (4) — dischargeLastTimestamp override (to timestamp) is engine-side
  dischargeCharges: 0,
  dischargeMaxCharges: 2,
  dischargeLastTimestamp: 0,
  nextDischargeBonus: 0,
  // Upgrades (1)
  upgrades: [],
  // Cycle choices (4)
  currentPolarity: null,
  currentMutation: null,
  mutationSeed: 0,
  currentPathway: null,
  // Session bonuses (3)
  momentumBonus: 0,
  lastCycleEndProduction: 0,
  eurekaExpiry: null,
  // Active event (1)
  activeSpontaneousEvent: null,
  // Spontaneous events cycle state (3)
  lastSpontaneousCheck: 0,
  spontaneousMemoryUsed: false,
  spontaneousInterferenceUsed: false,
  // Achievement cycle trackers (4)
  cycleUpgradesBought: 0,
  cycleCascades: 0,
  cyclePositiveSpontaneous: 0,
  cycleNeuronsBought: 0,
  // Mental State cycle trackers (7)
  currentMentalState: null,
  mentalStateExpiry: null,
  lastTapTimestamps: [],
  lastPurchaseTimestamp: 0,
  insightTimestamps: [],
  focusAbove50Since: null,
  pendingHyperfocusBonus: false,
  // Micro-challenges (3)
  activeMicroChallenge: null,
  lastMicroChallengeTime: 0,
  cycleMicroChallengesAttempted: 0,
  // Offline (2) — reset to base; upgrades recalculate via OFFLINE-6
  currentOfflineCapHours: 4,
  currentOfflineEfficiency: 0.5,
  // Resonant Pattern cycle trackers (2)
  cycleDischargesUsed: 0,
  cycleNeuronPurchases: [],
};

export const PRESTIGE_RESET_FIELDS = [
  'thoughts', 'cycleGenerated',
  'baseProductionPerSecond', 'effectiveProductionPerSecond',
  'neurons', 'connectionMult',
  'focusBar', 'focusFillRate', 'insightActive', 'insightMultiplier', 'insightEndTime',
  'dischargeCharges', 'dischargeMaxCharges', 'dischargeLastTimestamp', 'nextDischargeBonus',
  'upgrades',
  'currentPolarity', 'currentMutation', 'mutationSeed', 'currentPathway',
  'momentumBonus', 'lastCycleEndProduction', 'eurekaExpiry',
  'activeSpontaneousEvent',
  'lastSpontaneousCheck', 'spontaneousMemoryUsed', 'spontaneousInterferenceUsed',
  'cycleUpgradesBought', 'cycleCascades', 'cyclePositiveSpontaneous', 'cycleNeuronsBought',
  'currentMentalState', 'mentalStateExpiry', 'lastTapTimestamps', 'lastPurchaseTimestamp',
  'insightTimestamps', 'focusAbove50Since', 'pendingHyperfocusBonus',
  'activeMicroChallenge', 'lastMicroChallengeTime', 'cycleMicroChallengesAttempted',
  'currentOfflineCapHours', 'currentOfflineEfficiency',
  'cycleDischargesUsed', 'cycleNeuronPurchases',
] as const satisfies readonly (keyof GameState)[];

export const PRESTIGE_PRESERVE_FIELDS = [
  // Economy (3)
  'memories', 'sparks', 'totalGenerated',
  // Prestige & progression (8 of 11 — rest in UPDATE)
  'consciousnessBarUnlocked', 'patterns', 'totalPatterns', 'regionsUnlocked',
  'archetype', 'archetypeHistory', 'firstCycleSnapshot', 'awakeningLog',
  // Personal bests (1)
  'personalBests',
  // Resonance (2)
  'resonance', 'resonanceUpgrades',
  // Pattern decisions (1) — NEVER resets
  'patternDecisions',
  // Resonant Patterns (1)
  'resonantPatternsDiscovered',
  // Tutorial + Retention (2 of 3 — isTutorialCycle in UPDATE)
  'dailyLoginStreak', 'lastDailyClaimDate',
  // Run-exclusive (1)
  'runUpgradesPurchased',
  // Achievements (5 of 6 — lifetimePrestiges is incremented separately)
  'achievementsUnlocked', 'lifetimeDischarges', 'lifetimeInsights',
  'uniqueMutationsUsed', 'uniquePathwaysUsed',
  // Achievement tracking (1 of 5 — rest in RESET)
  'personalBestsBeaten',
  // Neural Diary (1)
  'diaryEntries',
  // What-if Preview (2)
  'lastCycleTimes', 'lastCycleConfig',
  // App infrastructure (2)
  'notificationPermissionAsked', 'analyticsConsent',
  // Piggy Bank (2)
  'piggyBankSparks', 'piggyBankBroken',
  // Cosmetics ownership (4)
  'ownedNeuronSkins', 'ownedCanvasThemes', 'ownedGlowPacks', 'ownedHudStyles',
  // Cosmetics equipped (4)
  'activeNeuronSkin', 'activeCanvasTheme', 'activeGlowPack', 'activeHudStyle',
  // Starter Pack + Limited Offers (7)
  'starterPackPurchased', 'starterPackDismissed', 'starterPackExpiresAt',
  'activeLimitedOffer', 'purchasedLimitedOffers',
  'sparksPurchasedThisMonth', 'sparksPurchaseMonthStart',
  // Genius Pass (2)
  'geniusPassLastOfferTimestamp', 'isSubscribed',
  // Narrative (2)
  'narrativeFragmentsSeen', 'eraVisualTheme',
  // Endings (1)
  'endingsSeen',
  // Transcendence (1)
  'transcendenceCount',
  // Retention (3)
  'dailyStreakDays', 'lastOpenedDate', 'weeklyChallenge',
  // Tab badges (1)
  'tabBadgesDismissed',
  // Session (1)
  'sessionStartTimestamp',
  // System (2)
  'lastActiveTimestamp', 'gameVersion',
] as const satisfies readonly (keyof GameState)[];

/**
 * PRESTIGE_UPDATE (4 fields) — neither reset nor preserved; recomputed.
 *   prestigeCount       := prev + 1
 *   currentThreshold    := calculateThreshold(prestigeCount, transcendenceCount)
 *   cycleStartTimestamp := timestamp
 *   isTutorialCycle     := false (TUTOR-2 one-way flip, §9)
 */
export const PRESTIGE_UPDATE_FIELDS = [
  'prestigeCount', 'currentThreshold', 'cycleStartTimestamp', 'isTutorialCycle',
] as const satisfies readonly (keyof GameState)[];

/** Lifetime counter (1 field) — incremented by +1 in handlePrestige. */
export const PRESTIGE_LIFETIME_FIELDS = ['lifetimePrestiges'] as const satisfies readonly (keyof GameState)[];
