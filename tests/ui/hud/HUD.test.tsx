// @vitest-environment jsdom
// Component tests for src/ui/hud/ — Phase 5 HUD sub-components.
// jsdom + @testing-library/react. Real-Chromium Vitest Browser Mode
// deferred — devDeps present (@vitest/browser + playwright) but no
// vitest config or npm script yet. Deferred to a future phase when
// setup cost is justified.

import { afterEach, describe, expect, test } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { HUD } from '../../../src/ui/hud/HUD';
import { ThoughtsCounter } from '../../../src/ui/hud/ThoughtsCounter';
import { RateCounter } from '../../../src/ui/hud/RateCounter';
import { DischargeCharges } from '../../../src/ui/hud/DischargeCharges';
import { FocusBar } from '../../../src/ui/hud/FocusBar';
import { ConsciousnessBar } from '../../../src/ui/hud/ConsciousnessBar';
import { DischargeButton } from '../../../src/ui/hud/DischargeButton';
import { TabBar } from '../../../src/ui/hud/TabBar';
import { useGameStore } from '../../../src/store/gameStore';

afterEach(() => {
  cleanup();
  useGameStore.getState().reset();
});

describe('HUD composition', () => {
  test('mounts all 7 sub-components under hud-root', () => {
    const { getByTestId, queryByTestId } = render(<HUD />);
    expect(getByTestId('hud-root')).toBeTruthy();
    expect(getByTestId('hud-thoughts')).toBeTruthy();
    expect(getByTestId('hud-rate')).toBeTruthy();
    expect(getByTestId('hud-charges')).toBeTruthy();
    expect(getByTestId('hud-focus-bar')).toBeTruthy();
    expect(getByTestId('hud-discharge-button')).toBeTruthy();
    expect(getByTestId('hud-tabbar')).toBeTruthy();
    // Consciousness bar is conditional — starts hidden at P0 default.
    expect(queryByTestId('hud-consciousness-bar')).toBeNull();
  });
});

describe('ThoughtsCounter', () => {
  test('renders formatted thoughts and the translated label', () => {
    useGameStore.setState({ thoughts: 1234 });
    const { getByTestId } = render(<ThoughtsCounter />);
    const el = getByTestId('hud-thoughts');
    expect(el.textContent).toContain('1.23K');
    expect(el.textContent).toContain('thoughts');
  });

  test('renders "0" when thoughts = 0', () => {
    useGameStore.setState({ thoughts: 0 });
    const { getByTestId } = render(<ThoughtsCounter />);
    expect(getByTestId('hud-thoughts').textContent).toContain('0');
  });

  test('floors fractional thoughts (no decimal leak)', () => {
    useGameStore.setState({ thoughts: 47.9 });
    const { getByTestId } = render(<ThoughtsCounter />);
    // 47.9 floored = 47; formatNumber(47) < 1K → "47"
    expect(getByTestId('hud-thoughts').textContent).toContain('47');
    expect(getByTestId('hud-thoughts').textContent).not.toContain('47.9');
  });
});

describe('RateCounter', () => {
  test('renders "+{N}/s" format', () => {
    useGameStore.setState({ effectiveProductionPerSecond: 2451 });
    const { getByTestId } = render(<RateCounter />);
    const text = getByTestId('hud-rate').textContent ?? '';
    expect(text).toContain('+');
    expect(text).toContain('/s');
    expect(text).toContain('2.45K');
  });

  test('renders "+0/s" when rate = 0', () => {
    useGameStore.setState({ effectiveProductionPerSecond: 0 });
    const { getByTestId } = render(<RateCounter />);
    expect(getByTestId('hud-rate').textContent).toBe('+0/s');
  });
});

describe('DischargeCharges', () => {
  test('renders dischargeMaxCharges pips, all empty when dischargeCharges=0', () => {
    useGameStore.setState({ dischargeCharges: 0, dischargeMaxCharges: 2 });
    const { getAllByTestId, queryAllByTestId } = render(<DischargeCharges />);
    expect(queryAllByTestId('hud-charge-filled')).toHaveLength(0);
    expect(getAllByTestId('hud-charge-empty')).toHaveLength(2);
  });

  test('fills pips from left up to dischargeCharges', () => {
    useGameStore.setState({ dischargeCharges: 1, dischargeMaxCharges: 3 });
    const { getAllByTestId } = render(<DischargeCharges />);
    expect(getAllByTestId('hud-charge-filled')).toHaveLength(1);
    expect(getAllByTestId('hud-charge-empty')).toHaveLength(2);
  });

  test('renders Discharge label prefix', () => {
    const { getByTestId } = render(<DischargeCharges />);
    expect(getByTestId('hud-charges').textContent).toContain('Discharge');
  });
});

describe('FocusBar', () => {
  test('renders empty fill (width 0%) when focusBar=0', () => {
    useGameStore.setState({ focusBar: 0 });
    const { getByTestId } = render(<FocusBar />);
    const fill = getByTestId('hud-focus-bar-fill');
    expect(fill.style.width).toBe('0%');
  });

  test('renders 75% fill at focusBar=0.75', () => {
    useGameStore.setState({ focusBar: 0.75 });
    const { getByTestId } = render(<FocusBar />);
    expect(getByTestId('hud-focus-bar-fill').style.width).toBe('75%');
  });

  test('clamps fill to 100% when focusBar overflows (Sprint 3 Cascade threshold)', () => {
    useGameStore.setState({ focusBar: 1.5 });
    const { getByTestId } = render(<FocusBar />);
    expect(getByTestId('hud-focus-bar-fill').style.width).toBe('100%');
  });
});

describe('ConsciousnessBar', () => {
  test('renders null when consciousnessBarUnlocked=false (default)', () => {
    useGameStore.setState({ consciousnessBarUnlocked: false });
    const { queryByTestId } = render(<ConsciousnessBar />);
    expect(queryByTestId('hud-consciousness-bar')).toBeNull();
  });

  test('renders with fill proportional to cycleGenerated/currentThreshold when unlocked', () => {
    useGameStore.setState({
      consciousnessBarUnlocked: true,
      cycleGenerated: 25_000,
      currentThreshold: 50_000,
    });
    const { getByTestId } = render(<ConsciousnessBar />);
    expect(getByTestId('hud-consciousness-bar-fill').style.height).toBe('50%');
  });

  test('handles currentThreshold=0 without divide-by-zero', () => {
    useGameStore.setState({
      consciousnessBarUnlocked: true,
      cycleGenerated: 1000,
      currentThreshold: 0,
    });
    const { getByTestId } = render(<ConsciousnessBar />);
    expect(getByTestId('hud-consciousness-bar-fill').style.height).toBe('0%');
  });
});

describe('DischargeButton (Sprint 3 Phase 6 wiring)', () => {
  test('renders disabled button with translated label when no charges', () => {
    useGameStore.setState({ dischargeCharges: 0 });
    const { getByTestId } = render(<DischargeButton />);
    const btn = getByTestId('hud-discharge-button') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.textContent).toContain('DISCHARGE');
  });

  test('renders enabled button when charges > 0', () => {
    useGameStore.setState({ dischargeCharges: 1 });
    const { getByTestId } = render(<DischargeButton />);
    const btn = getByTestId('hud-discharge-button') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  test('firing Discharge consumes a charge and increments counters', () => {
    useGameStore.setState({
      dischargeCharges: 2,
      effectiveProductionPerSecond: 100,
      isTutorialCycle: false,
      cycleDischargesUsed: 0,
      lifetimeDischarges: 0,
    });
    const { getByTestId } = render(<DischargeButton />);
    fireEvent.pointerDown(getByTestId('hud-discharge-button'));
    const s = useGameStore.getState();
    expect(s.dischargeCharges).toBe(1);
    expect(s.cycleDischargesUsed).toBe(1);
    expect(s.lifetimeDischarges).toBe(1);
  });
});

describe('TabBar', () => {
  test('renders 4 tabs with translated labels', () => {
    const { getByTestId } = render(<TabBar />);
    expect(getByTestId('hud-tab-mind').textContent).toBe('Mind');
    expect(getByTestId('hud-tab-neurons').textContent).toBe('Neurons');
    expect(getByTestId('hud-tab-upgrades').textContent).toBe('Upgrades');
    expect(getByTestId('hud-tab-regions').textContent).toBe('Regions');
  });

  test('Mind is active by default (activeTab=mind)', () => {
    const { getByTestId } = render(<TabBar />);
    expect(getByTestId('hud-tab-mind').dataset.active).toBe('true');
    expect(getByTestId('hud-tab-neurons').dataset.active).toBe('false');
  });

  test('clicking a tab updates activeTab in the store and visual state', () => {
    const { getByTestId } = render(<TabBar />);
    fireEvent.pointerDown(getByTestId('hud-tab-neurons'));
    expect(useGameStore.getState().activeTab).toBe('neurons');
    expect(getByTestId('hud-tab-neurons').dataset.active).toBe('true');
    expect(getByTestId('hud-tab-mind').dataset.active).toBe('false');
  });

  test('tab buttons meet CODE-4 touch target minimum (48px)', () => {
    const { getByTestId } = render(<TabBar />);
    for (const tab of ['mind', 'neurons', 'upgrades', 'regions'] as const) {
      const btn = getByTestId(`hud-tab-${tab}`) as HTMLButtonElement;
      expect(btn.style.minHeight).toBe('48px');
    }
  });

  test('UI-3: exactly one active tab at any time (max 1 visual badge equivalent)', () => {
    const store = useGameStore.getState();
    const tabs = ['mind', 'neurons', 'upgrades', 'regions'] as const;
    for (const tab of tabs) {
      store.setActiveTab(tab);
      const { getByTestId, unmount } = render(<TabBar />);
      const activeCount = tabs.filter(
        (t) => getByTestId(`hud-tab-${t}`).dataset.active === 'true',
      ).length;
      expect(activeCount).toBe(1);
      unmount();
    }
  });
});

describe('Store: activeTab UI-local integration', () => {
  test('default activeTab is "mind"', () => {
    expect(useGameStore.getState().activeTab).toBe('mind');
  });

  test('setActiveTab updates the store', () => {
    useGameStore.getState().setActiveTab('upgrades');
    expect(useGameStore.getState().activeTab).toBe('upgrades');
  });

  test('reset() restores activeTab to "mind"', () => {
    useGameStore.getState().setActiveTab('regions');
    useGameStore.getState().reset();
    expect(useGameStore.getState().activeTab).toBe('mind');
  });
});
