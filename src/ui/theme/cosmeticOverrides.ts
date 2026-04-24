/**
 * Cosmetic override registries (Sprint 9b Phase 9b.2 — populated).
 *
 * Four separate records — one per cosmetic category — keep IDs scoped
 * so pre-existing cross-category collisions (`aurora`: neuron skin +
 * canvas theme; `plasma`: neuron skin + glow pack — see GDD §26
 * "Cross-category ID collisions") never clash at the runtime registry
 * level. Lookups are always category-scoped:
 * `NEURON_SKINS[state.activeNeuronSkin]`.
 *
 * Registry contents (18 total):
 * - NEURON_SKINS (8): ember, frost, void, plasma, aurora, crystal, spore, nebula
 * - CANVAS_THEMES (6): aurora, deep_ocean, deep_space, temple (store IAP)
 *                       + genius_gold (Genius Pass exclusive)
 *                       + neon_pulse (Starter Pack exclusive)
 * - GLOW_PACKS (3): firefly, halo, plasma
 * - HUD_STYLES (1): minimal
 *
 * Colors + glow numbers proposed by Claude Phase 9b.2 per GDD narrative
 * atmosphere hints; Nico reviews/edits per V-b workflow.
 */

import type { NeuronType } from '../../types';
import type { GlowPackConfig, HudStyleConfig, NeuronThemeEntry, Theme } from './types';

export type NeuronSkinOverride = Partial<Record<NeuronType, Partial<NeuronThemeEntry>>>;
export type CanvasThemeOverride = Partial<Theme>;

// ─────────────────────────────────────────────────────────────────────
// Neuron skins (8) — each overrides the per-type palette. Uses the same
// 5 NeuronType keys as Era themes; full palettes per skin keep the game
// visually coherent (no "half-skinned" looks when a skin omits a type).
// ─────────────────────────────────────────────────────────────────────
export const NEURON_SKINS: Record<string, NeuronSkinOverride> = {
  ember: {
    basica:      { color: '#ff7043', glowColor: '#ff5722' }, // CONST-OK cosmetic palette — ember warm-orange
    sensorial:   { color: '#ff9800', glowColor: '#f57c00' }, // CONST-OK cosmetic palette
    piramidal:   { color: '#e53935', glowColor: '#c62828' }, // CONST-OK cosmetic palette
    espejo:      { color: '#ffb74d', glowColor: '#ff9800' }, // CONST-OK cosmetic palette
    integradora: { color: '#bf360c', glowColor: '#d84315' }, // CONST-OK cosmetic palette — deep ember
  },
  frost: {
    basica:      { color: '#b3e5fc', glowColor: '#81d4fa' }, // CONST-OK cosmetic palette — frost pale-cyan
    sensorial:   { color: '#4fc3f7', glowColor: '#29b6f6' }, // CONST-OK cosmetic palette
    piramidal:   { color: '#e1f5fe', glowColor: '#b3e5fc' }, // CONST-OK cosmetic palette
    espejo:      { color: '#80deea', glowColor: '#4dd0e1' }, // CONST-OK cosmetic palette
    integradora: { color: '#ffffff', glowColor: '#e0f7fa' }, // CONST-OK cosmetic palette — frost-white core
  },
  void: {
    basica:      { color: '#6a1b9a', glowColor: '#4a148c' }, // CONST-OK cosmetic palette — void deep-purple
    sensorial:   { color: '#7b1fa2', glowColor: '#6a1b9a' }, // CONST-OK cosmetic palette
    piramidal:   { color: '#311b92', glowColor: '#1a237e' }, // CONST-OK cosmetic palette
    espejo:      { color: '#4527a0', glowColor: '#311b92' }, // CONST-OK cosmetic palette
    integradora: { color: '#1a0033', glowColor: '#000019' }, // CONST-OK cosmetic palette — near-black
  },
  plasma: {
    basica:      { color: '#ec407a', glowColor: '#e91e63' }, // CONST-OK cosmetic palette — plasma hot-pink
    sensorial:   { color: '#ab47bc', glowColor: '#9c27b0' }, // CONST-OK cosmetic palette
    piramidal:   { color: '#ff1744', glowColor: '#d50000' }, // CONST-OK cosmetic palette
    espejo:      { color: '#f06292', glowColor: '#ec407a' }, // CONST-OK cosmetic palette
    integradora: { color: '#aa00ff', glowColor: '#7c00e6' }, // CONST-OK cosmetic palette
  },
  aurora: {
    basica:      { color: '#76ff03', glowColor: '#64dd17' }, // CONST-OK cosmetic palette — aurora green
    sensorial:   { color: '#ea80fc', glowColor: '#d500f9' }, // CONST-OK cosmetic palette — aurora pink
    piramidal:   { color: '#18ffff', glowColor: '#00e5ff' }, // CONST-OK cosmetic palette
    espejo:      { color: '#b9f6ca', glowColor: '#69f0ae' }, // CONST-OK cosmetic palette
    integradora: { color: '#e1bee7', glowColor: '#ce93d8' }, // CONST-OK cosmetic palette
  },
  crystal: {
    basica:      { color: '#e0e0ff', glowColor: '#c5cae9' }, // CONST-OK cosmetic palette — prism pale
    sensorial:   { color: '#ffebee', glowColor: '#ffcdd2' }, // CONST-OK cosmetic palette
    piramidal:   { color: '#e8f5e9', glowColor: '#c8e6c9' }, // CONST-OK cosmetic palette
    espejo:      { color: '#fff9c4', glowColor: '#fff59d' }, // CONST-OK cosmetic palette
    integradora: { color: '#ffffff', glowColor: '#e1f5fe' }, // CONST-OK cosmetic palette
  },
  spore: {
    basica:      { color: '#00bfa5', glowColor: '#00897b' }, // CONST-OK cosmetic palette — bioluminescent teal
    sensorial:   { color: '#1de9b6', glowColor: '#00bfa5' }, // CONST-OK cosmetic palette
    piramidal:   { color: '#004d40', glowColor: '#00695c' }, // CONST-OK cosmetic palette
    espejo:      { color: '#26a69a', glowColor: '#00796b' }, // CONST-OK cosmetic palette
    integradora: { color: '#84ffff', glowColor: '#18ffff' }, // CONST-OK cosmetic palette
  },
  nebula: {
    basica:      { color: '#5c6bc0', glowColor: '#3949ab' }, // CONST-OK cosmetic palette — cosmic indigo
    sensorial:   { color: '#7e57c2', glowColor: '#5e35b1' }, // CONST-OK cosmetic palette
    piramidal:   { color: '#1e3a5f', glowColor: '#0d1f3c' }, // CONST-OK cosmetic palette — deep space
    espejo:      { color: '#9575cd', glowColor: '#7e57c2' }, // CONST-OK cosmetic palette
    integradora: { color: '#ff80ab', glowColor: '#ff4081' }, // CONST-OK cosmetic palette — star-pink accent
  },
};

// ─────────────────────────────────────────────────────────────────────
// Canvas themes (6) — partial Theme overrides. Each touches
// canvasBackground + focusBarFill + consciousnessBarFill; glowPack is
// handled by separate GLOW_PACKS registry.
// ─────────────────────────────────────────────────────────────────────
export const CANVAS_THEMES: Record<string, CanvasThemeOverride> = {
  aurora: {
    canvasBackground: '#0d1826', // CONST-OK cosmetic palette — aurora dark base
    canvasBackgroundGradient: 'radial-gradient(ellipse at top, #1b3d5f 0%, #0d1826 60%, #050912 100%)', // CONST-OK CSS gradient
    focusBarFill: '#76ff03', // CONST-OK cosmetic palette — aurora green
    consciousnessBarFill: '#ea80fc', // CONST-OK cosmetic palette — aurora pink
  },
  deep_ocean: {
    canvasBackground: '#001e3c', // CONST-OK cosmetic palette — deep-sea blue
    canvasBackgroundGradient: 'radial-gradient(ellipse at bottom, #002b5c 0%, #001e3c 50%, #000814 100%)', // CONST-OK CSS gradient
    focusBarFill: '#00acc1', // CONST-OK cosmetic palette — surface-light cyan
    consciousnessBarFill: '#26c6da', // CONST-OK cosmetic palette
  },
  deep_space: {
    canvasBackground: '#000000', // CONST-OK cosmetic palette — pure black void
    canvasBackgroundGradient: 'radial-gradient(circle at 30% 30%, #1a0033 0%, #000000 50%, #000000 100%)', // CONST-OK CSS gradient
    focusBarFill: '#ffffff', // CONST-OK cosmetic palette — starlight white
    consciousnessBarFill: '#b39ddb', // CONST-OK cosmetic palette — nebula violet
  },
  temple: {
    canvasBackground: '#2e1a0f', // CONST-OK cosmetic palette — warm stone
    canvasBackgroundGradient: 'radial-gradient(ellipse at center, #4e342e 0%, #2e1a0f 70%, #1a0e07 100%)', // CONST-OK CSS gradient
    focusBarFill: '#ffc107', // CONST-OK cosmetic palette — temple gold
    consciousnessBarFill: '#ffb300', // CONST-OK cosmetic palette
  },
  // Genius Pass exclusive — subscribers-only; NOT purchasable as a standalone IAP.
  genius_gold: {
    canvasBackground: '#1a1000', // CONST-OK cosmetic palette — deep gold base
    canvasBackgroundGradient: 'radial-gradient(ellipse at top, #3e2723 0%, #1a1000 60%, #0d0700 100%)', // CONST-OK CSS gradient
    focusBarFill: '#ffd700', // CONST-OK cosmetic palette — pure gold
    consciousnessBarFill: '#ffb300', // CONST-OK cosmetic palette
  },
  // Starter Pack exclusive — bundled with starter_pack IAP; never sold standalone.
  neon_pulse: {
    canvasBackground: '#0a0a15', // CONST-OK cosmetic palette — near-black cool base
    canvasBackgroundGradient: 'radial-gradient(ellipse at center, #1a0030 0%, #0a0a15 60%, #050508 100%)', // CONST-OK CSS gradient
    focusBarFill: '#00ffff', // CONST-OK cosmetic palette — neon cyan
    consciousnessBarFill: '#ff00ff', // CONST-OK cosmetic palette — neon magenta
  },
};

// ─────────────────────────────────────────────────────────────────────
// Glow packs (3) — override the GlowPackConfig entirely.
// ─────────────────────────────────────────────────────────────────────
export const GLOW_PACKS: Record<string, GlowPackConfig> = {
  firefly: { radiusMultiplier: 1.6, opacityMax: 0.55, opacityMin: 0.15 }, // CONST-OK cosmetic glow tuning — firefly warm soft
  halo:    { radiusMultiplier: 2.4, opacityMax: 0.70, opacityMin: 0.25 }, // CONST-OK cosmetic glow tuning — halo wide bright
  plasma:  { radiusMultiplier: 1.2, opacityMax: 0.90, opacityMin: 0.40 }, // CONST-OK cosmetic glow tuning — plasma tight intense
};

// ─────────────────────────────────────────────────────────────────────
// HUD styles (1) — `minimal` reduces visual noise for focus-oriented players.
// HudStyleConfig shape approved Sprint 9b Phase 9b.2 V-c: 3 knobs
// (counterOpacity / hideSecondaryCounters / monochrome) sufficient for v1.0.
// POSTLAUNCH can extend this registry without schema change.
// ─────────────────────────────────────────────────────────────────────
export const HUD_STYLES: Record<string, HudStyleConfig> = {
  minimal: { counterOpacity: 0.6, hideSecondaryCounters: true, monochrome: false }, // CONST-OK cosmetic HUD tuning
};
