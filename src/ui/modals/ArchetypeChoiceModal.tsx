// Sprint 6 Phase 6.2 — Archetype choice modal (GDD §12).
//
// Shown at P5+ when state.archetype === null. Identity-defining choice —
// permanent for the entire Run until Transcendence clears it. Renders 3
// cards (Analytical / Empathic / Creative) + a "Confirm choice" button
// that opens the shared ConfirmModal for the irreversibility warning
// (Sprint 3.6 audit addition: reuse ConfirmModal from Sprint 4a).
//
// Parent (AwakeningFlow) controls `open` and receives the chosen archetype
// via `onChoose`. On double-confirm the parent dispatches `setArchetype(a)`
// then typically opens CycleSetupScreen for polarity/mutation/pathway.

import { memo, useCallback, useState } from 'react';
import { t } from '../../config/strings';
import { HUD } from '../tokens';
import { ARCHETYPES } from '../../config/archetypes';
import { ConfirmModal } from './ConfirmModal';
import type { Archetype } from '../../types';

export interface ArchetypeChoiceModalProps {
  open: boolean;
  onChoose: (archetype: Archetype) => void;
}

export const ArchetypeChoiceModal = memo(function ArchetypeChoiceModal({ open, onChoose }: ArchetypeChoiceModalProps) {
  const [selected, setSelected] = useState<Archetype | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const onSelect = useCallback((a: Archetype) => setSelected(a), []);
  const onConfirmClick = useCallback(() => {
    if (selected) setConfirmOpen(true);
  }, [selected]);
  const onConfirmCancel = useCallback(() => setConfirmOpen(false), []);
  const onConfirmYes = useCallback(() => {
    if (selected) {
      onChoose(selected);
      setConfirmOpen(false);
      setSelected(null);
    }
  }, [selected, onChoose]);

  if (!open) return null;

  const selectedDef = selected ? ARCHETYPES.find((a) => a.id === selected) ?? null : null;
  const warningBody = (selectedDef ? t(selectedDef.nameKey) + ' — ' : '') + t('archetype_choice.confirm_warning');

  return (
    <>
      <div
        data-testid="archetype-choice-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="archetype-choice-title"
        style={{
          position: 'absolute',
          top: 0, right: 0, bottom: 0, left: 0, // CONST-OK: CSS full-bleed
          background: 'var(--color-overlay-scrim)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--spacing-6)', // CONST-OK
          zIndex: 945, // CONST-OK: above CycleSetupScreen (940), below ConfirmModal (950)
          pointerEvents: 'auto',
          overflow: 'auto',
        }}
      >
        <div
          style={{
            maxWidth: 480, // CONST-OK: CSS readable card width
            width: '100%', // CONST-OK
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border-medium)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--spacing-6)', // CONST-OK
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-body)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-4)', // CONST-OK
          }}
        >
          <h2
            id="archetype-choice-title"
            data-testid="archetype-choice-title"
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-xl)',
              fontWeight: 'var(--font-weight-bold)',
              textAlign: 'center',
            }}
          >
            {t('archetype_choice.title')}
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-secondary)',
              textAlign: 'center',
              lineHeight: 1.5, // CONST-OK: CSS readability idiom
            }}
          >
            {t('archetype_choice.subtitle')}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' /* CONST-OK */ }}>
            {ARCHETYPES.map((a) => (
              <ArchetypeCard key={a.id} id={a.id} selected={selected === a.id} onSelect={onSelect} />
            ))}
          </div>
          <button
            type="button"
            data-testid="archetype-choice-confirm-button"
            disabled={selected === null}
            onPointerDown={onConfirmClick}
            style={{
              minHeight: HUD.touchTargetMin,
              padding: 'var(--spacing-3) var(--spacing-6)', // CONST-OK
              background: selected ? 'var(--color-primary)' : 'var(--color-bg-deep)',
              color: selected ? 'var(--color-bg-deep)' : 'var(--color-text-secondary)',
              border: '1px solid ' + (selected ? 'var(--color-primary)' : 'var(--color-border-medium)'),
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-bold)',
              cursor: selected ? 'pointer' : 'not-allowed',
              touchAction: 'manipulation',
              opacity: selected ? 1 : 0.5, // CONST-OK
            }}
          >
            {t('archetype_choice.confirm')}
          </button>
        </div>
      </div>
      <ConfirmModal
        open={confirmOpen}
        title={t('archetype_choice.title')}
        body={warningBody}
        confirmLabel={t('archetype_choice.confirm')}
        cancelLabel={t('archetype_choice.cancel')}
        onConfirm={onConfirmYes}
        onCancel={onConfirmCancel}
        testIdPrefix="archetype-confirm"
      />
    </>
  );
});

function ArchetypeCard({ id, selected, onSelect }: { id: Archetype; selected: boolean; onSelect: (a: Archetype) => void }) {
  return (
    <button
      type="button"
      data-testid={`archetype-choice-${id}`}
      data-selected={selected}
      onPointerDown={() => onSelect(id)}
      style={{
        minHeight: HUD.touchTargetMin,
        padding: 'var(--spacing-3) var(--spacing-4)', // CONST-OK
        background: selected ? 'var(--color-primary)' : 'var(--color-bg-deep)',
        border: selected ? '1px solid var(--color-primary)' : '1px solid var(--color-border-medium)',
        borderRadius: 'var(--radius-md)',
        color: selected ? 'var(--color-bg-deep)' : 'var(--color-text-primary)',
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
        cursor: 'pointer',
        touchAction: 'manipulation',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-1)', // CONST-OK
      }}
    >
      <span style={{ fontWeight: 'var(--font-weight-bold)' }}>{t(`archetypes.${id}.name`)}</span>
      <span style={{ fontSize: 'var(--text-xs)', opacity: 0.85 /* CONST-OK */ }}>
        {t(`archetypes.${id}.description`)}
      </span>
    </button>
  );
}
