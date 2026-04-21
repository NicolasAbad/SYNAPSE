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

export interface Mutation {
  id: string;
  name: string;
  effect: string;
  category: MutationCategory;
  affectsOffline: boolean;
}

export interface PatternNode {
  index: number;
  isDecisionNode: boolean;
  decision?: 'A' | 'B';
  acquiredAt: number;
}

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
