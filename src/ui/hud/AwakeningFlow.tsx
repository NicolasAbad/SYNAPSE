import { memo, useCallback, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { PrestigeOutcome } from '../../engine/prestige';
import { ConfirmModal } from '../modals/ConfirmModal';
import { AwakeningScreen } from '../modals/AwakeningScreen';
import { t } from '../../config/strings';
import { HUD } from '../tokens';

/**
 * Orchestrates the prestige flow per SPRINTS.md §4a + §3.6-audit addition:
 *   1. Player sees an AWAKENING button when cycleGenerated ≥ currentThreshold.
 *   2. Tap opens a generic ConfirmModal (Cancel default-focused).
 *   3. Confirm → calls the store `prestige(now)` action.
 *   4. On `fired: true` → renders AwakeningScreen with PrestigeOutcome.
 *   5. "Continue" dismisses the screen; new-cycle play resumes.
 *
 * Local React state because the flow is ephemeral (open → dismiss in the
 * same render tree), same pattern as GdprModal. The engine/store already
 * owns the post-prestige GameState; this component only coordinates UI.
 */
export const AwakeningFlow = memo(function AwakeningFlow() {
  const cycleGenerated = useGameStore((s) => s.cycleGenerated);
  const currentThreshold = useGameStore((s) => s.currentThreshold);
  const prestige = useGameStore((s) => s.prestige);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [outcome, setOutcome] = useState<PrestigeOutcome | null>(null);

  const ready = cycleGenerated >= currentThreshold;

  const onReadyClick = useCallback(() => setConfirmOpen(true), []);
  const onCancel = useCallback(() => setConfirmOpen(false), []);
  const onConfirm = useCallback(() => {
    setConfirmOpen(false);
    const result = prestige(Date.now());
    if (result.fired) setOutcome(result.outcome);
  }, [prestige]);
  const onContinue = useCallback(() => setOutcome(null), []);

  const showReadyButton = ready && !confirmOpen && !outcome;

  return (
    <>
      {showReadyButton && (
        <button
          type="button"
          data-testid="hud-awakening-button"
          onPointerDown={onReadyClick}
          style={{
            position: 'absolute',
            left: '50%', // CONST-OK: center horizontally
            transform: 'translateX(-50%)', // CONST-OK: center horizontally
            bottom: 'calc(var(--spacing-12) + env(safe-area-inset-bottom, 0))', // CONST-OK: CSS custom property ref
            minHeight: HUD.touchTargetMin,
            padding: 'var(--spacing-3) var(--spacing-6)', // CONST-OK: CSS custom property ref
            background: 'var(--color-primary)',
            color: 'var(--color-bg-deep)',
            border: '1px solid var(--color-primary)',
            borderRadius: 'var(--radius-full)',
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-bold)',
            letterSpacing: '0.08em', // CONST-OK: CSS tracking idiom
            boxShadow: '0 0 24px var(--color-primary)', // CONST-OK: CSS shadow idiom
            cursor: 'pointer',
            touchAction: 'manipulation',
            pointerEvents: 'auto',
            zIndex: 920, // CONST-OK: above regular HUD, below modals
          }}
          aria-label={t('awakening.ready_label')}
        >
          {t('awakening.ready_label')}
        </button>
      )}
      <ConfirmModal
        open={confirmOpen}
        title={t('awakening.confirm_title')}
        body={t('awakening.confirm_body')}
        confirmLabel={t('awakening.confirm_button')}
        cancelLabel={t('confirm.cancel')}
        onConfirm={onConfirm}
        onCancel={onCancel}
        testIdPrefix="awakening-confirm"
      />
      <AwakeningScreen outcome={outcome} onContinue={onContinue} />
    </>
  );
});
