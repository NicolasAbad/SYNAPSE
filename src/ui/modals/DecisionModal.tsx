import { memo, useCallback, useEffect, useRef } from 'react';
import { HUD } from '../tokens';
import type { PatternDecisionDef } from '../../config/patterns';

/**
 * Two-choice decision modal — Sprint 4b Phase 4b.5. Fires when the player
 * has acquired a decision-node pattern (indices 6/15/24/36/48) but hasn't
 * locked in A or B yet. No Cancel — the decision must be made to advance.
 *
 * Accessibility:
 *   - role="dialog" aria-modal="true"
 *   - aria-labelledby points at the title
 *   - First option is default-focused (neutral bias; A is listed first in
 *     GDD §10 table so defaulting focus there mirrors reading order).
 */
export interface DecisionModalProps {
  open: boolean;
  nodeIndex: number;
  definition: PatternDecisionDef;
  onChoose: (choice: 'A' | 'B') => void;
}

export const DecisionModal = memo(function DecisionModal({
  open,
  nodeIndex,
  definition,
  onChoose,
}: DecisionModalProps) {
  const firstRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    firstRef.current?.focus();
  }, [open]);

  const pick = useCallback((choice: 'A' | 'B') => () => onChoose(choice), [onChoose]);

  if (!open) return null;

  const titleId = `decision-${nodeIndex}-title`;
  const rootId = `decision-modal-${nodeIndex}`;

  return (
    <div
      data-testid={rootId}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      style={{
        position: 'absolute',
        top: 0, right: 0, bottom: 0, left: 0, // CONST-OK: CSS full-bleed
        background: 'var(--color-overlay-scrim)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--spacing-6)', // CONST-OK: CSS custom property ref
        zIndex: 945, // CONST-OK: above HUD, below ConfirmModal (950)
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          maxWidth: 420, // CONST-OK: CSS readable line-length cap
          width: '100%', // CONST-OK: CSS full-bleed inside cap
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--spacing-6)', // CONST-OK: CSS custom property ref
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-body)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-4)', // CONST-OK: CSS custom property ref
        }}
      >
        <h2
          id={titleId}
          data-testid={`decision-${nodeIndex}-title`}
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--font-weight-bold)',
            textAlign: 'center',
          }}
        >
          Choose — Pattern {nodeIndex}
        </h2>
        <OptionButton
          refFwd={firstRef}
          testid={`decision-${nodeIndex}-A`}
          label="A"
          description={definition.A.description}
          onClick={pick('A')}
        />
        <OptionButton
          testid={`decision-${nodeIndex}-B`}
          label="B"
          description={definition.B.description}
          onClick={pick('B')}
        />
      </div>
    </div>
  );
});

function OptionButton({
  refFwd,
  testid,
  label,
  description,
  onClick,
}: {
  refFwd?: React.Ref<HTMLButtonElement>;
  testid: string;
  label: 'A' | 'B';
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      ref={refFwd}
      data-testid={testid}
      onPointerDown={onClick}
      style={{
        minHeight: HUD.touchTargetMin,
        padding: 'var(--spacing-3) var(--spacing-5)', // CONST-OK: CSS custom property ref
        background: 'var(--color-bg-deep)',
        border: '1px solid var(--color-primary)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--color-text-primary)',
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
      <span style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary)' }}>
        Option {label}
      </span>
      <span>{description}</span>
    </button>
  );
}
