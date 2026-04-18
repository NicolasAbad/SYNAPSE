// @vitest-environment jsdom
// Tests for src/ui/canvas/glowCache.ts — requires document.createElement('canvas').

import { afterEach, describe, expect, test } from 'vitest';
import {
  clearGlowCache,
  getGlowCacheSize,
  getGlowSprite,
} from '../../../src/ui/canvas/glowCache';
import { CANVAS } from '../../../src/ui/tokens';

afterEach(() => {
  clearGlowCache();
});

describe('getGlowSprite — cache behavior', () => {
  test('same (color, radius) returns identical sprite (cache hit)', () => {
    const a = getGlowSprite('#4090E0', 8);
    const b = getGlowSprite('#4090E0', 8);
    expect(a).toBe(b); // same reference → cache hit
  });

  test('different color creates new cache entry', () => {
    clearGlowCache();
    getGlowSprite('#4090E0', 8);
    expect(getGlowCacheSize()).toBe(1);
    getGlowSprite('#22B07A', 8);
    expect(getGlowCacheSize()).toBe(2);
  });

  test('different radius for same color creates new cache entry', () => {
    clearGlowCache();
    getGlowSprite('#4090E0', 8);
    getGlowSprite('#4090E0', 16);
    expect(getGlowCacheSize()).toBe(2);
  });

  test('sprite has expected halfSize (cssSize / 2)', () => {
    const sprite = getGlowSprite('#8B7FE8', 12);
    // size = ceil(12 × glowRadiusMultiplier × 2); halfSize = size / 2
    const expectedSize = Math.ceil(12 * CANVAS.glowRadiusMultiplier * 2); // CONST-OK: intrinsic
    expect(sprite.halfSize).toBe(expectedSize / 2); // CONST-OK: intrinsic half
  });

  test('sprite canvas has width + height set', () => {
    const sprite = getGlowSprite('#E06090', 14);
    expect(sprite.canvas.width).toBeGreaterThan(0);
    expect(sprite.canvas.height).toBe(sprite.canvas.width); // square
  });
});

describe('glow cache eviction (FIFO, bounded)', () => {
  test('cache size stays at or below glowCacheMaxEntries', () => {
    clearGlowCache();
    // Fill past the cap with distinct entries
    for (let i = 0; i < CANVAS.glowCacheMaxEntries + 5; i++) {
      getGlowSprite('#4090E0', i + 1);
    }
    expect(getGlowCacheSize()).toBeLessThanOrEqual(CANVAS.glowCacheMaxEntries);
  });

  test('first-inserted entry is evicted first (FIFO)', () => {
    clearGlowCache();
    // Insert maxEntries distinct sprites
    const firstKey = { color: '#FF0000', radius: 1 };
    getGlowSprite(firstKey.color, firstKey.radius);
    for (let i = 2; i <= CANVAS.glowCacheMaxEntries; i++) {
      getGlowSprite('#00FF00', i);
    }
    expect(getGlowCacheSize()).toBe(CANVAS.glowCacheMaxEntries);

    // Insert one more → evicts firstKey
    getGlowSprite('#0000FF', 99);
    expect(getGlowCacheSize()).toBe(CANVAS.glowCacheMaxEntries);

    // Re-requesting firstKey should re-render (cache miss → size still same cap)
    const refetched = getGlowSprite(firstKey.color, firstKey.radius);
    expect(refetched).toBeDefined();
    expect(getGlowCacheSize()).toBe(CANVAS.glowCacheMaxEntries);
  });
});
