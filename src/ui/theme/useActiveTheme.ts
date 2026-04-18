/**
 * Hook that composes the active Theme from Era base + cosmetic overrides.
 *
 * Composition precedence (highest-index wins for the fields it touches):
 *   1. Era theme (base layer, from `state.eraVisualTheme`)
 *   2. Canvas theme cosmetic (overrides any Theme field via Partial<Theme>)
 *   3. Neuron skin cosmetic (merges per-type over composed neurons map)
 *   4. Glow pack cosmetic (replaces glowPack entirely)
 *
 * HUD style is consumed by Phase 5 HUD, not by the canvas renderer;
 * it is read separately from `state.activeHudStyle` and not returned
 * from this hook.
 *
 * Unknown cosmetic IDs silently fall back to Era defaults — robustness
 * for save-file corruption / future cosmetics deprecation (UI-8 graceful
 * fallback pattern).
 */

import { useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { CANVAS_THEMES, GLOW_PACKS, NEURON_SKINS } from './cosmeticOverrides';
import { ERA_THEMES } from './themes';
import type { Theme } from './types';

export function useActiveTheme(): Theme {
  const eraVisualTheme = useGameStore((s) => s.eraVisualTheme);
  const activeCanvasTheme = useGameStore((s) => s.activeCanvasTheme);
  const activeNeuronSkin = useGameStore((s) => s.activeNeuronSkin);
  const activeGlowPack = useGameStore((s) => s.activeGlowPack);

  return useMemo((): Theme => {
    const base = ERA_THEMES[eraVisualTheme];
    let composed: Theme = { ...base };

    if (activeCanvasTheme && CANVAS_THEMES[activeCanvasTheme]) {
      composed = { ...composed, ...CANVAS_THEMES[activeCanvasTheme], id: activeCanvasTheme };
    }

    if (activeNeuronSkin && NEURON_SKINS[activeNeuronSkin]) {
      const skinOverrides = NEURON_SKINS[activeNeuronSkin];
      const mergedNeurons = { ...composed.neurons };
      for (const type of Object.keys(skinOverrides) as (keyof typeof skinOverrides)[]) {
        const override = skinOverrides[type];
        if (override) {
          mergedNeurons[type] = { ...mergedNeurons[type], ...override };
        }
      }
      composed = { ...composed, neurons: mergedNeurons };
    }

    if (activeGlowPack && GLOW_PACKS[activeGlowPack]) {
      composed = { ...composed, glowPack: GLOW_PACKS[activeGlowPack] };
    }

    return composed;
  }, [eraVisualTheme, activeCanvasTheme, activeNeuronSkin, activeGlowPack]);
}
