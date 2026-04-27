// Pre-launch audit Day 2 — Cascade flash pub/sub (every Cascade) +
// pre-launch audit Day 3 (Tier 1 enhancement #2) — first-Cascade-this-session
// overlay pub/sub (one-time-per-session full-screen "CASCADE!" splash).
//
// When a Cascade Discharge fires (focusBar >= cascadeThreshold at trigger):
//   - publishCascadeFlash() fires every time → FocusBar renders white overlay
//   - publishFirstCascadeOverlay() fires once per session → HUD overlay
//
// Lifetime persistence (true "first cascade ever") would need a GameState
// field bump + migration. Per-session is a reasonable approximation: most
// new players complete their first Cascade within the same session.
//
// Reduced-motion: subscribers SHOULD skip visual effects (audio + haptic from
// the discharge action still fire — they're not motion-sensitive).

type FlashListener = () => void;

const flashListeners = new Set<FlashListener>();
const firstOverlayListeners = new Set<FlashListener>();
let firstCascadeShownThisSession = false;

export function publishCascadeFlash(): void {
  for (const fn of flashListeners) fn();
}

export function subscribeCascadeFlash(fn: FlashListener): () => void {
  flashListeners.add(fn);
  return () => { flashListeners.delete(fn); };
}

export function publishFirstCascadeOverlay(): void {
  if (firstCascadeShownThisSession) return;
  firstCascadeShownThisSession = true;
  for (const fn of firstOverlayListeners) fn();
}

export function subscribeFirstCascadeOverlay(fn: FlashListener): () => void {
  firstOverlayListeners.add(fn);
  return () => { firstOverlayListeners.delete(fn); };
}

/** Test-only — drain all subscribers + clear session gate between assertions. */
export function _resetCascadeFlashListeners(): void {
  flashListeners.clear();
  firstOverlayListeners.clear();
  firstCascadeShownThisSession = false;
}
