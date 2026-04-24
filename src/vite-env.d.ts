/// <reference types="vite/client" />

// CSS side-effect imports (Tailwind entry + safe-area utilities).
declare module '*.css';

// Fontsource packages ship CSS only (no TypeScript types).
// Side-effect imports register @font-face rules globally.
declare module '@fontsource-variable/outfit';
declare module '@fontsource-variable/jetbrains-mono';

// Sprint 9a Phase 9a.2 — typed env vars (subset; expand as new ones land).
// Phase 9a.5: rewarded ad unit env vars split per-platform (ANDROID/IOS pairs)
// because AdMob assigns ad unit IDs per app + per platform.
interface ImportMetaEnv {
  readonly VITE_REVENUECAT_IOS_KEY?: string;
  readonly VITE_REVENUECAT_ANDROID_KEY?: string;
  readonly VITE_ADMOB_IOS_APP_ID?: string;
  readonly VITE_ADMOB_ANDROID_APP_ID?: string;
  readonly VITE_ADMOB_REWARDED_OFFLINE_BOOST_ANDROID?: string;
  readonly VITE_ADMOB_REWARDED_POST_DISCHARGE_ANDROID?: string;
  readonly VITE_ADMOB_REWARDED_MUTATION_REROLL_ANDROID?: string;
  readonly VITE_ADMOB_REWARDED_DECISION_RETRY_ANDROID?: string;
  readonly VITE_ADMOB_REWARDED_PIGGY_REFILL_ANDROID?: string;
  readonly VITE_ADMOB_REWARDED_STREAK_SAVE_ANDROID?: string;
  readonly VITE_ADMOB_REWARDED_OFFLINE_BOOST_IOS?: string;
  readonly VITE_ADMOB_REWARDED_POST_DISCHARGE_IOS?: string;
  readonly VITE_ADMOB_REWARDED_MUTATION_REROLL_IOS?: string;
  readonly VITE_ADMOB_REWARDED_DECISION_RETRY_IOS?: string;
  readonly VITE_ADMOB_REWARDED_PIGGY_REFILL_IOS?: string;
  readonly VITE_ADMOB_REWARDED_STREAK_SAVE_IOS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
