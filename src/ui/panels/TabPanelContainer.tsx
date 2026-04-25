import { memo, useEffect, useState } from 'react';
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
  const reducedMotion = useGameStore((s) => s.reducedMotion);

  // Sprint 10 Phase 10.6 — 150ms cross-fade between panels. We re-mount
  // opacity at 0 on activeTab change (via key={activeTab}) and ramp to 1
  // on the next paint via useEffect. ReducedMotion: skip the ramp.
  const [opacity, setOpacity] = useState(reducedMotion ? 1 : 0);
  useEffect(() => {
    if (reducedMotion) { setOpacity(1); return; }
    setOpacity(0);
    const id = window.requestAnimationFrame(() => setOpacity(1));
    return () => window.cancelAnimationFrame(id);
  }, [activeTab, reducedMotion]);

  if (activeTab === 'mind') {
    // Mind tab default "home" view intentionally renders nothing so
    // the canvas behind is visible and tappable. Sprint 4b+ fills it.
    return <MindPanel />;
  }

  return (
    <div
      key={activeTab}
      data-testid="tab-panel-container"
      className="tab-fade"
      style={{
        position: 'absolute',
        top: '45%', // CONST-OK: bottom-sheet idiom — leaves upper 45% for canvas tap area
        bottom: 'calc(var(--spacing-16) * 2)', // CONST-OK: above Discharge button + TabBar
        left: 0, // CONST-OK: CSS full-bleed
        right: 0, // CONST-OK: CSS full-bleed
        padding: 'var(--spacing-4)', // CONST-OK: CSS custom property ref (CODE-1 exception)
        background: 'var(--color-bg-deep)',
        borderTop: '1px solid var(--color-border-subtle)',
        overflowY: 'auto',
        pointerEvents: 'auto',
        opacity,
      }}
    >
      {activeTab === 'neurons' && <NeuronsPanel />}
      {activeTab === 'upgrades' && <UpgradesPanel />}
      {activeTab === 'regions' && <RegionsPanel />}
    </div>
  );
});
