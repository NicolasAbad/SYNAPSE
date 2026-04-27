// @vitest-environment jsdom
// Sprint 3.6.3 — UpgradesPanel sort + purchase + COST-1 reduction display.

import { afterEach, describe, expect, test } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { UpgradesPanel } from '../../../src/ui/panels/UpgradesPanel';
import { useGameStore } from '../../../src/store/gameStore';
import { UPGRADES_BY_ID } from '../../../src/config/upgrades';
import { SYNAPSE_CONSTANTS } from '../../../src/config/constants';

afterEach(() => {
  cleanup();
  useGameStore.getState().reset();
});

describe('UpgradesPanel — rendering + sections', () => {
  test('renders the title', () => {
    const { queryByTestId } = render(<UpgradesPanel />);
    expect(queryByTestId('panel-upgrades-title')?.textContent).toBe('Upgrades');
  });

  test('P0 default: affordable empty, teaser populated, locked HIDDEN (Dimension M M-4)', () => {
    const { queryByTestId } = render(<UpgradesPanel />);
    // Default thoughts=0, so no upgrade is affordable.
    expect(queryByTestId('panel-upgrades-section-affordable')).toBeNull();
    expect(queryByTestId('panel-upgrades-section-teaser')).not.toBeNull();
    // Pre-launch audit M-4: Locked section hidden entirely at P0 to keep
    // the start state sparse. Reveals at P1+ capped to next 3 unlocks.
    expect(queryByTestId('panel-upgrades-section-locked')).toBeNull();
  });

  test('P1+: locked section appears, capped to LOCKED_TEASER_LIMIT (3) lowest-prestige rows', () => {
    useGameStore.setState({ prestigeCount: 1 });
    const { queryByTestId, queryAllByTestId } = render(<UpgradesPanel />);
    expect(queryByTestId('panel-upgrades-section-locked')).not.toBeNull();
    // Cap at 3 rows (audit M-4 LOCKED_TEASER_LIMIT).
    const lockedRows = queryAllByTestId(/^panel-upgrades-row-/).filter(
      (el) => el.getAttribute('data-section') === 'locked',
    );
    expect(lockedRows.length).toBeLessThanOrEqual(3);
  });

  test('seeding enough thoughts promotes the cheapest P0 upgrade into Affordable', () => {
    // Cheapest P0-unlock thought-cost upgrade is red_neuronal_densa at 3_000.
    useGameStore.setState({ thoughts: 5_000 });
    const { queryByTestId } = render(<UpgradesPanel />);
    expect(queryByTestId('panel-upgrades-section-affordable')).not.toBeNull();
    expect(queryByTestId('panel-upgrades-row-red_neuronal_densa')?.getAttribute('data-section')).toBe('affordable');
  });

  test('P1+: P-gated upgrades appear in the Locked section with silhouette', () => {
    // Need P1 to see Locked section + need a P-gated upgrade in the lowest-3.
    useGameStore.setState({ prestigeCount: 1 });
    const { queryByTestId, queryAllByTestId } = render(<UpgradesPanel />);
    const lockedRows = queryAllByTestId(/^panel-upgrades-row-/).filter(
      (el) => el.getAttribute('data-section') === 'locked',
    );
    // The 3 lowest-prestige Locked teasers are dopamina (P2),
    // potencial_sinaptico_2 (P3), and ondas_alpha (P4) — sort order by
    // unlockPrestige ascending. Just assert at least one is present
    // and renders silhouette + unlock text.
    expect(lockedRows.length).toBeGreaterThan(0);
    const firstLocked = lockedRows[0];
    expect(firstLocked.textContent).toContain('???');
    // Sanity: each rendered row has its data-section set to 'locked'.
    for (const r of lockedRows) {
      expect(r.getAttribute('data-section')).toBe('locked');
    }
    // The original test pinned potencial_latente (P10) — at P1 with cap=3
    // that high-prestige row is hidden. Verify it's NOT in the visible set.
    expect(queryByTestId('panel-upgrades-row-potencial_latente')).toBeNull();
  });

  test('owned upgrades are hidden from the panel', () => {
    // Purchase red_neuronal_densa manually.
    useGameStore.setState({
      upgrades: [{ id: 'red_neuronal_densa', purchased: true, purchasedAt: 0 }],
    });
    const { queryByTestId } = render(<UpgradesPanel />);
    expect(queryByTestId('panel-upgrades-row-red_neuronal_densa')).toBeNull();
  });
});

describe('UpgradesPanel — buy action', () => {
  test('clicking an affordable upgrade calls buyUpgrade and decrements thoughts', () => {
    const baseCost = UPGRADES_BY_ID['red_neuronal_densa']!.cost;
    useGameStore.setState({ thoughts: baseCost * 2 });
    const { getByTestId } = render(<UpgradesPanel />);
    act(() => {
      fireEvent.pointerDown(getByTestId('panel-upgrades-buy-red_neuronal_densa'));
    });
    const s = useGameStore.getState();
    expect(s.upgrades.some((u) => u.id === 'red_neuronal_densa' && u.purchased)).toBe(true);
    expect(s.thoughts).toBe(baseCost * 2 - baseCost);
  });

  test('teaser-row button disabled; click is no-op', () => {
    // Thoughts = 0 → no upgrade affordable → red_neuronal_densa is in Teaser.
    const { queryByTestId, getByTestId } = render(<UpgradesPanel />);
    const row = queryByTestId('panel-upgrades-row-red_neuronal_densa');
    expect(row?.getAttribute('data-section')).toBe('teaser');
    const btn = getByTestId('panel-upgrades-buy-red_neuronal_densa') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    act(() => {
      fireEvent.pointerDown(btn);
    });
    expect(useGameStore.getState().upgrades.length).toBe(0);
  });
});

describe('UpgradesPanel — COST-1 Funciones Ejecutivas cost reduction', () => {
  test('with Funciones Ejecutivas owned, thought-cost upgrades show reduced cost', () => {
    const baseCost = UPGRADES_BY_ID['ltp_potenciacion_larga']!.cost; // 2_000_000 thoughts
    const reducedCost = baseCost * (1 - 0.20); // 1_600_000
    // Seed: enough thoughts for the REDUCED cost but less than baseCost.
    useGameStore.setState({
      thoughts: reducedCost + 1,
      prestigeCount: 3, // so ltp_potenciacion_larga is unlocked (unlockPrestige: 3)
      upgrades: [{ id: 'funciones_ejecutivas', purchased: true, purchasedAt: 0 }],
      memories: SYNAPSE_CONSTANTS.baseOfflineCapHours, // arbitrary non-zero so no unrelated bugs
    });
    const { queryByTestId } = render(<UpgradesPanel />);
    const row = queryByTestId('panel-upgrades-row-ltp_potenciacion_larga');
    expect(row).not.toBeNull();
    expect(row?.getAttribute('data-section')).toBe('affordable');
    // Display should show reduced cost, not base.
    expect(row?.textContent).toContain('1.6M');
    expect(row?.textContent).not.toContain('2M');
  });
});
