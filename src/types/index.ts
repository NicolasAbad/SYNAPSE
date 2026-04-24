// Implements docs/GDD.md §30 (Type definitions) — v1.0 post-audit

export type NeuronType = 'basica' | 'sensorial' | 'piramidal' | 'espejo' | 'integradora';

export interface NeuronState {
  type: NeuronType;
  count: number;
}

export interface NeuronSnapshot {
  type: NeuronType;
  count: number;
  rate: number;
  timestamp: number;
}

// Sprint 7.5.2 added 'mem' for Hipocampo Memory Shard upgrades (typed-shard
// priced, separate from the legacy 'reg' Memorias-priced region upgrades).
export type UpgradeCategory = 'tap' | 'foc' | 'syn' | 'neu' | 'reg' | 'con' | 'met' | 'new' | 'mem';

export interface UpgradeState {
  id: string;
  purchased: boolean;
  purchasedAt?: number;
}

// Sprint 7.5.2 extended with the 3 typed shard currencies for Hipocampo upgrades.
export type UpgradeCostCurrency = 'thoughts' | 'memorias' | 'emotional_shards' | 'procedural_shards' | 'episodic_shards';

// Kind-tagged discriminated union per Sprint 3 Phase 1 Nico approval:
// one effect per upgrade, compound effects (e.g. Deep Concentration's focus+insight)
// get a dedicated kind. Phase 2 wires each kind into the production/focus/discharge
// stack; Phase 1 ships the data shape only.
export type UpgradeEffect =
  | { kind: 'tap_replace_pct'; pct: number }
  | { kind: 'tap_focus_fill_add'; add: number }
  | { kind: 'tap_bonus_mult'; mult: number }
  | { kind: 'focus_fill_mult'; focusMult: number; insightDurationAddS: number }
  | { kind: 'discharge_max_charges_add'; add: number }
  | { kind: 'discharge_mult'; mult: number }
  | { kind: 'charge_rate_mult'; mult: number }
  | { kind: 'cascade_mult_double' }
  | { kind: 'post_cascade_focus_refund'; amount: number }
  | { kind: 'all_neurons_mult'; mult: number }
  | { kind: 'neuron_type_mult'; neuronType: NeuronType; mult: number }
  | { kind: 'connection_mult_double' }
  | { kind: 'offline_efficiency_mult'; mult: number }
  | { kind: 'best_upgrade_indicator' }
  | { kind: 'upgrade_cost_reduction'; pct: number }
  | { kind: 'region_upgrades_boost'; mult: number }
  | { kind: 'offline_cap_set'; hours: number }
  | { kind: 'consciousness_fill_mult'; mult: number }
  | { kind: 'offline_efficiency_and_autocharge'; mult: number }
  | { kind: 'all_production_mult'; mult: number }
  | { kind: 'upgrades_scaling_mult'; perBucket: number; bucketSize: number; capMult: number }
  | { kind: 'prestige_scaling_mult'; perPrestige: number }
  | { kind: 'lifetime_prestige_add'; perLp: number; capAdd: number }
  | { kind: 'discharge_prestige_bonus'; base: number }
  | { kind: 'post_offline_discharge_bonus'; perHour: number; capAdd: number }
  | { kind: 'pattern_flat_mult'; mult: number }
  | { kind: 'focus_persist'; pct: number }
  // Sprint 7.5.2 — Hipocampo Memory Shard upgrade effects (GDD §16.1). Sprint
  // 7.7 landed shard_proc_mastery alongside the Mastery engine, completing the
  // 8-shard catalog.
  | { kind: 'cascade_spark_bonus'; sparks: number }            // shard_emo_pulse
  | { kind: 'fragment_memory_bonus'; memory: number }          // shard_emo_resonance
  | { kind: 'tap_contribution_pct_add'; pct: number }          // shard_proc_flow
  | { kind: 'charge_interval_mult'; mult: number }             // shard_proc_pattern
  | { kind: 'memory_per_prestige_add'; memory: number }        // shard_epi_imprint
  | { kind: 'rp_spark_bonus'; sparks: number }                 // shard_epi_reflection
  // Sprint 7.5.3 — Límbico Mood upgrade markers (GDD §16.3). Engine reads them
  // by owned-id lookup in src/engine/mood.ts (not by effect.kind branch), so
  // all 6 Límbico + shard_emo_deep share a single payload-less marker kind.
  | { kind: 'mood_passive_marker' }                            // 6 Límbico upgrades + shard_emo_deep
  // Sprint 7.5.3 — shard_emo_deep ships now alongside its Mood consumer.
  | { kind: 'mood_event_scaling'; scale: number }              // shard_emo_deep (deferred from 7.5.2)
  // Sprint 7.7 §38 — Mastery XP gain multiplier (shard_proc_mastery).
  | { kind: 'mastery_xp_gain_mult'; mult: number };            // shard_proc_mastery

export interface UpgradeDef {
  id: string;
  category: UpgradeCategory;
  cost: number;
  costCurrency: UpgradeCostCurrency;
  unlockPrestige: number;
  effect: UpgradeEffect;
}

export type Polarity = 'excitatory' | 'inhibitory';

export type Archetype = 'analitica' | 'empatica' | 'creativa';

export type Pathway = 'rapida' | 'profunda' | 'equilibrada';

export type MutationCategory =
  | 'produccion'
  | 'disparo'
  | 'upgrade'
  | 'restriccion'
  | 'focus'
  | 'regions'
  | 'memorias'
  | 'temporal'
  | 'especial';

// Sprint 5 Phase 5.1 — discriminated union for Mutation effects, parallel
// to UpgradeEffect. One kind per GDD §13 row so each mutation's runtime
// behavior is type-checked at the consumer site (production / discharge /
// cost / focus / etc.) instead of via per-id switch.
//
// Effect values come from `src/config/mutations.ts` (canonical data file
// under the src/config/ Gate-3 exclusion). Strings + tuning live with the
// data, not in constants.ts.
export type MutationEffect =
  | { kind: 'neural_efficiency'; neuronCostMult: number; neuronProdMult: number }
  | { kind: 'hyperstimulation'; prodMult: number; focusFillMult: number }
  | { kind: 'rapid_discharge'; chargeIntervalMin: number; dischargeBonusMult: number }
  | { kind: 'focused_discharge'; dischargeMult: number; maxCharges: number }
  | { kind: 'neuroplasticity'; upgradeCostMult: number; postThresholdEffectMult: number; consciousnessThreshold: number }
  | { kind: 'specialization'; selectedTypeProdMult: number }
  | { kind: 'accelerated_focus'; focusFillMult: number; insightDurationS: number }
  | { kind: 'meditation'; passiveFocusFillRatio: number }
  | { kind: 'dominant_region'; dominantMult: number; otherMult: number }
  | { kind: 'fragile_memory'; memoryGainMult: number; penaltyMemories: number; penaltyThresholdMin: number }
  | { kind: 'sprint'; earlyMult: number; lateMult: number; splitMin: number }
  | { kind: 'crescendo'; startMult: number; endMult: number }
  | { kind: 'synesthesia'; tapsPerMemory: number; tapThoughtMult: number }
  | { kind: 'deja_vu'; upgradeCostMult: number }
  | { kind: 'divided_mind'; insightLevelMult: number; focusBars: number };

export interface Mutation {
  id: string;
  /** i18n key — full path under en.ts: `mutations.${id}.name`. Player-facing. */
  nameKey: string;
  /** i18n key — full path under en.ts: `mutations.${id}.description`. Player-facing. */
  descriptionKey: string;
  category: MutationCategory;
  /** MUT-1: if true, offline calc uses AVERAGE production (not peak). */
  affectsOffline: boolean;
  effect: MutationEffect;
}

// Sprint 5 Phase 5.1 — Pathway data definition. Display name + bonuses live
// in `src/config/pathways.ts`; this is the structural shape only.
export interface PathwayDef {
  id: Pathway;
  /** i18n key — `pathways.${id}.name`. */
  nameKey: string;
  /** i18n key — `pathways.${id}.description`. */
  descriptionKey: string;
  /** Categories whose upgrades are buyable under this Pathway (PATH-1). */
  enables: readonly UpgradeCategory[];
  /** Categories whose upgrades are greyed out (visible but blocked). */
  blocks: readonly UpgradeCategory[];
  /** COST-1 final-cost factor (Equilibrada = 1.0; Rápida/Profunda = 1.0 in v1.0). */
  pathwayCostMod: number;
  /** Optional bonuses applied during cycle. */
  bonuses: {
    insightDurationMult?: number;     // Rápida
    chargeRateMult?: number;          // Rápida
    memoriesPerPrestigeMult?: number; // Profunda
    focusFillRateMult?: number;       // Profunda
    upgradeBonusMult?: number;        // Equilibrada (×0.85 cross-cutting)
  };
}

// Sprint 6 Phase 6.3 — Narrative data definitions (GDD NARRATIVE.md).
// 57 fragments (12 base + 15 × 3 archetypes) + 30 Echoes.
// Text is canonical English (NARRATIVE.md NARR-1 — not localized in v1.0).
// BASE-01..12 mapped by trigger kind; ANA/EMP/CRE fragments use archetype_prestige.
export type FragmentTrigger =
  | { kind: 'first_neuron' }
  | { kind: 'neurons_owned'; count: number }
  | { kind: 'first_discharge' }
  | { kind: 'region_unlock'; regionId: string }
  | { kind: 'prestige_at'; prestigeCount: number }
  | { kind: 'archetype_prestige'; archetype: Archetype; prestigeCount: number };

export interface FragmentDef {
  /** Stable id (e.g. 'base_01', 'ana_05') — written into narrativeFragmentsSeen. */
  id: string;
  trigger: FragmentTrigger;
  /** English narrative text (NARR-1). Rendered by FragmentLayer with fade (NARR-2). */
  text: string;
}

export type EchoCategory = 'gameplay' | 'rp_hint' | 'philosophical' | 'late_game';

export interface EchoDef {
  id: string;
  text: string;
  category: EchoCategory;
  /** Minimum prestigeCount for this echo to be eligible (NARR-3 filter). */
  minPrestige: number;
}

// Sprint 6 Phase 6.1 — Archetype data definition. Display name + bonuses live
// in `src/config/archetypes.ts`; this is the structural shape only. Player
// picks ONE at P5, permanent for the entire Run (cannot change until
// Transcendence). Unlocks 15 archetype-exclusive narrative fragments.
export interface ArchetypeDef {
  id: Archetype;
  /** i18n key — `archetypes.${id}.name`. */
  nameKey: string;
  /** i18n key — `archetypes.${id}.description`. */
  descriptionKey: string;
  /** Optional bonuses applied for the entire Run once chosen. */
  bonuses: {
    activeProductionMult?: number; // Analítica ×1.15 / Empática ×0.85
    focusFillRateMult?: number; // Analítica ×1.25
    insightDurationAddSec?: number; // Analítica +2s
    offlineEfficiencyMult?: number; // Empática ×2.5
    lucidDreamRate?: number; // Empática 1.0 (vs 0.33 default)
    memoryMult?: number; // Empática ×1.25
    mutationBonusOptions?: number; // Creativa +1 (mirrors SYNAPSE_CONSTANTS.creativaMutationBonusOptions)
    resonanceGainMult?: number; // Creativa ×1.5
    spontaneousEventRateMult?: number; // Creativa ×1.5
  };
}

// Sprint 5 Phase 5.1 — Region data definition. 5 entries in
// `src/config/regions.ts`. UpgradeIds reference entries in upgrades.ts.
export type RegionId = 'hipocampo' | 'prefrontal' | 'limbico' | 'visual' | 'broca';

export interface RegionDef {
  id: RegionId;
  /** i18n key — `regions.${id}.name`. */
  nameKey: string;
  /** Prestige level at which the region itself becomes visible (0 for starters, 14 for Broca). */
  unlockPrestige: number;
  /** IDs from upgrades.ts that belong in this region's panel. */
  upgradeIds: readonly string[];
}

export interface PatternNode {
  index: number;
  isDecisionNode: boolean;
  decision?: 'A' | 'B';
  acquiredAt: number;
}

// Sprint 8b Phase 8b.4 — Resonance upgrade effects (GDD §15). Kind discriminants
// intentionally distinct from UpgradeEffect / PatternDecisionEffect so engine
// consumers can branch cleanly ("effect from upgrade" vs "effect from Resonance
// upgrade" vs "effect from pattern decision"). 13 upgrades, 13 effect kinds.
//
// Per Sprint 8b catalog V5: the 7 "easy" kinds wire directly into existing
// engine modules (production / discharge / patterns / focus / offline). The 6
// "complex" kinds (dream_mult, crossrun_memory, fragment_reread, memory_carryover,
// spontaneous_frequency, modo_ascension, dual_archetype) are declared here but
// consumer wiring is partial/stubbed in Sprint 8b — full behavior lands when
// the underlying system needs the feature (most are marked for v1.1 polish).
export type ResonanceUpgradeEffect =
  | { kind: 'all_production_mult_per_resonance_upgrade'; per: number }    // eco_neural
  | { kind: 'pattern_cycle_cap_set'; cap: number }                        // patron_estable
  | { kind: 'cascade_mult_set'; mult: number }                            // cascada_eterna
  | { kind: 'inner_voice_dream_mult'; mult: number }                      // deep_listening
  | { kind: 'crossrun_fragment_memory_bonus'; memory: number }            // deep_listening side
  | { kind: 'fragment_reread_memory_bonus'; memory: number }              // cosmic_voice
  | { kind: 'focus_fill_rate_mult'; mult: number }                        // mente_despierta
  | { kind: 'memory_carryover_cap'; cap: number }                         // memoria_longeva
  | { kind: 'spontaneous_frequency_mult'; mult: number }                  // eureka_frecuente
  | { kind: 'offline_cap_add_hours'; hours: number }                      // time_dilation
  | { kind: 'patterns_per_prestige_mult'; mult: number }                  // meta_consciousness
  | { kind: 'resonance_earn_mult'; mult: number }                         // resonancia_profunda
  | { kind: 'unlocks_modo_ascension' }                                    // consciencia_eterna
  | { kind: 'unlocks_dual_archetype' };                                   // eternal_witness

export interface ResonanceUpgradeDef {
  readonly id: string;
  readonly tier: 1 | 2 | 3;
  readonly costResonance: number;
  readonly effect: ResonanceUpgradeEffect;
}

// Pattern Tree decision-option effects (GDD §10). Kind discriminants are
// intentionally distinct from UpgradeEffect's so consumers can cleanly tell
// "effect from upgrade" vs "effect from pattern decision". Sprint 4b Phase 4b.1.
export type PatternDecisionEffect =
  | { kind: 'cycle_bonus_add'; add: number }
  | { kind: 'discharge_charges_plus_one' }
  | { kind: 'offline_efficiency_mult'; mult: number }
  | { kind: 'focus_fill_rate_mult'; mult: number }
  | { kind: 'insight_duration_add_s'; add: number }
  | { kind: 'memories_per_prestige_add'; add: number }
  | { kind: 'cascade_threshold_set'; threshold: number }
  | { kind: 'discharge_damage_mult'; mult: number }
  | { kind: 'region_mult'; mult: number }
  | { kind: 'mutation_options_add'; add: number };

export interface WeeklyChallengeState {
  id: string;
  weekStartTimestamp: number;
  progress: number;
  target: number;
  rewardClaimed: boolean;
}

export interface AwakeningEntry {
  prestigeCount: number;
  timestamp: number;
  cycleDurationMs: number;
  endProduction: number;
  polarity: Polarity | null;
  mutationId: string | null;
  pathway: Pathway | null;
  patternsGained: number;
  memoriesGained: number;
  wasPersonalBest: boolean;
}

export type SpontaneousEventType = 'positive' | 'neutral' | 'negative';

export interface SpontaneousEventActive {
  id: string;
  type: SpontaneousEventType;
  endTime: number;
}

// Sprint 6 Phase 6.4 — 12 Spontaneous event effects per GDD §8.
// Discriminated union: consumers branch on `kind` to read the right fields.
// Instant effects apply at activation time; timed effects persist until
// `activeSpontaneousEvent.endTime` is exceeded. Eureka is an exception —
// persists until next upgrade buy (no time limit), tracked via `eurekaExpiry`.
export type SpontaneousEffect =
  | { kind: 'free_next_upgrade' }
  | { kind: 'production_mult'; mult: number; durationMs: number }
  | { kind: 'focus_fill_mult'; mult: number; durationMs: number }
  | { kind: 'connection_mult'; mult: number; durationMs: number }
  | { kind: 'discharge_charge_add'; add: number }
  | { kind: 'memory_add'; add: number }
  | { kind: 'polarity_reverse'; durationMs: number }
  | { kind: 'mutation_stack_random'; durationMs: number }
  | { kind: 'extra_fragment' }
  | { kind: 'production_and_focus_mult'; prodMult: number; focusMult: number; durationMs: number }
  | { kind: 'focus_reset' };

export interface SpontaneousDef {
  id: string;
  nameKey: string;
  descriptionKey: string;
  type: SpontaneousEventType;
  effect: SpontaneousEffect;
}

// Sprint 6 Phase 6.5 — Era 3 events (P19-P26) per GDD §23 + NARRATIVE.md §7.
// Each event has narrative copy (intro) and mechanical copy (what changes),
// both resolved via i18n. Mechanical effects are driven by
// engine/era3.ts helpers keyed on prestigeCount.
export interface Era3EventDef {
  id: string; // e.g. 'era3_p19' — used as narrativeFragmentsSeen key (Memory grant suppressed).
  prestigeCount: number;
  nameKey: string;
  narrativeKey: string;
  mechanicalKey: string;
}

export interface MutationActive {
  id: string;
  stackedRandomId?: string;
  stackedExpiry?: number;
}

/**
 * Offline summary persisted to `GameState.pendingOfflineSummary` — Sleep screen
 * + Welcome-back modal + Lucid Dream choice read this. Sprint 7.10 Phase 7.10.4.
 * Engine producer: src/engine/offline.ts applyOfflineProgress.
 */
export interface OfflineSummary {
  readonly elapsedMs: number;
  readonly gained: number;
  readonly efficiency: number;
  readonly avgMood: number;
  readonly avgMoodTier: number;
  readonly capHours: number;
  readonly cappedHit: boolean;
  readonly timeAnomaly: 'backward' | 'over_cap' | null;
  readonly enhancedDischargeAvailable: boolean;
  readonly lucidDreamTriggered: boolean;
}

export interface MicroChallenge {
  id: string;
  startTime: number;
  timeLimit: number;
}

export interface LimitedOffer {
  id: string;
  expiresAt: number;
}

export type DiaryEntryType =
  | 'prestige'
  | 'resonant_pattern'
  | 'personal_best'
  | 'ending'
  | 'fragment'
  | 'achievement'
  | 'spontaneous'
  | 'precommit'; // Sprint 7.5.4 §16.2 PRECOMMIT-4 — pre-commit wager + outcome history.
                 // data shape: { goalId, wager, outcome: 'success'|'fail'|'cancel', sparksAwarded?, memoryDelta? }

export interface DiaryEntry {
  timestamp: number;
  type: DiaryEntryType;
  data: Record<string, unknown>;
}

// v1.0 ships 4 endings. 'resonance' (Observer) is v1.5+ — widening the union is forward-compatible.
export type EndingID = 'equation' | 'chorus' | 'seed' | 'singularity';

// === Achievements (Sprint 7 §24.5 + Sprint 6.8 +5 region cat) ===
// Categories per GDD §24.5: 6 cyc + 6 meta + 6 nar + 6 hid + 6 mas + 5 reg = 35 total.
export type AchievementCategory = 'cyc' | 'meta' | 'nar' | 'hid' | 'mas' | 'reg';

import type { GameState as _GS } from './GameState';
/**
 * AchievementDef — canonical Achievement record per GDD §24.5.
 * `trigger` is a pure function of GameState (CODE-9 deterministic). Region-category
 * triggers ship STUBBED to false in Sprint 7.1; Sprint 7.5 wires real conditions
 * once the Region sub-systems exist.
 */
export interface AchievementDef {
  id: string; // matches /^(cyc|meta|nar|hid|mas|reg)_[a-z_0-9]+$/
  category: AchievementCategory;
  nameKey: string;
  descriptionKey: string;
  reward: number; // Sparks
  isHidden: boolean; // Sprint 7 ACH-2 — Hidden displays as ??? until unlocked
  trigger: (state: _GS) => boolean;
}

/** Result of checkAllAchievements — IDs newly unlocked this tick. */
export interface AchievementCheckResult {
  newlyUnlocked: string[];
  // Caller (store) handles: append IDs to achievementsUnlocked, sparks += sum(rewards),
  // toast for each, append diary entry per ACH-3.
}

export type EraVisualTheme = 'bioluminescent' | 'digital' | 'cosmic';
