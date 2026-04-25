// Functional tests for docs/GDD.md §35 TICK-1.
// Note: createDefaultState() does not exist until Phase 6. Tests use a local
// helper that builds minimal GameState from spec defaults — verified against
// GDD §32 "DEFAULT_STATE non-trivial initial values" block.

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
      { type: 'basica', count: 1 },
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
    pendingOfflineSummary: null,
    lucidDreamActiveUntil: null,
    sessionStartTimestamp: null,
    installedAt: 0,
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
    geniusPassDismissals: 0,
    lastAdWatchedAt: 0,
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
    // Sprint 7.5.1 region/mastery/auto-buy fields (9, all default-empty for tick tests).
    memoryShards: { emotional: 0, procedural: 0, episodic: 0 },
    memoryShardUpgrades: [],
    activePrecommitment: null,
    precommitmentStreak: 0,
    mood: 30,
    moodHistory: [],
    brocaNamedMoments: [],
    mastery: {},
    autoBuyConfig: {},
    // Sprint 10 Phase 10.1 — Settings (8). Test fixture defaults match createDefaultState.
    sfxVolume: 50,
    musicVolume: 50,
    language: 'en',
    colorblindMode: false,
    reducedMotion: false,
    highContrast: false,
    fontSize: 'medium',
    notificationsEnabled: true,
  };
  return { ...base, ...overrides };
}

describe('tick — production accumulation', () => {
  test('base state with 1 Básica → after 1 tick thoughts increment by 0.5 × 0.1 = 0.05', () => {
    const s = makeState();
    const { state } = tick(s, 2_000_000);
    expect(state.thoughts).toBeCloseTo(0.05, 10);
    expect(state.cycleGenerated).toBeCloseTo(0.05, 10);
    expect(state.totalGenerated).toBeCloseTo(0.05, 10);
  });

  test('10 Básicas → tick produces 0.5 × 10 × 0.1 = 0.5 thoughts (recalc happens before produce)', () => {
    const s = makeState({
      neurons: [
        { type: 'basica', count: 10 },
        { type: 'sensorial', count: 0 },
        { type: 'piramidal', count: 0 },
        { type: 'espejo', count: 0 },
        { type: 'integradora', count: 0 },
      ],
      baseProductionPerSecond: 0,
      effectiveProductionPerSecond: 0,
    });
    const { state } = tick(s, 2_000_000);
    expect(state.baseProductionPerSecond).toBeCloseTo(5, 10);
    expect(state.effectiveProductionPerSecond).toBeCloseTo(5, 10);
    expect(state.thoughts).toBeCloseTo(0.5, 10);
  });

  test('insight multiplier applied on recalc', () => {
    const s = makeState({
      neurons: [
        { type: 'basica', count: 10 },
        { type: 'sensorial', count: 0 },
        { type: 'piramidal', count: 0 },
        { type: 'espejo', count: 0 },
        { type: 'integradora', count: 0 },
      ],
      insightActive: true,
      insightMultiplier: 3,
      insightEndTime: 9_999_999_999,
    });
    const { state } = tick(s, 2_000_000);
    expect(state.effectiveProductionPerSecond).toBeCloseTo(15, 10);
    expect(state.thoughts).toBeCloseTo(1.5, 10);
  });
});

describe('tick — CORE-10 consciousness bar', () => {
  test('flips unlocked when cycleGenerated crosses 0.5 × threshold after produce', () => {
    // Needs cycleGenerated just under 0.5 × 50K = 25K, with enough PPS to push it past.
    const s = makeState({
      cycleGenerated: 24_999.9,
      currentThreshold: 50_000,
      neurons: [
        { type: 'integradora', count: 10 }, // rate 1800 × 10 = 18_000/sec; dt=0.1 → +1800
        { type: 'basica', count: 0 },
        { type: 'sensorial', count: 0 },
        { type: 'piramidal', count: 0 },
        { type: 'espejo', count: 0 },
      ],
    });
    const { state } = tick(s, 2_000_000);
    expect(state.consciousnessBarUnlocked).toBe(true);
  });

  test('already-unlocked state stays unlocked (one-way flip, no error)', () => {
    const s = makeState({ consciousnessBarUnlocked: true });
    const { state } = tick(s, 2_000_000);
    expect(state.consciousnessBarUnlocked).toBe(true);
  });

  test('below trigger threshold: stays locked', () => {
    const s = makeState({ cycleGenerated: 1_000, currentThreshold: 50_000 });
    const { state } = tick(s, 2_000_000);
    expect(state.consciousnessBarUnlocked).toBe(false);
  });
});

describe('tick — Discharge charges', () => {
  test('no charge gained before chargeInterval elapsed', () => {
    const s = makeState({ dischargeCharges: 0, dischargeLastTimestamp: 1_500_000 });
    // nowTimestamp is 2M, so elapsed = 500_000ms = 8.3 min < 20 min interval.
    const { state } = tick(s, 2_000_000);
    expect(state.dischargeCharges).toBe(0);
  });

  test('charge gained once chargeInterval elapsed (20 minutes)', () => {
    const interval = 20 * 60 * 1000;
    const s = makeState({ dischargeCharges: 0, dischargeLastTimestamp: 0 });
    const { state } = tick(s, interval);
    expect(state.dischargeCharges).toBe(1);
    expect(state.dischargeLastTimestamp).toBe(interval);
  });

  test('charge caps at dischargeMaxCharges', () => {
    const interval = 20 * 60 * 1000;
    const s = makeState({
      dischargeCharges: 2,
      dischargeMaxCharges: 2,
      dischargeLastTimestamp: 0,
    });
    const { state } = tick(s, interval);
    expect(state.dischargeCharges).toBe(2); // already at cap
  });
});

describe('tick — RP-1 window prune', () => {
  test('purges entries older than 120_000ms from cycleNeuronPurchases', () => {
    const now = 1_000_000;
    const s = makeState({
      cycleNeuronPurchases: [
        { type: 'basica', timestamp: now - 130_000 }, // stale
        { type: 'sensorial', timestamp: now - 60_000 }, // fresh
      ],
    });
    const { state } = tick(s, now);
    expect(state.cycleNeuronPurchases.length).toBe(1);
    expect(state.cycleNeuronPurchases[0].type).toBe('sensorial');
  });

  test('all-fresh window is unchanged', () => {
    const now = 1_000_000;
    const s = makeState({
      cycleNeuronPurchases: [{ type: 'basica', timestamp: now - 1_000 }],
    });
    const { state } = tick(s, now);
    expect(state.cycleNeuronPurchases.length).toBe(1);
  });
});

describe('tick — Piggy Bank', () => {
  test('crosses 10K threshold → piggyBankSparks increments', () => {
    // totalGenerated 9_999 + PPS pushing past 10_000 → one bucket crossed.
    const s = makeState({
      totalGenerated: 9_999,
      piggyBankSparks: 0,
      neurons: [
        { type: 'integradora', count: 1 }, // 1800/sec × 0.1 = 180
        { type: 'basica', count: 0 },
        { type: 'sensorial', count: 0 },
        { type: 'piramidal', count: 0 },
        { type: 'espejo', count: 0 },
      ],
    });
    const { state } = tick(s, 2_000_000);
    expect(state.piggyBankSparks).toBe(1);
  });

  test('MONEY-10 hard cap at 500 — already-full does not overflow', () => {
    const s = makeState({
      totalGenerated: 5_000_000, // already crossed many thresholds historically
      piggyBankSparks: 500,
      neurons: [
        { type: 'integradora', count: 100 }, // huge production
        { type: 'basica', count: 0 },
        { type: 'sensorial', count: 0 },
        { type: 'piramidal', count: 0 },
        { type: 'espejo', count: 0 },
      ],
    });
    const { state } = tick(s, 2_000_000);
    expect(state.piggyBankSparks).toBe(500);
  });

  test('no bucket crossed → no increment', () => {
    const s = makeState({ totalGenerated: 5_000, piggyBankSparks: 0 });
    const { state } = tick(s, 2_000_000);
    expect(state.piggyBankSparks).toBe(0);
  });
});

describe('tick — purity', () => {
  test('same inputs produce deep-equal outputs', () => {
    const s = makeState({
      neurons: [
        { type: 'basica', count: 5 },
        { type: 'sensorial', count: 2 },
        { type: 'piramidal', count: 0 },
        { type: 'espejo', count: 0 },
        { type: 'integradora', count: 0 },
      ],
      cycleStartTimestamp: 1_234_567,
      lastSpontaneousCheck: 42,
    });
    const a = tick(s, 3_000_000);
    const b = tick(s, 3_000_000);
    expect(JSON.stringify(a.state)).toBe(JSON.stringify(b.state));
    expect(a.antiSpamActive).toBe(b.antiSpamActive);
  });

  test('input state not mutated (tick returns a new object)', () => {
    const s = makeState({ thoughts: 100 });
    const before = JSON.stringify(s);
    tick(s, 2_000_000);
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe('tick — Step 10 spontaneous event check', () => {
  // Post-Phase-5 resolution: lastSpontaneousCheck is an absolute timestamp.
  // If (nowTimestamp - lastSpontaneousCheck) / 1000 >= randomInRange(240, 360, seed),
  // the field is mutated to nowTimestamp.

  test('mutates lastSpontaneousCheck to nowTimestamp after interval passes', () => {
    // lastSpontaneousCheck = 0 (initial), nowTimestamp = 2_000_000 → elapsed = 2000s > 240-360s max.
    const s = makeState({
      lastSpontaneousCheck: 0,
      cycleStartTimestamp: 1_000_000,
    });
    const { state } = tick(s, 2_000_000);
    expect(state.lastSpontaneousCheck).toBe(2_000_000);
  });

  test('does NOT mutate when elapsed is below the seeded interval', () => {
    // nowTimestamp - lastSpontaneousCheck = 1000ms = 1s, well below the 240s min.
    const s = makeState({
      lastSpontaneousCheck: 1_999_000,
      cycleStartTimestamp: 1_000_000,
    });
    const { state } = tick(s, 2_000_000);
    expect(state.lastSpontaneousCheck).toBe(1_999_000);
  });
});

describe('tick — Step 9 Era 3 first-tick window', () => {
  // Per Phase-5 resolution: "first tick of the cycle" is now
  // (nowTimestamp - cycleStartTimestamp) < 1000, not state.cycleTime < 1000.
  // Step 9 body is a TODO stub, so this test only verifies the guard is reachable
  // (no errors) for in-window vs out-of-window cases.

  test('in-window Era 3: no error (stub TODO is a no-op)', () => {
    const s = makeState({
      prestigeCount: 20,
      cycleStartTimestamp: 100,
    });
    // nowTimestamp = 500 → cycle age 400ms, within first-tick window.
    expect(() => tick(s, 500)).not.toThrow();
  });

  test('past first-tick window: no error, still a no-op', () => {
    const s = makeState({
      prestigeCount: 20,
      cycleStartTimestamp: 100,
    });
    // nowTimestamp = 2_000_000 → cycle age ≫ 1000ms.
    expect(() => tick(s, 2_000_000)).not.toThrow();
  });
});

describe('tick — expiry of temporary modifiers (Step 2)', () => {
  test('Insight expires when insightEndTime passed', () => {
    const s = makeState({
      insightActive: true,
      insightMultiplier: 3,
      insightEndTime: 1_500_000,
    });
    const { state } = tick(s, 2_000_000);
    expect(state.insightActive).toBe(false);
    expect(state.insightMultiplier).toBe(1);
    expect(state.insightEndTime).toBe(null);
  });

  test('Insight still active when endTime is in future', () => {
    const s = makeState({
      insightActive: true,
      insightMultiplier: 3,
      insightEndTime: 9_999_999_999,
    });
    const { state } = tick(s, 2_000_000);
    expect(state.insightActive).toBe(true);
  });

  test('Spontaneous event expires past endTime', () => {
    const s = makeState({
      activeSpontaneousEvent: { id: 'test', type: 'positive', endTime: 1_500_000 },
    });
    const { state } = tick(s, 2_000_000);
    expect(state.activeSpontaneousEvent).toBe(null);
  });

  test('pendingHyperfocusBonus clears after 5s past mentalStateExpiry', () => {
    const s = makeState({
      pendingHyperfocusBonus: true,
      mentalStateExpiry: 1_000_000,
    });
    const { state } = tick(s, 1_005_001);
    expect(state.pendingHyperfocusBonus).toBe(false);
  });
});

describe('tick — anti-spam (Step 12)', () => {
  test('returns false with empty tap buffer', () => {
    const s = makeState({ lastTapTimestamps: [] });
    const { antiSpamActive } = tick(s, 2_000_000);
    expect(antiSpamActive).toBe(false);
  });

  test('returns false when buffer full but window < 30s', () => {
    const now = 2_000_000;
    const stamps: number[] = [];
    // 20 stamps, each 100ms apart — total window 1.9s, way under 30s.
    for (let i = 0; i < 20; i++) stamps.push(now - 1_900 + i * 100);
    const s = makeState({ lastTapTimestamps: stamps });
    const { antiSpamActive } = tick(s, now);
    expect(antiSpamActive).toBe(false);
  });

  test('flags machine-like tapping: 20 stamps over 31s, interval 100ms, variance 0', () => {
    const now = 2_000_000;
    const stamps: number[] = [];
    // Start 31s ago, 20 stamps at exactly 100ms intervals.
    const start = now - 31_000;
    for (let i = 0; i < 20; i++) stamps.push(start + i * 100);
    const s = makeState({ lastTapTimestamps: stamps });
    const { antiSpamActive } = tick(s, now);
    expect(antiSpamActive).toBe(true);
  });

  test('does NOT flag fast legitimate play: 20 stamps over 31s, interval 130ms, high variance', () => {
    const now = 2_000_000;
    const stamps: number[] = [];
    const start = now - 31_000;
    // Intervals vary 90-170ms (variance > threshold)
    for (let i = 0; i < 20; i++) stamps.push(start + i * 130 + (i % 2 === 0 ? 40 : -40));
    const s = makeState({ lastTapTimestamps: stamps });
    const { antiSpamActive } = tick(s, now);
    expect(antiSpamActive).toBe(false);
  });
});
