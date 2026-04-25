// @vitest-environment jsdom
// Sprint 10 Phase 10.1 (V-3) — HardResetFlow tests.
// Validates: 3-tap counter advances + resets after window expiry; armed state
// reveals input; confirm enabled only when input matches RESET (case-insensitive);
// confirm calls hardReset; cancel resets to tap=0.

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { HardResetFlow } from '../../../src/ui/modals/HardResetFlow';
import { createDefaultState, useGameStore } from '../../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../../src/config/constants';

vi.mock('../../../src/platform/firebase', () => ({
  initFirebase: vi.fn(),
  logEvent: vi.fn(),
}));

beforeEach(() => {
  useGameStore.setState(createDefaultState());
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('HardResetFlow — 3-tap arming', () => {
  test('starts unarmed: only the danger button visible, no input', () => {
    const { getByTestId, queryByTestId } = render(<HardResetFlow />);
    expect(getByTestId('hard-reset-tap')).toBeTruthy();
    expect(queryByTestId('hard-reset-input')).toBeNull();
    expect(queryByTestId('hard-reset-confirm')).toBeNull();
  });

  test('1 tap shows "tap 2 more times" prompt', () => {
    const { getByTestId } = render(<HardResetFlow />);
    fireEvent.click(getByTestId('hard-reset-tap'));
    expect(getByTestId('hard-reset-tap-prompt').textContent).toContain('2 more');
  });

  test('2 taps shows "tap 1 more time" prompt', () => {
    const { getByTestId } = render(<HardResetFlow />);
    fireEvent.click(getByTestId('hard-reset-tap'));
    fireEvent.click(getByTestId('hard-reset-tap'));
    expect(getByTestId('hard-reset-tap-prompt').textContent).toContain('1 more');
  });

  test('3 taps arms: input + confirm appear', () => {
    const { getByTestId, queryByTestId } = render(<HardResetFlow />);
    fireEvent.click(getByTestId('hard-reset-tap'));
    fireEvent.click(getByTestId('hard-reset-tap'));
    fireEvent.click(getByTestId('hard-reset-tap'));
    expect(getByTestId('hard-reset-input')).toBeTruthy();
    expect(getByTestId('hard-reset-confirm')).toBeTruthy();
    expect(queryByTestId('hard-reset-tap')).toBeNull();
  });

  test('tap counter resets after window expires', () => {
    const { getByTestId } = render(<HardResetFlow />);
    fireEvent.click(getByTestId('hard-reset-tap'));
    fireEvent.click(getByTestId('hard-reset-tap'));
    act(() => { vi.advanceTimersByTime(SYNAPSE_CONSTANTS.hardResetTapWindowMs + 100); });
    // After window, the next tap is treated as the first.
    fireEvent.click(getByTestId('hard-reset-tap'));
    expect(getByTestId('hard-reset-tap-prompt').textContent).toContain('2 more');
  });
});

describe('HardResetFlow — confirmation gate', () => {
  function arm(getByTestId: (id: string) => HTMLElement) {
    fireEvent.click(getByTestId('hard-reset-tap'));
    fireEvent.click(getByTestId('hard-reset-tap'));
    fireEvent.click(getByTestId('hard-reset-tap'));
  }

  test('confirm disabled when input is empty', () => {
    const { getByTestId } = render(<HardResetFlow />);
    arm(getByTestId);
    const btn = getByTestId('hard-reset-confirm') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  test('confirm disabled when input does not match', () => {
    const { getByTestId } = render(<HardResetFlow />);
    arm(getByTestId);
    fireEvent.change(getByTestId('hard-reset-input'), { target: { value: 'wipe' } });
    const btn = getByTestId('hard-reset-confirm') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  test('confirm enabled when input matches RESET (case-insensitive)', () => {
    const { getByTestId } = render(<HardResetFlow />);
    arm(getByTestId);
    fireEvent.change(getByTestId('hard-reset-input'), { target: { value: 'reset' } });
    const btn = getByTestId('hard-reset-confirm') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  test('confirm matches with leading/trailing whitespace too', () => {
    const { getByTestId } = render(<HardResetFlow />);
    arm(getByTestId);
    fireEvent.change(getByTestId('hard-reset-input'), { target: { value: '  RESET  ' } });
    expect((getByTestId('hard-reset-confirm') as HTMLButtonElement).disabled).toBe(false);
  });

  test('clicking confirm wipes state via hardReset action', () => {
    useGameStore.setState({ thoughts: 12_345, prestigeCount: 3 });
    const { getByTestId } = render(<HardResetFlow />);
    arm(getByTestId);
    fireEvent.change(getByTestId('hard-reset-input'), { target: { value: 'RESET' } });
    fireEvent.click(getByTestId('hard-reset-confirm'));
    expect(useGameStore.getState().thoughts).toBe(0);
    expect(useGameStore.getState().prestigeCount).toBe(0);
  });

  test('cancel resets back to unarmed state', () => {
    const { getByTestId, queryByTestId } = render(<HardResetFlow />);
    arm(getByTestId);
    expect(getByTestId('hard-reset-input')).toBeTruthy();
    fireEvent.click(getByTestId('hard-reset-cancel'));
    expect(queryByTestId('hard-reset-input')).toBeNull();
    expect(getByTestId('hard-reset-tap')).toBeTruthy();
  });
});
