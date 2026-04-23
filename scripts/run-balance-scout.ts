// Sprint 7.8 Phase 7.8.3/7.8.4 — Balance Scout Sim runner.
//
// Usage:
//   npx tsx scripts/run-balance-scout.ts              # full 27-config sweep, 5 runs each
//   npx tsx scripts/run-balance-scout.ts --quick      # 1 run per config (smoke)
//   npx tsx scripts/run-balance-scout.ts --single     # 1 config, 1 run (debug)
//
// Output: docs/balance-scout-report.md (aggregate summary) + docs/balance-scout-raw.csv (per-cycle rows).

/* eslint-disable no-console */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { runBalanceScoutSim, type BalanceScoutConfig, type ScoutResult } from '../src/sim/balanceScoutSim';
import type { Archetype, Pathway } from '../src/types';

const TAP_RATES = [2, 5, 10]; // CONST-OK sim-config tap rates (low / medium / high)
const ARCHETYPES: readonly Archetype[] = ['analitica', 'empatica', 'creativa'];
const PATHWAYS: readonly Pathway[] = ['rapida', 'profunda', 'equilibrada'];

function buildConfigs(): BalanceScoutConfig[] {
  const out: BalanceScoutConfig[] = [];
  for (const tapRate of TAP_RATES) {
    for (const archetype of ARCHETYPES) {
      for (const pathway of PATHWAYS) {
        out.push({ tapRate, archetype, pathway, label: `tap${tapRate}_${archetype}_${pathway}` });
      }
    }
  }
  return out;
}

function argValue(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function runsPerConfig(): number {
  if (argValue('single')) return 1;
  if (argValue('quick')) return 1;
  return 5;
}

// ── Output helpers ──────────────────────────────────────────────────────────

function formatResult(result: ScoutResult): string {
  const lines: string[] = [];
  lines.push(`## ${result.config.label}`);
  lines.push('');
  lines.push(`- Tap rate: ${result.config.tapRate}/s · Archetype: ${result.config.archetype ?? 'none'} · Pathway: ${result.config.pathway ?? 'none'}`);
  lines.push(`- Total sim time: ${(result.totalSimMs / 60_000).toFixed(1)} min (${(result.totalSimMs / 1000).toFixed(0)}s)`);
  lines.push(`- Cycles completed: ${result.cycles.length} / 26 ${result.timedOut ? '**(TIMED OUT)**' : ''}`);
  if (result.anomalies.length > 0) {
    lines.push(`- **Anomalies:** ${result.anomalies.length}`);
    for (const a of result.anomalies.slice(0, 5)) lines.push(`  - ${a}`);
    if (result.anomalies.length > 5) lines.push(`  - … and ${result.anomalies.length - 5} more`);
  }
  lines.push('');
  lines.push('| Cycle | Dur (min) | Mem Δ | Mood | Mastery Σ | ShdE | ShdP | ShdEpi | Disch |');
  lines.push('|---|---|---|---|---|---|---|---|---|');
  for (const c of result.cycles) {
    lines.push(
      `| P${c.prestigeCount} | ${(c.durationMs / 60_000).toFixed(1)} | +${c.memoriesGained} | ${c.mood.toFixed(0)} | ${c.masterySum.toFixed(1)} | +${c.shardsEmo} | +${c.shardsProc} | +${c.shardsEpi} | ${c.dischargesUsed} |`,
    );
  }
  lines.push('');
  return lines.join('\n');
}

function formatCsvHeader(): string {
  return 'config,prestigeCount,durationMs,memoriesGained,mood,masterySum,shardsEmo,shardsProc,shardsEpi,dischargesUsed,anomalyCount';
}

function formatCsvRow(result: ScoutResult, cycle: typeof result.cycles[number]): string {
  return [
    result.config.label,
    cycle.prestigeCount,
    cycle.durationMs,
    cycle.memoriesGained,
    cycle.mood.toFixed(2),
    cycle.masterySum.toFixed(2),
    cycle.shardsEmo,
    cycle.shardsProc,
    cycle.shardsEpi,
    cycle.dischargesUsed,
    result.anomalies.filter((a) => a.startsWith(`P${cycle.prestigeCount}:`)).length,
  ].join(',');
}

// ── Pacing analysis ─────────────────────────────────────────────────────────

// Target minutes per prestige from src/config/constants.ts baseThresholdTable comments
// (economy-sanity.mjs uses same source). Used for 20%-off-target anomaly flag.
const TARGET_MIN = [8, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 22, 24, 25, 27, 28, 30, 32, 33, 35];

interface PacingFlag {
  config: string;
  cycle: number;
  simMin: number;
  targetMin: number;
  deltaPct: number;
}

function analyzePacing(results: ScoutResult[]): PacingFlag[] {
  const flags: PacingFlag[] = [];
  for (const r of results) {
    for (const c of r.cycles) {
      const target = TARGET_MIN[c.prestigeCount - 1] ?? null;
      if (target === null) continue;
      const simMin = c.durationMs / 60_000;
      const deltaPct = ((simMin - target) / target) * 100;
      if (Math.abs(deltaPct) > 20) {
        flags.push({ config: r.config.label, cycle: c.prestigeCount, simMin, targetMin: target, deltaPct });
      }
    }
  }
  return flags;
}

// ── Main ────────────────────────────────────────────────────────────────────

function main(): void {
  const runs = runsPerConfig();
  let configs = buildConfigs();
  if (argValue('single')) configs = [configs[0]]; // debug: one config, one run

  console.log(`Balance Scout Sim — ${configs.length} configs × ${runs} run(s) = ${configs.length * runs} total runs`);
  console.log(`Not canonical TEST-5 (Sprint 8c). Single-Run P0→P26, Sprint 8a/8b gated features skipped.`);
  console.log('');

  const startedAt = Date.now();
  const allResults: ScoutResult[] = [];
  let i = 0;
  for (const config of configs) {
    i++;
    for (let r = 0; r < runs; r++) {
      const runStart = Date.now();
      const result = runBalanceScoutSim(config);
      const runMs = Date.now() - runStart;
      allResults.push(result);
      const status = result.timedOut ? 'TIMEOUT' : result.anomalies.length > 0 ? `⚠ ${result.anomalies.length}` : '✓';
      console.log(`[${i}/${configs.length}] ${config.label} run ${r + 1}/${runs} — ${result.cycles.length} cyc, ${(result.totalSimMs / 60_000).toFixed(0)}min sim, ${runMs}ms real — ${status}`);
    }
  }
  const elapsedMs = Date.now() - startedAt;

  const flags = analyzePacing(allResults);

  // Write Markdown report
  const reportLines: string[] = [];
  reportLines.push('# Balance Scout Sim — Sprint 7.8 Phase 7.8.5');
  reportLines.push('');
  reportLines.push(`**Scope:** preliminary pacing + anomaly validator for Sprint 7.5-7.7 additions. Not canonical TEST-5 (Sprint 8c).`);
  reportLines.push(`**Configs:** ${configs.length} (3 tap × 3 arch × 3 path). **Runs per config:** ${runs}. **Total runs:** ${allResults.length}.`);
  reportLines.push(`**Elapsed:** ${(elapsedMs / 1000).toFixed(1)}s real time.`);
  reportLines.push('');
  reportLines.push('## Summary');
  reportLines.push('');
  const totalAnomalies = allResults.reduce((sum, r) => sum + r.anomalies.length, 0);
  const timedOutCount = allResults.filter((r) => r.timedOut).length;
  const completedFull = allResults.filter((r) => r.cycles.length === 26).length;
  reportLines.push(`- Runs completing full 26 cycles: **${completedFull}/${allResults.length}**`);
  reportLines.push(`- Runs timed out: **${timedOutCount}**`);
  reportLines.push(`- Total anomalies flagged: **${totalAnomalies}**`);
  reportLines.push(`- Pacing flags (>20% off target): **${flags.length}**`);
  reportLines.push('');

  if (flags.length > 0) {
    reportLines.push('## Pacing flags (>20% off target)');
    reportLines.push('');
    reportLines.push('| Config | Cycle | Sim min | Target min | Δ% |');
    reportLines.push('|---|---|---|---|---|');
    for (const f of flags.slice(0, 50)) {
      reportLines.push(`| ${f.config} | P${f.cycle} | ${f.simMin.toFixed(1)} | ${f.targetMin} | ${f.deltaPct > 0 ? '+' : ''}${f.deltaPct.toFixed(0)}% |`);
    }
    if (flags.length > 50) reportLines.push(`\n… and ${flags.length - 50} more (see CSV).`);
    reportLines.push('');
  }

  reportLines.push('## Per-config detail');
  reportLines.push('');
  for (const result of allResults) reportLines.push(formatResult(result));

  const docsDir = path.join(process.cwd(), 'docs');
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir);
  fs.writeFileSync(path.join(docsDir, 'balance-scout-report.md'), reportLines.join('\n'));

  // Write CSV
  const csvLines: string[] = [formatCsvHeader()];
  for (const r of allResults) for (const c of r.cycles) csvLines.push(formatCsvRow(r, c));
  fs.writeFileSync(path.join(docsDir, 'balance-scout-raw.csv'), csvLines.join('\n'));

  console.log('');
  console.log(`Report: docs/balance-scout-report.md`);
  console.log(`CSV:    docs/balance-scout-raw.csv`);
  console.log(`Pacing flags: ${flags.length} · Anomalies: ${totalAnomalies} · Timeouts: ${timedOutCount}`);
  process.exit(flags.length > 0 || totalAnomalies > 0 || timedOutCount > 0 ? 0 : 0);
}

main();
