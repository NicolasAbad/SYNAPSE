import { Preferences } from '@capacitor/preferences';
import type { StateStorage } from 'zustand/middleware';

export const capacitorStorage: StateStorage = {
  async getItem(name: string): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key: name });
      return value;
    } catch {
      return null;
    }
  },
  async setItem(name: string, value: string): Promise<void> {
    try {
      await Preferences.set({ key: name, value });
    } catch {
      // Storage failure: continue with in-memory state per CODE-8
    }
  },
  async removeItem(name: string): Promise<void> {
    try {
      await Preferences.remove({ key: name });
    } catch {
      // Storage failure: continue with in-memory state per CODE-8
    }
  },
};
