// @vitest-environment jsdom
// Tests for src/ui/canvas/tapHandler.ts — pure hit-testing.
// jsdom is needed because tapHandler imports renderer which imports glowCache
// which touches `document` at import time? No — glowCache is lazy. But renderer's
// getNeuronPosition is pure, so strictly node should work. jsdom is cheap and
// future-proof against import-chain changes.

import { describe, expect, test } from 'vitest';
import { testHit } from '../../../src/ui/canvas/tapHandler';
import { createDefaultState } from '../../../src/store/gameStore';
import { CANVAS } from '../../../src/ui/tokens';
import type { GameState } from '../../../src/types/GameState';
import type { NeuronState } from '../../../src/types';
import { getNeuronPosition } from '../../../src/ui/canvas/renderer';

const DIMS = { width: 400, height: 600 };

function stateWith(neurons: NeuronState[]): GameState {
  return { ...createDefaultState(), neurons };
}

describe('testHit — hit inside visual circle', () => {
  test('tap on centered Básica (index 0) → hit: true, type basica', () => {
    const state = stateWith([{ type: 'basica', count: 1 }]);
    const { x, y } = getNeuronPosition(0, DIMS);
    const result = testHit(x, y, state, DIMS.width, DIMS.height);
    expect(result.hit).toBe(true);
    expect(result.neuronIndex).toBe(0);
    expect(result.neuronType).toBe('basica');
  });

  test('tap exactly on visual radius edge (8px) → hit', () => {
    const state = stateWith([{ type: 'basica', count: 1 }]);
    const { x, y } = getNeuronPosition(0, DIMS);
    const result = testHit(x + CANVAS.neuronRadii.basica, y, state, DIMS.width, DIMS.height);
    expect(result.hit).toBe(true);
  });
});

describe('testHit — 48dp minimum hit area (CODE-4)', () => {
  test('tap inside minHitRadiusPx (24) but outside visual (8) still hits Básica', () => {
    const state = stateWith([{ type: 'basica', count: 1 }]);
    const { x, y } = getNeuronPosition(0, DIMS);
    // 20px offset: beyond visual radius 8 but within minHitRadius 24
    const result = testHit(x + 20, y, state, DIMS.width, DIMS.height); // CONST-OK: inside-min-hit test offset
    expect(result.hit).toBe(true);
    expect(result.neuronType).toBe('basica');
  });

  test('tap just outside minHitRadius (25px) misses', () => {
    const state = stateWith([{ type: 'basica', count: 1 }]);
    const { x, y } = getNeuronPosition(0, DIMS);
    const result = testHit(x + 25, y, state, DIMS.width, DIMS.height); // CONST-OK: just-outside test offset
    expect(result.hit).toBe(false);
    expect(result.neuronIndex).toBeNull();
    expect(result.neuronType).toBeNull();
  });

  test('large-radius neuron uses visual radius not min when visual > min', () => {
    // Integradora visual radius 16 < min 24 → still uses min.
    // But if a future neuron were > 24, hit radius would be the visual.
    // This test documents Math.max behavior.
    const state = stateWith([{ type: 'integradora', count: 1 }]);
    const { x, y } = getNeuronPosition(0, DIMS);
    // 20px offset: inside min (24) but outside visual (16). Should hit via min.
    const result = testHit(x + 20, y, state, DIMS.width, DIMS.height); // CONST-OK: inside-min test offset
    expect(result.hit).toBe(true);
    expect(result.neuronType).toBe('integradora');
  });
});

describe('testHit — miss cases', () => {
  test('tap far from any neuron → hit: false', () => {
    const state = stateWith([{ type: 'basica', count: 1 }]);
    const result = testHit(0, 0, state, DIMS.width, DIMS.height);
    expect(result.hit).toBe(false);
  });

  test('empty neurons array → hit: false', () => {
    const state = stateWith([]);
    const { x, y } = getNeuronPosition(0, DIMS);
    const result = testHit(x, y, state, DIMS.width, DIMS.height);
    expect(result.hit).toBe(false);
  });

  test('all neurons count=0 → hit: false', () => {
    const state = stateWith([
      { type: 'basica', count: 0 },
      { type: 'sensorial', count: 0 },
    ]);
    const { x, y } = getNeuronPosition(0, DIMS);
    const result = testHit(x, y, state, DIMS.width, DIMS.height);
    expect(result.hit).toBe(false);
  });
});

describe('testHit — nearest-wins when multiple candidates overlap', () => {
  test('returns nearest by centre distance when two hit areas overlap', () => {
    // Two Básicas: globalIndex 0 at canvas centre, globalIndex 1 at scatter pos.
    const state = stateWith([{ type: 'basica', count: 2 }]);
    const p1 = getNeuronPosition(1, DIMS);
    const result = testHit(p1.x, p1.y, state, DIMS.width, DIMS.height);
    expect(result.hit).toBe(true);
    expect(result.neuronIndex).toBe(1); // index 1 is closer
  });
});

describe('testHit — purity / determinism', () => {
  test('same inputs → same result across calls', () => {
    const state = stateWith([{ type: 'basica', count: 1 }]);
    const { x, y } = getNeuronPosition(0, DIMS);
    const a = testHit(x, y, state, DIMS.width, DIMS.height);
    const b = testHit(x, y, state, DIMS.width, DIMS.height);
    expect(a).toEqual(b);
  });
});
