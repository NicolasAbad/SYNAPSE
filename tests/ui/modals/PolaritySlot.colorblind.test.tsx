// @vitest-environment jsdom
// Sprint 10 Phase 10.5 — colorblindMode shape-mark consumer in PolaritySlot.

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { PolaritySlot } from '../../../src/ui/modals/PolaritySlot';
import { createDefaultState, useGameStore } from '../../../src/store/gameStore';

beforeEach(() => {
  useGameStore.setState(createDefaultState());
});

afterEach(() => {
  cleanup();
});

describe('PolaritySlot — colorblindMode glyph', () => {
  test('hides glyph marks when colorblindMode=false', () => {
    useGameStore.setState({ colorblindMode: false });
    const { queryByTestId } = render(<PolaritySlot selected={null} onSelect={vi.fn()} />);
    expect(queryByTestId('cycle-setup-polarity-excitatory-glyph')).toBeNull();
    expect(queryByTestId('cycle-setup-polarity-inhibitory-glyph')).toBeNull();
  });

  test('renders glyph marks when colorblindMode=true', () => {
    useGameStore.setState({ colorblindMode: true });
    const { getByTestId } = render(<PolaritySlot selected={null} onSelect={vi.fn()} />);
    expect(getByTestId('cycle-setup-polarity-excitatory-glyph').textContent).toBe('▲');
    expect(getByTestId('cycle-setup-polarity-inhibitory-glyph').textContent).toBe('▼');
  });

  test('aria-label describes polarity name + effect for screen readers', () => {
    const { getByTestId } = render(<PolaritySlot selected={null} onSelect={vi.fn()} />);
    const exc = getByTestId('cycle-setup-polarity-excitatory');
    const inh = getByTestId('cycle-setup-polarity-inhibitory');
    expect(exc.getAttribute('aria-label')).toBeTruthy();
    expect(exc.getAttribute('aria-label')!.length).toBeGreaterThan(10); // not just the name
    expect(inh.getAttribute('aria-label')).toBeTruthy();
  });

  test('aria-pressed reflects selected state', () => {
    const { getByTestId } = render(<PolaritySlot selected="excitatory" onSelect={vi.fn()} />);
    expect(getByTestId('cycle-setup-polarity-excitatory').getAttribute('aria-pressed')).toBe('true');
    expect(getByTestId('cycle-setup-polarity-inhibitory').getAttribute('aria-pressed')).toBe('false');
  });
});
