// Sprint 9a Phase 9a.4 — piggy refill ad placeholder (placement #5 piggy_refill).
// Renders a small chip when the Piggy Bank is at cap (MONEY-10 §26). Tap shows
// a rewarded ad. Reward payout is a STUB for Sprint 9a.4 — full claim modal +
// 2× refill mechanics ship in Sprint 9b. This component proves the placement
// is wired through canShowAd + recordAdWatched + MONEY-7 fallback.

import { memo, useCallback, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useAdContext } from '../../platform/AdContext';
import { SYNAPSE_CONSTANTS } from '../../config/constants';
import { en } from '../../config/strings/en';

const tAds = en.ads;

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

const noteStyle = { // CONST-OK CSS style object
  position: 'absolute' as const,
  bottom: 'calc(var(--spacing-16) + var(--spacing-4) + var(--spacing-12) + var(--spacing-8))', // CONST-OK CSS stack offset
  left: 'var(--spacing-5)', // CONST-OK CSS spacing token
  background: 'var(--color-bg-elevated, #161b27)', // CONST-OK CSS fallback
  border: '1px solid var(--color-border-subtle, #1f2937)', // CONST-OK CSS fallback
  borderRadius: 'var(--radius-sm)',
  padding: 'var(--spacing-2) var(--spacing-3)', // CONST-OK CSS spacing tokens
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-secondary)',
  zIndex: 930, // CONST-OK CSS HUD layer band
  pointerEvents: 'none' as const,
};

export const PiggyBankAdChip = memo(function PiggyBankAdChip() {
  const piggyBankSparks = useGameStore((s) => s.piggyBankSparks);
  const ad = useAdContext();
  const [note, setNote] = useState<string>('');

  const onClick = useCallback(async () => {
    setNote('');
    const result = await ad.tryShowAd('piggy_refill');
    if (result.status === 'shown' || result.status === 'dismissed') {
      // Sprint 9b: replace placeholder with claim modal + 2× refill mechanics.
      setNote(tAds.placeholderToast);
    } else if (result.status === 'failed') {
      setNote(tAds.failedToast);
    }
  }, [ad]);

  if (piggyBankSparks < SYNAPSE_CONSTANTS.piggyBankMaxSparks) return null;
  if (ad.inert) return null;

  return (
    <>
      <button type="button" data-testid="piggy-ad-chip" style={chipStyle} onPointerDown={onClick}>
        {tAds.piggyChipFull}
      </button>
      {note !== '' && (
        <span data-testid="piggy-ad-note" style={noteStyle}>{note}</span>
      )}
    </>
  );
});
