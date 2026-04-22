// Implements docs/GDD.md §16 Regions + REG-1 unlock trigger.
//
// Pure helper called by tick.ts. The 4 starter regions auto-unlock
// once `cycleGenerated >= regionsUnlockPct × currentThreshold` (1% of
// cycle threshold). Hipocampo carries a one-time +3 Memorias award
// per GDD §16 REG-1 — granted only the first time it joins the
// `regionsUnlocked` array (PRESERVE field, never resets per
// PROGRESS.md). Broca is P14-gated and unlocks via prestigeCount.
//
// Convention: callers mutate the GameState reference passed in
// (matches tick.ts step style — see tick.ts line ~190 for the
// orchestrator). Pure: no Math.random / no Date.now.

import type { GameState } from '../types/GameState';
import { SYNAPSE_CONSTANTS } from '../config/constants';
import { REGIONS } from '../config/regions';

/**
 * REG-1 (GDD §16): start-tier regions auto-unlock at 1% of currentThreshold.
 * Broca unlocks at prestigeCount >= 14 (its `unlockPrestige` in regions.ts).
 * On the prestige that crosses Broca's gate, it joins the unlocked list and
 * is renderable in RegionsPanel — no Memories bonus (only Hipocampo grants).
 *
 * Mutates `s.regionsUnlocked` (string[]) and `s.memories` (one-time bonus).
 */
export function checkRegionUnlock(s: GameState): void {
  const owned = new Set(s.regionsUnlocked);
  const triggerCondition = s.cycleGenerated >= SYNAPSE_CONSTANTS.regionsUnlockPct * s.currentThreshold;
  for (const region of REGIONS) {
    if (owned.has(region.id)) continue;
    // Broca needs explicit prestige gate; the 4 starters share the REG-1 trigger.
    const ready = region.id === 'broca' ? s.prestigeCount >= region.unlockPrestige : triggerCondition;
    if (!ready) continue;
    s.regionsUnlocked = [...s.regionsUnlocked, region.id];
    if (region.id === 'hipocampo') {
      s.memories += SYNAPSE_CONSTANTS.hipocampoUnlockMemoriasBonus;
    }
  }
}
