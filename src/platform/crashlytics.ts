// Sprint 10 Phase 10.7 — Firebase Crashlytics non-fatal error reporting.
//
// Wraps @capacitor-firebase/crashlytics. Web/test stays inert (returns no-op
// stubs). Per Sprint 10 spec, non-fatal errors are logged for: save load
// failure, migration failure, ad SDK timeout, RevenueCat timeout. Callers
// invoke `crashlytics.recordError(tag, err)` from the relevant catch sites.
//
// Crashlytics requires native config (google-services.json on Android,
// GoogleService-Info.plist on iOS) — both already present from Sprint 9b.

import { Capacitor } from '@capacitor/core';

export interface Crashlytics {
  setEnabled: (enabled: boolean) => Promise<void>;
  recordError: (tag: string, err: unknown) => Promise<void>;
  log: (message: string) => Promise<void>;
}

export function createCrashlytics(): Crashlytics {
  if (!Capacitor.isNativePlatform()) {
    return {
      setEnabled: async () => {},
      recordError: async () => {},
      log: async () => {},
    };
  }

  const importPlugin = () => import('@capacitor-firebase/crashlytics');

  return {
    setEnabled: async (enabled) => {
      try {
        const { FirebaseCrashlytics } = await importPlugin();
        await FirebaseCrashlytics.setEnabled({ enabled });
      } catch (e) {
        console.error('[crashlytics] setEnabled failed:', e);
      }
    },
    recordError: async (tag, err) => {
      try {
        const { FirebaseCrashlytics } = await importPlugin();
        const message = err instanceof Error ? `${tag}: ${err.message}` : `${tag}: ${String(err)}`;
        const stacktrace = err instanceof Error && err.stack ? err.stack.split('\n').map((line) => ({ fileName: '', lineNumber: 0, methodName: line })) : []; // CONST-OK 0 placeholder per plugin shape
        await FirebaseCrashlytics.recordException({ message, stacktrace });
      } catch (e) {
        console.error('[crashlytics] recordError failed:', e);
      }
    },
    log: async (message) => {
      try {
        const { FirebaseCrashlytics } = await importPlugin();
        await FirebaseCrashlytics.log({ message });
      } catch (e) {
        console.error('[crashlytics] log failed:', e);
      }
    },
  };
}

// Module-singleton — lazy-instantiated on first import. Saves the cost of
// re-creating the inert stub each call site without holding plugin imports.
let cachedInstance: Crashlytics | null = null;
export function getCrashlytics(): Crashlytics {
  if (cachedInstance === null) cachedInstance = createCrashlytics();
  return cachedInstance;
}

/** Test-only — clears the singleton between tests. */
export function __resetCrashlyticsForTests(): void {
  cachedInstance = null;
}
