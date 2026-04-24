// Implements docs/GDD.md §26 (Monetization) — AdMob platform adapter.
// Sprint 9a Phase 9a.3.
//
// Adapter pattern: callers depend on the AdMobAdapter interface; the real SDK
// is reached only via createAdMobAdapter(). Tests use the mock factory
// (./admob.mock.ts). Native-only guard: createAdMobAdapter throws if invoked
// off-native; App.tsx must check Capacitor.isNativePlatform() first.
//
// Ad placement IDs come from env vars (.env.example documents the 6 used in
// Sprint 9a + 1 more for Sprint 10's streak save). Test IDs ship as the
// canonical Google placeholders so dev builds never accidentally request real
// inventory.

import { Capacitor } from '@capacitor/core';

export type AdPlacement =
  | 'offline_boost'
  | 'post_discharge'
  | 'mutation_reroll'
  | 'decision_retry'
  | 'piggy_refill'
  | 'streak_save';

export interface AdMobAdapter {
  initialize: () => Promise<void>;
  loadRewardedAd: (placement: AdPlacement) => Promise<void>;
  /** Resolves with `true` when the user earned the reward, `false` if dismissed early. */
  showRewardedAd: (placement: AdPlacement) => Promise<boolean>;
}

/**
 * Resolve the AdMob ad-unit ID for a placement on the current platform.
 *
 * AdMob assigns ad unit IDs per app, and our Android + iOS apps are distinct
 * AdMob entries (each with its own 6 rewarded ad units). Sprint 9a Phase 9a.5
 * split the env vars into ANDROID/IOS pairs so the SDK gets the right ID
 * regardless of platform. On `web` (dev preview), this returns empty string —
 * the createAdMobAdapter native-only guard prevents the path from ever firing
 * with an empty ID in production.
 */
export function adUnitIdFor(placement: AdPlacement): string {
  const platform = Capacitor.getPlatform();
  const isIos = platform === 'ios';
  if (placement === 'offline_boost') return (isIos ? import.meta.env.VITE_ADMOB_REWARDED_OFFLINE_BOOST_IOS : import.meta.env.VITE_ADMOB_REWARDED_OFFLINE_BOOST_ANDROID) ?? '';
  if (placement === 'post_discharge') return (isIos ? import.meta.env.VITE_ADMOB_REWARDED_POST_DISCHARGE_IOS : import.meta.env.VITE_ADMOB_REWARDED_POST_DISCHARGE_ANDROID) ?? '';
  if (placement === 'mutation_reroll') return (isIos ? import.meta.env.VITE_ADMOB_REWARDED_MUTATION_REROLL_IOS : import.meta.env.VITE_ADMOB_REWARDED_MUTATION_REROLL_ANDROID) ?? '';
  if (placement === 'decision_retry') return (isIos ? import.meta.env.VITE_ADMOB_REWARDED_DECISION_RETRY_IOS : import.meta.env.VITE_ADMOB_REWARDED_DECISION_RETRY_ANDROID) ?? '';
  if (placement === 'piggy_refill') return (isIos ? import.meta.env.VITE_ADMOB_REWARDED_PIGGY_REFILL_IOS : import.meta.env.VITE_ADMOB_REWARDED_PIGGY_REFILL_ANDROID) ?? '';
  return (isIos ? import.meta.env.VITE_ADMOB_REWARDED_STREAK_SAVE_IOS : import.meta.env.VITE_ADMOB_REWARDED_STREAK_SAVE_ANDROID) ?? '';
}

export function createAdMobAdapter(): AdMobAdapter {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('createAdMobAdapter: native-only — caller must guard with Capacitor.isNativePlatform()');
  }
  return {
    initialize: async () => {
      const { AdMob } = await import('@capacitor-community/admob');
      await AdMob.initialize({});
    },
    loadRewardedAd: async (placement) => {
      const { AdMob } = await import('@capacitor-community/admob');
      await AdMob.prepareRewardVideoAd({ adId: adUnitIdFor(placement) });
    },
    showRewardedAd: async (placement) => {
      void placement; // placement was already routed during loadRewardedAd
      const { AdMob } = await import('@capacitor-community/admob');
      // showRewardVideoAd resolves with the reward object on success; the SDK
      // throws on early dismissal in some plugin versions. Treat any throw as
      // "user did not earn reward" so the caller can show a neutral toast
      // rather than a failure toast (MONEY-7 distinguishes "no ad available"
      // from "user dismissed").
      try {
        const reward = await AdMob.showRewardVideoAd();
        return reward !== null && reward !== undefined;
      } catch {
        return false;
      }
    },
  };
}
