// Pre-launch audit Dim M Phase 2 — unit tests for the pure unlock helpers.
// Component-level (TabBar, MindPanel, UnlockCelebrationMount) tests live
// in their own files; these cover the predicate + key-shape contracts.

import { describe, expect, test } from 'vitest';
import {
  GATED_TABS,
  GATED_SUBTABS,
  COSMETICS_DISCOVERY_KEY,
  unlockKeyForTab,
  unlockKeyForSubtab,
  isTabUnlockUnacknowledged,
  isSubtabUnlockUnacknowledged,
  isCosmeticsDiscoveryUnacknowledged,
  mindTabHasUnacknowledgedSubtab,
  pendingUnlocks,
} from '../../../src/ui/hud/unlockNotifications';

describe('unlockNotifications — gated lists', () => {
  test('GATED_TABS contains regions only (P0 visibility unchanged for mind/neurons/upgrades)', () => {
    expect(GATED_TABS).toEqual(['regions']);
  });

  test('GATED_SUBTABS contains the 5 prestige-gated subtabs in declaration order', () => {
    expect(GATED_SUBTABS).toEqual([
      'patterns', 'diary', 'mastery', 'archetypes', 'resonance',
    ]);
  });
});

describe('unlockNotifications — key namespacing', () => {
  test('tab keys are namespaced unlock:tab:<id>', () => {
    expect(unlockKeyForTab('regions')).toBe('unlock:tab:regions');
  });

  test('subtab keys are namespaced unlock:subtab:<id>', () => {
    expect(unlockKeyForSubtab('patterns')).toBe('unlock:subtab:patterns');
    expect(unlockKeyForSubtab('resonance')).toBe('unlock:subtab:resonance');
  });
});

describe('unlockNotifications — isTabUnlockUnacknowledged', () => {
  test('false for non-gated tabs (mind/neurons/upgrades)', () => {
    const state = { prestigeCount: 5, tabBadgesDismissed: [] };
    expect(isTabUnlockUnacknowledged(state, 'mind')).toBe(false);
    expect(isTabUnlockUnacknowledged(state, 'neurons')).toBe(false);
    expect(isTabUnlockUnacknowledged(state, 'upgrades')).toBe(false);
  });

  test('false for regions at P0 (not yet visible)', () => {
    const state = { prestigeCount: 0, tabBadgesDismissed: [] };
    expect(isTabUnlockUnacknowledged(state, 'regions')).toBe(false);
  });

  test('true for regions at P1+ when dismissed list is empty', () => {
    const state = { prestigeCount: 1, tabBadgesDismissed: [] };
    expect(isTabUnlockUnacknowledged(state, 'regions')).toBe(true);
  });

  test('false after acknowledge (key in dismissed list)', () => {
    const state = { prestigeCount: 1, tabBadgesDismissed: ['unlock:tab:regions'] };
    expect(isTabUnlockUnacknowledged(state, 'regions')).toBe(false);
  });
});

describe('unlockNotifications — isSubtabUnlockUnacknowledged', () => {
  test('false for non-gated subtabs (home/achievements at P0)', () => {
    const state = { prestigeCount: 0, tabBadgesDismissed: [] };
    expect(isSubtabUnlockUnacknowledged(state, 'home')).toBe(false);
    expect(isSubtabUnlockUnacknowledged(state, 'achievements')).toBe(false);
  });

  test('false for patterns at P0 (not yet visible — gated to P1)', () => {
    const state = { prestigeCount: 0, tabBadgesDismissed: [] };
    expect(isSubtabUnlockUnacknowledged(state, 'patterns')).toBe(false);
  });

  test('true for patterns at P1 when dismissed list is empty', () => {
    const state = { prestigeCount: 1, tabBadgesDismissed: [] };
    expect(isSubtabUnlockUnacknowledged(state, 'patterns')).toBe(true);
    expect(isSubtabUnlockUnacknowledged(state, 'diary')).toBe(true);
  });

  test('false for mastery at P5 once acknowledged', () => {
    const state = { prestigeCount: 5, tabBadgesDismissed: ['unlock:subtab:mastery'] };
    expect(isSubtabUnlockUnacknowledged(state, 'mastery')).toBe(false);
  });
});

describe('unlockNotifications — mindTabHasUnacknowledgedSubtab', () => {
  test('false at P0 (no gated subtab is visible)', () => {
    const state = { prestigeCount: 0, tabBadgesDismissed: [] };
    expect(mindTabHasUnacknowledgedSubtab(state)).toBe(false);
  });

  test('true at P1 (patterns + diary visible, neither acknowledged)', () => {
    const state = { prestigeCount: 1, tabBadgesDismissed: [] };
    expect(mindTabHasUnacknowledgedSubtab(state)).toBe(true);
  });

  test('false at P1 once both freshly-visible subtabs are acknowledged', () => {
    const state = {
      prestigeCount: 1,
      tabBadgesDismissed: ['unlock:subtab:patterns', 'unlock:subtab:diary'],
    };
    expect(mindTabHasUnacknowledgedSubtab(state)).toBe(false);
  });

  test('true at P5 if mastery just appeared but patterns/diary already acked', () => {
    const state = {
      prestigeCount: 5,
      tabBadgesDismissed: ['unlock:subtab:patterns', 'unlock:subtab:diary'],
    };
    expect(mindTabHasUnacknowledgedSubtab(state)).toBe(true);
  });
});

describe('unlockNotifications — pendingUnlocks', () => {
  test('empty at P0 (no gated surface visible yet)', () => {
    expect(pendingUnlocks({ prestigeCount: 0, tabBadgesDismissed: [] })).toEqual([]);
  });

  test('returns regions tab + patterns + diary + cosmetics at P1 (full first-prestige bundle)', () => {
    const list = pendingUnlocks({ prestigeCount: 1, tabBadgesDismissed: [] });
    expect(list.map((u) => u.key)).toEqual([
      'unlock:tab:regions',
      'unlock:subtab:patterns',
      'unlock:subtab:diary',
      'unlock:cosmetics:store',
    ]);
  });

  test('tabs come before subtabs in the queue (toast priority order)', () => {
    const list = pendingUnlocks({ prestigeCount: 13, tabBadgesDismissed: [] });
    expect(list[0].kind).toBe('tab');
    expect(list[1].kind).toBe('subtab');
  });

  test('cosmetics surface comes last in the queue (after gameplay-surface unlocks)', () => {
    const list = pendingUnlocks({ prestigeCount: 1, tabBadgesDismissed: [] });
    expect(list[list.length - 1].kind).toBe('cosmetics');
  });

  test('acknowledged keys drop from the queue', () => {
    const list = pendingUnlocks({
      prestigeCount: 1,
      tabBadgesDismissed: ['unlock:tab:regions', 'unlock:subtab:patterns', 'unlock:cosmetics:store'],
    });
    expect(list.map((u) => u.key)).toEqual(['unlock:subtab:diary']);
  });
});

describe('unlockNotifications — cosmetics discovery (M-9)', () => {
  test('false at P0 (cosmetics gate is P1)', () => {
    expect(isCosmeticsDiscoveryUnacknowledged({ prestigeCount: 0, tabBadgesDismissed: [] })).toBe(false);
  });

  test('true at P1 with empty dismissed list', () => {
    expect(isCosmeticsDiscoveryUnacknowledged({ prestigeCount: 1, tabBadgesDismissed: [] })).toBe(true);
  });

  test('still true at P10+ (lifetime gate, not single-prestige)', () => {
    expect(isCosmeticsDiscoveryUnacknowledged({ prestigeCount: 25, tabBadgesDismissed: [] })).toBe(true);
  });

  test('false once acknowledged via COSMETICS_DISCOVERY_KEY', () => {
    expect(isCosmeticsDiscoveryUnacknowledged({
      prestigeCount: 5,
      tabBadgesDismissed: [COSMETICS_DISCOVERY_KEY],
    })).toBe(false);
  });
});
