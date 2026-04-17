// Order-enforcement tests for GDD §35 TICK-1.
// These tests fail loudly if Sprint 3+ refactoring accidentally reorders steps.
// Each test constructs state where the correct result is ONLY reachable if the
// specified step ordering holds.

import { describe, expect, test } from 'vitest';
import { tick } from '../../src/engine/tick';
import type { GameState } from '../../src/types/GameState';

function makeState(overrides: Partial<GameState> = {}): GameState {
  const base: GameState = {
    thoughts: 0,
    memories: 0,
    sparks: 0,
    cycleGenerated: 0,
    totalGenerated: 0,
    baseProductionPerSecond: 0,
    effectiveProductionPerSecond: 0,
    neurons: [
      { type: 'basica', count: 0 },
      { type: 'sensorial', count: 0 },
      { type: 'piramidal', count: 0 },
      { type: 'espejo', count: 0 },
      { type: 'integradora', count: 0 },
    ],
    connectionMult: 1,
    focusBar: 0,
    focusFillRate: 0.01,
    insightActive: false,
    insightMultiplier: 1,
    insightEndTime: null,
    dischargeCharges: 0,
    dischargeMaxCharges: 2,
    dischargeLastTimestamp: 0,
    nextDischargeBonus: 0,
    upgrades: [],
    currentPolarity: null,
    currentMutation: null,
    mutationSeed: 0,
    currentPathway: null,
    currentOfflineCapHours: 4,
    currentOfflineEfficiency: 0.5,
    sessionStartTimestamp: null,
    prestigeCount: 0,
    currentThreshold: 50_000,
    consciousnessBarUnlocked: false,
    patterns: [],
    totalPatterns: 0,
    regionsUnlocked: [],
    archetype: null,
    archetypeHistory: [],
    cycleStartTimestamp: 1_000_000,
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
    lastCycleEndProduction: 0,
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
    pendingHyperfocusBonus: false,
    activeMicroChallenge: null,
    lastMicroChallengeTime: 0,
    cycleMicroChallengesAttempted: 0,
    cycleDischargesUsed: 0,
    cycleNeuronPurchases: [],
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
    endingsSeen: [],
    transcendenceCount: 0,
    dailyStreakDays: 0,
    lastOpenedDate: null,
    weeklyChallenge: { id: '', weekStartTimestamp: 0, progress: 0, target: 0, rewardClaimed: false },
    tabBadgesDismissed: [],
    lastActiveTimestamp: 0,
    gameVersion: '1.0.0',
  };
  return { ...base, ...overrides };
}

describe('TICK-1 step order (GDD §35)', () => {
  // NOTE: Step 1 is a no-op per Phase 5 Sprint 1 resolution (cycleTime derived,
  // not stored). Order position retained in the 12-step narrative; tests below
  // cover the mutating steps (3-12) where ordering is observable.

  test('Step 3 (recalc) runs BEFORE Step 4 (produce) — stale PPS does not poison produce', () => {
    // State has 10 Básicas but effectivePPS stored as 0 (stale). If produce ran
    // before recalc, thoughts would still be 0. Correct order produces 10 × 0.5 × 0.1 = 0.5.
    const s = makeState({
      effectiveProductionPerSecond: 0,
      baseProductionPerSecond: 0,
      neurons: [
        { type: 'basica', count: 10 },
        { type: 'sensorial', count: 0 },
        { type: 'piramidal', count: 0 },
        { type: 'espejo', count: 0 },
        { type: 'integradora', count: 0 },
      ],
    });
    const { state } = tick(s, 2_000_000);
    expect(state.thoughts).toBeCloseTo(0.5, 10);
    expect(state.effectiveProductionPerSecond).toBeCloseTo(5, 10);
  });

  test('Step 5 (CORE-10) runs AFTER Step 4 (produce)', () => {
    // cycleGenerated starts at 0.49 × threshold (24_500 < 25_000). Production must
    // push it past 0.5 × threshold within this tick for the flag to flip. If Step 5
    // ran before Step 4, flag would stay false.
    const s = makeState({
      cycleGenerated: 24_500, // 49% of 50K
      currentThreshold: 50_000,
      consciousnessBarUnlocked: false,
      neurons: [
        { type: 'integradora', count: 10 }, // 18_000/sec × 0.1 = 1_800 → pushes past 50% = 25_000
        { type: 'basica', count: 0 },
        { type: 'sensorial', count: 0 },
        { type: 'piramidal', count: 0 },
        { type: 'espejo', count: 0 },
      ],
    });
    const { state } = tick(s, 2_000_000);
    expect(state.cycleGenerated).toBeGreaterThan(25_000); // produce happened
    expect(state.consciousnessBarUnlocked).toBe(true); // then CORE-10 fired
  });

  test('Step 7 (RP prune) does not affect Step 4 (produce) thoughts increment', () => {
    const now = 1_000_000;
    const withPurchases = makeState({
      neurons: [
        { type: 'basica', count: 10 },
        { type: 'sensorial', count: 0 },
        { type: 'piramidal', count: 0 },
        { type: 'espejo', count: 0 },
        { type: 'integradora', count: 0 },
      ],
      cycleNeuronPurchases: [
        { type: 'basica', timestamp: now - 200_000 }, // will be pruned
        { type: 'sensorial', timestamp: now - 10_000 },
      ],
    });
    const withoutPurchases = makeState({
      neurons: [
        { type: 'basica', count: 10 },
        { type: 'sensorial', count: 0 },
        { type: 'piramidal', count: 0 },
        { type: 'espejo', count: 0 },
        { type: 'integradora', count: 0 },
      ],
      cycleNeuronPurchases: [],
    });
    const a = tick(withPurchases, now).state;
    const b = tick(withoutPurchases, now).state;
    expect(a.thoughts).toBeCloseTo(b.thoughts, 10);
  });

  test('Step 12 (anti-spam) does not affect this tick production (affects next tap only)', () => {
    const now = 2_000_000;
    const stamps: number[] = [];
    const start = now - 31_000;
    for (let i = 0; i < 20; i++) stamps.push(start + i * 100); // machine-like

    const withSpam = makeState({
      neurons: [
        { type: 'basica', count: 10 },
        { type: 'sensorial', count: 0 },
        { type: 'piramidal', count: 0 },
        { type: 'espejo', count: 0 },
        { type: 'integradora', count: 0 },
      ],
      lastTapTimestamps: stamps,
    });
    const noSpam = makeState({
      neurons: [
        { type: 'basica', count: 10 },
        { type: 'sensorial', count: 0 },
        { type: 'piramidal', count: 0 },
        { type: 'espejo', count: 0 },
        { type: 'integradora', count: 0 },
      ],
    });
    const a = tick(withSpam, now);
    const b = tick(noSpam, now);
    // Production is identical — anti-spam only affects the tap handler (Sprint 3).
    expect(a.state.thoughts).toBeCloseTo(b.state.thoughts, 10);
    // But the flag differs, proving Step 12 ran.
    expect(a.antiSpamActive).toBe(true);
    expect(b.antiSpamActive).toBe(false);
  });

  test('Step 6 (Discharge accumulation) uses nowTimestamp passed to tick (not Date.now)', () => {
    // Purity check — if tick used Date.now somewhere, output would vary.
    const interval = 20 * 60 * 1000;
    const s = makeState({ dischargeCharges: 0, dischargeLastTimestamp: 0 });
    const a = tick(s, interval);
    const b = tick(s, interval);
    expect(a.state.dischargeCharges).toBe(1);
    expect(a.state.dischargeLastTimestamp).toBe(b.state.dischargeLastTimestamp);
  });
});
