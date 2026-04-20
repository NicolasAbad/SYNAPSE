import { memo, useState } from 'react';
import { HUD } from '../tokens';
import { t } from '../../config/strings';
import {
  SLOT_LOCKED_LABEL,
  type Slot,
  unlockedSlotsFor,
  useIsTabletWidth,
} from './cycleSetupSlots';

// CycleSetupScreen — LAYOUT SHELL ONLY (Sprint 2 Phase 6).
// Responsive per CYCLE-2 (§29): ≥600px uses 1–3-column layout,
// <600px uses step-by-step with Next button + progress dots.
//
// SAME AS LAST is rendered but disabled — no prior choices exist in Sprint 2.
// Not wired to App.tsx — real trigger lives in Sprint 4c (Awakening → Pattern
// Tree → CycleSetupScreen → new cycle). Test in isolation via prop injection.
//
// Unlock gates live in ./cycleSetupSlots.ts (helpers split per CODE-2).

function SlotPlaceholder({ slot }: { slot: Slot }) {
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
      {t(SLOT_LOCKED_LABEL[slot])}
    </div>
  );
}

interface CycleSetupScreenProps {
  prestigeCount: number;
}

export const CycleSetupScreen = memo(function CycleSetupScreen({
  prestigeCount,
}: CycleSetupScreenProps) {
  const isTablet = useIsTabletWidth();
  const slots = unlockedSlotsFor(prestigeCount);
  const [stepIndex, setStepIndex] = useState(0);

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
      {slots.map((slot) => (
        <SlotPlaceholder key={slot} slot={slot} />
      ))}
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
      {slots.length > 0 && <SlotPlaceholder slot={slots[stepIndex] ?? slots[0]} />}
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
        zIndex: 800, // CONST-OK: overlay stacking (CODE-1 exception)
      }}
    >
      {isTablet ? columnsLayout : stepperLayout}
      <button
        type="button"
        data-testid="cycle-setup-same-as-last"
        disabled
        style={{
          minHeight: HUD.touchTargetMin,
          padding: 'var(--spacing-3) var(--spacing-6)', // CONST-OK: CSS custom property ref (CODE-1 exception)
          background: 'transparent',
          border: '1px solid var(--color-border-medium)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-text-disabled)',
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--font-weight-semibold)',
          cursor: 'not-allowed',
          opacity: HUD.dischargeButtonDisabledOpacity,
          alignSelf: 'center',
        }}
      >
        {t('cycle_setup.same_as_last')}
      </button>
    </div>
  );
});
