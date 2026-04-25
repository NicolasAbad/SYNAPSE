// Sprint 10 Phase 10.7 — Android back button + deep-link routing.
//
// Two Capacitor App listeners mounted from <App />:
//
// 1. backButton (Android only — iOS has no hardware back). Per Sprint 10 spec
//    and CODE-5: closes modals/tabs in priority order, otherwise minimizes
//    the app at home (does NOT navigate back further or kill the process).
//
// 2. appUrlOpen — handles synapse://diary, synapse://mind,
//    synapse://cosmetics deep-link URIs by switching the active tab/subtab
//    or opening the relevant modal. Unknown URIs are silently ignored.
//
// Both are inert no-ops on web/test (Capacitor.isNativePlatform() === false).

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { useGameStore } from '../store/gameStore';

export interface NativeNavigationCallbacks {
  /** True if any modal is currently open; back button closes it instead of navigating. */
  hasOpenModal: () => boolean;
  /** Called when back button should close a modal (returns to base UI). */
  closeTopModal: () => void;
  /** Called when a deep link requests opening the cosmetics modal. */
  openCosmetics: () => void;
}

export function useNativeNavigation(callbacks: NativeNavigationCallbacks): void {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const removers: Array<() => void> = [];

    // Back button: priority is open-modal → non-mind tab → minimize.
    const backHandle = CapApp.addListener('backButton', () => {
      if (callbacks.hasOpenModal()) {
        callbacks.closeTopModal();
        return;
      }
      const state = useGameStore.getState();
      if (state.activeTab !== 'mind') {
        useGameStore.getState().setActiveTab('mind');
        return;
      }
      // At home — minimize per CODE-5 (do NOT exit the app).
      void CapApp.minimizeApp();
    });
    removers.push(() => { backHandle.then((h) => h.remove()).catch(() => {}); });

    // Deep links: synapse://diary, synapse://mind, synapse://cosmetics.
    const urlHandle = CapApp.addListener('appUrlOpen', (event: { url: string }) => {
      const url = event.url ?? '';
      if (!url.startsWith('synapse://')) return;
      const target = url.slice('synapse://'.length).split(/[/?#]/)[0]; // CONST-OK URI prefix
      if (target === 'mind') {
        useGameStore.getState().setActiveTab('mind');
      } else if (target === 'diary') {
        useGameStore.getState().setActiveTab('mind');
        useGameStore.getState().setActiveMindSubtab('diary');
      } else if (target === 'cosmetics') {
        callbacks.openCosmetics();
      }
    });
    removers.push(() => { urlHandle.then((h) => h.remove()).catch(() => {}); });

    return () => removers.forEach((off) => off());
  }, [callbacks]);
}
