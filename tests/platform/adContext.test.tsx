// @vitest-environment jsdom
// Sprint 9a Phase 9a.4 — AdContext integration tests.
// Validates: tryShowAd composes canShowAd + adapter calls + recordAdWatched
// stamping across success / dismiss / blocked / failed outcomes.

import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { AdProvider, useAdContext } from '../../src/platform/AdContext';
import { createMockAdMobAdapter } from '../../src/platform/admob.mock';
import { useGameStore } from '../../src/store/gameStore';

beforeEach(() => useGameStore.getState().reset());
afterEach(() => { cleanup(); useGameStore.getState().reset(); });

function withAdapter(adapter: ReturnType<typeof createMockAdMobAdapter> | null) {
  return ({ children }: { children: React.ReactNode }) => (
    <AdProvider adapter={adapter}>{children}</AdProvider>
  );
}

describe('AdContext.tryShowAd — gate composition', () => {
  test('blocked when isSubscribed=true (Genius Pass shielding)', async () => {
    useGameStore.setState({ isSubscribed: true, installedAt: 1, lastAdWatchedAt: 0 });
    const adapter = createMockAdMobAdapter();
    const { result } = renderHook(() => useAdContext(), { wrapper: withAdapter(adapter) });
    let outcome: { status: string; reason?: string } = { status: 'init' };
    await act(async () => { outcome = await result.current.tryShowAd('offline_boost'); });
    expect(outcome).toEqual({ status: 'blocked', reason: 'subscribed' });
    expect(adapter.calls).toEqual([]); // never reached the adapter
  });

  test('blocked when installedAt=0 (defensive tutorial-grace)', async () => {
    useGameStore.setState({ isSubscribed: false, installedAt: 0, lastAdWatchedAt: 0 });
    const adapter = createMockAdMobAdapter();
    const { result } = renderHook(() => useAdContext(), { wrapper: withAdapter(adapter) });
    let outcome: { status: string; reason?: string } = { status: 'init' };
    await act(async () => { outcome = await result.current.tryShowAd('offline_boost'); });
    expect(outcome).toEqual({ status: 'blocked', reason: 'tutorial-grace' });
  });

  test('blocked when adapter is null (no provider wired / web preview)', async () => {
    useGameStore.setState({ isSubscribed: false, installedAt: 1, lastAdWatchedAt: 0 });
    const { result } = renderHook(() => useAdContext(), { wrapper: withAdapter(null) });
    expect(result.current.inert).toBe(true);
    let outcome: { status: string; reason?: string } = { status: 'init' };
    await act(async () => { outcome = await result.current.tryShowAd('offline_boost'); });
    expect(outcome.status).toBe('blocked');
  });
});

describe('AdContext.tryShowAd — happy path', () => {
  beforeEach(() => {
    // Position the test outside grace + cooldown so canShowAd allows.
    useGameStore.setState({ isSubscribed: false, installedAt: 1, lastAdWatchedAt: 0 });
  });

  test('shown: load + show + recordAdWatched stamped', async () => {
    const adapter = createMockAdMobAdapter();
    const { result } = renderHook(() => useAdContext(), { wrapper: withAdapter(adapter) });
    let outcome: { status: string; reason?: string } = { status: 'init' };
    await act(async () => { outcome = await result.current.tryShowAd('offline_boost'); });
    expect(outcome).toEqual({ status: 'shown' });
    expect(adapter.calls).toContainEqual({ method: 'loadRewardedAd', placement: 'offline_boost' });
    expect(adapter.calls).toContainEqual({ method: 'showRewardedAd', placement: 'offline_boost' });
    expect(useGameStore.getState().lastAdWatchedAt).toBeGreaterThan(0); // stamped
  });

  test('dismissed: cooldown still stamped (anti-grind)', async () => {
    const adapter = createMockAdMobAdapter({ userDismissedBeforeReward: true });
    const { result } = renderHook(() => useAdContext(), { wrapper: withAdapter(adapter) });
    let outcome: { status: string; reason?: string } = { status: 'init' };
    await act(async () => { outcome = await result.current.tryShowAd('offline_boost'); });
    expect(outcome.status).toBe('dismissed');
    expect(useGameStore.getState().lastAdWatchedAt).toBeGreaterThan(0);
  });

  test('failed (load error, MONEY-7): cooldown NOT stamped', async () => {
    const adapter = createMockAdMobAdapter({ failLoad: true });
    const { result } = renderHook(() => useAdContext(), { wrapper: withAdapter(adapter) });
    let outcome: { status: string; reason?: string } = { status: 'init' };
    await act(async () => { outcome = await result.current.tryShowAd('offline_boost'); });
    expect(outcome.status).toBe('failed');
    expect(useGameStore.getState().lastAdWatchedAt).toBe(0); // not stamped → user can retry
  });

  test('failed (show error, MONEY-7): cooldown NOT stamped', async () => {
    const adapter = createMockAdMobAdapter({ failShow: true });
    const { result } = renderHook(() => useAdContext(), { wrapper: withAdapter(adapter) });
    let outcome: { status: string; reason?: string } = { status: 'init' };
    await act(async () => { outcome = await result.current.tryShowAd('offline_boost'); });
    expect(outcome.status).toBe('failed');
    expect(useGameStore.getState().lastAdWatchedAt).toBe(0);
  });

  test('isPostCascade=true → blocked (MONEY-5)', async () => {
    const adapter = createMockAdMobAdapter();
    const { result } = renderHook(() => useAdContext(), { wrapper: withAdapter(adapter) });
    let outcome: { status: string; reason?: string } = { status: 'init' };
    await act(async () => { outcome = await result.current.tryShowAd('post_discharge', { isPostCascade: true }); });
    expect(outcome).toEqual({ status: 'blocked', reason: 'post-cascade' });
    expect(adapter.calls).toEqual([]); // never reached adapter
  });
});

describe('AdContext.tryShowAd — MONEY-6 cooldown enforcement', () => {
  test('second consecutive ad blocked by cooldown after first one shown', async () => {
    useGameStore.setState({ isSubscribed: false, installedAt: 1, lastAdWatchedAt: 0 });
    const adapter = createMockAdMobAdapter();
    const { result } = renderHook(() => useAdContext(), { wrapper: withAdapter(adapter) });
    await act(async () => { await result.current.tryShowAd('offline_boost'); });
    let second;
    await act(async () => { second = await result.current.tryShowAd('mutation_reroll'); });
    expect(second).toEqual({ status: 'blocked', reason: 'cooldown' });
  });
});
