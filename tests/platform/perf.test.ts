// @vitest-environment jsdom
// Sprint 11a Phase 11a.6 follow-up — perf wrapper tests. These verify the
// helpers in src/platform/perf.ts never throw on platforms where the
// underlying Web API is missing (which is the case in jsdom + Firefox +
// Safari + older WebView). The actual SLO assertions ride on these
// wrappers in Sprint 11b's device matrix runs.

import { describe, expect, test, vi, afterEach } from 'vitest';
import { takeMemorySnapshot, createLongTaskObserver, collectLongTasksDuring } from '../../src/platform/perf';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('takeMemorySnapshot — performance.memory wrapper (CODE-8)', () => {
  test('returns null on environments without performance.memory (jsdom default)', () => {
    // jsdom's performance has no .memory property — this is the typical
    // non-Chromium case. Helper must return null, not throw.
    expect(takeMemorySnapshot()).toBeNull();
  });

  test('returns a snapshot when performance.memory is present (Chromium-shaped)', () => {
    // Stub performance.memory to mimic Chromium's exposed shape.
    const fakePerf = {
      ...performance,
      memory: { usedJSHeapSize: 12_345_678, totalJSHeapSize: 23_456_789, jsHeapSizeLimit: 34_567_890 },
    };
    vi.stubGlobal('performance', fakePerf);
    const snap = takeMemorySnapshot();
    expect(snap).not.toBeNull();
    expect(snap?.usedJSHeapSize).toBe(12_345_678);
    expect(snap?.totalJSHeapSize).toBe(23_456_789);
    expect(snap?.jsHeapSizeLimit).toBe(34_567_890);
    expect(typeof snap?.sampledAt).toBe('number');
  });

  test('returns null when performance.memory exists but lacks the expected shape', () => {
    const fakePerf = { ...performance, memory: { foo: 'bar' } };
    vi.stubGlobal('performance', fakePerf);
    expect(takeMemorySnapshot()).toBeNull();
  });
});

describe('createLongTaskObserver — PerformanceObserver wrapper (CODE-8)', () => {
  test('returns null when PerformanceObserver is undefined', () => {
    vi.stubGlobal('PerformanceObserver', undefined);
    const disconnect = createLongTaskObserver(() => {});
    expect(disconnect).toBeNull();
  });

  test('returns null (does not throw) when observe() throws on the longtask type', () => {
    // Some browsers expose PerformanceObserver but reject `type: 'longtask'`.
    class ThrowingObserver {
      observe(): void { throw new Error('longtask not supported'); }
      disconnect(): void {}
    }
    vi.stubGlobal('PerformanceObserver', ThrowingObserver);
    const disconnect = createLongTaskObserver(() => {});
    expect(disconnect).toBeNull();
  });

  test('returns a disconnect function when PerformanceObserver supports longtask', () => {
    let observeCalled = false;
    let disconnectCalled = false;
    class FakeObserver {
      observe(): void { observeCalled = true; }
      disconnect(): void { disconnectCalled = true; }
    }
    vi.stubGlobal('PerformanceObserver', FakeObserver);
    const disconnect = createLongTaskObserver(() => {});
    expect(disconnect).not.toBeNull();
    expect(observeCalled).toBe(true);
    disconnect?.();
    expect(disconnectCalled).toBe(true);
  });
});

describe('collectLongTasksDuring — windowed collector (Sprint 11b assertion glue)', () => {
  test('resolves to an empty array when PerformanceObserver is unavailable', async () => {
    vi.stubGlobal('PerformanceObserver', undefined);
    const entries = await collectLongTasksDuring(10);
    expect(entries).toEqual([]);
  });
});
