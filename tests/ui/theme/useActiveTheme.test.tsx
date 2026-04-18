// @vitest-environment jsdom
// Tests for src/ui/theme/useActiveTheme.ts — composition behavior.

import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createDefaultState, useGameStore } from '../../../src/store/gameStore';
import {
  CANVAS_THEMES,
  GLOW_PACKS,
  NEURON_SKINS,
} from '../../../src/ui/theme/cosmeticOverrides';
import { THEME_BIOLUMINESCENT } from '../../../src/ui/theme/themes';
import { useActiveTheme } from '../../../src/ui/theme/useActiveTheme';

beforeEach(() => {
  useGameStore.setState(createDefaultState());
});

afterEach(() => {
  // Clear any test-injected cosmetic overrides so the next test starts empty.
  for (const k of Object.keys(NEURON_SKINS)) delete NEURON_SKINS[k];
  for (const k of Object.keys(CANVAS_THEMES)) delete CANVAS_THEMES[k];
  for (const k of Object.keys(GLOW_PACKS)) delete GLOW_PACKS[k];
});

describe('useActiveTheme — Era base selection', () => {
  test('eraVisualTheme=bioluminescent + no cosmetics → THEME_BIOLUMINESCENT', () => {
    const { result } = renderHook(() => useActiveTheme());
    expect(result.current.id).toBe('bioluminescent');
    expect(result.current.era).toBe('bioluminescent');
    expect(result.current.neurons).toEqual(THEME_BIOLUMINESCENT.neurons);
  });

  test('eraVisualTheme=digital → THEME_DIGITAL (isInterim=true)', () => {
    useGameStore.setState({ eraVisualTheme: 'digital' });
    const { result } = renderHook(() => useActiveTheme());
    expect(result.current.id).toBe('digital');
    expect(result.current.era).toBe('digital');
    expect(result.current.isInterim).toBe(true);
  });

  test('eraVisualTheme=cosmic → THEME_COSMIC (isInterim=true)', () => {
    useGameStore.setState({ eraVisualTheme: 'cosmic' });
    const { result } = renderHook(() => useActiveTheme());
    expect(result.current.id).toBe('cosmic');
    expect(result.current.era).toBe('cosmic');
    expect(result.current.isInterim).toBe(true);
  });
});

describe('useActiveTheme — cosmetic override composition', () => {
  test('canvas theme override merges Partial<Theme> on top of Era base', () => {
    CANVAS_THEMES['deep_space'] = { canvasBackground: '#101030' };
    useGameStore.setState({ activeCanvasTheme: 'deep_space' });
    const { result } = renderHook(() => useActiveTheme());
    expect(result.current.canvasBackground).toBe('#101030');
    expect(result.current.id).toBe('deep_space');
    expect(result.current.era).toBe('bioluminescent'); // base Era preserved
  });

  test('neuron skin override merges per-type over composed neurons map', () => {
    NEURON_SKINS['ember'] = { basica: { color: '#FF4400', glowColor: '#FF8844' } };
    useGameStore.setState({ activeNeuronSkin: 'ember' });
    const { result } = renderHook(() => useActiveTheme());
    expect(result.current.neurons.basica.color).toBe('#FF4400');
    // Non-overridden types keep Era defaults
    expect(result.current.neurons.sensorial.color).toBe(THEME_BIOLUMINESCENT.neurons.sensorial.color);
  });

  test('glow pack override replaces glowPack entirely', () => {
    GLOW_PACKS['firefly'] = { radiusMultiplier: 3, opacityMin: 0.5, opacityMax: 0.95 };
    useGameStore.setState({ activeGlowPack: 'firefly' });
    const { result } = renderHook(() => useActiveTheme());
    expect(result.current.glowPack.radiusMultiplier).toBe(3);
    expect(result.current.glowPack.opacityMin).toBe(0.5);
    expect(result.current.glowPack.opacityMax).toBe(0.95);
  });

  test('unknown cosmetic ID silently falls back to Era default (UI-8 pattern)', () => {
    useGameStore.setState({ activeCanvasTheme: 'nonexistent_cosmetic_id' });
    const { result } = renderHook(() => useActiveTheme());
    // Falls through: id stays at Era name, no throw
    expect(result.current.id).toBe('bioluminescent');
    expect(result.current.canvasBackground).toBe(THEME_BIOLUMINESCENT.canvasBackground);
  });

  test('composition precedence: canvas theme → neuron skin → glow pack', () => {
    // All three active simultaneously, each touching distinct fields.
    CANVAS_THEMES['test_canvas'] = { canvasBackground: '#111111' };
    NEURON_SKINS['test_skin'] = { espejo: { color: '#AA55FF', glowColor: '#AA55FF' } };
    GLOW_PACKS['test_glow'] = { radiusMultiplier: 4, opacityMin: 0.3, opacityMax: 0.8 };
    useGameStore.setState({
      activeCanvasTheme: 'test_canvas',
      activeNeuronSkin: 'test_skin',
      activeGlowPack: 'test_glow',
    });
    const { result } = renderHook(() => useActiveTheme());
    expect(result.current.canvasBackground).toBe('#111111');
    expect(result.current.neurons.espejo.color).toBe('#AA55FF');
    expect(result.current.glowPack.radiusMultiplier).toBe(4);
  });
});
