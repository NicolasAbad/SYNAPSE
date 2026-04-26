// @vitest-environment jsdom
//
// Sprint 11a Phase 11a.6 — TICK-RUNTIME-1 end-to-end integration test.
// Per SPRINTS.md §Sprint 11a lines 1027-1034. Catches the regression class
// where unit tests pass but the runtime scheduler is missing from the App
// tree ("scheduler hook not called from App.tsx").
//
// Mitigation pattern:
//   1. Static check (App.tsx has the runtime hook calls in its body) — catches
//      regressions in App.tsx that REMOVE the hook invocations.
//   2. Integration check (mount a runtime shell + advance fake timers + assert
//      state mutated) — catches regressions in the hook IMPLEMENTATION that
//      would silently no-op without erroring.
//
// Why not mount the full App tree: App.tsx imports @capacitor/*, RevenueCat,
// AdMob, Firebase, Howler, push notifications — mocking all of these in
// jsdom is a 100-line scaffolding job that obscures the test intent. The
// real-Chromium variant via Vitest Browser Mode is the right home for full-
// App mounting; it stays DEFERRED per the existing Sprint 2 PROGRESS.md
// note ("setup cost not yet justified") + Sprint 11a's other priorities.
//
// Context: src/engine/tick.ts had 29 passing unit tests from Sprint 1
// Phase 5 but was NOT wired to any runtime loop until Sprint 2 Phase 3.5
// added src/store/tickScheduler.ts. Passive production was silently zero
// in the browser despite green tests. The static check below would have
// caught that exact regression.

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderHook, cleanup, act } from '@testing-library/react';
import { useTickScheduler } from '../../src/store/tickScheduler';
import { useSaveScheduler } from '../../src/store/saveScheduler';
import { useGameStore } from '../../src/store/gameStore';

const APP_TSX_PATH = resolve(__dirname, '..', '..', 'src', 'App.tsx');

describe('TICK-RUNTIME-1 — App.tsx static wiring (Sprint 11a Phase 11a.6)', () => {
  // Read once per file run; this is fast and stays in sync with the on-disk file.
  const appSource = readFileSync(APP_TSX_PATH, 'utf8');

  test('App.tsx imports useTickScheduler from store/tickScheduler', () => {
    expect(appSource).toMatch(/from ['"]\.\/store\/tickScheduler['"]/);
    expect(appSource).toMatch(/useTickScheduler/);
  });

  test('App.tsx invokes useTickScheduler() in its component body', () => {
    // The hook must appear as a CALL (with parens), not just an import.
    expect(appSource).toMatch(/useTickScheduler\(\)/);
  });

  test('App.tsx invokes useSaveScheduler() — save loop wired', () => {
    expect(appSource).toMatch(/useSaveScheduler\(\)/);
  });

  test('App.tsx initializes session timestamps via initSessionTimestamps(Date.now())', () => {
    // INIT-1 mount effect — without this, cycleStartTimestamp stays 0 and
    // tickScheduler's init guard would skip ticks indefinitely.
    expect(appSource).toMatch(/initSessionTimestamps\(Date\.now\(\)\)/);
  });
});

// Helper component that mirrors the App-side hook invocations (the two
// scheduler hooks). The store is reset before each test so the
// initSessionTimestamps + tick effects start from a known state.
function RuntimeShell() {
  useTickScheduler();
  useSaveScheduler();
  return null;
}

describe('TICK-RUNTIME-1 — runtime hooks advance state under fake timers', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  test('mounting RuntimeShell + advancing 5s of timers populates engine-driven state', () => {
    // Seed the state the way INIT-1 + first cycle would: timestamps set,
    // a starter neuron purchased so production > 0, threshold set so the
    // tick has something to chew on.
    const T0 = 1_700_000_000_000; // arbitrary epoch ms
    vi.setSystemTime(T0);
    useGameStore.setState({
      thoughts: 0,
      cycleGenerated: 0,
      neurons: [
        { type: 'basica', count: 5 },
        { type: 'sensorial', count: 0 },
        { type: 'piramidal', count: 0 },
        { type: 'espejo', count: 0 },
        { type: 'integradora', count: 0 },
      ],
      cycleStartTimestamp: T0,
      dischargeLastTimestamp: T0,
      lastSpontaneousCheck: T0,
      isTutorialCycle: false,
    });

    renderHook(() => RuntimeShell());

    // Advance 5 seconds of game time (50 ticks at 100ms each).
    act(() => {
      vi.setSystemTime(T0 + 5_000);
      vi.advanceTimersByTime(5_000);
    });

    const state = useGameStore.getState();
    // Passive accumulation occurred — tick produced thoughts.
    expect(state.thoughts).toBeGreaterThan(0);
    // baseProductionPerSecond was recomputed by stepRecalcProduction.
    expect(state.baseProductionPerSecond).toBeGreaterThan(0);
  });

  test('runtime tick respects INIT-1 guard — no ticks fire while cycleStartTimestamp === 0', () => {
    // If cycleStartTimestamp is 0 (INIT-1 sentinel), the scheduler must skip
    // every tick. This guard prevents the <100ms mount-race where the interval
    // fires before initSessionTimestamps populates timestamps.
    useGameStore.setState({
      thoughts: 0,
      cycleStartTimestamp: 0,
      neurons: [
        { type: 'basica', count: 5 },
        { type: 'sensorial', count: 0 },
        { type: 'piramidal', count: 0 },
        { type: 'espejo', count: 0 },
        { type: 'integradora', count: 0 },
      ],
    });

    renderHook(() => RuntimeShell());
    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    const state = useGameStore.getState();
    expect(state.thoughts).toBe(0);
    expect(state.cycleStartTimestamp).toBe(0);
  });
});
