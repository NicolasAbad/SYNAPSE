// @vitest-environment jsdom
// Tests for src/ui/hud/AwakeningFlow.tsx — end-to-end prestige flow.
// Sprint 4a Phase 4a.5 shipped steps 1-4 (button → confirm → action → screen).
// Sprint 4c Phase 4c.4 extends with step 5 (post-Awakening CycleSetupScreen
// when P3+) and the pre-P3 skip path.

import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { AwakeningFlow } from '../../../src/ui/hud/AwakeningFlow';
import { useGameStore } from '../../../src/store/gameStore';

// CycleSetupScreen uses matchMedia via useIsTabletWidth. jsdom lacks it.
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: true, // columns layout (tablet)
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => {
  cleanup();
  useGameStore.getState().reset();
});

describe('AwakeningFlow — button visibility gate', () => {
  test('button hidden when cycleGenerated < currentThreshold', () => {
    useGameStore.setState({ cycleGenerated: 1000, currentThreshold: 25_000 });
    const { queryByTestId } = render(<AwakeningFlow />);
    expect(queryByTestId('hud-awakening-button')).toBeNull();
  });

  test('button visible when cycleGenerated >= currentThreshold', () => {
    useGameStore.setState({ cycleGenerated: 25_000, currentThreshold: 25_000 });
    const { getByTestId } = render(<AwakeningFlow />);
    expect(getByTestId('hud-awakening-button')).toBeTruthy();
  });
});

describe('AwakeningFlow — confirm flow', () => {
  test('clicking ready button opens the confirm modal', () => {
    useGameStore.setState({ cycleGenerated: 25_000, currentThreshold: 25_000 });
    const { getByTestId, queryByTestId } = render(<AwakeningFlow />);
    expect(queryByTestId('awakening-confirm-root')).toBeNull();
    fireEvent.pointerDown(getByTestId('hud-awakening-button'));
    expect(getByTestId('awakening-confirm-root')).toBeTruthy();
  });

  test('cancel dismisses the modal without prestiging', () => {
    useGameStore.setState({
      cycleGenerated: 25_000,
      currentThreshold: 25_000,
      prestigeCount: 0,
      isTutorialCycle: true,
    });
    const { getByTestId, queryByTestId } = render(<AwakeningFlow />);
    fireEvent.pointerDown(getByTestId('hud-awakening-button'));
    fireEvent.pointerDown(getByTestId('awakening-confirm-cancel'));
    expect(queryByTestId('awakening-confirm-root')).toBeNull();
    // State untouched.
    expect(useGameStore.getState().prestigeCount).toBe(0);
    expect(useGameStore.getState().isTutorialCycle).toBe(true);
    // Ready button re-appears.
    expect(getByTestId('hud-awakening-button')).toBeTruthy();
  });

  test('confirm fires prestige action and shows the Awakening screen', () => {
    useGameStore.setState({
      cycleGenerated: 25_000,
      currentThreshold: 25_000,
      prestigeCount: 0,
      isTutorialCycle: true,
      effectiveProductionPerSecond: 50,
    });
    const { getByTestId, queryByTestId } = render(<AwakeningFlow />);
    fireEvent.pointerDown(getByTestId('hud-awakening-button'));
    fireEvent.pointerDown(getByTestId('awakening-confirm-confirm'));
    // Modal dismissed + screen appears + state prestiged.
    expect(queryByTestId('awakening-confirm-root')).toBeNull();
    expect(getByTestId('awakening-screen-root')).toBeTruthy();
    expect(useGameStore.getState().prestigeCount).toBe(1);
    expect(useGameStore.getState().isTutorialCycle).toBe(false);
  });

  test('Continue dismisses the Awakening screen', () => {
    useGameStore.setState({
      cycleGenerated: 25_000,
      currentThreshold: 25_000,
      effectiveProductionPerSecond: 50,
    });
    const { getByTestId, queryByTestId } = render(<AwakeningFlow />);
    fireEvent.pointerDown(getByTestId('hud-awakening-button'));
    fireEvent.pointerDown(getByTestId('awakening-confirm-confirm'));
    fireEvent.pointerDown(getByTestId('awakening-screen-continue'));
    expect(queryByTestId('awakening-screen-root')).toBeNull();
  });

  test('ready button is hidden while the Awakening screen is up', () => {
    useGameStore.setState({
      cycleGenerated: 25_000,
      currentThreshold: 25_000,
      effectiveProductionPerSecond: 50,
    });
    const { getByTestId, queryByTestId } = render(<AwakeningFlow />);
    fireEvent.pointerDown(getByTestId('hud-awakening-button'));
    fireEvent.pointerDown(getByTestId('awakening-confirm-confirm'));
    // Post-prestige currentThreshold is 450_000, cycleGenerated is momentumBonus
    // (1500 in this config), so ready is naturally false anyway. But explicitly
    // asserting the button isn't shown while AwakeningScreen is visible:
    expect(queryByTestId('hud-awakening-button')).toBeNull();
    expect(getByTestId('awakening-screen-root')).toBeTruthy();
  });
});

describe('AwakeningFlow — post-Awakening CycleSetupScreen (Sprint 4c.4)', () => {
  test('pre-P3 path: Awakening Continue closes flow; NO CycleSetupScreen', () => {
    useGameStore.setState({
      cycleGenerated: 25_000,
      currentThreshold: 25_000,
      prestigeCount: 0, // post-prestige will become 1 — still below 3
      effectiveProductionPerSecond: 50,
    });
    const { getByTestId, queryByTestId } = render(<AwakeningFlow />);
    fireEvent.pointerDown(getByTestId('hud-awakening-button'));
    fireEvent.pointerDown(getByTestId('awakening-confirm-confirm'));
    fireEvent.pointerDown(getByTestId('awakening-screen-continue'));
    expect(queryByTestId('cycle-setup-screen')).toBeNull();
    expect(queryByTestId('awakening-screen-root')).toBeNull();
  });

  test('P3+ path: Awakening Continue opens CycleSetupScreen with polarity slot', () => {
    useGameStore.setState({
      cycleGenerated: 25_000,
      currentThreshold: 25_000,
      prestigeCount: 3, // post-prestige → 4, polarity unlock met
      effectiveProductionPerSecond: 50,
    });
    const { getByTestId } = render(<AwakeningFlow />);
    fireEvent.pointerDown(getByTestId('hud-awakening-button'));
    fireEvent.pointerDown(getByTestId('awakening-confirm-confirm'));
    fireEvent.pointerDown(getByTestId('awakening-screen-continue'));
    expect(getByTestId('cycle-setup-screen')).toBeTruthy();
    expect(getByTestId('cycle-setup-slot-polarity')).toBeTruthy();
  });

  test('P3+ path: Continue button on CycleSetupScreen fires setPolarity + dismisses', () => {
    useGameStore.setState({
      cycleGenerated: 25_000,
      currentThreshold: 25_000,
      prestigeCount: 3,
      effectiveProductionPerSecond: 50,
    });
    const { getByTestId, queryByTestId } = render(<AwakeningFlow />);
    fireEvent.pointerDown(getByTestId('hud-awakening-button'));
    fireEvent.pointerDown(getByTestId('awakening-confirm-confirm'));
    fireEvent.pointerDown(getByTestId('awakening-screen-continue'));
    fireEvent.pointerDown(getByTestId('cycle-setup-polarity-excitatory'));
    fireEvent.pointerDown(getByTestId('cycle-setup-continue'));
    expect(queryByTestId('cycle-setup-screen')).toBeNull();
    expect(useGameStore.getState().currentPolarity).toBe('excitatory');
  });

  test('POLAR-1: CycleSetupScreen pre-selects last cycle polarity from lastCycleConfig', () => {
    useGameStore.setState({
      cycleGenerated: 25_000,
      currentThreshold: 25_000,
      prestigeCount: 3,
      effectiveProductionPerSecond: 50,
      currentPolarity: 'inhibitory', // last cycle's choice; handlePrestige snapshots → lastCycleConfig
    });
    const { getByTestId } = render(<AwakeningFlow />);
    fireEvent.pointerDown(getByTestId('hud-awakening-button'));
    fireEvent.pointerDown(getByTestId('awakening-confirm-confirm'));
    fireEvent.pointerDown(getByTestId('awakening-screen-continue'));
    // inhibitory card is pre-selected per POLAR-1 lastCycleConfig default.
    expect(getByTestId('cycle-setup-polarity-inhibitory').dataset.selected).toBe('true');
    expect(getByTestId('cycle-setup-polarity-excitatory').dataset.selected).toBe('false');
  });

  test('SAME AS LAST fast-path: 1-tap skip applies lastCycleConfig polarity + dismisses', () => {
    useGameStore.setState({
      cycleGenerated: 25_000,
      currentThreshold: 25_000,
      prestigeCount: 3,
      effectiveProductionPerSecond: 50,
      currentPolarity: 'excitatory',
    });
    const { getByTestId, queryByTestId } = render(<AwakeningFlow />);
    fireEvent.pointerDown(getByTestId('hud-awakening-button'));
    fireEvent.pointerDown(getByTestId('awakening-confirm-confirm'));
    fireEvent.pointerDown(getByTestId('awakening-screen-continue'));
    fireEvent.pointerDown(getByTestId('cycle-setup-same-as-last'));
    expect(queryByTestId('cycle-setup-screen')).toBeNull();
    expect(useGameStore.getState().currentPolarity).toBe('excitatory');
  });
});
