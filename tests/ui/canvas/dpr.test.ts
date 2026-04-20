// @vitest-environment jsdom
// Tests for src/ui/canvas/dpr.ts — requires HTMLCanvasElement + window.

import { describe, expect, test } from 'vitest';
import { setupHiDPICanvas } from '../../../src/ui/canvas/dpr';

describe('setupHiDPICanvas', () => {
  test('sets canvas pixel buffer to window.innerWidth × dpr', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no 2d ctx');

    Object.defineProperty(window, 'devicePixelRatio', { value: 2, writable: true });
    Object.defineProperty(window, 'innerWidth', { value: 400, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 600, writable: true });

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

    Object.defineProperty(window, 'devicePixelRatio', { value: 0, writable: true });
    Object.defineProperty(window, 'innerWidth', { value: 300, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 200, writable: true });

    const dims = setupHiDPICanvas(canvas, ctx);
    expect(dims.dpr).toBe(1);
    expect(canvas.width).toBe(300);
  });
});
