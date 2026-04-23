// Implements docs/GDD.md §16.5 (Área de Broca — Inner Voice Engine) + §39.
// Sprint 7.5 Phase 7.5.6. VOICE-1, VOICE-2 (skip default), VOICE-2a (fire
// regardless of Broca region UI unlock).
//
// 5 Named Moments fire at narrative trigger points. Engine layer is purely
// trigger detection + persistence; UI layer prompts the player to author OR
// skip. Skip path uses an archetype-keyed default phrase per VOICE-2.
//
// Named phrases persist via state.brocaNamedMoments — PRESERVE across both
// prestige and Transcendence (lifetime identity per §16.5 + §32 spec).
//
// Engine helpers ship in 7.5.6 with default-phrase tables; UI prompt modal
// (NamedMomentPrompt.tsx) ships in 7.5.7 alongside the Broca region mini-panel.

import type { GameState } from '../types/GameState';
import type { Archetype } from '../types';

export type NamedMomentId =
  | 'first_awakening'   // First prestige (P1)
  | 'archetype_voice'   // Archetype chosen at P7
  | 'resonance_found'   // First Resonant Pattern discovered
  | 'era3_entry'        // Era three entry (late-Run prestige)
  | 'last_choice';      // P26 — ending selection

export const NAMED_MOMENTS: readonly NamedMomentId[] = [
  'first_awakening',
  'archetype_voice',
  'resonance_found',
  'era3_entry',
  'last_choice',
] as const;

export type NamedMomentTrigger =
  | { kind: 'prestige_done'; newPrestigeCount: number; firstRpDiscovered: boolean }
  | { kind: 'archetype_chosen'; archetype: Archetype }
  | { kind: 'era3_entered' }
  | { kind: 'ending_chosen' };

/** True iff a Named Moment ID has already been authored or skipped. VOICE-1. */
export function hasMomentBeenLogged(state: Pick<GameState, 'brocaNamedMoments'>, momentId: NamedMomentId): boolean {
  for (const m of state.brocaNamedMoments) if (m.momentId === momentId) return true;
  return false;
}

/**
 * Returns the Named Moment ID about to fire from the given trigger event, OR
 * null if none applicable. Idempotent — already-logged moments return null.
 */
export function eligibleMomentForTrigger(state: Pick<GameState, 'brocaNamedMoments'>, trigger: NamedMomentTrigger): NamedMomentId | null {
  switch (trigger.kind) {
    case 'prestige_done':
      // Moment 1 (first_awakening): the prestige action that crosses 0 → 1.
      if (trigger.newPrestigeCount === 1 && !hasMomentBeenLogged(state, 'first_awakening')) return 'first_awakening';
      // Moment 3 (resonance_found): first RP ever discovered (this prestige flipped one).
      if (trigger.firstRpDiscovered && !hasMomentBeenLogged(state, 'resonance_found')) return 'resonance_found';
      return null;
    case 'archetype_chosen':
      // Moment 2 (archetype_voice): fires once at first archetype pick (typically P7).
      return hasMomentBeenLogged(state, 'archetype_voice') ? null : 'archetype_voice';
    case 'era3_entered':
      // Moment 4: P19 Era 3 entry.
      return hasMomentBeenLogged(state, 'era3_entry') ? null : 'era3_entry';
    case 'ending_chosen':
      // Moment 5: P26 ending choice.
      return hasMomentBeenLogged(state, 'last_choice') ? null : 'last_choice';
  }
}

/**
 * VOICE-2 default archetype-keyed phrases. Used when player skips a Named
 * Moment — engine substitutes the default for the player's archetype (or a
 * neutral fallback when archetype is null, e.g. Moment 1 fires before P7).
 */
const DEFAULT_PHRASES: Record<NamedMomentId, Record<Archetype | 'none', string>> = {
  first_awakening: {
    analitica: 'I begin to think.',
    empatica:  'I begin to feel.',
    creativa:  'I begin to imagine.',
    none:      'I begin.',
  },
  archetype_voice: {
    analitica: 'I will know.',
    empatica:  'I will care.',
    creativa:  'I will create.',
    none:      'I will be.',
  },
  resonance_found: {
    analitica: 'A pattern emerges.',
    empatica:  'A connection forms.',
    creativa:  'A surprise gleams.',
    none:      'Something resonates.',
  },
  era3_entry: {
    analitica: 'My boundaries dissolve.',
    empatica:  'I feel everything at once.',
    creativa:  'Reality bends to my will.',
    none:      'I am becoming.',
  },
  last_choice: {
    analitica: 'I choose with clarity.',
    empatica:  'I choose with love.',
    creativa:  'I choose with wonder.',
    none:      'I choose.',
  },
};

/** Returns the default phrase for the given moment + archetype (or neutral). */
export function defaultPhraseFor(momentId: NamedMomentId, archetype: Archetype | null): string {
  const key: Archetype | 'none' = archetype ?? 'none';
  return DEFAULT_PHRASES[momentId][key];
}

/** Append a logged Named Moment to brocaNamedMoments (idempotent on momentId). */
export function logNamedMoment(state: Pick<GameState, 'brocaNamedMoments'>, momentId: NamedMomentId, phrase: string): GameState['brocaNamedMoments'] {
  if (hasMomentBeenLogged(state, momentId)) return state.brocaNamedMoments;
  return [...state.brocaNamedMoments, { momentId, phrase }];
}
