// Implements GDD §21 Run-exclusive upgrade consumers. Sprint 8b Phase 8b.5.
// Pure helpers (CODE-9). Consumed by offline.ts / production.ts.

import { RUN_UPGRADES_BY_ID } from '../config/runUpgrades';
import type { GameState } from '../types/GameState';

function ownsRun(state: Pick<GameState, 'runUpgradesPurchased'>, id: string): boolean {
  return state.runUpgradesPurchased.includes(id);
}

/** GDD §21 sueno_profundo: offline cap +4h permanent. Returns bonus hours. */
export function runUpgradeOfflineCapBonusHours(state: Pick<GameState, 'runUpgradesPurchased'>): number {
  if (!ownsRun(state, 'sueno_profundo')) return 0;
  const def = RUN_UPGRADES_BY_ID['sueno_profundo'];
  return def.effect.kind === 'offline_cap_add_hours' ? def.effect.hours : 0;
}

/**
 * GDD §21 despertar_acelerado: threshold ×0.8 for P1-P3 of each Run.
 * Returns mult (1.0 identity if not owned / outside P1-P3 window).
 */
export function runUpgradeEarlyPrestigeThresholdMult(
  state: Pick<GameState, 'runUpgradesPurchased'>,
  prestigeCount: number,
): number {
  if (!ownsRun(state, 'despertar_acelerado')) return 1;
  const def = RUN_UPGRADES_BY_ID['despertar_acelerado'];
  if (def.effect.kind !== 'early_prestige_threshold_mult') return 1;
  const { mult, maxPrestige } = def.effect;
  // prestigeCount is the CURRENT cycle counter; P1-P3 corresponds to prestigeCount 0..maxPrestige-1
  // (reaching prestigeCount=N means completing P(N+1)'s threshold). Apply mult while
  // the CURRENT threshold being computed is for P1..P3 — i.e., the upcoming target
  // index is in the [0, maxPrestige] range (0-indexed).
  return prestigeCount < maxPrestige ? mult : 1;
}

/** Can the player buy this Run upgrade? Transcendence-count gated + affordable + un-owned. */
export function canBuyRunUpgrade(
  state: Pick<GameState, 'runUpgradesPurchased' | 'thoughts' | 'transcendenceCount'>,
  id: string,
): { ok: boolean; reason?: 'unknown_id' | 'already_owned' | 'run_locked' | 'insufficient_thoughts' } {
  const def = RUN_UPGRADES_BY_ID[id];
  if (!def) return { ok: false, reason: 'unknown_id' };
  if (state.runUpgradesPurchased.includes(id)) return { ok: false, reason: 'already_owned' };
  if (state.transcendenceCount < def.unlockAtTranscendenceCount) return { ok: false, reason: 'run_locked' };
  if (state.thoughts < def.costThoughts) return { ok: false, reason: 'insufficient_thoughts' };
  return { ok: true };
}

/** Pure. Returns { bought, state } — state unchanged on failure. */
export function tryBuyRunUpgrade(state: GameState, id: string): { bought: boolean; state: GameState } {
  const gate = canBuyRunUpgrade(state, id);
  if (!gate.ok) return { bought: false, state };
  const def = RUN_UPGRADES_BY_ID[id];
  return {
    bought: true,
    state: {
      ...state,
      thoughts: state.thoughts - def.costThoughts,
      runUpgradesPurchased: [...state.runUpgradesPurchased, id],
    },
  };
}
