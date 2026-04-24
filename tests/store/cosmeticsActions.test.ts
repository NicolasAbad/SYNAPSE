// Sprint 9b Phase 9b.2 — cosmetics store actions tests.
// Validates: unlockCosmetic idempotency, equipCosmetic requires ownership,
// unequipCosmetic clears active, unlockAllCosmetics dev helper.

import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { useGameStore } from '../../src/store/gameStore';
import { COSMETIC_CATALOG } from '../../src/config/cosmeticCatalog';

beforeEach(() => useGameStore.getState().reset());
afterEach(() => useGameStore.getState().reset());

describe('unlockCosmetic', () => {
  test('adds id to ownedNeuronSkins', () => {
    useGameStore.getState().unlockCosmetic('neuron_skin', 'ember');
    expect(useGameStore.getState().ownedNeuronSkins).toContain('ember');
  });

  test('idempotent: duplicate unlock is a no-op', () => {
    useGameStore.getState().unlockCosmetic('neuron_skin', 'ember');
    useGameStore.getState().unlockCosmetic('neuron_skin', 'ember');
    expect(useGameStore.getState().ownedNeuronSkins.filter((id) => id === 'ember')).toHaveLength(1);
  });

  test('routes to correct owned list per category', () => {
    useGameStore.getState().unlockCosmetic('canvas_theme', 'aurora');
    useGameStore.getState().unlockCosmetic('glow_pack', 'firefly');
    useGameStore.getState().unlockCosmetic('hud_style', 'minimal');
    const s = useGameStore.getState();
    expect(s.ownedCanvasThemes).toContain('aurora');
    expect(s.ownedGlowPacks).toContain('firefly');
    expect(s.ownedHudStyles).toContain('minimal');
  });
});

describe('equipCosmetic', () => {
  test('sets active* when cosmetic is owned', () => {
    useGameStore.getState().unlockCosmetic('neuron_skin', 'ember');
    useGameStore.getState().equipCosmetic('neuron_skin', 'ember');
    expect(useGameStore.getState().activeNeuronSkin).toBe('ember');
  });

  test('no-op when cosmetic is NOT owned (defensive)', () => {
    useGameStore.getState().equipCosmetic('neuron_skin', 'ember');
    expect(useGameStore.getState().activeNeuronSkin).toBeNull();
  });

  test('equipping replaces a previously-equipped cosmetic in the same category', () => {
    useGameStore.getState().unlockCosmetic('neuron_skin', 'ember');
    useGameStore.getState().unlockCosmetic('neuron_skin', 'frost');
    useGameStore.getState().equipCosmetic('neuron_skin', 'ember');
    useGameStore.getState().equipCosmetic('neuron_skin', 'frost');
    expect(useGameStore.getState().activeNeuronSkin).toBe('frost');
  });
});

describe('unequipCosmetic', () => {
  test('clears active* for the category', () => {
    useGameStore.getState().unlockCosmetic('canvas_theme', 'aurora');
    useGameStore.getState().equipCosmetic('canvas_theme', 'aurora');
    useGameStore.getState().unequipCosmetic('canvas_theme');
    expect(useGameStore.getState().activeCanvasTheme).toBeNull();
  });

  test('unequipping one category does NOT affect other categories', () => {
    useGameStore.getState().unlockCosmetic('neuron_skin', 'ember');
    useGameStore.getState().unlockCosmetic('glow_pack', 'firefly');
    useGameStore.getState().equipCosmetic('neuron_skin', 'ember');
    useGameStore.getState().equipCosmetic('glow_pack', 'firefly');
    useGameStore.getState().unequipCosmetic('neuron_skin');
    const s = useGameStore.getState();
    expect(s.activeNeuronSkin).toBeNull();
    expect(s.activeGlowPack).toBe('firefly'); // untouched
  });
});

describe('unlockAllCosmetics (dev-only)', () => {
  test('unlocks every cosmetic in every category', () => {
    useGameStore.getState().unlockAllCosmetics();
    const s = useGameStore.getState();
    const expectedNeurons = COSMETIC_CATALOG.filter((c) => c.category === 'neuron_skin').map((c) => c.id);
    const expectedCanvases = COSMETIC_CATALOG.filter((c) => c.category === 'canvas_theme').map((c) => c.id);
    const expectedGlows = COSMETIC_CATALOG.filter((c) => c.category === 'glow_pack').map((c) => c.id);
    const expectedHuds = COSMETIC_CATALOG.filter((c) => c.category === 'hud_style').map((c) => c.id);
    expect(new Set(s.ownedNeuronSkins)).toEqual(new Set(expectedNeurons));
    expect(new Set(s.ownedCanvasThemes)).toEqual(new Set(expectedCanvases));
    expect(new Set(s.ownedGlowPacks)).toEqual(new Set(expectedGlows));
    expect(new Set(s.ownedHudStyles)).toEqual(new Set(expectedHuds));
  });
});
