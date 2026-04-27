import { memo, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { t } from '../../config/strings';
import { HUD } from '../tokens';
import { visibleTabsAt } from './tabVisibility';
import {
  isTabUnlockUnacknowledged, mindTabHasUnacknowledgedSubtab, unlockKeyForTab,
} from './unlockNotifications';
import { useIsTutorialTarget } from '../modals/tutorialTargetState';

/**
 * Bottom 4-tab navigation. Mockup Screen 1: rect x=0 y=570 w=390 h=130
 * fill=bgElevated, labels at y=620 centered at x=48/146/244/342.
 *
 * Phase 5: ships visible + interactive (tab switch updates
 * `state.activeTab`). Active tab highlighted in primary violet,
 * inactive in secondary gray. Badge slot per tab is scaffolded (max 1
 * active per UI-3); no real badge triggers until Sprint 3+.
 *
 * Tab content panels are empty placeholder divs in Phase 5 — Sprint 3+
 * fills them (Neurons panel first).
 *
 * Pre-launch audit Dimension M (M-1): tab visibility is gated by prestige
 * to keep the start state sparse. The `visibleTabsAt` helper below is the
 * single source of truth for what renders. Audit-recommended gates of
 * Neurons→P1 + Regions→P5 were softened — Neurons + Upgrades stay visible
 * at P0 because the tutorial requires them ("Buy your first neuron" hint
 * routes the player to the Neurons tab; Upgrades has affordable rows from
 * P0 priced in thoughts/memorias). Only Regions is gated, because its
 * Hipocampo Memory Shard tree has zero content at P0 (shards drop from
 * P1 prestige onward).
 */
export const TabBar = memo(function TabBar() {
  const activeTab = useGameStore((s) => s.activeTab);
  const setActiveTab = useGameStore((s) => s.setActiveTab);
  const prestigeCount = useGameStore((s) => s.prestigeCount);
  // Pre-launch audit Dim M Phase 2 — selectors for the "New" badge logic.
  // Subscribing to tabBadgesDismissed makes the badge clear instantly when
  // acknowledgeUnlock fires from the tap handler below.
  const tabBadgesDismissed = useGameStore((s) => s.tabBadgesDismissed);
  const acknowledgeUnlock = useGameStore((s) => s.acknowledgeUnlock);
  const visibleTabs = visibleTabsAt(prestigeCount);

  // Snap activeTab back to 'mind' if it points to a now-hidden tab. Defensive
  // guard for legacy saves that recorded activeTab='regions' before this
  // gating shipped — without it, a freshly-loaded P0 save with that activeTab
  // would render an empty navigation row.
  useEffect(() => {
    if (!visibleTabs.includes(activeTab)) setActiveTab('mind');
  }, [activeTab, visibleTabs, setActiveTab]);

  // Pre-launch audit Dim M Phase 2 — narrow GameState shape for the badge
  // helpers. Both fields above are subscribed, so this object is fresh on
  // every render that matters.
  const badgeState = { prestigeCount, tabBadgesDismissed };

  // M-7: tutorial target glow — TabBar can be the target of upgrades_tab
  // and patterns_hipocampo hints. Mapping IDs come from HINT_TARGET in
  // TutorialHints.tsx ('tab-upgrades', 'tab-mind').
  const upgradesIsCallout = useIsTutorialTarget('tab-upgrades');
  const mindIsCallout = useIsTutorialTarget('tab-mind');

  const onTabTap = (tab: typeof visibleTabs[number]) => {
    setActiveTab(tab);
    // Tapping the tab acknowledges its unlock badge. Mind tab acknowledges
    // no key directly — its sub-badges clear when the player taps the actual
    // subtab inside MindPanel.
    if (isTabUnlockUnacknowledged(badgeState, tab)) {
      acknowledgeUnlock(unlockKeyForTab(tab));
    }
  };

  return (
    <nav
      data-testid="hud-tabbar"
      aria-label="main navigation"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
        background: 'var(--color-bg-elevated)',
        borderTop: '1px solid var(--color-border-subtle)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'stretch',
        pointerEvents: 'auto',
      }}
    >
      {visibleTabs.map((tab) => {
        const isActive = activeTab === tab;
        const showBadge =
          isTabUnlockUnacknowledged(badgeState, tab) ||
          (tab === 'mind' && mindTabHasUnacknowledgedSubtab(badgeState));
        const isCallout =
          (tab === 'upgrades' && upgradesIsCallout) ||
          (tab === 'mind' && mindIsCallout);
        return (
          <button
            key={tab}
            type="button"
            data-testid={`hud-tab-${tab}`}
            data-active={isActive}
            data-unlock-badge={showBadge ? 'true' : 'false'}
            className={isCallout ? 'synapse-tutorial-callout' : undefined}
            onPointerDown={() => onTabTap(tab)}
            style={{
              flex: 1,
              minHeight: HUD.touchTargetMin,
              padding: 'var(--spacing-3) var(--spacing-2)', // CONST-OK: CSS custom property ref (CODE-1 exception)
              background: 'transparent',
              border: 'none',
              color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-xs)',
              fontWeight: isActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
              cursor: 'pointer',
              touchAction: 'manipulation',
              position: 'relative',
            }}
          >
            {t(`tabs.${tab}`)}
            {showBadge && (
              <span
                data-testid={`hud-tab-${tab}-unlock-badge`}
                aria-label="new"
                className="synapse-unlock-pulse"
                style={{
                  position: 'absolute',
                  top: 4, // CONST-OK: visual offset (4px = half of 8 spacing token)
                  right: 'calc(50% - var(--spacing-6))', // CONST-OK: position relative to centered label
                  width: 8, // CONST-OK: dot diameter, parallels existing tabBadge dot
                  height: 8, // CONST-OK
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-primary)',
                  boxShadow: '0 0 8px var(--color-primary)', // CONST-OK: glow idiom
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
});
