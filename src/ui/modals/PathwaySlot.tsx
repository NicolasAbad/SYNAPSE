import { memo } from 'react';
import { t } from '../../config/strings';
import { HUD } from '../tokens';
import { PATHWAYS } from '../../config/pathways';
import type { Pathway } from '../../types';

/**
 * Interactive Pathway picker slot — Sprint 5 Phase 5.5.
 *
 * Renders 3 cards (Swift / Deep / Balanced) per GDD §14. Card text
 * mirrors PolaritySlot's pattern: bold name + concise tradeoff
 * description. Selection is mutually exclusive — parent owns the
 * selectedPathway state via `selected` prop.
 */
export interface PathwaySlotProps {
  selected: Pathway | null;
  onSelect: (pathway: Pathway) => void;
}

export const PathwaySlot = memo(function PathwaySlot({ selected, onSelect }: PathwaySlotProps) {
  return (
    <div
      data-testid="cycle-setup-slot-pathway"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-3)', // CONST-OK
        padding: 'var(--spacing-4)', // CONST-OK
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
        Pathway
      </h3>
      {PATHWAYS.map((p) => (
        <PathwayCard key={p.id} pathway={p.id} selected={selected === p.id} onSelect={onSelect} />
      ))}
    </div>
  );
});

function PathwayCard({ pathway, selected, onSelect }: { pathway: Pathway; selected: boolean; onSelect: (p: Pathway) => void }) {
  return (
    <button
      type="button"
      data-testid={`cycle-setup-pathway-${pathway}`}
      data-selected={selected}
      onPointerDown={() => onSelect(pathway)}
      style={{
        minHeight: HUD.touchTargetMin,
        padding: 'var(--spacing-3) var(--spacing-4)', // CONST-OK
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
        gap: 'var(--spacing-1)', // CONST-OK
      }}
    >
      <span style={{ fontWeight: 'var(--font-weight-bold)' }}>{t(`pathways.${pathway}.name`)}</span>
      <span style={{ fontSize: 'var(--text-xs)' }} data-testid={`cycle-setup-pathway-${pathway}-tagline`}>
        {t(`pathways.${pathway}.tagline`)}
      </span>
      <span style={{ fontSize: 'var(--text-xs)', opacity: 0.85 /* CONST-OK: scannable sub-line opacity */ }} data-testid={`cycle-setup-pathway-${pathway}-bonuses`}>
        {t(`pathways.${pathway}.bonuses`)}
      </span>
      <span style={{ fontSize: 'var(--text-xs)', opacity: 0.65 /* CONST-OK: muted sub-line opacity */ }} data-testid={`cycle-setup-pathway-${pathway}-blocks`}>
        {t(`pathways.${pathway}.blocks`)}
      </span>
    </button>
  );
}
