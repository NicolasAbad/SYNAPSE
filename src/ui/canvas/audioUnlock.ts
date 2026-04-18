/**
 * iOS AudioContext unlock on first user gesture (Sprint 2 Phase 3).
 *
 * iOS Safari + some Android browsers suspend AudioContext until a user
 * gesture unblocks it. Per CODE-5 "AudioContext unlock on first tap":
 * call unlockAudioOnFirstTap() from the tap handler before any sound
 * would play. No audio plays in Sprint 2 — this is plumbing for the
 * Howler.js integration landing in Sprint 3 SFX + Sprint 6 ambient.
 *
 * Singleton AudioContext — first getAudioContext() call creates it,
 * subsequent calls return the same instance. Idempotent unlock.
 */

type AnyWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

let instance: AudioContext | null = null;
let unlockPromise: Promise<void> | null = null;

function getCtor(): typeof AudioContext | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as AnyWindow;
  return window.AudioContext ?? w.webkitAudioContext;
}

export function getAudioContext(): AudioContext {
  if (instance) return instance;
  const Ctor = getCtor();
  if (!Ctor) throw new Error('getAudioContext: no AudioContext constructor available');
  instance = new Ctor();
  return instance;
}

export async function unlockAudioOnFirstTap(): Promise<void> {
  if (unlockPromise) return unlockPromise;
  const Ctor = getCtor();
  if (!Ctor) return Promise.resolve(); // no-op when AudioContext unavailable (SSR/tests)
  const ctx = getAudioContext();
  if (ctx.state !== 'suspended') return Promise.resolve();
  unlockPromise = ctx.resume().catch(() => {
    // Some browsers throw when resume() is called without a user gesture
    // or when the context is already closed. Swallow — UI-8 silent fail.
    unlockPromise = null;
  });
  return unlockPromise;
}

/** Test-only — reset the singleton between tests. */
export function __resetAudioContextForTests(): void {
  instance = null;
  unlockPromise = null;
}
