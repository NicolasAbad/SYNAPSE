import { Preferences } from '@capacitor/preferences';
import { migrateState } from './migrate';
import { buildInitialState } from '@/store/initialState';
import type { GameState } from '@/types';

const STORAGE_KEY = 'synapse:gameState:v1';

export async function saveGame(state: GameState): Promise<void> {
  try {
    await Preferences.set({
      key: STORAGE_KEY,
      value: JSON.stringify(state),
    });
  } catch {
    // Storage failure: continue with in-memory state per CODE-8
  }
}

export async function loadGame(): Promise<GameState | null> {
  try {
    const { value } = await Preferences.get({ key: STORAGE_KEY });
    if (!value) return null;
    const parsed = JSON.parse(value) as Partial<GameState>;
    return migrateState(parsed, buildInitialState());
  } catch {
    return null;
  }
}

export async function clearSave(): Promise<void> {
  try {
    await Preferences.remove({ key: STORAGE_KEY });
  } catch {
    // ignore
  }
}
