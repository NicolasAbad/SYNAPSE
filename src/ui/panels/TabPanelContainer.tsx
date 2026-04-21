import { memo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { NeuronsPanel } from './NeuronsPanel';
import { UpgradesPanel } from './UpgradesPanel';
import { RegionsPanel } from './RegionsPanel';
import { MindPanel } from './MindPanel';

/**
 * Tab panel container (Sprint 3.6.1). Switches content based on
 * `state.activeTab`. Per GDD §29 Tabs rule, four panels exist (Mind /
 * Neurons / Upgrades / Regions) but only Mind is "default visible"
 * with the canvas revealed behind — the other three fully overlay
 * the canvas area when active.
 *
 * Layout:
 * - Top offset matches HUD top-bar height so the FocusBar + thoughts
 *   counter stay visible above.
 * - Bottom offset reserves room for the DischargeButton + TabBar row.
 * - `pointerEvents: 'auto'` on the wrapper so Buy buttons inside the
 *   panel intercept taps (don't fall through to the canvas).
 *
 * Mind panel currently renders null (canvas visible). Sprint 4b adds
 * its first subtab content (Pattern Tree).
 */
export const TabPanelContainer = memo(function TabPanelContainer() {
  const activeTab = useGameStore((s) => s.activeTab);

  if (activeTab === 'mind') {
    // Mind tab default "home" view intentionally renders nothing so
    // the canvas behind is visible and tappable. Sprint 4b+ fills it.
    return <MindPanel />;
  }

  return (
    <div
      data-testid="tab-panel-container"
      style={{
        position: 'absolute',
        top: 'calc(var(--spacing-16) + var(--spacing-5))', // CONST-OK: CSS layout offset below top HUD row
        bottom: 'calc(var(--spacing-16) * 2)', // CONST-OK: CSS layout reserving Discharge + TabBar row
        left: 0, // CONST-OK: CSS full-bleed
        right: 0, // CONST-OK: CSS full-bleed
        padding: 'var(--spacing-4)', // CONST-OK: CSS custom property ref (CODE-1 exception)
        background: 'var(--color-bg-deep)',
        borderTop: '1px solid var(--color-border-subtle)',
        borderBottom: '1px solid var(--color-border-subtle)',
        overflowY: 'auto',
        pointerEvents: 'auto',
      }}
    >
      {activeTab === 'neurons' && <NeuronsPanel />}
      {activeTab === 'upgrades' && <UpgradesPanel />}
      {activeTab === 'regions' && <RegionsPanel />}
    </div>
  );
});
