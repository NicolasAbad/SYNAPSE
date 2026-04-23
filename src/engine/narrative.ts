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
import { fragmentMemoryBonus, emoShardsOnFragmentRead } from './shards';
import { applyMoodEvent } from './mood';
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
      // BASE-01 fires on the player's first *purchased* neuron (the bootstrap
      // basica present at cycle start doesn't count — cycleNeuronsBought is
      // the buy counter). NARR-4 filter blocks subsequent cycles' first-buys
      // via narrativeFragmentsSeen membership.
      return event.kind === 'neuron_bought' && state.cycleNeuronsBought === 1;
    case 'neurons_owned':
      // BASE-02 "5 neurons owned" — total count across any types (bootstrap
      // included). NARRATIVE.md ambiguous count-vs-types; total-count chosen
      // per Sprint 6 pre-code research.
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
 *
 * Sprint 7.5: also pushes 'fragment' diary entry on first-read (excluded for
 * era3_* system events to keep the Diary focused on player-narrative beats).
 */
export function applyFragmentRead(state: GameState, id: string, nowTimestamp = 0): Partial<GameState> {
  if (state.narrativeFragmentsSeen.includes(id)) return {};
  const seen = [...state.narrativeFragmentsSeen, id];
  if (id.startsWith('era3_')) return { narrativeFragmentsSeen: seen };
  // 500-entry diary cap (Sprint 7.5 per achievement processor pattern).
  const diary = [...state.diaryEntries, { timestamp: nowTimestamp, type: 'fragment' as const, data: { fragmentId: id } }];
  const trimmed = diary.length > 500 ? diary.slice(diary.length - 500) : diary; // CONST-OK: nar_diary_50 + Sprint 7.5 cap
  // Sprint 7.5.2 §16.1: +1 base Memory + (shard_emo_resonance ? +2 : 0) Memory bonus.
  // Also +N Emo shard burst + Sprint 7.5.3 §16.3 MOOD-2 Mood +3 (fragment_read).
  const memoryBonus = fragmentMemoryBonus(state);
  const emoBurst = emoShardsOnFragmentRead();
  const moodUpdate = applyMoodEvent(state, 'fragment_read', nowTimestamp);
  return {
    narrativeFragmentsSeen: seen,
    memories: state.memories + 1 + memoryBonus,
    diaryEntries: trimmed,
    memoryShards: {
      emotional: state.memoryShards.emotional + emoBurst,
      procedural: state.memoryShards.procedural,
      episodic: state.memoryShards.episodic,
    },
    mood: moodUpdate.mood,
    moodHistory: moodUpdate.moodHistory,
  };
}

/** Lookup helper — UI renderer needs full def (text) after receiving an id. */
export function getFragment(id: string): FragmentDef | null {
  return FRAGMENTS_BY_ID[id] ?? null;
}

/**
 * One-shot dispatcher called from store actions (buyNeuron, discharge,
 * prestige, setArchetype, checkRegionUnlock). Fires any matching fragment
 * triggers + applies the first-read effects atomically. Returns the merged
 * Partial<GameState> the caller should spread into its set() call.
 */
export function dispatchNarrative(state: GameState, event: FragmentEvent, nowTimestamp = 0): Partial<GameState> {
  const fired = checkFragmentTriggers(state, event);
  if (fired.length === 0) return {};
  let updates: Partial<GameState> = {};
  let working = state;
  for (const id of fired) {
    const read = applyFragmentRead(working, id, nowTimestamp);
    updates = { ...updates, ...read };
    working = { ...working, ...read };
  }
  return updates;
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
