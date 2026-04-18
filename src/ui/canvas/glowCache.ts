/**
 * Offscreen pre-rendered glow sprites for neurons.
 *
 * Rendering radial gradients every frame is expensive. We render each
 * (color, radius) combination once to an offscreen canvas and drawImage
 * from cache in the hot draw loop. Cache is bounded by
 * CANVAS.glowCacheMaxEntries (FIFO eviction) — 5 neuron types × ~4 size
 * variants is a typical upper bound.
 *
 * Implements CODE-4 "Pre-render glow" requirement.
 */

import { CANVAS } from '../tokens';

export interface GlowSprite {
  canvas: HTMLCanvasElement;
  halfSize: number; // sprite is drawn centered; halfSize = cssSize / 2
}

const cache = new Map<string, GlowSprite>();

export function getGlowSprite(color: string, neuronRadius: number): GlowSprite {
  const key = `${color}-${neuronRadius}`;
  const existing = cache.get(key);
  if (existing) return existing;

  if (cache.size >= CANVAS.glowCacheMaxEntries) {
    // Evict oldest (Map preserves insertion order → FIFO).
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) cache.delete(firstKey);
  }

  const sprite = renderGlowSprite(color, neuronRadius);
  cache.set(key, sprite);
  return sprite;
}

function renderGlowSprite(color: string, neuronRadius: number): GlowSprite {
  const glowRadius = neuronRadius * CANVAS.glowRadiusMultiplier;
  const size = Math.ceil(glowRadius * 2); // CONST-OK: diameter = 2 × radius (geometric intrinsic)
  const halfSize = size / 2; // CONST-OK: center = size / 2 (geometric intrinsic)

  const spriteCanvas = document.createElement('canvas');
  spriteCanvas.width = size;
  spriteCanvas.height = size;

  const sctx = spriteCanvas.getContext('2d');
  if (!sctx) throw new Error('getGlowSprite: failed to acquire 2D context for offscreen canvas');

  const gradient = sctx.createRadialGradient(halfSize, halfSize, 0, halfSize, halfSize, glowRadius);
  gradient.addColorStop(0, color + 'AA'); // hex alpha suffix — visible at center
  gradient.addColorStop(1, color + '00'); // transparent at edge

  sctx.fillStyle = gradient;
  sctx.fillRect(0, 0, size, size);

  return { canvas: spriteCanvas, halfSize };
}

export function clearGlowCache(): void {
  cache.clear();
}

export function getGlowCacheSize(): number {
  return cache.size;
}
