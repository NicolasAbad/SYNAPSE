// Implements docs/GDD.md §31 (Base parameters) — v1.0 post-audit
//
// Every gameplay-relevant number lives here (CODE-1). If a value needs to change,
// update BOTH this file AND docs/GDD.md §31 in the same commit (Update Discipline).
// Sprint 1 consistency tests assert each value against the GDD.

export const SYNAPSE_CONSTANTS = {
  // ── Tutorial ──
  tutorialThreshold: 50_000, // P0 of first Run ONLY when isTutorialCycle=true (TUTOR-2 §9). Overrides baseThresholdTable[0]. TUTOR-1 target: 7-9 min.
  tutorialDischargeMult: 3.0,

  // ── Thresholds ──
  runThresholdMult: [1.0, 3.5, 6.0, 8.5, 12.0, 15.0] as const, // by transcendenceCount

  // NOTE: consciousnessThreshold removed (second audit 2B-3) — duplicate of baseThresholdTable[0].
  // Consciousness bar visibility uses CORE-10 (§35): 0.5 × currentThreshold.

  baseThresholdTable: [
    // v2 (second audit 4A-1) — INTERIM values from node-simulated 1-tap/sec runs with typical upgrade/archetype kit.
    // Old values were sim-verified to run 40-50% slow in Era 1 tail / 50-80% fast in Era 2-3. See PROGRESS.md Batch 3 for rationale.
    // THESE ARE STILL INTERIM. Sprint 8c TEST-5 is the authoritative gate — run 27 scenarios (3 tap × 3 archetype × 3 pathway), tune any cycle >20% off target.
    // See ECO-1 (§35): this table is data, not code — rebalancing never requires engine changes.
    800_000, // P0→P1:  ~8 min (OVERRIDDEN to 50K by TUTOR-2 for first-ever cycle only)
    450_000, // P1→P2:  ~7 min (was 1.2M; sim showed 11.7 min → 40% slow. Rebalanced for post-momentum start)
    1_000_000, // P2→P3:  ~8 min (was 1.8M)
    2_000_000, // P3→P4:  ~9 min (was 2.6M; Polarity unlocked P3)
    3_500_000, // P4→P5:  ~10 min (was 3.8M; Focus L2 unlocked P4)
    5_000_000, // P5→P6:  ~11 min (was 5.5M; Archetype chosen P5)
    7_500_000, // P6→P7:  ~12 min (was 8M)
    11_000_000, // P7→P8:  ~13 min (was 11M; Mutations unlocked P7)
    16_000_000, // P8→P9:  ~14 min (was 15M)
    35_000_000, // P9→P10: ~15 min (was 20M; sim showed 8 min → 50% fast. Era 2 gate — player must earn it)
    65_000_000, // P10→P11: ~16 min (was 30M; Pathways + Integradora + Tier P10 upgrades = big ceiling jump)
    95_000_000, // P11→P12: ~17 min (was 42M)
    135_000_000, // P12→P13: ~18 min (was 55M)
    180_000_000, // P13→P14: ~19 min (was 70M; Resonance currency unlocked P13)
    250_000_000, // P14→P15: ~20 min (was 90M; Broca region P14)
    340_000_000, // P15→P16: ~21 min (was 115M; Micro-challenges unlocked P15)
    450_000_000, // P16→P17: ~22 min (was 145M)
    580_000_000, // P17→P18: ~22 min (was 180M; Personal Best visible P17)
    800_000_000, // P18→P19: ~24 min (was 230M; sim 5-10 min → 60-80% fast. Era 3 gate — earn it)
    1_100_000_000, // P19→P20: ~25 min (was 300M; Era 3 starts, First Fracture event)
    1_500_000_000, // P20→P21: ~27 min (was 380M; countdown visible from here)
    2_000_000_000, // P21→P22: ~28 min (was 470M; Mirror Cycle event)
    2_800_000_000, // P22→P23: ~30 min (was 570M; Silent Resonance event)
    3_800_000_000, // P23→P24: ~32 min (was 700M; Dreamer's Dream event)
    5_200_000_000, // P24→P25: ~33 min (was 850M; Long Thought event, 45-min auto-prestige cap)
    7_000_000_000, // P25→P26: ~35 min (was 1.05B; Final Awakening event)
  ] as const,

  // ── Production ──
  costMult: 1.28,
  softCapExponent: 0.72,

  // ── Cascade & Discharge ──
  cascadeThreshold: 0.75,
  cascadeMultiplier: 2.5,
  dischargeMultiplier: 1.5, // base, pre-P3
  dischargeMultiplierP3Plus: 2.0,
  chargeIntervalMinutes: 20,

  // ── Momentum ──
  momentumBonusSeconds: 30,
  maxMomentumPct: 0.1, // CORE-8 cap (second audit 4A-2): momentumBonus ≤ 10% of upcoming threshold

  // ── Focus ──
  focusFillPerTap: 0.01,
  insightMultiplier: [3.0, 8.0, 18.0] as const,
  insightDuration: [15, 12, 8] as const, // seconds

  // ── Tap thought contribution (TAP-2, §6) ──
  baseTapThoughtPct: 0.05, // 5% of effectiveProductionPerSecond per tap (P0 base, replaced by Potencial Sináptico → 0.10)
  baseTapThoughtMin: 1, // minimum 1 thought per tap (ensures UI-9 feedback at P0 with 0.5/sec)
  potencialSinapticoTapPct: 0.1, // replaces baseTapThoughtPct when owned (not additive)
  sinestesiaTapMult: 0.4, // Sinestesia Mutation: tap thoughts × 0.4 (§13 #13)

  // ── Offline ──
  baseOfflineEfficiency: 0.5,
  baseOfflineCapHours: 4,
  maxOfflineHours: 16, // max achievable (REM→8, Distribuida→12, sueno_profundo→16)
  maxOfflineEfficiencyRatio: 2.0,
  offlineMinMinutes: 1, // skip calc if <1 min

  // ── Patterns ──
  patternsPerPrestige: 3,
  patternCycleBonusPerNode: 0.04,
  patternCycleCap: 1.5,
  patternFlatBonusPerNode: 2,
  patternResetCostResonance: 1000, // PAT-3
  patternDecisionNodes: [6, 15, 24, 36, 48] as const,

  // ── Mutations ──
  mutationPoolSize: 15,
  mutationOptionsPerCycle: 3, // +1 with Creativa, +1 with Genius Pass

  // ── Resonance ──
  resonanceBasePerPrestige: 1,
  resonanceMaxCascadesCount: 3,
  resonanceMaxInsightsCount: 2,
  resonanceFastCycleBonus: 3,
  resonanceFastCycleThresholdMin: 15,

  // ── Regions ──
  regionsUnlockPct: 0.01, // 1% of threshold to trigger first region unlock

  // ── Spontaneous events ──
  spontaneousCheckIntervalMin: 240, // 4 min
  spontaneousCheckIntervalMax: 360, // 6 min
  spontaneousTriggerChance: 0.4,
  spontaneousWeights: { positive: 0.5, neutral: 0.33, negative: 0.17 },

  // ── Mental States ──
  mentalStateFlowTapCount: 10,
  mentalStateFlowWindowMs: 15_000,
  mentalStateFlowDurationMs: 20_000,
  mentalStateDeepIdleMs: 60_000,
  mentalStateDeepMinNeurons: 5,
  mentalStateDeepDurationMs: 90_000,
  mentalStateEurekaInsightCount: 3,
  mentalStateEurekaWindowMs: 120_000,
  mentalStateEurekaDurationMs: 30_000,
  mentalStateDormancyIdleMs: 120_000,
  mentalStateDormancyDurationMs: 300_000,
  mentalStateHyperfocusFocusThreshold: 0.5,
  mentalStateHyperfocusDurationMs: 30_000,

  // ── Micro-challenges ──
  microChallengeTriggerPct: 0.3,
  microChallengeCooldownMs: 120_000,
  microChallengeMaxPerCycle: 3,

  // ── Tap anti-spam (TAP-1, BUG-K fix) ──
  antiSpamTapWindow: 30_000, // 30s sustain required (was 10s)
  antiSpamTapIntervalMs: 150, // <150ms avg triggers (was <200ms)
  antiSpamVarianceThreshold: 20, // std dev < 20ms = machine-like
  antiSpamPenaltyMultiplier: 0.1,

  // ── Monetization ──
  maxSparksPurchasedPerMonth: 1000,
  noAdTutorialMinutes: 10,
  minAdCooldownMs: 180_000, // 3 min
  geniusPassOfferMinIntervalMs: 259_200_000, // 72h
  geniusPassMaxDismissals: 3,
  starterPackExpiryMs: 172_800_000, // 48h
  starterPackShownAtPrestige: 2, // post-P2, not P1 (tonal fix)
  limitedOfferExpiryMs: 172_800_000,

  // ── Daily login ──
  dailyLoginRewards: [5, 5, 10, 10, 15, 20, 50] as const,

  // ── Save ──
  saveIntervalMs: 30_000, // 30s auto-save during active
  saveDebounceMs: 2_000, // debounce rapid saves

  // ── UI ──
  undoToastDurationMs: 3_000,
  undoExpensiveThresholdPct: 0.1, // >10% of thoughts triggers undo

  // ── Version ──
  gameVersion: '1.0.0',

  // ── Field-count runtime verification (§32) ──
  GAMESTATE_FIELD_COUNT: 110,
} as const;
