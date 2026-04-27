/**
 * Canvas 2D renderer — pure draw() function.
 *
 * Visual contract (Sprint 2 Phase 2):
 * - Neurons render as stroked + semi-transparent-filled circles (UI_MOCKUPS pattern)
 * - Pre-rendered glow halo behind each neuron (getGlowSprite)
 * - Ambient pulse: radius ±pulseRadiusAmp and opacity [pulseOpacityMin..pulseOpacityMax]
 *   via sin(2π × elapsedMs / durPulse) — MOTION tokens govern envelope
 * - Deterministic placement (no Math.random) so rendering is replay-safe
 *
 * Visual radii from CANVAS.neuronRadii (Phase 2 mapping, GDD §3b).
 * Visual radii are NOT tap hit-areas — Phase 3 adds a separate hit-test
 * layer enforcing CODE-4 touch-target minimums.
 *
 * Phase 2 scope: render N neurons from state.neurons. HUD, tabs, and
 * background effects (particles, connection lines) are Phase 4+.
 */

import type { GameState } from '../../types/GameState';
import type { NeuronType } from '../../types';
import { SYNAPSE_CONSTANTS } from '../../config/constants';
import { CANVAS, MOTION } from '../tokens';
import type { Theme } from '../theme/types';
import { THEME_BIOLUMINESCENT } from '../theme/themes';
import { getGlowSprite } from './glowCache';

/**
 * Pre-launch audit Tier 2 (G-1) — colorblind tier numeral mapping. Each
 * neuron type gets a 1-based tier index; when state.colorblindMode is true
 * the renderer draws this numeral inside the neuron so the type is
 * distinguishable without color. CONST-OK — the mapping mirrors the
 * declaration order in src/config/neurons.ts and is canonical.
 */
const TIER_NUMERAL: Readonly<Record<NeuronType, string>> = {
  basica: '1',
  sensorial: '2', // CONST-OK colorblind glyph (string literal, not a tunable)
  piramidal: '3', // CONST-OK colorblind glyph (string literal, not a tunable)
  espejo: '4', // CONST-OK colorblind glyph (string literal, not a tunable)
  integradora: '5', // CONST-OK colorblind glyph (string literal, not a tunable)
};

/**
 * Re-exported as `BIOLUMINESCENT_THEME` for backwards-compatible tests
 * that predate the Phase 4 theme system. New code should consume the
 * full `Theme` via `useActiveTheme()` — this single-export path is
 * for test fixtures only.
 */
export const BIOLUMINESCENT_THEME: Theme = THEME_BIOLUMINESCENT;

export interface DrawDims {
  width: number;
  height: number;
}

const TWO_PI = Math.PI * 2; // CONST-OK: full radian circle (geometric intrinsic)

export function draw(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  theme: Theme,
  dims: DrawDims,
  elapsedMs: number,
): void {
  ctx.fillStyle = theme.canvasBackground;
  ctx.fillRect(0, 0, dims.width, dims.height);

  // Sprint 10 Phase 10.5 — reducedMotion freezes the ambient pulse: radiusMult
  // pinned to 1, opacity pinned to the glow's max so neurons render statically
  // at their brightest. Same draw path otherwise; no rAF cancellation needed
  // since the inputs to drawNeuron are now time-invariant.
  const pulsePhase = state.reducedMotion ? 0 : Math.sin((elapsedMs / MOTION.durPulse) * TWO_PI); // -1..1
  const radiusMult = 1 + pulsePhase * MOTION.pulseRadiusAmp;
  const normalized = state.reducedMotion ? 1 : (pulsePhase + 1) / 2; // CONST-OK: sin(-1..1) → (0..1) mapping
  const opacity =
    theme.glowPack.opacityMin + normalized * (theme.glowPack.opacityMax - theme.glowPack.opacityMin);

  // Enforce the CODE-4 "Max 80 visible nodes" cap. State may contain more
  // than 80 neurons (e.g. late-game or Phase 7 stress harness); we draw
  // min(totalCount, maxVisibleNodes) and drop the overflow. Preserves
  // deterministic placement — lower globalIndex draws first (type order:
  // basica → sensorial → piramidal → espejo → integradora).
  let globalIndex = 0;
  const visibleCap = SYNAPSE_CONSTANTS.maxVisibleNodes;
  outer: for (const neuron of state.neurons) {
    if (neuron.count <= 0) continue;
    const baseRadius = CANVAS.neuronRadii[neuron.type];
    const entry = theme.neurons[neuron.type];
    // G-1: pass the tier numeral only when colorblindMode is enabled.
    // The drawNeuron signature accepts string|null so the no-glyph fast path
    // (most players) skips the canvas fillText call entirely.
    const numeral = state.colorblindMode ? TIER_NUMERAL[neuron.type] : null;
    for (let i = 0; i < neuron.count; i++) {
      if (globalIndex >= visibleCap) break outer;
      drawNeuron(ctx, entry.color, baseRadius, radiusMult, opacity, globalIndex, dims, numeral);
      globalIndex++;
    }
  }
}

function drawNeuron(
  ctx: CanvasRenderingContext2D,
  color: string,
  baseRadius: number,
  radiusMult: number,
  opacity: number,
  index: number,
  dims: DrawDims,
  numeral: string | null,
): void {
  const { x, y } = getNeuronPosition(index, dims);
  const pulsedRadius = baseRadius * radiusMult;

  const sprite = getGlowSprite(color, baseRadius);
  const prevAlpha = ctx.globalAlpha;
  ctx.globalAlpha = opacity;
  ctx.drawImage(sprite.canvas, x - sprite.halfSize, y - sprite.halfSize);

  ctx.beginPath();
  ctx.arc(x, y, pulsedRadius, 0, TWO_PI);
  ctx.fillStyle = color + CANVAS.neuronFillOpacityHex;
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = CANVAS.neuronStrokeWidth;
  ctx.stroke();

  // G-1: tier numeral overlay (colorblind mode only). Drawn full-opacity
  // in white (CANVAS.colorblindGlyphColor) so it contrasts against the
  // semi-transparent fill. Font sized proportional to the radius via
  // CANVAS.colorblindGlyphSizeRatio.
  if (numeral !== null) {
    ctx.globalAlpha = 1; // CONST-OK reset to opaque for legibility
    ctx.fillStyle = CANVAS.colorblindGlyphColor;
    ctx.font = `bold ${Math.round(baseRadius * CANVAS.colorblindGlyphSizeRatio)}px var(--font-display, system-ui)`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(numeral, x, y);
  }

  ctx.globalAlpha = prevAlpha;
}

export function getNeuronPosition(index: number, dims: DrawDims): { x: number; y: number } {
  const cx = dims.width / 2; // CONST-OK: canvas center = width / 2 (geometric intrinsic)
  const cy = dims.height / 2; // CONST-OK: canvas center = height / 2 (geometric intrinsic)
  if (index === 0) return { x: cx, y: cy };
  const angle = index * CANVAS.scatterGoldenAngle;
  const r = CANVAS.scatterBaseRadius + index * CANVAS.scatterRadiusStep;
  return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
}
