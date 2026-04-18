/**
 * Cosmetic override registries (Sprint 2 Phase 4 — EMPTY).
 *
 * Four separate records — one per cosmetic category — keep IDs scoped
 * so pre-existing cross-category collisions (`aurora`: neuron skin +
 * canvas theme; `plasma`: neuron skin + glow pack — see GDD §26
 * "Cross-category ID collisions") never clash at the runtime registry
 * level. Lookups are always category-scoped:
 * `NEURON_SKINS[state.activeNeuronSkin]`.
 *
 * Phase 4 Sprint 2 ships these registries EMPTY. Sprint 9 + 9b populate:
 * - NEURON_SKINS: 8 entries (ember, frost, void, plasma, aurora, crystal, spore, nebula)
 * - CANVAS_THEMES: 6 entries (4 store: aurora, deep_ocean, deep_space, temple
 *                  + 1 subscriber exclusive: genius_gold
 *                  + 1 starter pack exclusive: neon_pulse)
 * - GLOW_PACKS: 3 entries (firefly, halo, plasma)
 * - HUD_STYLES: 1 entry (minimal — Phase 5 HUD defines the shape)
 */

import type { NeuronType } from '../../types';
import type { GlowPackConfig, NeuronThemeEntry, Theme } from './types';

export type NeuronSkinOverride = Partial<Record<NeuronType, Partial<NeuronThemeEntry>>>;
export type CanvasThemeOverride = Partial<Theme>;

export const NEURON_SKINS: Record<string, NeuronSkinOverride> = {};
export const CANVAS_THEMES: Record<string, CanvasThemeOverride> = {};
export const GLOW_PACKS: Record<string, GlowPackConfig> = {};
// Phase 5 HUD defines the HudStyle type; Phase 4 stubs as unknown.
export const HUD_STYLES: Record<string, unknown> = {};
