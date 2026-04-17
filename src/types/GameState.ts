// Implements docs/GDD.md §32 (GameState — 110 fields) — v1.0 post-audit
//
// CRITICAL: this interface must have EXACTLY 110 properties. Sprint 1 invariant
// asserts `Object.keys(DEFAULT_STATE).length === 110`. Section-by-section count
// matches §32 breakdown: 5+2+2+5+4+1+4+2+1+11+1+2+3+1+1+3+3+1+1+6+5+7+3+2+1+2
// +2+2+4+4+7+2+2+1+1+3+1+2 = 110.
//
/**
 * GameState — the canonical application state (110 fields).
 *
 * CODE-2 exception (second audit followup): this file exceeds the
 * 200-line cap at 214 lines. Rationale: 110 one-line field
 * declarations + 38 section-header comments + interface boilerplate
 * cannot be reduced without either (a) dropping load-bearing
 * audit comments that map fields to GDD §32 categories, or
 * (b) splitting into multiple files which breaks the
 * single-source-of-truth property of this interface.
 *
 * CODE-2 is designed for logic files (components, engines).
 * Pure type definition files with >100 fields are exempt if the
 * excess is entirely from documentation comments.
 *
 * This exception is documented in CLAUDE.md under CODE-2.
 *
 * Field count MUST remain 110. Adding/removing fields requires:
 * - updating docs/GDD.md §32
 * - updating the 45/60/4/1 PRESTIGE_RESET/PRESERVE/UPDATE split
 * - updating the consistency test that asserts exact count
 */

import type {
  Archetype,
  AwakeningEntry,
  DiaryEntry,
  EndingID,
  EraVisualTheme,
  LimitedOffer,
  MicroChallenge,
  MutationActive,
  NeuronSnapshot,
  NeuronState,
  NeuronType,
  PatternNode,
  Pathway,
  Polarity,
  SpontaneousEventActive,
  UpgradeState,
  WeeklyChallengeState,
} from './index';

export interface GameState {
  // === Economy (5) ===
  thoughts: number;
  memories: number;
  sparks: number;
  cycleGenerated: number;
  totalGenerated: number;

  // === Production cache (2) — productionPerSecond removed (BUG-E) ===
  baseProductionPerSecond: number;
  effectiveProductionPerSecond: number;

  // === Neurons (2) ===
  neurons: NeuronState[];
  connectionMult: number;

  // === Focus (5) ===
  focusBar: number;
  focusFillRate: number;
  insightActive: boolean;
  insightMultiplier: number;
  insightEndTime: number | null;

  // === Discharge (4) ===
  dischargeCharges: number;
  dischargeMaxCharges: number;
  dischargeLastTimestamp: number;
  nextDischargeBonus: number;

  // === Upgrades (1) ===
  upgrades: UpgradeState[];

  // === Cycle choices (4) ===
  currentPolarity: Polarity | null;
  currentMutation: MutationActive | null;
  mutationSeed: number;
  currentPathway: Pathway | null;

  // === Offline (2) ===
  currentOfflineCapHours: number;
  currentOfflineEfficiency: number;

  // === Session (1) ===
  sessionStartTimestamp: number | null;

  // === Prestige & progression (11) ===
  prestigeCount: number;
  currentThreshold: number;
  consciousnessBarUnlocked: boolean;
  patterns: PatternNode[];
  totalPatterns: number;
  regionsUnlocked: string[];
  archetype: Archetype | null;
  archetypeHistory: Archetype[];
  cycleStartTimestamp: number;
  firstCycleSnapshot: NeuronSnapshot | null;
  awakeningLog: AwakeningEntry[];

  // === Personal bests (1) ===
  personalBests: Record<number, { minutes: number; rewardGiven: boolean }>;

  // === Resonance (2) ===
  resonance: number;
  resonanceUpgrades: string[];

  // === Spontaneous events (3) ===
  lastSpontaneousCheck: number;
  spontaneousMemoryUsed: boolean;
  spontaneousInterferenceUsed: boolean;

  // === Pattern decisions (1) ===
  patternDecisions: Record<number, 'A' | 'B'>;

  // === Resonant Patterns — Secret Ending (1) ===
  resonantPatternsDiscovered: [boolean, boolean, boolean, boolean];

  // === Tutorial + Retention (3) ===
  isTutorialCycle: boolean;
  dailyLoginStreak: number;
  lastDailyClaimDate: string | null;

  // === Session bonuses (3) — lastCycleEndProduction is CORE-8 (BUG-A fix) ===
  momentumBonus: number;
  lastCycleEndProduction: number;
  eurekaExpiry: number | null;

  // === Active event (1) ===
  activeSpontaneousEvent: SpontaneousEventActive | null;

  // === Run-exclusive upgrades (1) ===
  runUpgradesPurchased: string[];

  // === Achievements (6) ===
  achievementsUnlocked: string[];
  lifetimeDischarges: number;
  lifetimeInsights: number;
  lifetimePrestiges: number;
  uniqueMutationsUsed: string[];
  uniquePathwaysUsed: string[];

  // === Achievement tracking (5) ===
  personalBestsBeaten: number;
  cycleUpgradesBought: number;
  cycleCascades: number;
  cyclePositiveSpontaneous: number;
  cycleNeuronsBought: number;

  // === Mental States (7) — pendingHyperfocusBonus is INT-9 fix ===
  currentMentalState: string | null;
  mentalStateExpiry: number | null;
  lastTapTimestamps: number[];
  lastPurchaseTimestamp: number;
  insightTimestamps: number[];
  focusAbove50Since: number | null;
  pendingHyperfocusBonus: boolean;

  // === Micro-challenges (3) ===
  activeMicroChallenge: MicroChallenge | null;
  lastMicroChallengeTime: number;
  cycleMicroChallengesAttempted: number;

  // === Resonant Pattern tracking (2) ===
  cycleDischargesUsed: number;
  cycleNeuronPurchases: { type: NeuronType; timestamp: number }[];

  // === Neural Diary (1) ===
  diaryEntries: DiaryEntry[];

  // === What-if Preview (2) ===
  lastCycleTimes: number[];
  lastCycleConfig: { polarity: string; mutation: string; pathway: string } | null;

  // === App infrastructure (2) ===
  notificationPermissionAsked: number;
  analyticsConsent: boolean;

  // === Piggy Bank (2) ===
  piggyBankSparks: number;
  piggyBankBroken: boolean;

  // === Cosmetics — ownership (4) ===
  ownedNeuronSkins: string[];
  ownedCanvasThemes: string[];
  ownedGlowPacks: string[];
  ownedHudStyles: string[];

  // === Cosmetics — equipped (4) ===
  activeNeuronSkin: string | null;
  activeCanvasTheme: string | null;
  activeGlowPack: string | null;
  activeHudStyle: string | null;

  // === Starter Pack + Limited Offers (7) ===
  starterPackPurchased: boolean;
  starterPackDismissed: boolean;
  starterPackExpiresAt: number;
  activeLimitedOffer: LimitedOffer | null;
  purchasedLimitedOffers: string[];
  sparksPurchasedThisMonth: number;
  sparksPurchaseMonthStart: number;

  // === Genius Pass (2) ===
  geniusPassLastOfferTimestamp: number;
  isSubscribed: boolean;

  // === Narrative (2) ===
  narrativeFragmentsSeen: string[];
  eraVisualTheme: EraVisualTheme;

  // === Endings (1) ===
  endingsSeen: EndingID[];

  // === Transcendence (1) ===
  transcendenceCount: number;

  // === Retention (3) ===
  dailyStreakDays: number;
  lastOpenedDate: string | null;
  weeklyChallenge: WeeklyChallengeState;

  // === Tab badges (1) ===
  tabBadgesDismissed: string[];

  // === System (2) ===
  lastActiveTimestamp: number;
  gameVersion: string;
}
