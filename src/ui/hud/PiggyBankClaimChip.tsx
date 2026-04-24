// Sprint 9b Phase 9b.5 — Piggy Bank claim chip (replaces Sprint 9a.4 PiggyBankAdChip).
// Per V-4 approved: ad path dropped, chip opens PiggyBankClaimModal directly.
// Visible only when `piggyBankSparks === piggyBankMaxSparks` AND not broken.

import { memo, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../config/constants';
import { en } from '../../config/strings/en';

const t = en.piggyBank;

const chipStyle = { // CONST-OK CSS style object
  position: 'absolute' as const,
  bottom: 'calc(var(--spacing-16) + var(--spacing-4) + var(--spacing-12))', // CONST-OK CSS clearance above SettingsButton
  left: 'var(--spacing-5)', // CONST-OK CSS spacing token
  background: 'var(--color-bg-elevated, #161b27)', // CONST-OK CSS fallback
  border: '1px solid var(--color-warning, #ffb454)', // CONST-OK CSS fallback
  borderRadius: 'var(--radius-md)',
  padding: 'var(--spacing-2) var(--spacing-3)', // CONST-OK CSS spacing tokens
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
  pointerEvents: 'auto' as const,
  touchAction: 'manipulation' as const,
  zIndex: 930, // CONST-OK CSS HUD layer band
};

export interface PiggyBankClaimChipProps {
  onOpen: () => void;
}

export const PiggyBankClaimChip = memo(function PiggyBankClaimChip({ onOpen }: PiggyBankClaimChipProps) {
  const piggyBankSparks = useGameStore((s) => s.piggyBankSparks);
  const piggyBankBroken = useGameStore((s) => s.piggyBankBroken);

  const onClick = useCallback(() => onOpen(), [onOpen]);

  if (piggyBankBroken) return null;
  if (piggyBankSparks < SYNAPSE_CONSTANTS.piggyBankMaxSparks) return null;

  return (
    <button type="button" data-testid="piggy-claim-chip" style={chipStyle} onPointerDown={onClick}>
      {t.chipFull}
    </button>
  );
});
