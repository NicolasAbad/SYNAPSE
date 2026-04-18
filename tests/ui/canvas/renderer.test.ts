// @vitest-environment jsdom
// Tests for src/ui/canvas/renderer.ts — pure draw() with mock ctx.
// jsdom is needed because draw() calls getGlowSprite which uses document.createElement.

import { describe, expect, test, vi } from 'vitest';
import { BIOLUMINESCENT_THEME, draw, getNeuronPosition } from '../../../src/ui/canvas/renderer';
import type { GameState } from '../../../src/types/GameState';
import type { NeuronState } from '../../../src/types';
import { createDefaultState } from '../../../src/store/gameStore';

// Minimal mock CanvasRenderingContext2D — only methods called by draw().
function makeMockCtx() {
  const calls: string[] = [];
  const track =
    (name: string) =>
    (..._args: unknown[]): void => {
      calls.push(name);
    };
  const ctx = {
    fillRect: track('fillRect'),
    arc: vi.fn().mockImplementation(track('arc')),
    beginPath: track('beginPath'),
    fill: track('fill'),
    stroke: track('stroke'),
    drawImage: track('drawImage'),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    globalAlpha: 1,
  } as unknown as CanvasRenderingContext2D;
  return { ctx, calls };
}

function stateWithNeurons(neurons: NeuronState[]): GameState {
  const state = createDefaultState();
  return { ...state, neurons };
}

const DIMS = { width: 400, height: 600 };

describe('draw — background + basic structure', () => {
  test('clears canvas with theme background on every call', () => {
    const { ctx, calls } = makeMockCtx();
    draw(ctx, stateWithNeurons([]), BIOLUMINESCENT_THEME, DIMS, 0);
    expect(calls[0]).toBe('fillRect'); // background clear is first
    expect(ctx.fillStyle).toBeTruthy(); // set during the call
  });

  test('empty neurons array draws only the background', () => {
    const { ctx, calls } = makeMockCtx();
    draw(ctx, stateWithNeurons([]), BIOLUMINESCENT_THEME, DIMS, 0);
    expect(calls.filter((c) => c === 'arc')).toHaveLength(0);
  });

  test('neurons with count 0 do not draw', () => {
    const { ctx, calls } = makeMockCtx();
    const neurons: NeuronState[] = [
      { type: 'basica', count: 0 },
      { type: 'sensorial', count: 0 },
    ];
    draw(ctx, stateWithNeurons(neurons), BIOLUMINESCENT_THEME, DIMS, 0);
    expect(calls.filter((c) => c === 'arc')).toHaveLength(0);
  });
});

describe('draw — neuron circle rendering', () => {
  test('1 Básica draws exactly 1 arc (the circle itself)', () => {
    const { ctx, calls } = makeMockCtx();
    draw(ctx, stateWithNeurons([{ type: 'basica', count: 1 }]), BIOLUMINESCENT_THEME, DIMS, 0);
    const arcCalls = calls.filter((c) => c === 'arc');
    expect(arcCalls).toHaveLength(1);
  });

  test('N neurons of mixed types produce N arcs', () => {
    const { ctx, calls } = makeMockCtx();
    const neurons: NeuronState[] = [
      { type: 'basica', count: 3 },
      { type: 'sensorial', count: 2 },
    ];
    draw(ctx, stateWithNeurons(neurons), BIOLUMINESCENT_THEME, DIMS, 0);
    expect(calls.filter((c) => c === 'arc')).toHaveLength(5);
  });

  test('each neuron produces glow drawImage + stroke + fill', () => {
    const { ctx, calls } = makeMockCtx();
    draw(ctx, stateWithNeurons([{ type: 'basica', count: 1 }]), BIOLUMINESCENT_THEME, DIMS, 0);
    expect(calls.filter((c) => c === 'drawImage')).toHaveLength(1);
    expect(calls.filter((c) => c === 'fill')).toHaveLength(1);
    expect(calls.filter((c) => c === 'stroke')).toHaveLength(1);
  });
});

describe('draw — ambient pulse produces time-varying radius', () => {
  test('elapsedMs progression yields different arc radii', () => {
    const radii: number[] = [];
    for (const t of [0, 300, 600, 900, 1200]) {
      const { ctx } = makeMockCtx();
      const arcSpy = vi.spyOn(ctx, 'arc');
      draw(ctx, stateWithNeurons([{ type: 'piramidal', count: 1 }]), BIOLUMINESCENT_THEME, DIMS, t);
      // arc(x, y, radius, 0, TWO_PI) — 3rd arg is radius
      const call = arcSpy.mock.calls[0];
      if (call) radii.push(call[2] as number);
    }
    const unique = new Set(radii);
    expect(unique.size).toBeGreaterThan(1); // pulse is actually varying
  });
});

describe('getNeuronPosition — deterministic placement', () => {
  test('index 0 is centered on canvas', () => {
    const { x, y } = getNeuronPosition(0, DIMS);
    expect(x).toBe(DIMS.width / 2);
    expect(y).toBe(DIMS.height / 2);
  });

  test('same index always produces same position (determinism)', () => {
    const a = getNeuronPosition(5, DIMS);
    const b = getNeuronPosition(5, DIMS);
    expect(a).toEqual(b);
  });

  test('different indices produce different positions', () => {
    const a = getNeuronPosition(1, DIMS);
    const b = getNeuronPosition(2, DIMS);
    expect(a).not.toEqual(b);
  });
});
