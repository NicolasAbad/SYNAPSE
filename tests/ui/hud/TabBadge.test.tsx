// @vitest-environment jsdom
// Sprint 3.6.5 — TabBadge rendering infrastructure (GDD §29 UI-3).

import { afterEach, describe, expect, test } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { TabBadge } from '../../../src/ui/hud/TabBadge';

afterEach(() => {
  cleanup();
});

describe('TabBadge', () => {
  test('renders nothing when visible=false', () => {
    const { queryByTestId } = render(<TabBadge tab="neurons" visible={false} />);
    expect(queryByTestId('hud-tab-badge-neurons')).toBeNull();
  });

  test('renders the dot when visible=true, keyed to tab prop', () => {
    const { queryByTestId } = render(<TabBadge tab="upgrades" visible />);
    const dot = queryByTestId('hud-tab-badge-upgrades');
    expect(dot).not.toBeNull();
    expect(dot?.getAttribute('aria-label')).toContain('upgrades');
  });

  test('switches rendered testid when tab prop changes', () => {
    const { queryByTestId, rerender } = render(<TabBadge tab="neurons" visible />);
    expect(queryByTestId('hud-tab-badge-neurons')).not.toBeNull();
    rerender(<TabBadge tab="mind" visible />);
    expect(queryByTestId('hud-tab-badge-neurons')).toBeNull();
    expect(queryByTestId('hud-tab-badge-mind')).not.toBeNull();
  });
});
