// Implements docs/GDD.md §16.1 (Hipocampo Memory Shards) — drip engine + 6
// upgrade-effect helpers. Sprint 7.5 Phase 7.5.2.
//
// Drip model (REG-5/REG-6 + GDD §16.1):
//   - 3 typed shards: Emotional / Procedural / Episodic.
//   - Emo + Proc are TICK-DRIVEN: each tick, if the per-cycle eligibility flag
//     is set AND the cycle is still in progress (cycleGenerated < currentThreshold),
//     drip `shardDripBasePerMinute × (tickIntervalMs / 60_000)` of that shard type.
//   - Episodic is BURST-DRIVEN at prestige: +`episodicShardPerPrestige` base, +
//     `episodicShardPerRp` per newly-discovered RP. No drip.
//   - Eligibility derived from existing GameState fields (no new fields):
//       Emo eligible: cycleCascades > 0 || cyclePositiveSpontaneous > 0
//                     || hasFragmentReadThisCycle(state) (from diaryEntries scan)
//       Proc eligible: cycleNeuronsBought > 0 || cycleUpgradesBought > 0
//                      || lastTapTimestamps.length > 0
//   - Per-event bursts (in addition to drip flag flip):
//       Fragment read → +1 Emo immediately (also flips Emo eligibility for the rest
//       of the cycle).
//   - REG-6: drip pauses when cycleGenerated >= currentThreshold (cycle complete).
//
// 6 upgrade effect helpers (the 2 deferred — shard_emo_deep / shard_proc_mastery —
// land with their consumers in Sprint 7.5.3 / 7.7):
//   - cascadeSparkBonus       (shard_emo_pulse)        → +1 Spark per Cascade
//   - fragmentMemoryBonus     (shard_emo_resonance)    → +2 Memory on fragment first-read
//   - tapContributionBonus    (shard_proc_flow)        → tap thought ×1.05
//   - chargeIntervalMult      (shard_proc_pattern)     → charge interval ×0.90
//   - memoryPerPrestigeAdd    (shard_epi_imprint)      → +1 Memoria per prestige (consumed in prestige.ts)
//   - rpSparkBonus            (shard_epi_reflection)   → +10 Sparks per RP discovery
//
// CODE-9 deterministic: no Math.random / Date.now. CODE-1 compliant: every
// numeric in the helpers comes from SYNAPSE_CONSTANTS or 0/1 sentinels.

import { SYNAPSE_CONSTANTS } from '../config/constants';
import type { GameState } from '../types/GameState';

/** Returns true iff any 'fragment' diary entry was logged this cycle. */
export function hasFragmentReadThisCycle(state: Pick<GameState, 'diaryEntries' | 'cycleStartTimestamp'>): boolean {
  for (const entry of state.diaryEntries) {
    if (entry.type === 'fragment' && entry.timestamp >= state.cycleStartTimestamp) return true;
  }
  return false;
}

/** Emo drip eligible this cycle? Cascade fired OR positive spontaneous fired OR fragment read. */
export function isEmoEligible(state: Pick<GameState, 'cycleCascades' | 'cyclePositiveSpontaneous' | 'diaryEntries' | 'cycleStartTimestamp'>): boolean {
  if (state.cycleCascades > 0) return true;
  if (state.cyclePositiveSpontaneous > 0) return true;
  return hasFragmentReadThisCycle(state);
}

/** Proc drip eligible this cycle? Tap, neuron buy, or upgrade buy occurred. */
export function isProcEligible(state: Pick<GameState, 'cycleNeuronsBought' | 'cycleUpgradesBought' | 'lastTapTimestamps'>): boolean {
  if (state.cycleNeuronsBought > 0) return true;
  if (state.cycleUpgradesBought > 0) return true;
  return state.lastTapTimestamps.length > 0;
}

/** REG-6: drip pauses once the cycle has met its threshold. */
function dripPaused(state: Pick<GameState, 'cycleGenerated' | 'currentThreshold'>): boolean {
  return state.cycleGenerated >= state.currentThreshold;
}

/** Per-tick shard drip step. Mutates state.memoryShards in place (matches tick.ts step style). */
export function stepShardDrip(s: GameState): void {
  if (dripPaused(s)) return;
  const perTick = SYNAPSE_CONSTANTS.shardDripBasePerMinute * (SYNAPSE_CONSTANTS.tickIntervalMs / 60_000); // CONST-OK: ms→min
  const emo = isEmoEligible(s) ? perTick : 0;
  const proc = isProcEligible(s) ? perTick : 0;
  if (emo === 0 && proc === 0) return;
  s.memoryShards = {
    emotional: s.memoryShards.emotional + emo,
    procedural: s.memoryShards.procedural + proc,
    episodic: s.memoryShards.episodic,
  };
}

/** Episodic shards granted at prestige (base + per-newly-discovered-RP). */
export function episodicShardsAtPrestige(newlyDiscoveredRpCount: number): number {
  return SYNAPSE_CONSTANTS.episodicShardPerPrestige + newlyDiscoveredRpCount * SYNAPSE_CONSTANTS.episodicShardPerRp;
}

/** Emo burst granted at fragment first-read (in addition to flag flip). */
export function emoShardsOnFragmentRead(): number {
  // GDD §16.1: fragment-read is a +N burst (using Emo drip rate as the natural unit).
  // 1 burst per fragment-read keeps the per-fragment payoff tactile without
  // overshadowing the per-minute drip channel.
  return 1; // CONST-OK: 1-shard burst per fragment-read (GDD §16.1 burst-trigger)
}

// ─────────────────────────────────────────────────────
// Upgrade-effect helpers — read memoryShardUpgrades, return numeric bonuses
// ─────────────────────────────────────────────────────

/** shard_emo_pulse — +1 Spark per Cascade. Returns 0 if not owned. */
export function cascadeSparkBonus(state: Pick<GameState, 'memoryShardUpgrades'>): number {
  return state.memoryShardUpgrades.includes('shard_emo_pulse')
    ? SYNAPSE_CONSTANTS.shardEmoPulseCascadeSparkBonus
    : 0;
}

/** shard_emo_resonance — +2 Memory on fragment first-read. Returns 0 if not owned. */
export function fragmentMemoryBonus(state: Pick<GameState, 'memoryShardUpgrades'>): number {
  return state.memoryShardUpgrades.includes('shard_emo_resonance')
    ? SYNAPSE_CONSTANTS.shardEmoResonanceFragmentMemoryBonus
    : 0;
}

/** shard_proc_flow — tap contribution multiplier (1.05 if owned, else 1). */
export function tapContributionShardMult(state: Pick<GameState, 'memoryShardUpgrades'>): number {
  return state.memoryShardUpgrades.includes('shard_proc_flow')
    ? 1 + SYNAPSE_CONSTANTS.shardProcFlowTapMultBonus
    : 1;
}

/** shard_proc_pattern — discharge charge interval multiplier (0.90 if owned, else 1). */
export function chargeIntervalShardMult(state: Pick<GameState, 'memoryShardUpgrades'>): number {
  return state.memoryShardUpgrades.includes('shard_proc_pattern')
    ? SYNAPSE_CONSTANTS.shardProcPatternChargeIntervalMult
    : 1;
}

/** shard_epi_reflection — extra Sparks per Resonant Pattern discovery. */
export function rpSparkShardBonus(state: Pick<GameState, 'memoryShardUpgrades'>): number {
  return state.memoryShardUpgrades.includes('shard_epi_reflection')
    ? SYNAPSE_CONSTANTS.shardEpiReflectionRpSparkBonus
    : 0;
}
