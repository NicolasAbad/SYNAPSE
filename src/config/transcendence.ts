// Implements docs/GDD.md §20 + §34 (TRANSCENDENCE_RESET 59 / TRANSCENDENCE_PRESERVE 58 /
// TRANSCENDENCE_UPDATE 7 = 124 total).
//
// Pure data file — no logic. handleTranscendence() in src/engine/transcendence.ts
// (Sprint 8b Phase 8b.2) consumes these to produce a post-Transcendence state.
//
// Field-count invariants (asserted by tests/consistency.test.ts §34 block):
//   TRANSCENDENCE_RESET_FIELDS.length === 59
//   TRANSCENDENCE_PRESERVE_FIELDS.length === 57
//   TRANSCENDENCE_UPDATE_FIELDS.length === 7
//   59 + 55 + 7 === 121 === Object.keys(createDefaultState()).length
//   RESET ∩ PRESERVE === ∅ (disjoint — no field in both)
//
// Sprint 6.8 TRANS-5 table (GDD §20 lines 1273-1285) is the source of truth for
// the Region-redesign field categorization. Pre-7.10 fields follow GDD §20
// example reset block (lines 1226-1259). Sprint 7.10 fields (`pendingOfflineSummary`,
// `lucidDreamActiveUntil`) follow same-family precedent (Offline / Session-bonuses).
//
// `narrativeFragmentsSeen` is in RESET_FIELDS but handleTranscendence applies a
// PREFIX-FILTER override (retains `crossrun_*` / `greeting_*` / `dream_*` per
// §16.5 + §39 Inner Voice cross-Run identity) — same engine-override precedent
// as PRESTIGE_RESET.dischargeLastTimestamp. RESET classification preserves the
// disjoint-set property; the filter lives in engine logic, not data.

import type { GameState } from '../types/GameState';
import type { NeuronState } from '../types';
import { SYNAPSE_CONSTANTS } from './constants';

/**
 * TRANSCENDENCE_RESET (59 fields) — values applied at the start of a new Run.
 *
 * `dischargeLastTimestamp: 0` is a placeholder; handleTranscendence() overrides
 * it to `nowTimestamp`. Same convention as PRESTIGE_RESET.
 *
 * `narrativeFragmentsSeen: []` is the empty-default; handleTranscendence()
 * overrides with the filter (retains crossrun_/greeting_/dream_ prefixes).
 */
export const TRANSCENDENCE_RESET: Partial<GameState> = {
  // Economy (3 of 5)
  thoughts: 0,
  memories: 0,
  cycleGenerated: 0,
  // Production cache (2)
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
  // Focus (5)
  focusBar: 0,
  focusFillRate: 0,
  insightActive: false,
  insightMultiplier: 1,
  insightEndTime: null,
  // Discharge (4) — dischargeLastTimestamp engine-overridden to nowTimestamp
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
  // Offline (3)
  currentOfflineCapHours: 4,
  currentOfflineEfficiency: 0.5,
  pendingOfflineSummary: null,
  // Prestige & progression (4 of 11) — archetypeHistory in UPDATE
  consciousnessBarUnlocked: false,
  regionsUnlocked: [],
  archetype: null,
  firstCycleSnapshot: null,
  // Spontaneous events (3)
  lastSpontaneousCheck: 0,
  spontaneousMemoryUsed: false,
  spontaneousInterferenceUsed: false,
  // Session bonuses (4) — Sprint 7.10.5 added lucidDreamActiveUntil
  momentumBonus: 0,
  lastCycleEndProduction: 0,
  eurekaExpiry: null,
  lucidDreamActiveUntil: null,
  // Active event (1)
  activeSpontaneousEvent: null,
  // Achievement tracking (4 of 5)
  cycleUpgradesBought: 0,
  cycleCascades: 0,
  cyclePositiveSpontaneous: 0,
  cycleNeuronsBought: 0,
  // Mental States (7)
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
  // Resonant Pattern tracking (2)
  cycleDischargesUsed: 0,
  cycleNeuronPurchases: [],
  // Prefrontal Pre-commitments (2) — Sprint 6.8 TRANS-5: both reset on Transcendence
  activePrecommitment: null,
  precommitmentStreak: 0,
  // Límbico Mood (2) — Sprint 6.8 TRANS-5: reset to fresh emotional slate
  mood: SYNAPSE_CONSTANTS.moodInitialValue,
  moodHistory: [],
  // What-if Preview (1 of 2) — lastCycleTimes preserved (PR baseline)
  lastCycleConfig: null,
  // Narrative (2) — narrativeFragmentsSeen engine-overridden with prefix filter
  narrativeFragmentsSeen: [],
  eraVisualTheme: 'bioluminescent',
};

export const TRANSCENDENCE_RESET_FIELDS = [
  'thoughts', 'memories', 'cycleGenerated',
  'baseProductionPerSecond', 'effectiveProductionPerSecond',
  'neurons', 'connectionMult',
  'focusBar', 'focusFillRate', 'insightActive', 'insightMultiplier', 'insightEndTime',
  'dischargeCharges', 'dischargeMaxCharges', 'dischargeLastTimestamp', 'nextDischargeBonus',
  'upgrades',
  'currentPolarity', 'currentMutation', 'mutationSeed', 'currentPathway',
  'currentOfflineCapHours', 'currentOfflineEfficiency', 'pendingOfflineSummary',
  'consciousnessBarUnlocked', 'regionsUnlocked', 'archetype', 'firstCycleSnapshot',
  'lastSpontaneousCheck', 'spontaneousMemoryUsed', 'spontaneousInterferenceUsed',
  'momentumBonus', 'lastCycleEndProduction', 'eurekaExpiry', 'lucidDreamActiveUntil',
  'activeSpontaneousEvent',
  'cycleUpgradesBought', 'cycleCascades', 'cyclePositiveSpontaneous', 'cycleNeuronsBought',
  'currentMentalState', 'mentalStateExpiry', 'lastTapTimestamps', 'lastPurchaseTimestamp',
  'insightTimestamps', 'focusAbove50Since', 'pendingHyperfocusBonus',
  'activeMicroChallenge', 'lastMicroChallengeTime', 'cycleMicroChallengesAttempted',
  'cycleDischargesUsed', 'cycleNeuronPurchases',
  'activePrecommitment', 'precommitmentStreak',
  'mood', 'moodHistory',
  'lastCycleConfig',
  'narrativeFragmentsSeen', 'eraVisualTheme',
] as const satisfies readonly (keyof GameState)[];

export const TRANSCENDENCE_PRESERVE_FIELDS = [
  // Economy (2 of 5)
  'sparks', 'totalGenerated',
  // Session (1)
  'sessionStartTimestamp',
  // Prestige & progression (4 of 11) — archetypeHistory in UPDATE
  'patterns', 'totalPatterns', 'awakeningLog',
  // Personal bests (1)
  'personalBests',
  // Resonance (2) — RESON-1: persists across Transcendence
  'resonance', 'resonanceUpgrades',
  // Pattern decisions (1)
  'patternDecisions',
  // Resonant Patterns (1)
  'resonantPatternsDiscovered',
  // Tutorial + Retention (2 of 3) — isTutorialCycle in UPDATE
  'dailyLoginStreak', 'lastDailyClaimDate',
  // Run-exclusive upgrades (1) — RUN-1
  'runUpgradesPurchased',
  // Achievements (6) — all preserved (lifetime totals)
  'achievementsUnlocked', 'lifetimeDischarges', 'lifetimeInsights', 'lifetimePrestiges',
  'uniqueMutationsUsed', 'uniquePathwaysUsed',
  // Achievement tracking (1 of 5) — rest in RESET
  'personalBestsBeaten',
  // Neural Diary (1)
  'diaryEntries',
  // Hipocampo Shards (2) — Sprint 6.8 TRANS-5
  'memoryShards', 'memoryShardUpgrades',
  // Broca Named Moments (1) — Sprint 6.8 TRANS-5: lifetime identity
  'brocaNamedMoments',
  // Mastery (1) — Sprint 6.8 §38: lifetime use tracking
  'mastery',
  // Auto-buy config (1) — QoL preference
  'autoBuyConfig',
  // What-if Preview (1 of 2) — lastCycleConfig in RESET
  'lastCycleTimes',
  // App infrastructure (2)
  'notificationPermissionAsked', 'analyticsConsent',
  // Piggy Bank (2)
  'piggyBankSparks', 'piggyBankBroken',
  // Cosmetics ownership (4)
  'ownedNeuronSkins', 'ownedCanvasThemes', 'ownedGlowPacks', 'ownedHudStyles',
  // Cosmetics equipped (4)
  'activeNeuronSkin', 'activeCanvasTheme', 'activeGlowPack', 'activeHudStyle',
  // Starter Pack + Limited Offers (7) — monetization history
  'starterPackPurchased', 'starterPackDismissed', 'starterPackExpiresAt',
  'activeLimitedOffer', 'purchasedLimitedOffers',
  'sparksPurchasedThisMonth', 'sparksPurchaseMonthStart',
  // Genius Pass (3) — Sprint 9b Phase 9b.4 added geniusPassDismissals (V-7).
  // Lifetime counter: Transcendence must not reset MONEY-9 max-3-dismissals.
  'geniusPassLastOfferTimestamp', 'isSubscribed', 'geniusPassDismissals',
  // Monetization runtime (1) — Sprint 9a Phase 9a.3 (V-2): cooldown survives
  // Transcendence so Run-2 starts honoring the prior cooldown.
  'lastAdWatchedAt',
  // Session install anchor (1) — Sprint 9a Phase 9a.3 (V-5): installedAt is
  // a lifetime field. Transcendence is well past MONEY-4's 10-min window so
  // PRESERVE has no semantic effect at the gate; classified PRESERVE for
  // correctness ("install" is a one-time event, not a Run event).
  'installedAt',
  // Retention (3)
  'dailyStreakDays', 'lastOpenedDate', 'weeklyChallenge',
  // Tab badges (1)
  'tabBadgesDismissed',
  // System (2)
  'lastActiveTimestamp', 'gameVersion',
] as const satisfies readonly (keyof GameState)[];

/**
 * TRANSCENDENCE_UPDATE (7 fields) — recomputed/transformed.
 *   prestigeCount         := 0 (TRANS-1, CRITICAL)
 *   transcendenceCount    := prev + 1 (TRANS-1)
 *   currentThreshold      := calculateThreshold(0, transcendenceCount)
 *   cycleStartTimestamp   := nowTimestamp
 *   isTutorialCycle       := false (TUTOR-2 — Run 2+ never sees the tutorial)
 *   archetypeHistory      := [...prev, prev.archetype] (TRANS-4)
 *   endingsSeen           := [...prev, endingChosen]
 */
export const TRANSCENDENCE_UPDATE_FIELDS = [
  'prestigeCount', 'transcendenceCount', 'currentThreshold',
  'cycleStartTimestamp', 'isTutorialCycle',
  'archetypeHistory', 'endingsSeen',
] as const satisfies readonly (keyof GameState)[];

/**
 * `narrativeFragmentsSeen` retain-prefixes per Sprint 8b V10 + §16.5/§39 Inner
 * Voice cross-Run identity. Fragments matching ANY of these prefixes survive
 * Transcendence; the rest are cleared. Example: `voice_p7_a1` is a per-Run
 * Inner Voice line and gets cleared; `crossrun_archetype_change_2` is a
 * cross-Run identity beat and survives.
 */
export const NARRATIVE_TRANSCENDENCE_RETAIN_PREFIXES: readonly string[] = [
  'crossrun_',
  'greeting_',
  'dream_',
];
