// @vitest-environment jsdom
// Sprint 10 Phase 10.6 — generic EmptyState component.

import { afterEach, describe, expect, test } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { EmptyState } from '../../../src/ui/components/EmptyState';

afterEach(() => cleanup());

describe('EmptyState', () => {
  test('renders required title', () => {
    const { getByText } = render(<EmptyState title="No regions yet" />);
    expect(getByText('No regions yet')).toBeTruthy();
  });

  test('renders body when provided', () => {
    const { getByText } = render(<EmptyState title="t" body="Unlock at P5." />);
    expect(getByText('Unlock at P5.')).toBeTruthy();
  });

  test('renders unlockHint when provided', () => {
    const { getByText } = render(<EmptyState title="t" unlockHint="Reach P5 to unlock" />);
    expect(getByText('Reach P5 to unlock')).toBeTruthy();
  });

  test('icon is aria-hidden so screen readers skip it', () => {
    const { container } = render(<EmptyState title="t" icon="✦" />);
    const icon = container.querySelector('[aria-hidden="true"]');
    expect(icon).not.toBeNull();
    expect(icon!.textContent).toBe('✦');
  });

  test('uses role="status" for assistive tech announcement', () => {
    const { getByTestId } = render(<EmptyState title="t" />);
    expect(getByTestId('empty-state').getAttribute('role')).toBe('status');
  });

  test('respects custom testId', () => {
    const { getByTestId } = render(<EmptyState title="t" testId="regions-empty" />);
    expect(getByTestId('regions-empty')).toBeTruthy();
  });
});
