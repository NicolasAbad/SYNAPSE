// Implements GDD.md §12 (Archetypes) + §38 (Mastery multiplicative stacking).
// Pure helpers — consume state.archetype, return identity (1.0 / 0 add) when
// archetype === null. Phase 6.2 wires these into production / insight /
// prestige / tap / mutations; offline-efficiency and lucid-dream helpers are
// ready for Sprint 8a offline engine; resonance-gain helper is ready for
// Sprint 8b resonance engine; spontaneous-rate helper is consumed by Phase
// 6.4 spontaneous event engine.
//
// Sprint 7.7 §38 MASTERY-2: Mastery stacks multiplicatively on the 6
// multiplicative bonuses only (active production / focus fill / memory /
// spontaneous rate / offline efficiency / resonance gain). Additive bonuses
// (insightDurationAddSec, mutationBonusOptions) and override values
// (lucidDreamRate) do NOT receive Mastery — additive mastery on +2s is
// ambiguous spec, and lucidDreamRate is a [0,1] probability that would
// overflow. Documented exclusion matches GDD §38.2 "multiplies archetype bonus"
// phrasing.

import type { GameState } from '../types/GameState';
import type { ArchetypeDef } from '../types';
import { ARCHETYPES_BY_ID } from '../config/archetypes';
import { SYNAPSE_CONSTANTS } from '../config/constants';
import { masteryBonus } from './mastery';

/**
 * Internal helper: returns `(1 + masteryBonus)` for the active archetype id,
 * or 1 when no archetype is chosen. Multiplicative-stacking guarantee.
 */
function archetypeMasteryMult(state: Pick<GameState, 'archetype' | 'mastery'>): number {
  if (state.archetype === null) return 1;
  return 1 + masteryBonus(state, state.archetype);
}

/** Active Archetype definition, or null if not chosen yet. */
export function activeArchetype(state: Pick<GameState, 'archetype'>): ArchetypeDef | null {
  if (state.archetype === null) return null;
  return ARCHETYPES_BY_ID[state.archetype] ?? null;
}

/** P5+ unlock gate per GDD §12 — UI uses this to know when to show the choice modal. */
export function isArchetypeUnlocked(state: Pick<GameState, 'prestigeCount'>): boolean {
  return state.prestigeCount >= SYNAPSE_CONSTANTS.archetypeUnlockPrestige;
}

/** Active production multiplier — Analítica ×1.15 / Empática ×0.85. Mastery stacks. */
export function archetypeActiveProductionMult(state: Pick<GameState, 'archetype' | 'mastery'>): number {
  const base = activeArchetype(state)?.bonuses.activeProductionMult ?? 1;
  return base * archetypeMasteryMult(state);
}

/** Focus fill rate multiplier — Analítica ×1.25. Mastery stacks. */
export function archetypeFocusFillRateMult(state: Pick<GameState, 'archetype' | 'mastery'>): number {
  const base = activeArchetype(state)?.bonuses.focusFillRateMult ?? 1;
  return base * archetypeMasteryMult(state);
}

/** Insight duration extra seconds — Analítica +2. Additive; no Mastery per §38 exclusion. */
export function archetypeInsightDurationAddSec(state: Pick<GameState, 'archetype'>): number {
  return activeArchetype(state)?.bonuses.insightDurationAddSec ?? 0;
}

/** Memory generation multiplier — Empática ×1.25. Mastery stacks. */
export function archetypeMemoryMult(state: Pick<GameState, 'archetype' | 'mastery'>): number {
  const base = activeArchetype(state)?.bonuses.memoryMult ?? 1;
  return base * archetypeMasteryMult(state);
}

/** Mutation options bonus — Creativa +1. Additive; no Mastery per §38 exclusion. */
export function archetypeMutationBonusOptions(state: Pick<GameState, 'archetype'>): number {
  return activeArchetype(state)?.bonuses.mutationBonusOptions ?? 0;
}

/** Spontaneous event rate multiplier — Creativa ×1.5. Mastery stacks. */
export function archetypeSpontaneousRateMult(state: Pick<GameState, 'archetype' | 'mastery'>): number {
  const base = activeArchetype(state)?.bonuses.spontaneousEventRateMult ?? 1;
  return base * archetypeMasteryMult(state);
}

/** Offline efficiency multiplier — Empática ×2.5. Mastery stacks. */
export function archetypeOfflineEfficiencyMult(state: Pick<GameState, 'archetype' | 'mastery'>): number {
  const base = activeArchetype(state)?.bonuses.offlineEfficiencyMult ?? 1;
  return base * archetypeMasteryMult(state);
}

/** Lucid Dream trigger rate override — Empática 1.0 (100%). null = use default (0.33). Probability override; no Mastery. */
export function archetypeLucidDreamRate(state: Pick<GameState, 'archetype'>): number | null {
  const v = activeArchetype(state)?.bonuses.lucidDreamRate;
  return v ?? null;
}

/** Resonance gain multiplier — Creativa ×1.5. Mastery stacks. */
export function archetypeResonanceGainMult(state: Pick<GameState, 'archetype' | 'mastery'>): number {
  const base = activeArchetype(state)?.bonuses.resonanceGainMult ?? 1;
  return base * archetypeMasteryMult(state);
}
