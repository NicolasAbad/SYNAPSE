// @vitest-environment jsdom
// Tests for src/ui/canvas/dpr.ts — requires HTMLCanvasElement + window.

import { describe, expect, test, vi } from 'vitest';
import { setupHiDPICanvas } from '../../../src/ui/canvas/dpr';

describe('setupHiDPICanvas', () => {
  test('sets canvas pixel buffer to cssWidth × dpr', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no 2d ctx');

    // Stub getBoundingClientRect (jsdom returns zeros by default).
    canvas.getBoundingClientRect = vi
      .fn()
      .mockReturnValue({ width: 400, height: 600, top: 0, left: 0, bottom: 0, right: 0, x: 0, y: 0, toJSON: () => ({}) });
    Object.defineProperty(window, 'devicePixelRatio', { value: 2, writable: true });

    const dims = setupHiDPICanvas(canvas, ctx);
    expect(dims.width).toBe(400);
    expect(dims.height).toBe(600);
    expect(dims.dpr).toBe(2);
    expect(canvas.width).toBe(800); // CONST-OK: 400 × 2 dpr
    expect(canvas.height).toBe(1200); // CONST-OK: 600 × 2 dpr
  });

  test('defaults dpr to 1 when devicePixelRatio is 0/undefined', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no 2d ctx');

    canvas.getBoundingClientRect = vi
      .fn()
      .mockReturnValue({ width: 300, height: 200, top: 0, left: 0, bottom: 0, right: 0, x: 0, y: 0, toJSON: () => ({}) });
    Object.defineProperty(window, 'devicePixelRatio', { value: 0, writable: true });

    const dims = setupHiDPICanvas(canvas, ctx);
    expect(dims.dpr).toBe(1);
    expect(canvas.width).toBe(300);
  });
});
