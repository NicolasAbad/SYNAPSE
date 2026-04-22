import { memo, useState } from 'react';
import { HUD } from '../tokens';
import { t } from '../../config/strings';
import {
  SLOT_LOCKED_LABEL,
  type Slot,
  unlockedSlotsFor,
  useIsTabletWidth,
} from './cycleSetupSlots';
import { PolaritySlot } from './PolaritySlot';
import { CycleSetupActionBar } from './cycleSetupActionBar';
import type { Polarity } from '../../types';

// CycleSetupScreen — LAYOUT SHELL ONLY (Sprint 2 Phase 6).
// Responsive per CYCLE-2 (§29): ≥600px uses 1–3-column layout,
// <600px uses step-by-step with Next button + progress dots.
//
// SAME AS LAST is rendered but disabled — no prior choices exist in Sprint 2.
// Not wired to App.tsx — real trigger lives in Sprint 4c (Awakening → Pattern
// Tree → CycleSetupScreen → new cycle). Test in isolation via prop injection.
//
// Unlock gates live in ./cycleSetupSlots.ts (helpers split per CODE-2).

/**
 * Label for non-polarity placeholder slots. Switch from the "unlocks at PN"
 * copy (which fires when prestigeCount < unlock) to the "coming in Sprint 5"
 * copy (which fires when the slot IS unlocked but not yet interactive).
 */
function placeholderLabelKey(slot: Slot): string {
  if (slot === 'mutation') return 'cycle_setup.slot_placeholder_mutation';
  return 'cycle_setup.slot_placeholder_pathway';
}

function SlotPlaceholder({ slot, mode }: { slot: Slot; mode: 'locked' | 'coming-soon' }) {
  return (
    <div
      data-testid={`cycle-setup-slot-${slot}`}
      style={{
        flex: 1,
        minHeight: HUD.touchTargetMin,
        padding: 'var(--spacing-5)', // CONST-OK: CSS custom property ref (CODE-1 exception)
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-lg)',
        color: 'var(--color-text-secondary)',
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {t(mode === 'locked' ? SLOT_LOCKED_LABEL[slot] : placeholderLabelKey(slot))}
    </div>
  );
}

interface CycleSetupScreenProps {
  prestigeCount: number;
  /** POLAR-1 default: pre-selected polarity from `lastCycleConfig.polarity`. */
  lastCyclePolarity?: Polarity | null;
  /** Fires when the player confirms (Continue or SAME AS LAST). Parent handles setPolarity + dismissal. */
  onChoose?: (polarity: Polarity) => void;
}

export const CycleSetupScreen = memo(function CycleSetupScreen({
  prestigeCount,
  lastCyclePolarity = null,
  onChoose,
}: CycleSetupScreenProps) {
  const isTablet = useIsTabletWidth();
  const slots = unlockedSlotsFor(prestigeCount);
  const [stepIndex, setStepIndex] = useState(0);
  // POLAR-1 default — pre-select last cycle's polarity (if any).
  const [selectedPolarity, setSelectedPolarity] = useState<Polarity | null>(lastCyclePolarity);

  const polarityUnlocked = slots.includes('polarity');
  const canSameAsLast = polarityUnlocked && lastCyclePolarity !== null;
  const canContinue = polarityUnlocked && selectedPolarity !== null;

  const renderSlot = (slot: Slot) => {
    if (slot === 'polarity') {
      return <PolaritySlot key={slot} selected={selectedPolarity} onSelect={setSelectedPolarity} />;
    }
    return <SlotPlaceholder key={slot} slot={slot} mode="coming-soon" />;
  };

  const columnsLayout = (
    <div
      data-testid="cycle-setup-columns"
      style={{
        flex: 1,
        display: 'flex',
        gap: 'var(--spacing-4)', // CONST-OK: CSS custom property ref (CODE-1 exception)
        alignItems: 'stretch',
      }}
    >
      {slots.map(renderSlot)}
    </div>
  );

  const stepperLayout = (
    <div
      data-testid="cycle-setup-stepper"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-5)', // CONST-OK: CSS custom property ref (CODE-1 exception)
      }}
    >
      {slots.length > 0 && renderSlot(slots[stepIndex] ?? slots[0])}
      {slots.length > 1 && (
        <div
          data-testid="cycle-setup-progress-dots"
          style={{ display: 'flex', gap: 'var(--spacing-2)', justifyContent: 'center' }} // CONST-OK: CSS custom property ref (CODE-1 exception)
        >
          {slots.map((slot, i) => (
            <span
              key={slot}
              data-testid={`cycle-setup-dot-${i}`}
              data-active={i === stepIndex}
              style={{
                width: HUD.pipSize,
                height: HUD.pipSize,
                borderRadius: 'var(--radius-full)',
                background:
                  i === stepIndex ? 'var(--color-primary)' : 'var(--color-text-disabled)',
              }}
            />
          ))}
        </div>
      )}
      {slots.length > 1 && stepIndex < slots.length - 1 && (
        <button
          type="button"
          data-testid="cycle-setup-next"
          onPointerDown={() => setStepIndex((i) => Math.min(i + 1, slots.length - 1))}
          style={{
            minHeight: HUD.touchTargetMin,
            padding: 'var(--spacing-3) var(--spacing-6)', // CONST-OK: CSS custom property ref (CODE-1 exception)
            background: 'var(--color-primary)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-bg-deep)',
            fontWeight: 'var(--font-weight-semibold)',
            touchAction: 'manipulation',
            alignSelf: 'center',
          }}
        >
          {t('cycle_setup.next')}
        </button>
      )}
    </div>
  );

  return (
    <div
      data-testid="cycle-setup-screen"
      data-layout={isTablet ? 'columns' : 'stepper'}
      data-column-count={slots.length}
      style={{
        position: 'absolute',
        top: 0, right: 0, bottom: 0, left: 0, // CONST-OK: CSS full-bleed (CODE-1 exception)
        background: 'var(--color-bg-deep)',
        padding: 'var(--spacing-6)', // CONST-OK: CSS custom property ref (CODE-1 exception)
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-6)', // CONST-OK: CSS custom property ref (CODE-1 exception)
        color: 'var(--color-text-primary)',
        fontFamily: 'var(--font-body)',
        // Sprint 4c.6.7 BLOCKER fix — Mind subtab bar (z 880) was covering
        // the upper portion of the polarity cards, eating taps. Lifted to
        // 940 so it shares the modal-overlay tier with AwakeningScreen.
        zIndex: 940, // CONST-OK: overlay stacking (CODE-1 exception)
      }}
    >
      {isTablet ? columnsLayout : stepperLayout}
      <CycleSetupActionBar
        canSameAsLast={canSameAsLast}
        canContinue={canContinue}
        onSameAsLast={() => { if (lastCyclePolarity !== null) onChoose?.(lastCyclePolarity); }}
        onContinue={() => { if (selectedPolarity !== null) onChoose?.(selectedPolarity); }}
      />
    </div>
  );
});
