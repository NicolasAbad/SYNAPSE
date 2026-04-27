// Sprint 10 Phase 10.1 (V-4) — top-right "Saving..." pill.
// Subscribes to saveScheduler pub/sub; appears when a save starts, fades out
// `saveSyncIndicatorFadeMs` after the save completes (gives user time to
// register it). Subtle — does not obscure gameplay. role="status" + aria-live
// "polite" for screen readers per Sprint 10 accessibility scope.

import { memo, useCallback, useEffect, useState } from 'react';
import { isSaveInFlight, subscribeSaveStatus, trySave } from '../../store/saveScheduler';
import { SYNAPSE_CONSTANTS } from '../../config/constants';
import { en } from '../../config/strings/en';
import { useGameStore } from '../../store/gameStore';

const t = en.saveSync;

// CONST-OK CSS style objects (all values are CSS or token references; no game numbers)
const errorBannerStyle = {
  position: 'fixed' as const,
  top: 'calc(env(safe-area-inset-top, 0px) + var(--spacing-3))', // CONST-OK CSS
  right: 'calc(env(safe-area-inset-right, 0px) + var(--spacing-3))', // CONST-OK CSS
  padding: 'var(--spacing-2) var(--spacing-3)', // CONST-OK CSS
  background: 'rgba(127, 29, 29, 0.92)', // CONST-OK red-900 alpha
  border: '1px solid rgba(248, 113, 113, 0.5)', // CONST-OK red-400 alpha
  borderRadius: 'var(--radius-md)',
  color: '#fee2e2', // CONST-OK red-100 text WCAG AA on red-900
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-xs)',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 'var(--spacing-1)', // CONST-OK CSS
  maxWidth: 280, // CONST-OK CSS readable line-length
  zIndex: 945, // CONST-OK above HUD, below modals
};

const errorActionsRow = { display: 'flex', gap: 'var(--spacing-2)' }; // CONST-OK CSS
const errorButtonStyle = {
  background: 'transparent',
  border: '1px solid rgba(254, 226, 226, 0.4)', // CONST-OK alpha border
  borderRadius: 'var(--radius-sm)',
  color: '#fee2e2', // CONST-OK red-100
  fontSize: 'var(--text-xs)',
  padding: 'var(--spacing-1) var(--spacing-2)', // CONST-OK CSS
  cursor: 'pointer',
  touchAction: 'manipulation' as const,
};

const pillStyle = { // CONST-OK CSS style object
  position: 'fixed' as const,
  top: 'calc(env(safe-area-inset-top, 0px) + var(--spacing-3))', // CONST-OK CSS safe-area + spacing
  right: 'calc(env(safe-area-inset-right, 0px) + var(--spacing-3))', // CONST-OK CSS safe-area + spacing
  padding: 'var(--spacing-1) var(--spacing-3)', // CONST-OK CSS spacing tokens
  background: 'rgba(15, 23, 42, 0.85)', // CONST-OK CSS pill bg alpha
  border: '1px solid var(--color-border-subtle, #1f2937)', // CONST-OK CSS fallback
  borderRadius: 'var(--radius-pill, 999px)', // CONST-OK CSS pill radius
  color: 'var(--color-text-secondary, #9ca3af)', // CONST-OK CSS fallback
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-xs)',
  pointerEvents: 'none' as const,
  zIndex: 940, // CONST-OK below modals (945+) but above HUD
  transition: 'opacity 200ms ease', // CONST-OK CSS fade timing (V-4 subtle)
};

export const SaveSyncIndicator = memo(function SaveSyncIndicator() {
  const [visible, setVisible] = useState(isSaveInFlight());
  const lastSaveError = useGameStore((s) => s.lastSaveError);
  const setLastSaveError = useGameStore((s) => s.setLastSaveError);

  const onRetry = useCallback(() => { void trySave(); }, []);
  const onDismiss = useCallback(() => { setLastSaveError(null); }, [setLastSaveError]);

  useEffect(() => {
    let fadeTimer: ReturnType<typeof setTimeout> | null = null;
    const unsub = subscribeSaveStatus((inFlight) => {
      if (inFlight) {
        if (fadeTimer !== null) clearTimeout(fadeTimer);
        fadeTimer = null;
        setVisible(true);
      } else {
        // Hold the pill briefly after save completes (V-4 spec).
        fadeTimer = setTimeout(() => {
          setVisible(false);
          fadeTimer = null;
        }, SYNAPSE_CONSTANTS.saveSyncIndicatorFadeMs);
      }
    });
    return () => {
      unsub();
      if (fadeTimer !== null) clearTimeout(fadeTimer);
    };
  }, []);

  // Pre-launch audit Day 1 — error banner takes precedence over the in-flight pill.
  if (lastSaveError !== null) {
    return (
      <div
        data-testid="save-error-banner"
        role="alert"
        aria-live="assertive"
        style={errorBannerStyle}
      >
        <strong>{t.errorPrefix}</strong>
        <span data-testid="save-error-message" style={{ opacity: 0.9 /* CONST-OK CSS */ }}>{lastSaveError}</span>
        <div style={errorActionsRow}>
          <button type="button" data-testid="save-error-retry" onClick={onRetry} style={errorButtonStyle}>
            {t.errorRetryButton}
          </button>
          <button type="button" data-testid="save-error-dismiss" onClick={onDismiss} style={errorButtonStyle}>
            {t.errorDismissButton}
          </button>
        </div>
      </div>
    );
  }

  if (!visible) return null;
  return (
    <div
      data-testid="save-sync-indicator"
      role="status"
      aria-live="polite"
      style={pillStyle}
    >
      {t.saving}
    </div>
  );
});
