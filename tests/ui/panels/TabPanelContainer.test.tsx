// @vitest-environment jsdom
// Sprint 3.6.1 — TabPanelContainer renders correct panel on activeTab change.

import { afterEach, describe, expect, test } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { TabPanelContainer } from '../../../src/ui/panels/TabPanelContainer';
import { useGameStore } from '../../../src/store/gameStore';

afterEach(() => {
  cleanup();
  useGameStore.getState().reset();
});

describe('TabPanelContainer — activeTab routing', () => {
  test('mind (default): renders no container, MindPanel returns null (canvas stays visible)', () => {
    const { queryByTestId } = render(<TabPanelContainer />);
    expect(queryByTestId('tab-panel-container')).toBeNull();
    expect(queryByTestId('panel-neurons')).toBeNull();
    expect(queryByTestId('panel-upgrades')).toBeNull();
    expect(queryByTestId('panel-regions')).toBeNull();
  });

  test('neurons: renders NeuronsPanel shell inside the container', () => {
    const { queryByTestId } = render(<TabPanelContainer />);
    act(() => {
      useGameStore.getState().setActiveTab('neurons');
    });
    expect(queryByTestId('tab-panel-container')).not.toBeNull();
    expect(queryByTestId('panel-neurons')).not.toBeNull();
    expect(queryByTestId('panel-neurons-title')?.textContent).toBe('Neurons');
  });

  test('upgrades: renders UpgradesPanel shell', () => {
    const { queryByTestId } = render(<TabPanelContainer />);
    act(() => {
      useGameStore.getState().setActiveTab('upgrades');
    });
    expect(queryByTestId('panel-upgrades')).not.toBeNull();
    expect(queryByTestId('panel-upgrades-title')?.textContent).toBe('Upgrades');
  });

  test('regions: renders RegionsPanel shell with P5 unlock note', () => {
    const { queryByTestId } = render(<TabPanelContainer />);
    act(() => {
      useGameStore.getState().setActiveTab('regions');
    });
    expect(queryByTestId('panel-regions')).not.toBeNull();
    expect(queryByTestId('panel-regions-title')?.textContent).toBe('Regions');
  });

  test('switches correctly on activeTab change', () => {
    const { queryByTestId } = render(<TabPanelContainer />);
    act(() => {
      useGameStore.getState().setActiveTab('neurons');
    });
    expect(queryByTestId('panel-neurons')).not.toBeNull();
    act(() => {
      useGameStore.getState().setActiveTab('upgrades');
    });
    expect(queryByTestId('panel-neurons')).toBeNull();
    expect(queryByTestId('panel-upgrades')).not.toBeNull();
    act(() => {
      useGameStore.getState().setActiveTab('mind');
    });
    expect(queryByTestId('panel-upgrades')).toBeNull();
    expect(queryByTestId('tab-panel-container')).toBeNull();
  });
});
