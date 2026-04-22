// Smoke playtest on the connected Mi A3 over adb + raw CDP.
//
// Mirrors scripts/smoke-playtest.mjs but drives Android Chrome instead of
// headless desktop Chromium. Ports must be wired before invocation:
//   adb reverse tcp:5173 tcp:5173
//   adb forward tcp:9222 localabstract:chrome_devtools_remote
//
// Run:
//   (terminal A) npm run dev
//   (terminal B) node scripts/smoke-playtest-mi-a3.mjs
//
// Output:
//   .playtest-screens-mi-a3/*.png  — per-step screenshots
//   .playtest-report-mi-a3.json    — console errors, probe values, pass/fail

import { setTimeout as sleep } from 'node:timers/promises';
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Buffer } from 'node:buffer';
import WebSocket from 'ws';

const ADB = 'C:/Users/abadn/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const CDP_HTTP = 'http://localhost:9222';
const APP_URL = 'http://localhost:5173';
const SCREEN_DIR = '.playtest-screens-mi-a3';
mkdirSync(SCREEN_DIR, { recursive: true });

const errors = [];
const warnings = [];
const probes = {};

function adbShell(cmd) {
  execSync(`"${ADB}" shell ${cmd}`, { stdio: 'ignore' });
}

function wakeAndUnlock() {
  adbShell('input keyevent KEYCODE_WAKEUP');
  adbShell('input swipe 500 1500 500 500');
}

function launchChrome() {
  execSync(
    `"${ADB}" shell am start -a android.intent.action.VIEW -d ${APP_URL} com.android.chrome`,
    { stdio: 'ignore' },
  );
}

async function findSynapseTarget(timeoutMs = 20_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${CDP_HTTP}/json`);
      if (res.ok) {
        const targets = await res.json();
        const match = targets.find((t) => t.type === 'page' && t.url.startsWith(APP_URL));
        if (match) return match;
      }
    } catch {
      /* not ready */
    }
    await sleep(500);
  }
  throw new Error(`No Chrome tab at ${APP_URL} found in CDP targets`);
}

class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.id !== undefined && this.pending.has(msg.id)) {
        this.pending.get(msg.id)(msg);
        this.pending.delete(msg.id);
      } else if (msg.method === 'Runtime.consoleAPICalled') {
        const level = msg.params.type;
        const text = (msg.params.args || []).map((a) => a.value ?? a.description ?? '').join(' ');
        if (level === 'error') errors.push(`[console.error] ${text}`);
        else if (level === 'warning') warnings.push(`[console.warn] ${text}`);
      } else if (msg.method === 'Runtime.exceptionThrown') {
        errors.push(`[pageerror] ${msg.params.exceptionDetails?.text ?? '??'}`);
      }
    });
  }

  ready() {
    return new Promise((resolve, reject) => {
      this.ws.once('open', resolve);
      this.ws.once('error', reject);
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, (msg) => {
        if (msg.error) reject(new Error(`${method}: ${msg.error.message}`));
        else resolve(msg.result);
      });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expr) {
    const r = await this.send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.exceptionDetails) throw new Error(`eval: ${r.exceptionDetails.text}`);
    return r.result.value;
  }

  async screenshot(file) {
    const r = await this.send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(SCREEN_DIR, file), Buffer.from(r.data, 'base64'));
  }

  async tap(x, y) {
    // Android Chrome accepts Input.dispatchTouchEvent with touchPoints array.
    await this.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x, y }],
    });
    await sleep(30);
    await this.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
  }

  close() {
    this.ws.close();
  }
}

async function waitForSelector(client, selector, timeoutMs = 10_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const found = await client.evaluate(
      `document.querySelector(${JSON.stringify(selector)}) !== null`,
    );
    if (found) return true;
    await sleep(250);
  }
  return false;
}

async function getBoundingBox(client, selector) {
  return client.evaluate(
    `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()`,
  );
}

async function clickSelector(client, selector) {
  const bb = await getBoundingBox(client, selector);
  if (!bb) {
    warnings.push(`clickSelector: ${selector} not found`);
    return false;
  }
  await client.tap(bb.x + bb.w / 2, bb.y + bb.h / 2);
  return true;
}

async function runSmoke() {
  console.log('→ waking Mi A3 + launching Chrome...');
  wakeAndUnlock();
  launchChrome();
  await sleep(2500);

  console.log('→ attaching CDP...');
  const target = await findSynapseTarget();
  console.log(`  tab: ${target.url}`);
  const client = new CdpClient(target.webSocketDebuggerUrl);
  try {
    await client.ready();
    await client.send('Page.enable');
    await client.send('Runtime.enable');

    console.log('→ hard-reloading tab...');
    await client.send('Page.reload', { ignoreCache: true });
    await sleep(2000);

    console.log('→ waiting for HUD root...');
    const mounted = await waitForSelector(client, '[data-testid="hud-root"]', 15_000);
    if (!mounted) {
      errors.push('HUD root never mounted (15s timeout)');
      await client.screenshot('00-mount-failed.png');
      return;
    }
    probes.mounted = true;
    console.log('  HUD ✓');

    // Let splash dismiss (splashDurationMs is ~2s).
    await sleep(3000);
    await client.screenshot('01-loaded.png');

    // Probe thoughts counter.
    const thoughtsBefore = await client.evaluate(
      `document.querySelector('[data-testid="hud-thoughts"]')?.textContent ?? null`,
    );
    probes.thoughtsBefore = thoughtsBefore;
    console.log(`  thoughts before: ${thoughtsBefore}`);

    // Tap the canvas center 30 times.
    const canvasBox = await getBoundingBox(client, '[data-testid="neuron-canvas"]');
    if (!canvasBox) {
      errors.push('neuron-canvas not found');
      return;
    }
    const cx = canvasBox.x + canvasBox.w / 2;
    const cy = canvasBox.y + canvasBox.h / 2;
    console.log(`→ tapping canvas center (${cx.toFixed(0)},${cy.toFixed(0)}) × 30...`);
    for (let i = 0; i < 30; i++) {
      await client.tap(cx, cy);
      await sleep(60);
    }
    await sleep(400);
    const thoughtsAfter = await client.evaluate(
      `document.querySelector('[data-testid="hud-thoughts"]')?.textContent ?? null`,
    );
    probes.thoughtsAfter = thoughtsAfter;
    console.log(`  thoughts after: ${thoughtsAfter}`);
    await client.screenshot('02-post-taps.png');

    // Tab switching.
    console.log('→ cycling tabs (mind → neurons → upgrades → regions → mind)...');
    for (const tab of ['neurons', 'upgrades', 'regions', 'mind']) {
      const ok = await clickSelector(client, `[data-testid="hud-tab-${tab}"]`);
      if (!ok) warnings.push(`tab ${tab} button missing`);
      await sleep(400);
      await client.screenshot(`03-tab-${tab}.png`);
    }

    // Back to Neurons → buy Basica.
    console.log('→ buying Basica...');
    await clickSelector(client, '[data-testid="hud-tab-neurons"]');
    await sleep(400);
    const rowCount = await client.evaluate(
      `document.querySelectorAll('[data-testid^="panel-neurons-row-"]').length`,
    );
    probes.neuronRows = rowCount;
    console.log(`  neuron rows: ${rowCount}`);
    const bought = await clickSelector(client, '[data-testid="panel-neurons-buy-basica"]');
    if (!bought) warnings.push('Basica buy button missing');
    await sleep(400);
    const thoughtsAfterBuy = await client.evaluate(
      `document.querySelector('[data-testid="hud-thoughts"]')?.textContent ?? null`,
    );
    probes.thoughtsAfterBuy = thoughtsAfterBuy;
    console.log(`  thoughts after buy: ${thoughtsAfterBuy}`);
    await client.screenshot('04-post-buy.png');

    // Mind → Patterns subtab.
    console.log('→ mind → patterns subtab...');
    await clickSelector(client, '[data-testid="hud-tab-mind"]');
    await sleep(400);
    const subtabBarPresent = await client.evaluate(
      `document.querySelector('[data-testid="mind-subtab-bar"]') !== null`,
    );
    probes.mindSubtabBar = subtabBarPresent;
    if (!subtabBarPresent) warnings.push('mind-subtab-bar missing');
    await clickSelector(client, '[data-testid="mind-subtab-patterns"]');
    await sleep(500);
    const patternGridPresent = await client.evaluate(
      `document.querySelector('[data-testid="pattern-tree-grid"]') !== null`,
    );
    probes.patternGrid = patternGridPresent;
    if (!patternGridPresent) warnings.push('pattern-tree-grid missing');
    await client.screenshot('05-patterns-subtab.png');

    // Back to home subtab — confirm Discharge + hints gate restored there only.
    await clickSelector(client, '[data-testid="mind-subtab-home"]');
    await sleep(300);
    await client.screenshot('06-mind-home.png');

    // Check device pixel size for context.
    const deviceInfo = await client.evaluate(
      `JSON.stringify({ w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio })`,
    );
    probes.device = JSON.parse(deviceInfo);
    console.log(`  device viewport: ${deviceInfo}`);
  } finally {
    client.close();
  }
}

try {
  await runSmoke();
} catch (err) {
  errors.push(`[harness-thrown] ${err instanceof Error ? err.message : String(err)}`);
}

const report = {
  device: 'Mi A3 (Android 11, Chrome)',
  baseUrl: APP_URL,
  errorCount: errors.length,
  warningCount: warnings.length,
  errors,
  warnings,
  probes,
  screensDir: SCREEN_DIR,
  timestamp: new Date().toISOString(),
};
writeFileSync('.playtest-report-mi-a3.json', JSON.stringify(report, null, 2));

console.log('');
console.log('─── Mi A3 SMOKE PLAYTEST REPORT ───');
console.log(`errors   ${errors.length}`);
console.log(`warnings ${warnings.length}`);
if (errors.length) errors.forEach((e) => console.log(`  ✗ ${e}`));
if (warnings.length) warnings.forEach((w) => console.log(`  ⚠ ${w}`));
console.log('');
console.log(`screenshots: ${SCREEN_DIR}/`);
console.log(`full report: .playtest-report-mi-a3.json`);
process.exit(errors.length > 0 ? 1 : 0);
