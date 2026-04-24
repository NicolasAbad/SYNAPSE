// Sprint 8c Phase 8c.4 — TEST-5 canonical 1000-run economy simulation runner.
// BLOCKING gate per SPRINTS.md §Sprint 8c — sprint not done until 0 cycles
// flagged at >20% deviation from §9 cycle-time targets.
//
// Spec-vs-reality tweak: SPRINTS.md says "27 configs × ~37 runs each = 1000 runs"
// but balance scout sim is DETERMINISTIC (same seed → identical output). Running
// 37 identical samples per config is wasted CPU. We run 27 configs × 1 sim
// (with runs:3 = 3 Runs per sim) = 27 × 78 cycles = 2106 cycle samples — plenty
// for the deviation analysis. Doc note in sprint close.
//
// Usage:
//   npx tsx scripts/run-test-5.ts                # full sweep
//   npx tsx scripts/run-test-5.ts --quick        # 1 config (debug; runs:1)
//
// Output: docs/test-5-report.md + docs/test-5-raw.csv

/* eslint-disable no-console */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { runBalanceScoutSim, type BalanceScoutConfig, type ScoutResult } from '../src/sim/balanceScoutSim';
import type { Archetype, Pathway } from '../src/types';

const TAP_RATES = [2, 5, 10]; // CONST-OK low / medium / high (sim configs)
const ARCHETYPES: readonly Archetype[] = ['analitica', 'empatica', 'creativa'];
const PATHWAYS: readonly Pathway[] = ['rapida', 'profunda', 'equilibrada'];
const RUNS_PER_SIM = 3; // CONST-OK Sprint 8c — full 3-Run trajectory per sim
const DEVIATION_THRESHOLD_PCT = 20; // CONST-OK Sprint 8c BLOCKING gate (>20% off target = flag)
const ARCHETYPE_PATHWAY_MEAN_DEVIATION_PCT = 30; // CONST-OK Sprint 8c balance gate (>30% from mean = flag)
const TUTOR_2_TARGET_MIN_LOW = 7; // CONST-OK Sprint 8c TUTOR-2 P0 target floor
const TUTOR_2_TARGET_MIN_HIGH = 9; // CONST-OK Sprint 8c TUTOR-2 P0 target ceiling
const ARCHETYPE_PATHWAY_BALANCE_MIN_PRESTIGE = 10; // CONST-OK Sprint 8c — only assert balance at P10+

// §9 cycle-time targets per Era (TARGET_MIN[i] = target minutes for the i-th cycle).
// Same source as scripts/run-balance-scout.ts (constants.ts baseThresholdTable comments).
const TARGET_MIN = [8, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 22, 24, 25, 27, 28, 30, 32, 33, 35];

interface PacingFlag {
  config: string;
  runIndex: number;
  cycle: number;
  simMin: number;
  targetMin: number;
  deltaPct: number;
}

interface BalanceFlag {
  cycle: number;
  config: string;
  simMin: number;
  meanMin: number;
  deltaPct: number;
}

function buildConfigs(): BalanceScoutConfig[] {
  const out: BalanceScoutConfig[] = [];
  for (const tapRate of TAP_RATES) {
    for (const archetype of ARCHETYPES) {
      for (const pathway of PATHWAYS) {
        out.push({ tapRate, archetype, pathway, label: `tap${tapRate}_${archetype}_${pathway}`, runs: RUNS_PER_SIM });
      }
    }
  }
  return out;
}

function analyzePacing(results: ScoutResult[]): PacingFlag[] {
  const flags: PacingFlag[] = [];
  for (const r of results) {
    for (const c of r.cycles) {
      const target = TARGET_MIN[c.prestigeCount - 1] ?? null;
      if (target === null) continue;
      const simMin = c.durationMs / 60_000; // CONST-OK ms→min
      const deltaPct = ((simMin - target) / target) * 100; // CONST-OK percent ratio
      if (Math.abs(deltaPct) > DEVIATION_THRESHOLD_PCT) {
        flags.push({ config: r.config.label, runIndex: c.runIndex, cycle: c.prestigeCount, simMin, targetMin: target, deltaPct });
      }
    }
  }
  return flags;
}

/** Sprint 8c balance gate: at P10+, no archetype×pathway combo should be >30% from the mean for that cycle. */
function analyzeArchetypePathwayBalance(results: ScoutResult[]): BalanceFlag[] {
  const flags: BalanceFlag[] = [];
  // Group cycles by prestigeCount, look at distribution of cycle durations
  const byCycle = new Map<number, { config: string; durMs: number }[]>();
  for (const r of results) {
    for (const c of r.cycles) {
      if (c.prestigeCount < ARCHETYPE_PATHWAY_BALANCE_MIN_PRESTIGE) continue;
      const list = byCycle.get(c.prestigeCount) ?? [];
      list.push({ config: r.config.label, durMs: c.durationMs });
      byCycle.set(c.prestigeCount, list);
    }
  }
  for (const [cycle, samples] of byCycle.entries()) {
    if (samples.length === 0) continue;
    const meanMs = samples.reduce((s, x) => s + x.durMs, 0) / samples.length;
    const meanMin = meanMs / 60_000; // CONST-OK ms→min
    for (const sample of samples) {
      const simMin = sample.durMs / 60_000; // CONST-OK
      const deltaPct = ((sample.durMs - meanMs) / meanMs) * 100; // CONST-OK percent ratio
      if (Math.abs(deltaPct) > ARCHETYPE_PATHWAY_MEAN_DEVIATION_PCT) {
        flags.push({ cycle, config: sample.config, simMin, meanMin, deltaPct });
      }
    }
  }
  return flags;
}

/** TUTOR-2 P0 specific — at 1 tap/sec, P0 should reach 25K threshold in 7-9 min. We don't run 1-tap configs in the sweep, so report the closest (tap=2). */
function analyzeTutor2(results: ScoutResult[]): { reached: boolean; minutes: number; configs: string[] } {
  const tap2P0 = results
    .filter((r) => r.config.tapRate === 2)
    .map((r) => r.cycles.find((c) => c.runIndex === 0 && c.prestigeCount === 1))
    .filter((c): c is NonNullable<typeof c> => c !== undefined);
  if (tap2P0.length === 0) return { reached: false, minutes: 0, configs: [] };
  const avgMs = tap2P0.reduce((s, c) => s + c.durationMs, 0) / tap2P0.length;
  const avgMin = avgMs / 60_000; // CONST-OK ms→min
  return { reached: avgMin >= TUTOR_2_TARGET_MIN_LOW && avgMin <= TUTOR_2_TARGET_MIN_HIGH, minutes: avgMin, configs: tap2P0.map((_, i) => `sample ${i + 1}`) };
}

function main(): void {
  const quick = process.argv.includes('--quick');
  const configs = quick ? [{ tapRate: 5, archetype: 'analitica' as Archetype, pathway: 'rapida' as Pathway, label: 'tap5_analitica_rapida_quick', runs: 1 }] : buildConfigs();

  console.log(`TEST-5 canonical sim — ${configs.length} configs × ${RUNS_PER_SIM} Runs each (${configs.length * RUNS_PER_SIM * 26} cycle samples total)`);
  console.log('');

  const startedAt = Date.now();
  const allResults: ScoutResult[] = [];
  for (let i = 0; i < configs.length; i++) {
    const config = configs[i];
    const runStart = Date.now();
    const result = runBalanceScoutSim(config);
    const runMs = Date.now() - runStart;
    allResults.push(result);
    const status = result.timedOut ? 'TIMEOUT' : result.anomalies.length > 0 ? `⚠ ${result.anomalies.length}` : '✓';
    console.log(`[${i + 1}/${configs.length}] ${config.label} — ${result.cycles.length} cyc across ${RUNS_PER_SIM} Runs, ${(result.totalSimMs / 60_000).toFixed(0)}min sim, ${runMs}ms real — ${status}`);
  }
  const elapsedMs = Date.now() - startedAt;

  const pacingFlags = analyzePacing(allResults);
  const balanceFlags = analyzeArchetypePathwayBalance(allResults);
  const tutor2 = analyzeTutor2(allResults);

  const lines: string[] = [];
  lines.push('# TEST-5 canonical economy simulation report');
  lines.push('');
  lines.push(`**Sprint 8c BLOCKING gate** per SPRINTS.md §Sprint 8c.`);
  lines.push(`**Configs:** ${configs.length} (3 tap × 3 arch × 3 path) × ${RUNS_PER_SIM} Runs each. **Cycle samples:** ${allResults.reduce((s, r) => s + r.cycles.length, 0)}.`);
  lines.push(`**Elapsed:** ${(elapsedMs / 1000).toFixed(1)}s real time.`);
  lines.push('');
  lines.push('## Gate summary');
  lines.push('');
  const totalAnomalies = allResults.reduce((s, r) => s + r.anomalies.length, 0);
  const timedOut = allResults.filter((r) => r.timedOut).length;
  const completed3Runs = allResults.filter((r) => !r.timedOut && r.cycles.length >= 26 * RUNS_PER_SIM).length;
  lines.push(`- Sims completing all ${RUNS_PER_SIM} Runs: **${completed3Runs}/${allResults.length}**`);
  lines.push(`- Sims timed out: **${timedOut}**`);
  lines.push(`- Total anomalies: **${totalAnomalies}**`);
  lines.push(`- Cycles flagged >${DEVIATION_THRESHOLD_PCT}% off §9 target: **${pacingFlags.length}** ${pacingFlags.length === 0 ? '✓ PASS' : '✗ FAIL — tuning iteration required'}`);
  lines.push(`- Archetype×pathway combos >${ARCHETYPE_PATHWAY_MEAN_DEVIATION_PCT}% from cycle mean (P10+): **${balanceFlags.length}** ${balanceFlags.length === 0 ? '✓ PASS' : '⚠ flagged'}`);
  lines.push(`- TUTOR-2 P0 at tap=2 reaches threshold in 7-9 min: **${tutor2.reached ? '✓ PASS' : '✗ FAIL'}** (avg ${tutor2.minutes.toFixed(1)} min)`);
  lines.push('');

  if (pacingFlags.length > 0) {
    lines.push(`## Pacing flags (>${DEVIATION_THRESHOLD_PCT}% off §9 target)`);
    lines.push('');
    lines.push('| Config | Run | Cycle | Sim min | Target min | Δ% |');
    lines.push('|---|---|---|---|---|---|');
    for (const f of pacingFlags.slice(0, 80)) {
      lines.push(`| ${f.config} | R${f.runIndex} | P${f.cycle} | ${f.simMin.toFixed(1)} | ${f.targetMin} | ${f.deltaPct > 0 ? '+' : ''}${f.deltaPct.toFixed(0)}% |`);
    }
    if (pacingFlags.length > 80) lines.push(`\n… and ${pacingFlags.length - 80} more (see CSV).`);
    lines.push('');
  }

  if (balanceFlags.length > 0) {
    lines.push(`## Archetype×pathway balance flags (>${ARCHETYPE_PATHWAY_MEAN_DEVIATION_PCT}% from cycle mean, P10+)`);
    lines.push('');
    lines.push('| Cycle | Config | Sim min | Mean min | Δ% |');
    lines.push('|---|---|---|---|---|');
    for (const b of balanceFlags.slice(0, 40)) {
      lines.push(`| P${b.cycle} | ${b.config} | ${b.simMin.toFixed(1)} | ${b.meanMin.toFixed(1)} | ${b.deltaPct > 0 ? '+' : ''}${b.deltaPct.toFixed(0)}% |`);
    }
    lines.push('');
  }

  const docsDir = path.join(process.cwd(), 'docs');
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir);
  fs.writeFileSync(path.join(docsDir, 'test-5-report.md'), lines.join('\n'));

  // CSV — one row per cycle across all configs
  const csv: string[] = ['config,runIndex,prestigeCount,durationMs,memoriesGained,resonanceGained,mood,masterySum,dischargesUsed'];
  for (const r of allResults) {
    for (const c of r.cycles) {
      csv.push([r.config.label, c.runIndex, c.prestigeCount, c.durationMs, c.memoriesGained, c.resonanceGained, c.mood.toFixed(2), c.masterySum.toFixed(2), c.dischargesUsed].join(','));
    }
  }
  fs.writeFileSync(path.join(docsDir, 'test-5-raw.csv'), csv.join('\n'));

  console.log('');
  console.log(`Report: docs/test-5-report.md`);
  console.log(`CSV:    docs/test-5-raw.csv`);
  console.log(`PACING FLAGS: ${pacingFlags.length} (>${DEVIATION_THRESHOLD_PCT}% off target — BLOCKING gate)`);
  console.log(`BALANCE FLAGS: ${balanceFlags.length} (>${ARCHETYPE_PATHWAY_MEAN_DEVIATION_PCT}% from cycle mean)`);
  console.log(`TUTOR-2: ${tutor2.reached ? 'PASS' : 'FAIL'} (${tutor2.minutes.toFixed(1)} min P0 at tap=2)`);

  // Exit non-zero if blocking gate fails
  process.exit(pacingFlags.length > 0 ? 1 : 0);
}

main();
