// Pre-launch audit Dimension M (M-3) — Mind-tab subtab visibility helper.
// Lives in its own file so MindPanel.tsx satisfies
// react-refresh/only-export-components (component-only file).
//
// Pure — exported for tests + the MindPanel render.

import { SYNAPSE_CONSTANTS } from '../../config/constants';
import type { MindSubtabId } from '../../store/gameStore';

/**
 * Per-subtab unlock prestige (CONST-OK — progressive-disclosure cadence,
 * not balance/gameplay tunables). Strategy:
 *   - home + achievements always visible (achievements anchors progress
 *     even at P0 — players see the 0/N counter as a motivational baseline)
 *   - patterns + diary unlock at P1 (first prestige earns first content)
 *   - mastery unlocks at P5 (audit recommendation — first upgrade-mastery
 *     levels show meaningful values by then)
 *   - archetypes unlocks at archetypeUnlockPrestige=7 (matches engine gate)
 *   - resonance unlocks at resonanceUnlockPrestige=13 (matches engine gate)
 */
const SUBTAB_UNLOCK_PRESTIGE: Readonly<Record<MindSubtabId, number>> = {
  home: 0,
  achievements: 0,
  patterns: 1,
  diary: 1,
  mastery: 5,
  archetypes: SYNAPSE_CONSTANTS.archetypeUnlockPrestige,
  resonance: SYNAPSE_CONSTANTS.resonanceUnlockPrestige,
};

/**
 * Returns the Mind subtabs visible at the given prestige count.
 * `home` is always present.
 */
export function visibleMindSubtabsAt(prestigeCount: number): MindSubtabId[] {
  return (Object.keys(SUBTAB_UNLOCK_PRESTIGE) as MindSubtabId[])
    .filter((id) => prestigeCount >= SUBTAB_UNLOCK_PRESTIGE[id]);
}

/** Snap-back target: home is always visible, so it's the safe fallback. */
export const FALLBACK_MIND_SUBTAB: MindSubtabId = 'home';
