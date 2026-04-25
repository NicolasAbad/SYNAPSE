// Sprint 10 Phase 10.5 — accessibility runtime hook.
//
// Single hook called from <App /> that mirrors the audio + push runtime pattern:
//   - highContrast: toggles `data-high-contrast="true"` on documentElement.
//     Paired with the inline style block in App.tsx that overrides --color-*
//     tokens when the attribute is present.
//   - fontSize: sets `font-size` on documentElement. All --text-* tokens
//     are rem-based (root-relative) so this proportionally scales the UI.
//   - colorblindMode + reducedMotion: NOT applied via root attributes —
//     consumers read those flags directly from the store (PolaritySlot for
//     colorblindMode, FocusBar/ConsciousnessBar/canvas for reducedMotion).
//
// Idempotent on remount (StrictMode + HMR safe).

import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import type { FontSize } from '../types';

function fontSizeToRoot(size: FontSize): string {
  if (size === 'small') return '0.85em'; // CONST-OK CSS scale per Sprint 10 SPRINTS.md spec
  if (size === 'large') return '1.15em'; // CONST-OK CSS scale per Sprint 10 SPRINTS.md spec
  return '1em'; // CONST-OK CSS identity scale
}

export function useAccessibilityRuntime(): void {
  const highContrast = useGameStore((s) => s.highContrast);
  const fontSize = useGameStore((s) => s.fontSize);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (highContrast) document.documentElement.setAttribute('data-high-contrast', 'true');
    else document.documentElement.removeAttribute('data-high-contrast');
  }, [highContrast]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.style.fontSize = fontSizeToRoot(fontSize);
  }, [fontSize]);
}
