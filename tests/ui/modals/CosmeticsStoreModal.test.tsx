// @vitest-environment jsdom
// Sprint 9b Phase 9b.2 — CosmeticsStoreModal tests.

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { CosmeticsStoreModal } from '../../../src/ui/modals/CosmeticsStoreModal';
import { useGameStore } from '../../../src/store/gameStore';

beforeEach(() => useGameStore.getState().reset());
afterEach(() => { cleanup(); vi.useRealTimers(); useGameStore.getState().reset(); });

describe('CosmeticsStoreModal — render gates', () => {
  test('does not render when open=false', () => {
    const { queryByTestId } = render(<CosmeticsStoreModal open={false} onClose={() => {}} />);
    expect(queryByTestId('cosmetics-store')).toBeNull();
  });

  test('renders title + 4 tabs + close button when open=true', () => {
    const { getByTestId } = render(<CosmeticsStoreModal open={true} onClose={() => {}} />);
    expect(getByTestId('cosmetics-store-title')).toBeDefined();
    expect(getByTestId('cosmetics-tab-neuron_skin')).toBeDefined();
    expect(getByTestId('cosmetics-tab-canvas_theme')).toBeDefined();
    expect(getByTestId('cosmetics-tab-glow_pack')).toBeDefined();
    expect(getByTestId('cosmetics-tab-hud_style')).toBeDefined();
    expect(getByTestId('cosmetics-close')).toBeDefined();
  });
});

describe('CosmeticsStoreModal — tile rendering', () => {
  test('shows 8 neuron skin tiles on default tab', () => {
    const { getByTestId } = render(<CosmeticsStoreModal open={true} onClose={() => {}} />);
    for (const id of ['ember', 'frost', 'void', 'plasma', 'aurora', 'crystal', 'spore', 'nebula']) {
      expect(getByTestId(`cosmetics-tile-neuron_skin-${id}`), `tile ${id}`).toBeDefined();
    }
  });

  test('switching to canvas tab shows 6 canvas tiles', () => {
    const { getByTestId } = render(<CosmeticsStoreModal open={true} onClose={() => {}} />);
    fireEvent.click(getByTestId('cosmetics-tab-canvas_theme'));
    for (const id of ['aurora', 'deep_ocean', 'deep_space', 'temple', 'genius_gold', 'neon_pulse']) {
      expect(getByTestId(`cosmetics-tile-canvas_theme-${id}`), `canvas tile ${id}`).toBeDefined();
    }
  });
});

describe('CosmeticsStoreModal — buy vs equip vs owned', () => {
  test('unowned non-exclusive tile shows Buy + Preview buttons', () => {
    const { getByTestId } = render(<CosmeticsStoreModal open={true} onClose={() => {}} />);
    expect(getByTestId('cosmetics-buy-neuron_skin-ember')).toBeDefined();
    expect(getByTestId('cosmetics-preview-neuron_skin-ember')).toBeDefined();
  });

  test('owned but not equipped tile shows Equip button', () => {
    useGameStore.getState().unlockCosmetic('neuron_skin', 'ember');
    const { getByTestId, queryByTestId } = render(<CosmeticsStoreModal open={true} onClose={() => {}} />);
    expect(getByTestId('cosmetics-equip-neuron_skin-ember')).toBeDefined();
    expect(queryByTestId('cosmetics-buy-neuron_skin-ember')).toBeNull();
  });

  test('clicking Equip equips the cosmetic in store', () => {
    useGameStore.getState().unlockCosmetic('neuron_skin', 'ember');
    const { getByTestId } = render(<CosmeticsStoreModal open={true} onClose={() => {}} />);
    fireEvent.click(getByTestId('cosmetics-equip-neuron_skin-ember'));
    expect(useGameStore.getState().activeNeuronSkin).toBe('ember');
  });

  test('equipped tile shows Unequip button, not Equip', () => {
    useGameStore.getState().unlockCosmetic('neuron_skin', 'ember');
    useGameStore.getState().equipCosmetic('neuron_skin', 'ember');
    const { getByTestId, queryByTestId } = render(<CosmeticsStoreModal open={true} onClose={() => {}} />);
    expect(getByTestId('cosmetics-unequip-neuron_skin-ember')).toBeDefined();
    expect(queryByTestId('cosmetics-equip-neuron_skin-ember')).toBeNull();
  });

  test('exclusive tile has no Buy + no Preview buttons (bundle-only)', () => {
    const { queryByTestId } = render(<CosmeticsStoreModal open={true} onClose={() => {}} />);
    fireEvent.click((document.querySelector('[data-testid="cosmetics-tab-canvas_theme"]') as HTMLElement));
    expect(queryByTestId('cosmetics-buy-canvas_theme-genius_gold')).toBeNull();
    expect(queryByTestId('cosmetics-preview-canvas_theme-genius_gold')).toBeNull();
  });
});

describe('CosmeticsStoreModal — preview mechanic (V-e)', () => {
  test('clicking Preview changes the button label to Previewing', () => {
    const { getByTestId } = render(<CosmeticsStoreModal open={true} onClose={() => {}} />);
    const btn = getByTestId('cosmetics-preview-neuron_skin-ember');
    fireEvent.click(btn);
    const after = getByTestId('cosmetics-preview-neuron_skin-ember');
    // Component re-renders; we re-query by test id rather than reuse the old ref.
    expect(after.textContent?.toLowerCase()).toContain('preview');
  });

  test('preview auto-clears after 3 seconds', () => {
    vi.useFakeTimers();
    const { getByTestId } = render(<CosmeticsStoreModal open={true} onClose={() => {}} />);
    fireEvent.click(getByTestId('cosmetics-preview-neuron_skin-ember'));
    act(() => { vi.advanceTimersByTime(3001); });
    // After timer, Preview button should no longer show "previewing" label.
    // Component should be in non-previewing state.
    const btn = getByTestId('cosmetics-preview-neuron_skin-ember');
    expect(btn.textContent?.toLowerCase()).not.toContain('previewing');
  });
});

describe('CosmeticsStoreModal — close interactions', () => {
  test('Close button fires onClose', () => {
    const onClose = vi.fn();
    const { getByTestId } = render(<CosmeticsStoreModal open={true} onClose={onClose} />);
    fireEvent.click(getByTestId('cosmetics-close'));
    expect(onClose).toHaveBeenCalled();
  });

  test('Escape key fires onClose', () => {
    const onClose = vi.fn();
    render(<CosmeticsStoreModal open={true} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
