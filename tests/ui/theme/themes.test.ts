// Tests for src/ui/theme/themes.ts — ERA_THEMES registry structure.

import { describe, expect, test } from 'vitest';
import {
  ERA_THEMES,
  THEME_BIOLUMINESCENT,
  THEME_COSMIC,
  THEME_DIGITAL,
} from '../../../src/ui/theme/themes';

const NEURON_TYPES = ['basica', 'sensorial', 'piramidal', 'espejo', 'integradora'] as const;

describe('ERA_THEMES registry — GDD §3b "9 theme slots" (3 Era entries)', () => {
  test('has exactly 3 entries keyed by EraVisualTheme', () => {
    expect(Object.keys(ERA_THEMES).sort()).toEqual(['bioluminescent', 'cosmic', 'digital']);
  });

  test('bioluminescent is the only non-interim Era (Phase 4 scope)', () => {
    expect(ERA_THEMES.bioluminescent.isInterim).toBeUndefined();
    expect(ERA_THEMES.digital.isInterim).toBe(true);
    expect(ERA_THEMES.cosmic.isInterim).toBe(true);
  });
});

describe('Theme structural contract', () => {
  test('all 3 Era themes have all 5 NeuronType keys in their neurons map', () => {
    for (const theme of Object.values(ERA_THEMES)) {
      for (const type of NEURON_TYPES) {
        expect(theme.neurons[type]).toBeDefined();
        expect(theme.neurons[type].color).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(theme.neurons[type].glowColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    }
  });

  test('all 3 Era themes have valid hex canvasBackground', () => {
    for (const theme of Object.values(ERA_THEMES)) {
      expect(theme.canvasBackground).toMatch(/^#[0-9A-Fa-f]{6,8}$/);
    }
  });

  test('all 3 Era themes have a glowPack with numeric params', () => {
    for (const theme of Object.values(ERA_THEMES)) {
      expect(theme.glowPack.radiusMultiplier).toBeGreaterThan(0);
      expect(theme.glowPack.opacityMax).toBeGreaterThanOrEqual(theme.glowPack.opacityMin);
      expect(theme.glowPack.opacityMax).toBeLessThanOrEqual(1);
    }
  });
});

describe('Bioluminescent-specific canonical fields', () => {
  test('consciousnessBarP26Override is set on bioluminescent (NARRATIVE:476)', () => {
    // "consciousness bar is no longer purple — it's white-gold" at P26
    expect(THEME_BIOLUMINESCENT.consciousnessBarP26Override).toBeDefined();
    expect(THEME_BIOLUMINESCENT.consciousnessBarP26Override).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});

describe('Digital + Cosmic interim Eras inherit bioluminescent palette', () => {
  test('THEME_DIGITAL shares neuron colors with bioluminescent (interim stub)', () => {
    expect(THEME_DIGITAL.neurons).toEqual(THEME_BIOLUMINESCENT.neurons);
  });

  test('THEME_COSMIC shares neuron colors with bioluminescent (interim stub)', () => {
    expect(THEME_COSMIC.neurons).toEqual(THEME_BIOLUMINESCENT.neurons);
  });

  test('interim Eras preserve their own era field (not inherited)', () => {
    expect(THEME_DIGITAL.era).toBe('digital');
    expect(THEME_COSMIC.era).toBe('cosmic');
  });
});
