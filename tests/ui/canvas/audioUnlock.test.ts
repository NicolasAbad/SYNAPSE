// @vitest-environment jsdom
// Tests for src/ui/canvas/audioUnlock.ts — singleton AudioContext + iOS unlock.

import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import {
  __resetAudioContextForTests,
  getAudioContext,
  unlockAudioOnFirstTap,
} from '../../../src/ui/canvas/audioUnlock';

let resumeCalls = 0;
let stubState: 'suspended' | 'running' = 'suspended';

class StubAudioContext {
  get state() {
    return stubState;
  }
  async resume() {
    resumeCalls++;
    stubState = 'running';
    return undefined;
  }
}

beforeEach(() => {
  resumeCalls = 0;
  stubState = 'suspended';
  __resetAudioContextForTests();
  // Inject stub constructor on window
  (window as unknown as { AudioContext: typeof AudioContext }).AudioContext =
    StubAudioContext as unknown as typeof AudioContext;
});

afterEach(() => {
  __resetAudioContextForTests();
});

describe('getAudioContext — singleton', () => {
  test('two calls return the same instance', () => {
    const a = getAudioContext();
    const b = getAudioContext();
    expect(a).toBe(b);
  });
});

describe('unlockAudioOnFirstTap', () => {
  test('resumes a suspended context on first call', async () => {
    stubState = 'suspended';
    await unlockAudioOnFirstTap();
    expect(resumeCalls).toBe(1);
    expect(stubState).toBe('running');
  });

  test('is idempotent: second call does not resume again (already running)', async () => {
    stubState = 'suspended';
    await unlockAudioOnFirstTap();
    expect(resumeCalls).toBe(1);
    // Second call: state is now 'running' → early return before resume
    await unlockAudioOnFirstTap();
    expect(resumeCalls).toBe(1);
  });

  test('silent fail (UI-8) when resume() rejects', async () => {
    class ThrowingAudioContext {
      get state() {
        return 'suspended' as const;
      }
      async resume() {
        throw new Error('user gesture required');
      }
    }
    (window as unknown as { AudioContext: typeof AudioContext }).AudioContext =
      ThrowingAudioContext as unknown as typeof AudioContext;
    __resetAudioContextForTests();
    // Should not throw
    await expect(unlockAudioOnFirstTap()).resolves.toBeUndefined();
  });

  test('no-op when AudioContext ctor is unavailable', async () => {
    (window as unknown as { AudioContext: unknown; webkitAudioContext?: unknown }).AudioContext =
      undefined as unknown as typeof AudioContext;
    const w = window as unknown as { webkitAudioContext?: unknown };
    w.webkitAudioContext = undefined;
    __resetAudioContextForTests();
    await expect(unlockAudioOnFirstTap()).resolves.toBeUndefined();
  });
});

describe('getAudioContext — throws when no ctor available', () => {
  test('throws a clear error message', () => {
    (window as unknown as { AudioContext: unknown; webkitAudioContext?: unknown }).AudioContext =
      undefined as unknown as typeof AudioContext;
    (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext = undefined;
    __resetAudioContextForTests();
    expect(() => getAudioContext()).toThrow(/no AudioContext constructor/);
  });
});
