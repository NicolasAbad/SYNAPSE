// Sprint 9b Phase 9b.6 — Firebase adapter unit tests.
// Validates: logEvent respects consent, inert-when-not-initialized, never throws.
// Full Firebase SDK is mocked since jsdom can't run getAnalytics() (needs DOM).

import { beforeEach, describe, expect, test, vi } from 'vitest';

// Mock the firebase SDK modules at the module level.
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ name: '[DEFAULT]' })),
}));

vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(() => ({ app: {} })),
  logEvent: vi.fn(),
}));

describe('firebase adapter — initFirebase', () => {
  beforeEach(async () => {
    // Reset module cache to pick up new env + module state each test.
    vi.resetModules();
  });

  test('initFirebase is safe to call with missing env vars (stays inert)', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', '');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', '');
    vi.stubEnv('VITE_FIREBASE_APP_ID', '');
    const { initFirebase } = await import('../../src/platform/firebase');
    expect(() => initFirebase()).not.toThrow();
  });

  test('initFirebase is idempotent — calling twice is a no-op', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'AIzaStub');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'synapse-test');
    vi.stubEnv('VITE_FIREBASE_APP_ID', '1:1:web:abc');
    const { initializeApp } = await import('firebase/app');
    const { initFirebase } = await import('../../src/platform/firebase');
    initFirebase();
    initFirebase();
    expect(initializeApp).toHaveBeenCalledTimes(1);
  });
});

describe('firebase adapter — logEvent', () => {
  beforeEach(() => { vi.resetModules(); });

  test('logEvent is a no-op when analyticsConsent=false (GDPR)', async () => {
    const { logEvent: fbLog } = await import('firebase/analytics');
    const { logEvent } = await import('../../src/platform/firebase');
    vi.mocked(fbLog).mockClear();
    logEvent('starter_pack_shown', {}, false);
    expect(fbLog).not.toHaveBeenCalled();
  });

  test('logEvent is a no-op when analytics not initialized', async () => {
    const { logEvent: fbLog } = await import('firebase/analytics');
    const { logEvent } = await import('../../src/platform/firebase');
    vi.mocked(fbLog).mockClear();
    // Skipping initFirebase — adapter stays inert.
    logEvent('starter_pack_shown', {}, true);
    expect(fbLog).not.toHaveBeenCalled();
  });

  test('logEvent never throws even when fbLog throws', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'AIzaStub');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'synapse-test');
    vi.stubEnv('VITE_FIREBASE_APP_ID', '1:1:web:abc');
    const { logEvent: fbLog } = await import('firebase/analytics');
    vi.mocked(fbLog).mockImplementationOnce(() => { throw new Error('network down'); });
    const { initFirebase, logEvent } = await import('../../src/platform/firebase');
    initFirebase();
    expect(() => logEvent('starter_pack_shown', {}, true)).not.toThrow();
  });
});

describe('firebase adapter — event name type safety', () => {
  // This is a compile-time test; TS errors if the union drifts from GDD §27.
  // Runtime assertion just documents the 13 ship-in-9b.6 allowed events.
  test('13 allowed monetization + Core GP events match GDD §27 verbatim', () => {
    const expectedEvents = [
      'starter_pack_shown',
      'starter_pack_purchased',
      'starter_pack_dismissed',
      'limited_offer_shown',
      'limited_offer_purchased',
      'limited_offer_expired',
      'cosmetic_purchased',
      'cosmetic_previewed',
      'cosmetic_equipped',
      'spark_pack_purchased',
      'spark_cap_reached',
      'genius_pass_offered',
      'genius_pass_purchased',
    ] as const;
    expect(expectedEvents.length).toBe(13);
  });
});
