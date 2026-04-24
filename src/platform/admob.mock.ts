// Mock AdMob adapter — Sprint 9a Phase 9a.3.
// Used by Vitest tests + dev/web preview where the native SDK can't run.
// Configurable failure modes cover MONEY-7 (load/show failure) + the early-
// dismissal path (user closes ad before reward).

import type { AdMobAdapter, AdPlacement } from './admob';

export interface MockAdMobOptions {
  /** When true, loadRewardedAd rejects (no inventory / network failure). */
  failLoad?: boolean;
  /** When true, showRewardedAd rejects (SDK error during display). */
  failShow?: boolean;
  /** When true, showRewardedAd resolves with `false` (user dismissed before reward). */
  userDismissedBeforeReward?: boolean;
}

export interface MockAdMobAdapterCall {
  method: 'initialize' | 'loadRewardedAd' | 'showRewardedAd';
  placement?: AdPlacement;
}

export interface MockAdMobAdapter extends AdMobAdapter {
  /** Test introspection: ordered list of method calls observed by this mock. */
  readonly calls: readonly MockAdMobAdapterCall[];
}

export function createMockAdMobAdapter(opts: MockAdMobOptions = {}): MockAdMobAdapter {
  const calls: MockAdMobAdapterCall[] = [];
  return {
    calls,
    initialize: async () => {
      calls.push({ method: 'initialize' });
    },
    loadRewardedAd: async (placement) => {
      calls.push({ method: 'loadRewardedAd', placement });
      if (opts.failLoad) throw new Error('mock: loadRewardedAd failed');
    },
    showRewardedAd: async (placement) => {
      calls.push({ method: 'showRewardedAd', placement });
      if (opts.failShow) throw new Error('mock: showRewardedAd failed');
      if (opts.userDismissedBeforeReward) return false;
      return true;
    },
  };
}
