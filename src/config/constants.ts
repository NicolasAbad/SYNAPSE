// Implements docs/GDD.md §31 (Base parameters) — v1.0 post-audit
//
// Every gameplay-relevant number lives here (CODE-1). If a value needs to change,
// update BOTH this file AND docs/GDD.md §31 in the same commit (Update Discipline).
// Sprint 1 consistency tests assert each value against the GDD.

export const SYNAPSE_CONSTANTS = {
  // ── Settings (Sprint 10 Phase 10.1) ──
  // Volume defaults at 50/100 (mid-volume mobile idiom). Sliders run 0–100 in
  // 5% steps per V-1 — see `sfxVolumeStepPct` for the UI granularity constant.
  defaultSfxVolume: 50,
  defaultMusicVolume: 50,
  sfxVolumeStepPct: 5, // V-1 slider step (5% increments per spec)
  // Hard Reset 3-tap window (V-3): user must tap "Hard Reset" 3 times within 5s
  // to reveal the RESET text input gate. Resets after window expires.
  hardResetTapWindowMs: 5_000,
  hardResetTapCount: 3,
  hardResetConfirmText: 'RESET' as const, // CONST-OK CODE-1 exception: literal user-typed string per V-3
  // Save-sync indicator (V-4): how long the "Saving..." pill stays visible
  // after `saveInFlight` flips back to false (gives user time to register it).
  saveSyncIndicatorFadeMs: 600,

  // ── Audio (Sprint 10 Phase 10.2 — GDD §28) ──
  // Asset path scaffold (V-1): served from public/audio/ at runtime, bundled
  // into Capacitor builds via the `public/` directory.
  // Filenames per GDD §28 verbatim — ANALYTICS-5 style anti-drift discipline.
  audioBasePath: '/audio',
  // Tap pitch variation per GDD §28 ±5% — implemented as Howler `rate` jitter.
  tapSfxRateMin: 0.95,
  tapSfxRateMax: 1.05,
  // Era ambient crossfade (V-4) on theme change — long enough for smooth swap,
  // short enough that Era 3 transitions stay narratively impactful.
  ambientCrossfadeMs: 1500,
  // Volume scaling (V-5): UI sliders run 0-100; Howler expects 0-1.
  // Below this floor we skip play() entirely to save CPU.
  audioVolumeFloorPct: 1,

  // ── Daily Login Bonus + Push Notifications (Sprint 10 Phase 10.4 — GDD §26 + SPRINTS.md) ──
  // 7-day reward cycle per Sprint 10 spec line 956: Day 1=5, 2=5, 3=10, 4=10, 5=15, 6=20, 7=50.
  // Stored 0-indexed: streak 0 → reward index 0 (5 sparks), streak 6 → 50, then wraps.
  dailyLoginRewards: [5, 5, 10, 10, 15, 20, 50] as const,
  dailyLoginCycleLength: 7,
  // Streak-save window per Sprint 10: miss exactly 1 day → ad save offer. Miss
  // 2+ days → reset to 0 regardless. Day-diff threshold:
  //   diff=1 → normal claim
  //   diff=2 → 1 day missed → streak save eligible
  //   diff>=3 → 2+ missed → reset
  dailyLoginStreakSaveDayDiff: 2,
  dailyLoginResetThresholdDayDiff: 3,
  // Permission-asking cadence per Sprint 10: notificationPermissionAsked = 0 (never) /
  // 1 (after P1) / 2 (after P3). Each value records that we DID ask at that gate so
  // we don't re-ask at the same gate.
  notificationPermissionAskAtP1: 1, // first ask after first prestige
  notificationPermissionAskAtP3: 3, // second ask after third prestige if first declined
  // Daily reminder fires at 6 PM local time per push UX convention.
  dailyReminderHourLocal: 18,
  // Notification IDs (Capacitor LocalNotifications requires a unique number per scheduled).
  notificationIdDailyReminder: 1001,
  notificationIdOfflineCapReached: 1002,
  notificationIdStreakAboutToBreak: 1003,

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
    // Sprint 8c-tuning attempt (2026-04-24) executed gradient descent for 5 iterations but hit deadlock
    // at iter 5 — all sims timed out at P24 because the simulator's greedy-playstyle production ceiling
    // is reached well before late-game thresholds need to be hit. See PROGRESS.md "Sprint 8c-tuning
    // deadlock notes" for full findings. Reverted to pre-tuning baseline pending a different strategy
    // (e.g., smarter sim player, or relaxing the §9 gate to per-config-family targets).
    // See ECO-1 (§35): this table is data, not code — rebalancing never requires engine changes.
    800_000, // P0→P1:  ~8 min (OVERRIDDEN to 25K by TUTOR-2 for first-ever cycle only)
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
  // Sprint 7.5.3 R6 decision (Phase 6 lock 2026-04-22, applied 7.5.3): cap
  // raised 2.0 → 2.5 to preserve investment value with new Mood (×1.30 Euphoric)
  // + Ondas Theta (×2.0) + Guardian del Tiempo (×1.5 at 5h+) stacks. GDD §19 +
  // Sprint 8c TEST-2 validate the final ratio holds.
  maxOfflineEfficiencyRatio: 2.5,
  offlineMinMinutes: 1, // skip calc if <1 min
  // Sprint 7.10 Phase 7.10.2 — offline-efficiency stack components per GDD §19
  // formula (§19 lines 1141-1154). Previously hardcoded in the formula; lifted
  // to constants so consumer stack is Gate-1 clean.
  empaticaOfflineEfficiencyMult: 2.5, // GDD §19 Empática archetype offline mult
  geniusPassOfflineEfficiencyMult: 1.25, // GDD §19 Genius Pass +25% offline (stub flag; full Pass Sprint 9b)
  offlineTimeAnomalyOverCapMult: 2, // GDD §19 OFFLINE-5: elapsed > cap × this → hard-cap + anomaly log
  // Sprint 7.10 Phase 7.10.3 — OFFLINE-9 shard drip + Lucid Dream roll per GDD §19.
  shardDripOfflineRateMult: 0.5, // OFFLINE-9: Procedural drip at 50% of active rate; Emo/Epi stay 0 offline
  lucidDreamUnlockPrestige: 10, // Lucid Dream unlocks at P10+
  lucidDreamBaseProbability: 0.33, // default Lucid Dream fire probability
  lucidDreamEmpaticaProbability: 1.0, // Empática always triggers Lucid Dream
  lucidDreamMinOfflineMinutes: 30, // Lucid Dream + rewarded-ad gate
  lucidDreamOptionAProductionMult: 1.10, // Option A: +10% production
  lucidDreamOptionADurationMs: 3_600_000, // Option A: 1 hour duration (ms) — consumer Phase 7.10.5
  lucidDreamOptionBMemoryGain: 2, // Option B: +2 Memories (+3-with-Regulación-Emocional dropped per Sprint 7.5.3 retirement)
  // Sprint 7.10 Phase 7.10.5 — Welcome-back modal (Sprint 3.6 audit) gate.
  offlineModalMinSeconds: 60, // skip Sleep screen for sub-minute returns; below this, accrual is silent

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
  // Archetype choice fires at P7 (Sprint 7.6 migration from P5) — after Mutations land at P7,
  // the choice becomes informed rather than premature. GDD §12 + §9.
  archetypeUnlockPrestige: 7,

  // ── Resonance ──
  resonanceBasePerPrestige: 1,
  resonanceMaxCascadesCount: 3,
  resonanceMaxInsightsCount: 2,
  resonanceFastCycleBonus: 3,
  resonanceFastCycleThresholdMin: 15,
  // Sprint 8b Phase 8b.3 — Resonance currency unlock + Creativa archetype mult.
  resonanceUnlockPrestige: 13, // GDD §15 header: Resonance system unlocks at P13+
  resonanceCreativaArchetypeMult: 1.5, // GDD §15 formula: r = round(r × 1.5) when archetype === 'creativa'
  // Sprint 8b Phase 8b.6 — Transcendence confirm modal anti-misclick cooldown.
  transcendenceConfirmCooldownMs: 2_000, // Sprint 3.6 audit: 2s deliberate-action gate

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
  // moodInitialValue: 30 (NOT 50 as per GDD §16.3 line 831 prose). The §16.3
  // tier table puts 50 in Engaged (40-59) but the prose says "starts at 50 (Calm)"
  // — code aligns to the table (more concrete spec) and Sprint 7.5.3 puts the
  // default firmly in Calm (20-39). GDD prose deviation flagged in PROGRESS.md.
  moodInitialValue: 30,
  moodTierBoundaries: [20, 40, 60, 80] as const, // Numb<20 / Calm<40 / Engaged<60 / Elevated<80 / Euphoric
  moodTierProductionMults: [0.90, 1.00, 1.05, 1.15, 1.30] as const, // per tier, post-softCap
  moodTierFocusFillMults: [1.00, 1.00, 1.10, 1.10, 1.10] as const, // Engaged+ only
  moodTierMaxChargesBonus: [0, 0, 0, 1, 1] as const, // Elevated/Euphoric: +1 discharge max
  moodTierInsightPotentialBonus: [0, 0, 0, 0, 1] as const, // Euphoric only: +1 Insight level potential
  moodDecayPerHourOffline: 2, // MOOD-3: mood drifts toward moodDecayTargetValue during long offline (Sprint 8a offline consumer)
  // Sprint 7.9 §16.3 MOOD-3 extended online drift: addresses Sprint 7.8 F2
  // (Mood saturated at 100 by P7 under active play). Both online + offline
  // now converge toward 50 (midpoint) — above drifts down, below drifts up,
  // 50 is stable. Empática archetype ×0.5, lim_steady_heart ×0.5 (stacking)
  // per MOOD-3 updated spec.
  moodOnlineDriftPerMinute: 0.5, // 30/hour = 15× gentler than offline
  moodDecayTargetValue: 50, // midpoint — symmetric drift target
  moodDriftArchetypeEmpaticaMult: 0.5, // Empática archetype halves online + offline drift (MOOD-3)
  moodDriftSteadyHeartMult: 0.5, // lim_steady_heart halves online + offline drift (MOOD-3 extended)
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
  shardsToMemoriaConversion: 100, // 100 shards (any type) → 1 Memoria (via Memory Weave, Sprint 7.5.8)
  shardTypeCount: 3, // emotional, procedural, episodic
  // Sprint 7.5.2: Episodic burst values (GDD §16.1 "+N at each prestige, +5 per RP").
  // N=2 base (Nico-approved 2026-04-22 — symmetric with baseMemoriesPerPrestige=2,
  // calibrates `shard_epi_imprint` (10 Epi) affordable at P5, `shard_epi_reflection`
  // (30 Epi) affordable at P15 + first-RP).
  episodicShardPerPrestige: 2,
  episodicShardPerRp: 5, // GDD §16.1
  // Sprint 7.5.2: 6 shard-upgrade effect tuning constants (GDD §16.1 table).
  shardEmoPulseCascadeSparkBonus: 1,        // shard_emo_pulse: +1 Spark per Cascade
  shardEmoResonanceFragmentMemoryBonus: 2,  // shard_emo_resonance: +2 Memory on fragment first-read (stacks above base +1)
  shardProcFlowTapMultBonus: 0.05,          // shard_proc_flow: tap contribution +5%
  shardProcPatternChargeIntervalMult: 0.90, // shard_proc_pattern: discharge charge interval ×0.9 (-10%)
  shardEpiImprintMemoryPerPrestigeBonus: 1, // shard_epi_imprint: +1 Memoria per prestige
  shardEpiReflectionRpSparkBonus: 10,       // shard_epi_reflection: +10 Sparks per RP (stacks above base 5 → total 15)

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
  // GDD §37 + TUTOR-3..5 rules. Sprint 7.6 Phase 7.6.3 wired the Sparks reward
  // loop: each step completes on the prestige that ends that cycle (0→1 for c1,
  // …, 4→5 for c5). Persisted via `narrativeFragmentsSeen` (§39.2 prefix pattern).
  tutorialTrackCycleCount: 5, // 5 cycles of progressive disclosure
  tutorialSparksRewardPerStep: 2, // +2 Sparks per tutorial goal completion
  tutorialStepIds: ['tutorial_step_c1', 'tutorial_step_c2', 'tutorial_step_c3', 'tutorial_step_c4', 'tutorial_step_c5'] as const,

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
  moodDeltaResonantPattern: 15, // +15 on Resonant Pattern discovery (Sprint 7.5.3)
  moodDeltaPrecommitFail: -15, // -15 on Pre-commit fail
  moodDeltaLongIdle: -5, // -5 per Dormancy entry
  moodDeltaWeeklyChallenge: 20, // +20 on Weekly Challenge complete
  moodDeltaAntiSpam: -10, // -10 on anti-spam penalty (Sprint 7.5.3 §16.3)
  // Sprint 7.5.3 §16.3 — Mood event-delta scaling per source (MOOD-4 additive stack).
  moodEventScalingPerSource: 0.5,
  // Sprint 7.5.3 §16.3 — Límbico upgrade tuning literals (lim_elevation/_resilience/_euphoric_echo/_empathic_spark).
  limElevationBoundaryShift: 55,
  limResilienceMoodFloor: 25,
  limEuphoricEchoProductionMult: 1.40,
  limEmpathicSparkCascadeBonus: 5,
  // Sprint 7.5.3 §32 — moodHistory circular buffer cap.
  moodHistoryBufferCap: 48,
  // Sprint 7.5.5 §16.4 — Visual Foresight tier prestige gates.
  visualT2PrestigeGate: 5,
  visualT3PrestigeGate: 12,
  visualT4PrestigeGate: 19,
  visualWhatIfHorizonCycles: 3,
  // Sprint 7.5.8 §16.6 — Integrated Mind 4-region tier Memoria gain bonus (×1.10).
  integratedMindMemoryBonus: 1.10,
  // Sprint 7.5.8 §16.6 — Integrated Mind 5-region tier one-per-Run Spark grant.
  integratedMindFullSynergySparks: 5,

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
  starterPackSparkReward: 50, // GDD §26 bundle contents
  starterPackMemoryReward: 5, // GDD §26 bundle contents
  limitedOfferExpiryMs: 172_800_000,

  // ── Runtime scheduler (Sprint 10 Phase 10.4 collapsed legacy "daily login" block —
  // canonical dailyLoginRewards lives in the top constants block alongside push IDs.) ──
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
  // 133 fields after Sprint 10 Phase 10.3 (was 132 post-10.1). The +1 field is
  // `firstEventsFired: string[]` — analytics fire-once tracking for funnel
  // events. PRESERVE on prestige + Transcendence; resets on Hard Reset.
  GAMESTATE_FIELD_COUNT: 133,
} as const;
