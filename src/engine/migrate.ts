import type { GameState } from '@/types';

const CURRENT_GAME_VERSION = '0.1.0';

/**
 * Adds default values for any fields missing from a persisted state and
 * stamps gameVersion. Forward-compatible: keys absent from `persisted` inherit
 * from `defaults`. Caller passes defaults to keep engine free of store imports.
 *
 * Never throws — on bad input returns the defaults unchanged.
 */
export function migrateState(persisted: unknown, defaults: GameState): GameState {
  if (!persisted || typeof persisted !== 'object') {
    return { ...defaults };
  }
  const merged = { ...defaults, ...(persisted as Partial<GameState>) };
  merged.gameVersion = CURRENT_GAME_VERSION;
  return merged;
}
