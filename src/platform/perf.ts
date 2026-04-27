// Sprint 11a Phase 11a.6 follow-up — perf instrumentation helpers for Sprint 11b
// SLOs (memory + long-task observers). Wraps best-effort browser APIs so engine
// + UI code can sample them without throwing on platforms where the API isn't
// available (Capacitor WebView, jsdom tests, older Chromium versions).
//
// FPS sampling already lives in src/ui/canvas/fpsMeter.ts. This file adds:
//   - takeMemorySnapshot(): performance.memory wrapper (Chromium-only)
//   - createLongTaskObserver(): PerformanceObserver for longtask entries
//
// Sprint 11b consumers will assert on these (peak heap < budget, no longtask
// during the prestige flow, etc.). Shipping the helpers now means 11b can
// add SLO assertions without first standing up the wrappers.
//
// CODE-8: every helper wraps in try/catch and returns null on error so
// callers can branch on null without writing their own defenses.

/** Snapshot of the JS heap at the moment of the call. Chromium-only. */
export interface MemorySnapshot {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  /** ms epoch at sample time — useful for time-series tracking. */
  sampledAt: number;
}

/**
 * Returns a heap snapshot if performance.memory is available (Chromium /
 * Chrome / Edge / Capacitor WebView on Android). Returns null on Firefox,
 * Safari, jsdom, and any other environment where the API is missing or
 * disabled (Lighthouse-style headless flags can also strip it).
 */
export function takeMemorySnapshot(): MemorySnapshot | null {
  try {
    if (typeof performance === 'undefined') return null;
    const mem = (performance as unknown as { memory?: { usedJSHeapSize?: number; totalJSHeapSize?: number; jsHeapSizeLimit?: number } }).memory;
    if (!mem || typeof mem.usedJSHeapSize !== 'number') return null;
    return {
      usedJSHeapSize: mem.usedJSHeapSize,
      totalJSHeapSize: mem.totalJSHeapSize ?? 0,
      jsHeapSizeLimit: mem.jsHeapSizeLimit ?? 0,
      sampledAt: Date.now(),
    };
  } catch {
    return null;
  }
}

/** Single observed longtask entry. */
export interface LongTaskEntry {
  startTime: number;
  duration: number;
  name: string;
}

/**
 * Subscribes a callback to PerformanceObserver `longtask` entries (>50ms
 * blocking on the main thread). Returns a `disconnect` function or null if
 * the API isn't available in this environment. Sprint 11b SLOs use this to
 * assert prestige + transcendence never block the main thread for >50ms.
 */
export function createLongTaskObserver(
  onEntry: (entry: LongTaskEntry) => void,
): (() => void) | null {
  try {
    if (typeof PerformanceObserver === 'undefined') return null;
    // Local var named `perfWatcher` (not `observer`) to avoid colliding with the
    // v1.5+ POSTLAUNCH "Observer Archetype" identifier banned in tests/consistency.
    const perfWatcher = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        onEntry({
          startTime: entry.startTime,
          duration: entry.duration,
          name: entry.name,
        });
      }
    });
    // Some browsers throw on .observe() if the entry type isn't supported,
    // even if PerformanceObserver itself exists. Wrap that too.
    perfWatcher.observe({ type: 'longtask', buffered: false });
    return () => {
      try { perfWatcher.disconnect(); } catch { /* ignore double-disconnect */ }
    };
  } catch {
    return null;
  }
}

/**
 * Convenience: collect every longtask within a time window and return them
 * as an array. Used in Sprint 11b assertion tests like "during the prestige
 * flow, the main thread is never blocked for >50ms".
 *
 * The observer auto-disconnects when the returned promise resolves.
 */
export async function collectLongTasksDuring(
  windowMs: number,
): Promise<LongTaskEntry[]> {
  return new Promise((resolve) => {
    const entries: LongTaskEntry[] = [];
    const disconnect = createLongTaskObserver((e) => entries.push(e));
    if (disconnect === null) {
      resolve([]);
      return;
    }
    setTimeout(() => {
      disconnect();
      resolve(entries);
    }, windowMs);
  });
}
