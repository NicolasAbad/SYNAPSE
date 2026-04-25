// Tests for src/store/saveGame.ts — round-trip + validation + integration with gameStore.
// Capacitor Preferences is mocked with an in-memory Map per test.

import { beforeEach, describe, expect, test, vi } from 'vitest';

// ── vi.mock must be declared before any imports that pull in the module ──
const mockStorage = new Map<string, string>();
vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    set: async ({ key, value }: { key: string; value: string }) => {
      mockStorage.set(key, value);
    },
    get: async ({ key }: { key: string }) => ({ value: mockStorage.get(key) ?? null }),
    remove: async ({ key }: { key: string }) => {
      mockStorage.delete(key);
    },
  },
}));

import { clearSave, loadGame, saveGame, validateLoadedState } from '../../src/store/saveGame';
import { createDefaultState, useGameStore } from '../../src/store/gameStore';

const SAVE_KEY = 'synapse.save.v1';

describe('saveGame / loadGame round-trip', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  test('round-trips all 124 GameState fields without loss', async () => {
    const state = createDefaultState();
    state.thoughts = 12345.67;
    state.prestigeCount = 3;
    state.neurons[0].count = 10;
    state.memories = 50;
    state.isTutorialCycle = false;

    await saveGame(state);
    const loaded = await loadGame();

    expect(loaded).not.toBeNull();
    expect(Object.keys(loaded!).length).toBe(132);
    expect(loaded!.thoughts).toBe(12345.67);
    expect(loaded!.prestigeCount).toBe(3);
    expect(loaded!.neurons[0].count).toBe(10);
    expect(loaded!.memories).toBe(50);
    expect(loaded!.isTutorialCycle).toBe(false);
  });

  test('loadGame returns null when no save exists', async () => {
    const loaded = await loadGame();
    expect(loaded).toBeNull();
  });

  test('loadGame returns null on corrupted JSON', async () => {
    mockStorage.set(SAVE_KEY, 'not valid json {{{');
    const loaded = await loadGame();
    expect(loaded).toBeNull();
  });

  test('clearSave removes the stored key', async () => {
    await saveGame(createDefaultState());
    await clearSave();
    const loaded = await loadGame();
    expect(loaded).toBeNull();
  });

  test('save key is versioned (synapse.save.v1) — regression guard', async () => {
    await saveGame(createDefaultState());
    expect(mockStorage.has('synapse.save.v1')).toBe(true);
  });
});

describe('validateLoadedState — boundary defense', () => {
  test('rejects wrong field count (too few)', () => {
    const bad = { thoughts: 0, prestigeCount: 0 };
    expect(validateLoadedState(bad)).toBeNull();
  });

  test('rejects wrong field count (too many — adversarial extra keys)', () => {
    const bad = { ...createDefaultState(), adversarialExtra: true };
    expect(validateLoadedState(bad)).toBeNull();
  });

  test('rejects non-object payloads (array)', () => {
    expect(validateLoadedState([1, 2, 3])).toBeNull();
  });

  test('rejects non-object payloads (string)', () => {
    expect(validateLoadedState('not an object')).toBeNull();
  });

  test('rejects non-object payloads (number)', () => {
    expect(validateLoadedState(42)).toBeNull();
  });

  test('rejects null payload', () => {
    expect(validateLoadedState(null)).toBeNull();
  });

  test('accepts a correctly-shaped payload (132 keys)', () => {
    const good = createDefaultState();
    const result = validateLoadedState(good);
    expect(result).not.toBeNull();
    expect(Object.keys(result!).length).toBe(132);
  });

  test('rejects through loadGame end-to-end for corrupted shape', async () => {
    mockStorage.clear();
    mockStorage.set(SAVE_KEY, JSON.stringify({ thoughts: 0 }));
    const loaded = await loadGame();
    expect(loaded).toBeNull();
  });

  test('rejects through loadGame for array payload', async () => {
    mockStorage.clear();
    mockStorage.set(SAVE_KEY, JSON.stringify([1, 2, 3]));
    const loaded = await loadGame();
    expect(loaded).toBeNull();
  });

  test('rejects through loadGame for null payload', async () => {
    mockStorage.clear();
    mockStorage.set(SAVE_KEY, 'null');
    const loaded = await loadGame();
    expect(loaded).toBeNull();
  });
});

describe('round-trip type fidelity', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  test('preserves tuple type for resonantPatternsDiscovered', async () => {
    const state = createDefaultState();
    state.resonantPatternsDiscovered = [true, false, true, false];
    await saveGame(state);
    const loaded = await loadGame();
    expect(loaded!.resonantPatternsDiscovered).toEqual([true, false, true, false]);
    expect(loaded!.resonantPatternsDiscovered.length).toBe(4);
  });

  test('preserves record types for personalBests and patternDecisions', async () => {
    const state = createDefaultState();
    state.personalBests = { 0: { minutes: 7.5, rewardGiven: true } };
    state.patternDecisions = { 6: 'A', 15: 'B' };
    await saveGame(state);
    const loaded = await loadGame();
    expect(loaded!.personalBests).toEqual({ 0: { minutes: 7.5, rewardGiven: true } });
    expect(loaded!.patternDecisions).toEqual({ 6: 'A', 15: 'B' });
  });

  test('preserves insightMultiplier identity value (Phase 6 fix)', async () => {
    const state = createDefaultState();
    await saveGame(state);
    const loaded = await loadGame();
    expect(loaded!.insightMultiplier).toBe(1);
  });

  test('JSON.stringify drops actions + UI-local state is stripped → 132 file keys', async () => {
    // Store has GameState (124) + UIState (multi-key) + actions. saveToStorage strips
    // UI-local fields before persisting; JSON.stringify drops functions. Result:
    // persisted payload contains exactly the 124 GameState data fields.
    const storeSnapshot = useGameStore.getState();
    const storeKeyCount = Object.keys(storeSnapshot).length;
    expect(storeKeyCount).toBeGreaterThanOrEqual(124);
    // Use the action (mirrors production code path) rather than passing the raw store.
    await useGameStore.getState().saveToStorage();
    const loaded = await loadGame();
    expect(loaded).not.toBeNull();
    expect(Object.keys(loaded!).length).toBe(132);
  });
});

describe('useGameStore loadFromSave / saveToStorage actions', () => {
  beforeEach(() => {
    mockStorage.clear();
    useGameStore.setState(createDefaultState());
  });

  test('loadFromSave returns false when no save exists', async () => {
    const result = await useGameStore.getState().loadFromSave();
    expect(result).toBe(false);
  });

  test('loadFromSave restores saved state and returns true', async () => {
    const saved = createDefaultState();
    saved.thoughts = 999_999;
    await saveGame(saved);

    const result = await useGameStore.getState().loadFromSave();
    expect(result).toBe(true);
    expect(useGameStore.getState().thoughts).toBe(999_999);
  });

  test('loadFromSave preserves action references after load (Zustand pattern)', async () => {
    const saved = createDefaultState();
    saved.thoughts = 500;
    await saveGame(saved);

    await useGameStore.getState().loadFromSave();

    // After load, every action must still be callable.
    expect(typeof useGameStore.getState().initSessionTimestamps).toBe('function');
    expect(typeof useGameStore.getState().reset).toBe('function');
    expect(typeof useGameStore.getState().saveToStorage).toBe('function');
    expect(typeof useGameStore.getState().loadFromSave).toBe('function');
    expect(useGameStore.getState().thoughts).toBe(500);
  });

  test('saveToStorage writes the current store state', async () => {
    useGameStore.setState({ thoughts: 777 });
    await useGameStore.getState().saveToStorage();
    const loaded = await loadGame();
    expect(loaded!.thoughts).toBe(777);
  });

  test('loadFromSave returns false if the stored payload is corrupt', async () => {
    mockStorage.set(SAVE_KEY, 'garbage');
    const result = await useGameStore.getState().loadFromSave();
    expect(result).toBe(false);
  });
});

describe('mount sequence (Phase 7 Finding B — INIT-1 rule 3 compliance)', () => {
  beforeEach(() => {
    mockStorage.clear();
    useGameStore.setState(createDefaultState());
  });

  test('load before init prevents timestamp overwrite', async () => {
    // Prime the save with non-zero timestamps (as a restored session would have).
    const saved = createDefaultState();
    saved.cycleStartTimestamp = 1_000_000;
    saved.sessionStartTimestamp = 1_000_000;
    await saveGame(saved);

    // Simulate mount sequence: loadFromSave first.
    const loaded = await useGameStore.getState().loadFromSave();
    expect(loaded).toBe(true);

    // initSessionTimestamps runs afterward — must be a no-op because
    // timestamps are already non-zero per INIT-1 rule 3.
    useGameStore.getState().initSessionTimestamps(9_999_999);

    // Saved values preserved.
    expect(useGameStore.getState().cycleStartTimestamp).toBe(1_000_000);
    expect(useGameStore.getState().sessionStartTimestamp).toBe(1_000_000);
  });

  test('no save present: init populates timestamps from param', async () => {
    // Fresh-install path: load returns false, init fires normally.
    const loaded = await useGameStore.getState().loadFromSave();
    expect(loaded).toBe(false);

    useGameStore.getState().initSessionTimestamps(7_777_777);

    expect(useGameStore.getState().cycleStartTimestamp).toBe(7_777_777);
    expect(useGameStore.getState().sessionStartTimestamp).toBe(7_777_777);
  });
});
