// Sprint 9a Phase 9a.2 — gear icon opening the SettingsModal.
// Top-right HUD slot (mobile-game convention — Cookie Clicker / AdCap / NGU
// all anchor settings top-right). Re-positioned 2026-04-27 from bottom-left
// after Mi A3 playtest feedback. Below the rate counter so the two top-right
// elements stack vertically. Re-enables pointer events locally (HUD wrapper
// is `pointer-events: none`).

import { memo, useCallback } from 'react';
import { en } from '../../config/strings/en';

const t = en.settings;

export interface SettingsButtonProps {
  onOpen: () => void;
}

export const SettingsButton = memo(function SettingsButton({ onOpen }: SettingsButtonProps) {
  const onClick = useCallback(() => onOpen(), [onOpen]);
  return (
    <button
      type="button"
      data-testid="hud-settings-button"
      aria-label={t.openButtonAria}
      onPointerDown={onClick}
      style={{
        position: 'absolute',
        // Top-right slot — below the right-column stack (RateCounter +
        // ConnectionChip + MoodIndicator). MoodIndicator sits at
        // top: spacing-16 + spacing-6 (≈ 88px); we position the gear below
        // that with a spacing-6 gap. Mi A3 playtest 2026-04-27: this gives
        // each right-column element its own row, no overlap.
        top: 'calc(var(--spacing-16) + var(--spacing-6) + var(--text-sm) + var(--spacing-6))', // CONST-OK layout
        right: 'var(--spacing-3)', // CONST-OK CSS spacing token (slightly tucked)
        width: '44px', // CONST-OK CSS touch-target min (HUD.touchTargetMin idiom)
        height: '44px', // CONST-OK CSS touch-target min
        background: 'transparent',
        border: '1px solid var(--color-border-subtle, #1f2937)', // CONST-OK CSS fallback
        borderRadius: 'var(--radius-md)',
        color: 'var(--color-text-secondary)',
        cursor: 'pointer',
        pointerEvents: 'auto',
        touchAction: 'manipulation',
        fontSize: '20px', // CONST-OK CSS gear-glyph size
        lineHeight: 1, // CONST-OK CSS gear-glyph centering
        opacity: 0.7, // CONST-OK CSS HUD subdued utility
      }}
    >
      <span aria-hidden="true">⚙</span>
    </button>
  );
});
