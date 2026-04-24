// Sprint 8b Phase 8b.6 — Transcendence confirm dialog (Sprint 3.6 audit + GDD §20).
//
// Wraps ConfirmModal with a 2-second anti-misclick cooldown on the Transcend
// button. Once-per-Run commitment — Cancel default-focused, confirm requires a
// deliberate ~2s wait before becoming clickable.

import { memo, useEffect, useState } from 'react';
import { SYNAPSE_CONSTANTS } from '../../config/constants';
import { en } from '../../config/strings/en';
import { ConfirmModal } from './ConfirmModal';

const t = en.transcendence_confirm;

export interface TranscendenceConfirmModalProps {
  open: boolean;
  /** Display "Run {N+1} begins" — caller passes the upcoming Run number. */
  nextRunNumber: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const TranscendenceConfirmModal = memo(function TranscendenceConfirmModal({
  open,
  nextRunNumber,
  onConfirm,
  onCancel,
}: TranscendenceConfirmModalProps) {
  const [cooldownExpired, setCooldownExpired] = useState(false);

  useEffect(() => {
    if (!open) {
      setCooldownExpired(false);
      return;
    }
    const handle = setTimeout(() => setCooldownExpired(true), SYNAPSE_CONSTANTS.transcendenceConfirmCooldownMs);
    return () => clearTimeout(handle);
  }, [open]);

  return (
    <ConfirmModal
      open={open}
      title={t.title}
      body={t.body.replace('{N}', String(nextRunNumber))}
      confirmLabel={t.confirm}
      cancelLabel={t.cancel}
      confirmDisabled={!cooldownExpired}
      onConfirm={onConfirm}
      onCancel={onCancel}
      testIdPrefix="transcendence-confirm"
    />
  );
});
