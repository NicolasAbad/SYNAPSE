// Implements docs/GDD.md §27 (48 analytics events — Sprint 9b.6 ships 11
// monetization + 2 related Core; Sprint 10 ships the remaining 37).
// Sprint 9b Phase 9b.6.
//
// Firebase Analytics adapter. Uses the `firebase` web SDK (installed in
// Phase 9b.1) for both web dev preview (DebugView visibility) and native
// builds (Capacitor runs the web bundle inside WebView; Analytics JS works
// the same). Native Android gets `android/app/google-services.json` for
// the native plugin if we ever swap to `@capacitor-firebase/analytics` —
// for v1.0 the JS SDK is sufficient.
//
// ANALYTICS-5 (GDD §35): event names match GDD §27 verbatim — no aliases,
// no synonyms, no convention changes. The allowed event union in this file
// is the source of truth; any new event requires GDD §27 update first.
//
// Respects `state.analyticsConsent`: when false, `logEvent` is a no-op
// (GDPR compliance — the opt-in modal landed in Sprint 2 Phase 6).

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAnalytics, logEvent as fbLogEvent, type Analytics } from 'firebase/analytics';

// Allowed event names — ANALYTICS-5 alignment with GDD §27.
// 11 Monetization + 2 Core (genius_pass_offered / genius_pass_purchased per §27 Core (19))
// + 1 reset_game (Sprint 10 Phase 10.1 — Hard Reset analytics, fires before state wipe).
// Phase 10.3 will add the remaining 34 events to reach 48 total per GDD §27.
export type AnalyticsEvent =
  | 'starter_pack_shown'
  | 'starter_pack_purchased'
  | 'starter_pack_dismissed'
  | 'limited_offer_shown'
  | 'limited_offer_purchased'
  | 'limited_offer_expired'
  | 'cosmetic_purchased'
  | 'cosmetic_previewed'
  | 'cosmetic_equipped'
  | 'spark_pack_purchased'
  | 'spark_cap_reached'
  | 'genius_pass_offered'
  | 'genius_pass_purchased'
  | 'reset_game';

export type AnalyticsParams = Record<string, string | number | boolean>;

let app: FirebaseApp | null = null;
let analytics: Analytics | null = null;

/** Invoked once at App mount. Safe to call even if env vars are missing — the adapter stays inert. */
export function initFirebase(): void {
  if (app !== null) return;
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };
  // If any required field is missing, bail out silently — inert adapter.
  if (!config.apiKey || !config.projectId || !config.appId) return;
  try {
    app = initializeApp(config);
    // Analytics requires a DOM window (measurementId-backed). In jsdom the
    // getAnalytics call throws — wrap so tests stay clean.
    analytics = getAnalytics(app);
  } catch (e) {
    // CODE-8: never throw at init; leave adapter inert.
    console.error('[firebase] init failed:', e);
    app = null;
    analytics = null;
  }
}

/**
 * Log a monetization / analytics event. Respects GDPR consent — caller passes
 * the current `analyticsConsent` boolean; false short-circuits to no-op.
 */
export function logEvent(name: AnalyticsEvent, params: AnalyticsParams = {}, analyticsConsent = true): void {
  if (!analyticsConsent) return;
  if (analytics === null) {
    // Dev stub: console.log for local DebugView-less preview.
    if (import.meta.env.DEV) console.log(`[analytics stub] ${name}`, params);
    return;
  }
  try {
    fbLogEvent(analytics, name, params);
  } catch (e) {
    // Never throw from analytics — failures are silent.
    if (import.meta.env.DEV) console.error(`[analytics] ${name} failed:`, e);
  }
}

/** For tests: reset the module state. */
export function __resetFirebaseForTests(): void {
  app = null;
  analytics = null;
}
