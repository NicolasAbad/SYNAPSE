import { memo, useCallback, useEffect, useRef } from 'react';
import { HUD } from '../tokens';

/**
 * Generic 2-button confirm dialog. Sprint 4a Phase 4a.5 (Sprint 3.6 audit
 * addition). Reused by Sprint 8b for Transcendence.
 *
 * Accessibility:
 *   - role="dialog" + aria-modal="true"
 *   - aria-labelledby points at the title
 *   - Cancel is default-focused per idle-game mobile convention — single tap
 *     on body should NOT prestige, it should dismiss.
 *   - Escape key cancels.
 *
 * The testIdPrefix lets a parent page scope multiple Confirm modals (prestige
 * confirm, transcendence confirm, PAT-3 reset confirm — each gets its own
 * test id root).
 */
export interface ConfirmModalProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  testIdPrefix: string;
  /** Sprint 8b: anti-misclick cooldown — disables the confirm button while true. */
  confirmDisabled?: boolean;
}

export const ConfirmModal = memo(function ConfirmModal({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  testIdPrefix,
  confirmDisabled = false,
}: ConfirmModalProps) {
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  const onConfirmClick = useCallback(() => onConfirm(), [onConfirm]);
  const onCancelClick = useCallback(() => onCancel(), [onCancel]);

  if (!open) return null;

  return (
    <div
      data-testid={`${testIdPrefix}-root`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${testIdPrefix}-title`}
      style={{
        position: 'absolute',
        top: 0, right: 0, bottom: 0, left: 0, // CONST-OK: CSS full-bleed
        background: 'var(--color-overlay-scrim)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--spacing-6)', // CONST-OK: CSS custom property ref
        zIndex: 950, // CONST-OK: above other HUD, below splash
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          maxWidth: 420, // CONST-OK: CSS readable line-length cap
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--spacing-6)', // CONST-OK: CSS custom property ref
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-body)',
        }}
      >
        <h2
          id={`${testIdPrefix}-title`}
          data-testid={`${testIdPrefix}-title`}
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--font-weight-bold)',
            marginBottom: 'var(--spacing-3)', // CONST-OK: CSS custom property ref
          }}
        >
          {title}
        </h2>
        <p
          data-testid={`${testIdPrefix}-body`}
          style={{
            margin: 0,
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--spacing-5)', // CONST-OK: CSS custom property ref
            lineHeight: 1.5, // CONST-OK: CSS readability idiom
          }}
        >
          {body}
        </p>
        <div
          style={{
            display: 'flex',
            gap: 'var(--spacing-3)', // CONST-OK: CSS custom property ref
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            ref={cancelRef}
            data-testid={`${testIdPrefix}-cancel`}
            onPointerDown={onCancelClick}
            style={{
              minHeight: HUD.touchTargetMin,
              padding: 'var(--spacing-2) var(--spacing-5)', // CONST-OK: CSS custom property ref
              background: 'transparent',
              border: '1px solid var(--color-border-medium)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-secondary)',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
              touchAction: 'manipulation',
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={confirmDisabled}
            data-testid={`${testIdPrefix}-confirm`}
            onPointerDown={confirmDisabled ? undefined : onConfirmClick}
            style={{
              minHeight: HUD.touchTargetMin,
              padding: 'var(--spacing-2) var(--spacing-5)', // CONST-OK: CSS custom property ref
              background: confirmDisabled ? 'var(--color-bg-elevated)' : 'var(--color-primary)',
              border: '1px solid var(--color-primary)',
              borderRadius: 'var(--radius-md)',
              color: confirmDisabled ? 'var(--color-text-secondary)' : 'var(--color-bg-deep)',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: confirmDisabled ? 'not-allowed' : 'pointer',
              opacity: confirmDisabled ? 0.6 : 1, // CONST-OK CSS faded-state
              touchAction: 'manipulation',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
});
