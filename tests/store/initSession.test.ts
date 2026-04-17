// Tests for src/store/initSession.ts — INIT-1 React boundary.
//
// Current limitation: react-testing-library and jsdom are not installed
// (no new deps without blessing). A proper render test would mount a
// component using useInitSession() and verify the hook dispatches once.
// Instead this file verifies the action itself via the store (the hook's
// only observable effect is calling the action). A full render-based test
// should land alongside HUD component tests in Sprint 2 when
// @testing-library/react + jsdom are added for canvas/component testing.

import { beforeEach, describe, expect, test } from 'vitest';
import { createDefaultState, useGameStore } from '../../src/store/gameStore';

describe('useInitSession contract (observed via store action)', () => {
  beforeEach(() => {
    useGameStore.setState(createDefaultState());
  });

  test('calling the action with Date.now() populates all 4 timestamp fields', () => {
    const now = Date.now();
    useGameStore.getState().initSessionTimestamps(now);
    const s = useGameStore.getState();
    expect(s.cycleStartTimestamp).toBe(now);
    expect(s.sessionStartTimestamp).toBe(now);
    expect(s.lastActiveTimestamp).toBe(now);
    expect(s.dischargeLastTimestamp).toBe(now);
    // Sanity: within a second of the real clock.
    expect(Math.abs(s.cycleStartTimestamp - Date.now())).toBeLessThan(1_000);
  });

  // TODO Sprint 2: add a true render test using @testing-library/react +
  // jsdom. Mount a test component that calls useInitSession(); assert the
  // store's cycleStartTimestamp is populated. Covered here via the action
  // contract because the hook is a one-line useEffect wrapper.
});
