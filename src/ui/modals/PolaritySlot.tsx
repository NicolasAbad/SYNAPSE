import { memo } from 'react';
import { t } from '../../config/strings';
import { HUD } from '../tokens';
import type { Polarity } from '../../types';
import { useGameStore } from '../../store/gameStore';

/**
 * Interactive Polarity picker slot — Sprint 4c Phase 4c.3.
 * Two cards (Excitatory / Inhibitory) with effect descriptions. Clicking a
 * card sets the selection; parent owns the confirm action.
 *
 * Sprint 10 Phase 10.5 — colorblindMode adds a glyph mark (▲ Excitatory /
 * ▼ Inhibitory) so the choice is distinguishable without relying on the
 * primary-violet selected-state color. Aria-labels describe the polarity +
 * its effect for screen readers.
 */
export interface PolaritySlotProps {
  selected: Polarity | null;
  onSelect: (polarity: Polarity) => void;
}

const POLARITY_GLYPH: Record<Polarity, string> = {
  excitatory: '▲', // CONST-OK CSS glyph (Phase 10.5 colorblind shape mark)
  inhibitory: '▼', // CONST-OK CSS glyph (Phase 10.5 colorblind shape mark)
};

export const PolaritySlot = memo(function PolaritySlot({ selected, onSelect }: PolaritySlotProps) {
  const colorblindMode = useGameStore((s) => s.colorblindMode);
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
        colorblindMode={colorblindMode}
      />
      <PolarityCard
        polarity="inhibitory"
        selected={selected === 'inhibitory'}
        onSelect={onSelect}
        testid="cycle-setup-polarity-inhibitory"
        colorblindMode={colorblindMode}
      />
    </div>
  );
});

function PolarityCard({
  polarity,
  selected,
  onSelect,
  testid,
  colorblindMode,
}: {
  polarity: Polarity;
  selected: boolean;
  onSelect: (p: Polarity) => void;
  testid: string;
  colorblindMode: boolean;
}) {
  const name = t(`cycle_setup.polarity_${polarity}_name`);
  const desc = t(`cycle_setup.polarity_${polarity}_desc`);
  return (
    <button
      type="button"
      data-testid={testid}
      data-selected={selected}
      onPointerDown={() => onSelect(polarity)}
      aria-label={`${name}. ${desc}`}
      aria-pressed={selected}
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
        {colorblindMode && (
          <span data-testid={`${testid}-glyph`} aria-hidden="true" style={{ marginRight: 'var(--spacing-2)' /* CONST-OK CSS spacing token */ }}>
            {POLARITY_GLYPH[polarity]}
          </span>
        )}
        {name}
      </span>
      <span style={{ fontSize: 'var(--text-xs)', opacity: 0.85 /* CONST-OK: CSS opacity idiom */ }}>
        {desc}
      </span>
    </button>
  );
}
