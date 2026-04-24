// Sprint 9a Phase 9a.2 — gear icon opening the SettingsModal.
// Bottom-left HUD slot, above the TabBar. Re-enables pointer events locally
// (HUD wrapper is `pointer-events: none`).

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
        bottom: 'calc(var(--spacing-16) + var(--spacing-4))', // CONST-OK CSS clearance above TabBar
        left: 'var(--spacing-5)', // CONST-OK CSS spacing token
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
