// INIT-1 React boundary (docs/GDD.md §35 INIT-1) + Sprint 7.10 Phase 7.10.4
// app-resume orchestration.
//
// This is one of the few legal sites to call Date.now() — the engine
// (src/engine/*) and store core (createDefaultState) stay pure. Fires once
// per mount via useEffect(..., []).
//
// Mount sequence (order matters):
//   1. initSessionTimestamps — fill sentinel timestamps with now
//   2. applyOfflineReturn — compute offline delta from lastActiveTimestamp → now
//      (no-op on a fresh save since step 1 pinned lastActiveTimestamp to now)
//   3. Attach resume listener — Capacitor App plugin (native) + visibilitychange
//      (web) both re-trigger applyOfflineReturn on foreground
//
// Save-restore safety: initSessionTimestamps is idempotent. applyOfflineReturn
// is idempotent via OFFLINE-5 clamp + offlineMinMinutes skip branch — calling
// it redundantly on a recent resume is a no-op.

import { useEffect } from 'react';
import { App, type AppState } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useGameStore } from './gameStore';

export function useInitSession(): void {
  useEffect(() => {
    const store = useGameStore.getState();
    store.initSessionTimestamps(Date.now());
    store.applyOfflineReturn(Date.now());

    const listeners: Array<() => void> = [];

    if (Capacitor.isNativePlatform()) {
      // Native (iOS / Android): Capacitor App plugin fires appStateChange on foreground/background.
      const handlePromise = App.addListener('appStateChange', (state: AppState) => {
        if (state.isActive) useGameStore.getState().applyOfflineReturn(Date.now());
      });
      listeners.push(() => {
        handlePromise.then((h) => h.remove()).catch(() => {});
      });
    }

    // Web fallback + belt-and-braces for native (some Capacitor setups still surface visibilitychange).
    const onVisibility = (): void => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        useGameStore.getState().applyOfflineReturn(Date.now());
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibility);
      listeners.push(() => document.removeEventListener('visibilitychange', onVisibility));
    }

    return () => listeners.forEach((off) => off());
  }, []);
}
