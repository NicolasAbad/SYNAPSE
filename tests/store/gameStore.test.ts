// Tests for src/store/gameStore.ts — createDefaultState purity + Zustand actions.
// GDD §32 (GameState), §33 (PRESTIGE split), §35 INIT-1.

import { beforeEach, describe, expect, test } from 'vitest';
import { createDefaultState, useGameStore } from '../../src/store/gameStore';
import { SYNAPSE_CONSTANTS } from '../../src/config/constants';
import type { GameState } from '../../src/types/GameState';

describe('createDefaultState — field count and purity', () => {
  test('returns state with exactly 110 top-level keys (§32 invariant)', () => {
    const s = createDefaultState();
    expect(Object.keys(s).length).toBe(110);
  });

  test('is pure — calling twice returns deep-equal state (INIT-1, CODE-9)', () => {
    const a = createDefaultState();
    const b = createDefaultState();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  test('JSON round-trip preserves all 110 fields (no Date/function/symbol leakage)', () => {
    const s = createDefaultState();
    const roundTripped = JSON.parse(JSON.stringify(s)) as GameState;
    expect(Object.keys(roundTripped).length).toBe(110);
  });
});

describe('createDefaultState — 12 non-trivial initial values (§32 2B-1b + Phase 6)', () => {
  test('sets 12 non-trivial initial values correctly', () => {
    const s = createDefaultState();
    expect(s.isTutorialCycle).toBe(true); // TUTOR-2
    expect(s.neurons).toHaveLength(5);
    expect(s.neurons[0]).toEqual({ type: 'basica', count: 1 });
    expect(s.neurons.slice(1).every((n) => n.count === 0)).toBe(true);
    expect(s.connectionMult).toBe(1);
    expect(s.dischargeMaxCharges).toBe(2);
    expect(s.focusFillRate).toBe(0.01);
    expect(s.currentOfflineCapHours).toBe(4);
    expect(s.currentOfflineEfficiency).toBe(0.5);
    expect(s.eraVisualTheme).toBe('bioluminescent');
    expect(s.gameVersion).toBe('1.0.0');
    expect(s.currentThreshold).toBe(25_000); // TUTOR-2 (retuned Sprint 3 Phase 7.4b)
    expect(s.insightMultiplier).toBe(1); // 12th (Phase 6)
    expect(s.weeklyChallenge).toEqual({
      id: '',
      weekStartTimestamp: 0,
      progress: 0,
      target: 0,
      rewardClaimed: false,
    });
  });

  test('resonantPatternsDiscovered is a 4-tuple of false (not empty array)', () => {
    const s = createDefaultState();
    expect(s.resonantPatternsDiscovered).toEqual([false, false, false, false]);
    expect(s.resonantPatternsDiscovered.length).toBe(4);
  });
});

describe('createDefaultState — 4 impure timestamp fields stay at pure defaults (INIT-1)', () => {
  test('cycleStartTimestamp, lastActiveTimestamp, dischargeLastTimestamp === 0', () => {
    const s = createDefaultState();
    expect(s.cycleStartTimestamp).toBe(0);
    expect(s.lastActiveTimestamp).toBe(0);
    expect(s.dischargeLastTimestamp).toBe(0);
  });

  test('sessionStartTimestamp === null', () => {
    const s = createDefaultState();
    expect(s.sessionStartTimestamp).toBeNull();
  });
});

describe('createDefaultState — type-based defaults (spot checks)', () => {
  test('numeric fields default to 0', () => {
    const s = createDefaultState();
    expect(s.thoughts).toBe(0);
    expect(s.memories).toBe(0);
    expect(s.sparks).toBe(0);
    expect(s.cycleGenerated).toBe(0);
    expect(s.totalGenerated).toBe(0);
    expect(s.prestigeCount).toBe(0);
    expect(s.lifetimePrestiges).toBe(0);
    expect(s.transcendenceCount).toBe(0);
    expect(s.resonance).toBe(0);
    expect(s.piggyBankSparks).toBe(0);
  });

  test('array fields default to empty arrays', () => {
    const s = createDefaultState();
    expect(s.upgrades).toEqual([]);
    expect(s.awakeningLog).toEqual([]);
    expect(s.lastTapTimestamps).toEqual([]);
    expect(s.diaryEntries).toEqual([]);
    expect(s.achievementsUnlocked).toEqual([]);
    expect(s.cycleNeuronPurchases).toEqual([]);
    expect(s.ownedNeuronSkins).toEqual([]);
  });

  test('record fields default to empty objects', () => {
    const s = createDefaultState();
    expect(s.personalBests).toEqual({});
    expect(s.patternDecisions).toEqual({});
  });

  test('nullable fields default to null', () => {
    const s = createDefaultState();
    expect(s.insightEndTime).toBeNull();
    expect(s.currentPolarity).toBeNull();
    expect(s.currentMutation).toBeNull();
    expect(s.currentPathway).toBeNull();
    expect(s.archetype).toBeNull();
    expect(s.currentMentalState).toBeNull();
  });

  test('boolean fields default to false', () => {
    const s = createDefaultState();
    expect(s.insightActive).toBe(false);
    expect(s.consciousnessBarUnlocked).toBe(false);
    expect(s.spontaneousMemoryUsed).toBe(false);
    expect(s.piggyBankBroken).toBe(false);
    expect(s.isSubscribed).toBe(false);
  });
});

describe('useGameStore — initSessionTimestamps action (INIT-1)', () => {
  beforeEach(() => {
    // Partial reset: merge defaults into existing store (preserving action bindings).
    // A `true` flag would replace wholesale and strip the actions.
    useGameStore.setState(createDefaultState());
  });

  test('populates all 4 timestamp fields from nowTimestamp param when they are at pure defaults', () => {
    const now = 1_700_000_000_000;
    useGameStore.getState().initSessionTimestamps(now);
    const s = useGameStore.getState();
    expect(s.cycleStartTimestamp).toBe(now);
    expect(s.sessionStartTimestamp).toBe(now);
    expect(s.lastActiveTimestamp).toBe(now);
    expect(s.dischargeLastTimestamp).toBe(now);
  });

  test('does NOT overwrite non-zero cycleStartTimestamp (save-restore safety)', () => {
    useGameStore.setState({ cycleStartTimestamp: 12345 });
    useGameStore.getState().initSessionTimestamps(999_999);
    expect(useGameStore.getState().cycleStartTimestamp).toBe(12345);
  });

  test('does NOT overwrite non-null sessionStartTimestamp', () => {
    useGameStore.setState({ sessionStartTimestamp: 54321 });
    useGameStore.getState().initSessionTimestamps(999_999);
    expect(useGameStore.getState().sessionStartTimestamp).toBe(54321);
  });

  test('idempotent — calling twice with different timestamps does not re-write', () => {
    useGameStore.getState().initSessionTimestamps(1_000);
    useGameStore.getState().initSessionTimestamps(2_000);
    expect(useGameStore.getState().cycleStartTimestamp).toBe(1_000);
  });

  test('partial state: populates only the fields that are at pure defaults', () => {
    useGameStore.setState({ cycleStartTimestamp: 7777, lastActiveTimestamp: 0 });
    useGameStore.getState().initSessionTimestamps(9_000);
    const s = useGameStore.getState();
    expect(s.cycleStartTimestamp).toBe(7777); // preserved
    expect(s.lastActiveTimestamp).toBe(9_000); // populated
  });
});

describe('useGameStore — reset action', () => {
  test('restores createDefaultState', () => {
    useGameStore.setState({ thoughts: 1_000_000, prestigeCount: 5, isTutorialCycle: false });
    useGameStore.getState().reset();
    const s = useGameStore.getState();
    expect(s.thoughts).toBe(0);
    expect(s.prestigeCount).toBe(0);
    expect(s.isTutorialCycle).toBe(true);
    expect(s.insightMultiplier).toBe(1);
  });
});

// Sprint 3 Phase 4: full TAP-2 action replaces Phase 3 stub. P0 no-upgrade
// state hits the baseTapThoughtMin floor (1 thought), matching the prior
// stub behavior for backwards-compat with these invariants. Phase 4's
// tap.test.ts covers the richer TAP-2 formula + TAP-1 + Focus Bar fill.
describe('useGameStore — onTap action (TAP-2 default-state behavior)', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  test('default-state tap hits baseTapThoughtMin floor (1 thought)', () => {
    const before = useGameStore.getState().thoughts;
    useGameStore.getState().onTap(1000);
    const after = useGameStore.getState().thoughts;
    expect(after - before).toBe(SYNAPSE_CONSTANTS.baseTapThoughtMin);
  });

  test('two taps add 2 × baseTapThoughtMin at default state', () => {
    useGameStore.getState().onTap(1000);
    useGameStore.getState().onTap(2000);
    expect(useGameStore.getState().thoughts).toBe(SYNAPSE_CONSTANTS.baseTapThoughtMin * 2);
  });

  test('does not mutate memories / prestigeCount', () => {
    const before = useGameStore.getState();
    const memBefore = before.memories;
    const prestigeBefore = before.prestigeCount;
    useGameStore.getState().onTap(1000);
    const after = useGameStore.getState();
    expect(after.memories).toBe(memBefore);
    expect(after.prestigeCount).toBe(prestigeBefore);
  });

  test('fills focus bar by focusFillRate on tap (FOCUS-2)', () => {
    const before = useGameStore.getState().focusBar;
    useGameStore.getState().onTap(1000);
    const after = useGameStore.getState().focusBar;
    expect(after - before).toBeCloseTo(SYNAPSE_CONSTANTS.focusFillPerTap, 6);
  });

  test('pushes timestamp to lastTapTimestamps buffer', () => {
    useGameStore.getState().onTap(1234);
    expect(useGameStore.getState().lastTapTimestamps).toEqual([1234]);
    useGameStore.getState().onTap(5678);
    expect(useGameStore.getState().lastTapTimestamps).toEqual([1234, 5678]);
  });

  test('action references preserved after call (Zustand pitfall per CLAUDE.md)', () => {
    const beforeRef = useGameStore.getState().onTap;
    useGameStore.getState().onTap(1000);
    const afterRef = useGameStore.getState().onTap;
    expect(afterRef).toBe(beforeRef);
    expect(useGameStore.getState().reset).toBeTypeOf('function');
    expect(useGameStore.getState().initSessionTimestamps).toBeTypeOf('function');
  });
});
