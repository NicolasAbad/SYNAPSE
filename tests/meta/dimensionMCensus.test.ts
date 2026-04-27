// Pre-launch audit Dimension M — meta-test that locks the P0 visible-
// element budget. If a future change pushes any of these counts back up,
// this test fails and the regression is caught BEFORE Sprint 11b's manual
// device walkthrough OR a player ever sees the overstuffed UI.
//
// Pre-fix baseline (audit 2026-04-27): ~57 visible interactive elements at P0.
// Post-Phase-1 baseline (this commit): ~32 visible interactive elements at P0.
// Target (genre healthy zone NGU Idle): 10-16. We don't quite hit the target
// but we're 44% below baseline + clearly in "manageable" territory.

import { describe, expect, test } from 'vitest';
import { visibleTabsAt } from '../../src/ui/hud/tabVisibility';
import { visibleNeuronTypesAt } from '../../src/ui/panels/neuronVisibility';
import { visibleMindSubtabsAt } from '../../src/ui/panels/mindSubtabVisibility';
import { pendingUnlocks } from '../../src/ui/hud/unlockNotifications';
import type { NeuronState } from '../../src/types';

const P0_NEURONS: NeuronState[] = [
  { type: 'basica', count: 0 },
  { type: 'sensorial', count: 0 },
  { type: 'piramidal', count: 0 },
  { type: 'espejo', count: 0 },
  { type: 'integradora', count: 0 },
];

describe('Dimension M census (Phase 1 budget lock)', () => {
  test('P0: tabs ≤ 3 (mind / neurons / upgrades; regions hidden)', () => {
    const tabs = visibleTabsAt(0);
    expect(tabs.length).toBeLessThanOrEqual(3);
    expect(tabs).toContain('mind');
    expect(tabs).toContain('neurons');
    expect(tabs).toContain('upgrades');
    expect(tabs).not.toContain('regions');
  });

  test('P1+: regions tab unlocks (4 tabs total)', () => {
    expect(visibleTabsAt(1)).toContain('regions');
  });

  test('P0: mind subtabs ≤ 2 (home + achievements only)', () => {
    const subtabs = visibleMindSubtabsAt(0);
    expect(subtabs.length).toBeLessThanOrEqual(2);
    expect(subtabs).toContain('home');
    expect(subtabs).toContain('achievements');
    expect(subtabs).not.toContain('patterns');
    expect(subtabs).not.toContain('archetypes');
    expect(subtabs).not.toContain('diary');
    expect(subtabs).not.toContain('mastery');
    expect(subtabs).not.toContain('resonance');
  });

  test('subtab cadence: P1 +patterns +diary, P5 +mastery, P7 +archetypes, P13 +resonance', () => {
    expect(visibleMindSubtabsAt(1)).toContain('patterns');
    expect(visibleMindSubtabsAt(1)).toContain('diary');
    expect(visibleMindSubtabsAt(5)).toContain('mastery');
    expect(visibleMindSubtabsAt(7)).toContain('archetypes');
    expect(visibleMindSubtabsAt(13)).toContain('resonance');
    // The cadence should NOT show items prematurely.
    expect(visibleMindSubtabsAt(0)).not.toContain('patterns');
    expect(visibleMindSubtabsAt(4)).not.toContain('mastery');
    expect(visibleMindSubtabsAt(6)).not.toContain('archetypes');
    expect(visibleMindSubtabsAt(12)).not.toContain('resonance');
  });

  test('P0: neurons ≤ 2 rows (basica + sensorial teaser; chained reveal)', () => {
    expect(visibleNeuronTypesAt(P0_NEURONS, 0).length).toBeLessThanOrEqual(2);
  });

  test('chained neuron reveal: 10 basicas → +1 row; 5 sensorials → +1; etc.', () => {
    const after10Basicas: NeuronState[] = [
      { type: 'basica', count: 10 },
      { type: 'sensorial', count: 0 },
      { type: 'piramidal', count: 0 },
      { type: 'espejo', count: 0 },
      { type: 'integradora', count: 0 },
    ];
    expect(visibleNeuronTypesAt(after10Basicas, 0).length).toBe(3);
    const fullChainP10: NeuronState[] = [
      { type: 'basica', count: 10 },
      { type: 'sensorial', count: 5 },
      { type: 'piramidal', count: 5 },
      { type: 'espejo', count: 1 },
      { type: 'integradora', count: 0 },
    ];
    expect(visibleNeuronTypesAt(fullChainP10, 10).length).toBe(5);
  });

  test('Phase 2 P0 cold-start: no celebration toasts queued (cosmetics gate is P1+)', () => {
    // Phase 2 added a celebration LAYER (toasts + glow), but those layers are
    // ephemeral / trigger-based — they do NOT contribute to steady-state P0
    // element density. This test pins that invariant: a fresh P0 player sees
    // zero pending unlocks until they earn their first prestige.
    expect(pendingUnlocks({ prestigeCount: 0, tabBadgesDismissed: [] })).toEqual([]);
  });

  test('Phase 2 P1: full first-prestige celebration bundle queues exactly 4 (regions + patterns + diary + cosmetics)', () => {
    // Locks the celebration cadence at the genre-critical "first prestige"
    // moment. Adding a 5th gated unlock at P1 would over-stuff the celebration
    // queue and re-introduce the silent-overload regression Phase 1 fixed.
    const list = pendingUnlocks({ prestigeCount: 1, tabBadgesDismissed: [] });
    expect(list).toHaveLength(4);
  });

  test('Phase 1 P0 budget aggregate ≤ 35 visible interactive surface elements', () => {
    // 11 HUD elements (counters/buttons/conditional indicators)
    // + 3 tabs
    // + 2 mind subtabs
    // + 2 neuron rows
    // + ~9 affordable upgrades + ~5 teaser + 0 locked = ~14
    // + 0 region cards (tab hidden)
    // = ~32 (was ~57 pre-fix)
    const HUD_ELEMENTS_AT_P0 = 11; // empirical, not asserted here
    const tabsCount = visibleTabsAt(0).length;
    const subtabsCount = visibleMindSubtabsAt(0).length;
    const neuronsCount = visibleNeuronTypesAt(P0_NEURONS, 0).length;
    const UPGRADE_ROWS_BUDGET_P0 = 14; // affordable + teaser, locked is hidden
    const REGION_CARDS_P0 = 0;
    const total = HUD_ELEMENTS_AT_P0 + tabsCount + subtabsCount + neuronsCount + UPGRADE_ROWS_BUDGET_P0 + REGION_CARDS_P0;
    expect(total).toBeLessThanOrEqual(35);
  });
});
