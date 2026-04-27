import { useEffect, useMemo, useState } from 'react';
import { App as CapApp, type AppState } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useGameStore } from './store/gameStore';
import { useSaveScheduler } from './store/saveScheduler';
import { useTickScheduler } from './store/tickScheduler';
import { NeuronCanvas } from './ui/canvas/NeuronCanvas';
import { HUD } from './ui/hud/HUD';
import { SplashScreen } from './ui/modals/SplashScreen';
import { GdprModal } from './ui/modals/GdprModal';
import { isEU } from './ui/modals/gdprIsEU';
import { TutorialHints } from './ui/modals/TutorialHints';
import { FragmentOverlay } from './ui/modals/FragmentOverlay';
import { Era3EventModal } from './ui/modals/Era3EventModal';
import { SleepScreen } from './ui/modals/SleepScreen';
import { SettingsModal } from './ui/modals/SettingsModal';
import { CosmeticsStoreModal } from './ui/modals/CosmeticsStoreModal';
import { EchoLayer } from './ui/canvas/EchoLayer';
import { TapFloaterLayer } from './ui/canvas/TapFloaterLayer';
import { SaveSyncIndicator } from './ui/hud/SaveSyncIndicator';
import { DailyLoginModal } from './ui/modals/DailyLoginModal';
import { createRevenueCatAdapter, type RevenueCatAdapter } from './platform/revenuecat';
import { createAdMobAdapter, type AdMobAdapter } from './platform/admob';
import { AdProvider } from './platform/AdContext';
import { initFirebase } from './platform/firebase';
import { useAudioRuntime } from './platform/useAudioRuntime';
import { usePushRuntime } from './platform/usePushRuntime';
import { useAccessibilityRuntime } from './platform/useAccessibilityRuntime';
import { useNativeNavigation } from './platform/useNativeNavigation';
import { getCrashlytics } from './platform/crashlytics';
import { initRemoteConfig } from './platform/remoteConfig';
import { evaluateDailyLogin, toLocalDateString, type DailyLoginOutcome } from './engine/dailyLogin';
import { en } from './config/strings/en';
import { InitSpinner } from './ui/InitSpinner';

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
  // Sprint 10 Phase 10.7 — Remote Config + Crashlytics gated on analyticsConsent
  // (same GDPR contract). Native-only paths; web preview no-ops.
  useEffect(() => {
    initFirebase();
    void initRemoteConfig();
    void getCrashlytics().setEnabled(useGameStore.getState().analyticsConsent);
  }, []);

  // Pre-launch audit Day 2 — overlay flag for RevenueCat cold-start (2-5s on
  // slow networks). InitSpinner suppresses display for the first ~700ms so
  // fast inits don't flash an overlay.
  const [revenueCatInitializing, setRevenueCatInitializing] = useState(false);

  // Sequential mount: load saved state first, then init timestamps ONLY if no
  // save was present, then applyOfflineReturn. Ordering prevents the Phase 7
  // Finding B race AND ensures applyOfflineReturn sees the saved
  // lastActiveTimestamp (Sprint 7.10 Phase 7.10.4). After load, attach
  // resume listeners (Capacitor App + visibilitychange). Sprint 9a Phase 9a.2
  // adds RevenueCat init + initial customerInfo → setSubscriptionStatus.
  useEffect(() => {
    const cleanups: Array<() => void> = [];
    const initialize = async () => {
      // Pre-launch audit Day 1: wrap loadFromSave in try/catch. A defensive
      // boundary so platform-level Preferences errors or migration crashes
      // surface to Crashlytics + fall back to a clean session instead of
      // throwing out of the mount effect (which would white-screen the app).
      let loaded = false;
      try {
        loaded = await useGameStore.getState().loadFromSave();
      } catch (e) {
        console.error('[App.initialize] loadFromSave threw:', e);
        void getCrashlytics().recordError('App.initialize.loadFromSave', e);
        loaded = false;
      }
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
        // Pre-launch audit Day 2 — show overlay during init (suppressed if <700ms).
        setRevenueCatInitializing(true);
        try {
          await revenueCatAdapter.initialize();
          const info = await revenueCatAdapter.getCustomerInfo();
          useGameStore.getState().setSubscriptionStatus(info.activeEntitlements.includes('genius_pass'));
        } catch (e) {
          // CODE-8: never throw out of mount; log + continue. RevenueCat init
          // failure leaves isSubscribed at its persisted/default value.
          console.error('[RevenueCat] init failed:', e);
          // Sprint 10 Phase 10.7 — non-fatal Crashlytics report.
          void getCrashlytics().recordError('RevenueCat.init', e);
          // Pre-launch audit Day 2 — surface to NetworkErrorToast.
          useGameStore.getState().setNetworkError(en.networkError.revenueCatInitFailed);
        } finally {
          setRevenueCatInitializing(false);
        }
      }
      if (adMobAdapter !== null) {
        try {
          await adMobAdapter.initialize();
        } catch (e) {
          // CODE-8: AdMob init failure → ad placements remain unavailable
          // (tryShowAd will return 'failed') but the game continues.
          console.error('[AdMob] init failed:', e);
          // Pre-launch audit Day 2 — surface to NetworkErrorToast.
          useGameStore.getState().setNetworkError(en.networkError.adMobInitFailed);
          // Sprint 10 Phase 10.7 — non-fatal Crashlytics report.
          void getCrashlytics().recordError('AdMob.init', e);
        }
      }
    };
    void initialize();
    return () => cleanups.forEach((off) => off());
  }, [revenueCatAdapter, adMobAdapter]);

  useTickScheduler(); // game tick runtime
  useSaveScheduler();
  useAudioRuntime(); // Howler init + volume sync + ambient + visibility-pause
  usePushRuntime(); // local-notifications: permission cadence + daily/cap/streak schedules
  useAccessibilityRuntime(); // highContrast root attr + fontSize root scale
  useNativeNavigation({
    hasOpenModal: () => settingsOpen || cosmeticsOpen || dailyLoginState !== null,
    closeTopModal: () => {
      if (dailyLoginState !== null) setDailyLoginState(null);
      else if (cosmeticsOpen) setCosmeticsOpen(false);
      else if (settingsOpen) setSettingsOpen(false);
    },
    openCosmetics: () => setCosmeticsOpen(true),
  });

  // Sprint 2 Phase 6 — UI-9 first-open sequence. Splash shows on every cold
  // open per [D2]; GDPR modal follows only if isEU (false in Sprint 2 per [D1]).
  // Canvas + HUD render underneath so the GDPR modal overlays a live game.
  const [splashDone, setSplashDone] = useState(false);
  const [gdprDone, setGdprDone] = useState(false);
  // Sprint 9a Phase 9a.2 — Settings modal open state lives here so HUD's
  // SettingsButton (sibling) can toggle it without a new store field.
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cosmeticsOpen, setCosmeticsOpen] = useState(false);

  // Sprint 10 Phase 10.4 — Daily Login Bonus modal state. Computed on cold mount
  // (after splash + GDPR) and on visibilitychange resume. Subscribers auto-resolve
  // streak_save before the modal renders.
  const [dailyLoginState, setDailyLoginState] = useState<{ outcome: DailyLoginOutcome; nowDate: string } | null>(null);
  useEffect(() => {
    if (!splashDone || (isEU && !gdprDone)) return;
    const checkDaily = (): void => {
      const nowDate = toLocalDateString(Date.now());
      const state = useGameStore.getState();
      // Pre-launch audit B-2: don't fire DailyLoginModal during the tutorial
      // cycle. Cold-start newcomers should hit the "Tap the neuron" hint
      // immediately — a Day-1 reward popup at this moment costs ~2-3s of
      // momentum and confuses players who don't yet know what Sparks are.
      // Daily login resumes from the next visibilitychange after the player
      // exits the tutorial (first prestige flips isTutorialCycle false).
      if (state.isTutorialCycle) return;
      const outcome = evaluateDailyLogin(state, nowDate);
      if (outcome.kind === 'no_action') return;
      // Subscriber auto-save: resolve silently before showing the reward card.
      if (outcome.kind === 'streak_save_eligible' && outcome.canAutoSave) {
        useGameStore.getState().resolveStreakSave(nowDate, 'subscriber');
        // Re-evaluate to render the reward card on the saved streak.
        const after = evaluateDailyLogin(useGameStore.getState(), nowDate);
        setDailyLoginState(after.kind === 'no_action' ? null : { outcome: after, nowDate });
        return;
      }
      setDailyLoginState({ outcome, nowDate });
    };
    checkDaily();
    const onVis = (): void => { if (document.visibilityState === 'visible') checkDaily(); };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVis);
      return () => document.removeEventListener('visibilitychange', onVis);
    }
    return undefined;
  }, [splashDone, gdprDone]);

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
        <TapFloaterLayer />
        <HUD onOpenSettings={() => setSettingsOpen(true)} />
        <SaveSyncIndicator />
        <InitSpinner show={revenueCatInitializing} label={en.initSpinner.revenueCatLoading} />
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
        {dailyLoginState !== null && (
          <DailyLoginModal
            outcome={dailyLoginState.outcome}
            nowDate={dailyLoginState.nowDate}
            onClose={() => setDailyLoginState(null)}
          />
        )}
      </main>
    </AdProvider>
  );
}
