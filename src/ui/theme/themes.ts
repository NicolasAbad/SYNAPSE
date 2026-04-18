/**
 * Era theme registry (Sprint 2 Phase 4).
 *
 * 3 Era themes — bioluminescent (real), digital + cosmic (interim stubs
 * inherit bioluminescent palette). Sprint 9+ will tune Era 2/3 after
 * players start reaching P10 / P19.
 *
 * Per GDD §3b: the 6 cosmetic canvas themes (aurora, deep_ocean,
 * deep_space, temple, genius_gold, neon_pulse) are NOT in this registry
 * — they live in `cosmeticOverrides.ts` and layer on top via
 * `useActiveTheme()` composition.
 */

import type { EraVisualTheme } from '../../types';
import { CANVAS, COLORS, MOTION } from '../tokens';
import type { Theme } from './types';

const BIOLUMINESCENT_GLOW = {
  radiusMultiplier: CANVAS.glowRadiusMultiplier,
  opacityMax: MOTION.pulseOpacityMax,
  opacityMin: MOTION.pulseOpacityMin,
};

export const THEME_BIOLUMINESCENT: Theme = {
  id: 'bioluminescent',
  era: 'bioluminescent',
  canvasBackground: COLORS.bgDeep,
  neurons: {
    basica: { color: COLORS.neuronBasica, glowColor: COLORS.neuronBasica },
    sensorial: { color: COLORS.neuronSensorial, glowColor: COLORS.neuronSensorial },
    piramidal: { color: COLORS.neuronPiramidal, glowColor: COLORS.neuronPiramidal },
    espejo: { color: COLORS.neuronEspejo, glowColor: COLORS.neuronEspejo },
    integradora: { color: COLORS.neuronIntegradora, glowColor: COLORS.neuronIntegradora },
  },
  focusBarFill: COLORS.focusBar,
  consciousnessBarFill: COLORS.consciousnessBar,
  consciousnessBarP26Override: COLORS.consciousnessBarP26,
  glowPack: BIOLUMINESCENT_GLOW,
};

/**
 * Era 2 — per NARRATIVE:60 "clean geometry of thought made precise".
 * INTERIM: inherits bioluminescent palette + flag. Sprint 9+ tunes
 * cooler/sharper hues once player-reach-P10 testing validates the
 * aesthetic direction.
 */
export const THEME_DIGITAL: Theme = {
  ...THEME_BIOLUMINESCENT,
  id: 'digital',
  era: 'digital',
  isInterim: true,
};

/**
 * Era 3 — per NARRATIVE §Era 3 aurora aesthetic + NARRATIVE:476 P26
 * white-gold moment. INTERIM: inherits bioluminescent. Sprint 9+
 * adds aurora gradient overlay + per-P26-cycle palette shift.
 */
export const THEME_COSMIC: Theme = {
  ...THEME_BIOLUMINESCENT,
  id: 'cosmic',
  era: 'cosmic',
  isInterim: true,
};

export const ERA_THEMES: Record<EraVisualTheme, Theme> = {
  bioluminescent: THEME_BIOLUMINESCENT,
  digital: THEME_DIGITAL,
  cosmic: THEME_COSMIC,
};
