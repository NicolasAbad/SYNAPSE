// @vitest-environment jsdom
// Component tests for src/ui/canvas/NeuronCanvas.tsx — jsdom + @testing-library/react.
// Real-Chromium Vitest Browser Mode is deferred to Phase 5 when HUD arrives (per
// Sprint 2 test checklist item 3 — HUD renders in real Chromium).

import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { NeuronCanvas } from '../../../src/ui/canvas/NeuronCanvas';
import { useGameStore } from '../../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../../src/config/constants';

afterEach(() => {
  cleanup();
  useGameStore.getState().reset();
});

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

// Sprint 2 Phase 3 — tap handler integration. jsdom's getBoundingClientRect
// returns zeros by default; we stub it on the canvas to place the tap at the
// centered Básica (index 0) position.
describe('NeuronCanvas — onPointerDown taps (Phase 3)', () => {
  test('tap on centered Básica increments thoughts by baseTapThoughtMin', () => {
    useGameStore.getState().reset();
    const before = useGameStore.getState().thoughts;
    const { getByTestId } = render(<NeuronCanvas />);
    const canvas = getByTestId('neuron-canvas') as HTMLCanvasElement;

    // Stub bounding rect so dimsRef.current has real dimensions after effect.
    // Then re-trigger setupHiDPICanvas via resize event so the ref updates.
    canvas.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 0, top: 0, right: 400, bottom: 600, width: 400, height: 600,
      x: 0, y: 0, toJSON: () => ({}),
    });
    fireEvent(window, new Event('resize'));

    // Tap the canvas centre — default scatter layout places index 0 at (200, 300).
    fireEvent.pointerDown(canvas, { clientX: 200, clientY: 300 });

    const after = useGameStore.getState().thoughts;
    expect(after - before).toBe(SYNAPSE_CONSTANTS.baseTapThoughtMin);
  });

  test('tap far from any neuron does NOT increment thoughts', () => {
    useGameStore.getState().reset();
    const before = useGameStore.getState().thoughts;
    const { getByTestId } = render(<NeuronCanvas />);
    const canvas = getByTestId('neuron-canvas') as HTMLCanvasElement;
    canvas.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 0, top: 0, right: 400, bottom: 600, width: 400, height: 600,
      x: 0, y: 0, toJSON: () => ({}),
    });
    fireEvent(window, new Event('resize'));

    // Corner tap — far outside any neuron hit area.
    fireEvent.pointerDown(canvas, { clientX: 5, clientY: 5 });
    expect(useGameStore.getState().thoughts).toBe(before);
  });

  test('first-tap stub logs once (Sprint 6 replacement target)', () => {
    useGameStore.getState().reset();
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const { getByTestId } = render(<NeuronCanvas />);
    const canvas = getByTestId('neuron-canvas') as HTMLCanvasElement;
    canvas.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 0, top: 0, right: 400, bottom: 600, width: 400, height: 600,
      x: 0, y: 0, toJSON: () => ({}),
    });
    fireEvent(window, new Event('resize'));

    fireEvent.pointerDown(canvas, { clientX: 200, clientY: 300 });
    fireEvent.pointerDown(canvas, { clientX: 200, clientY: 300 });

    const firstTapLogs = debugSpy.mock.calls.filter(([m]) => m === 'tap:first-tap');
    expect(firstTapLogs).toHaveLength(1);
    debugSpy.mockRestore();
  });
});
