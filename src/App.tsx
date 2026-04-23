import { useEffect, useState } from 'react';
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
import { EchoLayer } from './ui/canvas/EchoLayer';

export function App() {
  // Sequential mount: load saved state first, then init timestamps ONLY if no
  // save was present, then applyOfflineReturn. Ordering prevents the Phase 7
  // Finding B race AND ensures applyOfflineReturn sees the saved
  // lastActiveTimestamp (Sprint 7.10 Phase 7.10.4). After load, attach
  // resume listeners (Capacitor App + visibilitychange).
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
    };
    void initialize();
    return () => cleanups.forEach((off) => off());
  }, []);

  useTickScheduler(); // game tick runtime
  useSaveScheduler();

  // Sprint 2 Phase 6 — UI-9 first-open sequence. Splash shows on every cold
  // open per [D2]; GDPR modal follows only if isEU (false in Sprint 2 per [D1]).
  // Canvas + HUD render underneath so the GDPR modal overlays a live game.
  const [splashDone, setSplashDone] = useState(false);
  const [gdprDone, setGdprDone] = useState(false);

  return (
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
      <HUD />
      <TutorialHints />
      <EchoLayer />
      <FragmentOverlay />
      <Era3EventModal />
      <SleepScreen />
      {!splashDone && <SplashScreen onComplete={() => setSplashDone(true)} />}
      {splashDone && isEU && !gdprDone && <GdprModal onComplete={() => setGdprDone(true)} />}
    </main>
  );
}
