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

/**
 * Best-effort save. Silently skips if a prior save hasn't finished —
 * a 5KB JSON write every 30s is trivial; queueing would add failure
 * surface with no user-visible benefit.
 *
 * Strips UI-local state (activeTab) before persistence; see saveToStorage
 * action in gameStore.ts for rationale.
 */
export async function trySave(): Promise<void> {
  if (saveInFlight) return;
  saveInFlight = true;
  try {
    const { activeTab: _omit, ...rest } = useGameStore.getState();
    void _omit;
    await saveGame(rest as GameState);
  } catch (e) {
    console.error('[saveScheduler] save failed:', e);
  } finally {
    saveInFlight = false;
  }
}

/** Test-only hook to reset the in-flight flag between tests. */
export function __resetSaveInFlightForTests(): void {
  saveInFlight = false;
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
