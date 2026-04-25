// @vitest-environment jsdom
// Sprint 10 Phase 10.5 — useAccessibilityRuntime hook tests.
// Validates: highContrast toggles data-high-contrast attribute on documentElement;
// fontSize sets a root font-size that maps to 0.85em / 1em / 1.15em.

import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { useAccessibilityRuntime } from '../../src/platform/useAccessibilityRuntime';
import { createDefaultState, useGameStore } from '../../src/store/gameStore';

function Harness(): null { useAccessibilityRuntime(); return null; }

beforeEach(() => {
  useGameStore.setState(createDefaultState());
  document.documentElement.removeAttribute('data-high-contrast');
  document.documentElement.style.fontSize = '';
});

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute('data-high-contrast');
  document.documentElement.style.fontSize = '';
});

describe('useAccessibilityRuntime — highContrast', () => {
  test('does NOT set attribute when highContrast=false (default)', () => {
    render(<Harness />);
    expect(document.documentElement.getAttribute('data-high-contrast')).toBeNull();
  });

  test('sets data-high-contrast="true" when highContrast=true', () => {
    useGameStore.setState({ highContrast: true });
    render(<Harness />);
    expect(document.documentElement.getAttribute('data-high-contrast')).toBe('true');
  });

  test('toggles attribute on/off as state changes', () => {
    render(<Harness />);
    expect(document.documentElement.getAttribute('data-high-contrast')).toBeNull();
    act(() => { useGameStore.getState().setHighContrast(true); });
    expect(document.documentElement.getAttribute('data-high-contrast')).toBe('true');
    act(() => { useGameStore.getState().setHighContrast(false); });
    expect(document.documentElement.getAttribute('data-high-contrast')).toBeNull();
  });
});

describe('useAccessibilityRuntime — fontSize', () => {
  test('default medium → 1em on root', () => {
    render(<Harness />);
    expect(document.documentElement.style.fontSize).toBe('1em');
  });

  test('small → 0.85em', () => {
    useGameStore.setState({ fontSize: 'small' });
    render(<Harness />);
    expect(document.documentElement.style.fontSize).toBe('0.85em');
  });

  test('large → 1.15em', () => {
    useGameStore.setState({ fontSize: 'large' });
    render(<Harness />);
    expect(document.documentElement.style.fontSize).toBe('1.15em');
  });

  test('responds to setFontSize action', () => {
    render(<Harness />);
    act(() => { useGameStore.getState().setFontSize('large'); });
    expect(document.documentElement.style.fontSize).toBe('1.15em');
    act(() => { useGameStore.getState().setFontSize('small'); });
    expect(document.documentElement.style.fontSize).toBe('0.85em');
  });
});
