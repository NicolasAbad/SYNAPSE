// Sprint 6 Phase 6.5 — Era 3 event modal (GDD §23 ERA3-2).
// Fullscreen modal shown at cycle start when prestigeCount is 19-26 AND the
// corresponding `era3_pXX` id is absent from narrativeFragmentsSeen.
// Dismissal calls readFragment(id) → appends to seen list → modal closes.

import { memo, useCallback } from 'react';
import { t } from '../../config/strings';
import { HUD } from '../tokens';
import { useGameStore } from '../../store/gameStore';
import { getCurrentEra3Event, hasUnseenEra3Event } from '../../engine/era3';

export const Era3EventModal = memo(function Era3EventModal() {
  const prestigeCount = useGameStore((s) => s.prestigeCount);
  const seen = useGameStore((s) => s.narrativeFragmentsSeen);
  const readFragment = useGameStore((s) => s.readFragment);

  const shouldShow = hasUnseenEra3Event({ prestigeCount, narrativeFragmentsSeen: seen });
  const def = getCurrentEra3Event({ prestigeCount });

  const onContinue = useCallback(() => {
    if (def) readFragment(def.id);
  }, [def, readFragment]);

  if (!shouldShow || !def) return null;

  return (
    <div
      data-testid="era3-event-modal"
      data-era3-id={def.id}
      role="dialog"
      aria-modal="true"
      aria-labelledby="era3-event-title"
      style={{
        position: 'absolute',
        top: 0, right: 0, bottom: 0, left: 0, // CONST-OK: CSS full-bleed
        background: 'var(--color-overlay-scrim)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--spacing-6)', // CONST-OK
        zIndex: 955, // CONST-OK: above archetype modal (945) and confirm (950)
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          maxWidth: 480, // CONST-OK: readable modal width
          width: '100%', // CONST-OK
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--spacing-6)', // CONST-OK
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-body)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-secondary)',
            letterSpacing: '0.12em', // CONST-OK
            textTransform: 'uppercase',
            marginBottom: 'var(--spacing-2)', // CONST-OK
          }}
        >
          {t('era3.modal_title')}
        </div>
        <h2
          id="era3-event-title"
          data-testid="era3-event-title"
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--font-weight-bold)',
            marginBottom: 'var(--spacing-4)', // CONST-OK
          }}
        >
          {t(def.nameKey)}
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: 'var(--text-base)',
            fontStyle: 'italic',
            color: 'var(--color-text-primary)',
            lineHeight: 1.6, // CONST-OK: prose readability
            marginBottom: 'var(--spacing-4)', // CONST-OK
          }}
        >
          {t(def.narrativeKey)}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.5, // CONST-OK: prose readability
            marginBottom: 'var(--spacing-6)', // CONST-OK
          }}
        >
          {t(def.mechanicalKey)}
        </p>
        <button
          type="button"
          data-testid="era3-event-continue"
          onPointerDown={onContinue}
          style={{
            minHeight: HUD.touchTargetMin,
            padding: 'var(--spacing-3) var(--spacing-6)', // CONST-OK
            background: 'var(--color-primary)',
            color: 'var(--color-bg-deep)',
            border: '1px solid var(--color-primary)',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-bold)',
            cursor: 'pointer',
            touchAction: 'manipulation',
          }}
        >
          {t('era3.continue')}
        </button>
      </div>
    </div>
  );
});
