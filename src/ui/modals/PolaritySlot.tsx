import { memo } from 'react';
import { t } from '../../config/strings';
import { HUD } from '../tokens';
import type { Polarity } from '../../types';

/**
 * Interactive Polarity picker slot — Sprint 4c Phase 4c.3.
 * Two cards (Excitatory / Inhibitory) with effect descriptions. Clicking a
 * card sets the selection; parent owns the confirm action.
 */
export interface PolaritySlotProps {
  selected: Polarity | null;
  onSelect: (polarity: Polarity) => void;
}

export const PolaritySlot = memo(function PolaritySlot({ selected, onSelect }: PolaritySlotProps) {
  return (
    <div
      data-testid="cycle-setup-slot-polarity"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-3)', // CONST-OK: CSS custom property ref
        padding: 'var(--spacing-4)', // CONST-OK: CSS custom property ref
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <h3
        style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-lg)',
          color: 'var(--color-text-primary)',
          textAlign: 'center',
        }}
      >
        {t('cycle_setup.polarity_title')}
      </h3>
      <PolarityCard
        polarity="excitatory"
        selected={selected === 'excitatory'}
        onSelect={onSelect}
        testid="cycle-setup-polarity-excitatory"
      />
      <PolarityCard
        polarity="inhibitory"
        selected={selected === 'inhibitory'}
        onSelect={onSelect}
        testid="cycle-setup-polarity-inhibitory"
      />
    </div>
  );
});

function PolarityCard({
  polarity,
  selected,
  onSelect,
  testid,
}: {
  polarity: Polarity;
  selected: boolean;
  onSelect: (p: Polarity) => void;
  testid: string;
}) {
  return (
    <button
      type="button"
      data-testid={testid}
      data-selected={selected}
      onPointerDown={() => onSelect(polarity)}
      style={{
        minHeight: HUD.touchTargetMin,
        padding: 'var(--spacing-3) var(--spacing-4)', // CONST-OK: CSS custom property ref
        background: selected ? 'var(--color-primary)' : 'var(--color-bg-deep)',
        border: selected ? '1px solid var(--color-primary)' : '1px solid var(--color-border-medium)',
        borderRadius: 'var(--radius-md)',
        color: selected ? 'var(--color-bg-deep)' : 'var(--color-text-primary)',
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
        cursor: 'pointer',
        touchAction: 'manipulation',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-1)', // CONST-OK: CSS custom property ref
      }}
    >
      <span style={{ fontWeight: 'var(--font-weight-bold)' }}>
        {t(`cycle_setup.polarity_${polarity}_name`)}
      </span>
      <span style={{ fontSize: 'var(--text-xs)', opacity: 0.85 /* CONST-OK: CSS opacity idiom */ }}>
        {t(`cycle_setup.polarity_${polarity}_desc`)}
      </span>
    </button>
  );
}
