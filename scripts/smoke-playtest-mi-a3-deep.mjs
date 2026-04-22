// Deep smoke playtest on Mi A3 — drives the game via direct Zustand store
// actions (window.__SYNAPSE_STORE__) instead of CDP tap dispatch. Avoids the
// ~300ms CDP round-trip that made the previous version hang, and bypasses the
// Capacitor Preferences web-fallback that CDP Storage.clearDataForOrigin
// can't reach. Verifies everything shipped through Sprint 4c plus UX
// diagnostics.
//
// Prerequisites:
//   npx vite --host 127.0.0.1 --port 5173
//   adb reverse tcp:5173 tcp:5173
//   adb forward tcp:9222 localabstract:chrome_devtools_remote
//
// Run:
//   node scripts/smoke-playtest-mi-a3-deep.mjs

import { setTimeout as sleep } from 'node:timers/promises';
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Buffer } from 'node:buffer';
import WebSocket from 'ws';

const ADB = 'C:/Users/abadn/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const CDP_HTTP = 'http://localhost:9222';
const APP_URL = 'http://localhost:5173';
const SCREEN_DIR = '.playtest-screens-mi-a3-deep';
mkdirSync(SCREEN_DIR, { recursive: true });

const findings = { errors: [], warnings: [], ok: [], probes: {}, ux: [] };

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
async function findTarget(timeoutMs = 20_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${CDP_HTTP}/json`);
      if (res.ok) {
        const targets = await res.json();
        const m = targets.find((t) => t.type === 'page' && t.url.startsWith(APP_URL));
        if (m) return m;
      }
    } catch { /* wait */ }
    await sleep(500);
  }
  throw new Error(`No tab at ${APP_URL}`);
}

class Cdp {
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
        if (level === 'error') findings.errors.push(`[console.error] ${text}`);
        else if (level === 'warning') findings.warnings.push(`[console.warn] ${text}`);
      } else if (msg.method === 'Runtime.exceptionThrown') {
        findings.errors.push(`[pageerror] ${msg.params.exceptionDetails?.text ?? '??'}`);
      }
    });
  }
  ready() { return new Promise((r, j) => { this.ws.once('open', r); this.ws.once('error', j); }); }
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
  async eval(expr) {
    const r = await this.send('Runtime.evaluate', {
      expression: expr, returnByValue: true, awaitPromise: true,
    });
    if (r.exceptionDetails) throw new Error(`eval: ${r.exceptionDetails.text}`);
    return r.result.value;
  }
  async screenshot(file) {
    const r = await this.send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(SCREEN_DIR, file), Buffer.from(r.data, 'base64'));
  }
  close() { this.ws.close(); }
}

// Store helpers — all dispatched as single Runtime.evaluate to avoid RT latency.
const storeActions = {
  reset: `window.__SYNAPSE_STORE__.getState().reset()`,
  snapshot: `(()=>{
    const s = window.__SYNAPSE_STORE__.getState();
    return {
      thoughts: s.thoughts,
      isTutorialCycle: s.isTutorialCycle,
      prestigeCount: s.prestigeCount,
      memories: s.memories,
      totalPatterns: s.totalPatterns,
      cycleGenerated: s.cycleGenerated,
      dischargeCharges: s.dischargeCharges,
      focusBar: s.focusBar,
      effectivePPS: s.effectiveProductionPerSecond,
      basePPS: s.baseProductionPerSecond,
      activeTab: s.activeTab,
      activeMindSubtab: s.activeMindSubtab,
      currentPolarity: s.currentPolarity,
      lastCycleConfig: s.lastCycleConfig,
      basicaCount: s.neurons.find(n => n.type === 'basica')?.count ?? null,
      sensorialCount: s.neurons.find(n => n.type === 'sensorial')?.count ?? null,
    };
  })()`,
};

async function main() {
  console.log('→ waking Mi A3 + launching Chrome...');
  wakeAndUnlock();
  launchChrome();
  await sleep(2500);

  const target = await findTarget();
  const cdp = new Cdp(target.webSocketDebuggerUrl);
  await cdp.ready();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  // Reload to get a clean mount (re-attaches __SYNAPSE_STORE__).
  await cdp.send('Page.reload', { ignoreCache: true });
  await sleep(3500);

  // Wait for dev hooks.
  let ready = false;
  for (let i = 0; i < 20; i++) {
    const r = await cdp.eval(`typeof window.__SYNAPSE_STORE__ !== 'undefined'`);
    if (r) { ready = true; break; }
    await sleep(500);
  }
  if (!ready) { findings.errors.push('__SYNAPSE_STORE__ never attached — dev build not active?'); cdp.close(); return; }
  findings.ok.push('store hook attached');

  // ═══ STEP 1: Fresh reset + state verification ═══
  console.log('→ step 1: reset to fresh state');
  await cdp.eval(storeActions.reset);
  await sleep(500);
  let s = await cdp.eval(storeActions.snapshot);
  findings.probes.postReset = s;
  if (s.thoughts !== 0) findings.errors.push(`reset: thoughts=${s.thoughts} (expected 0)`);
  if (s.isTutorialCycle !== true) findings.errors.push(`reset: isTutorialCycle=${s.isTutorialCycle} (expected true)`);
  if (s.prestigeCount !== 0) findings.errors.push(`reset: prestigeCount=${s.prestigeCount} (expected 0)`);
  if (s.memories !== 0) findings.errors.push(`reset: memories=${s.memories} (expected 0)`);
  // createDefaultState seeds 1 Basica (UI-9 step 1) — not 0.
  if (s.basicaCount !== 1) findings.errors.push(`reset: basicaCount=${s.basicaCount} (expected 1 per UI-9)`);
  if (s.activeMindSubtab !== 'home') findings.errors.push(`reset: activeMindSubtab=${s.activeMindSubtab} (expected home)`);
  if (findings.errors.length === 0) findings.ok.push('fresh reset verified');
  await cdp.screenshot('01-fresh-reset.png');

  // ═══ STEP 2: Core loop — tap 20x, verify thoughts accrue ═══
  console.log('→ step 2: onTap × 20');
  await cdp.eval(`(()=>{
    const st = window.__SYNAPSE_STORE__.getState();
    const now = Date.now();
    for (let i = 0; i < 20; i++) st.onTap(now + i * 150);
  })()`);
  await sleep(300);
  s = await cdp.eval(storeActions.snapshot);
  findings.probes.after20Taps = s;
  if (s.thoughts < 20) findings.warnings.push(`after 20 taps: thoughts=${s.thoughts} (expected ≥20)`);
  else findings.ok.push(`20 taps → thoughts=${s.thoughts}`);

  // ═══ STEP 3: Buy 1 Basica — verify rate increases ═══
  console.log('→ step 3: buy 1 Basica');
  const rateBefore = s.effectivePPS;
  await cdp.eval(`window.__SYNAPSE_STORE__.getState().buyNeuron('basica', Date.now())`);
  await sleep(200);
  s = await cdp.eval(storeActions.snapshot);
  findings.probes.afterBuy1 = s;
  // Started with 1 Basica (UI-9 seed) + bought 1 = 2.
  if (s.basicaCount !== 2) findings.errors.push(`buy: basicaCount=${s.basicaCount} (expected 2)`);
  // effectivePPS updates in tick; rate=0 at snapshot if tick hasn't run. Wait for tick.
  await sleep(250);
  const s2 = await cdp.eval(storeActions.snapshot);
  if (s2.effectivePPS <= rateBefore) findings.errors.push(`buy: rate didn't increase after tick (${rateBefore} → ${s2.effectivePPS})`);
  else findings.ok.push(`buy 1 Basica → tick rate ${s2.effectivePPS.toFixed(2)}/s`);
  await cdp.screenshot('02-after-buy-1.png');

  // ═══ STEP 4: Seed to 10 Basicas → Sensorial unlock ═══
  console.log('→ step 4: seed 10 Basicas');
  await cdp.eval(`(()=>{
    const st = window.__SYNAPSE_STORE__.getState();
    const now = Date.now();
    // Grant thoughts to afford + buy
    window.__SYNAPSE_STORE__.setState(s => ({ ...s, thoughts: 100000 }));
    // Already at 2 Basicas from prior steps; buy 8 more to reach 10.
    for (let i = 0; i < 8; i++) st.buyNeuron('basica', now + i * 100);
  })()`);
  await sleep(300);
  s = await cdp.eval(storeActions.snapshot);
  findings.probes.after10Basicas = s;
  if (s.basicaCount !== 10) findings.errors.push(`seed: basicaCount=${s.basicaCount} (expected 10)`);
  else findings.ok.push(`10 Basicas seeded → rate ${s.effectivePPS.toFixed(2)}/s`);

  // Switch to Neurons tab, screenshot → expect Sensorial row un-locked.
  await cdp.eval(`window.__SYNAPSE_STORE__.getState().setActiveTab('neurons')`);
  await sleep(400);
  await cdp.screenshot('03-neurons-10-basicas.png');
  const sensorialRowInfo = await cdp.eval(`(()=>{
    const r = document.querySelector('[data-testid="panel-neurons-row-sensorial"]');
    if (!r) return null;
    const btn = r.querySelector('[data-testid="panel-neurons-buy-sensorial"]');
    return { rowText: r.textContent.slice(0, 80), buyButtonVisible: !!btn };
  })()`);
  findings.probes.sensorialRowAfter10Basicas = sensorialRowInfo;
  if (!sensorialRowInfo?.buyButtonVisible) findings.errors.push('Sensorial buy button not visible after 10 Basicas');
  else findings.ok.push('Sensorial unlocked in UI ✓');

  // ═══ STEP 5: Buy 1 Sensorial — verify ConnectionChip shows ═══
  console.log('→ step 5: buy 1 Sensorial + ConnectionChip visibility');
  await cdp.eval(`window.__SYNAPSE_STORE__.setState(s => ({ ...s, thoughts: 100000 }))`);
  await cdp.eval(`window.__SYNAPSE_STORE__.getState().buyNeuron('sensorial', Date.now())`);
  await sleep(300);
  s = await cdp.eval(storeActions.snapshot);
  findings.probes.after1Sensorial = s;
  // Go back to Mind/home so ConnectionChip is visible (it's in HUD which is always rendered — check regardless).
  await cdp.eval(`window.__SYNAPSE_STORE__.getState().setActiveTab('mind')`);
  await sleep(300);
  const chip = await cdp.eval(`(()=>{
    const c = document.querySelector('[data-testid="hud-connection-chip"]');
    return c ? { text: c.textContent, visible: true } : { visible: false };
  })()`);
  findings.probes.connectionChip = chip;
  if (!chip.visible) findings.errors.push('ConnectionChip hidden with 2 types owned (expected visible)');
  else findings.ok.push(`ConnectionChip: "${chip.text}"`);
  await cdp.screenshot('04-connection-chip.png');

  // ═══ STEP 6: Visual gating — cycle Mind subtabs, check Discharge + hints ═══
  console.log('→ step 6: subtab gating');
  const subtabs = ['home', 'patterns', 'archetypes', 'diary', 'achievements', 'resonance'];
  const subtabResults = {};
  for (const st of subtabs) {
    await cdp.eval(`window.__SYNAPSE_STORE__.getState().setActiveMindSubtab('${st}')`);
    await sleep(250);
    const g = await cdp.eval(`(()=>{
      return {
        discharge: !!document.querySelector('[data-testid="hud-discharge-button-wrapper"]'),
        hint: !!document.querySelector('[data-testid^="tutorial-hint"]'),
        fragment: !!document.querySelector('[data-testid="fragment-overlay"]'),
      };
    })()`);
    subtabResults[st] = g;
    if (st === 'home') {
      if (!g.discharge) findings.errors.push('home: Discharge hidden (expected visible)');
      else findings.ok.push('home: Discharge visible ✓');
    } else {
      if (g.discharge) findings.errors.push(`${st}: Discharge visible (expected hidden per 4c.6.5)`);
      if (g.hint) findings.errors.push(`${st}: tutorial hint visible (expected hidden)`);
      if (g.fragment) findings.errors.push(`${st}: fragment visible (expected hidden)`);
    }
  }
  findings.probes.subtabGating = subtabResults;
  findings.ok.push('subtab gating swept 6 subtabs');

  // Back to home for subsequent screenshots.
  await cdp.eval(`window.__SYNAPSE_STORE__.getState().setActiveMindSubtab('home')`);
  await sleep(250);

  // ═══ STEP 7: Pattern grid cells — Patterns subtab ═══
  console.log('→ step 7: Pattern Tree grid');
  await cdp.eval(`window.__SYNAPSE_STORE__.getState().setActiveMindSubtab('patterns')`);
  await sleep(400);
  const gridCells = await cdp.eval(`document.querySelectorAll('[data-testid^="pattern-cell-"]').length`);
  findings.probes.patternCells = gridCells;
  if (gridCells !== 50) findings.errors.push(`pattern grid cells=${gridCells} (expected 50)`);
  else findings.ok.push('pattern grid 50 cells ✓');
  await cdp.screenshot('05-pattern-tree.png');

  // ═══ STEP 8: Prestige flow — seed enough thoughts, fire prestige ═══
  console.log('→ step 8: prestige flow');
  await cdp.eval(`window.__SYNAPSE_STORE__.getState().setActiveMindSubtab('home')`);
  await cdp.eval(`window.__SYNAPSE_STORE__.setState(s => ({
    ...s,
    thoughts: 30000,
    cycleGenerated: 30000,
    lastCycleEndProduction: s.effectiveProductionPerSecond,
  }))`);
  await sleep(300);
  const prestigeResult = await cdp.eval(`JSON.stringify(window.__SYNAPSE_STORE__.getState().prestige(Date.now()))`);
  findings.probes.prestigeResult = JSON.parse(prestigeResult);
  await sleep(500);
  s = await cdp.eval(storeActions.snapshot);
  findings.probes.afterPrestige = s;
  if (s.prestigeCount !== 1) findings.errors.push(`prestige: count=${s.prestigeCount} (expected 1)`);
  if (s.memories < 2) findings.errors.push(`prestige: memories=${s.memories} (expected ≥2)`);
  if (s.basicaCount !== 0) findings.errors.push(`prestige: basicaCount=${s.basicaCount} (expected 0 post-reset)`);
  if (s.isTutorialCycle !== false) findings.errors.push(`prestige: isTutorialCycle=${s.isTutorialCycle} (expected false — TUTOR-2 flip)`);
  if (s.totalPatterns < 3) findings.errors.push(`prestige: totalPatterns=${s.totalPatterns} (expected ≥3, patternsPerPrestige=3)`);
  else findings.ok.push(`prestige: mem=${s.memories}, patterns=${s.totalPatterns}, isTutorialCycle=${s.isTutorialCycle}`);
  await cdp.screenshot('06-post-prestige.png');

  // Verify MemoriesCounter now visible.
  const memoriesVisible = await cdp.eval(`!!document.querySelector('[data-testid="hud-memories"]')`);
  findings.probes.memoriesCounterPost = memoriesVisible;
  if (!memoriesVisible) findings.errors.push('MemoriesCounter hidden after prestige (expected visible)');
  else findings.ok.push('MemoriesCounter visible post-prestige ✓');

  // ═══ STEP 9: Post-prestige "buy first neuron" hint (4c.6.5 feature) ═══
  console.log('→ step 9: post-prestige buy hint');
  // Seed enough thoughts to afford Basica (cost 10) so the hint-predicate holds.
  await cdp.eval(`window.__SYNAPSE_STORE__.setState(s => ({ ...s, thoughts: 50 }))`);
  await sleep(500); // let hint render
  const postPrestigeHint = await cdp.eval(`(()=>{
    const el = document.querySelector('[data-testid="tutorial-hint-buy"]');
    return el ? el.textContent : null;
  })()`);
  findings.probes.postPrestigeBuyHint = postPrestigeHint;
  if (!postPrestigeHint) findings.errors.push('post-prestige buy hint not firing (4c.6.5 regression)');
  else findings.ok.push(`post-prestige buy hint: "${postPrestigeHint}"`);

  // ═══ STEP 10: Seed to P3 → verify Polarity picker appears ═══
  console.log('→ step 10: seed P3 prestige + Polarity picker');
  await cdp.eval(`window.__SYNAPSE_STORE__.setState(s => ({
    ...s,
    prestigeCount: 3,
    thoughts: 30000,
    cycleGenerated: 30000,
    lastCycleEndProduction: 5,
  }))`);
  await sleep(300);
  await cdp.eval(`window.__SYNAPSE_STORE__.getState().prestige(Date.now())`);
  await sleep(600);
  // AwakeningFlow state machine should advance to CycleSetupScreen for P3+.
  s = await cdp.eval(storeActions.snapshot);
  findings.probes.afterP3Prestige = s;
  await cdp.screenshot('07-p3-prestige.png');

  // Check for CycleSetupScreen / Polarity picker in DOM.
  const cycleSetup = await cdp.eval(`(()=>{
    const cs = document.querySelector('[data-testid="cycle-setup-screen"]');
    const polarityPicker = document.querySelector('[data-testid^="polarity-option-"]');
    return {
      screenPresent: !!cs,
      polarityOptions: document.querySelectorAll('[data-testid^="polarity-option-"]').length,
      sampleText: cs?.textContent?.slice(0, 200) ?? null,
    };
  })()`);
  findings.probes.cycleSetup = cycleSetup;
  if (!cycleSetup.screenPresent) findings.warnings.push('CycleSetupScreen not rendered after P3+1 prestige — check AwakeningFlow transition');
  else findings.ok.push(`CycleSetupScreen present with ${cycleSetup.polarityOptions} polarity options`);

  // ═══ STEP 11: Tap-target sizing (WCAG ≥40px) ═══
  console.log('→ step 11: tap-target sizing');
  const taps = await cdp.eval(`(()=>{
    const ids = [
      'hud-tab-mind','hud-tab-neurons','hud-tab-upgrades','hud-tab-regions',
      'mind-subtab-home','mind-subtab-patterns','mind-subtab-archetypes',
      'hud-discharge-button-wrapper','hud-awakening-button',
    ];
    const out = {};
    for (const id of ids) {
      const el = document.querySelector('[data-testid="'+id+'"]');
      if (!el) { out[id] = null; continue; }
      const r = el.getBoundingClientRect();
      out[id] = { w: Math.round(r.width), h: Math.round(r.height), ok: r.width >= 40 && r.height >= 40 };
    }
    return out;
  })()`);
  findings.probes.tapTargets = taps;
  for (const [id, info] of Object.entries(taps)) {
    if (!info) { findings.warnings.push(`tap-target ${id} not in DOM`); continue; }
    if (!info.ok) findings.ux.push(`tap target below 40px: ${id} (${info.w}×${info.h})`);
  }
  const okTaps = Object.values(taps).filter(t => t?.ok).length;
  findings.ok.push(`tap targets ≥40px: ${okTaps}/${Object.keys(taps).length}`);

  // ═══ STEP 12: HUD element overlap detection ═══
  console.log('→ step 12: overlap detection');
  const overlap = await cdp.eval(`(()=>{
    const ids = ['hud-thoughts','hud-rate','hud-memories','hud-connection-chip','hud-discharge-button-wrapper','hud-awakening-button','mind-subtab-bar','hud-tabbar'];
    const boxes = {};
    for (const id of ids) {
      const el = document.querySelector('[data-testid="'+id+'"]');
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      boxes[id] = { x: r.x, y: r.y, r: r.x + r.width, b: r.y + r.height };
    }
    const overlaps = [];
    const names = Object.keys(boxes);
    for (let i = 0; i < names.length; i++) {
      for (let j = i+1; j < names.length; j++) {
        const a = boxes[names[i]]; const b = boxes[names[j]];
        const ix = Math.max(0, Math.min(a.r, b.r) - Math.max(a.x, b.x));
        const iy = Math.max(0, Math.min(a.b, b.b) - Math.max(a.y, b.y));
        if (ix > 2 && iy > 2) overlaps.push({ a: names[i], b: names[j], area: ix * iy });
      }
    }
    return { tracked: names, overlaps };
  })()`);
  findings.probes.hudOverlap = overlap;
  if (overlap.overlaps.length > 0) {
    for (const o of overlap.overlaps) findings.ux.push(`overlap: ${o.a} × ${o.b} = ${o.area}px²`);
  } else findings.ok.push(`no overlaps across ${overlap.tracked.length} HUD elements`);

  // ═══ STEP 13: Safe-area insets respected ═══
  console.log('→ step 13: safe-area check');
  const safeArea = await cdp.eval(`(()=>{
    const thoughtsEl = document.querySelector('[data-testid="hud-thoughts"]');
    const tabbarEl = document.querySelector('[data-testid="hud-tabbar"]');
    const thoughts = thoughtsEl?.getBoundingClientRect();
    const tabbar = tabbarEl?.getBoundingClientRect();
    const insetTop = getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top') || '0px';
    const insetBottom = getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '0px';
    return {
      thoughtsTopPx: thoughts?.y ?? null,
      tabbarBottomPx: tabbar ? (innerHeight - (tabbar.y + tabbar.height)) : null,
      cssVarTop: insetTop.trim(),
      cssVarBottom: insetBottom.trim(),
      innerHeight,
    };
  })()`);
  findings.probes.safeArea = safeArea;
  if (safeArea.thoughtsTopPx !== null && safeArea.thoughtsTopPx < 8) findings.ux.push(`thoughts counter top=${safeArea.thoughtsTopPx}px (notch clearance may be tight)`);
  else findings.ok.push(`thoughts top offset: ${safeArea.thoughtsTopPx}px`);

  // ═══ STEP 14: Final state reset + device info ═══
  console.log('→ step 14: cleanup');
  await cdp.eval(`window.__SYNAPSE_STORE__.getState().reset()`);
  await sleep(200);
  const dev = await cdp.eval(`JSON.stringify({w:innerWidth,h:innerHeight,dpr:devicePixelRatio,ua:navigator.userAgent.slice(0,80)})`);
  findings.probes.device = JSON.parse(dev);
  await cdp.screenshot('08-final-reset.png');

  cdp.close();
}

try {
  await main();
} catch (err) {
  findings.errors.push(`[harness] ${err instanceof Error ? err.stack : String(err)}`);
}

writeFileSync('.playtest-report-mi-a3-deep.json', JSON.stringify(findings, null, 2));
console.log('');
console.log('═══ DEEP Mi A3 PLAYTEST REPORT ═══');
console.log(`OK       ${findings.ok.length}`);
console.log(`WARN     ${findings.warnings.length}`);
console.log(`ERROR    ${findings.errors.length}`);
console.log(`UX       ${findings.ux.length}`);
if (findings.errors.length) { console.log('\nERRORS:'); findings.errors.forEach(e => console.log(`  ✗ ${e}`)); }
if (findings.warnings.length) { console.log('\nWARNINGS:'); findings.warnings.forEach(w => console.log(`  ⚠ ${w}`)); }
if (findings.ok.length) { console.log('\nPASSED:'); findings.ok.forEach(o => console.log(`  ✓ ${o}`)); }
if (findings.ux.length) { console.log('\nUX:'); findings.ux.forEach(u => console.log(`  • ${u}`)); }
console.log('\nscreenshots: ' + SCREEN_DIR + '/');
console.log('full report: .playtest-report-mi-a3-deep.json');
process.exit(findings.errors.length > 0 ? 1 : 0);
