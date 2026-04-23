import { memo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { REGIONS, REGION_META_UPGRADE_ID } from '../../config/regions';
import { UPGRADES_BY_ID } from '../../config/upgrades';
import { canBuyUpgrade } from '../../store/purchases';
import { formatCurrency } from '../util/formatNumber';
import { t } from '../../config/strings';
import { HipocampoShardSection } from './HipocampoShardSection';
import type { GameState } from '../../types/GameState';
import type { RegionDef } from '../../types';

/**
 * Regions tab panel — full implementation per GDD §16 (Sprint 5 Phase 5.4).
 *
 * 5 region cards (4 starter + Broca P14). Each card shows region name,
 * unlocked status, and its in-region upgrades. Locked regions stay visible
 * but greyed (player understands what's coming). The meta upgrade
 * (Amplitud de Banda) renders in its own "Cross-region" section so it's
 * obvious it isn't tied to a single region.
 *
 * Region UNLOCK is REG-1 (engine, src/engine/regions.ts) — UI just reads
 * `state.regionsUnlocked: string[]`. Hipocampo's +3 Memorias bonus fires
 * once at first unlock and surfaces via the HUD MemoriesCounter (no
 * separate notification this sprint — Sprint 7 owns celebrations).
 */
export const RegionsPanel = memo(function RegionsPanel() {
  const state = useGameStore();

  return (
    <section
      data-testid="panel-regions"
      aria-label="Regions"
      style={{
        color: 'var(--color-text-secondary)',
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
      }}
    >
      <h2
        data-testid="panel-regions-title"
        style={{
          color: 'var(--color-text-primary)',
          fontSize: 'var(--text-lg)',
          margin: 0,
          marginBottom: 'var(--spacing-3)', // CONST-OK: CSS token ref
        }}
      >
        Regions
      </h2>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' /* CONST-OK */ }}>
        {REGIONS.map((region) => (
          <RegionCard key={region.id} region={region} state={state} />
        ))}
      </ul>

      <RegionMetaUpgradeCard state={state} />
    </section>
  );
});

interface RegionCardProps { region: RegionDef; state: GameState; }

function RegionCard({ region, state }: RegionCardProps) {
  const unlocked = state.regionsUnlocked.includes(region.id);
  return (
    <li
      data-testid={`region-card-${region.id}`}
      data-unlocked={unlocked}
      style={{
        padding: 'var(--spacing-3)', // CONST-OK: CSS token ref
        background: 'var(--color-bg-elevated)',
        border: `1px solid ${unlocked ? 'var(--color-border-subtle)' : 'var(--color-border-subtle)'}`,
        borderStyle: unlocked ? 'solid' : 'dashed',
        borderRadius: 'var(--radius-md)',
        opacity: unlocked ? 1 : 0.55, // CONST-OK: CSS opacity idiom
      }}
    >
      <div style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--font-weight-semibold)' }}>
        {unlocked ? t(region.nameKey) : `???  ${t('regions_panel.locked_at')}${region.unlockPrestige}`}
      </div>
      {unlocked && region.upgradeIds.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 'var(--spacing-2) 0 0 0' /* CONST-OK */, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' /* CONST-OK */ }}>
          {region.upgradeIds.map((upgradeId) => (
            <RegionUpgradeRow key={upgradeId} upgradeId={upgradeId} state={state} />
          ))}
        </ul>
      )}
      {/* Sprint 7.5.2 §16.1 — Hipocampo Shard tree (typed-shard upgrades). */}
      {unlocked && region.id === 'hipocampo' && <HipocampoShardSection state={state} />}
    </li>
  );
}

interface RegionUpgradeRowProps { upgradeId: string; state: GameState; }

function RegionUpgradeRow({ upgradeId, state }: RegionUpgradeRowProps) {
  // Hook must come before any early-return per react-hooks/rules-of-hooks.
  const buyUpgrade = useGameStore((s) => s.buyUpgrade);
  const def = UPGRADES_BY_ID[upgradeId];
  if (!def) return null;
  const check = canBuyUpgrade(state, upgradeId);
  const owned = check.reason === 'already_owned';
  const onBuy = () => { if (check.reason === 'ok') buyUpgrade(upgradeId, Date.now()); };
  return (
    <li
      data-testid={`region-upgrade-${upgradeId}`}
      data-affordability={check.reason}
      style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' /* CONST-OK */ }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--font-weight-semibold)' }}>
          {t(`upgrades.${upgradeId}`)}
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
          {t(`upgrades_desc.${upgradeId}`)}
        </div>
      </div>
      {owned ? (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-rate-counter)' }}>{t('panels.upgrades.owned')}</span>
      ) : (
        <button
          type="button"
          data-testid={`region-upgrade-buy-${upgradeId}`}
          disabled={check.reason !== 'ok'}
          onPointerDown={check.reason === 'ok' ? onBuy : undefined}
          style={{
            padding: 'var(--spacing-2) var(--spacing-3)', // CONST-OK
            background: check.reason === 'ok' ? 'var(--color-primary)' : 'transparent',
            color: check.reason === 'ok' ? 'var(--color-bg-deep)' : 'var(--color-text-secondary)',
            border: `1px solid ${check.reason === 'ok' ? 'var(--color-primary)' : 'var(--color-border-subtle)'}`,
            borderRadius: 'var(--radius-md)',
            fontFamily: 'inherit',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--font-weight-semibold)',
            cursor: check.reason === 'ok' ? 'pointer' : 'not-allowed',
            touchAction: 'manipulation',
            minWidth: 80, // CONST-OK: tap target minimum
          }}
        >
          {`${formatCurrency(check.cost)} ${def.costCurrency === 'memorias' ? 'Mem' : 'th'}`}
        </button>
      )}
    </li>
  );
}

function RegionMetaUpgradeCard({ state }: { state: GameState }) {
  const upgradeId = REGION_META_UPGRADE_ID;
  const def = UPGRADES_BY_ID[upgradeId];
  if (!def) return null;
  return (
    <div
      data-testid="region-meta-section"
      style={{
        marginTop: 'var(--spacing-4)', // CONST-OK
        padding: 'var(--spacing-3)', // CONST-OK
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', marginBottom: 'var(--spacing-2)' /* CONST-OK */ }}>
        {t('regions_panel.meta_section')}
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        <RegionUpgradeRow upgradeId={upgradeId} state={state} />
      </ul>
    </div>
  );
}
