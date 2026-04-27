// @vitest-environment jsdom
// Sprint 2 Phase 6 — UI-9 step 2 GDPR consent tests.

import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { GdprModal } from '../../../src/ui/modals/GdprModal';
import { isEU } from '../../../src/ui/modals/gdprIsEU';
import { useGameStore } from '../../../src/store/gameStore';

afterEach(() => {
  cleanup();
  useGameStore.getState().reset();
});

describe('GdprModal', () => {
  test('renders title, body, and both buttons', () => {
    const { getByTestId } = render(<GdprModal onComplete={() => {}} />);
    expect(getByTestId('gdpr-title').textContent).toBe('Privacy');
    expect(getByTestId('gdpr-body').textContent?.length ?? 0).toBeGreaterThan(0);
    expect(getByTestId('gdpr-accept').textContent).toBe('Accept');
    expect(getByTestId('gdpr-manage').textContent).toBe('Manage');
  });

  test('Accept sets analyticsConsent=true in store and calls onComplete', () => {
    const onComplete = vi.fn();
    expect(useGameStore.getState().analyticsConsent).toBe(false);
    const { getByTestId } = render(<GdprModal onComplete={onComplete} />);
    fireEvent.pointerDown(getByTestId('gdpr-accept'));
    expect(useGameStore.getState().analyticsConsent).toBe(true);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test('Manage calls onComplete without changing consent', () => {
    const onComplete = vi.fn();
    expect(useGameStore.getState().analyticsConsent).toBe(false);
    const { getByTestId } = render(<GdprModal onComplete={onComplete} />);
    fireEvent.pointerDown(getByTestId('gdpr-manage'));
    expect(useGameStore.getState().analyticsConsent).toBe(false);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test('Pre-launch audit Day 1: isEU is now derived via locale + timezone detection (boolean)', () => {
    // The Sprint 2 placeholder `isEU = false` was replaced. The actual value
    // depends on the test environment's navigator.language + Intl timezone.
    // Detailed detection logic is tested in euDetection.test.ts.
    expect(typeof isEU).toBe('boolean');
  });
});
