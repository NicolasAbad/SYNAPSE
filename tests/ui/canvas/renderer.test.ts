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
  const fillTextArgs: string[] = [];
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
    fillText: vi.fn().mockImplementation((text: string) => {
      calls.push('fillText');
      fillTextArgs.push(text);
    }),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    globalAlpha: 1,
    font: '',
    textAlign: '',
    textBaseline: '',
  } as unknown as CanvasRenderingContext2D;
  return { ctx, calls, fillTextArgs };
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

describe('draw — max visible nodes cap (Sprint 2 Phase 7)', () => {
  test('100 neurons in state → exactly maxVisibleNodes arcs drawn', () => {
    const { ctx, calls } = makeMockCtx();
    // 20 per type × 5 types = 100 total, capped to maxVisibleNodes (80)
    const neurons: NeuronState[] = [
      { type: 'basica', count: 20 },
      { type: 'sensorial', count: 20 },
      { type: 'piramidal', count: 20 },
      { type: 'espejo', count: 20 },
      { type: 'integradora', count: 20 },
    ];
    draw(ctx, stateWithNeurons(neurons), BIOLUMINESCENT_THEME, DIMS, 0);
    // arcs === drawn neurons; drawImage mirrors it 1:1
    expect(calls.filter((c) => c === 'arc')).toHaveLength(80);
    expect(calls.filter((c) => c === 'drawImage')).toHaveLength(80);
  });

  test('below cap (50 total) draws all neurons', () => {
    const { ctx, calls } = makeMockCtx();
    const neurons: NeuronState[] = [
      { type: 'basica', count: 25 },
      { type: 'sensorial', count: 25 },
    ];
    draw(ctx, stateWithNeurons(neurons), BIOLUMINESCENT_THEME, DIMS, 0);
    expect(calls.filter((c) => c === 'arc')).toHaveLength(50);
  });

  test('exactly at cap (80 total) draws all 80', () => {
    const { ctx, calls } = makeMockCtx();
    const neurons: NeuronState[] = [{ type: 'basica', count: 80 }];
    draw(ctx, stateWithNeurons(neurons), BIOLUMINESCENT_THEME, DIMS, 0);
    expect(calls.filter((c) => c === 'arc')).toHaveLength(80);
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

describe('draw — colorblindMode tier numerals (Pre-launch audit Tier 2 G-1)', () => {
  test('default state (colorblindMode=false): no fillText calls', () => {
    const { ctx, calls } = makeMockCtx();
    draw(ctx, stateWithNeurons([{ type: 'basica', count: 3 }]), BIOLUMINESCENT_THEME, DIMS, 0);
    expect(calls.filter((c) => c === 'fillText')).toHaveLength(0);
  });

  test('colorblindMode=true draws one numeral per visible neuron', () => {
    const { ctx, calls, fillTextArgs } = makeMockCtx();
    const state = { ...stateWithNeurons([{ type: 'basica', count: 3 }]), colorblindMode: true };
    draw(ctx, state, BIOLUMINESCENT_THEME, DIMS, 0);
    expect(calls.filter((c) => c === 'fillText')).toHaveLength(3);
    expect(fillTextArgs.every((s) => s === '1')).toBe(true);
  });

  test('colorblindMode draws each tier numeral 1-5 for its corresponding type', () => {
    const { ctx, fillTextArgs } = makeMockCtx();
    const state = {
      ...stateWithNeurons([
        { type: 'basica', count: 1 },
        { type: 'sensorial', count: 1 },
        { type: 'piramidal', count: 1 },
        { type: 'espejo', count: 1 },
        { type: 'integradora', count: 1 },
      ]),
      colorblindMode: true,
    };
    draw(ctx, state, BIOLUMINESCENT_THEME, DIMS, 0);
    expect(fillTextArgs).toEqual(['1', '2', '3', '4', '5']);
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
