// Implements GDD.md §9 (prestige + THRES-1), §33 (45/60/4/1 split), §6 (Memorias),
// §10 (Patterns — 4b.2), §35 rules PREST-1, BUG-01/02/04/06, CORE-8, TUTOR-2.
// Pure CODE-9 (timestamp as parameter). Resonance/RP stubs for 8b/8c.

import { SYNAPSE_CONSTANTS } from '../config/constants';
import { PRESTIGE_RESET } from '../config/prestige';
import { UPGRADES_BY_ID } from '../config/upgrades';
import { calculateThreshold } from './production';
import type { GameState } from '../types/GameState';
import type { AwakeningEntry, PatternNode } from '../types';

/** Metadata the Awakening UI needs; engine doesn't store it. */
export interface PrestigeOutcome {
  prevPrestigeCount: number;
  newPrestigeCount: number;
  cycleDurationMs: number;
  memoriesGained: number;
  momentumBonus: number;
  nextThreshold: number;
  wasPersonalBest: boolean;
}

function ownedUpgradeIds(upgrades: GameState['upgrades']): Set<string> {
  const out = new Set<string>();
  for (const u of upgrades) if (u.purchased) out.add(u.id);
  return out;
}

/**
 * GDD §6: base +2 Memorias per prestige; Consolidación de Memoria
 * (§24 `basica_mult_and_memory_gain`) contributes `memoryGainAdd` as a
 * multiplicative "+X%" — base × (1 + memoryGainAdd). With the canonical
 * `memoryGainAdd: 0.5`, owned → 2 × 1.5 = 3, matching the §2 "+1 more"
 * table entry.
 */
export function computeMemoriesGained(state: Pick<GameState, 'upgrades'>): number {
  let mult = 1;
  for (const id of ownedUpgradeIds(state.upgrades)) {
    const effect = UPGRADES_BY_ID[id]?.effect;
    if (effect?.kind === 'basica_mult_and_memory_gain') mult += effect.memoryGainAdd;
  }
  return SYNAPSE_CONSTANTS.baseMemoriesPerPrestige * mult;
}

/**
 * CORE-8 amended (2nd audit 4A-2): raw bonus is
 * `lastCycleEndProduction × momentumBonusSeconds`; the clamp caps it at
 * `nextThreshold × maxMomentumPct` (10%) so late-game end-of-cycle PPS
 * can't trivialize the next cycle. Returns the capped value.
 */
export function computeMomentumBonus(lastCycleEndProduction: number, nextThreshold: number): number {
  const raw = lastCycleEndProduction * SYNAPSE_CONSTANTS.momentumBonusSeconds;
  const cap = nextThreshold * SYNAPSE_CONSTANTS.maxMomentumPct;
  return Math.min(raw, cap);
}

/**
 * BUG-06: Focus Persistente (§24 `focus_persist { pct: 0.25 }`) keeps
 * 25 % of the focusBar through prestige. Without it, focusBar resets
 * to 0 like every other cycle-scoped field.
 */
function focusBarAfterReset(state: Pick<GameState, 'upgrades' | 'focusBar'>): number {
  for (const id of ownedUpgradeIds(state.upgrades)) {
    const effect = UPGRADES_BY_ID[id]?.effect;
    if (effect?.kind === 'focus_persist') return state.focusBar * effect.pct;
  }
  return 0;
}

/**
 * BUG-04: personalBests keyed by the PRE-increment prestigeCount — the
 * cycle just completed was P{state.prestigeCount} → P{state.prestigeCount + 1},
 * so the best-time record belongs to the starting prestigeCount.
 * Updates only if the new minutes are STRICTLY LESS than the prior
 * best (idle-game convention: "best" = fastest).
 */
function updatePersonalBests(
  prev: GameState['personalBests'],
  prestigeCount: number,
  cycleMinutes: number,
): { next: GameState['personalBests']; wasPersonalBest: boolean } {
  const prior = prev[prestigeCount];
  if (!prior) {
    return {
      next: { ...prev, [prestigeCount]: { minutes: cycleMinutes, rewardGiven: false } },
      wasPersonalBest: true,
    };
  }
  if (cycleMinutes < prior.minutes) {
    return {
      next: { ...prev, [prestigeCount]: { minutes: cycleMinutes, rewardGiven: prior.rewardGiven } },
      wasPersonalBest: true,
    };
  }
  return { next: prev, wasPersonalBest: false };
}

/** Sprint 4b: sequential PatternNodes from `totalPatterns`, up to tree cap (§10). */
function grantPatterns(state: Pick<GameState, 'totalPatterns'>, timestamp: number): PatternNode[] {
  const { patternsPerPrestige, patternTreeSize, patternDecisionNodes } = SYNAPSE_CONSTANTS;
  const available = Math.max(0, patternTreeSize - state.totalPatterns);
  const gained = Math.min(patternsPerPrestige, available);
  const decisionSet = new Set<number>(patternDecisionNodes);
  const out: PatternNode[] = [];
  for (let i = 0; i < gained; i++) {
    const index = state.totalPatterns + i;
    out.push({ index, isDecisionNode: decisionSet.has(index), acquiredAt: timestamp });
  }
  return out;
}

/** Apply prestige per PREST-1. Patterns wired 4b.2; Resonance/RP stubs for 8b/8c. */
export function handlePrestige(state: GameState, timestamp: number): { state: GameState; outcome: PrestigeOutcome } {
  // Step 1 — capture pre-reset PPS for Momentum Bonus.
  const lastCycleEndProduction = state.effectiveProductionPerSecond;
  // Step 2 — cycle duration.
  const cycleDurationMs = timestamp - state.cycleStartTimestamp;
  const cycleMinutes = cycleDurationMs / 60_000; // CONST-OK (ms→min)
  // Step 3 — personal best at CURRENT prestigeCount, BEFORE increment (BUG-04).
  const { next: personalBests, wasPersonalBest } = updatePersonalBests(
    state.personalBests,
    state.prestigeCount,
    cycleMinutes,
  );
  // Steps 4-6 — patterns (Sprint 4b) / resonance (Sprint 8b) / RP (Sprint 8c).
  const newPatterns = grantPatterns(state, timestamp);
  const patternsGained = newPatterns.length;
  const resonanceGain = 0;
  // Step 7 — Memories.
  const memoriesGained = computeMemoriesGained(state);
  // Step 8 — capture Focus Persistente retention BEFORE applying RESET defaults.
  const focusBarRetained = focusBarAfterReset(state);
  // Step 9 — compute UPDATE values (new prestigeCount, threshold, timestamp, tutorial flip).
  const newPrestigeCount = state.prestigeCount + 1;
  const nextThreshold = calculateThreshold(newPrestigeCount, state.transcendenceCount);
  // Step 11 — capped Momentum Bonus (computed here, applied to thoughts below).
  const momentumBonus = computeMomentumBonus(lastCycleEndProduction, nextThreshold);
  // Append Awakening log entry before merging (wants pre-reset polarity/mutation/pathway).
  const awakeningEntry: AwakeningEntry = {
    prestigeCount: state.prestigeCount,
    timestamp,
    cycleDurationMs,
    endProduction: lastCycleEndProduction,
    polarity: state.currentPolarity,
    mutationId: state.currentMutation?.id ?? null,
    pathway: state.currentPathway,
    patternsGained,
    memoriesGained,
    wasPersonalBest,
  };

  // Build post-prestige state: preserve everything, then override RESET fields,
  // then override timestamp/upgrade-dependent fields, then UPDATE + lifetime.
  const next: GameState = {
    ...state,
    ...PRESTIGE_RESET,
    // RESET overrides (BUG-02 discharge timer, BUG-06 focus retention).
    dischargeLastTimestamp: timestamp,
    focusBar: focusBarRetained,
    // Step 7 + step 11 side effects on PRESERVE fields.
    memories: state.memories + memoriesGained,
    resonance: state.resonance + resonanceGain,
    awakeningLog: [...state.awakeningLog, awakeningEntry],
    personalBests,
    personalBestsBeaten: state.personalBestsBeaten + (wasPersonalBest ? 1 : 0),
    // Step 4 — patterns gained this prestige (Sprint 4b). Appended to the
    // patterns list; totalPatterns counter bumped by the same amount.
    patterns: [...state.patterns, ...newPatterns],
    totalPatterns: state.totalPatterns + patternsGained,
    // UPDATE (4 fields).
    prestigeCount: newPrestigeCount,
    currentThreshold: nextThreshold,
    cycleStartTimestamp: timestamp,
    // TUTOR-2 (§9) one-way flip: once false, never re-enables.
    isTutorialCycle: false,
    // Lifetime counter (+1).
    lifetimePrestiges: state.lifetimePrestiges + 1,
    // Capped Momentum Bonus applied to thoughts + cycleGenerated (starting
    // credit for new cycle; totalGenerated is lifetime and preserved).
    thoughts: momentumBonus,
    cycleGenerated: momentumBonus,
    // lastCycleEndProduction retained in state for reference (UI + analytics).
    lastCycleEndProduction,
    momentumBonus,
  };

  return {
    state: next,
    outcome: {
      prevPrestigeCount: state.prestigeCount,
      newPrestigeCount,
      cycleDurationMs,
      memoriesGained,
      momentumBonus,
      nextThreshold,
      wasPersonalBest,
    },
  };
}
