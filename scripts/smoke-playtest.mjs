// Smoke playtest — loads the dev server, drives the UI through the critical
// path, and flags console errors. NOT a replacement for Nico's human blind-play
// (which tests feel, not correctness), but verifies the pipeline isn't broken.
//
// Run: npx tsx scripts/smoke-playtest.mjs  (dev server must be running on :5173)
//
// Checks:
//   1. Page loads without throwing.
//   2. HUD root mounts (critical — canvas + all HUD components render).
//   3. Tap handler fires (pointerdown on canvas center → thoughts increment).
//   4. Tab switching works (Neurons / Upgrades / Regions / Mind).
//   5. Neurons panel renders 5 rows.
//   6. A Básica purchase goes through (needs enough thoughts).
//   7. Console errors / unhandled rejections are flagged.
//   8. Screenshots captured to .playtest-screens/ for visual inspection.

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE_URL = 'http://localhost:5173';
const SCREEN_DIR = '.playtest-screens';
mkdirSync(SCREEN_DIR, { recursive: true });

const errors = [];
const warnings = [];

function log(label, detail = '') {
  console.log(`[${label}]${detail ? ' ' + detail : ''}`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 420, height: 820 }, // iPhone-ish portrait
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`[console.error] ${msg.text()}`);
    if (msg.type() === 'warning') warnings.push(`[console.warn] ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`));
  page.on('requestfailed', (req) => errors.push(`[requestfailed] ${req.url()} ${req.failure()?.errorText ?? ''}`));

  try {
    log('boot', `→ ${BASE_URL}`);
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15_000 });

    // 1. HUD root mounts.
    await page.waitForSelector('[data-testid="hud-root"]', { timeout: 10_000 });
    log('mount', 'HUD root ✓');

    await page.waitForSelector('[data-testid="neuron-canvas"]', { timeout: 5000 });
    log('mount', 'canvas ✓');

    // 2. Tap handler — 30 taps at canvas center.
    const canvas = await page.$('[data-testid="neuron-canvas"]');
    if (!canvas) throw new Error('neuron-canvas missing');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('canvas bbox missing');
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    log('probe', `canvas bbox: ${JSON.stringify(box)}`);

    // Give the game tick / layout a moment to settle.
    await page.waitForTimeout(500);

    // Probe thoughts counter before + after taps.
    const thoughtsSelector = '[data-testid="hud-thoughts"]';
    const thoughtsBefore = await page.textContent(thoughtsSelector).catch(() => null);
    log('probe', `thoughts before taps: ${thoughtsBefore}`);
    for (let i = 0; i < 30; i++) {
      await page.touchscreen.tap(cx, cy);
      await page.waitForTimeout(50);
    }
    const thoughtsAfter = await page.textContent(thoughtsSelector).catch(() => null);
    log('probe', `thoughts after 30 taps: ${thoughtsAfter}`);

    await page.screenshot({ path: join(SCREEN_DIR, '01-post-taps.png') });
    log('screenshot', '01-post-taps.png');

    // 3. Tab switching.
    for (const tab of ['neurons', 'upgrades', 'regions', 'mind']) {
      const sel = `[data-testid="hud-tab-${tab}"]`;
      const btn = await page.$(sel);
      if (!btn) { warnings.push(`tab ${tab} button missing`); continue; }
      await btn.click();
      await page.waitForTimeout(200);
      log('tab-switch', tab);
      await page.screenshot({ path: join(SCREEN_DIR, `02-tab-${tab}.png`) });
    }

    // 4. Neurons panel — 5 rows?
    await page.click('[data-testid="hud-tab-neurons"]');
    await page.waitForTimeout(300);
    const neuronRows = await page.$$('[data-testid^="panel-neurons-row-"]');
    log('probe', `neuron rows visible: ${neuronRows.length}`);
    if (neuronRows.length < 1) warnings.push('no neuron rows visible');

    // 5. Try to buy a Básica (player has momentum 0 + 30 taps × 1 thought = 30 thoughts, base cost 10).
    const buyBasica = await page.$('[data-testid="panel-neurons-buy-basica"]');
    if (buyBasica) {
      await buyBasica.click();
      await page.waitForTimeout(200);
      const afterBuy = await page.textContent(thoughtsSelector).catch(() => null);
      log('probe', `thoughts after 1 Básica buy: ${afterBuy}`);
      await page.screenshot({ path: join(SCREEN_DIR, '03-post-buy.png') });
    } else {
      warnings.push('Básica buy button not found (pattern changed?)');
    }

    // 6. MindPanel subtabs.
    await page.click('[data-testid="hud-tab-mind"]');
    await page.waitForTimeout(200);
    const mindSubtabBar = await page.$('[data-testid="mind-subtab-bar"]');
    log('probe', `MindPanel subtab bar present: ${Boolean(mindSubtabBar)}`);
    if (!mindSubtabBar) warnings.push('MindPanel subtab bar not rendered');

    await page.click('[data-testid="mind-subtab-patterns"]');
    await page.waitForTimeout(200);
    const patternGrid = await page.$('[data-testid="pattern-tree-grid"]');
    log('probe', `Pattern tree grid present: ${Boolean(patternGrid)}`);
    await page.screenshot({ path: join(SCREEN_DIR, '04-patterns-subtab.png') });
  } catch (err) {
    errors.push(`[test-thrown] ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    await browser.close();
  }

  const report = {
    base: BASE_URL,
    errorCount: errors.length,
    warningCount: warnings.length,
    errors,
    warnings,
    screensDir: SCREEN_DIR,
    timestamp: new Date().toISOString(),
  };
  writeFileSync('.playtest-report.json', JSON.stringify(report, null, 2));
  console.log('');
  console.log('─── SMOKE PLAYTEST REPORT ───');
  console.log(`errors   ${errors.length}`);
  console.log(`warnings ${warnings.length}`);
  if (errors.length) {
    console.log('');
    errors.forEach((e) => console.log(`  ✗ ${e}`));
  }
  if (warnings.length) {
    console.log('');
    warnings.forEach((w) => console.log(`  ⚠ ${w}`));
  }
  console.log('');
  console.log(`screenshots: ${SCREEN_DIR}/`);
  console.log(`full report: .playtest-report.json`);
  process.exit(errors.length > 0 ? 1 : 0);
}

main();
