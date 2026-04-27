// @vitest-environment jsdom
// Pre-launch audit Tier 2 (C-1 / A-1 / A-2) — ActivationFlash + Cascade +
// Insight celebration tests.

import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import { ActivationFlash } from '../../../src/ui/hud/ActivationFlash';
import { CascadeActivationFlash } from '../../../src/ui/hud/CascadeActivationFlash';
import { InsightActivationFlash } from '../../../src/ui/hud/InsightActivationFlash';
import {
  publishCascadeFlash,
  _resetCascadeFlashListeners,
} from '../../../src/ui/hud/cascadeFlashEvents';
import {
  publishInsightActivation,
  _resetInsightActivationListeners,
} from '../../../src/ui/hud/insightActivationEvents';
import { useGameStore } from '../../../src/store/gameStore';

beforeEach(() => {
  _resetCascadeFlashListeners();
  _resetInsightActivationListeners();
  useGameStore.setState({ reducedMotion: false });
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ActivationFlash — generic component', () => {
  test('renders nothing when trigger is null', () => {
    const { queryByTestId } = render(<ActivationFlash trigger={null} />);
    expect(queryByTestId('activation-flash')).toBeNull();
  });

  test('renders label + sublabel + tint when trigger fires', () => {
    const { getByTestId, rerender } = render(<ActivationFlash trigger={null} />);
    rerender(<ActivationFlash trigger={{ id: 1, label: 'BURST', subLabel: '+9,001', tintColor: '#abc' }} />);
    act(() => { vi.advanceTimersByTime(0); });
    expect(getByTestId('activation-flash-label').textContent).toBe('BURST');
    expect(getByTestId('activation-flash-sublabel').textContent).toBe('+9,001');
  });

  test('auto-dismisses after durationMs', () => {
    const { getByTestId, queryByTestId, rerender } = render(<ActivationFlash trigger={null} durationMs={500} />);
    rerender(
      <ActivationFlash
        trigger={{ id: 1, label: 'X', tintColor: '#fff' }}
        durationMs={500}
      />
    );
    act(() => { vi.advanceTimersByTime(0); });
    expect(getByTestId('activation-flash')).not.toBeNull();
    act(() => { vi.advanceTimersByTime(500); });
    expect(queryByTestId('activation-flash')).toBeNull();
  });

  test('omits sublabel element when not provided', () => {
    const { queryByTestId, rerender } = render(<ActivationFlash trigger={null} />);
    rerender(<ActivationFlash trigger={{ id: 1, label: 'X', tintColor: '#fff' }} />);
    act(() => { vi.advanceTimersByTime(0); });
    expect(queryByTestId('activation-flash-sublabel')).toBeNull();
  });
});

describe('CascadeActivationFlash — A-1 wiring', () => {
  test('fires on publishCascadeFlash with amount, displays "+X,XXX" sublabel', () => {
    const { getByTestId, queryByTestId } = render(<CascadeActivationFlash />);
    expect(queryByTestId('cascade-activation-flash')).toBeNull();
    act(() => { publishCascadeFlash(12500); });
    // formatNumber abbreviates >=1000 with K/M/B suffixes, matching the
    // counters elsewhere on the HUD so the celebration reads consistently.
    expect(getByTestId('cascade-activation-flash-sublabel').textContent).toBe('+12.5K');
    expect(getByTestId('cascade-activation-flash-label').textContent).toBe('CASCADE!');
  });

  test('does NOT fire when reducedMotion is enabled', () => {
    useGameStore.setState({ reducedMotion: true });
    const { queryByTestId } = render(<CascadeActivationFlash />);
    act(() => { publishCascadeFlash(500); });
    expect(queryByTestId('cascade-activation-flash')).toBeNull();
  });

  test('does NOT fire when amount is 0 (engine-driven sentinel)', () => {
    const { queryByTestId } = render(<CascadeActivationFlash />);
    act(() => { publishCascadeFlash(0); });
    expect(queryByTestId('cascade-activation-flash')).toBeNull();
  });
});

describe('InsightActivationFlash — A-2 wiring', () => {
  test('fires on publishInsightActivation, displays "INSIGHT L1"', () => {
    const { getByTestId } = render(<InsightActivationFlash />);
    act(() => { publishInsightActivation(1); });
    expect(getByTestId('insight-activation-flash-label').textContent).toBe('INSIGHT L1');
  });

  test('higher level shown in label (L2 / L3)', () => {
    const { getByTestId, rerender } = render(<InsightActivationFlash />);
    act(() => { publishInsightActivation(2); });
    expect(getByTestId('insight-activation-flash-label').textContent).toBe('INSIGHT L2');
    rerender(<InsightActivationFlash />);
    act(() => { vi.advanceTimersByTime(2000); }); // Let L2 finish
    act(() => { publishInsightActivation(3); });
    expect(getByTestId('insight-activation-flash-label').textContent).toBe('INSIGHT L3');
  });

  test('does NOT fire when reducedMotion is enabled', () => {
    useGameStore.setState({ reducedMotion: true });
    const { queryByTestId } = render(<InsightActivationFlash />);
    act(() => { publishInsightActivation(1); });
    expect(queryByTestId('insight-activation-flash')).toBeNull();
  });
});
