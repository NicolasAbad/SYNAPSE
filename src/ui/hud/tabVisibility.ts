// Pre-launch audit Dimension M (M-1) — tab visibility helper. Lives in its
// own file so TabBar.tsx satisfies react-refresh/only-export-components
// (component-only file, no shared functions).
//
// Pure — exported for tests + a focused activeTab snap-back guard inside
// TabBar.

import type { TabId } from '../../store/gameStore';

/**
 * Per-tab unlock prestige (CONST-OK — progressive-disclosure cadence values,
 * not balance/gameplay tunables). Mind/Neurons/Upgrades are always available
 * from P0 because the tutorial requires them. Regions appears at P1+ because
 * its Hipocampo Memory Shard tree has zero content at P0 (shards drop from
 * P1 prestige onward).
 */
const TAB_UNLOCK_PRESTIGE: Readonly<Record<TabId, number>> = {
  mind: 0,
  neurons: 0,
  upgrades: 0,
  regions: 1,
};

/** Returns the tabs visible at the given prestige count. */
export function visibleTabsAt(prestigeCount: number): TabId[] {
  return (Object.keys(TAB_UNLOCK_PRESTIGE) as TabId[])
    .filter((tab) => prestigeCount >= TAB_UNLOCK_PRESTIGE[tab]);
}
