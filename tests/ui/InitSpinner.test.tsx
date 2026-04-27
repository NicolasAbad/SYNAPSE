// @vitest-environment jsdom
// Pre-launch audit Day 2 — InitSpinner suppresses on fast inits.

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { InitSpinner } from '../../src/ui/InitSpinner';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('InitSpinner', () => {
  test('does not render when show=false', () => {
    const { queryByTestId } = render(<InitSpinner show={false} label="Loading…" />);
    expect(queryByTestId('init-spinner')).toBeNull();
  });

  test('suppresses display for the first 700ms (no flash on fast inits)', () => {
    const { queryByTestId } = render(<InitSpinner show={true} label="Loading…" />);
    expect(queryByTestId('init-spinner')).toBeNull();
    act(() => { vi.advanceTimersByTime(699); });
    expect(queryByTestId('init-spinner')).toBeNull();
  });

  test('renders after 700ms when show stays true', () => {
    const { queryByTestId } = render(<InitSpinner show={true} label="Loading store…" />);
    act(() => { vi.advanceTimersByTime(701); });
    expect(queryByTestId('init-spinner')).toBeTruthy();
    expect(queryByTestId('init-spinner')?.textContent).toContain('Loading store…');
  });
});
