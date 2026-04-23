// Sprint 7.8 Phase 7.8.3 — Balance Scout Sim unit tests.
// Validates the sim runs deterministically, produces bounded output, and
// exercises the Sprint 7.5-7.7 additions (Mood, Mastery, Shards).

import { describe, expect, test } from 'vitest';
import { runBalanceScoutSim } from '../../src/sim/balanceScoutSim';

describe('runBalanceScoutSim — deterministic execution', () => {
  test('completes a full 26-cycle run under a reasonable sim-time cap', () => {
    const result = runBalanceScoutSim({ tapRate: 5, archetype: 'analitica', pathway: 'rapida', label: 'test' });
    expect(result.cycles.length).toBe(26);
    expect(result.timedOut).toBe(false);
    expect(result.totalSimMs).toBeGreaterThan(0);
  });

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
  });

  test('no anomalies in default run (no NaN/Infinity/negative)', () => {
    const result = runBalanceScoutSim({ tapRate: 5, archetype: 'analitica', pathway: 'rapida', label: 'test' });
    expect(result.anomalies).toEqual([]);
  });

  test('no pathway config gracefully runs without pathway bonuses', () => {
    const result = runBalanceScoutSim({ tapRate: 5, archetype: 'analitica', pathway: null, label: 'no-path' });
    expect(result.cycles.length).toBe(26);
    expect(result.anomalies).toEqual([]);
  });

  test('no archetype config gracefully runs without archetype bonuses', () => {
    const result = runBalanceScoutSim({ tapRate: 5, archetype: null, pathway: 'rapida', label: 'no-arch' });
    expect(result.cycles.length).toBe(26);
    expect(result.anomalies).toEqual([]);
  });
});

describe('runBalanceScoutSim — Sprint 7.5-7.7 systems exercised', () => {
  test('Mastery accumulates: archetype mastery >= 26 after full P0→P26', () => {
    const result = runBalanceScoutSim({ tapRate: 5, archetype: 'empatica', pathway: 'profunda', label: 'test' });
    const final = result.cycles[result.cycles.length - 1];
    // 26 prestige completions × +1 archetype/pathway XP each should push masterySum >= 52
    // (cap at L10 per entity truncates past-10 but masterySum reads raw uses).
    expect(final.masterySum).toBeGreaterThan(40);
  });

  test('Shards accumulate across the run (episodic burst at every prestige)', () => {
    const result = runBalanceScoutSim({ tapRate: 5, archetype: 'analitica', pathway: 'rapida', label: 'test' });
    const totalEpi = result.cycles.reduce((sum, c) => sum + c.shardsEpi, 0);
    expect(totalEpi).toBeGreaterThan(0);
  });

  test('Mood drifts across cycles (not pinned at init value for the whole run)', () => {
    const result = runBalanceScoutSim({ tapRate: 5, archetype: 'analitica', pathway: 'rapida', label: 'test' });
    const moods = new Set(result.cycles.map((c) => c.mood));
    expect(moods.size).toBeGreaterThan(1);
  });
});

describe('runBalanceScoutSim — archetype differentiation', () => {
  test('Empática total sim time > Analítica (×0.85 active production penalty)', () => {
    const ana = runBalanceScoutSim({ tapRate: 5, archetype: 'analitica', pathway: 'rapida', label: 'ana' });
    const emp = runBalanceScoutSim({ tapRate: 5, archetype: 'empatica', pathway: 'rapida', label: 'emp' });
    expect(emp.totalSimMs).toBeGreaterThan(ana.totalSimMs);
  });

  test('higher tap rate shortens sim time (tap=10 faster than tap=2)', () => {
    const low = runBalanceScoutSim({ tapRate: 2, archetype: 'analitica', pathway: 'rapida', label: 'low' });
    const high = runBalanceScoutSim({ tapRate: 10, archetype: 'analitica', pathway: 'rapida', label: 'high' });
    expect(high.totalSimMs).toBeLessThan(low.totalSimMs);
  });
});
