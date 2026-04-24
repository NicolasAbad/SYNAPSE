// @vitest-environment jsdom
// Sprint 8b Phase 8b.6 — TranscendenceConfirmModal tests.

import { afterEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { TranscendenceConfirmModal } from '../../../src/ui/modals/TranscendenceConfirmModal';
import { SYNAPSE_CONSTANTS } from '../../../src/config/constants';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('TranscendenceConfirmModal — render', () => {
  test('does not render when closed', () => {
    const { queryByTestId } = render(
      <TranscendenceConfirmModal open={false} nextRunNumber={2} onConfirm={() => {}} onCancel={() => {}} />,
    );
    expect(queryByTestId('transcendence-confirm-root')).toBeNull();
  });

  test('renders body with the next-run number interpolated', () => {
    const { getByTestId } = render(
      <TranscendenceConfirmModal open={true} nextRunNumber={2} onConfirm={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId('transcendence-confirm-body').textContent).toContain('Run 2 begins');
  });

  test('Cancel button always enabled and fires onCancel', () => {
    const onCancel = vi.fn();
    const { getByTestId } = render(
      <TranscendenceConfirmModal open={true} nextRunNumber={2} onConfirm={() => {}} onCancel={onCancel} />,
    );
    fireEvent.pointerDown(getByTestId('transcendence-confirm-cancel'));
    expect(onCancel).toHaveBeenCalled();
  });
});

describe('TranscendenceConfirmModal — anti-misclick cooldown (2s)', () => {
  test('Confirm button is disabled immediately after open', () => {
    vi.useFakeTimers();
    const { getByTestId } = render(
      <TranscendenceConfirmModal open={true} nextRunNumber={2} onConfirm={() => {}} onCancel={() => {}} />,
    );
    const btn = getByTestId('transcendence-confirm-confirm') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  test('Confirm becomes enabled after cooldownMs elapses', () => {
    vi.useFakeTimers();
    const { getByTestId } = render(
      <TranscendenceConfirmModal open={true} nextRunNumber={2} onConfirm={() => {}} onCancel={() => {}} />,
    );
    act(() => {
      vi.advanceTimersByTime(SYNAPSE_CONSTANTS.transcendenceConfirmCooldownMs);
    });
    const btn = getByTestId('transcendence-confirm-confirm') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  test('Confirm click before cooldown does NOT fire onConfirm', () => {
    vi.useFakeTimers();
    const onConfirm = vi.fn();
    const { getByTestId } = render(
      <TranscendenceConfirmModal open={true} nextRunNumber={2} onConfirm={onConfirm} onCancel={() => {}} />,
    );
    fireEvent.pointerDown(getByTestId('transcendence-confirm-confirm'));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  test('Confirm click after cooldown fires onConfirm', () => {
    vi.useFakeTimers();
    const onConfirm = vi.fn();
    const { getByTestId } = render(
      <TranscendenceConfirmModal open={true} nextRunNumber={2} onConfirm={onConfirm} onCancel={() => {}} />,
    );
    act(() => {
      vi.advanceTimersByTime(SYNAPSE_CONSTANTS.transcendenceConfirmCooldownMs);
    });
    fireEvent.pointerDown(getByTestId('transcendence-confirm-confirm'));
    expect(onConfirm).toHaveBeenCalled();
  });

  test('Cooldown resets when modal closes + reopens', () => {
    vi.useFakeTimers();
    const { getByTestId, rerender } = render(
      <TranscendenceConfirmModal open={true} nextRunNumber={2} onConfirm={() => {}} onCancel={() => {}} />,
    );
    act(() => {
      vi.advanceTimersByTime(SYNAPSE_CONSTANTS.transcendenceConfirmCooldownMs);
    });
    expect((getByTestId('transcendence-confirm-confirm') as HTMLButtonElement).disabled).toBe(false);
    rerender(
      <TranscendenceConfirmModal open={false} nextRunNumber={2} onConfirm={() => {}} onCancel={() => {}} />,
    );
    rerender(
      <TranscendenceConfirmModal open={true} nextRunNumber={2} onConfirm={() => {}} onCancel={() => {}} />,
    );
    expect((getByTestId('transcendence-confirm-confirm') as HTMLButtonElement).disabled).toBe(true);
  });
});
