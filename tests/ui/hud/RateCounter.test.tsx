// @vitest-environment jsdom
// Pre-launch audit Tier 2 (A-3) — RateCounter anti-spam badge tests.

import { describe, expect, test, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { RateCounter } from '../../../src/ui/hud/RateCounter';
import { useGameStore, createDefaultState } from '../../../src/store/gameStore';

beforeEach(() => {
  useGameStore.setState(createDefaultState());
});

describe('RateCounter — base render', () => {
  test('renders rate value with prefix + suffix', () => {
    useGameStore.setState({ effectiveProductionPerSecond: 42 });
    const { getByTestId } = render(<RateCounter />);
    expect(getByTestId('hud-rate').textContent).toContain('+42');
    expect(getByTestId('hud-rate').textContent).toContain('/s');
  });
});

describe('RateCounter — A-3 anti-spam badge', () => {
  test('badge hidden when antiSpamActive=false (default)', () => {
    const { queryByTestId } = render(<RateCounter />);
    expect(queryByTestId('hud-rate-anti-spam-badge')).toBeNull();
  });

  test('badge appears when antiSpamActive=true', () => {
    useGameStore.setState({ antiSpamActive: true });
    const { getByTestId } = render(<RateCounter />);
    const badge = getByTestId('hud-rate-anti-spam-badge');
    expect(badge.textContent).toBe('×0.1');
  });

  test('badge has accessible label explaining the penalty', () => {
    useGameStore.setState({ antiSpamActive: true });
    const { getByTestId } = render(<RateCounter />);
    const badge = getByTestId('hud-rate-anti-spam-badge');
    expect(badge.getAttribute('aria-label')).toMatch(/effectiveness/i);
  });

  test('badge clears when antiSpamActive flips false', () => {
    useGameStore.setState({ antiSpamActive: true });
    const { queryByTestId, rerender } = render(<RateCounter />);
    expect(queryByTestId('hud-rate-anti-spam-badge')).not.toBeNull();
    useGameStore.setState({ antiSpamActive: false });
    rerender(<RateCounter />);
    expect(queryByTestId('hud-rate-anti-spam-badge')).toBeNull();
  });
});
