// Implements GDD.md §12 (Archetypes). Pure helpers — consume state.archetype,
// return identity (1.0 / 0 add) when archetype === null. Phase 6.2 wires these
// into production / insight / prestige / tap / mutations; offline-efficiency
// and lucid-dream helpers are ready for Sprint 8a offline engine; resonance-
// gain helper is ready for Sprint 8b resonance engine; spontaneous-rate helper
// is consumed by Phase 6.4 spontaneous event engine.

import type { GameState } from '../types/GameState';
import type { ArchetypeDef } from '../types';
import { ARCHETYPES_BY_ID } from '../config/archetypes';
import { SYNAPSE_CONSTANTS } from '../config/constants';

/** Active Archetype definition, or null if not chosen yet. */
export function activeArchetype(state: Pick<GameState, 'archetype'>): ArchetypeDef | null {
  if (state.archetype === null) return null;
  return ARCHETYPES_BY_ID[state.archetype] ?? null;
}

/** P5+ unlock gate per GDD §12 — UI uses this to know when to show the choice modal. */
export function isArchetypeUnlocked(state: Pick<GameState, 'prestigeCount'>): boolean {
  return state.prestigeCount >= SYNAPSE_CONSTANTS.archetypeUnlockPrestige;
}

/** Active production multiplier — Analítica ×1.15 / Empática ×0.85. */
export function archetypeActiveProductionMult(state: Pick<GameState, 'archetype'>): number {
  return activeArchetype(state)?.bonuses.activeProductionMult ?? 1;
}

/** Focus fill rate multiplier — Analítica ×1.25. */
export function archetypeFocusFillRateMult(state: Pick<GameState, 'archetype'>): number {
  return activeArchetype(state)?.bonuses.focusFillRateMult ?? 1;
}

/** Insight duration extra seconds — Analítica +2. Stacks with other adders. */
export function archetypeInsightDurationAddSec(state: Pick<GameState, 'archetype'>): number {
  return activeArchetype(state)?.bonuses.insightDurationAddSec ?? 0;
}

/** Memory generation multiplier — Empática ×1.25. */
export function archetypeMemoryMult(state: Pick<GameState, 'archetype'>): number {
  return activeArchetype(state)?.bonuses.memoryMult ?? 1;
}

/** Mutation options bonus — Creativa +1. Plumb into getMutationOptions ctx. */
export function archetypeMutationBonusOptions(state: Pick<GameState, 'archetype'>): number {
  return activeArchetype(state)?.bonuses.mutationBonusOptions ?? 0;
}

/** Spontaneous event rate multiplier — Creativa ×1.5. Consumed in Phase 6.4. */
export function archetypeSpontaneousRateMult(state: Pick<GameState, 'archetype'>): number {
  return activeArchetype(state)?.bonuses.spontaneousEventRateMult ?? 1;
}

/** Offline efficiency multiplier — Empática ×2.5. Consumed in Sprint 8a offline engine. */
export function archetypeOfflineEfficiencyMult(state: Pick<GameState, 'archetype'>): number {
  return activeArchetype(state)?.bonuses.offlineEfficiencyMult ?? 1;
}

/** Lucid Dream trigger rate override — Empática 1.0 (100%). null = use default (0.33). */
export function archetypeLucidDreamRate(state: Pick<GameState, 'archetype'>): number | null {
  const v = activeArchetype(state)?.bonuses.lucidDreamRate;
  return v ?? null;
}

/** Resonance gain multiplier — Creativa ×1.5. Consumed in Sprint 8b resonance engine. */
export function archetypeResonanceGainMult(state: Pick<GameState, 'archetype'>): number {
  return activeArchetype(state)?.bonuses.resonanceGainMult ?? 1;
}
