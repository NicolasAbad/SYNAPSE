// @vitest-environment jsdom
// Sprint 9a Phase 9a.2 — SettingsModal tests.
// Validates: open/close render gating, Restore button enabled-state vs adapter
// presence, success path flips isSubscribed via store action, none-found path
// leaves isSubscribed false, failure path shows MONEY-7 toast.

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { SettingsModal } from '../../../src/ui/modals/SettingsModal';
import { createMockRevenueCatAdapter } from '../../../src/platform/revenuecat.mock';
import { useGameStore } from '../../../src/store/gameStore';
import { en } from '../../../src/config/strings/en';

beforeEach(() => {
  useGameStore.getState().reset();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('SettingsModal — render gating', () => {
  test('does not render when open=false', () => {
    const { queryByTestId } = render(<SettingsModal open={false} onClose={() => {}} />);
    expect(queryByTestId('settings-modal')).toBeNull();
  });

  test('renders title + close button when open=true', () => {
    const { getByTestId } = render(<SettingsModal open={true} onClose={() => {}} />);
    expect(getByTestId('settings-title').textContent).toBe(en.settings.title);
    expect(getByTestId('settings-close').textContent).toBe(en.settings.closeButton);
  });

  test('renders Restore button (always present, label from en.settings.restoreButton)', () => {
    const { getByTestId } = render(<SettingsModal open={true} onClose={() => {}} />);
    expect(getByTestId('settings-restore').textContent).toBe(en.settings.restoreButton);
  });
});

describe('SettingsModal — Restore button gating', () => {
  test('Restore disabled when no adapter prop (web/test preview)', () => {
    const { getByTestId } = render(<SettingsModal open={true} onClose={() => {}} />);
    const btn = getByTestId('settings-restore') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  test('Restore enabled when adapter prop is provided', () => {
    const adapter = createMockRevenueCatAdapter();
    const { getByTestId } = render(
      <SettingsModal open={true} onClose={() => {}} restorePurchases={adapter.restorePurchases} />,
    );
    const btn = getByTestId('settings-restore') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });
});

describe('SettingsModal — Restore flow paths', () => {
  test('success path: entitlement found → isSubscribed flips true + success status shown', async () => {
    const adapter = createMockRevenueCatAdapter({ initialEntitlements: ['genius_pass'] });
    const { getByTestId } = render(
      <SettingsModal open={true} onClose={() => {}} restorePurchases={adapter.restorePurchases} />,
    );
    await act(async () => {
      fireEvent.click(getByTestId('settings-restore'));
    });
    await waitFor(() => {
      expect(getByTestId('settings-restore-status').textContent).toBe(en.settings.restoreSuccess);
    });
    expect(useGameStore.getState().isSubscribed).toBe(true);
  });

  test('none-found path: no entitlement → isSubscribed stays false + none-found status shown', async () => {
    const adapter = createMockRevenueCatAdapter(); // no entitlements
    const { getByTestId } = render(
      <SettingsModal open={true} onClose={() => {}} restorePurchases={adapter.restorePurchases} />,
    );
    await act(async () => {
      fireEvent.click(getByTestId('settings-restore'));
    });
    await waitFor(() => {
      expect(getByTestId('settings-restore-status').textContent).toBe(en.settings.restoreNoneFound);
    });
    expect(useGameStore.getState().isSubscribed).toBe(false);
  });

  test('failure path (MONEY-7): adapter throws → failed status shown + isSubscribed unchanged', async () => {
    useGameStore.getState().setSubscriptionStatus(false); // start clean
    const adapter = createMockRevenueCatAdapter({ failRestore: true });
    const { getByTestId } = render(
      <SettingsModal open={true} onClose={() => {}} restorePurchases={adapter.restorePurchases} />,
    );
    await act(async () => {
      fireEvent.click(getByTestId('settings-restore'));
    });
    await waitFor(() => {
      expect(getByTestId('settings-restore-status').textContent).toBe(en.settings.restoreFailed);
    });
    expect(useGameStore.getState().isSubscribed).toBe(false);
  });

  test('starts with empty status line (no toast on initial render)', () => {
    const { getByTestId } = render(<SettingsModal open={true} onClose={() => {}} />);
    expect(getByTestId('settings-restore-status').textContent).toBe('');
  });
});

describe('SettingsModal — close interactions', () => {
  test('Close button fires onClose', () => {
    const onClose = vi.fn();
    const { getByTestId } = render(<SettingsModal open={true} onClose={onClose} />);
    fireEvent.click(getByTestId('settings-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('Escape key fires onClose', () => {
    const onClose = vi.fn();
    render(<SettingsModal open={true} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('Escape key while closed does NOT fire onClose', () => {
    const onClose = vi.fn();
    render(<SettingsModal open={false} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('SettingsModal — status reset on reopen', () => {
  test('reopening the modal clears a prior failed status', async () => {
    const adapter = createMockRevenueCatAdapter({ failRestore: true });
    const { getByTestId, rerender } = render(
      <SettingsModal open={true} onClose={() => {}} restorePurchases={adapter.restorePurchases} />,
    );
    await act(async () => {
      fireEvent.click(getByTestId('settings-restore'));
    });
    await waitFor(() => {
      expect(getByTestId('settings-restore-status').textContent).toBe(en.settings.restoreFailed);
    });
    // Close
    rerender(<SettingsModal open={false} onClose={() => {}} restorePurchases={adapter.restorePurchases} />);
    // Reopen
    rerender(<SettingsModal open={true} onClose={() => {}} restorePurchases={adapter.restorePurchases} />);
    expect(getByTestId('settings-restore-status').textContent).toBe('');
  });
});

// Pre-launch audit Day 1 — Legal section coverage.
describe('SettingsModal — Legal section (pre-launch audit)', () => {
  test('renders 3 legal link buttons by testId', () => {
    const { getByTestId } = render(<SettingsModal open={true} onClose={() => {}} />);
    expect(getByTestId('settings-legal-privacy')).toBeTruthy();
    expect(getByTestId('settings-legal-terms')).toBeTruthy();
    expect(getByTestId('settings-legal-eula')).toBeTruthy();
  });

  test('legal buttons disabled when URL placeholder empty (default)', () => {
    const { getByTestId } = render(<SettingsModal open={true} onClose={() => {}} />);
    expect((getByTestId('settings-legal-privacy') as HTMLButtonElement).disabled).toBe(true);
    expect((getByTestId('settings-legal-terms') as HTMLButtonElement).disabled).toBe(true);
    expect((getByTestId('settings-legal-eula') as HTMLButtonElement).disabled).toBe(true);
  });
});

// Sprint 10 Phase 10.1 — new section coverage.
describe('SettingsModal — Sprint 10 sections', () => {
  test('renders all 6 sections + hard-reset entry point', () => {
    const { getByTestId, getByText } = render(<SettingsModal open={true} onClose={() => {}} />);
    // All 6 (now 7 with Legal) section headers present.
    expect(getByText(en.settings.sectionGeneral)).toBeTruthy();
    expect(getByText(en.settings.sectionAudio)).toBeTruthy();
    expect(getByText(en.settings.sectionAccessibility)).toBeTruthy();
    expect(getByText(en.settings.sectionNotifications)).toBeTruthy();
    expect(getByText(en.settings.sectionAccount)).toBeTruthy();
    expect(getByText(en.settings.sectionGame)).toBeTruthy();
    // Pre-launch audit Day 1 — Legal section.
    expect(getByText(en.settings.sectionLegal)).toBeTruthy();
    // Game section hosts the Hard Reset flow's first-state tap button.
    expect(getByTestId('hard-reset-tap')).toBeTruthy();
  });

  test('language select writes setLanguage', () => {
    const { getByTestId } = render(<SettingsModal open={true} onClose={() => {}} />);
    fireEvent.change(getByTestId('settings-language'), { target: { value: 'es' } });
    expect(useGameStore.getState().language).toBe('es');
  });

  test('SFX volume slider writes setSfxVolume', () => {
    const { getByTestId } = render(<SettingsModal open={true} onClose={() => {}} />);
    fireEvent.change(getByTestId('settings-sfx-volume'), { target: { value: '75' } });
    expect(useGameStore.getState().sfxVolume).toBe(75);
  });

  test('music volume slider writes setMusicVolume', () => {
    const { getByTestId } = render(<SettingsModal open={true} onClose={() => {}} />);
    fireEvent.change(getByTestId('settings-music-volume'), { target: { value: '20' } });
    expect(useGameStore.getState().musicVolume).toBe(20);
  });

  test('accessibility toggles write their state fields', () => {
    const { getByTestId } = render(<SettingsModal open={true} onClose={() => {}} />);
    fireEvent.click(getByTestId('settings-colorblind'));
    fireEvent.click(getByTestId('settings-reduced-motion'));
    fireEvent.click(getByTestId('settings-high-contrast'));
    const s = useGameStore.getState();
    expect(s.colorblindMode).toBe(true);
    expect(s.reducedMotion).toBe(true);
    expect(s.highContrast).toBe(true);
  });

  test('font size select writes setFontSize', () => {
    const { getByTestId } = render(<SettingsModal open={true} onClose={() => {}} />);
    fireEvent.change(getByTestId('settings-font-size'), { target: { value: 'large' } });
    expect(useGameStore.getState().fontSize).toBe('large');
  });

  test('notifications toggle writes setNotificationsEnabled', () => {
    // Default is true; toggling clears it.
    const { getByTestId } = render(<SettingsModal open={true} onClose={() => {}} />);
    expect(useGameStore.getState().notificationsEnabled).toBe(true);
    fireEvent.click(getByTestId('settings-notifications'));
    expect(useGameStore.getState().notificationsEnabled).toBe(false);
  });
});
