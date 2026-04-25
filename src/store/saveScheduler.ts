// Implements docs/GDD.md §Sprint 1 save scheduler + CODE-6.
// Save triggers: 30s interval + app background + beforeunload.
// Never saves during tick. Anti-race guards against concurrent writes.

import { useEffect } from 'react';
import { SYNAPSE_CONSTANTS } from '../config/constants';
import { useGameStore } from './gameStore';
import { saveGame } from './saveGame';
import type { GameState } from '../types/GameState';

// Module-scoped flag so concurrent scheduler mounts (e.g. StrictMode dev)
// share the same in-flight marker rather than racing on instance state.
let saveInFlight = false;

// Sprint 10 Phase 10.1 (V-4) — pub/sub for the SaveSyncIndicator HUD pill.
// Listeners are called synchronously when `saveInFlight` flips, so the indicator
// can react without polling. Empty when no UI is mounted (cheap inert path).
const saveStatusListeners = new Set<(inFlight: boolean) => void>();

function notifySaveStatus(inFlight: boolean): void {
  for (const listener of saveStatusListeners) listener(inFlight);
}

/** Subscribe to save in-flight transitions. Returns an unsubscribe fn. */
export function subscribeSaveStatus(listener: (inFlight: boolean) => void): () => void {
  saveStatusListeners.add(listener);
  return () => { saveStatusListeners.delete(listener); };
}

/** Read current save-in-flight status (used by the indicator on mount). */
export function isSaveInFlight(): boolean {
  return saveInFlight;
}

/**
 * Best-effort save. Silently skips if a prior save hasn't finished —
 * a 5KB JSON write every 30s is trivial; queueing would add failure
 * surface with no user-visible benefit.
 *
 * Strips UI-local state (activeTab, undoToast, antiSpamActive) before
 * persistence; see saveToStorage action in gameStore.ts for rationale.
 */
export async function trySave(): Promise<void> {
  if (saveInFlight) return;
  saveInFlight = true;
  notifySaveStatus(true);
  try {
    const { activeTab: _a, activeMindSubtab: _m, undoToast: _u, antiSpamActive: _s, achievementToast: _at, ...rest } = useGameStore.getState();
    void _a;
    void _m;
    void _u;
    void _s;
    void _at;
    await saveGame(rest as GameState);
  } catch (e) {
    console.error('[saveScheduler] save failed:', e);
  } finally {
    saveInFlight = false;
    notifySaveStatus(false);
  }
}

/** Test-only hook to reset the in-flight flag between tests. */
export function __resetSaveInFlightForTests(): void {
  saveInFlight = false;
  saveStatusListeners.clear();
}

/**
 * Test-only hook to fire a save-status transition without going through the
 * full `trySave()` Capacitor Preferences write path. Used by SaveSyncIndicator
 * component tests to assert the pub/sub bridge → React state path works.
 */
export function __notifySaveStatusForTests(inFlight: boolean): void {
  saveInFlight = inFlight;
  notifySaveStatus(inFlight);
}

export function useSaveScheduler(): void {
  useEffect(() => {
    const intervalId = setInterval(() => {
      void trySave();
    }, SYNAPSE_CONSTANTS.saveIntervalMs);

    const onVisibilityChange = () => {
      if (document.hidden) void trySave();
    };
    const onBeforeUnload = () => {
      void trySave();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, []);
}
