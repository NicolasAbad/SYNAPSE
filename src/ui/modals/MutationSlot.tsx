import { memo, useCallback, useState } from 'react';
import { t } from '../../config/strings';
import { HUD } from '../tokens';
import type { Mutation } from '../../types';
import { useAdContext } from '../../platform/AdContext';
import { useGameStore } from '../../store/gameStore';
import { en } from '../../config/strings/en';

const tAds = en.ads;

/**
 * Interactive Mutation picker slot — Sprint 5 Phase 5.5.
 *
 * Caller (CycleSetupScreen) computes `options: Mutation[]` via
 * getMutationOptions() and passes them in. Slot displays all options
 * (3 baseline; 4 with Creativa; +1 with Genius Pass; +N with Pattern
 * Tree Node 48 B) as selectable cards. Each card shows category
 * badge + name + concise effect description from i18n.
 *
 * No "scrollable" overflow handling here — the cycle-setup container
 * already overflows-scrolls per CycleSetupScreen layout. Cards size
 * themselves to content; small viewports stack vertically.
 */
export interface MutationSlotProps {
  options: readonly Mutation[];
  selected: string | null;
  onSelect: (mutationId: string) => void;
}

export const MutationSlot = memo(function MutationSlot({ options, selected, onSelect }: MutationSlotProps) {
  const ad = useAdContext();
  const reroll = useGameStore((s) => s.rerollMutationOptions);
  const [adNote, setAdNote] = useState<string>('');

  const onRerollClick = useCallback(async () => {
    setAdNote('');
    const result = await ad.tryShowAd('mutation_reroll');
    if (result.status === 'shown' || result.status === 'dismissed') {
      // Reroll regardless of reward earned — the user spent their ad cooldown
      // either way. This matches the SleepScreen offline-double UX (cooldown
      // is the cost; the watch-vs-dismiss distinction is only for failure
      // toasts).
      if (result.status === 'shown') reroll();
    } else if (result.status === 'failed') {
      setAdNote(tAds.failedToast);
    }
  }, [ad, reroll]);

  return (
    <div
      data-testid="cycle-setup-slot-mutation"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-3)', // CONST-OK: CSS token ref
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
        Mutation
      </h3>
      {options.map((m) => (
        <MutationCard key={m.id} mutation={m} selected={selected === m.id} onSelect={onSelect} />
      ))}
      {!ad.inert && (
        <button
          type="button"
          data-testid="cycle-setup-mutation-reroll-ad"
          onPointerDown={onRerollClick}
          style={{
            minHeight: HUD.touchTargetMin,
            padding: 'var(--spacing-2) var(--spacing-3)', // CONST-OK CSS spacing tokens
            background: 'transparent',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-text-secondary)',
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-xs)',
            cursor: 'pointer',
            touchAction: 'manipulation',
          }}
        >
          {tAds.rerollMutation}
        </button>
      )}
      {adNote !== '' && (
        <p data-testid="cycle-setup-mutation-reroll-ad-note" style={{ margin: 0, fontSize: 'var(--text-xs)', opacity: 0.85 /* CONST-OK CSS subdued caption */ }}>
          {adNote}
        </p>
      )}
    </div>
  );
});

function MutationCard({ mutation, selected, onSelect }: { mutation: Mutation; selected: boolean; onSelect: (id: string) => void }) {
  return (
    <button
      type="button"
      data-testid={`cycle-setup-mutation-${mutation.id}`}
      data-selected={selected}
      onPointerDown={() => onSelect(mutation.id)}
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
      <span style={{ fontSize: 'var(--text-xs)', opacity: 0.7 /* CONST-OK */ }}>
        {t(`mutation_categories.${mutation.category}`)}
      </span>
      <span style={{ fontWeight: 'var(--font-weight-bold)' }}>{t(mutation.nameKey)}</span>
      <span style={{ fontSize: 'var(--text-xs)', opacity: 0.85 /* CONST-OK */ }}>
        {t(mutation.descriptionKey)}
      </span>
    </button>
  );
}
