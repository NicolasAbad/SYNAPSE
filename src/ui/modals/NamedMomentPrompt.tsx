// Sprint 7.5 Phase 7.5.7 — Named Moment author/skip prompt modal.
//
// Surfaces when an eligible Named Moment fires (per src/engine/innerVoice.ts
// VOICE-1 + VOICE-2 + VOICE-2a). Player either:
//   - Authors a phrase (max brocaPhraseMaxChars chars; trimmed; non-empty)
//   - Skips (substitutes archetype-keyed default phrase)
//
// Engine layer (innerVoice.ts) shipped in 7.5.6; this modal closes the loop
// by giving the player a UI surface to interact with. Eligibility detection
// runs as a derived selector (`pendingNamedMoment`) over current state +
// last-fired trigger, exposed via a small store-local UIState field.
//
// VOICE-2a: this modal renders regardless of Broca region UI unlock at P14.
// First Named Moment (first_awakening at P1) is the most important emotional
// beat and must not be gated by a future UI.

import React, { memo, useCallback, useMemo, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { defaultPhraseFor } from '../../engine/innerVoice';
import type { NamedMomentId } from '../../engine/innerVoice';
import { SYNAPSE_CONSTANTS } from '../../config/constants';
import { t } from '../../config/strings';

/**
 * Detect the FIRST eligible Named Moment that fires given current state.
 * Fired moments are stored in brocaNamedMoments — once logged they're skipped.
 * Trigger detection is derived from state alone (no separate trigger event
 * storage): first_awakening fires at prestigeCount === 1, archetype_voice
 * when archetype is set, etc.
 */
function detectPendingMoment(state: {
  prestigeCount: number;
  archetype: string | null;
  resonantPatternsDiscovered: readonly boolean[];
  endingsSeen: readonly string[];
  brocaNamedMoments: readonly { momentId: string }[];
}): NamedMomentId | null {
  const logged = new Set(state.brocaNamedMoments.map((m) => m.momentId));
  if (state.prestigeCount >= 1 && !logged.has('first_awakening')) return 'first_awakening';
  if (state.archetype !== null && !logged.has('archetype_voice')) return 'archetype_voice';
  if (state.resonantPatternsDiscovered.some((b) => b) && !logged.has('resonance_found')) return 'resonance_found';
  if (state.prestigeCount >= SYNAPSE_CONSTANTS.era3StartPrestige && !logged.has('era3_entry')) return 'era3_entry';
  if (state.endingsSeen.length > 0 && !logged.has('last_choice')) return 'last_choice';
  return null;
}

export const NamedMomentPrompt = memo(function NamedMomentPrompt() {
  const prestigeCount = useGameStore((s) => s.prestigeCount);
  const archetype = useGameStore((s) => s.archetype);
  const resonantPatternsDiscovered = useGameStore((s) => s.resonantPatternsDiscovered);
  const endingsSeen = useGameStore((s) => s.endingsSeen);
  const brocaNamedMoments = useGameStore((s) => s.brocaNamedMoments);
  const authorNamedMoment = useGameStore((s) => s.authorNamedMoment);
  const skipNamedMoment = useGameStore((s) => s.skipNamedMoment);

  const pending = useMemo(
    () => detectPendingMoment({ prestigeCount, archetype, resonantPatternsDiscovered, endingsSeen, brocaNamedMoments }),
    [prestigeCount, archetype, resonantPatternsDiscovered, endingsSeen, brocaNamedMoments],
  );

  const [draft, setDraft] = useState('');
  const onAuthor = useCallback(() => {
    if (pending === null) return;
    if (authorNamedMoment(pending, draft) === 'ok') setDraft('');
  }, [pending, draft, authorNamedMoment]);
  const onSkip = useCallback(() => {
    if (pending === null) return;
    skipNamedMoment(pending);
    setDraft('');
  }, [pending, skipNamedMoment]);

  if (pending === null) return null;
  const placeholder = defaultPhraseFor(pending, archetype);

  // All numeric literals below are CSS-token references or fixed UI tokens. CONST-OK throughout this JSX block.
  return (
    <div
      data-testid="named-moment-prompt"
      data-moment-id={pending}
      style={{
        position: 'absolute',
        top: 0, right: 0, bottom: 0, left: 0,
        background: 'color-mix(in srgb, var(--color-bg-deep) 80%, transparent)', // CONST-OK
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 950, // CONST-OK: above HUD subtab bar, below modals
        padding: 'var(--spacing-4)', // CONST-OK
        pointerEvents: 'auto',
      }}
    >
      <div style={dialogStyle}>
        <h2 style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: 'var(--text-lg)' }}>{t(`named_moments.${pending}.title`)}</h2>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', fontStyle: 'italic' }}>{t(`named_moments.${pending}.prompt`)}</p>
        <input
          data-testid="named-moment-input"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={SYNAPSE_CONSTANTS.brocaPhraseMaxChars}
          placeholder={placeholder}
          style={inputStyle}
        />
        <div style={buttonRowStyle}>
          <button type="button" data-testid="named-moment-skip" onPointerDown={onSkip} style={skipButtonStyle}>{t('named_moments.skip_button')}</button>
          <button type="button" data-testid="named-moment-author" disabled={draft.trim().length === 0} onPointerDown={onAuthor} style={authorButtonStyle(draft.trim().length > 0)}>{t('named_moments.author_button')}</button>
        </div>
      </div>
    </div>
  );
});

// Style helpers extracted to module scope so JSX stays under the 50-line cap
// AND the gate-3 numeric-literal scan only sees them once. CSS-token strings
// inside (var(--spacing-N) etc.) are visual-layer constants. CONST-OK throughout.

const dialogStyle: React.CSSProperties = {
  background: 'var(--color-bg-elevated)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--spacing-5)', // CONST-OK
  maxWidth: 420, // CONST-OK: mobile portrait viewport
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--spacing-3)', // CONST-OK
};

const inputStyle: React.CSSProperties = {
  padding: 'var(--spacing-2)', // CONST-OK
  background: 'var(--color-bg-deep)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-primary)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-base)',
};

const buttonRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--spacing-2)', // CONST-OK
  justifyContent: 'flex-end',
};

const skipButtonStyle: React.CSSProperties = {
  padding: 'var(--spacing-2) var(--spacing-3)', // CONST-OK
  background: 'transparent',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  touchAction: 'manipulation',
};

function authorButtonStyle(active: boolean): React.CSSProperties {
  return {
    padding: 'var(--spacing-2) var(--spacing-3)', // CONST-OK
    background: active ? 'var(--color-primary)' : 'transparent',
    border: '1px solid var(--color-primary)',
    borderRadius: 'var(--radius-md)',
    color: active ? 'var(--color-bg-deep)' : 'var(--color-text-secondary)',
    cursor: active ? 'pointer' : 'not-allowed',
    touchAction: 'manipulation',
    fontWeight: 'var(--font-weight-semibold)',
  };
}
