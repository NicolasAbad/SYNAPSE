// Implements docs/GDD.md §16.3 (Sistema Límbico — Moodometer) + MOOD-1..4 rules.
// Sprint 7.5 Phase 7.5.3.
//
// Mood model (GDD §16.3):
//   - Range 0-100 (mood field), default 50 (Calm tier).
//   - 5 tiers with distinct production / focus-fill / max-charges / insight-potential effects.
//   - Tier mults apply POST-softCap as effectiveMult (stacks multiplicatively with
//     Mental States and Insight) per MOOD-1.
//   - Event deltas (MOOD-2): Cascade +5 / Prestige +10 / Fragment +3 / RP +15 /
//     Weekly challenge +20 / Pre-commit-fail -15 / Dormancy entry -5 / Anti-spam -10.
//   - MOOD-3: 2/h drift toward Calm during long offline; Empática 1/h; Genius Pass floor 40.
//   - MOOD-4 (R3): event-delta scaling stacks ADDITIVELY (1 + sum of bonuses).
//     `shard_emo_deep` and `red_emotiva` each contribute +0.5 → ×2.0 stack.
//
// Límbico upgrade hooks consumed here:
//   - lim_steady_heart : halves offline mood decay (consumed by offline.ts when ships)
//   - lim_empathic_spark: Cascade Mood bonus +5 (→ +10 total) — additive to base +5
//   - lim_resilience    : floor 25 below
//   - lim_elevation     : Engaged→Elevated boundary 60 → 55 (data shift in tier resolver)
//   - lim_euphoric_echo : Euphoric production mult 1.30 → 1.40
//   - lim_emotional_wisdom: each mood tier crossed this Run grants +1 lifetime Memoria
//     (cycle-cumulative tracking deferred to its own consumer in Phase 7.5.3 close)
//
// CODE-9 deterministic. CODE-1 compliant.

import { SYNAPSE_CONSTANTS } from '../config/constants';
import type { GameState } from '../types/GameState';

export type MoodTierIndex = 0 | 1 | 2 | 3 | 4; // CONST-OK (5-tier enum index)

/** Mood event kinds that produce deltas per MOOD-2. */
export type MoodEventKind =
  | 'cascade'
  | 'prestige'
  | 'fragment_read'
  | 'resonant_pattern'
  | 'weekly_challenge'
  | 'precommit_fail'
  | 'dormancy_entry'
  | 'anti_spam';

/**
 * Resolve 0-100 mood value to tier index 0..4 (Numb / Calm / Engaged / Elevated / Euphoric).
 * `lim_elevation` shifts the Engaged→Elevated boundary 60 → 55 (easier tier climb).
 */
export function moodTier(state: Pick<GameState, 'mood' | 'memoryShardUpgrades'>): MoodTierIndex {
  const value = state.mood;
  const boundaries = SYNAPSE_CONSTANTS.moodTierBoundaries;
  // memoryShardUpgrades accepted for future cross-system stacking; not read here.
  if (value < boundaries[0]) return 0; // CONST-OK MoodTierIndex: Numb
  if (value < boundaries[1]) return 1; // CONST-OK MoodTierIndex: Calm
  if (value < boundaries[2]) return 2; // CONST-OK MoodTierIndex: Engaged
  if (value < boundaries[3]) return 3; // CONST-OK MoodTierIndex: Elevated
  return 4; // CONST-OK MoodTierIndex: Euphoric
}

/** Tier index taking lim_elevation into account. */
export function effectiveMoodTier(state: Pick<GameState, 'mood' | 'upgrades'>): MoodTierIndex {
  const value = state.mood;
  const hasElevation = ownsLimUpgrade(state, 'lim_elevation');
  const elevatedBoundary = hasElevation ? SYNAPSE_CONSTANTS.limElevationBoundaryShift : SYNAPSE_CONSTANTS.moodTierBoundaries[2];
  const numbBoundary = SYNAPSE_CONSTANTS.moodTierBoundaries[0];
  const calmBoundary = SYNAPSE_CONSTANTS.moodTierBoundaries[1];
  const euphoricBoundary = SYNAPSE_CONSTANTS.moodTierBoundaries[3];
  if (value < numbBoundary) return 0; // CONST-OK MoodTierIndex: Numb
  if (value < calmBoundary) return 1; // CONST-OK MoodTierIndex: Calm
  if (value < elevatedBoundary) return 2; // CONST-OK MoodTierIndex: Engaged
  if (value < euphoricBoundary) return 3; // CONST-OK MoodTierIndex: Elevated
  return 4; // CONST-OK MoodTierIndex: Euphoric
}

function ownsLimUpgrade(state: Pick<GameState, 'upgrades'>, id: string): boolean {
  for (const u of state.upgrades) if (u.purchased && u.id === id) return true;
  return false;
}

/** Production mult per tier; lim_euphoric_echo bumps the top tier 1.30 → 1.40. */
export function moodProductionMult(state: Pick<GameState, 'mood' | 'upgrades'>): number {
  const tier = effectiveMoodTier(state);
  const EUPHORIC: MoodTierIndex = 4; // CONST-OK MoodTierIndex enum
  if (tier === EUPHORIC && ownsLimUpgrade(state, 'lim_euphoric_echo')) {
    return SYNAPSE_CONSTANTS.limEuphoricEchoProductionMult;
  }
  return SYNAPSE_CONSTANTS.moodTierProductionMults[tier];
}

/** Focus fill mult per tier (Engaged+ = 1.10, lower = 1.0). */
export function moodFocusFillMult(state: Pick<GameState, 'mood' | 'upgrades'>): number {
  return SYNAPSE_CONSTANTS.moodTierFocusFillMults[effectiveMoodTier(state)];
}

/** Bonus discharge max charges from Mood (Elevated/Euphoric +1, lower 0). */
export function moodMaxChargesBonus(state: Pick<GameState, 'mood' | 'upgrades'>): number {
  return SYNAPSE_CONSTANTS.moodTierMaxChargesBonus[effectiveMoodTier(state)];
}

/** Bonus Insight potential level from Mood (Euphoric +1, else 0). Capped at insightMultiplier.length. */
export function moodInsightPotentialBonus(state: Pick<GameState, 'mood' | 'upgrades'>): number {
  return SYNAPSE_CONSTANTS.moodTierInsightPotentialBonus[effectiveMoodTier(state)];
}

/** MOOD-2: base event delta (pre-scaling). */
function baseEventDelta(kind: MoodEventKind): number {
  switch (kind) {
    case 'cascade':           return SYNAPSE_CONSTANTS.moodDeltaCascade;
    case 'prestige':          return SYNAPSE_CONSTANTS.moodDeltaPrestige;
    case 'fragment_read':     return SYNAPSE_CONSTANTS.moodDeltaFragmentRead;
    case 'resonant_pattern':  return SYNAPSE_CONSTANTS.moodDeltaResonantPattern;
    case 'weekly_challenge':  return SYNAPSE_CONSTANTS.moodDeltaWeeklyChallenge;
    case 'precommit_fail':    return SYNAPSE_CONSTANTS.moodDeltaPrecommitFail;
    case 'dormancy_entry':    return SYNAPSE_CONSTANTS.moodDeltaLongIdle;
    case 'anti_spam':         return SYNAPSE_CONSTANTS.moodDeltaAntiSpam;
  }
}

function ownsShardUpgrade(state: Pick<GameState, 'memoryShardUpgrades'>, id: string): boolean {
  return state.memoryShardUpgrades.includes(id);
}

/**
 * MOOD-4: event-delta scaling additively stacks (1 + sum of bonuses).
 * Sources: shard_emo_deep (+0.5) and red_emotiva (+0.5, Wave 2 upgrade) when owned.
 */
function eventDeltaScale(state: Pick<GameState, 'memoryShardUpgrades' | 'upgrades'>): number {
  let scale = 1;
  if (ownsShardUpgrade(state, 'shard_emo_deep')) scale += SYNAPSE_CONSTANTS.moodEventScalingPerSource;
  if (ownsLimUpgrade(state, 'red_emotiva')) scale += SYNAPSE_CONSTANTS.moodEventScalingPerSource;
  return scale;
}

/** Per-event bonus add: lim_empathic_spark adds +5 to Cascade specifically. */
function eventDeltaBonusAdd(state: Pick<GameState, 'upgrades'>, kind: MoodEventKind): number {
  if (kind === 'cascade' && ownsLimUpgrade(state, 'lim_empathic_spark')) return SYNAPSE_CONSTANTS.limEmpathicSparkCascadeBonus;
  return 0;
}

/**
 * Apply a Mood event delta. Returns an updated mood + history sample. Mutates nothing.
 * Floors at 0 / lim_resilience floor / Genius Pass floor; caps at 100.
 */
export function applyMoodEvent(
  state: Pick<GameState, 'mood' | 'moodHistory' | 'memoryShardUpgrades' | 'upgrades' | 'isSubscribed'>,
  kind: MoodEventKind,
  nowTimestamp: number,
): { mood: number; moodHistory: GameState['moodHistory'] } {
  const baseDelta = baseEventDelta(kind);
  const bonusAdd = eventDeltaBonusAdd(state, kind);
  const effectiveDelta = (baseDelta + bonusAdd) * eventDeltaScale(state);
  const raw = state.mood + effectiveDelta;
  const resilienceFloor = ownsLimUpgrade(state, 'lim_resilience') ? SYNAPSE_CONSTANTS.limResilienceMoodFloor : 0;
  const passFloor = state.isSubscribed ? SYNAPSE_CONSTANTS.moodGeniusPassFloor : 0;
  const floor = Math.max(0, resilienceFloor, passFloor);
  const next = Math.min(SYNAPSE_CONSTANTS.moodMaxValue, Math.max(floor, raw));
  const cap = SYNAPSE_CONSTANTS.moodHistoryBufferCap;
  const sample = { timestamp: nowTimestamp, mood: next };
  const history = state.moodHistory.length >= cap
    ? [...state.moodHistory.slice(state.moodHistory.length - (cap - 1)), sample]
    : [...state.moodHistory, sample];
  return { mood: next, moodHistory: history };
}

/**
 * MOOD-3: average Mood over a time window (offline-aware). Uses the moodHistory buffer.
 * Returns current mood when buffer is empty. Sprint 8a OFFLINE-1 will consume this for
 * anti-ramp-farming offline production calc per GDD §16.3 MOOD-1.
 */
export function averageMoodOverWindow(state: Pick<GameState, 'mood' | 'moodHistory'>, windowStartMs: number): number {
  const samples = state.moodHistory.filter((s) => s.timestamp >= windowStartMs);
  if (samples.length === 0) return state.mood;
  let sum = 0;
  for (const s of samples) sum += s.mood;
  return sum / samples.length;
}
