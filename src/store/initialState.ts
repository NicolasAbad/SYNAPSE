import { SYNAPSE_CONSTANTS } from '@/config/constants';
import { getThreshold } from '@/engine/formulas';
import type { GameState, NeuronState } from '@/types';

const GAME_VERSION = '0.1.0';

function buildInitialNeurons(): NeuronState[] {
  return SYNAPSE_CONSTANTS.neurons.map((n) => ({
    type: n.type,
    owned: 0,
    baseCost: n.baseCost,
    baseRate: n.rate,
    requires: n.requires,
    memCost: n.memCost,
  }));
}

export function buildInitialState(): GameState {
  return {
    thoughts: 0,
    memories: 0,
    sparks: 0,
    cycleGenerated: 0,
    totalGenerated: 0,
    baseProductionPerSecond: 0,
    effectiveProductionPerSecond: 0,

    neurons: buildInitialNeurons(),
    connectionMult: 1,

    focusBar: 0,
    focusFillRate: SYNAPSE_CONSTANTS.baseFocusFillRate,
    insightActive: false,
    insightMultiplier: 1,
    insightEndTime: null,

    dischargeCharges: 0,
    dischargeMaxCharges: SYNAPSE_CONSTANTS.dischargeMaxCharges,
    dischargeLastTimestamp: 0,
    nextDischargeBonus: 0,

    upgrades: [],

    currentPolarity: null,

    currentMutation: null,
    mutationSeed: 0,

    currentPathway: null,

    currentOfflineCapHours: SYNAPSE_CONSTANTS.baseOfflineCapHours,
    currentOfflineEfficiency: SYNAPSE_CONSTANTS.baseOfflineEfficiency,

    sessionStartTimestamp: null,

    prestigeCount: 0,
    currentThreshold: getThreshold(0, 0),
    consciousnessBarUnlocked: false,
    patterns: [],
    totalPatterns: 0,
    regionsUnlocked: [],
    archetype: null,
    archetypeHistory: [],
    cycleStartTimestamp: 0,
    firstCycleSnapshot: null,
    awakeningLog: [],

    personalBests: {},

    resonance: 0,
    resonanceUpgrades: [],

    lastSpontaneousCheck: 0,
    spontaneousMemoryUsed: false,
    spontaneousInterferenceUsed: false,

    patternDecisions: {},

    resonantPatternsDiscovered: [false, false, false, false],

    isTutorialCycle: true,
    dailyLoginStreak: 0,
    lastDailyClaimDate: null,
    momentumBonus: 0,
    eurekaExpiry: null,
    activeSpontaneousEvent: null,

    runUpgradesPurchased: [],

    achievementsUnlocked: [],
    lifetimeDischarges: 0,
    lifetimeInsights: 0,
    lifetimePrestiges: 0,
    uniqueMutationsUsed: [],
    uniquePathwaysUsed: [],
    personalBestsBeaten: 0,
    cycleUpgradesBought: 0,
    cycleCascades: 0,
    cyclePositiveSpontaneous: 0,
    cycleNeuronsBought: 0,

    currentMentalState: null,
    mentalStateExpiry: null,
    lastTapTimestamps: [],
    lastPurchaseTimestamp: 0,
    insightTimestamps: [],
    focusAbove50Since: null,

    activeMicroChallenge: null,
    lastMicroChallengeTime: 0,

    diaryEntries: [],

    lastCycleTimes: [],
    lastCycleConfig: null,

    notificationPermissionAsked: 0,
    analyticsConsent: false,

    piggyBankSparks: 0,
    piggyBankBroken: false,

    ownedNeuronSkins: [],
    ownedCanvasThemes: [],
    ownedGlowPacks: [],
    ownedHudStyles: [],
    activeNeuronSkin: null,
    activeCanvasTheme: null,
    activeGlowPack: null,
    activeHudStyle: null,

    starterPackPurchased: false,
    starterPackDismissed: false,
    starterPackExpiresAt: 0,
    activeLimitedOffer: null,
    purchasedLimitedOffers: [],
    sparksPurchasedThisMonth: 0,
    sparksPurchaseMonthStart: 0,

    geniusPassLastOfferTimestamp: 0,
    isSubscribed: false,

    narrativeFragmentsSeen: [],
    eraVisualTheme: 'bioluminescent',

    transcendenceCount: 0,

    dailyStreakDays: 0,
    lastOpenedDate: null,
    weeklyChallenge: {
      id: null,
      weekStartTimestamp: 0,
      progress: 0,
      target: 0,
      rewardClaimed: false,
    },

    lastActiveTimestamp: Date.now(),
    gameVersion: GAME_VERSION,
  };
}
