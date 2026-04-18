/**
 * Theme type system (Sprint 2 Phase 4).
 *
 * A `Theme` is the composed output of Era base + cosmetic overrides.
 * Era base lives in `ERA_THEMES` (closed registry, 3 entries).
 * Cosmetic overrides live in 4 separate registries — see
 * `cosmeticOverrides.ts`. `useActiveTheme()` composes them.
 *
 * Per GDD §3b "Canvas theme slots (9 total)": 3 Eras + 6 cosmetic
 * canvas themes = 9 total addressable theme slots.
 */

import type { NeuronType, EraVisualTheme } from '../../types';

export interface NeuronThemeEntry {
  color: string;
  glowColor: string;
}

export interface GlowPackConfig {
  radiusMultiplier: number;
  opacityMax: number;
  opacityMin: number;
}

export interface Theme {
  /** Composed theme ID. Equals Era ID when no cosmetic override active,
   *  or the cosmetic ID when an override is applied. */
  id: string;

  /** Era this theme derives from. Always one of the 3 closed-union Era
   *  values, never a cosmetic ID — this stays type-safe even when the
   *  composed `id` is a cosmetic string. */
  era: EraVisualTheme;

  /** Canvas base fill color. */
  canvasBackground: string;

  /** Optional overlay/gradient layer (e.g. cosmic aurora effect). */
  canvasBackgroundGradient?: string;

  /** Per-type neuron palette — 5 types per GDD §5. */
  neurons: Record<NeuronType, NeuronThemeEntry>;

  /** Focus Bar fill color (Phase 5 HUD consumes). */
  focusBarFill: string;

  /** Consciousness Bar fill — default case. */
  consciousnessBarFill: string;

  /** P26 override per NARRATIVE:476 ("consciousness bar is no longer
   *  purple — it's white-gold"). Only Era bioluminescent needs this
   *  override; Eras 2/3 may omit (undefined → fall back to
   *  consciousnessBarFill at P26 if not provided). */
  consciousnessBarP26Override?: string;

  /** Glow pack parameters — overridable by cosmetic glow packs. */
  glowPack: GlowPackConfig;

  /** True for Eras 2/3 Phase 4 stubs that inherit from bioluminescent
   *  pending Sprint 9+ palette tuning. Used by HUD to surface a dev-only
   *  warning; does not affect player-facing behavior. */
  isInterim?: boolean;
}
