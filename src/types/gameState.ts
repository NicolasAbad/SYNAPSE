import type { NeuronState, NeuronSnapshot } from './neuron';
import type { UpgradeState } from './upgrade';
import type { PatternNode } from './pattern';
import type { Mutation } from './mutation';
import type { AwakeningEntry } from './awakening';
import type { WeeklyChallengeState } from './weekly';
import type { DiaryEntry } from './diary';

export type Polarity = 'excitatory' | 'inhibitory';
export type Pathway = 'rapida' | 'profunda' | 'equilibrada';
export type Archetype = 'analitica' | 'empatica' | 'creativa';
export type EraTheme = 'bioluminescent' | 'digital' | 'cosmic';

export interface GameState {
  // Economy
  thoughts: number;
  memories: number;
  sparks: number;
  cycleGenerated: number;
  totalGenerated: number;
  baseProductionPerSecond: number;
  effectiveProductionPerSecond: number;

  // Neurons + connections
  neurons: NeuronState[];
  connectionMult: number;

  // Focus
  focusBar: number;
  focusFillRate: number;
  insightActive: boolean;
  insightMultiplier: number;
  insightEndTime: number | null;

  // Discharges
  dischargeCharges: number;
  dischargeMaxCharges: number;
  dischargeLastTimestamp: number;
  nextDischargeBonus: number;

  // Upgrades
  upgrades: UpgradeState[];

  // Polarity (P3+)
  currentPolarity: Polarity | null;

  // Mutation (P7+)
  currentMutation: Mutation | null;
  mutationSeed: number;

  // Pathway (P10+)
  currentPathway: Pathway | null;

  // Offline
  currentOfflineCapHours: number;
  currentOfflineEfficiency: number;

  // Session
  sessionStartTimestamp: number | null;

  // Prestige + progression
  prestigeCount: number;
  currentThreshold: number;
  consciousnessBarUnlocked: boolean;
  patterns: PatternNode[];
  totalPatterns: number;
  regionsUnlocked: string[];
  archetype: Archetype | null;
  archetypeHistory: string[];
  cycleStartTimestamp: number;
  firstCycleSnapshot: NeuronSnapshot | null;
  awakeningLog: AwakeningEntry[];

  // Personal bests
  personalBests: Record<number, { minutes: number; rewardGiven: boolean }>;

  // Resonance (P13+, survives transcendence)
  resonance: number;
  resonanceUpgrades: string[];

  // Spontaneous events
  lastSpontaneousCheck: number;
  spontaneousMemoryUsed: boolean;
  spontaneousInterferenceUsed: boolean;

  // Pattern decisions (NEVER reset)
  patternDecisions: Record<number, 'A' | 'B'>;

  // Resonant patterns
  resonantPatternsDiscovered: [boolean, boolean, boolean, boolean];

  // Tutorial + retention
  isTutorialCycle: boolean;
  dailyLoginStreak: number;
  lastDailyClaimDate: string | null;
  momentumBonus: number;
  eurekaExpiry: number | null;
  activeSpontaneousEvent: { id: string; endTime: number } | null;

  // Run-exclusive upgrades
  runUpgradesPurchased: string[];

  // Achievements
  achievementsUnlocked: string[];
  lifetimeDischarges: number;
  lifetimeInsights: number;
  lifetimePrestiges: number;
  uniqueMutationsUsed: string[];
  uniquePathwaysUsed: string[];
  personalBestsBeaten: number;
  cycleUpgradesBought: number;
  cycleCascades: number;
  cyclePositiveSpontaneous: number;
  cycleNeuronsBought: number;

  // Mental states
  currentMentalState: string | null;
  mentalStateExpiry: number | null;
  lastTapTimestamps: number[];
  lastPurchaseTimestamp: number;
  insightTimestamps: number[];
  focusAbove50Since: number | null;

  // Micro-challenges
  activeMicroChallenge: { id: string; startTime: number; timeLimit: number } | null;
  lastMicroChallengeTime: number;

  // Neural diary (max 500)
  diaryEntries: DiaryEntry[];

  // What-if preview (circular buffer 3, preserved at prestige, reset at transcendence)
  lastCycleTimes: number[];
  lastCycleConfig: { polarity: string; mutation: string; pathway: string } | null;

  // App infrastructure
  notificationPermissionAsked: number;
  analyticsConsent: boolean;

  // Piggy Bank
  piggyBankSparks: number;
  piggyBankBroken: boolean;

  // Cosmetics
  ownedNeuronSkins: string[];
  ownedCanvasThemes: string[];
  ownedGlowPacks: string[];
  ownedHudStyles: string[];
  activeNeuronSkin: string | null;
  activeCanvasTheme: string | null;
  activeGlowPack: string | null;
  activeHudStyle: string | null;

  // Starter pack + limited offers
  starterPackPurchased: boolean;
  starterPackDismissed: boolean;
  starterPackExpiresAt: number;
  activeLimitedOffer: { id: string; expiresAt: number } | null;
  purchasedLimitedOffers: string[];
  sparksPurchasedThisMonth: number;
  sparksPurchaseMonthStart: number;

  // Genius Pass
  geniusPassLastOfferTimestamp: number;
  isSubscribed: boolean;

  // Narrative
  narrativeFragmentsSeen: string[];
  eraVisualTheme: EraTheme;

  // Transcendence
  transcendenceCount: number;

  // Retention
  dailyStreakDays: number;
  lastOpenedDate: string | null;
  weeklyChallenge: WeeklyChallengeState;

  // System
  lastActiveTimestamp: number;
  gameVersion: string;
}
