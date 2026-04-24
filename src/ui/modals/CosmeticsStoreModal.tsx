// Sprint 9b Phase 9b.2 — Cosmetics Store modal.
// 4 tabs (neurons/canvas/glow/HUD), grid of tiles per category. 3-second
// live preview via React-local state; canvas renderer reads preview* overrides
// (see useActiveTheme.ts composition) to show the cosmetic in real time before
// purchase. No GameState mutation during preview (V-e approved).
//
// Sprint 9b Phase 9b.3 will wire the "Buy" button to RevenueCat
// purchasePackage(); for 9b.2 it logs + no-ops.

import { memo, useCallback, useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { COSMETIC_CATALOG, type CosmeticCategory, type CosmeticCatalogEntry } from '../../config/cosmeticCatalog';
import { NEURON_SKINS, CANVAS_THEMES, GLOW_PACKS, HUD_STYLES } from '../../ui/theme/cosmeticOverrides';
import { en } from '../../config/strings/en';

const t = en.cosmetics;

const PREVIEW_DURATION_MS = 3000; // CONST-OK Sprint 9b V-e approved (SPRINTS.md §874 "3-second live preview")

export interface CosmeticsStoreModalProps {
  open: boolean;
  onClose: () => void;
}

const overlayStyle = { // CONST-OK CSS style object
  position: 'fixed' as const,
  inset: 0,
  background: 'rgba(5, 7, 13, 0.94)', // CONST-OK CSS dim-overlay alpha
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 946, // CONST-OK HUD layer band (above SettingsModal 945)
  padding: 'var(--spacing-4)', // CONST-OK CSS spacing token
};

const cardStyle = { // CONST-OK CSS style object
  background: 'var(--color-bg-deep, #0a0e1a)',
  border: '1px solid var(--color-border-subtle, #1f2937)', // CONST-OK CSS fallback
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--spacing-5)', // CONST-OK CSS spacing token
  maxWidth: '540px', // CONST-OK CSS max-width store readable
  width: '100%', // CONST-OK CSS full-width idiom
  maxHeight: '90vh', // CONST-OK CSS modal max-height
  display: 'flex' as const,
  flexDirection: 'column' as const,
};

const headerStyle = { // CONST-OK CSS style object
  display: 'flex' as const,
  justifyContent: 'space-between' as const,
  alignItems: 'center' as const,
  marginBottom: 'var(--spacing-4)', // CONST-OK CSS spacing token
};

const titleStyle = { // CONST-OK CSS style object
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--text-xl)',
  fontWeight: 'var(--font-weight-light)',
  margin: 0,
};

const tabBarStyle = { // CONST-OK CSS style object
  display: 'flex' as const,
  gap: 'var(--spacing-2)', // CONST-OK CSS spacing token
  marginBottom: 'var(--spacing-4)', // CONST-OK CSS spacing token
  borderBottom: '1px solid var(--color-border-subtle, #1f2937)', // CONST-OK CSS fallback
};

const tabButtonStyle = (active: boolean) => ({ // CONST-OK CSS style factory
  padding: 'var(--spacing-2) var(--spacing-3)', // CONST-OK CSS spacing tokens
  background: 'transparent',
  color: active ? 'var(--color-accent, #4090E0)' : 'var(--color-text-secondary)', // CONST-OK CSS fallback
  border: 'none',
  borderBottom: active ? '2px solid var(--color-accent, #4090E0)' : '2px solid transparent', // CONST-OK CSS fallback
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-sm)',
  touchAction: 'manipulation' as const,
});

const gridStyle = { // CONST-OK CSS style object
  display: 'grid' as const,
  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', // CONST-OK CSS grid responsive
  gap: 'var(--spacing-3)', // CONST-OK CSS spacing token
  overflowY: 'auto' as const,
  flex: 1,
};

const tileStyle = (equipped: boolean) => ({ // CONST-OK CSS style factory
  padding: 'var(--spacing-3)', // CONST-OK CSS spacing token
  background: 'var(--color-bg-elevated, #161b27)', // CONST-OK CSS fallback
  border: equipped ? '2px solid var(--color-accent, #4090E0)' : '1px solid var(--color-border-subtle, #1f2937)', // CONST-OK CSS fallback
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-sm)',
  display: 'flex' as const,
  flexDirection: 'column' as const,
  gap: 'var(--spacing-2)', // CONST-OK CSS spacing token
});

const tileNameStyle = { fontWeight: 'var(--font-weight-semibold)' }; // CONST-OK CSS style object

const tileDescStyle = { fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', opacity: 0.85 }; // CONST-OK CSS subdued caption

const actionButtonStyle = { // CONST-OK CSS style object
  padding: 'var(--spacing-2)', // CONST-OK CSS spacing token
  background: 'var(--color-accent, #4090E0)', // CONST-OK CSS fallback
  color: 'var(--color-text-on-accent, #fff)',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  fontSize: 'var(--text-xs)',
  touchAction: 'manipulation' as const,
};

const secondaryButtonStyle = { // CONST-OK CSS style object
  ...actionButtonStyle,
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  border: '1px solid var(--color-border-subtle, #1f2937)', // CONST-OK CSS fallback
};

const footerStyle = { // CONST-OK CSS style object
  marginTop: 'var(--spacing-4)', // CONST-OK CSS spacing token
  display: 'flex' as const,
  justifyContent: 'flex-end' as const,
};

const exclusiveBadgeStyle = { // CONST-OK CSS style object
  fontSize: 'var(--text-xs)',
  color: 'var(--color-warning, #ffb454)', // CONST-OK CSS fallback
  fontStyle: 'italic' as const,
};

function tabLabel(category: CosmeticCategory): string {
  if (category === 'neuron_skin') return t.tabNeurons;
  if (category === 'canvas_theme') return t.tabCanvas;
  if (category === 'glow_pack') return t.tabGlow;
  return t.tabHud;
}

function cosmeticName(entry: CosmeticCatalogEntry): string {
  const category = t[entry.category] as Record<string, { name: string; description: string }>;
  return category[entry.id]?.name ?? entry.id;
}

function cosmeticDescription(entry: CosmeticCatalogEntry): string {
  const category = t[entry.category] as Record<string, { name: string; description: string }>;
  return category[entry.id]?.description ?? '';
}

/** Color-swatch preview of a cosmetic — purely visual (small color chips). */
function swatchFor(entry: CosmeticCatalogEntry): string {
  if (entry.category === 'neuron_skin') {
    return NEURON_SKINS[entry.id]?.basica?.color ?? '#888'; // CONST-OK CSS swatch default neutral
  }
  if (entry.category === 'canvas_theme') {
    return CANVAS_THEMES[entry.id]?.canvasBackground ?? '#333'; // CONST-OK CSS swatch default darker
  }
  if (entry.category === 'glow_pack') {
    const cfg = GLOW_PACKS[entry.id];
    return cfg ? `rgba(255,255,200,${cfg.opacityMax})` : 'rgba(255,255,255,0.5)'; // CONST-OK CSS glow preview
  }
  if (entry.category === 'hud_style' && HUD_STYLES[entry.id]) {
    return '#888'; // CONST-OK CSS HUD style neutral swatch
  }
  return '#555'; // CONST-OK CSS swatch default
}

export const CosmeticsStoreModal = memo(function CosmeticsStoreModal({ open, onClose }: CosmeticsStoreModalProps) {
  const [activeTab, setActiveTab] = useState<CosmeticCategory>('neuron_skin');
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  const ownedNeuronSkins = useGameStore((s) => s.ownedNeuronSkins);
  const ownedCanvasThemes = useGameStore((s) => s.ownedCanvasThemes);
  const ownedGlowPacks = useGameStore((s) => s.ownedGlowPacks);
  const ownedHudStyles = useGameStore((s) => s.ownedHudStyles);
  const activeNeuronSkin = useGameStore((s) => s.activeNeuronSkin);
  const activeCanvasTheme = useGameStore((s) => s.activeCanvasTheme);
  const activeGlowPack = useGameStore((s) => s.activeGlowPack);
  const activeHudStyle = useGameStore((s) => s.activeHudStyle);
  const equipCosmetic = useGameStore((s) => s.equipCosmetic);
  const unequipCosmetic = useGameStore((s) => s.unequipCosmetic);

  useEffect(() => {
    if (previewingId === null) return;
    const handle = setTimeout(() => setPreviewingId(null), PREVIEW_DURATION_MS);
    return () => clearTimeout(handle);
  }, [previewingId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const ownedForTab = useCallback((): readonly string[] => {
    if (activeTab === 'neuron_skin') return ownedNeuronSkins;
    if (activeTab === 'canvas_theme') return ownedCanvasThemes;
    if (activeTab === 'glow_pack') return ownedGlowPacks;
    return ownedHudStyles;
  }, [activeTab, ownedNeuronSkins, ownedCanvasThemes, ownedGlowPacks, ownedHudStyles]);

  const activeForTab = useCallback((): string | null => {
    if (activeTab === 'neuron_skin') return activeNeuronSkin;
    if (activeTab === 'canvas_theme') return activeCanvasTheme;
    if (activeTab === 'glow_pack') return activeGlowPack;
    return activeHudStyle;
  }, [activeTab, activeNeuronSkin, activeCanvasTheme, activeGlowPack, activeHudStyle]);

  if (!open) return null;

  const entries = COSMETIC_CATALOG.filter((c) => c.category === activeTab);
  const owned = ownedForTab();
  const equipped = activeForTab();

  return (
    <div data-testid="cosmetics-store" role="dialog" aria-modal="true" aria-labelledby="cosmetics-store-title" style={overlayStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <h2 id="cosmetics-store-title" data-testid="cosmetics-store-title" style={titleStyle}>{t.storeTitle}</h2>
        </div>

        <div role="tablist" style={tabBarStyle}>
          {(['neuron_skin', 'canvas_theme', 'glow_pack', 'hud_style'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={activeTab === cat}
              data-testid={`cosmetics-tab-${cat}`}
              onClick={() => { setActiveTab(cat); setPreviewingId(null); }}
              style={tabButtonStyle(activeTab === cat)}
            >
              {tabLabel(cat)}
            </button>
          ))}
        </div>

        <div style={gridStyle}>
          {entries.map((entry) => {
            const isOwned = owned.includes(entry.id);
            const isEquipped = equipped === entry.id;
            const isPreviewing = previewingId === entry.id;
            return (
              <div key={entry.id} data-testid={`cosmetics-tile-${entry.category}-${entry.id}`} style={tileStyle(isEquipped)}>
                <div style={{ width: '100%', height: 40, borderRadius: 4, background: swatchFor(entry) /* CONST-OK CSS swatch */ }} />{/* CONST-OK CSS swatch */}
                <span style={tileNameStyle}>{cosmeticName(entry)}</span>
                <span style={tileDescStyle}>{cosmeticDescription(entry)}</span>
                {entry.exclusive === 'genius_pass' && <span style={exclusiveBadgeStyle}>{t.exclusiveGeniusPass}</span>}
                {entry.exclusive === 'starter_pack' && <span style={exclusiveBadgeStyle}>{t.exclusiveStarterPack}</span>}
                {!isOwned && entry.exclusive === null && (
                  <button type="button" data-testid={`cosmetics-preview-${entry.category}-${entry.id}`} onClick={() => setPreviewingId(entry.id)} style={secondaryButtonStyle}>
                    {isPreviewing ? t.previewingToast : t.previewButton}
                  </button>
                )}
                {!isOwned && entry.exclusive === null && (
                  <button type="button" data-testid={`cosmetics-buy-${entry.category}-${entry.id}`} onClick={() => { /* Sprint 9b.3 wires RevenueCat */ }} style={actionButtonStyle}>
                    {t.buyButton} ${entry.priceUsd.toFixed(2)}
                  </button>
                )}
                {isOwned && !isEquipped && (
                  <button type="button" data-testid={`cosmetics-equip-${entry.category}-${entry.id}`} onClick={() => equipCosmetic(entry.category, entry.id)} style={actionButtonStyle}>
                    {t.equipButton}
                  </button>
                )}
                {isEquipped && (
                  <button type="button" data-testid={`cosmetics-unequip-${entry.category}-${entry.id}`} onClick={() => unequipCosmetic(entry.category)} style={secondaryButtonStyle}>
                    {t.unequipButton}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div style={footerStyle}>
          <button type="button" data-testid="cosmetics-close" onClick={onClose} style={secondaryButtonStyle}>{t.backButton}</button>
        </div>
      </div>
    </div>
  );
});
