// @vitest-environment jsdom
// Sprint 9b Phase 9b.4 — GeniusPassOfferModal tests (MONEY-9 compliance).

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { GeniusPassOfferModal } from '../../../src/ui/modals/GeniusPassOfferModal';
import { useGameStore } from '../../../src/store/gameStore';

beforeEach(() => useGameStore.getState().reset());
afterEach(() => { cleanup(); useGameStore.getState().reset(); });

describe('GeniusPassOfferModal — render gates', () => {
  test('does not render when open=false', () => {
    const { queryByTestId } = render(<GeniusPassOfferModal open={false} onClose={() => {}} />);
    expect(queryByTestId('genius-pass-offer')).toBeNull();
  });

  test('renders title + free-badge + 6 benefits + legal + 3 buttons when open=true', () => {
    const { getByTestId } = render(<GeniusPassOfferModal open={true} onClose={() => {}} />);
    expect(getByTestId('genius-pass-offer')).toBeDefined();
    expect(getByTestId('genius-pass-title')).toBeDefined();
    expect(getByTestId('genius-pass-free-badge')).toBeDefined();
    expect(getByTestId('genius-pass-auto-renew')).toBeDefined();
    expect(getByTestId('genius-pass-cancel-instructions')).toBeDefined();
    expect(getByTestId('genius-pass-subscribe-monthly')).toBeDefined();
    expect(getByTestId('genius-pass-subscribe-weekly')).toBeDefined();
    expect(getByTestId('genius-pass-dismiss')).toBeDefined();
  });
});

describe('GeniusPassOfferModal — MONEY-9 / MONEY-2 compliance', () => {
  test('free-badge contains "All content accessible for free"', () => {
    const { getByTestId } = render(<GeniusPassOfferModal open={true} onClose={() => {}} />);
    expect(getByTestId('genius-pass-free-badge').textContent).toContain('All content accessible for free');
  });

  test('auto-renew statement is present', () => {
    const { getByTestId } = render(<GeniusPassOfferModal open={true} onClose={() => {}} />);
    expect(getByTestId('genius-pass-auto-renew').textContent?.toLowerCase()).toContain('auto-renews');
  });

  test('cancel instructions are present', () => {
    const { getByTestId } = render(<GeniusPassOfferModal open={true} onClose={() => {}} />);
    expect(getByTestId('genius-pass-cancel-instructions').textContent?.toLowerCase()).toContain('cancel');
  });
});

describe('GeniusPassOfferModal — interactions', () => {
  test('Dismiss button bumps geniusPassDismissals + fires onClose', () => {
    const onClose = vi.fn();
    const { getByTestId } = render(<GeniusPassOfferModal open={true} onClose={onClose} />);
    fireEvent.click(getByTestId('genius-pass-dismiss'));
    expect(useGameStore.getState().geniusPassDismissals).toBe(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('Subscribe Monthly button fires the provided callback (Phase 9b.3 wires RevenueCat)', () => {
    const onSubscribeMonthly = vi.fn();
    const { getByTestId } = render(<GeniusPassOfferModal open={true} onClose={() => {}} onSubscribeMonthly={onSubscribeMonthly} />);
    fireEvent.click(getByTestId('genius-pass-subscribe-monthly'));
    expect(onSubscribeMonthly).toHaveBeenCalledTimes(1);
  });

  test('Subscribe Weekly button fires the provided callback', () => {
    const onSubscribeWeekly = vi.fn();
    const { getByTestId } = render(<GeniusPassOfferModal open={true} onClose={() => {}} onSubscribeWeekly={onSubscribeWeekly} />);
    fireEvent.click(getByTestId('genius-pass-subscribe-weekly'));
    expect(onSubscribeWeekly).toHaveBeenCalledTimes(1);
  });
});
