// @vitest-environment jsdom
// Sprint 3 Phase 7.2 — Undo toast UI (UI-4, GDD §29).

import { afterEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { UndoToast } from '../../../src/ui/hud/UndoToast';
import { useGameStore } from '../../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../../src/config/constants';
import type { UndoToast as UndoToastShape } from '../../../src/store/purchases';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  useGameStore.getState().reset();
});

function mkNeuronToast(nowTimestamp: number, refund = 1_234): UndoToastShape {
  return {
    kind: 'neuron',
    id: 'basica',
    refund,
    currency: 'thoughts',
    expiresAt: nowTimestamp + SYNAPSE_CONSTANTS.undoToastDurationMs,
    snapshot: { thoughts: 10_000 },
  };
}

function mkUpgradeToast(nowTimestamp: number, refund = 50_000): UndoToastShape {
  return {
    kind: 'upgrade',
    id: 'mielina',
    refund,
    currency: 'thoughts',
    expiresAt: nowTimestamp + SYNAPSE_CONSTANTS.undoToastDurationMs,
    snapshot: { thoughts: 1_000_000 },
  };
}

describe('UndoToast — visibility', () => {
  test('renders nothing when undoToast is null', () => {
    const { queryByTestId } = render(<UndoToast />);
    expect(queryByTestId('hud-undo-toast')).toBeNull();
  });

  test('renders when undoToast is set (neuron)', () => {
    const { queryByTestId } = render(<UndoToast />);
    act(() => {
      useGameStore.setState({ undoToast: mkNeuronToast(Date.now(), 1_234) });
    });
    const toast = queryByTestId('hud-undo-toast');
    expect(toast).not.toBeNull();
    const label = queryByTestId('hud-undo-toast-label')!.textContent ?? '';
    expect(label).toContain('Bought');
    expect(label).toContain('Basic'); // t('neurons.basica.name')
    expect(label).toContain('−1.23K'); // formatNumber(1234)
  });

  test('renders when undoToast is set (upgrade)', () => {
    const { queryByTestId } = render(<UndoToast />);
    act(() => {
      useGameStore.setState({ undoToast: mkUpgradeToast(Date.now(), 50_000) });
    });
    const label = queryByTestId('hud-undo-toast-label')!.textContent ?? '';
    expect(label).toContain('Unlocked');
    expect(label).toContain('Myelin'); // t('upgrades.mielina')
    expect(label).toContain('−50K');
  });
});

describe('UndoToast — actions', () => {
  test('UNDO button pointerdown calls undoLastPurchase', () => {
    // Seed a state that makes undo observable: user had 100k thoughts,
    // a 50k-cost upgrade purchased, and now holds a snapshot to restore.
    const toast: UndoToastShape = {
      kind: 'upgrade',
      id: 'mielina',
      refund: 50_000,
      currency: 'thoughts',
      expiresAt: Date.now() + SYNAPSE_CONSTANTS.undoToastDurationMs,
      snapshot: { thoughts: 100_000 },
    };
    useGameStore.setState({ thoughts: 50_000, undoToast: toast });
    const { queryByTestId, getByTestId } = render(<UndoToast />);
    act(() => {
      fireEvent.pointerDown(getByTestId('hud-undo-toast-button'));
    });
    // After undo: thoughts restored, toast cleared.
    expect(useGameStore.getState().thoughts).toBe(100_000);
    expect(useGameStore.getState().undoToast).toBeNull();
    expect(queryByTestId('hud-undo-toast')).toBeNull();
  });

  test('button text is localized via t("undo.button")', () => {
    const { queryByTestId } = render(<UndoToast />);
    act(() => {
      useGameStore.setState({ undoToast: mkNeuronToast(Date.now()) });
    });
    expect(queryByTestId('hud-undo-toast-button')?.textContent).toBe('UNDO');
  });
});

describe('UndoToast — auto-dismiss', () => {
  test('auto-dismisses at expiresAt', () => {
    vi.useFakeTimers();
    const start = Date.now();
    const toast = mkNeuronToast(start);
    const { queryByTestId } = render(<UndoToast />);
    act(() => {
      useGameStore.setState({ undoToast: toast });
    });
    expect(queryByTestId('hud-undo-toast')).not.toBeNull();
    act(() => {
      vi.advanceTimersByTime(SYNAPSE_CONSTANTS.undoToastDurationMs);
    });
    expect(useGameStore.getState().undoToast).toBeNull();
    expect(queryByTestId('hud-undo-toast')).toBeNull();
  });

  test('does NOT auto-dismiss before expiresAt', () => {
    vi.useFakeTimers();
    const toast = mkNeuronToast(Date.now());
    const { queryByTestId } = render(<UndoToast />);
    act(() => {
      useGameStore.setState({ undoToast: toast });
    });
    act(() => {
      vi.advanceTimersByTime(SYNAPSE_CONSTANTS.undoToastDurationMs - 1);
    });
    expect(queryByTestId('hud-undo-toast')).not.toBeNull();
  });

  test('replaces timer when a new toast arrives before the first expires', () => {
    vi.useFakeTimers();
    const t0 = Date.now();
    const firstToast = mkNeuronToast(t0);
    const { queryByTestId } = render(<UndoToast />);
    act(() => {
      useGameStore.setState({ undoToast: firstToast });
    });
    // Advance halfway, then push a fresh toast (simulates second expensive
    // purchase before the first dismiss window closed).
    act(() => {
      vi.advanceTimersByTime(SYNAPSE_CONSTANTS.undoToastDurationMs / 2);
    });
    const t1 = Date.now();
    const secondToast = mkUpgradeToast(t1);
    act(() => {
      useGameStore.setState({ undoToast: secondToast });
    });
    // Second toast's full duration must still elapse before dismissal.
    act(() => {
      vi.advanceTimersByTime(SYNAPSE_CONSTANTS.undoToastDurationMs - 1);
    });
    expect(queryByTestId('hud-undo-toast')).not.toBeNull();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(useGameStore.getState().undoToast).toBeNull();
  });
});
