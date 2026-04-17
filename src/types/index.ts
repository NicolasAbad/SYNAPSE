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
