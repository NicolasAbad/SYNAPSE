// Sprint 9a Phase 9a.4 — AdContext: single entry point for all 5 ad placements.
// Wraps the AdMob adapter + canShowAd gate + cooldown stamping into one
// `tryShowAd(placement, opts?)` callback consumed by placement components.
//
// Result types:
//   'shown'     — ad loaded, displayed, reward earned → recordAdWatched stamped
//   'dismissed' — ad shown, user closed before reward → cooldown stamped (anti-grind)
//   'blocked'   — canShowAd denied (gate reason in `reason`)
//   'failed'    — load or show error (MONEY-7 toast path)

import { createContext, memo, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { useGameStore } from '../store/gameStore';
import { canShowAd, type AdGateReason } from '../engine/adGate';
import type { AdMobAdapter, AdPlacement } from './admob';
import { en } from '../config/strings/en';

export interface TryShowAdOptions {
  isPostCascade?: boolean;
}

export interface TryShowAdResult {
  status: 'shown' | 'dismissed' | 'blocked' | 'failed';
  reason?: AdGateReason;
}

export interface AdContextValue {
  tryShowAd: (placement: AdPlacement, opts?: TryShowAdOptions) => Promise<TryShowAdResult>;
  /** True when no real adapter is wired (web preview / tests with no mock). */
  inert: boolean;
}

const AdContextInternal = createContext<AdContextValue | null>(null);

export interface AdProviderProps {
  adapter: AdMobAdapter | null;
  children: ReactNode;
}

export const AdProvider = memo(function AdProvider({ adapter, children }: AdProviderProps) {
  const tryShowAd = useCallback<AdContextValue['tryShowAd']>(async (placement, opts = {}) => {
    if (adapter === null) return { status: 'blocked', reason: undefined };
    const state = useGameStore.getState();
    const now = Date.now();
    const decision = canShowAd({
      state: { isSubscribed: state.isSubscribed, installedAt: state.installedAt, lastAdWatchedAt: state.lastAdWatchedAt },
      nowTimestamp: now,
      isPostCascade: opts.isPostCascade,
    });
    if (!decision.allowed) return { status: 'blocked', reason: decision.reason };
    try {
      await adapter.loadRewardedAd(placement);
      const earned = await adapter.showRewardedAd(placement);
      // Stamp the cooldown either way to prevent grind: a user who dismisses
      // an ad shouldn't be able to instantly retry. (MONEY-6 spec is "max 1
      // ad per 3 min" regardless of reward outcome.)
      useGameStore.getState().recordAdWatched(Date.now());
      return earned ? { status: 'shown' } : { status: 'dismissed' };
    } catch {
      // Pre-launch audit Day 2 — surface ad failure to NetworkErrorToast so
      // the player gets feedback. Previously silent (audit finding G/D).
      useGameStore.getState().setNetworkError(en.networkError.adFailed);
      return { status: 'failed' };
    }
  }, [adapter]);

  const value = useMemo<AdContextValue>(() => ({ tryShowAd, inert: adapter === null }), [tryShowAd, adapter]);
  return <AdContextInternal.Provider value={value}>{children}</AdContextInternal.Provider>;
});

/** Returns the AdContext value or a no-op fallback (when no provider is mounted, e.g. tests). */
// eslint-disable-next-line react-refresh/only-export-components
export function useAdContext(): AdContextValue {
  const value = useContext(AdContextInternal);
  if (value !== null) return value;
  return {
    tryShowAd: async () => ({ status: 'blocked' as const }),
    inert: true,
  };
}
