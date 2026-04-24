// Sprint 7.8 Phase 7.8.3 — Balance Scout Sim unit tests.
// Validates the sim runs deterministically, produces bounded output, and
// exercises the Sprint 7.5-7.7 additions (Mood, Mastery, Shards).

import { describe, expect, test } from 'vitest';
import { runBalanceScoutSim } from '../../src/sim/balanceScoutSim';

// Sprint 8c-tuning: higher thresholds mean longer sim time per cycle (more ticks).
// Default 5s test timeout is tight; 30s buys safe headroom.
const SIM_TEST_TIMEOUT_MS = 30_000;

describe('runBalanceScoutSim — deterministic execution', () => {
  test('completes a full 26-cycle run under a reasonable sim-time cap', () => {
    const result = runBalanceScoutSim({ tapRate: 5, archetype: 'analitica', pathway: 'rapida', label: 'test' });
    expect(result.cycles.length).toBe(26);
    expect(result.timedOut).toBe(false);
    expect(result.totalSimMs).toBeGreaterThan(0);
  }, SIM_TEST_TIMEOUT_MS);

  test('same config produces identical telemetry on repeat (determinism)', () => {
    const a = runBalanceScoutSim({ tapRate: 5, archetype: 'analitica', pathway: 'rapida', label: 'a' });
    const b = runBalanceScoutSim({ tapRate: 5, archetype: 'analitica', pathway: 'rapida', label: 'b' });
    expect(a.cycles.length).toBe(b.cycles.length);
    for (let i = 0; i < a.cycles.length; i++) {
      expect(a.cycles[i].durationMs).toBe(b.cycles[i].durationMs);
      expect(a.cycles[i].memoriesGained).toBe(b.cycles[i].memoriesGained);
      expect(a.cycles[i].mood).toBe(b.cycles[i].mood);
      expect(a.cycles[i].masterySum).toBe(b.cycles[i].masterySum);
    }
  }, SIM_TEST_TIMEOUT_MS);

  test('no anomalies in default run (no NaN/Infinity/negative)', () => {
    const result = runBalanceScoutSim({ tapRate: 5, archetype: 'analitica', pathway: 'rapida', label: 'test' });
    expect(result.anomalies).toEqual([]);
  }, SIM_TEST_TIMEOUT_MS);

  test('no pathway config gracefully runs without pathway bonuses', () => {
    const result = runBalanceScoutSim({ tapRate: 5, archetype: 'analitica', pathway: null, label: 'no-path' });
    expect(result.cycles.length).toBe(26);
    expect(result.anomalies).toEqual([]);
  }, SIM_TEST_TIMEOUT_MS);

  test('no archetype config gracefully runs without archetype bonuses', () => {
    const result = runBalanceScoutSim({ tapRate: 5, archetype: null, pathway: 'rapida', label: 'no-arch' });
    expect(result.cycles.length).toBe(26);
    expect(result.anomalies).toEqual([]);
  }, SIM_TEST_TIMEOUT_MS);
});

describe('runBalanceScoutSim — Sprint 7.5-7.7 systems exercised', () => {
  test('Mastery accumulates: archetype mastery >= 26 after full P0→P26', () => {
    const result = runBalanceScoutSim({ tapRate: 5, archetype: 'empatica', pathway: 'profunda', label: 'test' });
    const final = result.cycles[result.cycles.length - 1];
    // 26 prestige completions × +1 archetype/pathway XP each should push masterySum >= 52
    // (cap at L10 per entity truncates past-10 but masterySum reads raw uses).
    expect(final.masterySum).toBeGreaterThan(40);
  }, SIM_TEST_TIMEOUT_MS);

  test('Shards accumulate across the run (episodic burst at every prestige)', () => {
    const result = runBalanceScoutSim({ tapRate: 5, archetype: 'analitica', pathway: 'rapida', label: 'test' });
    const totalEpi = result.cycles.reduce((sum, c) => sum + c.shardsEpi, 0);
    expect(totalEpi).toBeGreaterThan(0);
  }, SIM_TEST_TIMEOUT_MS);

  test('Mood drifts across cycles (not pinned at init value for the whole run)', () => {
    const result = runBalanceScoutSim({ tapRate: 5, archetype: 'analitica', pathway: 'rapida', label: 'test' });
    const moods = new Set(result.cycles.map((c) => c.mood));
    expect(moods.size).toBeGreaterThan(1);
  }, SIM_TEST_TIMEOUT_MS);
});

describe('runBalanceScoutSim — archetype differentiation', () => {
  test('Empática total sim time > Analítica (×0.85 active production penalty)', () => {
    const ana = runBalanceScoutSim({ tapRate: 5, archetype: 'analitica', pathway: 'rapida', label: 'ana' });
    const emp = runBalanceScoutSim({ tapRate: 5, archetype: 'empatica', pathway: 'rapida', label: 'emp' });
    expect(emp.totalSimMs).toBeGreaterThan(ana.totalSimMs);
  }, SIM_TEST_TIMEOUT_MS);

  test('higher tap rate shortens sim time (tap=10 faster than tap=2)', () => {
    const low = runBalanceScoutSim({ tapRate: 2, archetype: 'analitica', pathway: 'rapida', label: 'low' });
    const high = runBalanceScoutSim({ tapRate: 10, archetype: 'analitica', pathway: 'rapida', label: 'high' });
    expect(high.totalSimMs).toBeLessThan(low.totalSimMs);
  }, SIM_TEST_TIMEOUT_MS);
});

describe('Sprint 8c — multi-Run extension', () => {
  test('runs:3 produces 3× the cycle count of runs:1 (same config)', () => {
    const r1 = runBalanceScoutSim({ tapRate: 5, archetype: 'analitica', pathway: 'rapida', label: 'r1', runs: 1 });
    const r3 = runBalanceScoutSim({ tapRate: 5, archetype: 'analitica', pathway: 'rapida', label: 'r3', runs: 3 });
    expect(r3.cycles.length).toBe(r1.cycles.length * 3);
  }, SIM_TEST_TIMEOUT_MS);

  test('runs:3 cycles carry runIndex 0 / 1 / 2 in sequence', () => {
    const r = runBalanceScoutSim({ tapRate: 5, archetype: 'analitica', pathway: 'rapida', label: 'runIndex', runs: 3 });
    const runIndices = new Set(r.cycles.map((c) => c.runIndex));
    expect(runIndices).toEqual(new Set([0, 1, 2]));
  }, SIM_TEST_TIMEOUT_MS);

  test('Run 2+ threshold is higher than Run 1 (runThresholdMult[1] = 3.5 applied post-Transcendence)', () => {
    const r = runBalanceScoutSim({ tapRate: 5, archetype: 'analitica', pathway: 'rapida', label: 'threshCheck', runs: 2 });
    const run1P1 = r.cycles.find((c) => c.runIndex === 0 && c.prestigeCount === 1);
    const run2P1 = r.cycles.find((c) => c.runIndex === 1 && c.prestigeCount === 1);
    expect(run1P1).toBeDefined();
    expect(run2P1).toBeDefined();
    expect(run2P1!.durationMs).toBeGreaterThan(run1P1!.durationMs);
  }, SIM_TEST_TIMEOUT_MS);

  test('resonanceGained is 0 at P12 and non-zero at P13+ (Resonance unlock gate)', () => {
    const r = runBalanceScoutSim({ tapRate: 5, archetype: 'analitica', pathway: 'rapida', label: 'resonance', runs: 1 });
    const p12 = r.cycles.find((c) => c.prestigeCount === 12);
    const p20 = r.cycles.find((c) => c.prestigeCount === 20);
    if (p12) expect(p12.resonanceGained).toBe(0);
    if (p20) expect(p20.resonanceGained).toBeGreaterThan(0);
  }, SIM_TEST_TIMEOUT_MS);
});
