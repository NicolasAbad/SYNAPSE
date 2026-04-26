// Sprint 11a Phase 11a.4 — engine determinism gate per CODE-9 + SPRINTS.md
// §Sprint 11a line 1014 + 1040 ("same seed + same actions = identical state
// over 10,000 ticks").
//
// What this catches:
//   - Math.random() leaking into engine code (CODE-9 violation)
//   - Date.now() leaking into engine code (CODE-9 violation)
//   - Mutable shared state across tick() calls (returns new state, never
//     reuses references that could leak into the caller's view)
//   - Subtle non-determinism via Object key iteration order (rare but real)
//
// Strategy: build two structurally-identical states from createDefaultState
// (so all 133 fields are at their canonical defaults + a small set of
// neurons/upgrades/seeds is added to exercise more codepaths than the
// minimal idle case), then run 10,000 ticks against each at the same
// timestamp progression. JSON-stringify both and compare. Any drift means
// non-determinism leaked in.

import { describe, expect, test, vi } from 'vitest';
import { tick } from '../../src/engine/tick';
import { handlePrestige } from '../../src/engine/prestige';
import { createDefaultState } from '../../src/store/gameStore';
import type { GameState } from '../../src/types/GameState';

function buildSeededState(): GameState {
  // Start from a real default (133 fields) so every code path the tick
  // touches has its expected shape. Layer on enough state to exercise the
  // production loop, the spontaneous-event scheduler, and the discharge
  // accumulator on every tick.
  const s = createDefaultState();
  s.cycleStartTimestamp = 1_000_000;
  s.dischargeLastTimestamp = 1_000_000;
  s.lastSpontaneousCheck = 1_000_000;
  s.neurons = [
    { type: 'basica', count: 25 },
    { type: 'sensorial', count: 10 },
    { type: 'piramidal', count: 5 },
    { type: 'espejo', count: 2 },
    { type: 'integradora', count: 1 },
  ];
  s.connectionMult = 1.5;
  s.mutationSeed = 0xC0FFEE;
  s.isTutorialCycle = false;
  s.currentThreshold = 1_000_000_000_000; // way above what 10k ticks will produce
  return s;
}

describe('Engine determinism — 10,000-tick same-seed equality (CODE-9)', () => {
  test('two parallel runs with identical inputs produce byte-identical states (10k ticks)', () => {
    const T0 = 1_000_000;
    const TICK_MS = 100;
    const N = 10_000;

    let stateA = buildSeededState();
    let stateB = buildSeededState();

    for (let i = 0; i < N; i++) {
      const t = T0 + i * TICK_MS;
      stateA = tick(stateA, t).state;
      stateB = tick(stateB, t).state;
    }

    expect(JSON.stringify(stateA)).toBe(JSON.stringify(stateB));
  });

  test('determinism holds at intermediate checkpoints (catches drift earlier)', () => {
    const T0 = 1_000_000;
    const TICK_MS = 100;
    const checkpoints = [100, 1_000, 5_000, 10_000];

    let stateA = buildSeededState();
    let stateB = buildSeededState();

    for (let i = 1; i <= 10_000; i++) {
      const t = T0 + i * TICK_MS;
      stateA = tick(stateA, t).state;
      stateB = tick(stateB, t).state;
      if (checkpoints.includes(i)) {
        expect(JSON.stringify(stateA)).toBe(JSON.stringify(stateB));
      }
    }
  });

  test('handlePrestige is deterministic — same input + same timestamp → same outcome', () => {
    // The prestige reducer touches every field in the 133-field state via the
    // RESET/PRESERVE/UPDATE/LIFETIME splits. If non-determinism leaks in there,
    // every cycle transition would diverge.
    const s = buildSeededState();
    s.cycleGenerated = 5_000_000_000_000;
    s.currentThreshold = 1_000_000_000_000;
    s.isTutorialCycle = false;

    const ts = 9_999_999;
    const a = handlePrestige(s, ts);
    const b = handlePrestige(s, ts);
    expect(JSON.stringify(a.state)).toBe(JSON.stringify(b.state));
    expect(JSON.stringify(a.outcome)).toBe(JSON.stringify(b.outcome));
  });

  test('tick is pure — caller-held references to the input state are not mutated', () => {
    // Defensive check: the input GameState should not be visibly mutated by tick.
    // tick spreads its input into a fresh object internally; this test asserts
    // the caller's reference still holds its pre-tick values.
    const s = buildSeededState();
    const beforeJson = JSON.stringify(s);
    tick(s, 2_000_000);
    expect(JSON.stringify(s)).toBe(beforeJson);
  });

  test('CODE-9 enforcement — engine calls neither Math.random nor Date.now during 1k ticks', () => {
    // The "two parallel runs are JSON-equal" property cannot catch Math.random
    // leaks (both runs call it the same number of times in the same order, so
    // they get the same wall-clock-random sequence and stay equal). This spy
    // is the actual CODE-9 enforcement — any new engine code that calls
    // Math.random or Date.now will trip these assertions.
    const randomSpy = vi.spyOn(Math, 'random');
    const dateNowSpy = vi.spyOn(Date, 'now');

    let s = buildSeededState();
    for (let i = 0; i < 1_000; i++) s = tick(s, 1_000_000 + i * 100).state;

    expect(randomSpy).not.toHaveBeenCalled();
    expect(dateNowSpy).not.toHaveBeenCalled();

    randomSpy.mockRestore();
    dateNowSpy.mockRestore();
  });

  test('CODE-9 enforcement — handlePrestige calls neither Math.random nor Date.now', () => {
    const randomSpy = vi.spyOn(Math, 'random');
    const dateNowSpy = vi.spyOn(Date, 'now');

    const s = buildSeededState();
    s.cycleGenerated = 5_000_000_000_000;
    s.currentThreshold = 1_000_000_000_000;
    s.isTutorialCycle = false;
    handlePrestige(s, 9_999_999);

    expect(randomSpy).not.toHaveBeenCalled();
    expect(dateNowSpy).not.toHaveBeenCalled();

    randomSpy.mockRestore();
    dateNowSpy.mockRestore();
  });
});
