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

// Allowed event names — ANALYTICS-5 alignment with GDD §27 (48 events) + 1
// extension (`reset_game`, Sprint 10 Phase 10.1 from SPRINTS.md scope) = 49.
// SPRINTS.md ↔ GDD §27 gap: SPRINTS.md line 943 mandates `reset_game` for the
// Hard Reset flow but GDD §27 does not list it. Carrying as Sprint-10 extension
// pending Nico's reconciliation (drop event vs extend §27 to 49).
//
// Breakdown per GDD §27: 9 Funnel + 11 Monetization + 5 Feature + 20 Core + 3
// Weekly Challenge = 48. Plus 1 Sprint 10.1 extension = 49 total here.
export type AnalyticsEvent =
  // ── Funnel (9) — ANALYTICS-3 ──
  | 'app_first_open'
  | 'tutorial_first_tap'
  | 'tutorial_first_buy'
  | 'tutorial_first_discharge'
  | 'first_prestige'
  | 'reached_p5'
  | 'reached_p10'
  | 'first_transcendence'
  | 'first_purchase'
  // ── Monetization (11) — ANALYTICS-4 ──
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
  // ── Feature (5) ──
  | 'achievement_unlocked'
  | 'mental_state_changed'
  | 'micro_challenge_completed'
  | 'micro_challenge_failed'
  | 'diary_entry_added'
  // ── Core (20) ──
  | 'first_tap'
  | 'first_neuron'
  | 'upgrade_purchased'
  | 'discharge_used'
  | 'insight_activated'
  | 'prestige_completed'
  | 'polarity_chosen'
  | 'mutation_chosen'
  | 'pathway_chosen'
  | 'pattern_decision'
  | 'resonant_pattern_discovered'
  | 'spontaneous_event'
  | 'personal_best'
  | 'transcendence'
  | 'ending_seen'
  | 'offline_return'
  | 'ad_watched'
  | 'genius_pass_offered'
  | 'genius_pass_purchased'
  | 'pattern_decisions_reset'
  // ── Weekly Challenge (3) — CORE-9 ──
  // Defined for forward-compat. The Weekly Challenge consumer is NOT shipping
  // in v1.0 (per Sprint 10 close notes); these events have no caller until the
  // WC mechanics land. If WC is dropped from the roadmap, remove from this union.
  | 'weekly_challenge_started'
  | 'weekly_challenge_completed'
  | 'weekly_challenge_expired'
  // ── Sprint 10.1 extension (carried pending GDD §27 reconciliation) ──
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

/**
 * Sprint 10 Phase 10.3 — fire-once analytics helper for funnel events.
 * Caller passes the current `firstEventsFired` array; if `name` is already
 * in it, this is a no-op. Otherwise the event is logged and the helper
 * returns the new array (for the caller to commit to GameState).
 *
 * Returns the (unchanged) input array when the event has already fired.
 * Returns a new array with `name` appended when the event fires.
 */
export function logEventOnce(
  name: AnalyticsEvent,
  params: AnalyticsParams,
  analyticsConsent: boolean,
  firedBefore: string[],
): string[] {
  if (firedBefore.includes(name)) return firedBefore;
  logEvent(name, params, analyticsConsent);
  return [...firedBefore, name];
}

/** For tests: reset the module state. */
export function __resetFirebaseForTests(): void {
  app = null;
  analytics = null;
}
