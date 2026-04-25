// Sprint 10 Phase 10.7 — Firebase Remote Config adapter (infrastructure).
//
// Fetches remote-tunable game constants at boot. Per Sprint 10 spec, the
// 8 overridable constants are: costMult, softCapExponent, cascadeMultiplier,
// insightMultiplier (array — sent as JSON), insightDuration (array),
// baseOfflineEfficiency, maxOfflineEfficiencyRatio, consciousnessThreshold
// (deprecated — duplicate of baseThresholdTable[0], so we substitute
// baseThresholdTable_0 to keep the count at 8).
//
// SCOPE NOTE: This adapter ships the FETCH side only. Consumer wiring (i.e.
// SYNAPSE_CONSTANTS reading from `effectiveConfig.get('costMult')`) is
// deferred to a v1.1 sprint because:
//   - SYNAPSE_CONSTANTS is `as const` and globally referenced; making it
//     mutable touches every engine path.
//   - Determinism gate (CODE-9) requires same-seed → same output. Remote
//     Config can change values mid-session; we'd need a snapshot-on-boot
//     pattern + invalidation strategy.
//   - Sprint 8c-tuning is still open — tuning via Remote Config would
//     bypass the test-5 sim gate.
//
// What ships now: adapter API + bounds validation + stored fetched values
// available via `getRemoteValue(key)`. Engine code does not consume it yet.

import { Capacitor } from '@capacitor/core';
import { REMOTE_CONFIG_BOUNDS, type RemoteConfigKey } from '../config/remoteConfigBounds';

export type { RemoteConfigKey } from '../config/remoteConfigBounds';

const fetched = new Map<RemoteConfigKey, number>();
let initialized = false;

/** Idempotent. Inert on web/test. */
export async function initRemoteConfig(): Promise<void> {
  if (initialized) return;
  initialized = true;
  if (!Capacitor.isNativePlatform()) return;
  // The Firebase JS SDK Remote Config requires the IndexedDB-backed init
  // path; on Capacitor this works inside the WebView. Wrapped in try/catch
  // since older Android WebViews can throw on indexedDB cold-init.
  try {
    const { initializeApp, getApps } = await import('firebase/app');
    const { getRemoteConfig, fetchAndActivate, getValue } = await import('firebase/remote-config');
    const app = getApps().length > 0 ? getApps()[0] : initializeApp({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    });
    const rc = getRemoteConfig(app);
    rc.settings.minimumFetchIntervalMillis = 60 * 60 * 1000; // CONST-OK 1-hour cache window
    await fetchAndActivate(rc);
    for (const key of Object.keys(REMOTE_CONFIG_BOUNDS) as RemoteConfigKey[]) {
      const raw = getValue(rc, key).asNumber();
      const b = REMOTE_CONFIG_BOUNDS[key];
      if (Number.isFinite(raw) && raw >= b.min && raw <= b.max) {
        fetched.set(key, raw);
      }
    }
  } catch (e) {
    // Never throw — Remote Config is optional infrastructure.
    console.error('[remoteConfig] init failed:', e);
  }
}

/**
 * Read a remote-overridden value, falling back to the local SYNAPSE_CONSTANTS
 * value when no valid fetch is available. Bounds-validated at fetch time.
 *
 * Engine consumers DO NOT call this yet (deferred to v1.1 — see file header).
 * Exposed now so non-engine consumers (UI defaults, tutorial pacing) can
 * opt-in without architectural churn.
 */
export function getRemoteValue(key: RemoteConfigKey): number {
  return fetched.get(key) ?? REMOTE_CONFIG_BOUNDS[key].fallback;
}

/** Test-only — wipe between tests. */
export function __resetRemoteConfigForTests(): void {
  fetched.clear();
  initialized = false;
}
