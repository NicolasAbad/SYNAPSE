import { memo, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { NEURON_CONFIG } from '../../config/neurons';
import { isNeuronUnlocked, neuronBuyCost } from '../../store/purchases';
import { formatCurrency, formatNumber } from '../util/formatNumber';
import { t } from '../../config/strings';
import { visibleNeuronTypesAt } from './neuronVisibility';
import type { NeuronType } from '../../types';

type BuyMode = 'x1' | 'x10' | 'max';
const MAX_BATCH_GUARD = 500; // CONST-OK: upper bound on Max-mode loop iteration (prevents runaway)

/**
 * Neurons tab panel (Sprint 3.6.2 — full implementation).
 *
 * Renders 5 rows per UI_MOCKUPS.html Screen 6 + GDD §29 tab spec:
 * icon + name, owned × rate = total/sec, next purchase cost, Buy button.
 * Locked types render a silhouette + unlock requirement. Affordable /
 * expensive / can't-afford states reflect on the Buy button via the
 * `data-affordability` attribute for CSS theming + test introspection.
 *
 * Buy mode selector at the bottom drives ×1 / ×10 / Max batches —
 * loops through `buyNeuron` until either the target count is reached
 * or an affordability/unlock check fails. `Max` additionally caps at
 * `MAX_BATCH_GUARD` iterations as a runaway guard.
 *
 * Subscribes via granular selectors so this panel does NOT re-render
 * on every tick — only when thoughts / neurons / prestigeCount change.
 */
export const NeuronsPanel = memo(function NeuronsPanel() {
  const thoughts = useGameStore((s) => s.thoughts);
  const neurons = useGameStore((s) => s.neurons);
  const prestigeCount = useGameStore((s) => s.prestigeCount);
  const buyNeuron = useGameStore((s) => s.buyNeuron);
  // Sprint 4c.6.7 — playtest finding #1: per-row shows base rate only
  // (`count × baseRate`) which misled players whose effective rate had
  // 2-5× upgrade multipliers applied. Showing the global effective PPS
  // as a footer keeps per-row math honest while exposing the real /s.
  const effectivePPS = useGameStore((s) => s.effectiveProductionPerSecond);

  const [mode, setMode] = useState<BuyMode>('x1');

  const handleBuy = (type: NeuronType) => {
    const now = Date.now();
    if (mode === 'x1') {
      buyNeuron(type, now);
      return;
    }
    const target = mode === 'x10' ? 10 : MAX_BATCH_GUARD;
    for (let i = 0; i < target; i++) {
      const result = buyNeuron(type, now);
      if (result !== 'ok') return;
    }
  };

  return (
    <section
      data-testid="panel-neurons"
      aria-label="Neurons"
      style={{
        color: 'var(--color-text-secondary)',
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
      }}
    >
      <h2
        data-testid="panel-neurons-title"
        style={{
          color: 'var(--color-text-primary)',
          fontSize: 'var(--text-lg)',
          margin: 0,
          marginBottom: 'var(--spacing-3)', // CONST-OK: CSS token ref
        }}
      >
        Neurons
      </h2>

      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-2)', // CONST-OK: CSS token ref
        }}
      >
        {visibleNeuronTypesAt(neurons, prestigeCount).map((type) => (
          <NeuronRow
            key={type}
            type={type}
            count={neurons.find((n) => n.type === type)?.count ?? 0}
            thoughts={thoughts}
            prestigeCount={prestigeCount}
            neurons={neurons}
            onBuy={() => handleBuy(type)}
          />
        ))}
      </ul>

      <div
        data-testid="panel-neurons-effective-total"
        style={{
          marginTop: 'var(--spacing-3)', // CONST-OK: CSS token ref
          padding: 'var(--spacing-2) var(--spacing-3)', // CONST-OK: CSS token ref
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-secondary)',
          textAlign: 'center',
        }}
      >
        {t('panels.neurons.effective_total_prefix')}
        <span style={{ color: 'var(--color-rate-counter)', fontWeight: 'var(--font-weight-semibold)' }}>
          {`+${formatNumber(effectivePPS)}${t('panels.neurons.rate_suffix')}`}
        </span>
        {' '}{t('panels.neurons.effective_total_suffix')}
      </div>

      <div
        data-testid="panel-neurons-buy-mode"
        role="group"
        aria-label="Buy mode"
        style={{
          display: 'flex',
          gap: 'var(--spacing-1)', // CONST-OK: CSS token ref
          marginTop: 'var(--spacing-4)', // CONST-OK: CSS token ref
          alignSelf: 'flex-start',
        }}
      >
        {(['x1', 'x10', 'max'] as const).map((m) => (
          <button
            key={m}
            type="button"
            data-testid={`panel-neurons-mode-${m}`}
            data-active={mode === m}
            onPointerDown={() => setMode(m)}
            style={{
              padding: 'var(--spacing-1) var(--spacing-3)', // CONST-OK: CSS token ref
              background: mode === m ? 'var(--color-primary)' : 'transparent',
              color: mode === m ? 'var(--color-bg-deep)' : 'var(--color-text-secondary)',
              border: '1px solid var(--color-border-medium)',
              borderRadius: 'var(--radius-full)',
              fontFamily: 'inherit',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: 'pointer',
              touchAction: 'manipulation',
            }}
          >
            {t(`panels.neurons.mode_${m}`)}
          </button>
        ))}
      </div>
    </section>
  );
});

interface NeuronRowProps {
  type: NeuronType;
  count: number;
  thoughts: number;
  prestigeCount: number;
  neurons: ReturnType<typeof useGameStore.getState>['neurons'];
  onBuy: () => void;
}

function neuronUnlockText(type: NeuronType): string {
  const unlock = NEURON_CONFIG[type].unlock;
  if (unlock.kind === 'start') return '';
  if (unlock.kind === 'prestige') return `${t('panels.neurons.unlock_prestige')}${unlock.min}`;
  return `${t('panels.neurons.unlock_neurons_prefix')} ${unlock.count} ${t(`neurons.${unlock.type}.name`)}`;
}

function NeuronRow({ type, count, thoughts, prestigeCount, neurons, onBuy }: NeuronRowProps) {
  const unlocked = isNeuronUnlocked({ neurons, prestigeCount }, type);
  const cost = neuronBuyCost(type, count);
  const affordable = unlocked && thoughts >= cost;
  const rate = NEURON_CONFIG[type].baseRate * count;

  const affordability: 'locked' | 'afford' | 'cant' = unlocked ? (affordable ? 'afford' : 'cant') : 'locked';

  return (
    <li
      data-testid={`panel-neurons-row-${type}`}
      data-affordability={affordability}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-3)', // CONST-OK: CSS token ref
        padding: 'var(--spacing-2) var(--spacing-3)', // CONST-OK: CSS token ref
        background: 'var(--color-bg-elevated)',
        border: `1px solid ${unlocked ? 'var(--color-border-subtle)' : 'var(--color-border-subtle)'}`,
        borderRadius: 'var(--radius-md)',
        borderStyle: unlocked ? 'solid' : 'dashed',
        opacity: unlocked ? 1 : 0.55, // CONST-OK: CSS opacity idiom for locked state
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--font-weight-semibold)' }}>
          {unlocked ? t(`neurons.${type}.name`) : '???'}
        </div>
        {unlocked ? (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
            {`${count} × ${NEURON_CONFIG[type].baseRate}${t('panels.neurons.rate_suffix')} = `}
            <span style={{ color: 'var(--color-rate-counter)' }}>
              {`+${formatNumber(rate)}${t('panels.neurons.rate_suffix')}`}
            </span>
          </div>
        ) : (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{neuronUnlockText(type)}</div>
        )}
      </div>
      {unlocked ? (
        <button
          type="button"
          data-testid={`panel-neurons-buy-${type}`}
          disabled={!affordable}
          onPointerDown={affordable ? onBuy : undefined}
          style={{
            padding: 'var(--spacing-2) var(--spacing-3)', // CONST-OK: CSS token ref
            background: affordable ? 'var(--color-primary)' : 'transparent',
            color: affordable ? 'var(--color-bg-deep)' : 'var(--color-text-secondary)',
            border: `1px solid ${affordable ? 'var(--color-primary)' : 'var(--color-border-subtle)'}`,
            borderRadius: 'var(--radius-md)',
            fontFamily: 'inherit',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--font-weight-semibold)',
            cursor: affordable ? 'pointer' : 'not-allowed',
            touchAction: 'manipulation',
            minWidth: 72, // CONST-OK: touch-target minimum width
          }}
        >
          <div>{formatCurrency(cost)}</div>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-regular)' }}>
            {t('panels.neurons.buy')}
          </div>
        </button>
      ) : null}
    </li>
  );
}
