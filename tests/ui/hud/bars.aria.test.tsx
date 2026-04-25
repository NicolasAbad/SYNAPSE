// @vitest-environment jsdom
// Sprint 10 Phase 10.5 — aria progressbar coverage on FocusBar +
// ConsciousnessBar, plus reducedMotion suppresses fill-transition.

import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { FocusBar } from '../../../src/ui/hud/FocusBar';
import { ConsciousnessBar } from '../../../src/ui/hud/ConsciousnessBar';
import { createDefaultState, useGameStore } from '../../../src/store/gameStore';

beforeEach(() => {
  useGameStore.setState(createDefaultState());
});

afterEach(() => {
  cleanup();
});

describe('FocusBar — aria-progressbar + reducedMotion', () => {
  test('renders role=progressbar with aria-valuenow + bounds', () => {
    useGameStore.setState({ focusBar: 0.42 });
    const { getByTestId } = render(<FocusBar />);
    const bar = getByTestId('hud-focus-bar');
    expect(bar.getAttribute('role')).toBe('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('42'); // 0.42 * 100, rounded
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
  });

  test('clamps focusBar to [0, 1] range for valuenow', () => {
    useGameStore.setState({ focusBar: 1.7 });
    const { getByTestId } = render(<FocusBar />);
    expect(getByTestId('hud-focus-bar').getAttribute('aria-valuenow')).toBe('100');
  });

  test('reducedMotion=false → fill has CSS transition', () => {
    useGameStore.setState({ reducedMotion: false });
    const { getByTestId } = render(<FocusBar />);
    const fill = getByTestId('hud-focus-bar-fill') as HTMLElement;
    expect(fill.style.transition).toContain('width');
  });

  test('reducedMotion=true → fill has transition: none', () => {
    useGameStore.setState({ reducedMotion: true });
    const { getByTestId } = render(<FocusBar />);
    const fill = getByTestId('hud-focus-bar-fill') as HTMLElement;
    expect(fill.style.transition).toBe('none');
  });
});

describe('ConsciousnessBar — aria-progressbar + reducedMotion', () => {
  test('renders progressbar attributes when unlocked', () => {
    useGameStore.setState({
      consciousnessBarUnlocked: true,
      cycleGenerated: 5_000,
      currentThreshold: 10_000,
    });
    const { getByTestId } = render(<ConsciousnessBar />);
    const bar = getByTestId('hud-consciousness-bar');
    expect(bar.getAttribute('role')).toBe('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('50');
  });

  test('reducedMotion=true → fill has transition: none', () => {
    useGameStore.setState({
      consciousnessBarUnlocked: true,
      cycleGenerated: 5_000,
      currentThreshold: 10_000,
      reducedMotion: true,
    });
    const { getByTestId } = render(<ConsciousnessBar />);
    const fill = getByTestId('hud-consciousness-bar-fill') as HTMLElement;
    expect(fill.style.transition).toBe('none');
  });
});
