// Pre-launch audit Dimension M Phase 2 — unlock celebration helpers.
//
// Phase 1 silently revealed new tabs/subtabs as the player crossed prestige
// thresholds. Phase 2 makes each reveal feel earned: a top-of-screen toast
// fires once per unlock + a persistent "New" badge sits on the new
// tab/subtab until the player taps it.
//
// Storage: piggy-backs on `state.tabBadgesDismissed: string[]` (already in
// the 133-field GameState — no schema bump). Keys are namespaced
// `unlock:tab:<id>` / `unlock:subtab:<id>` so they don't collide with the
// pre-existing UI-3 tab-badge dismissal channel (which is currently unused
// per src/ui/hud/TabBadge.tsx but is preserved by GDD §33).
//
// Pure (no React) — exported helpers consumed by TabBar, MindPanel,
// UnlockCelebrationMount, and tests.

import type { TabId, MindSubtabId } from '../../store/gameStore';
import { visibleTabsAt } from './tabVisibility';
import { visibleMindSubtabsAt } from '../panels/mindSubtabVisibility';

/** Minimal GameState shape the helpers below need — keeps the surface narrow
 * so callers in the UI tree can pass `{ prestigeCount, tabBadgesDismissed }`
 * directly without dragging the full GameState type through their props. */
export interface UnlockState {
  prestigeCount: number;
  tabBadgesDismissed: string[];
}

/** Tabs that have an unlock prestige > 0 (i.e. can be celebrated when revealed). */
export const GATED_TABS: ReadonlyArray<TabId> = ['regions'];

/** Mind subtabs that have an unlock prestige > 0 (i.e. can be celebrated when revealed). */
export const GATED_SUBTABS: ReadonlyArray<MindSubtabId> = [
  'patterns', 'diary', 'mastery', 'archetypes', 'resonance',
];

export function unlockKeyForTab(tab: TabId): string {
  return `unlock:tab:${tab}`;
}

export function unlockKeyForSubtab(subtab: MindSubtabId): string {
  return `unlock:subtab:${subtab}`;
}

/**
 * True when the tab is currently visible AND it's a gated unlock AND the
 * player has not yet tapped it (tap acknowledges via acknowledgeUnlock).
 * Used by TabBar to drive the "New" badge.
 */
export function isTabUnlockUnacknowledged(state: UnlockState, tab: TabId): boolean {
  if (!GATED_TABS.includes(tab)) return false;
  if (!visibleTabsAt(state.prestigeCount).includes(tab)) return false;
  return !state.tabBadgesDismissed.includes(unlockKeyForTab(tab));
}

/**
 * True when the subtab is currently visible AND it's a gated unlock AND
 * the player has not yet tapped it.
 */
export function isSubtabUnlockUnacknowledged(state: UnlockState, subtab: MindSubtabId): boolean {
  if (!GATED_SUBTABS.includes(subtab)) return false;
  if (!visibleMindSubtabsAt(state.prestigeCount).includes(subtab)) return false;
  return !state.tabBadgesDismissed.includes(unlockKeyForSubtab(subtab));
}

/**
 * The Mind tab itself shows a "New" indicator if ANY of its subtabs are
 * currently in the unacknowledged state. Drives the M-3 audit recommendation
 * (subtab unlock pulse on the Mind tab badge).
 */
export function mindTabHasUnacknowledgedSubtab(state: UnlockState): boolean {
  return GATED_SUBTABS.some((s) => isSubtabUnlockUnacknowledged(state, s));
}

export type PendingUnlock =
  | { kind: 'tab'; id: TabId; key: string }
  | { kind: 'subtab'; id: MindSubtabId; key: string };

/**
 * Returns every visible-but-unacknowledged unlock in a stable order
 * (tabs first, then subtabs in declaration order). UnlockCelebrationMount
 * fires the toast for the FIRST entry per session — additional pending
 * entries surface later (e.g. on the next render after the first one was
 * acknowledged).
 */
export function pendingUnlocks(state: UnlockState): PendingUnlock[] {
  const out: PendingUnlock[] = [];
  for (const tab of GATED_TABS) {
    if (isTabUnlockUnacknowledged(state, tab)) {
      out.push({ kind: 'tab', id: tab, key: unlockKeyForTab(tab) });
    }
  }
  for (const subtab of GATED_SUBTABS) {
    if (isSubtabUnlockUnacknowledged(state, subtab)) {
      out.push({ kind: 'subtab', id: subtab, key: unlockKeyForSubtab(subtab) });
    }
  }
  return out;
}
