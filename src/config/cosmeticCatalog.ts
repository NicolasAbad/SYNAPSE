// Sprint 9b Phase 9b.2 — Cosmetics catalog: product metadata per cosmetic.
// Each entry maps a cosmetic registry ID (cosmeticOverrides.ts) to its
// RevenueCat product ID + pricing + i18n key. Per GDD §26, cosmetics sold
// individually. 2 entries (`genius_gold`, `neon_pulse`) are exclusives —
// bundled with Genius Pass / Starter Pack IAPs; NOT standalone products.
//
// priceUsd is a fallback for UI rendering BEFORE RevenueCat's Offerings
// returns real prices — real price always comes from `product.priceString`
// per MONEY-1. On first-load before Offerings resolve, we display the
// priceUsd estimate as placeholder; once real prices land we never display
// priceUsd again.

export type CosmeticCategory = 'neuron_skin' | 'canvas_theme' | 'glow_pack' | 'hud_style';

export interface CosmeticCatalogEntry {
  id: string;
  category: CosmeticCategory;
  /** RevenueCat product ID. Null for exclusives (bundled in parent IAPs). */
  productId: string | null;
  /** Fallback USD price for pre-Offerings UI rendering (MONEY-1: never displayed once real prices arrive). */
  priceUsd: number;
  /** i18n lookup: `cosmetics.${category}.${id}.name` */
  nameKey: string;
  /** i18n lookup: `cosmetics.${category}.${id}.description` */
  descriptionKey: string;
  /** Sprint 9b Phase 9b.2 (V-f) — true for exclusives obtainable only via parent IAP (Genius Pass or Starter Pack). */
  exclusive: 'genius_pass' | 'starter_pack' | null;
}

export const COSMETIC_CATALOG: readonly CosmeticCatalogEntry[] = [
  // Neuron skins — 8 × $0.99
  { id: 'ember',    category: 'neuron_skin', productId: 'cosmetic_neuron_ember',    priceUsd: 0.99, nameKey: 'cosmetics.neuron_skin.ember.name',    descriptionKey: 'cosmetics.neuron_skin.ember.description',    exclusive: null },
  { id: 'frost',    category: 'neuron_skin', productId: 'cosmetic_neuron_frost',    priceUsd: 0.99, nameKey: 'cosmetics.neuron_skin.frost.name',    descriptionKey: 'cosmetics.neuron_skin.frost.description',    exclusive: null },
  { id: 'void',     category: 'neuron_skin', productId: 'cosmetic_neuron_void',     priceUsd: 0.99, nameKey: 'cosmetics.neuron_skin.void.name',     descriptionKey: 'cosmetics.neuron_skin.void.description',     exclusive: null },
  { id: 'plasma',   category: 'neuron_skin', productId: 'cosmetic_neuron_plasma',   priceUsd: 0.99, nameKey: 'cosmetics.neuron_skin.plasma.name',   descriptionKey: 'cosmetics.neuron_skin.plasma.description',   exclusive: null },
  { id: 'aurora',   category: 'neuron_skin', productId: 'cosmetic_neuron_aurora',   priceUsd: 0.99, nameKey: 'cosmetics.neuron_skin.aurora.name',   descriptionKey: 'cosmetics.neuron_skin.aurora.description',   exclusive: null },
  { id: 'crystal',  category: 'neuron_skin', productId: 'cosmetic_neuron_crystal',  priceUsd: 0.99, nameKey: 'cosmetics.neuron_skin.crystal.name',  descriptionKey: 'cosmetics.neuron_skin.crystal.description',  exclusive: null },
  { id: 'spore',    category: 'neuron_skin', productId: 'cosmetic_neuron_spore',    priceUsd: 0.99, nameKey: 'cosmetics.neuron_skin.spore.name',    descriptionKey: 'cosmetics.neuron_skin.spore.description',    exclusive: null },
  { id: 'nebula',   category: 'neuron_skin', productId: 'cosmetic_neuron_nebula',   priceUsd: 0.99, nameKey: 'cosmetics.neuron_skin.nebula.name',   descriptionKey: 'cosmetics.neuron_skin.nebula.description',   exclusive: null },
  // Canvas themes — 4 store × $1.99 + 2 exclusives (no productId)
  { id: 'aurora',      category: 'canvas_theme', productId: 'cosmetic_canvas_aurora',      priceUsd: 1.99, nameKey: 'cosmetics.canvas_theme.aurora.name',      descriptionKey: 'cosmetics.canvas_theme.aurora.description',      exclusive: null },
  { id: 'deep_ocean',  category: 'canvas_theme', productId: 'cosmetic_canvas_deep_ocean',  priceUsd: 1.99, nameKey: 'cosmetics.canvas_theme.deep_ocean.name',  descriptionKey: 'cosmetics.canvas_theme.deep_ocean.description',  exclusive: null },
  { id: 'deep_space',  category: 'canvas_theme', productId: 'cosmetic_canvas_deep_space',  priceUsd: 1.99, nameKey: 'cosmetics.canvas_theme.deep_space.name',  descriptionKey: 'cosmetics.canvas_theme.deep_space.description',  exclusive: null },
  { id: 'temple',      category: 'canvas_theme', productId: 'cosmetic_canvas_temple',      priceUsd: 1.99, nameKey: 'cosmetics.canvas_theme.temple.name',      descriptionKey: 'cosmetics.canvas_theme.temple.description',      exclusive: null },
  { id: 'genius_gold', category: 'canvas_theme', productId: null,                          priceUsd: 0,    nameKey: 'cosmetics.canvas_theme.genius_gold.name', descriptionKey: 'cosmetics.canvas_theme.genius_gold.description', exclusive: 'genius_pass' },
  { id: 'neon_pulse',  category: 'canvas_theme', productId: null,                          priceUsd: 0,    nameKey: 'cosmetics.canvas_theme.neon_pulse.name',  descriptionKey: 'cosmetics.canvas_theme.neon_pulse.description',  exclusive: 'starter_pack' },
  // Glow packs — 3 × $0.99
  { id: 'firefly', category: 'glow_pack', productId: 'cosmetic_glow_firefly', priceUsd: 0.99, nameKey: 'cosmetics.glow_pack.firefly.name', descriptionKey: 'cosmetics.glow_pack.firefly.description', exclusive: null },
  { id: 'halo',    category: 'glow_pack', productId: 'cosmetic_glow_halo',    priceUsd: 0.99, nameKey: 'cosmetics.glow_pack.halo.name',    descriptionKey: 'cosmetics.glow_pack.halo.description',    exclusive: null },
  { id: 'plasma',  category: 'glow_pack', productId: 'cosmetic_glow_plasma',  priceUsd: 0.99, nameKey: 'cosmetics.glow_pack.plasma.name',  descriptionKey: 'cosmetics.glow_pack.plasma.description',  exclusive: null },
  // HUD styles — 1 × $1.99
  { id: 'minimal', category: 'hud_style', productId: 'cosmetic_hud_minimal', priceUsd: 1.99, nameKey: 'cosmetics.hud_style.minimal.name', descriptionKey: 'cosmetics.hud_style.minimal.description', exclusive: null },
] as const;

/** Fast lookup: find catalog entry by (category, id). */
export function findCosmetic(category: CosmeticCategory, id: string): CosmeticCatalogEntry | null {
  return COSMETIC_CATALOG.find((c) => c.category === category && c.id === id) ?? null;
}
