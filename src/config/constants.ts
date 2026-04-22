// Implements docs/GDD.md §31 (Base parameters) — v1.0 post-audit
//
// Every gameplay-relevant number lives here (CODE-1). If a value needs to change,
// update BOTH this file AND docs/GDD.md §31 in the same commit (Update Discipline).
// Sprint 1 consistency tests assert each value against the GDD.

export const SYNAPSE_CONSTANTS = {
  // ── Tutorial ──
  tutorialThreshold: 25_000, // P0 of first Run ONLY when isTutorialCycle=true (TUTOR-2 §9). Overrides baseThresholdTable[0]. TUTOR-1 target: 7-9 min. Retuned 50K→25K in Sprint 3 Phase 7.4b per tutorial-timing simulator (50K projected ~14.7 min at 5 taps/sec; 25K projects 7-8 min with same inputs). GDD §31 + §9 currently disagree — PROGRESS.md is the source of truth until Nico updates the GDD.
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
  connectionMultPerPair: 0.05, // GDD §5: for every PAIR of owned neuron types, connectionMult += 0.05
  sincroniaNeuralMult: 2, // GDD §24 `sincronia_neural`: "Connection multipliers ×2" (Phase 1 literal reading)

  // ── Cascade & Discharge ──
  // Sprint 6.8 Phase 6 R1 decision: hard cap on summed Discharge max charges.
  // Without this, late-game stacks (base 3 P10 + Descarga Neural +1 + Arquitecto
  // Neural +1 P8 + Amplificador P15 +1 + Mood Elevated/Euphoric +1 + Integrated
  // Mind 3-region +1 + Pattern Node 6 B +1) reach 9 — breaks pacing scarcity.
  // GDD §7 + Sprint 8c TEST-3 validate. Consumers added in Sprint 7.5 Phase 7.5.3.
  dischargeMaxChargesHardCap: 5,

  cascadeThreshold: 0.75,
  cascadeMultiplier: 2.5,
  cascadaEternaMult: 3.0, // GDD §15 Resonance: sets cascadeMult base 2.5 → 3.0 (Sprint 8b owns set)
  dischargeMultiplier: 1.5, // base, pre-P3
  dischargeMultiplierP3Plus: 2.0,
  dischargeMultBoostMinPrestige: 3, // GDD §7: dischargeMultiplier bumps at P3+
  chargeIntervalMinutes: 20,

  // ── Polarity (GDD §11, P3+) ──
  polarityUnlockPrestige: 3, // GDD §11 POLAR-1: Polarity stays null until P3 reached.
  excitatoryProdMult: 1.10, // GDD §11: Excitatoria production +10%.
  excitatoryDischargeMult: 0.85, // GDD §11: Excitatoria Discharge bonus −15%.
  inhibitoryProdMult: 0.94, // GDD §11: Inhibitoria production −6%.
  inhibitoryDischargeMult: 1.30, // GDD §11: Inhibitoria Discharge bonus +30%.
  inhibitoryCascadeThresholdMult: 0.90, // GDD §11 "Cascade chance +10%" — Nico-approved Option A (multiplicative threshold shift, 2026-04-21). Sprint 4c interpretation: threshold × 0.90 when Inhibitoria active. Min-with-Node-36A when both apply.

  // ── Momentum ──
  momentumBonusSeconds: 30,
  maxMomentumPct: 0.1, // CORE-8 cap (second audit 4A-2): momentumBonus ≤ 10% of upcoming threshold

  // ── Focus ──
  focusFillPerTap: 0.01,
  insightMultiplier: [3.0, 8.0, 18.0] as const,
  insightDuration: [15, 12, 8] as const, // seconds
  insightThresholds: [1.0, 2.0, 3.0] as const, // bar fill required to auto-fire per level (GDD §6)
  insightLevel2MinPrestige: 10, // P10+ → level 2 Insight (Profundo)
  insightLevel3MinPrestige: 19, // P19+ → level 3 Insight (Trascendente, Era 3)
  concentracionInsightDurationAddS: 5, // Concentración Profunda adds +5s (GDD §24)
  hyperfocusLevel3DurationBoost: 0.5, // +50% duration at level 3 with pendingHyperfocusBonus (MENTAL-4/5)

  // ── Tap thought contribution (TAP-2, §6) ──
  baseTapThoughtPct: 0.05, // 5% of effectiveProductionPerSecond per tap (P0 base, replaced by Potencial Sináptico → 0.10)
  baseTapThoughtMin: 1, // minimum 1 thought per tap (ensures UI-9 feedback at P0 with 0.5/sec)
  potencialSinapticoTapPct: 0.1, // replaces baseTapThoughtPct when owned (not additive)
  sinestesiaTapMult: 0.4, // Sinestesia Mutation: tap thoughts × 0.4 (§13 #13)

  // ── Offline ──
  baseOfflineEfficiency: 0.5,
  baseOfflineCapHours: 4,
  maxOfflineHours: 16, // max achievable (REM→8, Distribuida→12, sueno_profundo→16)
  // Sprint 6.8 Phase 6 R6 decision: cap raised 2.0 → 2.5 to preserve invest
  // value with new Mood (×1.30 Euphoric) + Ondas Theta (×2.0) + Guardian del
  // Tiempo (×1.5 at 5h+) stacks. Code bump lands with Sprint 7.5 Phase 7.5.3
  // (Mood-applies-offline integration); current value stays 2.0 to keep offline
  // tests green until that phase. GDD §19 + Sprint 8c TEST-2 validate.
  maxOfflineEfficiencyRatio: 2.0, // Sprint 7.5: bump to 2.5
  offlineMinMinutes: 1, // skip calc if <1 min

  // ── Memories ──
  baseMemoriesPerPrestige: 2, // GDD §2 Memory generation table: +2 per prestige baseline. Consolidación de Memoria upgrade adds +50% via `memoryGainAdd: 0.5` (§24).

  // ── Patterns ──
  patternsPerPrestige: 3,
  patternTreeSize: 50, // GDD §10: "Pattern Tree (50 nodes + 5 decisions)". Hard cap on totalPatterns.
  patternCycleBonusPerNode: 0.04,
  patternCycleCap: 1.5,
  patternFlatBonusPerNode: 2,
  patternResetCostResonance: 1000, // PAT-3
  patternDecisionNodes: [6, 15, 24, 36, 48] as const,

  // ── Mutations ──
  mutationPoolSize: 15,
  mutationOptionsPerCycle: 3, // +1 with Creativa, +1 with Genius Pass
  mutationUnlockPrestige: 7, // GDD §13: "Each cycle (from P7+)"
  // Sprint 5: cross-cutting bonuses to mutationOptionsPerCycle (per GDD §13).
  // Per-mutation effect tuning lives in src/config/mutations.ts (canonical
  // data file, exempt from Gate 3 per CLAUDE.md src/config/ exclusion).
  creativaMutationBonusOptions: 1, // GDD §13 "+1 if Creativa archetype"
  geniusPassMutationBonusOptions: 1, // GDD §13 "+1 if Genius Pass" (Sprint 9)

  // ── Pathways ──
  // Per-pathway tuning lives in src/config/pathways.ts. Cross-cutting only here.
  pathwayUnlockPrestige: 10, // GDD §14: "Each cycle, player chooses 1 Pathway (P10+)"
  pathwayEquilibradaBonusMult: 0.85, // GDD §14 "all upgrade bonuses ×0.85"

  // ── Archetypes ──
  // Per-archetype tuning lives in src/config/archetypes.ts. Cross-cutting only here.
  // Current value: 5. Sprint 7.6 will migrate to 7 (Archetype choice moved after Mutations
  // at P7 — choice becomes informed, not premature). GDD §12 + §9 already document the new
  // target; constants.ts migrates when Sprint 7.6 implementation + test updates land together.
  archetypeUnlockPrestige: 5, // Sprint 7.6: migrate to 7

  // ── Resonance ──
  resonanceBasePerPrestige: 1,
  resonanceMaxCascadesCount: 3,
  resonanceMaxInsightsCount: 2,
  resonanceFastCycleBonus: 3,
  resonanceFastCycleThresholdMin: 15,

  // ── Regions ──
  regionsUnlockPct: 0.01, // 1% of threshold to trigger first region unlock
  // GDD §16 REG-1: Hipocampo's first unlock awards a one-time +3 Memorias.
  hipocampoUnlockMemoriasBonus: 3,
  // GDD §16: Área de Broca (P14 unlock) — adds +1 passive Memory each cycle
  // and lets the player name their mind (free-text, capped, profanity-filtered).
  brocaPassiveMemoryPerCycle: 1,
  brocaNameMaxChars: 20,

  // ── Spontaneous events ──
  spontaneousCheckIntervalMin: 240, // 4 min
  spontaneousCheckIntervalMax: 360, // 6 min
  spontaneousTriggerChance: 0.4,
  spontaneousWeights: { positive: 0.5, neutral: 0.33, negative: 0.17 },
  // Per-event tuning values from GDD §8 table. Per-event effects live in
  // src/config/spontaneous.ts (Gate-3 exempt canonical storage).

  // ── Regions: Mood System (Límbico, Sprint 6.8 re-architecture) ──
  // GDD §16 Sistema Límbico + MOOD-1..3 rules. Mood applies post-softCap as
  // effectiveMult (stacks multiplicatively with Mental States).
  moodMaxValue: 100, // GDD §16 Moodometer range 0-100
  moodInitialValue: 50, // Calm tier default for new games
  moodTierBoundaries: [20, 40, 60, 80] as const, // Numb<20 / Calm<40 / Engaged<60 / Elevated<80 / Euphoric
  moodTierProductionMults: [0.90, 1.00, 1.05, 1.15, 1.30] as const, // per tier, post-softCap
  moodTierFocusFillMults: [1.00, 1.00, 1.10, 1.10, 1.10] as const, // Engaged+ only
  moodTierMaxChargesBonus: [0, 0, 0, 1, 1] as const, // Elevated/Euphoric: +1 discharge max
  moodTierInsightPotentialBonus: [0, 0, 0, 0, 1] as const, // Euphoric only: +1 Insight level potential
  moodDecayPerHourOffline: 2, // MOOD-3: mood drifts toward Calm during long offline
  moodGeniusPassFloor: 40, // GDD §26: Genius Pass subscribers' Mood never drops below Calm

  // ── Regions: Pre-commitments (Prefrontal, Sprint 6.8) ──
  // GDD §16 Corteza Prefrontal + PRECOMMIT-1..4 rules.
  precommitMinWager: 1, // Memorias minimum
  precommitMaxWager: 3, // Memorias maximum
  precommitSuccessMult: 2.0, // 2× Memory reward on success
  precommitFailurePenalty: 0.15, // -15% Memory on fail (softened from -25% per Sprint 6.8)
  precommitStreakBonusCycles: 5, // 5 consecutive successes → +1 permanent Memoria/cycle
  precommitUnlockPrestige: 5, // GDD §9: Pre-commits unlock at P5 (Prefrontal region panel active)

  // ── Regions: Memory Shards (Hipocampo, Sprint 6.8) ──
  // GDD §16 Hipocampo + SHARD-1..3 rules. Typed shards replace generic Memorias drip.
  shardDripBasePerMinute: 0.5, // base drip per active shard type per active minute
  shardsToMemoriaConversion: 100, // 100 shards (any type) → 1 Memoria (via Memory Weave)
  shardTypeCount: 3, // emotional, procedural, episodic

  // ── Regions: Visual Foresight (Sprint 6.8) ──
  // GDD §16 Corteza Visual + FORESIGHT-1..4 rules. Tier-gated preview powers.
  foresightT1UnlockPrestige: 0, // What-if 3 cycles ahead
  foresightT2UnlockPrestige: 5, // Mutation pool preview pre-prestige (requires MUT-2 seed refactor)
  foresightT3UnlockPrestige: 12, // 20s Spontaneous event countdown
  foresightT4UnlockPrestige: 19, // Era 3 event preview 1 cycle ahead
  spontaneousEventForewarningMs: 20_000, // FORESIGHT-3: countdown window before event fires

  // ── Regions: Broca Named Moments (Sprint 6.8) ──
  // GDD §16 Área de Broca + VOICE-1..2 rules. 5 named-moment slots.
  brocaNamedMomentSlots: 5, // First Prestige / Archetype / First RP / Era 3 Entry / P26 Ending
  brocaPhraseMaxChars: 40, // per-phrase player input cap

  // ── Regions: Integrated Mind (Amplitud de Banda synergy, Sprint 6.8) ──
  integratedMindThreshold3Regions: 3, // +1 Discharge max at 3 active
  integratedMindThreshold4Regions: 4, // +10% Memory gain global at 4 active
  integratedMindThreshold5Regions: 5, // Secret cycle-end narrative beat at 5 active

  // ── Mastery system (Sprint 6.8 — unified cross-system lifetime tracking) ──
  // GDD §38 + MASTERY-1..2 rules. Covers Mutations + Upgrades + Pathways + Archetypes.
  masteryMaxLevel: 10, // cap per entity
  masteryBonusPerLevel: 0.005, // +0.5% per level (max +5%)

  // ── Onboarding tutorial track (Sprint 6.8 — 5-cycle progressive) ──
  // GDD §37 + TUTOR-3..5 rules.
  tutorialTrackCycleCount: 5, // 5 cycles of progressive disclosure
  tutorialSparksRewardPerStep: 2, // +2 Sparks per tutorial goal completion

  // ── Achievements thresholds (Sprint 7 §24.5 — values match GDD spec) ──
  achievementCycUnder10Ms: 600_000, // cyc_under_10: complete cycle in <10 min
  achievementNarTenFragmentsCount: 10, // nar_ten_fragments: read 10 fragments
  achievementNarDiary50Count: 50, // nar_diary_50: 50 diary entries
  achievementMasResonance50Count: 50, // mas_resonance_50: peak 50 Resonance in one Run
  achievementHidNoDischargeStreakCount: 3, // hid_no_discharge_full_cycle: 3 cycles in a row
  achievementShardCollectorCount: 100, // reg_shard_collector: 100 shards (any type) — Sprint 7.5

  // ── Mood event deltas (per MOOD-2 rule — shifts from play events) ──
  moodDeltaCascade: 5, // +5 on Cascade
  moodDeltaPrestige: 10, // +10 on Prestige complete
  moodDeltaFragmentRead: 3, // +3 on fragment read
  moodDeltaPrecommitFail: -15, // -15 on Pre-commit fail
  moodDeltaLongIdle: -5, // -5 per Dormancy entry
  moodDeltaWeeklyChallenge: 20, // +20 on Weekly Challenge complete

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
  antiSpamBufferSize: 20, // MENTAL-2 §17: circular buffer size for lastTapTimestamps
  insightBufferSize: 3, // MENTAL-2 §17: circular buffer size for insightTimestamps (Eureka trigger)

  // ── Era 3 ──
  era3StartPrestige: 19, // §23: Era 3 first cycle
  era3EndPrestige: 26, // §23: Era 3 final cycle (triggers ending)

  // ── CORE-10 consciousness bar ──
  consciousnessBarTriggerRatio: 0.5, // CORE-10 (§35): cycleGenerated / currentThreshold crossover

  // ── Piggy Bank ──
  piggyBankMaxSparks: 500, // MONEY-10 (§35): hard cap
  piggyBankSparksPerThoughts: 10_000, // MONEY-8/10: 1 spark per 10K totalGenerated crossed

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

  // ── Runtime scheduler ──
  tickIntervalMs: 100, // CODE-4 + GDD §35 TICK-1 step 1: fixed 100ms dt (Phase 3.5 surfacing)

  // ── Save ──
  saveIntervalMs: 30_000, // 30s auto-save during active

  // ── UI ──
  undoToastDurationMs: 3_000,
  undoExpensiveThresholdPct: 0.1, // >10% of thoughts triggers undo
  splashDurationMs: 2_000, // UI-9 step 1: 2s branded splash (Sprint 2 kickoff)
  firstOpenTutorialHintIdleMs: 2_000, // UI-9 step 4: 2s idle → "Tap the neuron" (Sprint 2 kickoff)
  narrativeFragmentDisplayMs: 4_000, // UI-9 step 5: fragment hold duration (fade-in/out use TOKENS.MOTION.durSlow) — Sprint 2 Phase 6
  echoCooldownMs: 90_000, // NARR-3: max 1 Echo per 90 seconds

  // ── Canvas caps (Sprint 2 Phase 7, CODE-4 policy values) ──
  maxVisibleNodes: 80, // CODE-4 "Max 80 visible nodes" + SPRINTS.md §Sprint 2 line 229; renderer clamps min(totalCount, maxVisibleNodes)
  canvasMaxDPR: 2, // Phase 7 Nico-approved 2026-04-20: clamp DPR on 3× devices (Mi A3 DPR=2 unaffected; protects 1080×2340 buffers on 3× phones)

  // ── Performance instrumentation (Sprint 2 Phase 7) ──
  // These are diagnostic thresholds, not gameplay values — they control
  // what the FPSMeter reports and what the perf-spike script asserts.
  perfFpsWarmupFrames: 10, // FPSMeter discards first N frames (layout settle + GPU warmup)
  perfStressNeuronsPerType: 20, // stress state populates 20 per type × 5 types = 100 total
  perfSpikeDurationMs: 30_000, // 30s stress window per SPRINTS.md §Sprint 2 line 238
  perfTargetFps: 30, // min average fps for spike to pass (CODE-4 canvas budget)
  perfMemoryDeltaBudgetMB: 20, // max JS heap growth across 30s stress (SPRINTS.md line 238)
  perfDroppedFramePctBudget: 0.1, // ≤10% of frames may exceed 33.33ms budget

  // ── Version ──
  gameVersion: '1.0.0',

  // ── Field-count runtime verification (§32) ──
  // Current code state: 110 fields. Sprint 7.5 Phase 7.5.1 will add 9 new fields
  // (memoryShards, memoryShardUpgrades, activePrecommitment, precommitmentStreak,
  // mood, moodHistory, brocaNamedMoments, mastery, autoBuyConfig) and bump to 119.
  // See GDD §32 for target spec.
  GAMESTATE_FIELD_COUNT: 110,
} as const;
