// One-shot visual verification of Sprint 4c.6.6 UX fixes on Mi A3.
// Not committed as a persistent test — just captures before/after evidence.

import { execSync } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { mkdirSync, writeFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import WebSocket from 'ws';

const ADB = 'C:/Users/abadn/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const CDP_HTTP = 'http://localhost:9222';
const APP_URL = 'http://localhost:5173';
const OUT = '.playtest-screens-mi-a3-verify';
mkdirSync(OUT, { recursive: true });

execSync(`"${ADB}" shell input keyevent KEYCODE_WAKEUP`, { stdio: 'ignore' });
execSync(`"${ADB}" shell input swipe 500 1500 500 500`, { stdio: 'ignore' });

const targets = await (await fetch(`${CDP_HTTP}/json`)).json();
const target = targets.find((t) => t.type === 'page' && t.url.startsWith(APP_URL));
if (!target) throw new Error('no tab');

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.once('open', r); ws.once('error', j); });

let nextId = 1;
const pending = new Map();
ws.on('message', (d) => {
  const m = JSON.parse(d.toString());
  if (m.id !== undefined && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
const send = (method, params = {}) => new Promise((res, rej) => {
  const id = nextId++;
  pending.set(id, (m) => m.error ? rej(new Error(m.error.message)) : res(m.result));
  ws.send(JSON.stringify({ id, method, params }));
});
const evalJs = async (e) => {
  const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
  return r.result.value;
};
const shot = async (f) => {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(`${OUT}/${f}`, Buffer.from(r.data, 'base64'));
};

await send('Page.enable');
await send('Runtime.enable');
await send('Page.reload', { ignoreCache: true });
await sleep(3500);

for (let i = 0; i < 10; i++) {
  const ok = await evalJs(`typeof window.__SYNAPSE_STORE__ !== 'undefined'`);
  if (ok) break;
  await sleep(300);
}

// Seed state: post-P1 (memories=2, home subtab) to expose BOTH issues.
await evalJs(`window.__SYNAPSE_STORE__.getState().reset()`);
await sleep(200);
await evalJs(`window.__SYNAPSE_STORE__.setState(s => ({ ...s, memories: 2, activeTab: 'mind', activeMindSubtab: 'home' }))`);
await sleep(400);
await shot('01-home-with-memories.png');

// Check subtab button dimensions.
const dims = await evalJs(`(()=>{
  const ids = ['mind-subtab-home','mind-subtab-patterns','mind-subtab-archetypes','mind-subtab-diary','mind-subtab-achievements','mind-subtab-resonance'];
  return ids.map(id => {
    const el = document.querySelector('[data-testid="'+id+'"]');
    if (!el) return { id, missing: true };
    const r = el.getBoundingClientRect();
    return { id, w: Math.round(r.width), h: Math.round(r.height), ok40: r.height >= 40, ok48: r.height >= 48 };
  });
})()`);

// Check overlap with memories counter.
const overlap = await evalJs(`(()=>{
  const mem = document.querySelector('[data-testid="hud-memories"]')?.getBoundingClientRect();
  const bar = document.querySelector('[data-testid="mind-subtab-bar"]')?.getBoundingClientRect();
  if (!mem || !bar) return { mem: !!mem, bar: !!bar };
  const ix = Math.max(0, Math.min(mem.right, bar.right) - Math.max(mem.x, bar.x));
  const iy = Math.max(0, Math.min(mem.bottom, bar.bottom) - Math.max(mem.y, bar.y));
  return {
    memories: { x: Math.round(mem.x), y: Math.round(mem.y), w: Math.round(mem.width), h: Math.round(mem.height) },
    subtabBar: { x: Math.round(bar.x), y: Math.round(bar.y), w: Math.round(bar.width), h: Math.round(bar.height) },
    overlapArea: Math.round(ix * iy),
  };
})()`);

// Device info.
const dev = await evalJs(`JSON.stringify({w:innerWidth,h:innerHeight,dpr:devicePixelRatio})`);

console.log('');
console.log('═══ Mi A3 FIX VERIFICATION ═══');
console.log('device:', dev);
console.log('subtab button sizes:');
dims.forEach(d => console.log(`  ${d.id}: ${d.w}×${d.h} (≥40: ${d.ok40}, ≥48: ${d.ok48})`));
console.log('memories × subtab-bar:', JSON.stringify(overlap, null, 2));
console.log(`screenshot: ${OUT}/01-home-with-memories.png`);
ws.close();
