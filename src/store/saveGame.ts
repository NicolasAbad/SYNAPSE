// Implements docs/GDD.md §Sprint 1 save system + CODE-6 (save only on
// prestige + background + 30s interval, NEVER on tick).
// Uses Capacitor Preferences (NOT localStorage — iOS/Android native
// storage that survives app updates). Storage key versioned for
// future migrations.

import { Preferences } from '@capacitor/preferences';
import type { GameState } from '../types/GameState';
import { SYNAPSE_CONSTANTS } from '../config/constants';
import { migrateState } from './migrate';
import { getCrashlytics } from '../platform/crashlytics';

/** Versioned storage key. v1 = current schema; migrateState() backfills missing fields per CODE-6. */
const SAVE_KEY = 'synapse.save.v1';

export async function saveGame(state: GameState): Promise<void> {
  const payload = JSON.stringify(state);
  await Preferences.set({ key: SAVE_KEY, value: payload });
}

export async function loadGame(): Promise<GameState | null> {
  // Pre-launch audit Day 1: wrap Preferences.get itself — on Capacitor,
  // platform-level read failures (corrupted backing store, IO error,
  // permission denied) can throw before we get to the JSON.parse path.
  let result: { value: string | null };
  try {
    result = await Preferences.get({ key: SAVE_KEY });
  } catch (e) {
    console.error('[saveGame] Preferences.get failed:', e);
    void getCrashlytics().recordError('saveGame.preferencesGet', e);
    return null;
  }
  if (result.value === null) return null;
  try {
    const parsed = JSON.parse(result.value) as unknown;
    // Sprint 7.5.1: backfill new schema fields for legacy saves before
    // structural validation. migrateState is defensive — non-objects pass
    // through so the validator can reject them for the right reason.
    return validateLoadedState(migrateState(parsed));
  } catch (e) {
    console.error('[saveGame] Failed to parse save:', e);
    // Sprint 10 Phase 10.7 — non-fatal Crashlytics report (save load failure).
    void getCrashlytics().recordError('saveGame.load', e);
    return null;
  }
}

export async function clearSave(): Promise<void> {
  await Preferences.remove({ key: SAVE_KEY });
}

/**
 * Boundary defense against corrupt/malicious saves.
 *
 * Pre-launch audit Day 1: upgraded from structural-only to type-aware. The
 * Sprint 11a save fuzz only verified `migrateState` doesn't throw on garbage
 * — corrupted scalar values like `thoughts: "NaN"` could pass the field-count
 * check, then crash arithmetic in the engine on the next tick. We now check
 * the critical arithmetic-bearing scalar fields are finite numbers, and
 * structural fields are the right basic kind.
 *
 * Returns null (not throws) so the caller can fall back to createDefaultState
 * silently, per UI-8 (error states fail gracefully).
 */

type FieldKind = 'finite' | 'integer-or-null' | 'array' | 'boolean' | 'string';

// Critical fields used arithmetically in the engine on every tick. If any
// of these is non-finite (NaN/Infinity/string/null/undefined), the engine
// crashes. Order: economy, production, focus, discharge, prestige, cycle.
const CRITICAL_FIELD_KINDS: ReadonlyArray<readonly [string, FieldKind]> = [
  ['thoughts', 'finite'],
  ['memories', 'finite'],
  ['sparks', 'finite'],
  ['resonance', 'finite'],
  ['totalGenerated', 'finite'],
  ['cycleGenerated', 'finite'],
  ['baseProductionPerSecond', 'finite'],
  ['effectiveProductionPerSecond', 'finite'],
  ['focusBar', 'finite'],
  ['focusFillRate', 'finite'],
  ['dischargeCharges', 'finite'],
  ['dischargeMaxCharges', 'finite'],
  ['prestigeCount', 'finite'],
  ['currentThreshold', 'finite'],
  ['installedAt', 'finite'],
  ['cycleStartTimestamp', 'finite'],
  ['insightEndTime', 'integer-or-null'],
  ['eurekaExpiry', 'integer-or-null'],
  ['lucidDreamActiveUntil', 'integer-or-null'],
  ['firstEventsFired', 'array'],
];

function isFieldValid(value: unknown, kind: FieldKind): boolean {
  if (kind === 'finite') return typeof value === 'number' && Number.isFinite(value);
  if (kind === 'integer-or-null') return value === null || (typeof value === 'number' && Number.isFinite(value));
  if (kind === 'array') return Array.isArray(value);
  if (kind === 'boolean') return typeof value === 'boolean';
  if (kind === 'string') return typeof value === 'string';
  return false;
}

export function validateLoadedState(parsed: unknown): GameState | null {
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    console.error('[saveGame] validateLoadedState: payload is not a plain object:', typeof parsed);
    return null;
  }
  const keys = Object.keys(parsed);
  const expectedCount = SYNAPSE_CONSTANTS.GAMESTATE_FIELD_COUNT;
  if (keys.length !== expectedCount) {
    console.error(
      `[saveGame] validateLoadedState: expected ${expectedCount} fields, got ${keys.length}`,
    );
    return null;
  }
  const obj = parsed as Record<string, unknown>;
  for (const [field, kind] of CRITICAL_FIELD_KINDS) {
    if (!isFieldValid(obj[field], kind)) {
      console.error(`[saveGame] validateLoadedState: field "${field}" failed ${kind} check, got:`, obj[field]);
      return null;
    }
  }
  return parsed as GameState;
}
