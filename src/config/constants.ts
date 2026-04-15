import type { NeuronType } from '@/types';

interface NeuronConst {
  type: NeuronType;
  name: string;
  baseCost: number;
  rate: number;
  requires: number;
  memCost?: number;
}

export const SYNAPSE_CONSTANTS = {
  // NEURONS — verbatim from GDD
  neurons: [
    { type: 'basica', name: 'Basica', baseCost: 10, rate: 0.6, requires: 0 },
    { type: 'sensorial', name: 'Sensorial', baseCost: 120, rate: 2.5, requires: 5 },
    { type: 'piramidal', name: 'Piramidal', baseCost: 2_000, rate: 10, requires: 3 },
    { type: 'espejo', name: 'Espejo', baseCost: 22_000, rate: 40, requires: 2 },
    {
      type: 'integradora',
      name: 'Integradora',
      baseCost: 400_000,
      rate: 180,
      requires: 1,
      memCost: 8,
    },
  ] as readonly NeuronConst[],
  costMultiplier: 1.28,

  // TAP
  baseTapThoughts: 4,
  tapMultiplier: 0.15,
  tapMultiplierPostFocus: 0.08,

  // FOCUS
  baseFocusFillRate: 0.01,
  focusInsightMults: [3, 8, 18] as const,
  focusInsightDurations: [15, 12, 8] as const,

  // PRESTIGE — piecewise threshold
  consciousnessThreshold: 800_000,
  tutorialThreshold: 50_000,
  tutorialDischargeInterval: 300,
  tutorialDischargeMult: 3.0,
  tutorialBarVisible: 0.25,
  momentumBonusSeconds: 30,
  thresholdScaleEra1: 1.5,
  thresholdScaleEra2: 1.28,
  thresholdScaleEra3: 1.18,
  productionCap: 2_000,
  transcendenciaAt: 26,
  runThresholdMult: [1.0, 3.5, 6.0, 8.5, 12.0, 15.0] as const,

  // CONNECTIONS
  connectionBonusPerPair: 0.04,

  // DISCHARGE
  dischargeAccumTime: 20 * 60,
  dischargeMaxCharges: 3,
  dischargeBaseBonus: 20,
  cascadeMultiplier: 2.5,
  cascadeThreshold: 0.75,

  // OFFLINE
  baseOfflineEfficiency: 0.5,
  baseOfflineCapHours: 4,
  maxOfflineHours: 8,

  // PATTERNS
  patternCycleBonusPerNode: 0.04,
  patternCycleCap: 1.5,
  patternFlatBonusPerNode: 2,
  patternsPerPrestige: 3,

  // MEMORIES
  memoriesPerPrestige: 2,
  memorySynthesisCost: 8,
  memorySynthesisPerCycle: 2,

  // PIGGY BANK
  bankThoughtsPerSpark: 10_000,
  bankMaxSparks: 500,
  bankBreakPrice: 1.99,

  // POLARITY
  polarityExcitatoryProdMult: 1.2,
  polarityExcitatoryDischMult: 0.88,
  polarityInhibitoryProdMult: 0.94,
  polarityInhibitoryDischMult: 1.3,
  polarityInhibitoryFocusMult: 1.2,

  // MUTATIONS
  mutationPoolSize: 15,
  mutationsOfferedPerCycle: 3,

  // GENIUS PASS
  geniusPassMinOfferInterval: 72 * 3600 * 1000,

  // WEEKLY CHALLENGE
  challengePoolSize: 15,

  // SPONTANEOUS SYNAPSE
  spontaneousEventChance: 0.4,
  spontaneousEventMinInterval: 240,
  spontaneousEventMaxInterval: 360,
  spontaneousPoolWeights: { positive: 0.5, neutral: 0.33, negative: 0.17 },

  // EUREKA + MISC
  eurekaExpirySeconds: 60,
  ESTIMATED_CYCLE_TIMES: [
    24, 22, 22, 16, 17, 17, 18, 18, 17, 18, 16, 17, 17, 18, 18, 19, 19, 20, 21, 23, 24, 25, 26, 28,
    30, 31,
  ] as const,

  // DAILY LOGIN
  dailyLoginRewards: [
    { sparks: 5 },
    { memories: 1 },
    { sparks: 10 },
    { tempMutation: 'random' as const },
    { sparks: 20 },
    { memories: 2 },
    { sparks: 50, snapshot: true },
  ] as const,

  // NUMBER FORMAT
  NUMBER_SUFFIXES: ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'] as const,

  // MENTAL STATES (5 passive)
  mentalStates: {
    flow: {
      triggerTaps: 10,
      triggerWindow: 30,
      bonus: 'focusFillRate +10%',
      grace: 30,
    },
    deep: {
      triggerIdleSeconds: 180,
      bonus: 'baseProduction +5%',
      grace: 60,
    },
    eureka: {
      triggerInsights: 3,
      triggerWindow: 180,
      bonus: 'production +15% 60s',
      duration: 60,
    },
    dormancy: {
      triggerIdlePurchase: 300,
      bonus: 'nextNeuron x2 value',
    },
    hyperfocus: {
      triggerFocusAbove: 0.5,
      triggerDuration: 180,
      bonus: 'insightDuration +3s',
      grace: 30,
    },
  },

  // MICRO-CHALLENGES
  microChallengeInterval: [480, 600] as const,
  microChallengeRewardMult: 0.01,

  // NEURAL DIARY
  diaryMaxEntries: 500,

  // WHAT-IF PREVIEW
  whatIfCycleBuffer: 3,

  // PROGRESSIVE DISCLOSURE
  regionsUnlockPct: 0.01,
  sessionInactivityThreshold: 5 * 60,

  // GAME LOOP
  tickIntervalMs: 100,

  // SOFT CAP
  softCapKnee: 100,
  softCapExponent: 0.72,
} as const;

export type SynapseConstants = typeof SYNAPSE_CONSTANTS;
