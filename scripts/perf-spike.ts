/**
 * scripts/perf-spike.ts — Sprint 2 Phase 7 performance spike harness.
 *
 * Launches the Vite dev server, opens Chromium via Playwright, invokes
 * window.__SYNAPSE_PERF__.startStress() to inject the 100-neuron stress
 * state, lets the rAF loop run for perfSpikeDurationMs, then asserts:
 *   - avg fps >= perfTargetFps
 *   - droppedFrame% <= perfDroppedFramePctBudget
 *   - JS heap delta <= perfMemoryDeltaBudgetMB (best-effort; Chromium-only)
 *
 * Per SPRINTS.md §Sprint 2 line 238. Mi A3 (Capacitor WebView) real-device
 * perf is a Sprint 11a deliverable — desktop Chromium is an approximation,
 * not a replacement.
 *
 * Run: `npm run test:perf`
 */

/* eslint-disable no-console */

import { chromium, type Browser, type Page } from 'playwright';
import { spawn, type ChildProcess } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { SYNAPSE_CONSTANTS } from '../src/config/constants';
import type { FPSReport } from '../src/ui/canvas/fpsMeter';

const VITE_URL = 'http://localhost:5173'; // matches vite.config.ts server.port
const VITE_READY_RE = /ready in|Local:/i;
const VITE_START_TIMEOUT_MS = 30_000; // Vite cold-start budget on Windows

function startViteDev(): { proc: ChildProcess; ready: Promise<void> } {
  console.log('→ starting Vite dev server...');
  const proc = spawn('npm', ['run', 'dev'], {
    cwd: process.cwd(),
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const ready = new Promise<void>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Vite dev server did not become ready in time')),
      VITE_START_TIMEOUT_MS,
    );
    const onData = (buf: Buffer) => {
      const text = buf.toString();
      process.stdout.write(`  [vite] ${text}`);
      if (VITE_READY_RE.test(text)) {
        clearTimeout(timer);
        proc.stdout?.off('data', onData);
        proc.stderr?.off('data', onData);
        resolve();
      }
    };
    proc.stdout?.on('data', onData);
    proc.stderr?.on('data', onData);
    proc.on('exit', (code) => {
      clearTimeout(timer);
      if (code !== 0 && code !== null) reject(new Error(`Vite exited with code ${code}`));
    });
  });

  return { proc, ready };
}

async function waitForPerfAPI(page: Page, timeoutMs = 15_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ready = await page.evaluate(() => typeof window.__SYNAPSE_PERF__ !== 'undefined');
    if (ready) return;
    await sleep(200);
  }
  throw new Error('window.__SYNAPSE_PERF__ was never installed (is DEV build?)');
}

interface HeapSample {
  before: number | null;
  after: number | null;
}

async function sampleHeap(page: Page): Promise<number | null> {
  return page.evaluate(() => {
    const perfMemory = (performance as { memory?: { usedJSHeapSize: number } }).memory;
    return perfMemory ? perfMemory.usedJSHeapSize : null;
  });
}

async function runSpike(): Promise<{ report: FPSReport; heap: HeapSample }> {
  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.on('console', (msg) => {
      if (msg.text().startsWith('[SYNAPSE]')) console.log(`  [page] ${msg.text()}`);
    });

    await page.goto(VITE_URL, { waitUntil: 'domcontentloaded' });
    // HUD mount confirms the React tree rendered and NeuronCanvas effect ran.
    await page.waitForSelector('[data-testid="hud-root"]', { timeout: 15_000 });
    await waitForPerfAPI(page);

    // Dismiss the Phase 6 splash so the canvas is actually animating.
    const splashTotal = SYNAPSE_CONSTANTS.splashDurationMs + 1_000; // +1s fade buffer
    await sleep(splashTotal);

    const heapBefore = await sampleHeap(page);
    console.log(`→ baseline heap: ${heapBefore !== null ? (heapBefore / 1_048_576).toFixed(2) + ' MB' : 'unavailable'}`);

    console.log(`→ starting ${SYNAPSE_CONSTANTS.perfStressNeuronsPerType * 5}-neuron stress for ${SYNAPSE_CONSTANTS.perfSpikeDurationMs / 1_000}s...`);
    await page.evaluate(() => window.__SYNAPSE_PERF__?.startStress());

    await sleep(SYNAPSE_CONSTANTS.perfSpikeDurationMs);

    const report = await page.evaluate(
      () => window.__SYNAPSE_PERF__?.getReport() ?? null,
    );
    const heapAfter = await sampleHeap(page);
    await page.evaluate(() => window.__SYNAPSE_PERF__?.stopStress());

    if (!report) throw new Error('Could not retrieve FPSReport from page');
    return { report, heap: { before: heapBefore, after: heapAfter } };
  } finally {
    if (browser) await browser.close();
  }
}

function reportAndAssert(report: FPSReport, heap: HeapSample): boolean {
  const droppedPct = report.frameCount > 0 ? report.droppedFrames / report.frameCount : 0;
  const heapDeltaMB =
    heap.before !== null && heap.after !== null
      ? (heap.after - heap.before) / 1_048_576
      : null;

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Phase 7 perf spike report (Chromium)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Frames measured:   ${report.frameCount}`);
  console.log(`  Avg fps:           ${report.avg.toFixed(2)}`);
  console.log(`  Min fps:           ${report.min.toFixed(2)}`);
  console.log(`  P5 fps:            ${report.p5.toFixed(2)}`);
  console.log(`  Dropped frames:    ${report.droppedFrames} (${(droppedPct * 100).toFixed(1)}%)`);
  console.log(
    `  Heap delta:        ${heapDeltaMB !== null ? heapDeltaMB.toFixed(2) + ' MB' : 'unavailable'}`,
  );
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let passed = true;
  if (report.avg < SYNAPSE_CONSTANTS.perfTargetFps) {
    console.error(
      `✗ avg fps ${report.avg.toFixed(2)} < target ${SYNAPSE_CONSTANTS.perfTargetFps}`,
    );
    passed = false;
  }
  if (droppedPct > SYNAPSE_CONSTANTS.perfDroppedFramePctBudget) {
    console.error(
      `✗ dropped frames ${(droppedPct * 100).toFixed(1)}% > budget ${(SYNAPSE_CONSTANTS.perfDroppedFramePctBudget * 100).toFixed(0)}%`,
    );
    passed = false;
  }
  if (heapDeltaMB !== null && heapDeltaMB > SYNAPSE_CONSTANTS.perfMemoryDeltaBudgetMB) {
    console.error(
      `✗ heap delta ${heapDeltaMB.toFixed(2)} MB > budget ${SYNAPSE_CONSTANTS.perfMemoryDeltaBudgetMB} MB`,
    );
    passed = false;
  }
  if (heapDeltaMB === null) {
    console.warn(
      '⚠ heap delta unavailable (performance.memory not exposed) — JS-side leak detection skipped',
    );
  }

  return passed;
}

async function main() {
  const { proc, ready } = startViteDev();
  let passed = false;
  try {
    await ready;
    const { report, heap } = await runSpike();
    passed = reportAndAssert(report, heap);
    if (!passed) {
      console.error('\n✗ Phase 7 perf spike FAILED — see optimization cascade in SPRINTS.md line 247');
    } else {
      console.log('✓ Phase 7 perf spike PASSED');
    }
  } finally {
    // Best-effort child kill — SIGKILL doesn't cascade on Windows, so we
    // always force-exit after this finally block regardless.
    if (proc.pid) {
      try { proc.kill('SIGKILL'); } catch { /* ignore */ }
    }
  }
  // Explicit exit — Vite dev child keeps event loop alive on Windows
  // even after SIGKILL of the parent shell. Exit code propagates CI status.
  process.exit(passed ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
