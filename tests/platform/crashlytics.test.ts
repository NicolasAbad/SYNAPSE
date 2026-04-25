// Sprint 10 Phase 10.7 — Crashlytics adapter inert-when-not-native test.
// On web/jsdom (Capacitor.isNativePlatform() === false), the adapter returns
// no-op stubs; all entry points must be safe to call + never throw.

import { afterEach, describe, expect, test } from 'vitest';
import { __resetCrashlyticsForTests, createCrashlytics, getCrashlytics } from '../../src/platform/crashlytics';

afterEach(() => __resetCrashlyticsForTests());

describe('Crashlytics adapter — inert on web/test', () => {
  test('createCrashlytics returns no-throw stubs', async () => {
    const c = createCrashlytics();
    await expect(c.setEnabled(true)).resolves.toBeUndefined();
    await expect(c.recordError('test', new Error('x'))).resolves.toBeUndefined();
    await expect(c.log('hello')).resolves.toBeUndefined();
  });

  test('getCrashlytics is a singleton (idempotent across calls)', () => {
    const a = getCrashlytics();
    const b = getCrashlytics();
    expect(a).toBe(b);
  });

  test('recordError accepts non-Error values without throwing', async () => {
    const c = createCrashlytics();
    await expect(c.recordError('tag', 'string error')).resolves.toBeUndefined();
    await expect(c.recordError('tag', { custom: 'shape' })).resolves.toBeUndefined();
    await expect(c.recordError('tag', null)).resolves.toBeUndefined();
  });
});
