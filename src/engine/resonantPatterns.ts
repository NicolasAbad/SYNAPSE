// Implements GDD.md §22 Resonant Patterns + RP-1..RP-4 + RP-3 inheritance
// (resonantPatternsDiscovered NEVER resets per GDD §33 PRESTIGE_PRESERVE).
// Pure checks consumed by prestige.ts handlePrestige BEFORE state reset.
//
// Patterns are tracked in state.resonantPatternsDiscovered: [b,b,b,b]
// indexed by RP number - 1. Each discovery grants +5 Sparks (GDD §22).
// Sprint 7.5.2 §16.1: shard_epi_reflection adds +10 Sparks per discovery (total 15).
// Unlocks the Singularity secret ending at P26 when all 4 discovered.

import type { GameState } from '../types/GameState';
import { rpSparkShardBonus } from './shards';

// Structural constants (GDD §22 spec values — hoisted for readability).
const RP1_WINDOW_MS = 120_000; // CONST-OK (§22 RP-1 "within first 2 minutes")
const RP1_REQUIRED_TYPE_COUNT = 5; // CONST-OK (§2 — 5 neuron types)
const RP3_MIN_PRESTIGE = 10; // CONST-OK (§22 RP-3 "Reach P10")
const RP3_MIN_B_DECISIONS = 3; // CONST-OK (§22 RP-3 "≥3 Option B")
const RP4_MIN_CASCADES = 5; // CONST-OK (§22 RP-4 "5 Cascades")
export const RP_DISCOVERY_SPARKS = 5; // CONST-OK (§22 +5 Sparks per discovery)

/** RP-1 The Lost Connection — buy all 5 neuron types within first 2 min. */
export function checkRP1(state: Pick<GameState, 'cycleNeuronPurchases' | 'cycleStartTimestamp'>): boolean {
  const types = new Set<string>();
  for (const p of state.cycleNeuronPurchases) {
    if (p.timestamp - state.cycleStartTimestamp <= RP1_WINDOW_MS) types.add(p.type);
  }
  return types.size >= RP1_REQUIRED_TYPE_COUNT;
}

/** RP-2 The Silent Mind — complete a full cycle without using Discharge. */
export function checkRP2(state: Pick<GameState, 'cycleDischargesUsed'>): boolean {
  return state.cycleDischargesUsed === 0;
}

/** RP-3 The Broken Mirror — at P10+, ≥3 Pattern Decisions are Option B. */
export function checkRP3(state: Pick<GameState, 'prestigeCount' | 'patternDecisions'>): boolean {
  if (state.prestigeCount < RP3_MIN_PRESTIGE) return false;
  let bCount = 0;
  for (const decision of Object.values(state.patternDecisions)) {
    if (decision === 'B') bCount++;
  }
  return bCount >= RP3_MIN_B_DECISIONS;
}

/** RP-4 The Cascade Chorus — 5 Cascades in a cycle without Cascada Profunda. */
export function checkRP4(state: Pick<GameState, 'cycleCascades' | 'upgrades'>): boolean {
  if (state.cycleCascades < RP4_MIN_CASCADES) return false;
  const hasCascada = state.upgrades.some((u) => u.id === 'cascada_profunda' && u.purchased);
  return !hasCascada;
}

/**
 * Check all 4 RPs against pre-reset state. Returns { updates, newlyDiscovered }
 * so the caller can merge `resonantPatternsDiscovered` + bump `sparks`. Only
 * flips false → true; already-discovered never toggles back.
 *
 * Sprint 7.5.2 §16.1: per-RP Spark grant = base RP_DISCOVERY_SPARKS (5) +
 * shard_epi_reflection bonus (10 if owned, else 0). Total 15 with shard owned.
 */
export function checkAllResonantPatterns(
  state: Pick<GameState, 'resonantPatternsDiscovered' | 'cycleNeuronPurchases' | 'cycleStartTimestamp' | 'cycleDischargesUsed' | 'prestigeCount' | 'patternDecisions' | 'cycleCascades' | 'upgrades' | 'sparks' | 'memoryShardUpgrades'>,
): { resonantPatternsDiscovered: [boolean, boolean, boolean, boolean]; sparks: number; newlyDiscovered: number[] } {
  const prior = state.resonantPatternsDiscovered;
  const checks = [checkRP1(state), checkRP2(state), checkRP3(state), checkRP4(state)];
  const newlyDiscovered: number[] = [];
  const next: [boolean, boolean, boolean, boolean] = [prior[0], prior[1], prior[2], prior[3]]; // CONST-OK (4-tuple array indices)
  for (let i = 0; i < 4; i++) { // CONST-OK (array length, 4 RPs)
    if (!prior[i] && checks[i]) {
      next[i] = true;
      newlyDiscovered.push(i);
    }
  }
  const sparkPerRp = RP_DISCOVERY_SPARKS + rpSparkShardBonus(state);
  return {
    resonantPatternsDiscovered: next,
    sparks: state.sparks + newlyDiscovered.length * sparkPerRp,
    newlyDiscovered,
  };
}

/** True iff all 4 Resonant Patterns are discovered — unlocks the Singularity ending at P26. */
export function allResonantPatternsDiscovered(state: Pick<GameState, 'resonantPatternsDiscovered'>): boolean {
  return state.resonantPatternsDiscovered.every((b) => b);
}
