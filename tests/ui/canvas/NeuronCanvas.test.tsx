// @vitest-environment jsdom
// Component tests for src/ui/canvas/NeuronCanvas.tsx — jsdom + @testing-library/react.
// Real-Chromium Vitest Browser Mode is deferred to Phase 5 when HUD arrives (per
// Sprint 2 test checklist item 3 — HUD renders in real Chromium).

import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { NeuronCanvas } from '../../../src/ui/canvas/NeuronCanvas';

afterEach(() => cleanup());

describe('NeuronCanvas — mount + cleanup lifecycle', () => {
  test('renders a canvas element', () => {
    const { getByTestId } = render(<NeuronCanvas />);
    const canvas = getByTestId('neuron-canvas');
    expect(canvas.tagName).toBe('CANVAS');
  });

  test('attaches visibilitychange listener and cleans up on unmount', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const { unmount } = render(<NeuronCanvas />);
    const added = addSpy.mock.calls.filter(([event]) => event === 'visibilitychange');
    expect(added.length).toBeGreaterThanOrEqual(1);
    unmount();
    const removed = removeSpy.mock.calls.filter(([event]) => event === 'visibilitychange');
    expect(removed.length).toBeGreaterThanOrEqual(1);
  });

  test('attaches window resize listener and cleans up on unmount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<NeuronCanvas />);
    const added = addSpy.mock.calls.filter(([event]) => event === 'resize');
    expect(added.length).toBeGreaterThanOrEqual(1);
    unmount();
    const removed = removeSpy.mock.calls.filter(([event]) => event === 'resize');
    expect(removed.length).toBeGreaterThanOrEqual(1);
  });

  test('cancels rAF on unmount (no leaking animation frame)', () => {
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
    const { unmount } = render(<NeuronCanvas />);
    unmount();
    expect(cancelSpy).toHaveBeenCalled();
  });
});
