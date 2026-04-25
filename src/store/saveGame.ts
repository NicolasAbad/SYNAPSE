// Implements docs/GDD.md §Sprint 1 save system + CODE-6 (save only on
// prestige + background + 30s interval, NEVER on tick).
// Uses Capacitor Preferences (NOT localStorage — iOS/Android native
// storage that survives app updates). Storage key versioned for
// future migrations.

import { Preferences } from '@capacitor/preferences';
import type { GameState } from '../types/GameState';
import { SYNAPSE_CONSTANTS } from '../config/constants';
import { migrateState } from './migrate';

/** Versioned storage key. v1 = current schema; migrateState() backfills missing fields per CODE-6. */
const SAVE_KEY = 'synapse.save.v1';

export async function saveGame(state: GameState): Promise<void> {
  const payload = JSON.stringify(state);
  await Preferences.set({ key: SAVE_KEY, value: payload });
}

export async function loadGame(): Promise<GameState | null> {
  const result = await Preferences.get({ key: SAVE_KEY });
  if (result.value === null) return null;
  try {
    const parsed = JSON.parse(result.value) as unknown;
    // Sprint 7.5.1: backfill new schema fields for legacy saves before
    // structural validation. migrateState is defensive — non-objects pass
    // through so the validator can reject them for the right reason.
    return validateLoadedState(migrateState(parsed));
  } catch (e) {
    console.error('[saveGame] Failed to parse save:', e);
    return null;
  }
}

export async function clearSave(): Promise<void> {
  await Preferences.remove({ key: SAVE_KEY });
}

/**
 * Boundary defense against corrupt/malicious saves. Structural shape check only:
 * verifies payload is a non-null plain object with exactly 132 top-level keys
 * (the §32 GameState invariant post-Sprint-10.1). Deep field-by-field type
 * validation would require a runtime schema (adds ~500 lines); deferred to
 * Sprint 11a save fuzzer. For v1.0, structural check + JSON parse is sufficient
 * — any surviving bad fields will surface as runtime errors caught by the
 * relevant action handler.
 *
 * Returns null (not throws) so the caller can fall back to createDefaultState
 * silently, per UI-8 (error states fail gracefully).
 */
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
  return parsed as GameState;
}
