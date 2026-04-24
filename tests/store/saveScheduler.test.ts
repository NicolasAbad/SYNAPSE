// Tests for src/store/saveScheduler.ts — trySave() + anti-race logic.
//
// Current limitation (same as initSession.test.ts): no jsdom means no `document`
// or `window` to test the useSaveScheduler hook's event-listener lifecycle. The
// hook's body is a ~15-line useEffect that (a) sets up setInterval, (b) registers
// visibilitychange + beforeunload, (c) returns a cleanup function. Each individual
// trigger delegates to trySave(), which is the interesting unit.
//
// This file exhaustively tests trySave() including the anti-race flag. The
// event-listener wiring is covered via TODO for Sprint 2 when jsdom lands.

import { beforeEach, describe, expect, test, vi } from 'vitest';

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

import { createDefaultState, useGameStore } from '../../src/store/gameStore';
import { loadGame } from '../../src/store/saveGame';
import { __resetSaveInFlightForTests, trySave } from '../../src/store/saveScheduler';

describe('trySave — basic persistence', () => {
  beforeEach(() => {
    mockStorage.clear();
    useGameStore.setState(createDefaultState());
    __resetSaveInFlightForTests();
  });

  test('writes current store state to storage', async () => {
    useGameStore.setState({ thoughts: 123 });
    await trySave();
    const loaded = await loadGame();
    expect(loaded).not.toBeNull();
    expect(loaded!.thoughts).toBe(123);
  });

  test('saves the full 124-field payload', async () => {
    await trySave();
    const loaded = await loadGame();
    expect(Object.keys(loaded!).length).toBe(124);
  });

  test('sequential trySave calls produce consistent state', async () => {
    useGameStore.setState({ thoughts: 1 });
    await trySave();
    useGameStore.setState({ thoughts: 2 });
    await trySave();
    useGameStore.setState({ thoughts: 3 });
    await trySave();
    const loaded = await loadGame();
    expect(loaded!.thoughts).toBe(3);
  });
});

describe('trySave — anti-race guard', () => {
  beforeEach(() => {
    mockStorage.clear();
    useGameStore.setState(createDefaultState());
    __resetSaveInFlightForTests();
  });

  test('concurrent trySave invocations — only one writes per cycle', async () => {
    // Spy on Preferences.set via the mock by tracking calls through a counter
    // stored in the Map (since vi.mock factory already runs).
    let setCallCount = 0;
    const originalSet = mockStorage.set.bind(mockStorage);
    mockStorage.set = ((key: string, value: string) => {
      setCallCount++;
      return originalSet(key, value);
    }) as typeof mockStorage.set;

    useGameStore.setState({ thoughts: 100 });

    // Fire 5 concurrent trySave calls in parallel. The second-through-fifth
    // should observe saveInFlight === true and skip.
    const promises = [trySave(), trySave(), trySave(), trySave(), trySave()];
    await Promise.all(promises);

    // Exactly one underlying Preferences.set call (not 5).
    expect(setCallCount).toBe(1);

    // Restore the map's set method for other tests.
    mockStorage.set = originalSet;
  });

  test('after a save completes, subsequent trySave calls work normally', async () => {
    useGameStore.setState({ thoughts: 10 });
    await trySave(); // completes, saveInFlight resets to false

    useGameStore.setState({ thoughts: 20 });
    await trySave();

    const loaded = await loadGame();
    expect(loaded!.thoughts).toBe(20);
  });
});

describe('trySave — error handling', () => {
  beforeEach(() => {
    mockStorage.clear();
    useGameStore.setState(createDefaultState());
    __resetSaveInFlightForTests();
  });

  test('if saveGame throws, saveInFlight is reset (anti-deadlock)', async () => {
    // Break Preferences.set once via a one-shot override.
    const originalSet = mockStorage.set.bind(mockStorage);
    let shouldThrow = true;
    mockStorage.set = ((key: string, value: string) => {
      if (shouldThrow) {
        shouldThrow = false;
        throw new Error('simulated storage failure');
      }
      return originalSet(key, value);
    }) as typeof mockStorage.set;

    // First save throws but the finally-block clears saveInFlight.
    await trySave();

    // Second save should still succeed because the flag was reset.
    useGameStore.setState({ thoughts: 42 });
    await trySave();

    const loaded = await loadGame();
    expect(loaded!.thoughts).toBe(42);

    mockStorage.set = originalSet;
  });
});

// TODO Sprint 2: add tests for useSaveScheduler hook lifecycle once jsdom +
// @testing-library/react are available. Should verify:
//   - setInterval fires trySave every SYNAPSE_CONSTANTS.saveIntervalMs (30_000ms)
//   - document.visibilitychange with hidden=true triggers immediate trySave
//   - window.beforeunload triggers trySave
//   - cleanup on unmount clears interval + removes both listeners
