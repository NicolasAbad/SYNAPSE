// Implements docs/NARRATIVE.md §1-5 + §9 NARR rules and GDD.md §3 Memory table
// (NARR-8 first-read grant). Pure trigger checking + first-read semantics +
// Echo picker.
//
// NARR-4: fragments fire ONCE per playthrough. `narrativeFragmentsSeen`
// tracks fired IDs. On Transcendence (Sprint 8b) archetype fragments reset;
// base fragments do NOT. Era 3 event "fragments" (Phase 6.5, id prefix
// `era3_`) are tracked in the same array but DO NOT grant the NARR-8
// first-read Memory because they are system events, not narrative fragments.
//
// Sprint 6 Phase 6.3a — data + trigger engine. UI canvas layer + store
// integration land in Phase 6.3b.

import { FRAGMENTS, FRAGMENTS_BY_ID } from '../config/narrative/fragments';
import { ECHOES } from '../config/narrative/echoes';
import { mulberry32 } from './rng';
import type { GameState } from '../types/GameState';
import type { FragmentDef, EchoDef } from '../types';

/** Events that may trigger narrative fragments. See matchesTrigger below. */
export type FragmentEvent =
  | { kind: 'neuron_bought' }
  | { kind: 'discharge_fired' }
  | { kind: 'region_unlocked'; regionId: string }
  | { kind: 'prestige_done' }
  | { kind: 'archetype_chosen' };

function totalNeurons(state: Pick<GameState, 'neurons'>): number {
  let total = 0;
  for (const n of state.neurons) total += n.count;
  return total;
}

function matchesTrigger(def: FragmentDef, state: GameState, event: FragmentEvent): boolean {
  const tr = def.trigger;
  switch (tr.kind) {
    case 'first_neuron':
      // BASE-01 fires on the transition 0→1 total neurons.
      return event.kind === 'neuron_bought' && totalNeurons(state) === 1;
    case 'neurons_owned':
      // BASE-02 "5 neurons owned" — total count across any types.
      // NARRATIVE.md is ambiguous on count-vs-types; total-count chosen per
      // Sprint 6 pre-code research for simpler player progression.
      return event.kind === 'neuron_bought' && totalNeurons(state) >= tr.count;
    case 'first_discharge':
      // BASE-03 fires on lifetime discharge #1 (lifetimeDischarges increments
      // inside performDischarge BEFORE this event is dispatched).
      return event.kind === 'discharge_fired' && state.lifetimeDischarges === 1;
    case 'region_unlock':
      return event.kind === 'region_unlocked' && event.regionId === tr.regionId;
    case 'prestige_at':
      return event.kind === 'prestige_done' && state.prestigeCount === tr.prestigeCount;
    case 'archetype_prestige':
      // Fires at P5 first-pick via archetype_chosen, OR at later prestige_done
      // when archetype is already set and prestigeCount matches the ladder.
      if (state.archetype !== tr.archetype) return false;
      if (state.prestigeCount !== tr.prestigeCount) return false;
      return event.kind === 'prestige_done' || event.kind === 'archetype_chosen';
  }
}

/**
 * Pure trigger check: returns fragment IDs eligible to fire for this event,
 * filtered by `narrativeFragmentsSeen` (NARR-4 — once per playthrough).
 * Caller (UI layer) queues results and dispatches `readFragment(id)` action
 * after rendering each one.
 */
export function checkFragmentTriggers(state: GameState, event: FragmentEvent): string[] {
  const seen = new Set(state.narrativeFragmentsSeen);
  const fired: string[] = [];
  for (const def of FRAGMENTS) {
    if (seen.has(def.id)) continue;
    if (matchesTrigger(def, state, event)) fired.push(def.id);
  }
  return fired;
}

/**
 * First-read effect per NARR-8: appends to `narrativeFragmentsSeen` and
 * grants +1 Memory (GDD §3 Memory table). No-op if already seen. Era 3
 * event IDs (`era3_*`) persist to the array but do NOT grant Memory.
 */
export function applyFragmentRead(state: GameState, id: string): Partial<GameState> {
  if (state.narrativeFragmentsSeen.includes(id)) return {};
  const seen = [...state.narrativeFragmentsSeen, id];
  if (id.startsWith('era3_')) return { narrativeFragmentsSeen: seen };
  return {
    narrativeFragmentsSeen: seen,
    memories: state.memories + 1,
  };
}

/** Lookup helper — UI renderer needs full def (text) after receiving an id. */
export function getFragment(id: string): FragmentDef | null {
  return FRAGMENTS_BY_ID[id] ?? null;
}

/**
 * Pick a random Echo eligible at current prestigeCount. Deterministic
 * given (prestigeCount, seed). Returns null if no Echo eligible (P0).
 * NARR-3 cooldown (max 1 per 90s) is enforced by the UI layer via React
 * ref — the engine just filters and picks.
 */
export function pickEcho(prestigeCount: number, seed: number): EchoDef | null {
  const pool = ECHOES.filter((e) => e.minPrestige <= prestigeCount);
  if (pool.length === 0) return null;
  const rng = mulberry32(seed);
  return pool[Math.floor(rng() * pool.length)];
}
