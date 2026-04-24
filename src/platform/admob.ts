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

/** Resolve the AdMob ad-unit ID for a placement from env vars. */
export function adUnitIdFor(placement: AdPlacement): string {
  if (placement === 'offline_boost') return import.meta.env.VITE_ADMOB_REWARDED_OFFLINE_BOOST ?? '';
  if (placement === 'post_discharge') return import.meta.env.VITE_ADMOB_REWARDED_POST_DISCHARGE ?? '';
  if (placement === 'mutation_reroll') return import.meta.env.VITE_ADMOB_REWARDED_MUTATION_REROLL ?? '';
  if (placement === 'decision_retry') return import.meta.env.VITE_ADMOB_REWARDED_DECISION_RETRY ?? '';
  if (placement === 'piggy_refill') return import.meta.env.VITE_ADMOB_REWARDED_PIGGY_REFILL ?? '';
  return import.meta.env.VITE_ADMOB_REWARDED_STREAK_SAVE ?? '';
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
