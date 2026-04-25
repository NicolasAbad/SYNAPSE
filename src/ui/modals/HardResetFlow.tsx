// Sprint 10 Phase 10.1 (V-3) — Hard Reset multi-step flow.
// 3-tap counter (resets after window) → reveals RESET text input → confirm
// button enabled when text matches → calls hardReset action (logs reset_game
// before wiping). Counter window in constants per CODE-1.
//
// This is a CONTROLLED multi-step component — parent (SettingsModal Game
// section) renders <HardResetFlow /> and the component owns its own state
// machine. Closing the parent modal does NOT auto-cancel — that's a feature:
// users who tapped 3 times by accident can close the modal and reopen with
// the prompt still active. The window-expiry timer resets the counter
// independent of modal lifecycle.

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../config/constants';
import { en } from '../../config/strings/en';

const t = en.settings;

const dangerButtonStyle = { // CONST-OK CSS style object
  display: 'block',
  width: '100%', // CONST-OK CSS full-width idiom
  marginTop: 'var(--spacing-3)', // CONST-OK CSS spacing token
  padding: 'var(--spacing-3) var(--spacing-4)', // CONST-OK CSS spacing tokens
  background: 'transparent',
  color: 'var(--color-danger, #ef4444)', // CONST-OK CSS fallback
  border: '1px solid var(--color-danger, #ef4444)', // CONST-OK CSS fallback
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-md)',
  cursor: 'pointer',
};

const inputStyle = { // CONST-OK CSS style object
  display: 'block',
  width: '100%', // CONST-OK CSS full-width idiom
  marginTop: 'var(--spacing-3)', // CONST-OK CSS spacing token
  padding: 'var(--spacing-2) var(--spacing-3)', // CONST-OK CSS spacing tokens
  background: 'var(--color-bg-input, #1f2937)', // CONST-OK CSS fallback
  color: 'var(--color-text-primary, #f3f4f6)', // CONST-OK CSS fallback
  border: '1px solid var(--color-border-subtle, #374151)', // CONST-OK CSS fallback
  borderRadius: 'var(--radius-md)',
  fontFamily: 'monospace', // CONST-OK CSS deliberate fixed-width for confirm-text alignment
  fontSize: 'var(--text-md)',
  textTransform: 'uppercase' as const,
};

const promptStyle = { // CONST-OK CSS style object
  marginTop: 'var(--spacing-2)', // CONST-OK CSS spacing token
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-secondary, #9ca3af)', // CONST-OK CSS fallback
};

const warningStyle = { ...promptStyle, color: 'var(--color-danger, #ef4444)' }; // CONST-OK CSS fallback

export const HardResetFlow = memo(function HardResetFlow() {
  const hardReset = useGameStore((s) => s.hardReset);
  const [tapCount, setTapCount] = useState(0);
  const [confirmText, setConfirmText] = useState('');
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTapTimer = useCallback(() => {
    if (tapTimerRef.current !== null) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => {
      setTapCount(0);
      tapTimerRef.current = null;
    }, SYNAPSE_CONSTANTS.hardResetTapWindowMs);
  }, []);

  useEffect(() => {
    return () => {
      if (tapTimerRef.current !== null) clearTimeout(tapTimerRef.current);
    };
  }, []);

  const onTap = useCallback(() => {
    setTapCount((prev) => {
      const next = prev + 1;
      if (next >= SYNAPSE_CONSTANTS.hardResetTapCount) {
        if (tapTimerRef.current !== null) clearTimeout(tapTimerRef.current);
        tapTimerRef.current = null;
        return SYNAPSE_CONSTANTS.hardResetTapCount;
      }
      resetTapTimer();
      return next;
    });
  }, [resetTapTimer]);

  const onCancel = useCallback(() => {
    if (tapTimerRef.current !== null) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = null;
    setTapCount(0);
    setConfirmText('');
  }, []);

  const onConfirm = useCallback(() => {
    hardReset();
  }, [hardReset]);

  const remaining = SYNAPSE_CONSTANTS.hardResetTapCount - tapCount;
  const armed = tapCount >= SYNAPSE_CONSTANTS.hardResetTapCount;
  const matches = confirmText.trim().toUpperCase() === SYNAPSE_CONSTANTS.hardResetConfirmText;

  if (!armed) {
    return (
      <div data-testid="hard-reset-flow">
        <button
          type="button"
          data-testid="hard-reset-tap"
          onClick={onTap}
          style={dangerButtonStyle}
          aria-label={t.hardResetButton}
        >
          {t.hardResetButton}
        </button>
        {tapCount > 0 && (
          <p data-testid="hard-reset-tap-prompt" style={promptStyle}>
            {remaining === 1 ? t.hardResetTapPromptOne : t.hardResetTapPrompt}
          </p>
        )}
      </div>
    );
  }

  return (
    <div data-testid="hard-reset-flow">
      <p style={warningStyle}>{t.hardResetWarning}</p>
      <p style={promptStyle}>{t.hardResetInputPrompt}</p>
      <input
        type="text"
        data-testid="hard-reset-input"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder={t.hardResetInputPlaceholder}
        style={inputStyle}
        autoFocus
        aria-label={t.hardResetInputPrompt}
      />
      <button
        type="button"
        data-testid="hard-reset-confirm"
        onClick={matches ? onConfirm : undefined}
        disabled={!matches}
        style={{ ...dangerButtonStyle, opacity: matches ? 1 : 0.55, cursor: matches ? 'pointer' : 'not-allowed' as const }}
      >
        {t.hardResetConfirmButton}
      </button>
      <button
        type="button"
        data-testid="hard-reset-cancel"
        onClick={onCancel}
        style={{ ...dangerButtonStyle, color: 'var(--color-text-secondary, #9ca3af)', borderColor: 'var(--color-border-subtle, #374151)' }}
      >
        {t.hardResetCancelButton}
      </button>
    </div>
  );
});
