// Implements GDD.md §8 Spontaneous events + §35 SPONT-1 (seed derivation)
// + CODE-9 determinism (no Math.random / no Date.now inside engine).
//
// Responsibilities:
//   - spontaneousSeed(cycleStartTimestamp, lastCheckTimestamp): per-check seed
//   - shouldCheckSpontaneous(state, nowTimestamp): is it time to roll?
//   - rollSpontaneous(state, nowTimestamp, spontaneousRateMult): decide
//     whether an event fires + which one (weighted by type, then uniform).
//   - activateSpontaneous(state, def, nowTimestamp): produce GameState
//     Partial with effects applied. Handles 1-per-cycle limits
//     (`spontaneousMemoryUsed`, `spontaneousInterferenceUsed`).
//   - clearIfExpired(state, nowTimestamp): ticks the `activeSpontaneousEvent`
//     expiry.
//   - per-effect helpers: spontaneousProdMult, spontaneousFocusFillMult,
//     spontaneousConnectionMult, spontaneousPolarityReversed, etc.

import type { GameState } from '../types/GameState';
import type { SpontaneousDef, SpontaneousEffect, SpontaneousEventActive } from '../types';
import { SPONTANEOUS_BY_ID, SPONTANEOUS_BY_TYPE } from '../config/spontaneous';
import { SYNAPSE_CONSTANTS } from '../config/constants';
import { hash, mulberry32 } from './rng';

export function spontaneousSeed(cycleStartTimestamp: number, lastCheckTimestamp: number): number {
  return hash(`spont_${cycleStartTimestamp}_${lastCheckTimestamp}`);
}

/** Has enough time elapsed to run the next SPONT-1 check? */
export function shouldCheckSpontaneous(
  state: Pick<GameState, 'lastSpontaneousCheck' | 'cycleStartTimestamp'>,
  nowTimestamp: number,
): boolean {
  const { spontaneousCheckIntervalMin, spontaneousCheckIntervalMax } = SYNAPSE_CONSTANTS;
  const seed = spontaneousSeed(state.cycleStartTimestamp, state.lastSpontaneousCheck);
  const rng = mulberry32(seed);
  const intervalSec = spontaneousCheckIntervalMin + rng() * (spontaneousCheckIntervalMax - spontaneousCheckIntervalMin);
  return (nowTimestamp - state.lastSpontaneousCheck) / 1000 >= intervalSec; // CONST-OK (ms→s)
}

/** Roll the 40%-trigger + weighted type + uniform pick. null = no event. */
export function rollSpontaneous(
  state: Pick<GameState, 'lastSpontaneousCheck' | 'cycleStartTimestamp' | 'spontaneousMemoryUsed' | 'spontaneousInterferenceUsed'>,
  nowTimestamp: number,
  spontaneousRateMult: number = 1,
): SpontaneousDef | null {
  const seed = spontaneousSeed(state.cycleStartTimestamp, nowTimestamp);
  const rng = mulberry32(seed);
  const triggerChance = Math.min(1, SYNAPSE_CONSTANTS.spontaneousTriggerChance * spontaneousRateMult);
  if (rng() >= triggerChance) return null;
  const { positive, neutral, negative } = SYNAPSE_CONSTANTS.spontaneousWeights;
  const r = rng();
  let pool: readonly SpontaneousDef[];
  if (r < positive) pool = SPONTANEOUS_BY_TYPE.positive;
  else if (r < positive + neutral) pool = SPONTANEOUS_BY_TYPE.neutral;
  else {
    void negative;
    pool = SPONTANEOUS_BY_TYPE.negative;
  }
  // Filter out events blocked by 1-per-cycle limits (memoria_fugaz, interferencia).
  const eligible = pool.filter((e) => {
    if (e.id === 'memoria_fugaz' && state.spontaneousMemoryUsed) return false;
    if (e.id === 'interferencia' && state.spontaneousInterferenceUsed) return false;
    return true;
  });
  if (eligible.length === 0) return null;
  return eligible[Math.floor(rng() * eligible.length)];
}

/**
 * Apply the event's effect to state. Returns a GameState Partial the caller
 * merges (tick.ts). Handles instant effects inline + sets
 * `activeSpontaneousEvent` for timed effects so expiry-tick can clear them.
 */
export function activateSpontaneous(
  state: GameState,
  def: SpontaneousDef,
  nowTimestamp: number,
): Partial<GameState> {
  const e = def.effect;
  // Sprint 7.5: write 'spontaneous' diary entry for hid_spontaneous_hunter
  // tracking + Diary visibility. 500-entry circular cap enforced.
  const diary = [...state.diaryEntries, { timestamp: nowTimestamp, type: 'spontaneous' as const, data: { spontaneousId: def.id, eventType: def.type } }];
  const trimmed = diary.length > 500 ? diary.slice(diary.length - 500) : diary; // CONST-OK: nar_diary_50 + Sprint 7.5 cap
  const updates: Partial<GameState> = {
    lastSpontaneousCheck: nowTimestamp,
    cyclePositiveSpontaneous: state.cyclePositiveSpontaneous + (def.type === 'positive' ? 1 : 0),
    diaryEntries: trimmed,
  };

  if (e.kind === 'free_next_upgrade') {
    // Eureka — flag "until next upgrade buy" per GDD §8 ("Until used").
    // Field named `eurekaExpiry` for historical compat; tick.ts expires only
    // when nowTimestamp >= eurekaExpiry, so setting a far-future value keeps
    // the flag live until purchases.ts clears it on upgrade buy.
    updates.eurekaExpiry = Number.MAX_SAFE_INTEGER;
    return updates;
  }
  if (e.kind === 'discharge_charge_add') {
    updates.dischargeCharges = Math.min(state.dischargeCharges + e.add, state.dischargeMaxCharges);
    return updates;
  }
  if (e.kind === 'memory_add') {
    updates.memories = state.memories + e.add;
    updates.spontaneousMemoryUsed = true;
    return updates;
  }
  if (e.kind === 'focus_reset') {
    updates.focusBar = 0;
    updates.spontaneousInterferenceUsed = true;
    return updates;
  }
  if (e.kind === 'extra_fragment') {
    // Eco Distante — cosmetic fragment surfaces via narrative hook;
    // Phase 6.3b's FragmentOverlay handles the display when an unseen
    // fragment id enters narrativeFragmentsSeen. Here we just record the
    // event in cyclePositiveSpontaneous (neutral, doesn't bump) and let
    // the narrative layer pick one next prestige if eligible.
    return updates;
  }
  // Timed effects — store id + endTime and consumers read `activeSpontaneousEvent`.
  const active: SpontaneousEventActive = {
    id: def.id,
    type: def.type,
    endTime: nowTimestamp + ('durationMs' in e ? e.durationMs : 0),
  };
  updates.activeSpontaneousEvent = active;
  return updates;
}

/** Called by tick.ts to expire the active event when now > endTime. */
export function clearIfExpired(state: Pick<GameState, 'activeSpontaneousEvent'>, nowTimestamp: number): Partial<GameState> {
  if (state.activeSpontaneousEvent === null) return {};
  if (nowTimestamp < state.activeSpontaneousEvent.endTime) return {};
  return { activeSpontaneousEvent: null };
}

function activeEffect(state: Pick<GameState, 'activeSpontaneousEvent'>): SpontaneousEffect | null {
  const a = state.activeSpontaneousEvent;
  if (a === null) return null;
  return SPONTANEOUS_BY_ID[a.id]?.effect ?? null;
}

/** Production mult from active spontaneous event (Ráfaga / Fatiga / Pausa). */
export function spontaneousProdMult(state: Pick<GameState, 'activeSpontaneousEvent'>): number {
  const e = activeEffect(state);
  if (!e) return 1;
  if (e.kind === 'production_mult') return e.mult;
  if (e.kind === 'production_and_focus_mult') return e.prodMult;
  return 1;
}

/** Focus fill mult from active spontaneous event (Claridad / Pausa). */
export function spontaneousFocusFillMult(state: Pick<GameState, 'activeSpontaneousEvent'>): number {
  const e = activeEffect(state);
  if (!e) return 1;
  if (e.kind === 'focus_fill_mult') return e.mult;
  if (e.kind === 'production_and_focus_mult') return e.focusMult;
  return 1;
}

/** Connection mult from active spontaneous event (Conexión Profunda). */
export function spontaneousConnectionMult(state: Pick<GameState, 'activeSpontaneousEvent'>): number {
  const e = activeEffect(state);
  if (e?.kind === 'connection_mult') return e.mult;
  return 1;
}

/** True if Polaridad Fluctuante is active — UI/engine flips polarity effects. */
export function spontaneousPolarityReversed(state: Pick<GameState, 'activeSpontaneousEvent'>): boolean {
  return activeEffect(state)?.kind === 'polarity_reverse';
}

/** True if Eureka flag is set — purchases.ts reads + clears this. */
export function isEurekaActive(state: Pick<GameState, 'eurekaExpiry'>): boolean {
  return state.eurekaExpiry !== null;
}
