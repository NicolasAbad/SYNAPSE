// @vitest-environment jsdom
// Tests for src/store/tickScheduler.ts — 100ms runtime interval that
// invokes engine tick() reducer and merges the result into the store.
//
// Covers the Phase 3.5 integration gap: tick() was already unit-tested
// (Sprint 1), but nothing bridged it to the React runtime until this
// scheduler landed.

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';
import { createDefaultState, useGameStore } from '../../src/store/gameStore';
import { useTickScheduler } from '../../src/store/tickScheduler';

const INTERVAL_MS = SYNAPSE_CONSTANTS.tickIntervalMs;

beforeEach(() => {
  vi.useFakeTimers();
  useGameStore.setState(createDefaultState());
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useTickScheduler — setInterval lifecycle', () => {
  test('mount registers a 100ms setInterval', () => {
    const spy = vi.spyOn(window, 'setInterval');
    renderHook(() => useTickScheduler());
    const matches = spy.mock.calls.filter(([, delay]) => delay === INTERVAL_MS);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  test('unmount calls clearInterval with the id from setInterval', () => {
    const setSpy = vi.spyOn(window, 'setInterval');
    const clearSpy = vi.spyOn(window, 'clearInterval');
    const { unmount } = renderHook(() => useTickScheduler());
    const returnedIds = setSpy.mock.results
      .filter((_, i) => setSpy.mock.calls[i]?.[1] === INTERVAL_MS)
      .map((r) => r.value);
    unmount();
    for (const id of returnedIds) {
      expect(clearSpy).toHaveBeenCalledWith(id);
    }
  });
});

describe('useTickScheduler — tick execution', () => {
  test('INIT-1 guard: no state change while cycleStartTimestamp === 0', () => {
    // Default state leaves cycleStartTimestamp at 0 until mount effect.
    renderHook(() => useTickScheduler());
    const before = useGameStore.getState().thoughts;
    vi.advanceTimersByTime(INTERVAL_MS * 5); // CONST-OK: 5-tick fast-forward
    const after = useGameStore.getState().thoughts;
    expect(after).toBe(before); // no ticks processed
  });

  test('once timestamps seeded, tick runs and accumulates thoughts', () => {
    // Seed INIT-1 fields + baseline production so TICK-1 step 4 produces.
    const now = Date.now();
    useGameStore.setState({
      cycleStartTimestamp: now,
      sessionStartTimestamp: now,
      lastActiveTimestamp: now,
      dischargeLastTimestamp: now,
      baseProductionPerSecond: 0.5, // 1 Básica default rate
      effectiveProductionPerSecond: 0.5, // will be recalculated by TICK-1 step 3
    });
    renderHook(() => useTickScheduler());
    const before = useGameStore.getState().thoughts;
    vi.advanceTimersByTime(INTERVAL_MS * 10); // CONST-OK: 10-tick fast-forward = 1 simulated second
    const after = useGameStore.getState().thoughts;
    expect(after).toBeGreaterThan(before);
  });

  test('action bindings survive tick merges (Zustand pitfall per CLAUDE.md)', () => {
    const now = Date.now();
    useGameStore.setState({
      cycleStartTimestamp: now,
      sessionStartTimestamp: now,
      lastActiveTimestamp: now,
      dischargeLastTimestamp: now,
    });
    renderHook(() => useTickScheduler());
    const beforeRef = useGameStore.getState().incrementThoughtsByMinTap;
    vi.advanceTimersByTime(INTERVAL_MS * 3); // CONST-OK: 3-tick fast-forward
    const afterRef = useGameStore.getState().incrementThoughtsByMinTap;
    expect(afterRef).toBe(beforeRef);
    expect(useGameStore.getState().reset).toBeTypeOf('function');
    expect(useGameStore.getState().initSessionTimestamps).toBeTypeOf('function');
  });

  test('cleanup on unmount stops further ticks', () => {
    const now = Date.now();
    useGameStore.setState({
      cycleStartTimestamp: now,
      sessionStartTimestamp: now,
      lastActiveTimestamp: now,
      dischargeLastTimestamp: now,
      baseProductionPerSecond: 0.5,
      effectiveProductionPerSecond: 0.5,
    });
    const { unmount } = renderHook(() => useTickScheduler());
    vi.advanceTimersByTime(INTERVAL_MS * 5); // CONST-OK: run 5 ticks, then unmount
    const afterFirstBatch = useGameStore.getState().thoughts;
    unmount();
    vi.advanceTimersByTime(INTERVAL_MS * 10); // CONST-OK: 10 more ticks — should be ignored
    const afterUnmount = useGameStore.getState().thoughts;
    expect(afterUnmount).toBe(afterFirstBatch);
  });
});
