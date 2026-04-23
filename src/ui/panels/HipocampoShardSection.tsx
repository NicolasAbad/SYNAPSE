// Implements docs/GDD.md §16.1 (Hipocampo Memory Shard panel).
// Sprint 7.5 Phase 7.5.2.
//
// Renders inside the Hipocampo region card when unlocked:
//   - 3 shard counters (Emotional pink, Procedural blue, Episodic cyan per REG-5)
//   - 6 shard upgrade rows priced in typed shards
//   - "Memory Weave unlocks with Integrated Mind" hint (Sprint 7.5.8 wires real)
//
// The brain-canvas redesign of Regions tab is Sprint 7.5.7 — this is the
// minimum viable surface to let players see + buy shard upgrades today.

import { memo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { SHARD_UPGRADES, SHARD_CURRENCY_TO_KEY } from '../../config/shards';
import { canBuyShardUpgrade } from '../../store/shardPurchases';
import { COLORS } from '../tokens';
import { t } from '../../config/strings';
import type { GameState } from '../../types/GameState';
import type { UpgradeDef } from '../../types';

const SHARD_COLORS: Record<'emotional' | 'procedural' | 'episodic', string> = {
  emotional: COLORS.shardEmotional,
  procedural: COLORS.shardProcedural,
  episodic: COLORS.shardEpisodic,
};

export const HipocampoShardSection = memo(function HipocampoShardSection({ state }: { state: GameState }) {
  return (
    <div data-testid="hipocampo-shard-section" style={{ marginTop: 'var(--spacing-3)' }}>
      <ShardCounters state={state} />
      <ShardUpgradeList state={state} />
      <WeaveHint />
    </div>
  );
});

function ShardCounters({ state }: { state: GameState }) {
  const types: Array<'emotional' | 'procedural' | 'episodic'> = ['emotional', 'procedural', 'episodic'];
  return (
    <div data-testid="shard-counters" style={{ display: 'flex', flexDirection: 'row', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-3)' /* CONST-OK */ }}>
      {types.map((type) => (
        <div key={type} data-testid={`shard-counter-${type}`} style={{ flex: 1, padding: 'var(--spacing-2)', border: `1px solid ${SHARD_COLORS[type]}`, borderRadius: 'var(--radius-md)' /* CONST-OK */ }}>
          <div style={{ color: SHARD_COLORS[type], fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)' }}>{t(`shard_types.${type}`)}</div>
          <div style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-base)', fontFamily: 'var(--font-mono)' }}>{Math.floor(state.memoryShards[type])}</div>
        </div>
      ))}
    </div>
  );
}

function ShardUpgradeList({ state }: { state: GameState }) {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' /* CONST-OK */ }}>
      {SHARD_UPGRADES.map((def) => (
        <ShardUpgradeRow key={def.id} def={def} state={state} />
      ))}
    </ul>
  );
}

function ShardUpgradeRow({ def, state }: { def: UpgradeDef; state: GameState }) {
  const buyShardUpgrade = useGameStore((s) => s.buyShardUpgrade);
  const check = canBuyShardUpgrade(state, def.id);
  const owned = check.reason === 'already_owned';
  const onBuy = () => { if (check.reason === 'ok') buyShardUpgrade(def.id, Date.now()); };
  const shardKey = SHARD_CURRENCY_TO_KEY[def.costCurrency];
  const accent = shardKey ? SHARD_COLORS[shardKey] : 'var(--color-text-secondary)';
  return (
    <li
      data-testid={`shard-upgrade-${def.id}`}
      data-affordability={check.reason}
      style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' /* CONST-OK */ }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--font-weight-semibold)' }}>{t(`shard_upgrades.${def.id}`)}</div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{t(`shard_upgrades_desc.${def.id}`)}</div>
      </div>
      {owned ? (
        <span style={{ fontSize: 'var(--text-xs)', color: accent }}>{t('panels.upgrades.owned')}</span>
      ) : (
        <button
          type="button"
          data-testid={`shard-upgrade-buy-${def.id}`}
          disabled={check.reason !== 'ok'}
          onPointerDown={check.reason === 'ok' ? onBuy : undefined}
          style={{
            padding: 'var(--spacing-2) var(--spacing-3)', // CONST-OK
            background: check.reason === 'ok' ? accent : 'transparent',
            color: check.reason === 'ok' ? 'var(--color-bg-deep)' : 'var(--color-text-secondary)',
            border: `1px solid ${check.reason === 'ok' ? accent : 'var(--color-border-subtle)'}`,
            borderRadius: 'var(--radius-md)',
            fontFamily: 'inherit',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--font-weight-semibold)',
            cursor: check.reason === 'ok' ? 'pointer' : 'not-allowed',
            touchAction: 'manipulation',
            minWidth: 80, // CONST-OK: tap target minimum
          }}
        >
          {`${def.cost}`}
        </button>
      )}
    </li>
  );
}

function WeaveHint() {
  return (
    <div data-testid="hipocampo-weave-hint" style={{ marginTop: 'var(--spacing-3)', padding: 'var(--spacing-2)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontStyle: 'italic', textAlign: 'center' }}>
      {t('hipocampo_panel.weave_locked')}
    </div>
  );
}
