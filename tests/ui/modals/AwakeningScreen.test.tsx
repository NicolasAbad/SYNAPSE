// @vitest-environment jsdom
// Tests for src/ui/modals/AwakeningScreen.tsx (Sprint 4a Phase 4a.5).

import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { AwakeningScreen } from '../../../src/ui/modals/AwakeningScreen';
import type { PrestigeOutcome } from '../../../src/engine/prestige';

afterEach(() => cleanup());

function makeOutcome(overrides: Partial<PrestigeOutcome> = {}): PrestigeOutcome {
  return {
    prevPrestigeCount: 0,
    newPrestigeCount: 1,
    cycleDurationMs: 8 * 60 * 1000, // 8 min
    memoriesGained: 2,
    momentumBonus: 1800,
    nextThreshold: 450_000,
    wasPersonalBest: false,
    ...overrides,
  };
}

describe('AwakeningScreen — visibility gate', () => {
  test('renders nothing when outcome is null', () => {
    const { queryByTestId } = render(<AwakeningScreen outcome={null} onContinue={() => {}} />);
    expect(queryByTestId('awakening-screen-root')).toBeNull();
  });

  test('renders when outcome is provided', () => {
    const { getByTestId } = render(<AwakeningScreen outcome={makeOutcome()} onContinue={() => {}} />);
    expect(getByTestId('awakening-screen-root')).toBeTruthy();
  });
});

describe('AwakeningScreen — content', () => {
  test('shows cycle duration in minutes when ≥ 1 min', () => {
    const { getByTestId } = render(
      <AwakeningScreen outcome={makeOutcome({ cycleDurationMs: 7.5 * 60 * 1000 })} onContinue={() => {}} />,
    );
    expect(getByTestId('awakening-screen-duration').textContent).toContain('7.5 min');
  });

  test('falls back to seconds when under 1 min', () => {
    const { getByTestId } = render(
      <AwakeningScreen outcome={makeOutcome({ cycleDurationMs: 45_000 })} onContinue={() => {}} />,
    );
    expect(getByTestId('awakening-screen-duration').textContent).toContain('45 s');
  });

  test('shows Memories gained with + prefix', () => {
    const { getByTestId } = render(<AwakeningScreen outcome={makeOutcome({ memoriesGained: 3 })} onContinue={() => {}} />);
    expect(getByTestId('awakening-screen-memories').textContent).toContain('+3');
  });

  test('shows Momentum bonus value and suffix', () => {
    const { getByTestId } = render(<AwakeningScreen outcome={makeOutcome({ momentumBonus: 1800 })} onContinue={() => {}} />);
    const txt = getByTestId('awakening-screen-momentum').textContent ?? '';
    expect(txt).toContain('1.8K'); // formatNumber
    expect(txt).toContain('30');
  });

  test('hides personal-best badge when wasPersonalBest=false', () => {
    const { queryByTestId } = render(
      <AwakeningScreen outcome={makeOutcome({ wasPersonalBest: false })} onContinue={() => {}} />,
    );
    expect(queryByTestId('awakening-screen-personal-best')).toBeNull();
  });

  test('shows personal-best badge when wasPersonalBest=true', () => {
    const { getByTestId } = render(
      <AwakeningScreen outcome={makeOutcome({ wasPersonalBest: true })} onContinue={() => {}} />,
    );
    expect(getByTestId('awakening-screen-personal-best')).toBeTruthy();
  });
});

describe('AwakeningScreen — interaction', () => {
  test('onContinue fires when continue button pressed', () => {
    const onContinue = vi.fn();
    const { getByTestId } = render(<AwakeningScreen outcome={makeOutcome()} onContinue={onContinue} />);
    fireEvent.pointerDown(getByTestId('awakening-screen-continue'));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});

describe('AwakeningScreen — accessibility', () => {
  test('role="dialog" + aria-modal + aria-labelledby', () => {
    const { getByTestId } = render(<AwakeningScreen outcome={makeOutcome()} onContinue={() => {}} />);
    const root = getByTestId('awakening-screen-root');
    expect(root.getAttribute('role')).toBe('dialog');
    expect(root.getAttribute('aria-modal')).toBe('true');
    expect(root.getAttribute('aria-labelledby')).toBe('awakening-screen-title');
  });
});
