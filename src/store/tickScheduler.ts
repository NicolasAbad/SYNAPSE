/**
 * Runtime scheduler that fires the engine `tick()` reducer every 100ms.
 *
 * Pairs with `saveScheduler.ts` as the two "boundary" hooks that push
 * wall-clock time into the pure engine (which is forbidden from calling
 * `Date.now()` or `performance.now()` directly per CODE-9).
 *
 * Timestamp source: `Date.now()` (epoch ms), matching INIT-1 convention.
 * DO NOT use `performance.now()` here — it is page-load-relative and
 * would not line up with `cycleStartTimestamp` (which INIT-1 seeds with
 * `Date.now()`), producing wildly negative derived durations.
 *
 * Interval: 100ms fixed dt per CODE-4 + GDD §35 TICK-1 step 1.
 *
 * Init guard: skip ticks while `cycleStartTimestamp === 0` (INIT-1 pure
 * sentinel). This prevents the <100ms mount-race where the interval
 * fires before INIT-1 populates timestamps, and covers the async gap
 * when `loadFromSave` takes longer than one tick to resolve.
 *
 * Background behavior: `setInterval` fires regardless of tab visibility.
 * This is intentional for Sprint 2 — Sprint 8a OFFLINE-1 recalculates
 * elapsed time on return and supersedes any tick-accumulated state
 * during a backgrounded period. A browser-backgrounded tab throttles
 * `setInterval` to ~1Hz anyway, so waste is minimal.
 *
 * Zustand pattern (CLAUDE.md pitfall): `useGameStore.setState(next)`
 * uses MERGE mode. Never pass `true` here or action bindings are lost.
 */

import { useEffect } from 'react';
import { SYNAPSE_CONSTANTS } from '../config/constants';
import { tick } from '../engine/tick';
import { useGameStore } from './gameStore';

export function useTickScheduler(): void {
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const current = useGameStore.getState();
      if (current.cycleStartTimestamp === 0) return; // INIT-1 not yet run
      const now = Date.now();
      const { state: next } = tick(current, now);
      useGameStore.setState(next);
    }, SYNAPSE_CONSTANTS.tickIntervalMs);

    return () => window.clearInterval(intervalId);
  }, []);
}
