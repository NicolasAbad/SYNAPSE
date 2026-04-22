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

export type UpgradeCategory = 'tap' | 'foc' | 'syn' | 'neu' | 'reg' | 'con' | 'met' | 'new';

export interface UpgradeState {
  id: string;
  purchased: boolean;
  purchasedAt?: number;
}

export type UpgradeCostCurrency = 'thoughts' | 'memorias';

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
  | { kind: 'basica_mult_and_memory_gain'; basicaMult: number; memoryGainAdd: number }
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
  | { kind: 'focus_persist'; pct: number };

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

export interface MutationActive {
  id: string;
  stackedRandomId?: string;
  stackedExpiry?: number;
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
  | 'achievement';

export interface DiaryEntry {
  timestamp: number;
  type: DiaryEntryType;
  data: Record<string, unknown>;
}

// v1.0 ships 4 endings. 'resonance' (Observer) is v1.5+ — widening the union is forward-compatible.
export type EndingID = 'equation' | 'chorus' | 'seed' | 'singularity';

export type EraVisualTheme = 'bioluminescent' | 'digital' | 'cosmic';
