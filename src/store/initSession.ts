// INIT-1 React boundary (docs/GDD.md §35 INIT-1).
//
// This is one of the few legal sites to call Date.now() in the app —
// the engine (src/engine/*) and store core (createDefaultState) must
// stay pure. Runs once per mount via useEffect(..., []).
//
// Save-restore safety: initSessionTimestamps is idempotent — it only
// writes to fields still at their pure-default sentinel (0 / null).
// If a load path has already populated a cycleStartTimestamp from a
// saved game, this hook will NOT overwrite it.

import { useEffect } from 'react';
import { useGameStore } from './gameStore';

export function useInitSession(): void {
  useEffect(() => {
    useGameStore.getState().initSessionTimestamps(Date.now());
  }, []);
}
