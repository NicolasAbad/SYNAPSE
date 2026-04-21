// @vitest-environment jsdom
// Tests for src/ui/hud/AwakeningFlow.tsx (Sprint 4a Phase 4a.5).
// End-to-end flow: button appears at threshold → confirm modal → fire
// prestige action → AwakeningScreen → Continue dismisses it.

import { afterEach, describe, expect, test } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { AwakeningFlow } from '../../../src/ui/hud/AwakeningFlow';
import { useGameStore } from '../../../src/store/gameStore';

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
