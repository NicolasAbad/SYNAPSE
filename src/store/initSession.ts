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
//
// Sprint 7.10 Phase 7.10.4 note: app-resume + applyOfflineReturn
// orchestration lives in App.tsx (sequenced after async loadFromSave to
// avoid the Phase-7 Finding B race). This hook stays minimal.

import { useEffect } from 'react';
import { useGameStore } from './gameStore';

export function useInitSession(): void {
  useEffect(() => {
    useGameStore.getState().initSessionTimestamps(Date.now());
  }, []);
}
