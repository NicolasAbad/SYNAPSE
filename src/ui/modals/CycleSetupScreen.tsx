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
import { MutationSlot } from './MutationSlot';
import { PathwaySlot } from './PathwaySlot';
import { WhatIfPreview } from './WhatIfPreview';
import { CycleSetupActionBar } from './cycleSetupActionBar';
import type { Mutation, Pathway, Polarity } from '../../types';

// Sprint 5 Phase 5.5: full Mutation + Pathway slot interactivity, with
// What-if Preview below the columns. Polarity slot kept from Sprint 4c.
// Sprint 4b stub-mode placeholders removed (no more "Sprint 5 — coming
// soon" copy). lastCycleConfig snapshot now carries 3 fields (polarity,
// mutation, pathway) — POLAR-1 / SAME AS LAST applies all three.
//
// Layout responsiveness per CYCLE-2 (§29): ≥600px = N-column, <600px
// = stepper with progress dots. Stepper logic unchanged from Sprint 4c.
//
// onChoose signature widened from `(p: Polarity)` to a triple of choices.
// AwakeningFlow (Sprint 5 Phase 5.5 update) calls setPolarity, setMutation,
// setPathway in sequence based on which choices are present.

function placeholderLabelKey(slot: Slot): string {
  if (slot === 'mutation') return 'cycle_setup.slot_locked_mutation';
  return 'cycle_setup.slot_locked_pathway';
}

function SlotPlaceholder({ slot, mode }: { slot: Slot; mode: 'locked' | 'coming-soon' }) {
  return (
    <div
      data-testid={`cycle-setup-slot-${slot}`}
      style={{
        flex: 1,
        minHeight: HUD.touchTargetMin,
        padding: 'var(--spacing-5)', // CONST-OK
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

export interface CycleSetupChoice {
  polarity: Polarity | null;
  mutationId: string | null;
  pathway: Pathway | null;
}

export interface CycleSetupScreenProps {
  prestigeCount: number;
  /** POLAR-1 default: pre-selected from `lastCycleConfig` snapshot. */
  lastCyclePolarity?: Polarity | null;
  lastCycleMutation?: string | null;
  lastCyclePathway?: Pathway | null;
  /** Mutation options drawn for this cycle (engine call upstream — getMutationOptions). */
  mutationOptions?: readonly Mutation[];
  /** What-if Preview inputs (effectivePPS + threshold from store). */
  effectivePPS?: number;
  currentThreshold?: number;
  /** Fires when player confirms all selectable slots. Parent handles set* actions. */
  onChoose?: (choice: CycleSetupChoice) => void;
}

export const CycleSetupScreen = memo(function CycleSetupScreen({
  prestigeCount,
  lastCyclePolarity = null,
  lastCycleMutation = null,
  lastCyclePathway = null,
  mutationOptions = [],
  effectivePPS = 0,
  currentThreshold = 0,
  onChoose,
}: CycleSetupScreenProps) {
  const isTablet = useIsTabletWidth();
  const slots = unlockedSlotsFor(prestigeCount);
  const [stepIndex, setStepIndex] = useState(0);
  // POLAR-1 + Sprint 5 SAME AS LAST: pre-select from lastCycleConfig snapshot.
  const [selectedPolarity, setSelectedPolarity] = useState<Polarity | null>(lastCyclePolarity);
  const [selectedMutation, setSelectedMutation] = useState<string | null>(lastCycleMutation);
  const [selectedPathway, setSelectedPathway] = useState<Pathway | null>(lastCyclePathway);

  const polarityUnlocked = slots.includes('polarity');
  const mutationUnlocked = slots.includes('mutation');
  const pathwayUnlocked = slots.includes('pathway');

  // SAME AS LAST is available iff we have any prior choice for any unlocked slot.
  const canSameAsLast =
    (polarityUnlocked && lastCyclePolarity !== null) ||
    (mutationUnlocked && lastCycleMutation !== null) ||
    (pathwayUnlocked && lastCyclePathway !== null);
  // Continue requires every unlocked slot to have a current selection.
  const canContinue =
    (!polarityUnlocked || selectedPolarity !== null) &&
    (!mutationUnlocked || selectedMutation !== null) &&
    (!pathwayUnlocked || selectedPathway !== null) &&
    slots.length > 0;

  const renderSlot = (slot: Slot) => {
    if (slot === 'polarity') {
      return <PolaritySlot key={slot} selected={selectedPolarity} onSelect={setSelectedPolarity} />;
    }
    if (slot === 'mutation') {
      return mutationOptions.length > 0
        ? <MutationSlot key={slot} options={mutationOptions} selected={selectedMutation} onSelect={setSelectedMutation} />
        : <SlotPlaceholder key={slot} slot={slot} mode="coming-soon" />;
    }
    return <PathwaySlot key={slot} selected={selectedPathway} onSelect={setSelectedPathway} />;
  };

  const onChooseConfirm = () => {
    onChoose?.({
      polarity: polarityUnlocked ? selectedPolarity : null,
      mutationId: mutationUnlocked ? selectedMutation : null,
      pathway: pathwayUnlocked ? selectedPathway : null,
    });
  };

  const onSameAsLast = () => {
    onChoose?.({
      polarity: polarityUnlocked ? lastCyclePolarity : null,
      mutationId: mutationUnlocked ? lastCycleMutation : null,
      pathway: pathwayUnlocked ? lastCyclePathway : null,
    });
  };

  const columnsLayout = (
    <div data-testid="cycle-setup-columns" style={{ flex: 1, display: 'flex', gap: 'var(--spacing-4)' /* CONST-OK */, alignItems: 'stretch' }}>
      {slots.map(renderSlot)}
    </div>
  );

  const stepperLayout = (
    <div data-testid="cycle-setup-stepper" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' /* CONST-OK */ }}>
      {slots.length > 0 && renderSlot(slots[stepIndex] ?? slots[0])}
      {slots.length > 1 && (
        <div data-testid="cycle-setup-progress-dots" style={{ display: 'flex', gap: 'var(--spacing-2)' /* CONST-OK */, justifyContent: 'center' }}>
          {slots.map((slot, i) => (
            <span
              key={slot}
              data-testid={`cycle-setup-dot-${i}`}
              data-active={i === stepIndex}
              style={{
                width: HUD.pipSize, height: HUD.pipSize, borderRadius: 'var(--radius-full)',
                background: i === stepIndex ? 'var(--color-primary)' : 'var(--color-text-disabled)',
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
            padding: 'var(--spacing-3) var(--spacing-6)', // CONST-OK
            background: 'var(--color-primary)', border: 'none', borderRadius: 'var(--radius-md)',
            color: 'var(--color-bg-deep)', fontWeight: 'var(--font-weight-semibold)',
            touchAction: 'manipulation', alignSelf: 'center',
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
        top: 0, right: 0, bottom: 0, left: 0, // CONST-OK
        background: 'var(--color-bg-deep)', padding: 'var(--spacing-6)' /* CONST-OK */,
        display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' /* CONST-OK */,
        color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)',
        zIndex: 940, // CONST-OK: shares modal-overlay tier with AwakeningScreen (post-4c.6.7 fix)
      }}
    >
      {isTablet ? columnsLayout : stepperLayout}
      <WhatIfPreview
        effectivePPS={effectivePPS}
        currentThreshold={currentThreshold}
        selectedMutationId={selectedMutation}
        selectedPathway={selectedPathway}
      />
      <CycleSetupActionBar
        canSameAsLast={canSameAsLast}
        canContinue={canContinue}
        onSameAsLast={onSameAsLast}
        onContinue={onChooseConfirm}
      />
    </div>
  );
});
