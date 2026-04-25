// Sprint 10 Phase 10.1 (V-4) — top-right "Saving..." pill.
// Subscribes to saveScheduler pub/sub; appears when a save starts, fades out
// `saveSyncIndicatorFadeMs` after the save completes (gives user time to
// register it). Subtle — does not obscure gameplay. role="status" + aria-live
// "polite" for screen readers per Sprint 10 accessibility scope.

import { memo, useEffect, useState } from 'react';
import { isSaveInFlight, subscribeSaveStatus } from '../../store/saveScheduler';
import { SYNAPSE_CONSTANTS } from '../../config/constants';
import { en } from '../../config/strings/en';

const t = en.saveSync;

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
