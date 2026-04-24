// Implements docs/GDD.md §15 RESON-1..3 Resonance upgrade consumers. Sprint 8b Phase 8b.4.
//
// Pure helpers (CODE-9). Each accessor reads state.resonanceUpgrades (array of
// owned ids) and returns the relevant modifier value. Each accessor is consumed
// by one engine module (production.ts / discharge.ts / tap.ts / resonance.ts /
// offline.ts) at the appropriate formula site.

import { RESONANCE_UPGRADES_BY_ID, RESONANCE_TIER_UNLOCK_PRESTIGE, RESONANCE_TIER_PREREQ_COUNTS } from '../config/resonanceUpgrades';
import type { GameState } from '../types/GameState';

function ownsResonance(state: Pick<GameState, 'resonanceUpgrades'>, id: string): boolean {
  return state.resonanceUpgrades.includes(id);
}

/** GDD §15 eco_neural: all production +5% per OWNED Resonance upgrade (meta-compounding). */
export function resonanceAllProductionMult(state: Pick<GameState, 'resonanceUpgrades'>): number {
  if (!ownsResonance(state, 'eco_neural')) return 1;
  const def = RESONANCE_UPGRADES_BY_ID['eco_neural'];
  if (def.effect.kind !== 'all_production_mult_per_resonance_upgrade') return 1;
  const ownedCount = state.resonanceUpgrades.length;
  return 1 + def.effect.per * ownedCount;
}

/** GDD §15 patron_estable: pattern cycle cap 1.5 → 1.8. Returns override cap or null. */
export function resonancePatternCycleCap(state: Pick<GameState, 'resonanceUpgrades'>): number | null {
  if (!ownsResonance(state, 'patron_estable')) return null;
  const def = RESONANCE_UPGRADES_BY_ID['patron_estable'];
  return def.effect.kind === 'pattern_cycle_cap_set' ? def.effect.cap : null;
}

/** GDD §15 cascada_eterna: cascade mult base 2.5 → 3.0. Returns override or null. */
export function resonanceCascadeMult(state: Pick<GameState, 'resonanceUpgrades'>): number | null {
  if (!ownsResonance(state, 'cascada_eterna')) return null;
  const def = RESONANCE_UPGRADES_BY_ID['cascada_eterna'];
  return def.effect.kind === 'cascade_mult_set' ? def.effect.mult : null;
}

/** GDD §15 mente_despierta: focusFillRate ×1.25 permanent. Returns mult. */
export function resonanceFocusFillMult(state: Pick<GameState, 'resonanceUpgrades'>): number {
  if (!ownsResonance(state, 'mente_despierta')) return 1;
  const def = RESONANCE_UPGRADES_BY_ID['mente_despierta'];
  return def.effect.kind === 'focus_fill_rate_mult' ? def.effect.mult : 1;
}

/** GDD §15 meta_consciousness: patterns per prestige ×1.5. Returns mult. */
export function resonancePatternsPerPrestigeMult(state: Pick<GameState, 'resonanceUpgrades'>): number {
  if (!ownsResonance(state, 'meta_consciousness')) return 1;
  const def = RESONANCE_UPGRADES_BY_ID['meta_consciousness'];
  return def.effect.kind === 'patterns_per_prestige_mult' ? def.effect.mult : 1;
}

/** GDD §15 resonancia_profunda: Resonance earn rate ×1.5. Returns mult. */
export function resonanceEarnMult(state: Pick<GameState, 'resonanceUpgrades'>): number {
  if (!ownsResonance(state, 'resonancia_profunda')) return 1;
  const def = RESONANCE_UPGRADES_BY_ID['resonancia_profunda'];
  return def.effect.kind === 'resonance_earn_mult' ? def.effect.mult : 1;
}

/** GDD §15 time_dilation: offline cap +4h permanent. Returns bonus hours. */
export function resonanceOfflineCapBonusHours(state: Pick<GameState, 'resonanceUpgrades'>): number {
  if (!ownsResonance(state, 'time_dilation')) return 0;
  const def = RESONANCE_UPGRADES_BY_ID['time_dilation'];
  return def.effect.kind === 'offline_cap_add_hours' ? def.effect.hours : 0;
}

/** Can the player buy this Resonance upgrade? Checks id valid / unowned / tier-unlocked / prereq / affordable. */
export function canBuyResonanceUpgrade(
  state: Pick<GameState, 'resonanceUpgrades' | 'resonance' | 'prestigeCount'>,
  id: string,
): { ok: boolean; reason?: 'unknown_id' | 'already_owned' | 'tier_locked' | 'prereq_missing' | 'insufficient_resonance' } {
  const def = RESONANCE_UPGRADES_BY_ID[id];
  if (!def) return { ok: false, reason: 'unknown_id' };
  if (state.resonanceUpgrades.includes(id)) return { ok: false, reason: 'already_owned' };
  if (state.prestigeCount < RESONANCE_TIER_UNLOCK_PRESTIGE[def.tier]) return { ok: false, reason: 'tier_locked' };
  if (def.tier === 2 || def.tier === 3) { // CONST-OK Tier enum values (1|2|3)
    const prereqTier = def.tier === 2 ? 1 : 2; // CONST-OK Tier enum (T2 ⇒ requires T1; T3 ⇒ requires T2)
    const ownedAtPrereqTier = state.resonanceUpgrades.filter((oid) => RESONANCE_UPGRADES_BY_ID[oid]?.tier === prereqTier).length;
    if (ownedAtPrereqTier < RESONANCE_TIER_PREREQ_COUNTS[def.tier]) return { ok: false, reason: 'prereq_missing' };
  }
  if (state.resonance < def.costResonance) return { ok: false, reason: 'insufficient_resonance' };
  return { ok: true };
}

/** Pure. Returns { bought, state } — state unchanged on failure. */
export function tryBuyResonanceUpgrade(state: GameState, id: string): { bought: boolean; state: GameState } {
  const gate = canBuyResonanceUpgrade(state, id);
  if (!gate.ok) return { bought: false, state };
  const def = RESONANCE_UPGRADES_BY_ID[id];
  return {
    bought: true,
    state: {
      ...state,
      resonance: state.resonance - def.costResonance,
      resonanceUpgrades: [...state.resonanceUpgrades, id],
    },
  };
}
