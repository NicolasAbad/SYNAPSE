# Mi A3 Perf Procedure — Sprint 2 Phase 7

**Device:** Xiaomi Mi A3 · Android 11 · Chrome 127+
**Target:** average ≥ `SYNAPSE_CONSTANTS.perfTargetFps` (30) during the
100-neuron stress test, dropped-frame% ≤ `perfDroppedFramePctBudget` (10%).

Desktop `npm run test:perf` is the automated gate for every commit;
`npm run test:perf:mi-a3` runs the same stress against real Mi A3
Chrome via adb + raw CDP. Capacitor WebView perf (the production
shell) is a **Sprint 11a** device-matrix deliverable — the procedure
here measures Chrome browser on Mi A3, which is the closest
approximation we can run today.

---

## Automated run — `npm run test:perf:mi-a3`

### Prerequisites (one-time per connected session)

1. Mi A3 connected via USB, USB debugging enabled (Developer Options).
2. `adb devices` shows the Mi A3.
3. Mi A3 lockscreen unlocked if PIN/pattern is set (the script wakes
   the display but cannot bypass secure unlock).
4. Port bridges set up:
   ```bash
   adb reverse tcp:5173 tcp:5173                              # device → desktop Vite
   adb forward tcp:9222 localabstract:chrome_devtools_remote  # desktop → Mi A3 Chrome
   ```
5. Vite dev server bound to **IPv4** (adb reverse is IPv4-only):
   ```bash
   npm run dev -- --host 0.0.0.0
   ```
   Default `npm run dev` on Node.js Windows may bind IPv6-only (`[::1]:5173`);
   the `--host 0.0.0.0` forces IPv4 so the adb reverse bridge works.

### Run

```bash
npm run test:perf:mi-a3
```

The script:
1. Wakes the Mi A3 display and dismisses basic lockscreen (swipe).
2. `adb shell am start` launches Chrome on the device pointing at
   `http://localhost:5173` (which maps to the desktop Vite via the
   `adb reverse` bridge).
3. Polls CDP (`localhost:9222/json`) for a page with matching URL.
4. Attaches a raw WebSocket CDP client (Playwright `connectOverCDP`
   has Android surface quirks; raw CDP is more reliable).
5. Sends `Page.reload { ignoreCache: true }` to flush any stale
   bundle from prior manual tests.
6. Waits for `window.__SYNAPSE_PERF__` (dev-only instrument).
7. Waits `splashDurationMs + 1s` for the splash to fade.
8. Calls `startStress()` → waits `perfSpikeDurationMs` (30s) →
   `getReport()` → `stopStress()`.
9. Prints the `FPSReport` and exits 0 on pass, 1 on budget violation.

### Example passing output (2026-04-20, commit post-Phase-7)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Phase 7 perf spike — Mi A3 (real device, Android 11 Chrome)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Frames measured:   1779
  Avg fps:           59.63
  Min fps:           29.85
  P5 fps:            59.52
  Dropped frames:    6 (0.3%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Mi A3 perf spike PASSED
```

### Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `ERR_EMPTY_RESPONSE` on Mi A3 page | Vite bound IPv6-only | `npm run dev -- --host 0.0.0.0` |
| `No Chrome tab at URL` | Chrome not foregrounded | Re-run; script relaunches Chrome |
| `0 frames measured` | Display OFF / dozing | Script wakes it; if still fails, check PIN lockscreen |
| `__SYNAPSE_PERF__ undefined` | Cached old bundle | Script reloads with ignoreCache; verify Vite is DEV build |
| CDP returns no pages | `adb forward` not set | Re-run the forward command in prerequisites |

---

## Manual run (DevTools-only, no script)

If automation is unavailable (no Playwright, no tsx), run manually:

### 1. Start the dev server bound to IPv4

```bash
npm run dev -- --host 0.0.0.0
```

### 2. Open the game on Mi A3

Over the LAN URL Vite prints, OR over adb reverse:

```bash
adb reverse tcp:5173 tcp:5173
# Then on Mi A3 Chrome, navigate to http://localhost:5173
```

### 3. Open remote DevTools on the desktop

Desktop Chrome → `chrome://inspect/#devices` → **Inspect** the Mi A3 tab.

### 4. Run the stress test

In the Mi A3 remote DevTools Console:

```js
window.__SYNAPSE_PERF__.startStress()
// wait 30s
window.__SYNAPSE_PERF__.getReport()
// { avg, min, p5, frameCount, droppedFrames }
window.__SYNAPSE_PERF__.stopStress()
```

### 5. Capture memory delta (optional — adb path)

```bash
adb shell "ps -A | grep chrome$"                         # find Chrome PID
adb shell dumpsys meminfo <PID> | grep "TOTAL PSS"       # before + during
```

PSS delta should be ≤ 20 MB (`perfMemoryDeltaBudgetMB × 1024 KB`).

## Recording results

Paste the FPSReport + PSS delta into the Phase 7 session log entry in
`docs/PROGRESS.md`. Mark the test date and Chrome version
(`chrome://version` on Mi A3).

## Pass/fail

| Metric | Budget | Source |
|---|---|---|
| avg fps | ≥ 30 | `perfTargetFps` |
| dropped frames | ≤ 10% | `perfDroppedFramePctBudget` |
| PSS delta | ≤ 20 MB | `perfMemoryDeltaBudgetMB` |

**If avg fps < 30:** apply the optimization cascade per
`docs/SPRINTS.md` §Sprint 2 line 247. In order, stop when the budget
is met:

1. Reduce `CANVAS.glowRadiusMultiplier` from 2.5 → 1.8 (smaller glow
   sprites, ~48% less offscreen canvas area).
2. Skip glow for neurons with `visualRadius < 10` (drops glow from
   Básica and Sensorial — 40% of node draws).
3. Reduce `SYNAPSE_CONSTANTS.maxVisibleNodes` from 80 → 60.
   Requires updating CODE-4 in CLAUDE.md and SPRINTS.md in the same commit.
4. Reduce `SYNAPSE_CONSTANTS.canvasMaxDPR` from 2 → 1.5 (44% less
   canvas buffer on DPR=2 devices — visual sharpness decreases).
5. Skip every other rAF frame (30fps cap). Halves draw calls but
   visibly reduces smoothness.

Each optimization = one commit with before/after fps numbers in the
commit message. If all five cascades fail to reach 30 fps on Mi A3:
escalate to Nico with the full FPSReport + PSS deltas.
