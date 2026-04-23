// @vitest-environment jsdom
// Sprint 7.6 Phase 7.6.4 — PathwaySlot card scannability refinement.
// Each pathway card now renders a 3-span body (tagline / bonuses / blocks)
// replacing the single compound description line.

import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { PathwaySlot } from '../../../src/ui/modals/PathwaySlot';
import type { Pathway } from '../../../src/types';

afterEach(() => {
  cleanup();
});

describe('PathwaySlot — Sprint 7.6 scannability refinement (§14)', () => {
  test('each pathway card renders name + tagline + bonuses + blocks spans', () => {
    const { getByTestId } = render(<PathwaySlot selected={null} onSelect={() => {}} />);
    for (const p of ['rapida', 'profunda', 'equilibrada'] as const) {
      expect(getByTestId(`cycle-setup-pathway-${p}`)).not.toBeNull();
      expect(getByTestId(`cycle-setup-pathway-${p}-tagline`).textContent?.length).toBeGreaterThan(0);
      expect(getByTestId(`cycle-setup-pathway-${p}-bonuses`).textContent?.length).toBeGreaterThan(0);
      expect(getByTestId(`cycle-setup-pathway-${p}-blocks`).textContent?.length).toBeGreaterThan(0);
    }
  });

  test('Swift card shows correct tagline/bonuses/blocks copy', () => {
    const { getByTestId } = render(<PathwaySlot selected={null} onSelect={() => {}} />);
    expect(getByTestId('cycle-setup-pathway-rapida-tagline').textContent).toBe('Speed specialist');
    expect(getByTestId('cycle-setup-pathway-rapida-bonuses').textContent).toContain('Insight ×2');
    expect(getByTestId('cycle-setup-pathway-rapida-blocks').textContent).toContain('Blocked:');
  });

  test('onSelect fires with the clicked pathway', () => {
    const onSelect = vi.fn<(p: Pathway) => void>();
    const { getByTestId } = render(<PathwaySlot selected={null} onSelect={onSelect} />);
    fireEvent.pointerDown(getByTestId('cycle-setup-pathway-profunda'));
    expect(onSelect).toHaveBeenCalledWith('profunda');
  });
});
