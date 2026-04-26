// Sprint 11a Phase 11a.4 — canonical snapshot validation gate (Gate 5 of
// scripts/check-invention.sh per POSTLAUNCH 6A-2 + SPRINTS.md §Sprint 11a
// line 1019). Elevated from v1.1 due to 2 Sprint 1 fabrications.
//
// What this is: a hardcoded list of values that the live implementation
// MUST produce. Any drift means the implementation diverged from the spec
// snapshot — fix the code (or update the spec + this snapshot in lockstep),
// not the test.
//
// What this is NOT: a balance-tuning test. Values like baseThresholdTable[0]
// CAN move during balance tuning sprints; when they do, this test must be
// updated as part of the same commit. The point is to make tuning visible —
// no silent threshold change, ever.
//
// Snapshot list (per SPRINTS.md line 1019):
//   - mulberry32(12345)() first 3 values
//   - hash("0") === 890022063
//   - softCap(100/200/1000/10000)
//   - calculateThreshold(0,0 / 0,1 / 25,2 / 25,5)

import { describe, expect, test } from 'vitest';
import { mulberry32, hash } from '../../src/engine/rng';
import { softCap, calculateThreshold } from '../../src/engine/production';

describe('Canonical snapshots — Gate 5 (POSTLAUNCH 6A-2)', () => {
  test('mulberry32(12345)() first three values match the GDD §30 RNG-1 spec', () => {
    const r = mulberry32(12345);
    expect(r()).toBe(0.9797282677609473);
    expect(r()).toBe(0.3067522644996643);
    expect(r()).toBe(0.484205421525985);
  });

  test('hash("0") === 890022063 (FNV-1a 32-bit, GDD §30)', () => {
    expect(hash('0')).toBe(890022063);
  });

  test('softCap snapshots — identity at 100, monotonic + concave above', () => {
    expect(softCap(100)).toBe(100);
    expect(softCap(200)).toBe(164.71820345351463);
    expect(softCap(1000)).toBe(524.8074602497726);
    expect(softCap(10000)).toBe(2754.2287033381663);
  });

  test('calculateThreshold snapshots — current baseline (Sprint 8c-tuning baseline restored)', () => {
    expect(calculateThreshold(0, 0)).toBe(800_000);
    expect(calculateThreshold(0, 1)).toBe(2_800_000);
    expect(calculateThreshold(25, 2)).toBe(42_000_000_000);
    expect(calculateThreshold(25, 5)).toBe(105_000_000_000);
  });
});
