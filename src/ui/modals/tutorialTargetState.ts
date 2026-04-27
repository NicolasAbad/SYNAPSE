// Pre-launch audit Dim M Phase 2 (M-7) — tutorial-target glow signal.
//
// TutorialHints knows which hint is active. The buttons the hint refers to
// live in unrelated components (NeuronsPanel, DischargeButton, TabBar, etc.).
// Rather than threading prop drills through 5 layers of components, this
// module exposes a thin module-scope signal:
//
//   - TutorialHints calls setActiveTutorialTarget(id) when its hint changes.
//   - Target components read isCurrentTutorialTarget(id) via useSyncExternalStore.
//   - When active, the consumer applies the .synapse-tutorial-callout CSS
//     class to its root element (subtle pulsing primary-violet ring).
//
// Reduced-motion: the CSS animation has no special handling here — the
// .a11y-no-motion override in styles/accessibility.css forces 0s on every
// animation site, including this one. The glow stays visible (just static).
//
// Test-only `_resetTutorialTarget` parallels the cascadeFlashEvents pattern
// for between-test cleanup.

import { useSyncExternalStore } from 'react';

let currentTarget: string | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  for (const fn of listeners) fn();
}

export function setActiveTutorialTarget(id: string | null): void {
  if (currentTarget === id) return;
  currentTarget = id;
  notify();
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

function getSnapshot(): string | null {
  return currentTarget;
}

/**
 * React hook — returns true if `id` matches the currently-active tutorial
 * target. Re-renders the consumer when the active target changes.
 */
export function useIsTutorialTarget(id: string): boolean {
  const active = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return active === id;
}

/** Test-only — clear active target + drain listeners between assertions. */
export function _resetTutorialTarget(): void {
  currentTarget = null;
  listeners.clear();
}
