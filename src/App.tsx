import { useEffect, useMemo, useState } from 'react';
import { App as CapApp, type AppState } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useGameStore } from './store/gameStore';
import { useSaveScheduler } from './store/saveScheduler';
import { useTickScheduler } from './store/tickScheduler';
import { NeuronCanvas } from './ui/canvas/NeuronCanvas';
import { HUD } from './ui/hud/HUD';
import { SplashScreen } from './ui/modals/SplashScreen';
import { GdprModal, isEU } from './ui/modals/GdprModal';
import { TutorialHints } from './ui/modals/TutorialHints';
import { FragmentOverlay } from './ui/modals/FragmentOverlay';
import { Era3EventModal } from './ui/modals/Era3EventModal';
import { SleepScreen } from './ui/modals/SleepScreen';
import { SettingsModal } from './ui/modals/SettingsModal';
import { CosmeticsStoreModal } from './ui/modals/CosmeticsStoreModal';
import { EchoLayer } from './ui/canvas/EchoLayer';
import { SaveSyncIndicator } from './ui/hud/SaveSyncIndicator';
import { createRevenueCatAdapter, type RevenueCatAdapter } from './platform/revenuecat';
import { createAdMobAdapter, type AdMobAdapter } from './platform/admob';
import { AdProvider } from './platform/AdContext';
import { initFirebase } from './platform/firebase';

export function App() {
  // Sprint 9a Phase 9a.2 — RevenueCat adapter is created once on native; null on
  // web/test (SettingsModal disables Restore button when adapter is undefined).
  // The adapter import lives outside the effect so the test environment never
  // tries to dynamic-import @revenuecat/purchases-capacitor.
  const revenueCatAdapter = useMemo<RevenueCatAdapter | null>(() => {
    return Capacitor.isNativePlatform() ? createRevenueCatAdapter() : null;
  }, []);

  // Sprint 9a Phase 9a.4 — AdMob adapter mirrors the RevenueCat pattern. Both
  // are null on web/test so the Ad placement components render their inert
  // (button-hidden) variants.
  const adMobAdapter = useMemo<AdMobAdapter | null>(() => {
    return Capacitor.isNativePlatform() ? createAdMobAdapter() : null;
  }, []);

  // Sprint 9b Phase 9b.6 — Firebase Analytics init. Safe to call at mount on
  // both native and web: the adapter goes inert if env vars are missing + never
  // throws. Respects analyticsConsent inside logEvent (GDPR).
  useEffect(() => { initFirebase(); }, []);

  // Sequential mount: load saved state first, then init timestamps ONLY if no
  // save was present, then applyOfflineReturn. Ordering prevents the Phase 7
  // Finding B race AND ensures applyOfflineReturn sees the saved
  // lastActiveTimestamp (Sprint 7.10 Phase 7.10.4). After load, attach
  // resume listeners (Capacitor App + visibilitychange). Sprint 9a Phase 9a.2
  // adds RevenueCat init + initial customerInfo → setSubscriptionStatus.
  useEffect(() => {
    const cleanups: Array<() => void> = [];
    const initialize = async () => {
      const loaded = await useGameStore.getState().loadFromSave();
      if (!loaded) {
        useGameStore.getState().initSessionTimestamps(Date.now());
      }
      useGameStore.getState().applyOfflineReturn(Date.now());
      if (Capacitor.isNativePlatform()) {
        const handlePromise = CapApp.addListener('appStateChange', (s: AppState) => {
          if (s.isActive) useGameStore.getState().applyOfflineReturn(Date.now());
        });
        cleanups.push(() => {
          handlePromise.then((h) => h.remove()).catch(() => {});
        });
      }
      const onVisibility = (): void => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          useGameStore.getState().applyOfflineReturn(Date.now());
        }
      };
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', onVisibility);
        cleanups.push(() => document.removeEventListener('visibilitychange', onVisibility));
      }
      if (revenueCatAdapter !== null) {
        try {
          await revenueCatAdapter.initialize();
          const info = await revenueCatAdapter.getCustomerInfo();
          useGameStore.getState().setSubscriptionStatus(info.activeEntitlements.includes('genius_pass'));
        } catch (e) {
          // CODE-8: never throw out of mount; log + continue. RevenueCat init
          // failure leaves isSubscribed at its persisted/default value.
          console.error('[RevenueCat] init failed:', e);
        }
      }
      if (adMobAdapter !== null) {
        try {
          await adMobAdapter.initialize();
        } catch (e) {
          // CODE-8: AdMob init failure → ad placements remain unavailable
          // (tryShowAd will return 'failed') but the game continues.
          console.error('[AdMob] init failed:', e);
        }
      }
    };
    void initialize();
    return () => cleanups.forEach((off) => off());
  }, [revenueCatAdapter, adMobAdapter]);

  useTickScheduler(); // game tick runtime
  useSaveScheduler();

  // Sprint 2 Phase 6 — UI-9 first-open sequence. Splash shows on every cold
  // open per [D2]; GDPR modal follows only if isEU (false in Sprint 2 per [D1]).
  // Canvas + HUD render underneath so the GDPR modal overlays a live game.
  const [splashDone, setSplashDone] = useState(false);
  const [gdprDone, setGdprDone] = useState(false);
  // Sprint 9a Phase 9a.2 — Settings modal open state lives here so HUD's
  // SettingsButton (sibling) can toggle it without a new store field.
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cosmeticsOpen, setCosmeticsOpen] = useState(false);

  return (
    <AdProvider adapter={adMobAdapter}>
      <main
        style={{
          margin: 0,
          padding: 0,
          height: '100%', // CONST-OK: CSS full-height idiom (CODE-1 exception)
          position: 'relative',
          background: 'var(--color-bg-deep, #05070d)', // CONST-OK: CSS fallback (CODE-1 exception)
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-body)',
          overflow: 'hidden',
        }}
      >
        <NeuronCanvas />
        <HUD onOpenSettings={() => setSettingsOpen(true)} />
        <SaveSyncIndicator />
        <TutorialHints />
        <EchoLayer />
        <FragmentOverlay />
        <Era3EventModal />
        <SleepScreen />
        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          restorePurchases={revenueCatAdapter?.restorePurchases}
          onOpenCosmetics={() => { setSettingsOpen(false); setCosmeticsOpen(true); }}
        />
        <CosmeticsStoreModal
          open={cosmeticsOpen}
          onClose={() => setCosmeticsOpen(false)}
        />
        {!splashDone && <SplashScreen onComplete={() => setSplashDone(true)} />}
        {splashDone && isEU && !gdprDone && <GdprModal onComplete={() => setGdprDone(true)} />}
      </main>
    </AdProvider>
  );
}
