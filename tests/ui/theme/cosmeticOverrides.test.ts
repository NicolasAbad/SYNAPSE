// Sprint 9b Phase 9b.2 — cosmetic registry smoke tests.
// Validates all 18 entries exist with correct shapes (no empty / malformed).

import { describe, expect, test } from 'vitest';
import { NEURON_SKINS, CANVAS_THEMES, GLOW_PACKS, HUD_STYLES } from '../../../src/ui/theme/cosmeticOverrides';
import { COSMETIC_CATALOG } from '../../../src/config/cosmeticCatalog';

describe('cosmetic registries — entry counts', () => {
  test('NEURON_SKINS has 8 entries', () => {
    expect(Object.keys(NEURON_SKINS)).toHaveLength(8);
  });

  test('CANVAS_THEMES has 6 entries (4 store + 2 exclusives)', () => {
    expect(Object.keys(CANVAS_THEMES)).toHaveLength(6);
  });

  test('GLOW_PACKS has 3 entries', () => {
    expect(Object.keys(GLOW_PACKS)).toHaveLength(3);
  });

  test('HUD_STYLES has 1 entry', () => {
    expect(Object.keys(HUD_STYLES)).toHaveLength(1);
  });
});

describe('NEURON_SKINS — shape validity', () => {
  test('every skin overrides all 5 neuron types', () => {
    for (const [id, skin] of Object.entries(NEURON_SKINS)) {
      for (const type of ['basica', 'sensorial', 'piramidal', 'espejo', 'integradora'] as const) {
        expect(skin[type]?.color, `${id}.${type}.color`).toMatch(/^#[0-9a-fA-F]{3,8}$/);
        expect(skin[type]?.glowColor, `${id}.${type}.glowColor`).toMatch(/^#[0-9a-fA-F]{3,8}$/);
      }
    }
  });
});

describe('CANVAS_THEMES — shape validity', () => {
  test('every theme has canvasBackground + focusBarFill + consciousnessBarFill', () => {
    for (const [id, theme] of Object.entries(CANVAS_THEMES)) {
      expect(theme.canvasBackground, `${id}.canvasBackground`).toMatch(/^#[0-9a-fA-F]{3,8}$/);
      expect(theme.focusBarFill, `${id}.focusBarFill`).toMatch(/^#[0-9a-fA-F]{3,8}$/);
      expect(theme.consciousnessBarFill, `${id}.consciousnessBarFill`).toMatch(/^#[0-9a-fA-F]{3,8}$/);
    }
  });
});

describe('GLOW_PACKS — shape validity', () => {
  test('every pack has radiusMultiplier + opacityMax + opacityMin with sane values', () => {
    for (const [id, pack] of Object.entries(GLOW_PACKS)) {
      expect(pack.radiusMultiplier, `${id}.radiusMultiplier`).toBeGreaterThan(0);
      expect(pack.opacityMax, `${id}.opacityMax`).toBeGreaterThan(0);
      expect(pack.opacityMax, `${id}.opacityMax`).toBeLessThanOrEqual(1);
      expect(pack.opacityMin, `${id}.opacityMin`).toBeGreaterThanOrEqual(0);
      expect(pack.opacityMin, `${id}.opacityMin`).toBeLessThan(pack.opacityMax);
    }
  });
});

describe('HUD_STYLES — shape validity', () => {
  test('minimal has all 3 config fields', () => {
    const minimal = HUD_STYLES.minimal;
    expect(minimal).toBeDefined();
    expect(typeof minimal?.counterOpacity).toBe('number');
    expect(typeof minimal?.hideSecondaryCounters).toBe('boolean');
    expect(typeof minimal?.monochrome).toBe('boolean');
  });
});

describe('Catalog/registry consistency', () => {
  test('every catalog entry has a matching registry entry', () => {
    for (const entry of COSMETIC_CATALOG) {
      if (entry.category === 'neuron_skin') expect(NEURON_SKINS[entry.id], `NEURON_SKINS.${entry.id}`).toBeDefined();
      else if (entry.category === 'canvas_theme') expect(CANVAS_THEMES[entry.id], `CANVAS_THEMES.${entry.id}`).toBeDefined();
      else if (entry.category === 'glow_pack') expect(GLOW_PACKS[entry.id], `GLOW_PACKS.${entry.id}`).toBeDefined();
      else expect(HUD_STYLES[entry.id], `HUD_STYLES.${entry.id}`).toBeDefined();
    }
  });

  test('every catalog entry has unique (category, id) pair', () => {
    const seen = new Set<string>();
    for (const entry of COSMETIC_CATALOG) {
      const key = `${entry.category}:${entry.id}`;
      expect(seen.has(key), `duplicate ${key}`).toBe(false);
      seen.add(key);
    }
  });

  test('exclusives have productId=null and non-null exclusive tag', () => {
    for (const entry of COSMETIC_CATALOG) {
      if (entry.exclusive === null) expect(entry.productId, `${entry.id} productId`).not.toBeNull();
      else expect(entry.productId, `${entry.id} productId (exclusive)`).toBeNull();
    }
  });
});
