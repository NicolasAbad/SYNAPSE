// @vitest-environment jsdom
// Sprint 9a Phase 9a.2 — SettingsButton tests.

import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { SettingsButton } from '../../../src/ui/hud/SettingsButton';
import { en } from '../../../src/config/strings/en';

afterEach(() => cleanup());

describe('SettingsButton', () => {
  test('renders with the gear glyph and aria-label from settings.openButtonAria', () => {
    const { getByTestId } = render(<SettingsButton onOpen={() => {}} />);
    const btn = getByTestId('hud-settings-button');
    expect(btn.getAttribute('aria-label')).toBe(en.settings.openButtonAria);
    expect(btn.textContent).toBe('⚙');
  });

  test('pointerDown fires onOpen', () => {
    const onOpen = vi.fn();
    const { getByTestId } = render(<SettingsButton onOpen={onOpen} />);
    fireEvent.pointerDown(getByTestId('hud-settings-button'));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
