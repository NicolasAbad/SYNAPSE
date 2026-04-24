// @vitest-environment jsdom
// Sprint 9b Phase 9b.4 — StarterPackModal tests.

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { StarterPackModal } from '../../../src/ui/modals/StarterPackModal';
import { useGameStore } from '../../../src/store/gameStore';

beforeEach(() => useGameStore.getState().reset());
afterEach(() => { cleanup(); useGameStore.getState().reset(); });

describe('StarterPackModal — visibility gates', () => {
  test('does not render when open=false', () => {
    useGameStore.setState({ prestigeCount: 5 });
    const { queryByTestId } = render(<StarterPackModal open={false} onClose={() => {}} />);
    expect(queryByTestId('starter-pack-modal')).toBeNull();
  });

  test('does not render before P2', () => {
    useGameStore.setState({ prestigeCount: 1 });
    const { queryByTestId } = render(<StarterPackModal open={true} onClose={() => {}} />);
    expect(queryByTestId('starter-pack-modal')).toBeNull();
  });

  test('renders at P2+ when not purchased + not dismissed', () => {
    useGameStore.setState({ prestigeCount: 2 });
    const { getByTestId } = render(<StarterPackModal open={true} onClose={() => {}} />);
    expect(getByTestId('starter-pack-modal')).toBeDefined();
    expect(getByTestId('starter-pack-title')).toBeDefined();
    expect(getByTestId('starter-pack-bundle')).toBeDefined();
  });

  test('does not render after purchase', () => {
    useGameStore.setState({ prestigeCount: 3, starterPackPurchased: true });
    const { queryByTestId } = render(<StarterPackModal open={true} onClose={() => {}} />);
    expect(queryByTestId('starter-pack-modal')).toBeNull();
  });

  test('does not render after dismissal', () => {
    useGameStore.setState({ prestigeCount: 3, starterPackDismissed: true });
    const { queryByTestId } = render(<StarterPackModal open={true} onClose={() => {}} />);
    expect(queryByTestId('starter-pack-modal')).toBeNull();
  });
});

describe('StarterPackModal — interactions', () => {
  beforeEach(() => useGameStore.setState({ prestigeCount: 3 }));

  test('Accept button calls acceptStarterPack + onClose', () => {
    const onClose = vi.fn();
    const { getByTestId } = render(<StarterPackModal open={true} onClose={onClose} />);
    fireEvent.click(getByTestId('starter-pack-accept'));
    expect(useGameStore.getState().starterPackPurchased).toBe(true);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('Dismiss button calls dismissStarterPack + onClose', () => {
    const onClose = vi.fn();
    const { getByTestId } = render(<StarterPackModal open={true} onClose={onClose} />);
    fireEvent.click(getByTestId('starter-pack-dismiss'));
    expect(useGameStore.getState().starterPackDismissed).toBe(true);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('stamps starterPackExpiresAt on first open', () => {
    expect(useGameStore.getState().starterPackExpiresAt).toBe(0);
    render(<StarterPackModal open={true} onClose={() => {}} />);
    expect(useGameStore.getState().starterPackExpiresAt).toBeGreaterThan(0);
  });
});
