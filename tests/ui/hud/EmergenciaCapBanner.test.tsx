// @vitest-environment jsdom
// Sprint 3 Phase 7.3 — Emergencia Cognitiva cap banner (Phase 3.5 audit Part 2 Risk #3).

import { afterEach, describe, expect, test } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { EmergenciaCapBanner } from '../../../src/ui/hud/EmergenciaCapBanner';
import { useGameStore } from '../../../src/store/gameStore';
import { UPGRADES, UPGRADES_BY_ID } from '../../../src/config/upgrades';
import type { UpgradeState } from '../../../src/types';

afterEach(() => {
  cleanup();
  useGameStore.getState().reset();
});

/**
 * Build a `state.upgrades` list of `count` purchased upgrades. If
 * `includeEmergencia === true`, Emergencia Cognitiva is always one of
 * them (inserted first). Extras come from UPGRADES in order; stops once
 * `count` is reached.
 */
function buildUpgradeList(count: number, includeEmergencia: boolean): UpgradeState[] {
  const ids = new Set<string>();
  if (includeEmergencia) ids.add('emergencia_cognitiva');
  for (const def of UPGRADES) {
    if (ids.size >= count) break;
    if (def.id === 'emergencia_cognitiva') continue;
    ids.add(def.id);
  }
  return [...ids].map((id) => ({ id, purchased: true, purchasedAt: 0 }));
}

describe('EmergenciaCapBanner — visibility', () => {
  test('does NOT render when Emergencia is NOT owned (even at cap-equivalent count)', () => {
    // 20 upgrades owned but none is emergencia_cognitiva → banner dormant.
    const { queryByTestId } = render(<EmergenciaCapBanner />);
    act(() => {
      useGameStore.setState({ upgrades: buildUpgradeList(20, /* includeEmergencia */ false) });
    });
    expect(queryByTestId('hud-emergencia-cap-banner')).toBeNull();
  });

  test('does NOT render while below cap (owns Emergencia + only 15 upgrades)', () => {
    const def = UPGRADES_BY_ID['emergencia_cognitiva']!;
    if (def.effect.kind !== 'upgrades_scaling_mult') throw new Error('fixture out of sync');
    const { perBucket, bucketSize, capMult } = def.effect;
    // Choose count such that perBucket^buckets < capMult.
    // 15 / 5 = 3 buckets → 1.5^3 = 3.375 < 5 ✓
    expect(Math.pow(perBucket, Math.floor(15 / bucketSize))).toBeLessThan(capMult);
    const { queryByTestId } = render(<EmergenciaCapBanner />);
    act(() => {
      useGameStore.setState({ upgrades: buildUpgradeList(15, /* includeEmergencia */ true) });
    });
    expect(queryByTestId('hud-emergencia-cap-banner')).toBeNull();
  });

  test('renders when Emergencia owned + cap reached (20 upgrades)', () => {
    // 20 / 5 = 4 buckets → 1.5^4 = 5.0625 >= capMult (5). Cap engaged.
    const { queryByTestId } = render(<EmergenciaCapBanner />);
    act(() => {
      useGameStore.setState({ upgrades: buildUpgradeList(20, /* includeEmergencia */ true) });
    });
    const banner = queryByTestId('hud-emergencia-cap-banner');
    expect(banner).not.toBeNull();
    expect(banner?.textContent).toBe('Max bonus reached — other upgrades keep scaling');
  });
});

describe('EmergenciaCapBanner — dismiss + re-show', () => {
  test('dismisses on pointerdown and stays dismissed this cycle', () => {
    const { queryByTestId, getByTestId } = render(<EmergenciaCapBanner />);
    act(() => {
      useGameStore.setState({ upgrades: buildUpgradeList(20, true) });
    });
    expect(queryByTestId('hud-emergencia-cap-banner')).not.toBeNull();
    act(() => {
      fireEvent.pointerDown(getByTestId('hud-emergencia-cap-banner'));
    });
    expect(queryByTestId('hud-emergencia-cap-banner')).toBeNull();
    // Adding more upgrades in the SAME cycle (prestigeCount unchanged)
    // must not re-surface the banner.
    act(() => {
      useGameStore.setState({ upgrades: buildUpgradeList(25, true) });
    });
    expect(queryByTestId('hud-emergencia-cap-banner')).toBeNull();
  });

  test('re-surfaces after prestige (new prestigeCount) if cap re-reached', () => {
    const { queryByTestId, getByTestId } = render(<EmergenciaCapBanner />);
    act(() => {
      useGameStore.setState({ upgrades: buildUpgradeList(20, true), prestigeCount: 6 });
    });
    act(() => {
      fireEvent.pointerDown(getByTestId('hud-emergencia-cap-banner'));
    });
    expect(queryByTestId('hud-emergencia-cap-banner')).toBeNull();
    // Next prestige: bump prestigeCount; upgrades still populated (test
    // proxy — in real game PRESTIGE_RESET would clear them, but we only
    // care that the banner reacts to the prestigeCount change).
    act(() => {
      useGameStore.setState({ prestigeCount: 7 });
    });
    expect(queryByTestId('hud-emergencia-cap-banner')).not.toBeNull();
  });
});
