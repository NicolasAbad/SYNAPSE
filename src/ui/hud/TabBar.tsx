import { memo } from 'react';
import { useGameStore, type TabId } from '../../store/gameStore';
import { t } from '../../config/strings';
import { HUD } from '../tokens';

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
 */
const TABS: TabId[] = ['mind', 'neurons', 'upgrades', 'regions'];

export const TabBar = memo(function TabBar() {
  const activeTab = useGameStore((s) => s.activeTab);
  const setActiveTab = useGameStore((s) => s.setActiveTab);

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
      {TABS.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            type="button"
            data-testid={`hud-tab-${tab}`}
            data-active={isActive}
            onPointerDown={() => setActiveTab(tab)}
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
            }}
          >
            {t(`tabs.${tab}`)}
          </button>
        );
      })}
    </nav>
  );
});
