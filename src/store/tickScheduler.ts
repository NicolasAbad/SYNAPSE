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
import { era3AutoPrestigeAt45MinElapsed } from '../engine/era3';
import { useGameStore } from './gameStore';
import { playSfx } from '../platform/audio';

export function useTickScheduler(): void {
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const current = useGameStore.getState();
      if (current.cycleStartTimestamp === 0) return; // INIT-1 not yet run
      const now = Date.now();
      const { state: next, antiSpamActive } = tick(current, now);
      // antiSpamActive is derived each tick (TAP-1 §35 step 12); surface it to
      // UIState so the tap handler can consume the ×0.10 penalty without
      // recomputing. UI-local — saveScheduler strips it before persistence.
      useGameStore.setState({ ...next, antiSpamActive });
      // Sprint 10 Phase 10.2 — fire SFX on engine-state transitions visible
      // only at the tick boundary (insight + spontaneous events).
      if (!current.insightActive && next.insightActive) playSfx('insight');
      if (current.activeSpontaneousEvent === null && next.activeSpontaneousEvent !== null) playSfx('spontaneous');
      // GDD §23 P24 Long Thought — auto-awaken at MIN(threshold, 45 min).
      // Threshold path is handled by UI AWAKEN button; 45-min path fires here.
      if (era3AutoPrestigeAt45MinElapsed(next, now)) {
        useGameStore.getState().prestige(now, true);
      }
    }, SYNAPSE_CONSTANTS.tickIntervalMs);

    return () => window.clearInterval(intervalId);
  }, []);
}
