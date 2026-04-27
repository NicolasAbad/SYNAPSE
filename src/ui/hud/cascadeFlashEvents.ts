// Pre-launch audit Day 2 — Cascade flash pub/sub.
//
// When a Cascade Discharge fires (focusBar >= cascadeThreshold at trigger),
// the discharge action publishes a flash event. FocusBar subscribes and
// renders a brief white overlay so the player visually registers the
// stronger burst (×2.5 multiplier under base, up to ×6.0 with stacks).
// Mirrors the tap-floater pub/sub pattern from Sprint 10 Phase 10.6.
//
// Reduced-motion: subscribers SHOULD skip the visual flash but the audio +
// haptic from the discharge action still fire (audio + haptics aren't
// motion-sensitive). The store's `reducedMotion` flag is the gate.

type FlashListener = () => void;

const listeners = new Set<FlashListener>();

export function publishCascadeFlash(): void {
  for (const fn of listeners) fn();
}

export function subscribeCascadeFlash(fn: FlashListener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/** Test-only — drain all subscribers between assertions. */
export function _resetCascadeFlashListeners(): void {
  listeners.clear();
}
