// Implements docs/GDD.md §32 (GameState — 132 fields) — v1.0 post-Sprint-10.1
//
// CRITICAL: this interface must have EXACTLY 132 properties. Sprint 1 invariant
// asserts `Object.keys(DEFAULT_STATE).length === 132`. Section-by-section count
// per §32 breakdown sums to 132 (verified line-by-line in GDD §32).
// Sprint 7.10.4 added `pendingOfflineSummary` (Offline group, 119 → 120).
// Sprint 7.10.5 added `lucidDreamActiveUntil` (Session bonuses, 120 → 121).
// Sprint 9a Phase 9a.3 added `installedAt` (Session, 121 → 122) and
// `lastAdWatchedAt` (Monetization runtime, 122 → 123) per V-2 + V-5.
// Sprint 9b Phase 9b.4 added `geniusPassDismissals` (Genius Pass, 123 → 124)
// per V-7 for MONEY-9 max-3-dismissals enforcement.
// Sprint 10 Phase 10.1 added 8 Settings fields (124 → 132): sfxVolume,
// musicVolume, language, colorblindMode, reducedMotion, highContrast, fontSize,
// notificationsEnabled. All PRESERVE on prestige + Transcendence (per V-5/V-6:
// settings persist across all in-game progression; only Hard Reset wipes them
// via createDefaultState).
//
/**
 * GameState — the canonical application state (132 fields).
 *
 * CODE-2 exception (second audit followup, refreshed Sprint 7.5.1):
 * this file exceeds the 200-line cap due to 122 one-line field
 * declarations + section-header comments + interface boilerplate.
 * Cannot be reduced without either (a) dropping load-bearing
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
 * Field count MUST remain 132. Adding/removing fields requires:
 * - updating docs/GDD.md §32
 * - updating the 48/79/4/1 PRESTIGE_RESET/PRESERVE/UPDATE split
 * - updating the consistency test that asserts exact count
 */

import type {
  Archetype,
  AwakeningEntry,
  DiaryEntry,
  EndingID,
  EraVisualTheme,
  FontSize,
  Language,
  LimitedOffer,
  MicroChallenge,
  MutationActive,
  NeuronSnapshot,
  NeuronState,
  NeuronType,
  OfflineSummary,
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

  // === Offline (3) — pendingOfflineSummary added Sprint 7.10 Phase 7.10.4 ===
  currentOfflineCapHours: number;
  currentOfflineEfficiency: number;
  pendingOfflineSummary: OfflineSummary | null;

  // === Session (2) — Sprint 9a Phase 9a.3 added installedAt for MONEY-4 (V-5). ===
  sessionStartTimestamp: number | null;
  installedAt: number;

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

  // === Session bonuses (4) — lastCycleEndProduction is CORE-8 (BUG-A fix); lucidDreamActiveUntil is Sprint 7.10 Phase 7.10.5 ===
  momentumBonus: number;
  lastCycleEndProduction: number;
  eurekaExpiry: number | null;
  lucidDreamActiveUntil: number | null;

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

  // === Hipocampo — Memory Shards (2) — Sprint 6.8/7.5 §16.1 ===
  // PRESERVE on prestige + Transcendence (lifetime per-type counters).
  memoryShards: { emotional: number; procedural: number; episodic: number };
  memoryShardUpgrades: string[];

  // === Prefrontal — Pre-commitments (2) — Sprint 6.8/7.5 §16.2 ===
  // activePrecommitment RESETS on prestige; precommitmentStreak PRESERVES on
  // prestige and RESETS on Transcendence (Sprint 8b implements TRANSCENDENCE).
  activePrecommitment: { goalId: string; wager: number } | null;
  precommitmentStreak: number;

  // === Límbico — Mood (2) — Sprint 6.8/7.5 §16.3 ===
  // mood + moodHistory PRESERVE on prestige and RESET to 50/[] on Transcendence.
  mood: number; // 0-100, default 50 (Calm tier)
  moodHistory: { timestamp: number; mood: number }[]; // circular buffer cap 48

  // === Broca — Named Moments (1) — Sprint 6.8/7.5 §16.5 ===
  // PRESERVE across prestige AND Transcendence (lifetime identity).
  brocaNamedMoments: { momentId: string; phrase: string }[];

  // === Mastery — unified lifetime tracking (1) — Sprint 6.8 §38 ===
  // PRESERVE across prestige AND Transcendence. id → use count.
  mastery: Record<string, number>;

  // === Auto-buy config (1) — Sprint 6.8 QoL pull-in from v1.1 ===
  // PRESERVE across prestige AND Transcendence. Per-neuron-type unlocks at P10+.
  autoBuyConfig: Record<string, { enabled: boolean; cap: number }>;

  // === What-if Preview (2) ===
  lastCycleTimes: number[];
  // Sprint 4c.1: snapshot for POLAR-1 / SAME AS LAST.
  // Sprint 5: extended with `upgrades: string[]` to support Mutation #14
  // Déjà Vu ("Start with last cycle's upgrades owned"). 119-field invariant
  // unchanged — same field, wider object shape.
  lastCycleConfig: { polarity: string; mutation: string; pathway: string; upgrades: string[] } | null;

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

  // === Genius Pass (3) — Sprint 9b Phase 9b.4 added geniusPassDismissals (V-7). ===
  geniusPassLastOfferTimestamp: number;
  isSubscribed: boolean;
  // PRESERVE on prestige + Transcendence (lifetime counter per GDD §26 MONEY-9
  // "max 3 total dismissals — after which the offer is Store-only").
  geniusPassDismissals: number;

  // === Monetization runtime (1) — Sprint 9a Phase 9a.3 (V-2). ===
  // PRESERVE on prestige + Transcendence (anti-exploit: prestige spamming
  // would otherwise reset the MONEY-6 3-min cooldown).
  lastAdWatchedAt: number;

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

  // === Settings (8) — Sprint 10 Phase 10.1 ===
  // PRESERVE on prestige + Transcendence; only Hard Reset wipes them via createDefaultState.
  // Volume sliders are 0–100 in 5% steps (V-1). language defaults 'en' until 10.7.
  // Accessibility consumers (colorblind / reducedMotion / highContrast / fontSize)
  // ship in Phase 10.5; toggles in 10.1 set state with no visible effect until then.
  // notificationsEnabled consumer (push scheduler) ships in Phase 10.4.
  sfxVolume: number;
  musicVolume: number;
  language: Language;
  colorblindMode: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: FontSize;
  notificationsEnabled: boolean;
}
