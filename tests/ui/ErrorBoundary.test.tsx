// @vitest-environment jsdom
// Pre-launch audit Day 1 — ErrorBoundary fallback tests.

import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { ErrorBoundary } from '../../src/ui/ErrorBoundary';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function ChildThatThrows({ message }: { message: string }): never {
  throw new Error(message);
}

describe('ErrorBoundary', () => {
  test('renders children when no error', () => {
    const { getByTestId } = render(
      <ErrorBoundary>
        <div data-testid="ok">All good</div>
      </ErrorBoundary>,
    );
    expect(getByTestId('ok').textContent).toBe('All good');
  });

  test('renders fallback when child throws', () => {
    // Suppress React's error log noise during this test
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { getByTestId } = render(
      <ErrorBoundary>
        <ChildThatThrows message="boom" />
      </ErrorBoundary>,
    );
    expect(getByTestId('error-boundary-fallback')).toBeTruthy();
    expect(getByTestId('error-boundary-message').textContent).toBe('boom');
    expect(getByTestId('error-boundary-reload')).toBeTruthy();
    expect(getByTestId('error-boundary-hard-reset')).toBeTruthy();
  });

  test('reload + hard-reset buttons have a11y-friendly minHeight', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { getByTestId } = render(
      <ErrorBoundary>
        <ChildThatThrows message="x" />
      </ErrorBoundary>,
    );
    const reload = getByTestId('error-boundary-reload') as HTMLButtonElement;
    const hardReset = getByTestId('error-boundary-hard-reset') as HTMLButtonElement;
    expect(reload.style.minHeight).toBe('44px');
    expect(hardReset.style.minHeight).toBe('44px');
  });
});
