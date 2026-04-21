// Implements GDD.md §10 Pattern decision effect appliers — Sprint 4b Phase 4b.3.
// Bridge between `PATTERN_DECISIONS` (data, src/config/patterns.ts) and the
// consumer sites that actually read the effects. Pure helpers; each one
// returns either a multiplier/add/threshold value, or — for the one
// state-mutating decision (6B) — a Partial<GameState> the caller merges.
//
// INT-5 note (Node 36 Option B post-P13 Resonance-on-Discharge): the
// Resonance side effect is gated behind `prestigeCount >= 13` and is wired
// in Sprint 8b when the Resonance currency exists. Phase 4b.3 ships only
// the +10 % discharge damage half.
//
// Stubs remaining for future sprints:
//   Node 15 A offline_efficiency_mult — Sprint 8a owns offline engine
//   Node 48 A region_mult             — Sprint 5 owns region production wiring
//   Node 48 B mutation_options_add    — Sprint 5 owns mutation pool

import { NODE_36_TIER_2_MIN_PRESTIGE, PATTERN_DECISIONS } from '../config/patterns';
import type { GameState } from '../types/GameState';

/** Effect value of the selected option at `nodeIndex`, or null if no decision yet. */
type DecisionNodeIndex = 6 | 15 | 24 | 36 | 48; // CONST-OK: decision-node index union, §10 patternDecisionNodes

function chosenOptionEffect(
  state: Pick<GameState, 'patternDecisions'>,
  nodeIndex: DecisionNodeIndex,
) {
  const choice = state.patternDecisions[nodeIndex];
  if (choice !== 'A' && choice !== 'B') return null;
  return PATTERN_DECISIONS[nodeIndex][choice].effect;
}

// Decision-node index literals below are GDD §10 canonical values
// (patternDecisionNodes = [6, 15, 24, 36, 48]). They're semantic identifiers
// for specific tree decisions, not tunable game values.
const DEC_NODE_6 = 6 as const; // CONST-OK: decision-node index (§10)
const DEC_NODE_15 = 15 as const; // CONST-OK: decision-node index (§10)
const DEC_NODE_24 = 24 as const; // CONST-OK: decision-node index (§10)
const DEC_NODE_36 = 36 as const; // CONST-OK: decision-node index (§10)

/** Node 6 A → extra cycle-bonus add on top of `patternCycleBonusPerNode × count`. */
export function patternCycleBonusAdd(state: Pick<GameState, 'patternDecisions'>): number {
  const e = chosenOptionEffect(state, DEC_NODE_6);
  return e && e.kind === 'cycle_bonus_add' ? e.add : 0;
}

/** Node 15 B → multiplicative Focus-fill rate bonus (applies to per-tap Focus fill). */
export function focusFillRateDecisionMult(state: Pick<GameState, 'patternDecisions'>): number {
  const e = chosenOptionEffect(state, DEC_NODE_15);
  return e && e.kind === 'focus_fill_rate_mult' ? e.mult : 1;
}

/** Node 24 A → additive Insight duration in seconds (stacks with Concentración Profunda). */
export function insightDurationDecisionAddS(state: Pick<GameState, 'patternDecisions'>): number {
  const e = chosenOptionEffect(state, DEC_NODE_24);
  return e && e.kind === 'insight_duration_add_s' ? e.add : 0;
}

/** Node 24 B → additive Memorias per prestige (stacks with base + Consolidación). */
export function memoriesPerPrestigeDecisionAdd(state: Pick<GameState, 'patternDecisions'>): number {
  const e = chosenOptionEffect(state, DEC_NODE_24);
  return e && e.kind === 'memories_per_prestige_add' ? e.add : 0;
}

/** Node 36 A → Cascade threshold OVERRIDE (0.65 vs base 0.75). */
export function cascadeThresholdOverride(state: Pick<GameState, 'patternDecisions'>): number | null {
  const e = chosenOptionEffect(state, DEC_NODE_36);
  return e && e.kind === 'cascade_threshold_set' ? e.threshold : null;
}

/** Node 36 B → Discharge damage multiplicative bonus (+10 %). */
export function dischargeDamageDecisionMult(state: Pick<GameState, 'patternDecisions'>): number {
  const e = chosenOptionEffect(state, DEC_NODE_36);
  return e && e.kind === 'discharge_damage_mult' ? e.mult : 1;
}

/**
 * Node 36 B tier-2 gate (INT-5) — at prestigeCount ≥ NODE_36_TIER_2_MIN_PRESTIGE,
 * Option B also generates Resonance on Discharge. The Resonance amount + write
 * path is Sprint 8b; this returns `true` iff the gate is open, so the 8b impl
 * can simply ask `shouldAwardResonanceOnDischarge(state)` and add the value.
 */
export function shouldAwardResonanceOnDischarge(
  state: Pick<GameState, 'patternDecisions' | 'prestigeCount'>,
): boolean {
  const e = chosenOptionEffect(state, DEC_NODE_36);
  if (!e || e.kind !== 'discharge_damage_mult') return false;
  return state.prestigeCount >= NODE_36_TIER_2_MIN_PRESTIGE;
}

/**
 * Node 6 B — state-mutating decision. Bumps `dischargeMaxCharges` by +1.
 * Called from handlePrestige AFTER PRESTIGE_RESET to restore the bonus
 * (decisions are PRESERVE'd but the state field is RESET'd every cycle).
 *
 * Also call this when the player FIRST makes decision 6B during gameplay
 * so the bonus applies immediately in the current cycle.
 */
export function applyPermanentPatternDecisionsToState(
  state: Pick<GameState, 'patternDecisions' | 'dischargeMaxCharges'>,
): Partial<GameState> {
  const updates: Partial<GameState> = {};
  const e = chosenOptionEffect(state, DEC_NODE_6);
  if (e && e.kind === 'discharge_charges_plus_one') {
    updates.dischargeMaxCharges = state.dischargeMaxCharges + 1;
  }
  return updates;
}

// Sprint 5 / 8a owners add their getters + wiring:
//   Node 15A offline_efficiency_mult → Sprint 8a offline.ts
//   Node 48A region_mult            → Sprint 5 region production integration
//   Node 48B mutation_options_add   → Sprint 5 mutation pool size
// Not exported yet — intentional; owning sprints own the getter + consumer.
