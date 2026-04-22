// Implements GDD.md §23 Era 3 events + ERA3-1/2/3 rules + NARRATIVE.md §7.
// Pure helpers keyed on state.prestigeCount. Effects apply for the cycle
// where the player's prestigeCount matches (19..26). UI (Era3EventModal)
// is gated on `hasUnseenEra3Event(state)` and clears by marking the id in
// narrativeFragmentsSeen (Phase 6.3 infrastructure; era3_* ids don't grant
// a Memory per applyFragmentRead).
//
// ERA3-3 priority: Era 3 event > Mutation > upgrades. Callers that multiply
// values should apply Era 3 overrides LAST (e.g. production mult, neuron
// cost mult) so they win conflicts.

import type { GameState } from '../types/GameState';
import type { Era3EventDef } from '../types';
import { ERA3_BY_PRESTIGE, ERA3_EVENTS } from '../config/era3Events';

// ── Structural tuning values (GDD §23 table). Inline here because they're ──
// ── per-event and only read by this single module. ──────────────────────

const ERA3_P19_MUTATION_BONUS_OPTIONS = 2; // CONST-OK (§23 "5 options vs 3")
const ERA3_P21_POLARITY_STRENGTH_MULT = 2.0; // CONST-OK (§23 "×2 strength")
const ERA3_P22_PRODUCTION_MULT = 0.8; // CONST-OK (§23 "-20%")
const ERA3_P22_RESONANCE_GAIN_MULT = 3.0; // CONST-OK (§23 "×3")
const ERA3_P23_OFFLINE_MULT = 3.0; // CONST-OK (§23, Sprint 8a consumer)
const ERA3_P24_MAX_MINUTES = 45; // CONST-OK (§23 "45 min elapsed")
const ERA3_P25_NEURON_COST_MULT = 0.5; // CONST-OK (§23 "×0.5")
const ERA3_P25_DISCHARGE_MULT = 5.0; // CONST-OK (§23 "×5 vs 1.5 base")

/** Get the Era 3 event def for the player's current prestigeCount, or null. */
export function getCurrentEra3Event(state: Pick<GameState, 'prestigeCount'>): Era3EventDef | null {
  return ERA3_BY_PRESTIGE[state.prestigeCount] ?? null;
}

/** Has the Era 3 event for the current prestige been acknowledged yet? */
export function hasUnseenEra3Event(state: Pick<GameState, 'prestigeCount' | 'narrativeFragmentsSeen'>): boolean {
  const def = getCurrentEra3Event(state);
  if (!def) return false;
  return !state.narrativeFragmentsSeen.includes(def.id);
}

/** List of all 8 events (for tests + content audits). */
export function getAllEra3Events(): readonly Era3EventDef[] {
  return ERA3_EVENTS;
}

// ── Effect accessors — identity when Era 3 event doesn't apply ──────────

/** P19 First Fracture — Mutations offer +N extra options. */
export function era3MutationBonusOptions(state: Pick<GameState, 'prestigeCount'>): number {
  return state.prestigeCount === 19 ? ERA3_P19_MUTATION_BONUS_OPTIONS : 0; // CONST-OK (§23 P19)
}

/** P21 Mirror Cycle — Polarity strength multiplied. */
export function era3PolarityStrengthMult(state: Pick<GameState, 'prestigeCount'>): number {
  return state.prestigeCount === 21 ? ERA3_P21_POLARITY_STRENGTH_MULT : 1; // CONST-OK (§23 P21)
}

/** P22 Silent Resonance — production ×0.8 (tradeoff). */
export function era3ProductionMult(state: Pick<GameState, 'prestigeCount'>): number {
  return state.prestigeCount === 22 ? ERA3_P22_PRODUCTION_MULT : 1; // CONST-OK (§23 P22)
}

/** P22 Silent Resonance — Resonance gain ×3. Consumed by Sprint 8b resonance engine. */
export function era3ResonanceGainMult(state: Pick<GameState, 'prestigeCount'>): number {
  return state.prestigeCount === 22 ? ERA3_P22_RESONANCE_GAIN_MULT : 1; // CONST-OK (§23 P22)
}

/** P23 Dreamer's Dream — Offline ×3. Consumed by Sprint 8a offline engine. */
export function era3OfflineMult(state: Pick<GameState, 'prestigeCount'>): number {
  return state.prestigeCount === 23 ? ERA3_P23_OFFLINE_MULT : 1; // CONST-OK (§23 P23)
}

/** P23 Dreamer's Dream — active play doesn't fill Focus (focusFillRate ×0). */
export function era3FocusFillBlocked(state: Pick<GameState, 'prestigeCount'>): boolean {
  return state.prestigeCount === 23; // CONST-OK (§23 P23)
}

/** P24 Long Thought — auto-prestige at MIN(threshold reached, 45 min elapsed). */
export function era3AutoPrestigeAt45MinElapsed(state: Pick<GameState, 'prestigeCount' | 'cycleStartTimestamp'>, nowTimestamp: number): boolean {
  if (state.prestigeCount !== 24) return false; // CONST-OK (§23 P24)
  const cycleMinutes = (nowTimestamp - state.cycleStartTimestamp) / 60_000; // CONST-OK (ms→min)
  return cycleMinutes >= ERA3_P24_MAX_MINUTES;
}

/** P25 Final Awakening — neuron cost ×0.5. Consumed in purchases.canBuyNeuron. */
export function era3NeuronCostMult(state: Pick<GameState, 'prestigeCount'>): number {
  return state.prestigeCount === 25 ? ERA3_P25_NEURON_COST_MULT : 1; // CONST-OK (§23 P25)
}

/** P25 Final Awakening — Discharge ×5. Overrides base discharge mult. */
export function era3DischargeMultOverride(state: Pick<GameState, 'prestigeCount'>): number | null {
  return state.prestigeCount === 25 ? ERA3_P25_DISCHARGE_MULT : null; // CONST-OK (§23 P25)
}

/** P26 Last Choice — ending screen shown. No subsequent cycle advances. */
export function era3IsLastChoice(state: Pick<GameState, 'prestigeCount'>): boolean {
  return state.prestigeCount === 26; // CONST-OK (§23 P26)
}
