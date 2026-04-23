// Implements GDD.md §9 (prestige + THRES-1), §33 (45/60/4/1 split), §6 (Memorias),
// §10 (Patterns 4b.2), §22 (RP 6.6), §35 PREST-1/BUG-01/02/04/06/CORE-8/TUTOR-2.

import { SYNAPSE_CONSTANTS } from '../config/constants';
import { PRESTIGE_RESET } from '../config/prestige';
import { UPGRADES_BY_ID } from '../config/upgrades';
import { calculateThreshold } from './production';
import { applyPermanentPatternDecisionsToState, memoriesPerPrestigeDecisionAdd } from './patternDecisions';
import { pathwayMemoriesPerPrestigeMult } from './pathways';
import { archetypeMemoryMult } from './archetypes';
import { checkAllResonantPatterns } from './resonantPatterns';
import { episodicShardsAtPrestige } from './shards';
import { applyMoodEvent } from './mood';
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

/** GDD §6 + Sprint 7.5.2 §16.1: base × pathwayMult × archetypeMult + Node 24 B + shard_epi_imprint. */
export function computeMemoriesGained(state: Pick<GameState, 'upgrades' | 'patternDecisions' | 'currentPathway' | 'archetype' | 'memoryShardUpgrades'>): number {
  const baseGain = SYNAPSE_CONSTANTS.baseMemoriesPerPrestige * pathwayMemoriesPerPrestigeMult(state as GameState) * archetypeMemoryMult(state) + memoriesPerPrestigeDecisionAdd(state);
  const shardBonus = state.memoryShardUpgrades.includes('shard_epi_imprint') ? SYNAPSE_CONSTANTS.shardEpiImprintMemoryPerPrestigeBonus : 0;
  return baseGain + shardBonus;
}

/** CORE-8 amended cap: raw × 30s clamped at nextThreshold × maxMomentumPct (§35 4A-2). */
export function computeMomentumBonus(lastCycleEndProduction: number, nextThreshold: number): number {
  const raw = lastCycleEndProduction * SYNAPSE_CONSTANTS.momentumBonusSeconds;
  const cap = nextThreshold * SYNAPSE_CONSTANTS.maxMomentumPct;
  return Math.min(raw, cap);
}

/** BUG-06: Focus Persistente keeps 25 % of focusBar through prestige; else 0. */
function focusBarAfterReset(state: Pick<GameState, 'upgrades' | 'focusBar'>): number {
  for (const id of ownedUpgradeIds(state.upgrades)) {
    const effect = UPGRADES_BY_ID[id]?.effect;
    if (effect?.kind === 'focus_persist') return state.focusBar * effect.pct;
  }
  return 0;
}

/** BUG-04: personalBests keyed by PRE-increment prestigeCount; update only if faster. */
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
  const cycleDurationMs = timestamp - state.cycleStartTimestamp;
  const cycleMinutes = cycleDurationMs / 60_000; // CONST-OK (ms→min)
  // Step 3 — personal best at PRE-increment prestigeCount (BUG-04).
  const { next: personalBests, wasPersonalBest } = updatePersonalBests(state.personalBests, state.prestigeCount, cycleMinutes);
  // Steps 4-7: patterns (4b) / resonance (8b stub) / RP (6.6) / Memories.
  const newPatterns = grantPatterns(state, timestamp);
  const patternsGained = newPatterns.length;
  const resonanceGain = 0;
  const rp = checkAllResonantPatterns(state);
  const memoriesGained = computeMemoriesGained(state);
  // Step 8 — Focus Persistente retention captured BEFORE applying RESET defaults.
  const focusBarRetained = focusBarAfterReset(state);
  // POLAR-1 + Sprint 5 Mutation #14 Déjà Vu snapshot. Pre-RESET so array isn't empty.
  const lastCycleConfig = { polarity: state.currentPolarity ?? '', mutation: state.currentMutation?.id ?? '', pathway: state.currentPathway ?? '', upgrades: state.upgrades.filter((u) => u.purchased).map((u) => u.id) };
  // Step 9 + Step 11 — UPDATE values + capped Momentum Bonus.
  const newPrestigeCount = state.prestigeCount + 1;
  const nextThreshold = calculateThreshold(newPrestigeCount, state.transcendenceCount);
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

  const permanentDecisionUpdates = applyPermanentPatternDecisionsToState({ patternDecisions: state.patternDecisions, dischargeMaxCharges: PRESTIGE_RESET.dischargeMaxCharges ?? 0 });
  // Sprint 7.5.3 §16.3 MOOD-2: prestige (+10) + per newly-discovered RP (+15 each).
  let moodAccum = applyMoodEvent(state, 'prestige', timestamp);
  for (let i = 0; i < rp.newlyDiscovered.length; i++) {
    moodAccum = applyMoodEvent({ ...state, mood: moodAccum.mood, moodHistory: moodAccum.moodHistory }, 'resonant_pattern', timestamp);
  }
  const next: GameState = {
    ...state,
    ...PRESTIGE_RESET,
    ...permanentDecisionUpdates,
    // RESET overrides (BUG-02 discharge timer, BUG-06 focus retention).
    dischargeLastTimestamp: timestamp,
    focusBar: focusBarRetained,
    // Step 7 + step 11 side effects on PRESERVE fields.
    memories: state.memories + memoriesGained,
    resonance: state.resonance + resonanceGain,
    // GDD §22 RP rewards — flip discovered flags + bump Sparks for new ones.
    resonantPatternsDiscovered: rp.resonantPatternsDiscovered,
    sparks: rp.sparks,
    // Sprint 7.5.2 §16.1 Episodic Shard burst at prestige: base + per-RP discovery.
    memoryShards: {
      emotional: state.memoryShards.emotional,
      procedural: state.memoryShards.procedural,
      episodic: state.memoryShards.episodic + episodicShardsAtPrestige(rp.newlyDiscovered.length),
    },
    // Sprint 7.5.3 §16.3 MOOD-2: prestige + per-RP mood deltas (accumulated).
    mood: moodAccum.mood,
    moodHistory: moodAccum.moodHistory,
    awakeningLog: [...state.awakeningLog, awakeningEntry],
    personalBests,
    personalBestsBeaten: state.personalBestsBeaten + (wasPersonalBest ? 1 : 0),
    // Step 4 — patterns gained this prestige (Sprint 4b). Appended to the
    // patterns list; totalPatterns counter bumped by the same amount.
    patterns: [...state.patterns, ...newPatterns],
    totalPatterns: state.totalPatterns + patternsGained,
    // POLAR-1: next cycle's CycleSetupScreen reads this to default-select last.
    lastCycleConfig,
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
