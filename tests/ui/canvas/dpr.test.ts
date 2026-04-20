// @vitest-environment jsdom
// Tests for src/ui/canvas/dpr.ts — requires HTMLCanvasElement + window.

import { describe, expect, test } from 'vitest';
import { resizeHiDPICanvas, setupHiDPICanvas } from '../../../src/ui/canvas/dpr';

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
    expect(canvas.style.width).toBe('400px');
    expect(canvas.style.height).toBe('600px');
  });

  test('resizeHiDPICanvas uses explicit width/height instead of window.inner*', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no 2d ctx');

    Object.defineProperty(window, 'devicePixelRatio', { value: 2, writable: true });
    Object.defineProperty(window, 'innerWidth', { value: 999, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 999, writable: true });

    const dims = resizeHiDPICanvas(canvas, ctx, 500, 700);
    expect(dims.width).toBe(500);
    expect(dims.height).toBe(700);
    expect(canvas.width).toBe(1000); // CONST-OK: 500 × 2 dpr
    expect(canvas.height).toBe(1400); // CONST-OK: 700 × 2 dpr
  });

  test('falls back to screen.width/height when window.innerWidth is 0 (Android WebView background launch)', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no 2d ctx');

    Object.defineProperty(window, 'devicePixelRatio', { value: 2, writable: true });
    Object.defineProperty(window, 'innerWidth', { value: 0, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 0, writable: true });
    Object.defineProperty(screen, 'width', { value: 360, writable: true });
    Object.defineProperty(screen, 'height', { value: 780, writable: true });

    const dims = setupHiDPICanvas(canvas, ctx);
    expect(dims.width).toBe(360);
    expect(dims.height).toBe(780);
    expect(canvas.width).toBe(720); // CONST-OK: 360 × 2 dpr
    expect(canvas.height).toBe(1560); // CONST-OK: 780 × 2 dpr
    expect(canvas.style.width).toBe('360px');
    expect(canvas.style.height).toBe('780px');
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
