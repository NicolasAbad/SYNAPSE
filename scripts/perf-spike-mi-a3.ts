/**
 * scripts/perf-spike-mi-a3.ts — real-device perf spike via adb + raw CDP.
 *
 * Prerequisites (run once before the script — the script assumes them):
 *   adb devices                          (Mi A3 visible)
 *   adb reverse tcp:5173 tcp:5173        (device → desktop Vite)
 *   adb forward tcp:9222 localabstract:chrome_devtools_remote
 *   Vite dev server already running      (`npm run dev` in a separate terminal)
 *
 * Script flow:
 *   1. adb shell am start Chrome → http://localhost:5173
 *   2. Poll CDP /json for a page whose URL matches APP_URL
 *   3. Attach raw WebSocket to that page's debugger endpoint
 *   4. Runtime.evaluate the startStress / getReport / stopStress calls
 *   5. Print FPSReport with Mi A3 header
 *
 * Why raw CDP instead of Playwright connectOverCDP: on Android Chrome,
 * Playwright's contexts() surface sometimes misses the loaded tab; the
 * WebSocket API is lower-friction and directly supported by Chrome Android.
 */

/* eslint-disable no-console */

import { setTimeout as sleep } from 'node:timers/promises';
import { execSync } from 'node:child_process';
import WebSocket from 'ws';
import { SYNAPSE_CONSTANTS } from '../src/config/constants';
import type { FPSReport } from '../src/ui/canvas/fpsMeter';

const CDP_HTTP = 'http://localhost:9222';
const APP_URL = 'http://localhost:5173';

interface CdpTarget {
  id: string;
  type: string;
  url: string;
  webSocketDebuggerUrl: string;
}

function adbWakeAndUnlock() {
  // Wake the display so rAF actually fires (Android throttles frames when
  // the display is OFF / dozing). Swipe up dismisses basic lock screens;
  // a PIN/pattern lockscreen requires Nico to unlock manually before run.
  execSync(`adb shell input keyevent KEYCODE_WAKEUP`, { stdio: 'ignore' });
  execSync(`adb shell input swipe 500 1500 500 500`, { stdio: 'ignore' });
}

function adbLaunchChrome() {
  console.log('→ waking Mi A3 display...');
  adbWakeAndUnlock();
  console.log('→ launching Chrome on Mi A3 via adb...');
  execSync(
    `adb shell am start -a android.intent.action.VIEW -d ${APP_URL} com.android.chrome`,
    { stdio: 'inherit' },
  );
}

async function findSynapseTarget(timeoutMs = 20_000): Promise<CdpTarget> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${CDP_HTTP}/json`);
      if (res.ok) {
        const targets = (await res.json()) as CdpTarget[];
        const match = targets.find((t) => t.type === 'page' && t.url.startsWith(APP_URL));
        if (match) return match;
      }
    } catch {
      /* not ready */
    }
    await sleep(500);
  }
  throw new Error(
    `No Chrome tab at ${APP_URL} found in CDP targets. ` +
      'Check `adb forward tcp:9222 localabstract:chrome_devtools_remote` and the Vite dev server.',
  );
}

class CdpClient {
  private ws: WebSocket;
  private nextId = 1;
  private pending = new Map<number, (result: unknown) => void>();

  constructor(wsUrl: string) {
    this.ws = new WebSocket(wsUrl);
    this.ws.on('message', (data: Buffer) => {
      const msg = JSON.parse(data.toString()) as { id?: number; result?: unknown };
      if (msg.id !== undefined && this.pending.has(msg.id)) {
        this.pending.get(msg.id)!(msg.result);
        this.pending.delete(msg.id);
      }
    });
  }

  ready(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws.once('open', () => resolve());
      this.ws.once('error', reject);
    });
  }

  send<T = unknown>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    const id = this.nextId++;
    return new Promise((resolve) => {
      this.pending.set(id, (r) => resolve(r as T));
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate<T>(expression: string): Promise<T> {
    const result = await this.send<{ result: { value: T } }>('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return result.result.value;
  }

  close() {
    this.ws.close();
  }
}

async function waitForPerfAPI(client: CdpClient, timeoutMs = 15_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ready = await client.evaluate<boolean>(
      `typeof window.__SYNAPSE_PERF__ !== 'undefined'`,
    );
    if (ready) return;
    await sleep(200);
  }
  throw new Error('window.__SYNAPSE_PERF__ never installed — is Vite serving a DEV build?');
}

async function runMiA3Spike(): Promise<FPSReport> {
  const target = await findSynapseTarget();
  console.log(`→ attached to Mi A3 tab: ${target.url}`);
  const client = new CdpClient(target.webSocketDebuggerUrl);
  try {
    await client.ready();
    // Force a cache-bypass reload — the tab may be showing an older bundle
    // from a previous manual test run that predates perfInstrument.ts.
    console.log('→ hard-reloading Mi A3 tab to flush cached bundle...');
    await client.send('Page.enable');
    await client.send('Page.reload', { ignoreCache: true });
    await sleep(2_000); // let React + rAF loop mount
    await waitForPerfAPI(client);
    // Let splash dismiss.
    await sleep(SYNAPSE_CONSTANTS.splashDurationMs + 1_000);
    console.log(
      `→ starting stress for ${SYNAPSE_CONSTANTS.perfSpikeDurationMs / 1_000}s on Mi A3...`,
    );
    await client.evaluate<void>(`window.__SYNAPSE_PERF__.startStress()`);
    await sleep(SYNAPSE_CONSTANTS.perfSpikeDurationMs);
    const report = await client.evaluate<FPSReport>(`window.__SYNAPSE_PERF__.getReport()`);
    await client.evaluate<void>(`window.__SYNAPSE_PERF__.stopStress()`);
    return report;
  } finally {
    client.close();
  }
}

function printReport(report: FPSReport): boolean {
  const droppedPct = report.frameCount > 0 ? report.droppedFrames / report.frameCount : 0;
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Phase 7 perf spike — Mi A3 (real device, Android 11 Chrome)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Frames measured:   ${report.frameCount}`);
  console.log(`  Avg fps:           ${report.avg.toFixed(2)}`);
  console.log(`  Min fps:           ${report.min.toFixed(2)}`);
  console.log(`  P5 fps:            ${report.p5.toFixed(2)}`);
  console.log(`  Dropped frames:    ${report.droppedFrames} (${(droppedPct * 100).toFixed(1)}%)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let passed = true;
  if (report.avg < SYNAPSE_CONSTANTS.perfTargetFps) {
    console.error(`✗ avg fps ${report.avg.toFixed(2)} < target ${SYNAPSE_CONSTANTS.perfTargetFps}`);
    passed = false;
  }
  if (droppedPct > SYNAPSE_CONSTANTS.perfDroppedFramePctBudget) {
    console.error(
      `✗ dropped frames ${(droppedPct * 100).toFixed(1)}% > budget ${(SYNAPSE_CONSTANTS.perfDroppedFramePctBudget * 100).toFixed(0)}%`,
    );
    passed = false;
  }
  return passed;
}

async function main() {
  adbLaunchChrome();
  await sleep(2_000); // give Chrome a moment to surface the tab
  const report = await runMiA3Spike();
  const passed = printReport(report);
  if (!passed) {
    console.error('\n✗ Mi A3 perf spike FAILED — see SPRINTS.md line 247 cascade');
    process.exit(1);
  }
  console.log('✓ Mi A3 perf spike PASSED');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
