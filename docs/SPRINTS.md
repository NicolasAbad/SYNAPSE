# SYNAPSE — Sprint Plan & Checklists

21 sprints totaling **76 days of sprint work + 4 buffer days = ~80 days end-to-end**, plus Sprint 0 (PARALLEL marketing, not on critical path). Originally stated as "67 days" — that figure was a miscalculation; the correct sum of individual sprint durations (5+6+5+3+2+3+4+5+5+3+3+2+3+4+5+2+3+4+5) = 76 days. Second audit 5A-1 corrected this AND inserted two 2-day buffer windows per **SCHED-1** (§35) for realistic planning: one after Sprint 4c (end of prestige foundation — high-risk integration area), one after Sprint 9b (end of monetization — known source of platform-review delays for solo devs). Buffer days are NOT optional and NOT free time if a sprint finishes early — they exist to absorb slippage from OTHER sprints.

Each sprint has three types of checks:
- **AI checks** ✅ — Claude Code verifies automatically (compile, lint, unit tests, structural)
- **Sprint tests** 🧪 — New test files per TEST-3 requirement (unit + integration + E2E)
- **Player tests** 🎮 — Nico plays the game on a device and confirms

**Rule CODE-3:** A sprint is NOT done until every checkbox is checked.

Sprints 0 and 12-13 are fully manual (no Claude Code involvement for core tasks). Sprints 1-11b are Claude Code development sprints.

---

## Prompt template for Claude Code (use at start of EVERY sprint)

Do NOT start a sprint with a vague prompt like "Implement Sprint 4". Vague prompts invite invention. Use this template, filling in the sprint-specific parts:

```
Implementá Sprint {N} per docs/SPRINTS.md §Sprint {N}.

Specs están en:
- docs/GDD.md §{relevant sections for this sprint}
- docs/NARRATIVE.md §{if applicable}
- src/config/constants.ts (valores canónicos)

Reglas estrictas (leé CLAUDE.md §"Anti-invention rules" completa):

1. Si necesitás un valor que no está en src/config/constants.ts o en docs/GDD.md,
   PARÁ inmediatamente y preguntá. NO inventes un default "razonable".
   NO interpoles desde valores similares. NO digas "se puede tunear después".

2. Si una especificación es ambigua (ej: "la Mutation afecta producción" sin multiplier
   exacto), PARÁ y preguntá. Eso es un spec gap, no invitación a interpretar.

3. Si descubrís un feature faltante mientras implementás Sprint {N}:
   NO lo agregues silenciosamente. Documentalo en docs/PROGRESS.md bajo
   "Discovered during Sprint {N}" y continuá con lo que está especificado.
   Nico decide si/cuándo agregarlo.

4. NO cambies una spec existente silenciosamente. Si pensás que un valor o fórmula
   en el GDD es incorrecto, escribí tu propuesta en un comment y pedí que Nico lo
   revise antes de aplicar.

5. NO skipees un test porque "no aplica acá". Si un test del Sprint checklist parece
   mal, preguntá. No decidás vos solo.

6. Al final de cada archivo que toques en src/engine/, agregá top-of-file comment:
   // Implements docs/GDD.md §{N} ({feature name})

7. Al final de la sesión:
   - Corré `npm test` — todo verde
   - Corré `bash scripts/check-invention.sh` — todos los gates pasan
   - Actualizá docs/PROGRESS.md con:
     • Archivos creados/modificados
     • Checkboxes completados del Sprint {N}
     • Issues descubiertos (si los hubo)
     • Decisiones tomadas que divergen del GDD (si las hubo) con rationale
     • Next action para la próxima sesión

Constraints técnicos (de CLAUDE.md):
- CODE-1: zero hardcoded game values. Todo viene de config/constants.ts o i18n.
- CODE-2: max 200 líneas por file, max 50 por función. Si algo queda más grande, dividí.
- CODE-6: usá Capacitor Preferences, NUNCA localStorage.
- CODE-9: no Math.random() ni Date.now() en src/engine/. Usá seeded PRNG + timestamps como params.

Arrancá leyendo CLAUDE.md + docs/PROGRESS.md. Después pedí lo que necesitás clarificar
antes de escribir código.
```

### Why this template matters

The difference between a vague prompt and this template is material:

- Vague: Claude Code implements with 15-20% silent invention. Bugs surface in testing or production.
- Templated: Claude Code asks ~5-10 clarifying questions per sprint. You answer them. Result: ~2-3% invention, caught by check-invention gates.

Treat this template as sacred. Every sprint start, paste it with the sprint number filled in. Don't shortcut.

### If Claude Code starts inventing anyway

Watch for these signals during a session:
- Uses a number without citing a constants.ts reference or GDD section
- Implements a feature that wasn't in the sprint checklist
- Says "I'll use X as a reasonable default" for anything gameplay-related
- Changes an existing value "to make it work" without pausing first
- Skips a test because "it's covered elsewhere"

If you see any of these, stop the session and say:

> "You just invented [X]. Revert that. Ask me for the correct value based on docs/GDD.md § or src/config/constants.ts, or flag it as a spec gap in docs/PROGRESS.md. Do not continue until this is resolved."

That recalibrates. Claude Code is strongly aligned with documented specs when pushed back on invention — but without pushback, it defaults to "make progress at all costs", which is the wrong prior for this project.

---


## Table of contents

- [Sprint 0: Pre-launch Marketing (PARALLEL, manual)](#sprint-0-pre-launch-marketing-parallel-manual)
- [Sprint 1: Project Setup + Core Engine](#sprint-1-project-setup--core-engine)
- [Sprint 2: Canvas + HUD + Performance Spike](#sprint-2-canvas--hud--performance-spike)
- [Sprint 3: Neurons + Upgrades + Discharge](#sprint-3-neurons--upgrades--discharge)
- [Sprint 4a: Prestige Core](#sprint-4a-prestige-core-3-days--critical)
- [Sprint 4b: Pattern Tree + Decisions](#sprint-4b-pattern-tree--decisions-2-days--critical)
- [Sprint 4c: Polarity + CycleSetupScreen + Playtest](#sprint-4c-polarity--cyclesetupscreen--playtest-3-days--critical)
- [Sprint 5: Mutations + Pathways + Regions](#sprint-5-mutations--pathways--regions)
- [Sprint 6: Archetypes + Narrative + Events](#sprint-6-archetypes--narrative--events)
- [Sprint 7: Five Features (Achievements, Mental States, Micro-challenges, Diary, What-if)](#sprint-7-five-features)
- [Sprint 8a: Offline + Sleep + Lucid Dream](#sprint-8a-offline--sleep--lucid-dream-3-days--critical)
- [Sprint 8b: Transcendence + Runs 2-3 + Resonance](#sprint-8b-transcendence--runs-2-3--resonance-3-days--critical)
- [Sprint 8c: Resonant Patterns + TEST-5](#sprint-8c-resonant-patterns--test-5-2-days--critical)
- [Sprint 9a: Core SDK + Ads](#sprint-9a-core-sdk--ads-3-days--high-risk)
- [Sprint 9b: Offerings + Cosmetics + Analytics](#sprint-9b-offerings--cosmetics--analytics-3-days--high-risk)
- [Sprint 10: Polish + Infrastructure](#sprint-10-polish--infrastructure)
- [Sprint 11a: Test Infrastructure + Coverage](#sprint-11a-test-infrastructure--coverage-2-days--critical)
- [Sprint 11b: Device Matrix + External Testers + Performance](#sprint-11b-device-matrix--external-testers--performance-3-days--critical)
- [Sprint 12: Store Preparation + Submission (MANUAL)](#sprint-12-store-preparation--submission-manual)
- [Sprint 13: Soft Launch → Global (MANUAL)](#sprint-13-soft-launch--global-manual)

---

## Sprint 0: Pre-launch Marketing (PARALLEL, manual)

Runs alongside Sprints 1-10. ~30 min/week.

**Nico tasks:**
- [ ] Create TikTok/Instagram account. First post: "Building a game 100% with AI — Day 1"
- [ ] Post weekly progress: GIFs of canvas, screenshots of neurons, short video clips
- [ ] Create r/incremental_games (Reddit) presence — share early GIFs
- [ ] Set up Discord server OR landing page with email signup
- [ ] Research ASO keywords: idle, brain, neuron, evolution, mind, incremental, prestige
- [ ] (At Sprint 8) Record 30-second gameplay trailer
- [ ] (At Sprint 10) Create feature graphic for Google Play (1024×500)
- [ ] (At Sprint 12) Post "launching soon" on all channels

**External dependencies (complete BEFORE the sprint that needs them):**
- [ ] (Before Sprint 9a ~day 44) Apple Developer account active ($99) + sandbox test user created
- [ ] (Before Sprint 9a ~day 44) Google Play Console account active ($25) + test track configured
- [ ] (Before Sprint 11b ~day 55) BrowserStack trial OR Firebase Test Lab configured
- [ ] (Before Sprint 12 ~day 58) Privacy policy URL live (GitHub Pages or similar)
- [ ] (Before Sprint 12 ~day 58) Terms of Service URL live

Duration: **PARALLEL** · 30 min/week.

---

## Sprint 1: Project Setup + Core Engine

Scaffold the project, implement the engine primitives and save system.

**Duration:** 5 days · CRITICAL

**Prompt to Claude Code:**
> Implement Sprint 1 per docs/SPRINTS.md. Read docs/GDD.md §30-31 for types + constants. Create the scaffolding, GameState (110 fields per §32), engine core (production, softCap, tick), save system, and Sprint 1 tests.

**AI checks ✅:**
- [ ] `npm run dev` starts without errors
- [ ] `npm run build` produces bundle < 2MB
- [ ] GameState interface compiles — exactly 110 fields, all typed, no `any`
- [ ] `Object.keys(DEFAULT_STATE).length === 110` (Sprint 1 invariant)
- [ ] `SYNAPSE_CONSTANTS` exports every value listed in GDD §31
- [ ] `softCap(100) = 100`, `softCap(200) ≈ 164.9`, `softCap(1000) ≈ 524.8`
- [ ] `calculateProduction()` returns `{ base, effective }` separately (no deprecated `productionPerSecond`)
- [ ] Tick loop runs at 100ms with fixed dt (not variable)
- [ ] Tick implements TICK-1 order exactly (12 steps per GDD §35). Order covered by `tests/tick-order.test.ts` snapshot test — each step observed via state delta between step N and N+1.
- [x] `t('key')` returns English strings for all keys (Phase 4.9 Sprint 2 — deferred from Sprint 1 per Finding #16)
- [ ] Spanish locale (es.ts) deferred to v1.1 per POSTLAUNCH.md — v1.0 is English-only user-facing (Finding #17)
- [ ] `saveGame()` called ONLY on prestige + background + 30s interval — NEVER on tick
- [ ] `PROGRESS.md` created with Sprint 1 status
- [ ] ESLint zero warnings. No file > 200 lines. No function > 50 lines.
- [ ] All numbers come from `constants.ts` (zero hardcoded — CODE-1)
- [ ] No `Math.random()` or `Date.now()` in `src/engine/` (CODE-9)
- [ ] `src/engine/rng.ts` implements `mulberry32`, `hash`, `seededRandom`, `randomInRange`, `pickWeightedRandom` per GDD §30 RNG-1. Snapshot test: `mulberry32(12345)()` first 3 values match spec (10-digit precision).
- [ ] Capacitor Preferences used for storage, NOT localStorage (CODE-6)
- [ ] `scripts/check-invention.sh` is executable and runs without blocker failures
- [ ] `npm run check-invention` script added to `package.json` (calls check-invention.sh)
- [ ] `tests/consistency.test.ts` implemented (unskip all relevant tests, replace stubs with real imports)
- [ ] All consistency tests pass (`npx vitest run tests/consistency.test.ts`)
- [ ] Pre-commit hook (husky or similar) runs: `lint → typecheck → check-invention → test`
- [ ] Every file in `src/engine/` has top-of-file comment `// Implements docs/GDD.md §N ({name})`

**Sprint 1 tests 🧪 (TEST-3 requirement):**
- [ ] `vitest` installed and `npm test` runs
- [ ] Unit: `softCap()` exact values for 0, 100, 200, 1000, 10000
- [ ] Unit: neuron cost scaling `baseCost × 1.28^owned` for owned=0..50
- [ ] Unit: `GameState` JSON round-trip preserves all 110 fields
- [ ] Unit: `calculateThreshold(p, t)` pure function — `calculateThreshold(0, 0) === 800_000`, `calculateThreshold(0, 1) === 2_800_000`, `calculateThreshold(25, 2) === 42_000_000_000`. Out-of-range `p` clamps to `[0, 25]`, out-of-range `t` clamps to `[0, 5]`. Uses `RUN_THRESHOLD_MULT[t]` correctly (THRES-1, §9).
- [ ] Unit: `calculateCurrentThreshold(state)` — with `isTutorialCycle: true, transcendenceCount: 0` → returns `50_000`. With `isTutorialCycle: false, prestigeCount: 0, transcendenceCount: 0` → returns `800_000` (TUTOR-2).
- [ ] Unit: `DEFAULT_STATE` has exactly 110 keys (assert count + assert each is in GameState)
- [ ] Unit: tick at 100ms accumulates thoughts correctly over 10 seconds
- [ ] Integration: `saveGame()` + `loadGame()` round-trip preserves state
- [ ] Integration: 4h simulated offline → thoughts match formula × efficiency × 4h
- [ ] Consistency: all applicable tests in `tests/consistency.test.ts` pass (see file for full list)

**Player tests 🎮:**
- [ ] Open dev server. Initial canvas loads. HUD shows 0 thoughts.
- [ ] Wait 10 seconds. Nothing happens (no neurons bought yet) — expected.
- [ ] Hard-refresh page. State persists (from Preferences).
- [ ] Run `bash scripts/check-invention.sh` — prints "All gates passed"

---

## Sprint 2: Canvas + HUD + Performance Spike

Canvas2D rendering, HUD overlay, tab navigation, theme architecture, performance validation.

**Duration:** 6 days · CRITICAL (+1 for perf spike)

**Prompt to Claude Code:**
> Implement Sprint 2 per docs/SPRINTS.md. Focus on Canvas2D correctness + HUD layout per GDD §29. Include the performance spike: 100 animated nodes + full glow on Pixel 4a emulator, measure fps/memory/battery.

**AI checks ✅:**
- [x] Canvas2D renderer with `devicePixelRatio` scaling for retina — Phase 2 (`dpr.ts`)
- [x] `touchstart` (not `click`) with `passive: false`. `touch-action: manipulation` CSS. — Phase 3 (`NeuronCanvas.tsx` uses `onPointerDown` per comment rationale)
- [x] Safe areas respected via `env(safe-area-inset-*)` — Phase 5 (`HUD.tsx` + `TabBar.tsx`)
- [x] Theme system: 9 theme slots, 3 Era themes implemented (bio, digital, cosmic) — Phase 4 (`src/ui/theme/`)
- [x] Skin/GlowPack system architecture (configs loadable by canvas) — Phase 4 (`cosmeticOverrides.ts`)
- [x] HUD: thoughts (TL), rate (TR), charges (TC), Focus Bar, consciousness bar — Phase 5
- [x] 4 tabs bottom (Neurons, Upgrades, Regions, Mind). Progressive disclosure per GDD §29. — Phase 5 (`TabBar.tsx`)
- [x] Max 1 tab badge active (UI-3 enforced) — Phase 5 (test in `HUD.test.tsx`)
- [x] `formatNumber()` with suffixes: K/M/B/T/Q. — Phase 2 (`util/formatNumber.ts`)
- [x] `wrapText()` with `ctx.measureText()` for canvas text — Phase 2 (`util/wrapText.ts`)
- [x] AudioContext unlock on first tap (iOS) — Phase 3 (`audioUnlock.ts`). Safari device verification deferred to Sprint 11a device matrix.
- [x] Canvas pause on `visibilitychange === 'hidden'` — Phase 2 (`NeuronCanvas.tsx`)
- [x] First-open sequence per UI-9: branded splash (2s) → GDPR if EU → canvas with 1 auto-granted Básica pulsing — Phase 6
- [x] CycleSetupScreen layout per CYCLE-2: step-by-step on <600px, 3-column on ≥600px — Phase 6
- [x] Max 80 visible nodes, pre-rendered glow to offscreen canvas — Phase 7

**Sprint 2 tests 🧪 (TEST-3 requirement):**
- [x] Unit: `formatNumber(1234)` = "1.23K", etc. — Phase 2
- [x] Unit: `wrapText(ctx, "long string", maxWidth)` splits correctly — Phase 2
- [x] Component: HUD renders thoughts/rate/charges in real Chromium — jsdom (HUD.test.tsx) + real-Chromium via Playwright perf-spike (page.goto + waitForSelector('hud-root'))
- [x] Component: tab switch updates `activeTab` state and renders correct panel — Phase 5 (HUD.test.tsx)
- [x] Component: badge priority — multiple triggers → only highest shown (UI-3) — Phase 5
- [x] Integration: canvas + HUD + tabs working together without layout shift — Phase 5
- [x] Performance spike: `test:perf` — desktop Chromium 60.00 fps, Mi A3 59.63 fps, 0.3% dropped, heap Δ 0.00 MB. Battery deferred to Sprint 11a (Nico decision 2026-04-20). Pixel 4a emulator unreachable (EGL init failure — PROGRESS.md WebView session 2); Mi A3 real device is the target.

**Player tests 🎮:** (all PASS 2026-04-20)
- [x] Canvas renders sharp on retina (no blur). Instant tap response. — Desktop Chrome, Nico verified 2026-04-20.
- [x] HUD doesn't overlap notch/safe areas on iPhone 15. — Dynamic Island cleared top, home indicator cleared bottom; `env(safe-area-inset-*)` at `HUD.tsx:36-38` + `TabBar.tsx:33` working as wired. Verified once Nico put desktop + iPhone on same WiFi subnet; upgraded from "iPhone 14" target to iPhone 15 (same notch/Dynamic Island geometry).
- [x] Switch tabs rapidly — no flicker, no layout shift. Desktop Chrome, Nico verified 2026-04-20.
- [x] Record a 60-second gameplay video — saved to `docs/sprint-2-baseline.mp4` (2.4 MB, Nico 2026-04-20). Reference for Sprint 11 visual regression.
- [x] Canvas feels ALIVE (ambient pulse) — verified both desktop Chrome AND Mi A3 real device + Capacitor-packaged app on Mi A3.

**If fps <30 on budget Android:** REDUCE glow blur or node count BEFORE Sprint 3.
→ Not triggered: Mi A3 avg 59.63 fps with wide headroom (Phase 7).

---

## Sprint 3: Neurons + Upgrades + Discharge

5 neuron types, connection system, 35 upgrades (except run-exclusive), Discharge mechanic, Focus Bar, Insight, tap mechanics.

**Duration:** 5 days · CRITICAL

**Prompt to Claude Code:**
> Implement Sprint 3 per docs/SPRINTS.md. Reference GDD §5 (neurons), §6 (Focus), §7 (Discharge), §24 (upgrades). Tap mechanics have pre-P3 vs post-P3 variants. Include Undo toast (UI-4) and anti-spam (TAP-1).

**AI checks ✅:**
- [ ] 5 neuron types with costs, rates, unlock requirements from constants
- [ ] Connection multiplier = `1 + 0.05 × C(ownedTypes, 2)` pairs
- [ ] 35 upgrades implemented with correct categories and unlock conditions. (Run-exclusive upgrades come later — Sprint 8)
- [ ] Discharge: charges accumulate at 1/20min (era-aware, offline-aware)
- [ ] Cascade: Focus ≥ 0.75 at moment of Discharge → ×2.5 mult
- [ ] Tutorial cycle (P0): first Discharge is ×3.0 (tutorialDischargeMult)
- [ ] Focus Bar fills on tap (`focusFillPerTap = 0.01` base)
- [ ] Tap thought contribution (TAP-2, GDD §6): each tap generates `Math.max(baseTapThoughtMin, effectiveProductionPerSecond × baseTapThoughtPct)` thoughts. At P0 with auto-granted Básica (0.5/sec) and no upgrades: tap = 1 thought (min floor). After Potencial Sináptico owned: `baseTapThoughtPct` effectively becomes `potencialSinapticoTapPct` (0.10, replacement not sum). Sinestesia Mutation multiplies tap thoughts by `sinestesiaTapMult` (0.40) for the cycle.
- [ ] Insight auto-activates when `focusBar >= 1.0`. Level 1/2/3 based on prestige (P0-P9 / P10-P18 / P19+).
- [ ] Undo toast for expensive purchases (>10% of thoughts) — UI-4
- [ ] TAP-1 anti-spam: avg <150ms AND std dev <20ms over 30s → 10% effectiveness
- [ ] Haptic feedback on tap (Capacitor.Haptics) — light impact on tap, medium on Discharge, heavy on Cascade, notification on Insight, success on prestige
- [ ] Tutorial hints (P0 only, `isTutorialCycle === true`): 3 non-blocking tooltips — (1) "Tap the neuron" on first canvas load, (2) "Buy your first neuron" when thoughts ≥ baseCost, (3) "Use Discharge" when first charge available. Each dismisses on action completion. No hints after P1.

**Sprint 3 tests 🧪 (TEST-3 requirement):**
- [ ] Unit: neuron cost formula `baseCost × 1.28^owned` matches for all 5 types at 0/10/25/50 owned
- [ ] Unit: connection multiplier with 1/2/3/4/5 neuron types owned = 1.0/1.05/1.15/1.30/1.50
- [ ] Unit: Discharge base burst = `effectivePPS × dischargeMultiplier × 60`
- [ ] Unit: Discharge Cascade = `base × cascadeMult (2.5)` when `focusBar >= 0.75` BEFORE discharge
- [ ] Unit: Second consecutive Discharge CANNOT Cascade unless Focus refilled naturally (BUG-07 fix)
- [ ] Unit: Insight level determination by prestigeCount (P0-9/10-18/19+)
- [ ] Unit: Insight multiplier ×3.0/×8.0/×18.0 and duration 15s/12s/8s
- [ ] Unit: tap thought contribution (TAP-2) — at P0 with 1 Básica, tap yields exactly 1 thought; after Potencial Sináptico purchased with effectivePPS=100, tap yields 10 thoughts; Sinestesia active → 10 × 0.4 = 4 thoughts.
- [ ] Unit: undo toast triggers when purchase > 10% of thoughts
- [ ] Unit: TAP-1 anti-spam activates only on <150ms avg + <20ms variance + 30s sustain
- [ ] Integration: tap for 1 min → Focus fills, Insight triggers, production doubles
- [ ] Integration: buy 10 Básicas + 5 Sensoriales + 3 Piramidales → connectionMult = correct, production rises

**Player tests 🎮:**
- [ ] Buy an upgrade → feel the production change
- [ ] Tap for 15s → Focus Bar visibly rises, Insight triggers
- [ ] Use Discharge right after Insight → feel the burst
- [ ] Trigger a Cascade (Focus ≥75% + Discharge) → visual + audio payoff satisfying
- [ ] Buy something expensive (>10% thoughts) → Undo toast appears for 3s
- [ ] Try to tap-spam → game doesn't penalize normal fast play (7-8 taps/sec bursts OK)

---

## Sprint 4a: Prestige Core (3 days · CRITICAL)

The foundational sprint. Prestige loop works or the game doesn't work. Implement `handlePrestige()` correctly and everything downstream is easier.

**Duration:** 3 days · CRITICAL

**Prompt to Claude Code:**
> Implementá Sprint 4a per docs/SPRINTS.md §Sprint 4a. Lee GDD §9 (prestige system + THRES-1), §20 (Transcendence context), §33 (PRESTIGE_RESET/PRESERVE/UPDATE — exact field split). handlePrestige() DEBE seguir PREST-1 order. PRESTIGE_RESET son exactamente 45 fields, PRESTIGE_PRESERVE 60 fields (Batch 1 2B-1 removed isTutorialCycle), PRESTIGE_UPDATE 4 fields (prestigeCount, currentThreshold, cycleStartTimestamp, isTutorialCycle). Momentum Bonus usa CORE-8 with maxMomentumPct cap (Batch 3 4A-2, 10% of next threshold). Este sprint NO implementa patterns ni polarity — solo el core de prestige. Los tests pueden mockear patterns/polarity para aislar prestige.

**AI checks ✅:**
- [ ] `handlePrestige()` sigue PREST-1 order: (1) capture `lastCycleEndProduction` from current `effectiveProductionPerSecond`, (2) duration, (3) personal best at CURRENT prestigeCount, (4) Resonant Pattern checks stub (placeholder — real impl in Sprint 8c), (5) Resonance gain stub, (6) Patterns gained stub, (7) Memories gained, (8) apply RESET (45 fields), (9) apply UPDATE (prestigeCount += 1, new threshold via `calculateThreshold()`, new cycleStartTimestamp, `isTutorialCycle = false`), (10) lifetimePrestiges++, (11) compute capped Momentum Bonus per CORE-8 amended formula (min of raw × 30 vs nextThreshold × 0.10), add to thoughts
- [ ] PRESTIGE_RESET resets exactly 45 fields to explicit values (per GDD §33)
- [ ] PRESTIGE_PRESERVE keeps 60 fields unchanged (per GDD §33 — isTutorialCycle is NOT here, moved to UPDATE)
- [ ] PRESTIGE_UPDATE writes 4 fields: `prestigeCount += 1`, `currentThreshold` recalculated, `cycleStartTimestamp = timestamp`, `isTutorialCycle = false` (TUTOR-2 one-way flip)
- [ ] `lifetimePrestiges` increments by 1 (separate from UPDATE, PREST-1 step 10)
- [ ] Momentum Bonus = `Math.min(lastCycleEndProduction × 30, nextThreshold × maxMomentumPct)` added to thoughts on new cycle (CORE-8 amended, 4A-2). Cap prevents late-game trivialization.
- [ ] Awakening screen shows: cycle duration, thoughts earned, Memories gained, Personal Best (if beat), Momentum counter animated ("+X thoughts 30s head start")
- [ ] Focus Persistente upgrade: if owned, `focusBar *= 0.25` on prestige (BUG-06 fix). Otherwise 0.
- [ ] Personal best tracking: `personalBests[prestigeCount] = { minutes, rewardGiven }`
- [ ] `dischargeCharges=0` AND `dischargeLastTimestamp=now` after prestige (BUG-02 fix)
- [ ] `insightActive=false` after prestige regardless of prior state (BUG-01 fix)
- [ ] Placeholder button "Reset All Pattern Decisions" (implemented for real in 4b — just UI placeholder here)

**Sprint 4a tests 🧪 (TEST-3 requirement):**
- [ ] Unit: `handlePrestige()` resets EXACTLY 45 fields (assertion iterates PRESTIGE_RESET_FIELDS list from §33)
- [ ] Unit: `handlePrestige()` preserves EXACTLY 60 fields (assertion iterates PRESTIGE_PRESERVE_FIELDS list — isTutorialCycle is NOT in this set)
- [ ] Unit: `handlePrestige()` updates exactly 4 fields: prestigeCount, currentThreshold, cycleStartTimestamp, isTutorialCycle (→ false)
- [ ] Unit: `handlePrestige()` increments lifetimePrestiges by exactly 1
- [ ] Unit: Momentum Bonus raw value (pre-cap) = `lastCycleEndProduction × 30` (CORE-8)
- [ ] Unit: Momentum Bonus clamp triggers — with high PPS (e.g. 1M/sec) at small threshold (1.2M): raw = 30M, cap = 1.2M × 0.10 = 120K → clamp active, final = 120K (CORE-8 amended, 4A-2)
- [ ] Unit: Momentum Bonus no-clamp case — with small PPS (60/sec) at threshold 450K: raw = 1800, cap = 45K → raw < cap, final = 1800 (no clamp, early-game case)
- [ ] Unit: TUTOR-2 flip — with `isTutorialCycle: true` pre-prestige → post-prestige has `isTutorialCycle: false`
- [ ] Unit: Personal best updates correctly at CURRENT prestigeCount, BEFORE increment (BUG-04 fix)
- [ ] Integration: simulate P1 tick-by-tick with 1 tap/sec → threshold reached in 7-9 min (TUTOR-1 target, TUTOR-2 threshold 50K in first cycle only)
- [ ] Integration: simulate P1→P2 (threshold 450K post-rebalance) with 1 tap/sec → target 7 min (ECO-1 interim rebalance)
- [ ] Integration: simulate full cycle end-to-end, prestige, verify new cycle begins correctly with capped Momentum
- [ ] Property-based (fast-check): prestige at any valid state → `prestigeCount` strictly increments, momentum ≤ 10% of next threshold, `isTutorialCycle` always false post-prestige

**Player tests 🎮:**
- [ ] Play P0 to P1 → prestige screen shows correct stats
- [ ] Momentum Bonus animated counter appears on Awakening screen
- [ ] Time P1: MUST be 7-9 minutes (TUTOR-1 target — if >10 min, reduce `tutorialThreshold` before Sprint 4b)
- [ ] Play P1 → P2 → prestigeCount increments, threshold increases, Focus resets correctly
- [ ] Close + reopen app mid-cycle → state preserved

---

## Sprint 4b: Pattern Tree + Decisions (2 days · CRITICAL)

Pattern Tree with 50 nodes + 5 binary decisions at nodes 6/15/24/36/48. patternDecisions NEVER resets. Reset-All escape hatch costs 1000 Resonance (implementable even though Resonance comes in Sprint 8).

**Duration:** 2 days · CRITICAL

**Prompt to Claude Code:**
> Implementá Sprint 4b per docs/SPRINTS.md §Sprint 4b. Lee GDD §10 (Pattern Tree completo). Prestige core ya está implementado (Sprint 4a) — este sprint agrega patterns. handlePrestige() ya fue implementado con stubs para patterns — reemplazá los stubs con lógica real. Pattern Tree tiene 50 nodes, decision nodes en indices exactos [6, 15, 24, 36, 48]. patternDecisions NUNCA se resetea (ni prestige, ni transcendence). Reset button costs 1000 Resonance — funcional aunque Resonance currency no exista todavía (usar stub de resonance balance en GameState).

**AI checks ✅:**
- [ ] Pattern Tree with 50 nodes + 5 decision nodes at indices 6, 15, 24, 36, 48
- [ ] 5 Decision nodes with correct effects from GDD §10 (Node 6 / 15 / 24 / 36 / 48)
- [ ] Node 36 has tier-2 Resonance behavior at P13+ (INT-5 fix): Option B generates Resonance on Discharge, Option A same cascade buff
- [ ] `patternsPerPrestige = 3` added per prestige (replace stub from 4a)
- [ ] `patterns` array and `totalPatterns` counter updated correctly on prestige
- [ ] `patternCycleBonusPerNode = 0.04` applied per pattern earned this cycle, capped at `patternCycleCap = 1.5`
- [ ] `patternFlatBonusPerNode = 2` thoughts/sec per lifetime pattern applied to production
- [ ] "Reset All Pattern Decisions" button in Mind tab costs 1000 Resonance (PAT-3). Double confirmation modal. Double-check before consuming Resonance.
- [ ] `patternDecisions` NEVER resets on prestige or transcendence (verified by test)
- [ ] Mind tab shows Pattern Tree visualization (basic — polish in Sprint 10)
- [ ] Decision node UI: clicking presents A/B options, stores choice, cannot re-choose without PAT-3 reset

**Sprint 4b tests 🧪 (TEST-3 requirement):**
- [ ] Unit: each Pattern decision node (6, 15, 24, 36, 48) applies correct effect from GDD §10
- [ ] Unit: patternCycleBonus caps at 1.5 even with 38 patterns in cycle (boundary test)
- [ ] Unit: `patternDecisions` preserved across 10 prestiges
- [ ] Unit: `patternDecisions` preserved across 1 transcendence (even though transcendence not implemented yet — mock it)
- [ ] Unit: PAT-3 reset costs exactly 1000 Resonance; rejects if resonance < 1000
- [ ] Unit: PAT-3 reset requires double confirmation (test UI state machine)
- [ ] Unit: Decision 4 (node 36) — pre-P13 picks Option A = smaller Cascade buff; Option B = +10% Discharge damage. Post-P13: Option B ALSO generates Resonance (INT-5 fix).
- [ ] Integration: play through multiple cycles, watch cycleBonus accumulate as expected

**Player tests 🎮:**
- [ ] Reach 6 patterns → Decision 1 UI shows, pick option, locks in
- [ ] Mind tab visible with Pattern Tree — tree shows progress
- [ ] Try to reset — warning appears, blocked (not enough Resonance in 4b state)
- [ ] Cycle bonus visible in HUD or debug overlay (to confirm calculation)

---

## Sprint 4c: Polarity + CycleSetupScreen + Playtest (3 days · CRITICAL)

Polarity choice (P3+), CycleSetupScreen unified (1-3 columns), SAME AS LAST button, and **mandatory human playtest** of full Sprints 1-4 integrated.

**Duration:** 3 days · CRITICAL

**Prompt to Claude Code:**
> Implementá Sprint 4c per docs/SPRINTS.md §Sprint 4c. Lee GDD §11 (Polarity), §29 (UI/CycleSetupScreen layout). Polarity se desbloquea en P3. CycleSetupScreen unificado — P3-P6 muestra 1 columna (Polarity), P7-P9 muestra 2 (Polarity + Mutation stub), P10+ muestra 3 (Polarity + Mutation + Pathway stubs). SAME AS LAST button es 1-tap. Al final del sprint: PLAYTEST HUMANO MANDATORIO — ver Player tests.

**AI checks ✅:**
- [ ] Polarity system (P3+): Excitatoria / Inhibitoria with exact effects (Excit +10% prod, -15% Disch; Inhib -6% prod, +30% Disch, +10% Cascade chance)
- [ ] Polarity modifiers applied correctly in production formula (§4)
- [ ] POLAR-1: Polarity defaults to last choice if player skips selection. null until P3 reached.
- [ ] `CycleSetupScreen` unified component — P3-P6 shows 1 col (Polarity), P7-P9 shows 2 col (Polarity + Mutation placeholder), P10+ shows 3 col (Polarity + Mutation + Pathway placeholders)
- [ ] "SAME AS LAST" button defaults to previous choices — 1-tap skip (< 1 sec to resume play)
- [ ] CycleSetupScreen sequence: Awakening animation → 3s → Pattern Tree view → CycleSetupScreen → new cycle
- [ ] Pre-P3: CycleSetupScreen is skipped entirely (no choice to make)

**Sprint 4c tests 🧪 (TEST-3 requirement):**
- [ ] Unit: Polarity modifiers applied correctly in production formula
- [ ] Unit: POLAR-1 default-to-last behavior
- [ ] Integration: Sprint 1-4 end-to-end — create new game, play P0 to P3, pick Polarity, verify production reflects choice
- [ ] Integration: Sprint 1-4 — play P0 to P5, 5 prestiges, each with Polarity choice (or default), all transitions work
- [ ] Component (Vitest Browser): CycleSetupScreen renders 1/2/3 columns based on prestigeCount
- [ ] Component: SAME AS LAST button triggers correctly and applies previous choices

**Player tests 🎮 — MANDATORY HUMAN PLAYTEST:**
- [ ] **Have Nico OR a friend play P0 to P4 blind (no instructions)**
- [ ] Time P1: MUST be 7-9 minutes (TUTOR-1 target)
- [ ] Time P2, P3: MUST be faster than P1 (better upgrades available)
- [ ] If P1 > 10 min OR P2 > 8 min: **STOP, adjust `tutorialThreshold` or boost tap bonus before Sprint 5**. Do not skip this.
- [ ] P3 prestige: Polarity choice appears, player understands what it does
- [ ] Record what confused the tester. Log UX issues in PROGRESS.md for Sprint 10 polish.
- [ ] SAME AS LAST button is discoverable (or at least obvious by P5)
- [ ] Pattern Tree visible in Mind tab. Decisions show at nodes 6 (reached by P2), 15 (reached around P5).
- [ ] Full flow feels cohesive — no jarring transitions between sprints 1-4 work

---

## Buffer 1 — Prestige Integration (2 days · MANDATORY, SCHED-1)

Not a sprint. 2 days reserved for integration + bug fixes on the Sprint 4a/4b/4c prestige triplet. This is the highest-risk section of the project (prestige touches 110 GameState fields across RESET/PRESERVE/UPDATE). History across idle-game projects shows prestige bugs surface during integration, not during implementation. Even if Sprint 4a-4c finished green, use these 2 days to:

- Re-run the full 110-field assertion suite + PRESTIGE_RESET integrity tests
- Simulate 5-10 manual prestige cycles in dev and watch for state drift
- Verify Focus Persistente 25% retention edge case (BUG-06) on a device, not just emulator
- Cold-open the app after a prestige to catch save-format regressions
- Any bugs found → fixed here, not pushed into Sprint 5

**If 4a-4c finished cleanly and these 2 days aren't needed:** they absorb into the Sprint 9a-9b platform delay contingency. DO NOT start Sprint 5 early.

---

## Sprint 5: Mutations + Pathways + Regions

15 Mutations, 3 Pathways, 5 Regions, Region upgrades, What-if Preview.

**Duration:** 4 days

**Prompt to Claude Code:**
> Implement Sprint 5 per docs/SPRINTS.md. Read GDD §13 (15 Mutations), §14 (3 Pathways with full enable/block spec), §16 (5 Regions — Hippocampus, Prefrontal, Límbico, Visual, Broca at P14). Apply MUT-2 (seed), MUT-3 (first cycle of Run filters), MUT-4 (Weekly Challenge filter), PATH-1/PATH-2, REG-1.

**AI checks ✅:**
- [ ] 15 Mutations implemented with full spec from GDD §13 (effect, category, affectsOffline flag)
- [ ] Mutation pool draw: 3 options (+1 if Creativa archetype, +1 if Genius Pass) per cycle
- [ ] Mutation seed = `hash(cycleStartTimestamp + prestigeCount)` (MUT-2)
- [ ] Last Mutation filtered from new options (MUT-2)
- [ ] First cycle of Run (prestigeCount === 0) filters Déjà Vu, Neuroplasticidad (MUT-3)
- [ ] Weekly Challenge + Especialización filter (MUT-4)
- [ ] 3 Pathways with correct enable/block category lists (GDD §14)
- [ ] Pathway `pathwayCostMod` applied per COST-1 order: base → mutation → Funciones Ej → pathway
- [ ] Equilibrada: all upgrade bonuses ×0.85, pathwayCostMod 1.0
- [ ] Blocked upgrade UI: greyed out with tooltip, not hidden
- [ ] 5 Regions visible: Hipocampo (P0), Prefrontal (P0 visible, upgrades P2+), Límbico (P0), Visual (P0), Broca (P14 unlock)
- [ ] 5 Region upgrades (costs in Memories) — see GDD §24
- [ ] Área de Broca "Name your mind" input (P14) — max 20 chars, profanity-filtered
- [ ] What-if Preview on CycleSetupScreen: shows estimated next cycle time per choice

**Sprint 5 tests 🧪 (TEST-3 requirement):**
- [ ] Unit: each of 15 Mutations applies correct effect to production/cost/etc
- [ ] Unit: Mutation seed deterministic — same seed → same 3 options
- [ ] Unit: `lastMutationId` filtered from next options
- [ ] Unit: first cycle of Run filter (Déjà Vu, Neuroplasticidad absent at prestigeCount=0)
- [ ] Unit: Weekly Challenge "Buy 10 Espejos" active → Especialización "Básicas" option filtered (MUT-4)
- [ ] Unit: Pathway gating — Rápida enables [tap, foc, syn, met], blocks [reg, con, new]
- [ ] Unit: cost order per COST-1 — base × mutMod × FE × pathMod exactly in that order
- [ ] Unit: Equilibrada: all upgrade bonuses scaled by 0.85
- [ ] Unit: Region upgrades cost Memories (not Thoughts)
- [ ] Unit: Broca unlock at exactly prestigeCount === 14
- [ ] Integration: pick Déjà Vu Mutation, next cycle starts with prior upgrades + ×2 costs

**Player tests 🎮:**
- [ ] Mutation cards feel different — each has clear tradeoff
- [ ] Pathway choices FEEL different cycle-to-cycle (not all same)
- [ ] "Blocked by Pathway" tooltip appears on greyed upgrades
- [ ] Regions tab shows 5 regions (not 3). Hipocampo has first upgrade available.
- [ ] What-if estimates feel reasonable (not wildly off)
- [ ] Play through P3-P7 and try different Pathway+Mutation combos — each feels distinct

---

## Sprint 6: Archetypes + Narrative + Events

3 Archetypes with full bonus spec, 57 narrative fragments, 30 Echoes, 12 Spontaneous events, 8 Era 3 events, 5 ending screens.

**Duration:** 5 days

**Prompt to Claude Code:**
> Implement Sprint 6 per docs/SPRINTS.md. Read GDD §12 (3 Archetypes with full bonuses), §23 (8 Era 3 events), §8 (12 Spontaneous events), docs/NARRATIVE.md (57 fragments + 30 Echoes + 4 v1.0 endings; 5th ending "The Witness" is v1.5+ per POSTLAUNCH.md — do NOT implement). Archetype choice is permanent for the Run (irreversible until Transcendence).

**AI checks ✅:**
- [ ] 3 Archetypes with FULL bonus spec from GDD §12:
  - Analítica: Active ×1.15, Focus ×1.25, Insight +2s, narrative unlocks
  - Empática: Offline ×2.5, Lucid Dream 100%, Active ×0.85, Memory ×1.25
  - Creativa: Mutation +1 option, Resonance ×1.5, Spontaneous ×1.5
- [ ] Archetype selection UI at P5 — 3 cards, irreversible for Run, confirmation modal
- [ ] 57 narrative fragments (12 base + 15 per archetype first-time) rendered on canvas with fade, word-wrap
- [ ] Fragments logged to `narrativeFragmentsSeen` (UI-5)
- [ ] 30 Echoes of Awakening — ambient canvas text, max 1 per 90s, filtered by prestigeCount
- [ ] 12 Spontaneous Events implemented per GDD §8 (weighted random, deterministic via seed)
- [ ] Spontaneous triggers: check every 4-6min, 40% chance
- [ ] `spontaneousMemoryUsed`, `spontaneousInterferenceUsed` 1-per-cycle limits enforced
- [ ] 8 Era 3 events at P19-P26 per GDD §23, triggered on prestige (ERA3-1/2/3)
- [ ] Era 3 events show fullscreen modal at cycle start with narrative + mechanical copy
- [ ] 5 ending screens (Equation, Chorus, Seed, Singularity, Resonance [secret]) — binary choices per GDD §22
- [ ] Endings seen stored in `endingsSeen[]`

**Sprint 6 tests 🧪 (TEST-3 requirement):**
- [ ] Unit: each of 3 Archetypes applies correct bonuses
- [ ] Unit: archetype choice sets `archetype` field; cannot change until transcendence
- [ ] Unit: 57 fragments stored correctly; first-read triggers +1 Memory (per GDD §3 table)
- [ ] Unit: Echoes respect 90s cooldown and prestigeCount filter
- [ ] Unit: 12 Spontaneous events with correct weights (pos 50%, neut 33%, neg 17%)
- [ ] Unit: spontaneous event seed deterministic (CODE-9)
- [ ] Unit: `spontaneousMemoryUsed` prevents 2+ Memoria Fugaz per cycle
- [ ] Unit: Era 3 event triggers at exact prestigeCount (19, 20, 21, ..., 26)
- [ ] Unit: P24 Long Thought — auto-prestige at MIN(threshold reached, 45 min elapsed)
- [ ] Unit: 4 v1.0 endings accessible at P26 with correct narrative branches (equation/chorus/seed/singularity; 'resonance' NOT present in v1.0 — 9A-1 scope)
- [ ] Integration: pick Empática → read Empathic fragment → `narrativeFragmentsSeen` contains it
- [ ] Integration: fragment archive (UI-5): every shown fragment saved; reread works

**Player tests 🎮:**
- [ ] Reach P5 → Archetype choice modal appears with 3 cards — feels like identity-defining moment
- [ ] Pick Analítica → next cycle feels faster (active play)
- [ ] (Optional) Restart, pick Empática → long-offline play gives much more
- [ ] Read fragments on canvas — quality check. Echoes visible but not distracting.
- [ ] Trigger a Spontaneous event (wait 4-6min in cycle) → canvas flash + effect applied
- [ ] Reach P19 → Era 3 begins, first event ("The First Fracture") triggers, offers 5 Mutations
- [ ] Reach P26 (requires patience — play 3h+) → ending screen with 4 choices (+ Secret if all Resonant Patterns found)

---

Continues in Part 2 (Sprints 7-13)...

## Sprint 7: Five Features

Achievements system (30 IDs), Mental States (5), Micro-challenges (8), Neural Diary, What-if Preview polish.

**Duration:** 5 days

**Prompt to Claude Code:**
> Implement Sprint 7 per docs/SPRINTS.md. Read GDD §17 (Mental States with full trigger/effect/duration/exit), §18 (8 Micro-challenges), §22 (Resonant Patterns), §24.5 (30 Achievements — full list with IDs/triggers/rewards). MENTAL-5 (Hyperfocus + Discharge pending bonus) and MENTAL-6 (Flujo Eureka rename) are critical fixes. NEVER invent achievement IDs or triggers — use exactly the 30 in §24.5.

**AI checks ✅:**
- [ ] `src/config/achievements.ts` exports `ACHIEVEMENTS: Achievement[]` with exactly 30 entries matching GDD §24.5 (IDs, display names, triggers as pure `(state: GameState) => boolean`, rewards, categories, `isHidden` flag). Categories evenly split: 6 Cycle, 6 Meta, 6 Narrative, 6 Hidden, 6 Mastery. Total Spark reward sum = 145.
- [ ] Every achievement ID matches regex `/^(cyc|meta|nar|hid|mas)_[a-z_0-9]+$/`
- [ ] ACH-1: Achievement checks run on tick AFTER the state change that enables them, not every tick (event-driven via `useMemo`/effect watching the relevant slice)
- [ ] ACH-2: Hidden achievements (6 `hid_*` IDs) display as `???` in UI until unlocked
- [ ] ACH-3: Unlock → `sparks += reward` + toast banner `"🏆 {displayName} · +{reward} Sparks"` + analytics `achievement_unlocked {id, prestigeCount}` + diary entry `type: 'achievement'`
- [ ] ACH-4: IDs are stable; `achievementsUnlocked` survives prestige AND transcendence; unknown IDs from future versions ignored (no crash)
- [ ] `hid_spontaneous_hunter` check uses `diaryEntries` filter (not a new field — preserves 110 GameState count)
- [ ] 5 Mental States with full spec from GDD §17 (Flow, Deep, Eureka→*Flujo Eureka*, Dormancy, Hyperfocus)
- [ ] Mental State priority: Eureka > Flow > Hyperfocus > Deep > Dormancy (MENTAL-1)
- [ ] Mental State triggers via `lastTapTimestamps`, `lastPurchaseTimestamp`, `insightTimestamps`, `focusAbove50Since`
- [ ] MENTAL-5: `pendingHyperfocusBonus` set when Discharge exits Hyperfocus; consumed by next Insight within 5s
- [ ] MENTAL-6: Mental State UI label is "Flujo Eureka" (not "Eureka"); stacks visually with Spontaneous "Eureka" event
- [ ] 8 Micro-challenges implemented per GDD §18 with triggers/time limits/rewards
- [ ] MICRO-1: trigger at 30% threshold cross, 120s cooldown between challenges
- [ ] MICRO-2: max 3 per cycle (`cycleMicroChallengesAttempted`)
- [ ] MICRO-3: fail = timer expiry, no penalty
- [ ] MICRO-4: deterministic selection via seed
- [ ] Banner UI for active Micro-challenge with countdown
- [ ] Neural Diary: auto-logs prestiges, Resonant Patterns, personal bests, endings, fragments, achievements
- [ ] Diary max 500 entries (circular buffer for older)
- [ ] What-if Preview polish: estimate per-choice next-cycle time with ±10% confidence

**Sprint 7 tests 🧪:**
- [ ] Unit: each of 30 achievements from GDD §24.5 unlocks on its correct trigger (30 test cases, one per ID — scaffolded from the §24.5 table)
- [ ] Unit: Total Spark reward sum === 145 (guard against silent reward drift)
- [ ] Unit: Category distribution === 6/6/6/6/6 across cyc/meta/nar/hid/mas
- [ ] Unit: `hid_*` achievements return `isHidden: true` and render as `???` before unlock
- [ ] Unit: Mental State priority hierarchy — Eureka supersedes Flow when both would trigger
- [ ] Unit: Flow trigger at 10 taps / 15s window
- [ ] Unit: Deep Thought trigger at 60s idle + 5 neurons
- [ ] Unit: Flujo Eureka trigger at 3 insights / 2min
- [ ] Unit: Dormancy trigger at 120s no tap no buy
- [ ] Unit: Hyperfocus trigger at Focus > 50% for 30s continuously
- [ ] Unit: Hyperfocus exit on Focus drop below 50%
- [ ] Unit: MENTAL-5 — Discharge while Hyperfocus active → pending bonus applied to next Insight within 5s
- [ ] Unit: MENTAL-5 — pending bonus NOT applied if no Insight within 5s (expires)
- [ ] Unit: each of 8 Micro-challenges completes/fails correctly
- [ ] Unit: Micro-challenge cooldown 120s between attempts
- [ ] Unit: max 3 Micro-challenges per cycle
- [ ] Integration: Mental State chip in HUD shows correct label ("Flujo Eureka" not "Eureka" for mental state)
- [ ] Integration: Diary entry added on prestige with correct type+data

**Player tests 🎮:**
- [ ] Tap rapidly for 15s → Flow state activates, chip appears in HUD
- [ ] Walk away for 60s → Deep Thought activates, chip changes
- [ ] Trigger 3 Insights in 2 min → Flujo Eureka activates, feels different from Spontaneous Eureka
- [ ] Build Focus above 50%, use Discharge → next Insight gets bonus level
- [ ] Reach 30% of cycle → Micro-challenge banner appears
- [ ] Complete a Micro-challenge → Sparks awarded, banner celebrates
- [ ] Open Mind tab → Neural Diary shows recent entries (prestige, fragment, etc)
- [ ] Unlock an achievement → modal appears, feels rewarding

---

## Sprint 8a: Offline + Sleep + Lucid Dream (3 days · CRITICAL)

Offline system complete, Sleep screen animation, Lucid Dream choice, rewarded ad ×2 offline. This half keeps scope tight so TRANS-1 and the TEST-5 simulation get full attention in 8b.

**Duration:** 3 days · CRITICAL

**Prompt to Claude Code:**
> Implementá Sprint 8a per docs/SPRINTS.md §Sprint 8a. Lee GDD §19 (offline system completo), §17 (Mental States — Sleep-screen integration). Este sprint cubre offline progress + Sleep screen + Lucid Dream + OFFLINE-7. NO incluye Transcendence (Sprint 8b). Los campos de GameState para offline ya existen (creados en Sprint 1) — acá se activa la lógica.

**AI checks ✅:**
- [ ] `applyOfflineProgress()` per GDD §19 formula (called on app resume, seconds elapsed = timestamp param)
- [ ] Base cap 4h, Sueño REM → 8h, Consciencia Distribuida → 12h (OFFLINE-6)
- [ ] Base efficiency 0.50, max ratio 2.0 (OFFLINE-4 cap)
- [ ] Time anomaly (clock backward, or >2× cap): OFFLINE-5 handling
- [ ] Minimum elapsed 60s before calc runs (offlineMinMinutes)
- [ ] Sleep screen with 4s "brain dreaming" animation + particle cascade
- [ ] Rewarded ad ×2 offline (only if ≥30 min offline) — 1 ad placement stub (full SDK in Sprint 9a — here just UI trigger + mock)
- [ ] Lucid Dream (P10+, 33% default, 100% if Empática): binary choice (+10% prod 1h OR +2 Mem)
- [ ] OFFLINE-7: if offline filled cycleGenerated to 100% AND nextDischargeBonus>0 → Sleep screen shows "enhanced Discharge available" prompt
- [ ] Genius Pass +25% offline stacks into OFFLINE-4 cap (stub — real Genius Pass in Sprint 9b; just respect flag for now)
- [ ] All offline-affecting upgrades listed in GDD §19 respected: Sueño REM, Distribuida, Ritmo Circadiano, Reg Emocional, Memoria Consolidada

**Sprint 8a tests 🧪 (TEST-3 requirement):**
- [ ] Unit: offline formula for 0min, 30min, 4h, 8h, 12h at base / REM / Distribuida configs
- [ ] Unit: OFFLINE-4 cap at ratio 2.0 — full-stack Empática+Distribuida+GeniusPass does NOT exceed 2× active production
- [ ] Unit: OFFLINE-5 time anomaly — clock backward → timestamp reset, no gain
- [ ] Unit: OFFLINE-5 time > 2× cap → hard cap, log event
- [ ] Unit: Lucid Dream probability 33% default, 100% Empática
- [ ] Unit: OFFLINE-7 bridge — `cycleGenerated >= threshold` + `nextDischargeBonus > 0` → banner with option
- [ ] Integration: simulated 4h offline → Sleep screen → resume → thoughts added match formula

**Player tests 🎮:**
- [ ] Close app 2h → reopen: offline animation plays, Sleep screen shows summary
- [ ] Mock `sueno_rem` upgrade owned → next 8h sleep uses 8h cap (not 4h)
- [ ] Force Lucid Dream trigger (debug menu or Empática archetype) — pick both options on different runs, verify effects
- [ ] Time-travel test: set device clock backward → app handles gracefully (no negative time, no exploit)

---

## Sprint 8b: Transcendence + Runs 2-3 + Resonance (3 days · CRITICAL)

Transcendence flow, Runs 2-3 implementation, 4 Run-exclusive upgrades, Resonance currency, 8 Resonance upgrades.

**Duration:** 3 days · CRITICAL

**Prompt to Claude Code:**
> Implementá Sprint 8b per docs/SPRINTS.md §Sprint 8b. Lee GDD §20 (Transcendence), §21 (4 Run-exclusive upgrades — NOT 6), §15 (Resonance — 8 upgrades, 3 tiers). CRITICAL: TRANS-1 resets prestigeCount a 0 (sino Run 2 es unplayable). TRANS-2: Convergencia usa lifetimePrestiges no prestigeCount. Este sprint NO incluye Resonant Patterns ni TEST-5 — eso es Sprint 8c.

**AI checks ✅:**
- [ ] Transcendence at P26: ending choices (4 main + Secret placeholder — real Secret gate in 8c)
- [ ] TRANS-1: `prestigeCount=0`, `transcendenceCount++`, threshold uses new multiplier
- [ ] TRANSCENDENCE_RESET = superset of PRESTIGE_RESET + memories=0, archetype=null, regionsUnlocked=[], eraVisualTheme='bioluminescent', narrativeFragmentsSeen=[], firstCycleSnapshot=null (BUG-05 fix)
- [ ] TRANSCENDENCE_PRESERVE keeps Sparks, Resonance, Resonance upgrades, Patterns, patternDecisions, achievements, diary, cosmetics, monetization history, runUpgradesPurchased, endingsSeen, lifetime counters
- [ ] archetypeHistory appends current archetype; endingsSeen appends chosen ending
- [ ] Run 2 threshold ×3.5, Run 3 ×6.0 (RUN_THRESHOLD_MULT)
- [ ] 4 Run-exclusive upgrades (NOT 6 — `memoria_ancestral` and `consciencia_plena` are POST-LAUNCH):
  - Run 2+: `eco_ancestral`, `sueno_profundo`
  - Run 3+: `neurona_pionera`, `despertar_acelerado`
- [ ] Run upgrades purchased persist via `runUpgradesPurchased`
- [ ] `Convergencia Sináptica` uses `lifetimePrestiges` (TRANS-2 / INT-3 fix)
- [ ] Resonance currency: formula per GDD §15 (1 base + Cascades + Insights + under-15min + Creativa ×1.5)
- [ ] 8 Resonance upgrades (3 tiers at P13/P18/P23) with correct costs and tier unlocks
- [ ] PAT-3 Reset Pattern Decisions (from Sprint 4b) now functional with real Resonance currency

**Sprint 8b tests 🧪:**
- [ ] Unit: TRANS-1 — prestigeCount 0 after Transcendence, transcendenceCount++
- [ ] Unit: TRANSCENDENCE_RESET applies all fields correctly (including memories=0, archetype=null, regionsUnlocked=[])
- [ ] Unit: TRANSCENDENCE_PRESERVE fields unchanged (Sparks, Resonance, Patterns, patternDecisions, etc)
- [ ] Unit: `archetypeHistory` appends, `endingsSeen` appends
- [ ] Unit: 4 Run upgrades (not 6) with correct unlock conditions (Run 2: 2 upgrades, Run 3: 2 more)
- [ ] Unit: Convergencia Sináptica uses `lifetimePrestiges` — +1.5% per, max +40%
- [ ] Unit: Resonance formula values — 0 cascades 0 insights >15min → 1 R; full optimal cycle → ~18 R
- [ ] Unit: 8 Resonance upgrades across 3 tiers unlock at P13, P18, P23 with prereqs
- [ ] Integration: full P26 → Transcendence → Run 2 P1 → threshold is 3.5× but Patterns help
- [ ] Property-based: Transcendence at any valid state preserves exactly 27+ preserve-list fields

**Player tests 🎮 — MANDATORY:**
- [ ] Reach P26 via debug acceleration, pick an ending → Transcendence triggers, Run 2 begins
- [ ] Start Run 2 → threshold visible higher, but Convergencia is strong, Patterns accelerate ramp
- [ ] Buy `eco_ancestral` (Run 2 upgrade) — verify it grants +1 Pattern to last 3 cycles
- [ ] Check Mind tab → Resonance currency visible, upgrades unlock at P13
- [ ] Buy first Resonance upgrade → verify it survives a Transcendence (Run 2 → Run 3)
- [ ] PAT-3 reset button (from 4b) now consumes real Resonance — works correctly

---

## Sprint 8c: Resonant Patterns + TEST-5 Simulation (2 days · CRITICAL)

4 Resonant Pattern checks (Secret Ending gate) and the full 1000-run economy simulation. Requires Sprint 8b complete.

**Duration:** 2 days · CRITICAL

**Prompt to Claude Code:**
> Implementá Sprint 8c per docs/SPRINTS.md §Sprint 8c. Lee GDD §22 (4 Resonant Patterns). Sprint 8b ya implementó Transcendence + Resonance — acá se agregan los 4 checks especiales del Secret Ending y se corre TEST-5 completo. RP-4 (Cascade Chorus) requiere NOT owning Cascada Profunda (INT-12).

**AI checks ✅:**
- [ ] 4 Resonant Pattern checks at prestige (BEFORE reset). Each per GDD §22
- [ ] RP-4 (Cascade Chorus) requires NOT owning Cascada Profunda upgrade (INT-12)
- [ ] `cycleDischargesUsed`, `cycleNeuronPurchases` cycle trackers activated for RP conditions
- [ ] `resonantPatternsDiscovered` NEVER resets (verified)
- [ ] Secret Ending ("Resonance") appears at Transcendence when all 4 patterns discovered
- [ ] 5 Sparks awarded per pattern discovery

**Sprint 8c tests 🧪 (TEST-5 REQUIRED — BLOCKING gate for Sprint 12):**
- [ ] Unit: each of 4 Resonant Patterns checks correctly at prestige
- [ ] Unit: RP-4 — triggered 5 Cascades AND did NOT own Cascada Profunda (INT-12)
- [ ] Unit: `resonantPatternsDiscovered` preserved across prestige AND transcendence
- [ ] **TEST-5 SIMULATION: 1000 runs** — P0-P26 × 3 Runs across 3 archetype × 3 pathway × 3 tap-rate configs = 27 configs × ~37 runs each. Record avg time per cycle, verify pacing curve matches design targets (§9 Era 1: 7-15min, Era 2: 16-22min, Era 3: 24-35min).
- [ ] **TEST-5 threshold tuning gate (ECO-1, §35):** any cycle time with avg deviation >20% from its target is flagged. Rebalance `baseThresholdTable` in `src/config/constants.ts`, re-run TEST-5, iterate until all 26 cycles pass. **This is a BLOCKING gate:** Sprint 8c is NOT done until no cycle fails the 20% rule. Expected rebalance iterations: 2-4. Document each pass in PROGRESS.md.
- [ ] TEST-5 validates: no archetype×pathway combo is >30% faster/slower than mean at P10+
- [ ] TEST-5 validates: Empática full offline stack doesn't exceed 2× active production (OFFLINE-4)
- [ ] TEST-5 validates: `baseThresholdTable[0]` override by TUTOR-2 reaches 50K in 7-9 min at 1 tap/sec (parity with node pre-sim)

**Player tests 🎮:**
- [ ] Deliberately try all 4 Resonant Patterns over multiple runs → 5 Sparks per discovery
- [ ] Complete all 4 Resonant Patterns → Secret Ending option appears at next Transcendence
- [ ] Inspect TEST-5 CSV output — sanity check archetype × pathway combos

---

## Sprint 9a: Core SDK + Ads (3 days · HIGH RISK)

RevenueCat + AdMob SDK integration, receipt validation, 6 rewarded ad placements (7th — streak save — deferred to Sprint 10 with Daily Login), sandbox setup. This half is where platform integration pain surfaces — keeping it separate from offerings (9b) lets you handle rejections/sandbox issues without contaminating cosmetic UI work.

**Duration:** 3 days · **HIGH RISK** (platform integration)

**Prompt to Claude Code:**
> Implementá Sprint 9a per docs/SPRINTS.md §Sprint 9a. Lee GDD §26 (monetización completa — focus on SDK integration side). Este sprint cubre SDK initialization, receipt validation, ad placements, y sandbox setup. NO cubre offerings UI ni cosmetics (Sprint 9b). Todas las keys de SDK van en environment variables — Nico las provee (ver manual tasks en docs/SPRINTS.md Sprint 0). Zero hardcoded prices — todo viene de `product.priceString`.

**AI checks ✅:**
- [ ] RevenueCat SDK integrated, initialized with public SDK key from env var
- [ ] AdMob SDK integrated, test IDs in dev / real IDs in production (env-controlled)
- [ ] `@capacitor-community/admob` and `@revenuecat/purchases-capacitor` plugins configured per platform
- [ ] iOS Info.plist + Android AndroidManifest.xml configured with required permissions and App Tracking Transparency (ATT) string
- [ ] Receipt validation via RevenueCat server-side (trust RevenueCat's `customerInfo.entitlements`, never client-side receipts)
- [ ] All prices from `product.priceString` (NEVER hardcoded) — MONEY-1
- [ ] Subscription UI stub shows: price, auto-renew statement, cancel instructions BEFORE purchase — MONEY-2 (final polish in 9b, here just compliant layout)
- [ ] Restore Purchases button in Settings — MONEY-3
- [ ] 6 Rewarded ad placements implemented (offline ×2, post-Discharge ×2, mutation reroll, decision retry, piggy refill placeholder — piggy proper in 9b, **7th placement "streak save" implemented in Sprint 10 as part of Daily Login**)
- [ ] MONEY-4: no ads first 10 min (tutorial grace)
- [ ] MONEY-5: no ad after Cascade
- [ ] MONEY-6: max 1 ad per 3 min (cooldown enforced globally)
- [ ] MONEY-7: ad failure → toast, no crash, state preserved
- [ ] Ad state persisted across app close (cooldown counter saves)
- [ ] Sandbox accounts configured (both iOS Sandbox tester + Google Play test account documented in PROGRESS.md)

**Sprint 9a tests 🧪:**
- [ ] Unit: ad cooldown 3 min enforced (try 2nd ad at 2:59 → blocked; at 3:01 → allowed)
- [ ] Unit: first ad placement not shown before minute 10 of total play time
- [ ] Unit: no ad on Cascade trigger (MONEY-5)
- [ ] Unit: ad failure path (network error) → toast displayed, no state loss
- [ ] Unit: all prices fetched from `product.priceString`, never hardcoded — grep test on src/
- [ ] Integration: RevenueCat sandbox purchase → `customerInfo.entitlements` updates correctly
- [ ] Integration: receipt validation via RevenueCat — client-side receipt is NOT trusted
- [ ] Integration: rewarded ad watched → correct reward granted (2× offline, etc.)
- [ ] Integration: Restore Purchases → past sandbox purchases reappear

**Player tests 🎮 (REQUIRED — SANDBOX):**
- [ ] Set up Sandbox account (iOS + Android) — Nico manual step, documented
- [ ] Purchase a test product in iOS Sandbox → ownership updates, not charged for real
- [ ] Purchase same in Google Play test track → ownership updates
- [ ] Kill app, reopen → purchase still recognized
- [ ] Use Discharge 2× in a row — second one shows no ad prompt (cooldown)
- [ ] Offline for 45 min → return → rewarded ad offered → watch → 2× offline reward applied
- [ ] Disable network, trigger ad → fails gracefully with toast
- [ ] Test Restore Purchases button in Settings — past sandbox IAPs reappear

---

## Sprint 9b: Offerings + Cosmetics + Analytics (4 days · HIGH RISK)

All monetization offerings — Starter Pack, Genius Pass, Spark Packs, Cosmetics store, Piggy Bank, Limited Offers — and 11 monetization analytics events. Daily Login moved to Sprint 10.

**Duration:** 4 days · **HIGH RISK** (scope-heavy, many touch points)

**Prompt to Claude Code:**
> Implementá Sprint 9b per docs/SPRINTS.md §Sprint 9b. Lee GDD §26 (monetización — offerings side). Sprint 9a ya tiene SDK integration + ads. Este sprint agrega todas las ofertas y cosmetics. Starter Pack appears post-P2 (starterPackShownAtPrestige: 2, NOT P1 — tonal fix). Cosmetics persist forever (survive prestige + transcendence). Monthly cap 1000 Sparks con friendly message. Daily Login is NOT in this sprint — it's in Sprint 10.

**AI checks ✅:**
- [ ] Starter Pack: appears post-P2 (starterPackShownAtPrestige: 2), 48h timer, one-time-only
- [ ] Genius Pass: 5 offer triggers (post-P1, post-PB, post-P5, post-P10, post-Transcendence), 72h min interval, max 3 dismissals
- [ ] Genius Pass benefits applied: no ads, offline +25%, +1 Mutation option, 10 Sparks/week, HD canvas, Genius Gold theme
- [ ] Genius Pass subscription UI includes "All content accessible for free" badge (MONEY-9, Apple compliance)
- [ ] Cosmetics store: 8 neuron skins, 4 canvas themes, 3 glow packs, 1 HUD style
- [ ] Cosmetics 3-second live preview on canvas before purchase
- [ ] Cosmetics persist forever (survive prestige + transcendence) — tested via consistency.test.ts assertion
- [ ] Piggy Bank: fills passively (1 Spark per 10K totalGenerated, max 500), break $0.99. MONEY-10 cap UX (2nd audit 7A-3): when `piggyBankSparks === 500`, non-intrusive HUD chip `"🐷 Piggy Bank full — tap to break ($0.99)"` near Sparks counter. Chip auto-dismisses on claim or on next prestige. Hard cap enforced in TICK-1 step 4 (`min(500, current + 1)`).
- [ ] Spark Packs: 3 tiers ($0.99/$3.99/$7.99 → 20/110/300 Sparks)
- [ ] Monthly cap: 1000 Sparks purchased (friendly cap message, blocks above) — MONEY-8. `sparksPurchaseMonthStart` DEFAULT VALUE IS `0` (intentional — first-purchase resets from 1970-01 → current month). Use `startOfCurrentMonthUTC(nowTimestamp)` helper per MONEY-8 pseudocode; pass `nowTimestamp` at store boundary (INIT-1). Test cases: first-ever purchase resets from 0; second-purchase same month no reset; month-crossing reset; exactly-midnight-UTC-of-1st works.
- [ ] Cap disclosure visible BEFORE purchase (Apple compliance)
- [ ] 4 Limited-Time Offers triggered at P3 / P7 / P13 / Run 2 start
- [ ] 11 monetization analytics events (per GDD §27 Monetization, verbatim — no aliases, no synonyms, no convention changes): `starter_pack_shown`, `starter_pack_purchased`, `starter_pack_dismissed`, `limited_offer_shown` (id), `limited_offer_purchased` (id, price), `limited_offer_expired` (id), `cosmetic_purchased` (type, id, price), `cosmetic_previewed` (type, id), `cosmetic_equipped` (type, id), `spark_pack_purchased` (tier, amount), `spark_cap_reached`. Note: `genius_pass_offered` and `genius_pass_purchased` are in §27 **Core (19)** not Monetization — implement them here too but they don't count toward the 11. ANALYTICS-5 (§35): event names match GDD §27 exactly; any rename requires §27 update first.
- [ ] Each offering has a UI component following the shared OfferingCard pattern

**Sprint 9b tests 🧪:**
- [ ] Unit: Starter Pack visible only once, only post-P2, only within 48h window
- [ ] Unit: Genius Pass offer respects 72h interval and max 3 dismissals
- [ ] Unit: Spark monthly cap at 1000 — 1001st purchase blocked with message
- [ ] Unit: cosmetic ownership preserved across prestige AND transcendence (consistency test)
- [ ] Unit: Piggy Bank accumulates correctly (1 per 10K generated, max 500). MONEY-10 cap: at 500 the chip `"🐷 Piggy Bank full — tap to break"` is visible; further +1 increments are ignored (hard cap); chip dismisses on claim + on prestige.
- [ ] Unit: each of the 4 Limited-Time Offers triggers at correct prestige/transcendence event
- [ ] Unit: 11 monetization analytics events fire correctly on their triggers
- [ ] Integration: purchase Starter Pack in sandbox → contents delivered, flagged as consumed, never shows again

**Player tests 🎮 (REQUIRED — SANDBOX):**
- [ ] Purchase Starter Pack in sandbox (post-P2) → contents delivered
- [ ] Purchase Genius Pass monthly — restore on reinstall, benefits active
- [ ] Cancel subscription in Sandbox — benefits remove at period end
- [ ] Purchase a cosmetic — verify 3s live preview, verify ownership persists after prestige AND transcendence
- [ ] Piggy Bank: play for 1h, verify Sparks accumulate; break for $0.99 → Sparks claimed
- [ ] Trigger a Limited-Time Offer (reach P3) → offer appears with countdown
- [ ] Daily login for 3 consecutive days → streak shows correct rewards on each day
- [ ] Analytics dashboard (Firebase) shows monetization events firing correctly

---

## Buffer 2 — Platform Integration Recovery (2 days · MANDATORY, SCHED-1)

Not a sprint. 2 days reserved post-Sprint-9b for platform-review iteration. Apple sandbox setup + IAP testing is historically a 3-14 day source of delays for solo devs (credential verification, sandbox user creation, receipt validation edge cases, first-review rejections). Google Play has similar but usually shorter issues. Use these 2 days to:

- Resolve any RevenueCat / App Store Connect / Google Play Console sandbox issues flagged in 9a/9b
- Iterate on store listing text if Apple Review pre-check raised flags
- Re-test IAP flow on fresh sandbox account (not the same one used in Sprint 9a)
- Verify ATT consent flow end-to-end on iOS 17+ device
- If Buffer 1 was consumed: this buffer is still MANDATORY regardless

**If 9b finished cleanly and store setup is smooth:** these days absorb into Sprint 11b device-specific fixes (typically needed).

---

## Sprint 10: Polish + Infrastructure

Settings, audio, accessibility, Firebase, push notifications, visual effects, deep-link, Android back button handling.

**Duration:** 5 days

**Prompt to Claude Code:**
> Implement Sprint 10 per docs/SPRINTS.md. Read GDD §27 (48 analytics events), §28 (audio). Settings panel, full i18n, 48 Firebase events (9 funnel + 11 money + 5 feature + 20 core + 3 weekly_challenge), push scheduler, colorblind mode, reduced motion, Android back button handler.

**AI checks ✅:**
- [ ] Settings panel: SFX volume, music volume, notifications toggle, language toggle, accessibility options
- [ ] Hard Reset in Settings (3-tap confirmation + type "RESET" + timestamp logged) - triggers reset_game event; guarded against accidental destructive action
- [ ] Howler.js integration: 3 ambient tracks (Era 1/2/3), 8 SFX
- [ ] AudioContext unlock on first tap (iOS) — AUDIO-1
- [ ] Audio pauses on visibilitychange hidden — AUDIO-2
- [ ] Firebase Analytics: 48 events with correct parameters per GDD §27 (includes `pattern_decisions_reset` — 9A-2 fix)
- [ ] 9 Funnel events, 11 Monetization, 5 Feature, 19 Core, 3 Weekly Challenge
- [ ] Firebase dashboard configured (funnel visualizations)
- [ ] Firebase Crashlytics SDK integrated. Non-fatal errors logged for: save load failure, migration failure, ad SDK timeout, RevenueCat timeout
- [ ] Firebase Remote Config initialized. Overridable constants (fallback to local constants.ts): `consciousnessThreshold`, `costMult`, `softCapExponent`, `cascadeMultiplier`, `insightMultiplier`, `insightDuration`, `baseOfflineEfficiency`, `maxOfflineEfficiencyRatio`. Values bounded (e.g. softCapExponent min 0.5 max 0.9).
- [ ] GDPR consent flow on first launch (EU detection) — `analyticsConsent`
- [ ] Push notifications via Capacitor.LocalNotifications
- [ ] Push scheduler: 3 types (daily reminder, offline cap reached, streak about to break). Respects platform permissions.
- [ ] `notificationPermissionAsked` cadence: 0/1/2 (never / after P1 / after P3)
- [ ] Daily Login Bonus 7-day streak (5/5/10/10/15/20/50) — moved from Sprint 9b for scope balance
- [ ] **7th rewarded ad placement: streak save** — if player misses exactly 1 day, on next login offer "Watch ad to save your streak?" (rewarded ad). Subscribers (Genius Pass) auto-preserve without ad. Integrates with Sprint 9a's ad infrastructure. 2+ days missed → streak resets to 0 regardless.
- [ ] Colorblind mode: replace color-only indicators with shape/pattern/text
- [ ] Reduced motion: disable canvas blur, reduce particles, simpler animations
- [ ] High contrast mode option
- [ ] Font size adjustable (0.85x / 1.0x / 1.15x)
- [ ] Screen reader labels on all interactive elements
- [ ] Android back button: closes modals/tabs, minimizes at home (CODE-5)
- [ ] Error states per UI-8: RevenueCat timeout → "Store temporarily unavailable" banner. Cloud save fail → "Saved locally" toast. Full offline → game fully playable, no blocking modals.
- [ ] Deep links: `synapse://diary`, `synapse://mind`, `synapse://cosmetics`
- [ ] Share ending screen: after seeing ending, "Share" button → generates image (ending title + archetype + play time + mind name) via Capacitor Share API
- [ ] i18n complete: English + Spanish strings for all `t()` keys. No hardcoded strings remain.

**Sprint 10 tests 🧪 (TEST-3 requirement):**
- [ ] Unit: 48 analytics events defined in config. Type-safe event helpers.
- [ ] Unit: settings persist via Capacitor Preferences
- [ ] Unit: Hard Reset requires 3-tap + "RESET" text + timestamp match
- [ ] Unit: time anomaly (OFFLINE-5) detected and logged
- [ ] Unit: GDPR — no analytics fires until `analyticsConsent === true`
- [ ] Unit: push scheduler respects permission state
- [ ] Unit: Daily Login streak — day 1=5, day 2=5, day 3=10, day 4=10, day 5=15, day 6=20, day 7=50; day 8 wraps. Streak save: miss 1 day + watch ad → streak continues; miss 2+ days → reset.
- [ ] Unit: colorblind mode swaps color-only UI for shape/pattern
- [ ] Unit: reduced motion disables blur filters
- [ ] Integration: Android back button handler — press at home minimizes (does NOT navigate back)
- [ ] Integration: app force-closed mid-tick → reopen → state recovers (from last 30s save)
- [ ] Integration: audio manager — play SFX, SFX volume at 0 → silent
- [ ] E2E (Playwright on WebView via adb+CDP): tap button in android app → state changes correctly
- [ ] Visual regression: 6 key screens (canvas Era 1, Era 2, Era 3, CycleSetupScreen, Mind tab, Awakening) — snapshot per device per theme per cosmetic combo (if feasible)

**Player tests 🎮 (DEVICE TESTING):**
- [ ] Pixel 4a: all animations ≥30fps, no stutter
- [ ] iPhone 14: safe areas correct, notch not covered
- [ ] Low-end Android: canvas fallback clean, playable
- [ ] Settings: toggle SFX off → silent game
- [ ] Enable colorblind mode → Polarity choices distinguishable without color
- [ ] Enable reduced motion → less visual noise, still playable
- [ ] Screen reader (TalkBack Android, VoiceOver iOS) navigates settings
- [ ] Press Android back button at home screen → app minimizes (doesn't close)
- [ ] Force-quit app mid-cycle → reopen → state preserved
- [ ] Disconnect Wi-Fi → game still functions (Firebase fails silently)
- [ ] Record new 60-second gameplay video → compare to Sprint 2 video (quality improvement evident)

---

## Sprint 11a: Test Infrastructure + Coverage (2 days · CRITICAL)

Coverage thresholds enforced, property-based tests, save fuzz, migration chain, determinism validation, TEST-5 finalization, 157-rule grep script. This half is pure test engineering — no devices yet.

**Duration:** 2 days · CRITICAL

**Prompt to Claude Code:**
> Implementá Sprint 11a per docs/SPRINTS.md §Sprint 11a. Este sprint es test infrastructure: coverage enforcement, property-based tests, save fuzzer, migration chain, determinism, TEST-5 final run, y un grep script que verifica que cada regla del GDD está referenciada en tests. NO incluye devices físicos ni testers externos — eso es Sprint 11b.

**AI checks ✅:**
- [ ] Coverage thresholds enforced in CI: engine ≥85%, store ≥75%, components ≥60%
- [ ] Property-based tests via fast-check: 50 invariants covering production formula, cost scaling, prestige determinism
- [ ] Save fuzz: malformed save (missing fields, extra fields, wrong types) → `migrateState()` recovers OR resets cleanly
- [ ] Migration chain: v1.0.0 → v1.0.1 → ... → current save format (all intermediate versions tested)
- [ ] Determinism per CODE-9: same seed + same actions = identical state over 10,000 ticks
- [ ] TEST-5 1000-run simulation finalized: outputs CSV — avg cycle time per prestige per archetype per pathway
- [ ] TEST-5 passes if: no config >30% off mean AT P10+, no OFFLINE-4 violation, memory stable
- [ ] 157-rule grep: script confirms every GDD rule ID (e.g., TRANS-1, MENTAL-5, PAT-3) appears in at least one test file OR comment block referencing it
- [ ] `tests/consistency.test.ts` — ALL tests un-skipped, all pass (final pass)
- [ ] Implement minimal snapshot validation gate (Gate 5 of `check-invention.sh`) per POSTLAUNCH.md 6A-2 — elevated from v1.1 due to 2 Sprint 1 fabrications. Hardcoded list of canonical snapshots: `mulberry32(12345)()` first 3 values, `hash("0") === 890022063`, `softCap(100/200/1000/10000)`, `calculateThreshold(0,0 / 0,1 / 25,2 / 25,5)`. Gate compares against the live implementation output.
- [ ] **Gate 6: canonical storage consistency audit** (Sprint 2 Phase 2 backlog item, elevated from "mental flag" to formal backlog per anti-invention discipline)
    - Extract all hex values from `docs/UI_MOCKUPS.html`
    - Compare against `src/ui/tokens.ts` COLORS entries
    - Report any drift (mockup hex not in tokens, or tokens hex not referenced in mockup)
    - Similar audit: `docs/GDD.md` §3b palette table vs tokens.ts
    - Add to `scripts/check-invention.sh` as Gate 6 (or a separate `scripts/check-palette-drift.sh` called from check-invention)
    - Context: drift caught and corrected in Sprint 2 Phase 2 pre-code (`#4060E0` vs canonical `--bl #4090E0` in UI_MOCKUPS lines 42+47). Automated check prevents recurrence as UI_MOCKUPS extends with Sprint 5-10 screens.
- [ ] **TICK-RUNTIME-1: end-to-end runtime integration test** (Sprint 2 Phase 3.5 backlog, caught by smoke test)
    - Mount full App tree via Vitest Browser Mode (real Chromium per Sprint 2 checklist test item 3)
    - Wait 5 seconds via `vi.advanceTimersByTime` OR real time
    - Assert `state.thoughts > 0` (passive accumulation occurred)
    - Assert `state.dischargeLastTimestamp` updated if a charge tick ran
    - Assert `sessionStartTimestamp` populated by INIT-1 mount effect
    - Prevents the class of bug where unit tests pass but the runtime scheduler is missing. Pattern: "engine works in isolation but doesn't get called by the app".
    - Context: `src/engine/tick.ts` had 29 passing unit tests from Sprint 1 Phase 5 but was NOT wired to any runtime loop until Sprint 2 Phase 3.5 added `src/store/tickScheduler.ts`. Passive production was silently zero in the browser despite green tests. Mitigation was `tests/store/tickScheduler.test.ts` (6 tests with fake timers + guarded init), but a real-Chromium end-to-end check is still the only way to catch "scheduler hook not called" regressions.

**Sprint 11a tests 🧪:**
- [ ] Coverage report shows engine ≥85%
- [ ] 50 property-based tests pass (fast-check 100 runs each)
- [ ] Save fuzz: 1000 malformed saves → 100% clean recovery (reset if unreadable)
- [ ] Migration chain: 5 version jumps work correctly
- [ ] TEST-5 report: all configs within variance bounds, OFFLINE-4 cap respected, memory stable
- [ ] Rule-coverage grep: all 157 rules referenced somewhere in tests
- [ ] `scripts/check-invention.sh` — all 4 gates green on full codebase

**Player tests 🎮:**
- [ ] Run full test suite locally — green end to end
- [ ] Inspect TEST-5 CSV output — sanity check one archetype × pathway combo manually

---

## Sprint 11b: Device Matrix + External Testers + Performance (3 days · CRITICAL)

Real devices via BrowserStack/Firebase Test Lab + 2-3 external human testers + memory/FPS/battery SLOs + accessibility audit + critical bug fixes found in this pass.

**Duration:** 3 days · CRITICAL (+1 buffer for device-specific fixes)

**Prompt to Claude Code:**
> Implementá Sprint 11b per docs/SPRINTS.md §Sprint 11b. Sprint 11a ya dejó coverage + TEST-5 listos. Este sprint es device testing + external testers + performance SLOs. Nico recruta los testers (ver manual tasks Sprint 0) y tiene BrowserStack/Firebase Test Lab configurado. Priorizá fixing any critical bugs encontrados acá ANTES de cerrar el sprint.

**AI checks ✅:**
- [ ] 6-device E2E matrix (Playwright via Firebase Test Lab or BrowserStack):
  - Pixel 4a (Android 11)
  - Pixel 7 (Android 14)
  - Samsung Galaxy A14 (mid-tier Android)
  - iPhone SE 3rd gen (iOS 16)
  - iPhone 13 (iOS 17)
  - iPad Air (iPadOS landscape)
- [ ] E2E suite: tutorial completion, prestige flow, transcendence flow, offline return, purchase sandbox
- [ ] Memory leak test: 2h continuous play → heap delta < 50MB (target <20MB ideal)
- [ ] FPS floor test: 30 min play, 80 nodes visible → FPS ≥30 sustained
- [ ] Battery test: 1h active play → <5%/h battery drain on Pixel 4a
- [ ] Accessibility audit: axe-core automated + manual screen reader pass (VoiceOver + TalkBack)
- [ ] Device-specific bugs triaged: CRITICAL fixed before sprint close, P2 documented in POSTLAUNCH.md

**Sprint 11b tests 🧪:**
- [ ] E2E device matrix: 6/6 devices pass full suite (tutorial + prestige + offline + sandbox IAP)
- [ ] Memory test: 2h run, heap delta <50MB confirmed on Pixel 4a emulator
- [ ] FPS test: 30min run, no drops below 30fps at 80 nodes on Pixel 4a
- [ ] Battery test: <5%/h on Pixel 4a physical device
- [ ] axe-core accessibility: 0 critical issues
- [ ] Screen reader manual pass: VoiceOver iOS + TalkBack Android — main flows navigable

**Player tests 🎮 (DEVICE MATRIX + EXTERNAL TESTERS):**
- [ ] Physical Pixel 4a: complete Run 1 (P0 → P26) within realistic time budget — feels polished
- [ ] Physical iPhone SE: same
- [ ] Have 2-3 external testers play for 1 week → collect NPS + bug reports via Google Form or Discord
- [ ] At least 1 tester is an idle-genre enthusiast (r/incremental_games recruit)
- [ ] At least 1 tester is a casual player (friend/family who doesn't play idle games)
- [ ] Fix all CRITICAL bugs found, document P2 bugs for post-launch
- [ ] Compile external tester feedback into `docs/PROGRESS.md` for Sprint 13 learnings

---

## Sprint 12: Store Preparation + Submission (MANUAL)

Store listings, screenshots, trailer finalization, review preparation, privacy policy, terms of service, submit to Apple + Google.

**Duration:** 4 days · MANUAL (Nico-led)

**Nico tasks:**
- [ ] App name finalized in both stores
- [ ] Short + long descriptions in English + Spanish + 2 more locales
- [ ] 5-10 screenshots per device size (iPhone, iPad, Android phone, Android tablet)
- [ ] 30-second trailer final cut (from Sprint 8 base footage + Sprint 10 polish)
- [ ] Feature graphic for Google Play (1024×500)
- [ ] App icon finalized (all required sizes)
- [ ] Privacy policy published at claimed URL
- [ ] Terms of service published at claimed URL
- [ ] Age rating questionnaire complete (both stores)
- [ ] Apple Review response letter prepared: explains PHIL-1 (100% free content), Genius Pass is convenience only (MONEY-9)
- [ ] In-app purchases declared and configured in both stores
- [ ] Rewarded ads declared
- [ ] Build uploaded to App Store Connect + Google Play Console
- [ ] TestFlight internal build approved, tested
- [ ] Google Play internal testing track approved, tested
- [ ] Submit for review — Apple first (takes 1-3 days), Google next (hours)
- [ ] Address any reviewer feedback

**Acceptance:**
- [ ] App approved on both stores
- [ ] Internal test builds playable via TestFlight + Play internal track

---

## Sprint 13: Soft Launch → Global (MANUAL)

Launch strategy: 3-country soft launch (Canada, Argentina, Philippines) → data → iterate → global.

**Duration:** 5 days · MANUAL (Nico-led)

**Nico tasks:**
- [ ] Apple: release to Canada + Argentina + Philippines only (soft launch)
- [ ] Google Play: same 3 countries
- [ ] Monitor Firebase Analytics dashboards daily (D1/D7 retention, ARPU, ad CTR)
- [ ] Configure Firebase Remote Config defaults matching constants.ts for tunable values
- [ ] Collect user reviews and support tickets
- [ ] Identify top 3-5 bugs / UX issues from real play data
- [ ] Patch hotfixes (bug-only, 2-5 days turnaround)
- [ ] After 2 weeks of soft launch: decide go/no-go for global
- [ ] If metrics healthy (D7 ≥10%, ARPU ≥ $0.02 ARPDAU): global release
- [ ] Global release: all territories on both stores
- [ ] Social push: "SYNAPSE now available worldwide"
- [ ] r/incremental_games launch post
- [ ] Reach out to idle-game YouTubers / streamers with press kit
- [ ] Monitor daily for week 1 of global

**Acceptance:**
- [ ] D1 retention ≥ 35%
- [ ] D7 retention ≥ 10%
- [ ] Crash rate <1%
- [ ] Crashlytics dashboard shows crash-free rate ≥99%
- [ ] Review rating ≥ 4.0
- [ ] Revenue ≥ $50/day by end of week 1 global

---

# Sprint dependency graph

```
S0 (Marketing) ────────────────────────────────────────────────── parallel ─────┐
                                                                                  │
S1 ─ S2 ─ S3 ─ S4a ─ S4b ─ S4c ─ S5 ─ S6 ─ S7 ─ S8a ─ S8b ─ S8c ─ S9a ─ S9b           │
                                ↑                                                 │
                                Human playtest mandatory (S4c)                    │
                                                                                  │
S9b ─ S10 ─ S11a ─ S11b ─ S12 ─ S13                                              │
                  ↑                                                               │
                  External testers mandatory                                      ▼

Total: 21 sprints, **76 days of sprint work + 4 buffer days = ~80 days end-to-end** (2nd audit 5A-1 correction; old "67 days" figure was a miscalculation). Plus parallel marketing throughout via Sprint 0.
```

**Sprint count breakdown:**
- Original monolithic sprints kept: 0, 1, 2, 3, 5, 6, 7, 10, 12, 13 (10 sprints)
- Critical sprints split for risk isolation: 4→4a+4b+4c, 8→8a+8b+8c, 9→9a+9b, 11→11a+11b (11 sprints)
- **Total: 21 sprints + Buffer 1 (after 4c) + Buffer 2 (after 9b) = ~80-day budget (SCHED-1).**

**Rationale for splits:** The 4 split sprints (original 4, 8, 9, 11) had the highest concentration of risk + scope. Dividing them adds 6 checkpoints where you can catch failures 2-3 days earlier and keep Claude Code's context smaller per session (less invention risk). Non-critical sprints kept monolithic because their work is cohesive.

**Risk hotspots (updated for 20-sprint structure):**
- Sprint 2 perf spike — if fails, delays everything downstream
- Sprint 4a prestige core — foundational; if broken, 4b/4c cannot proceed cleanly
- Sprint 4c playtest — timing gate (P1 must hit 7-9 min); may require rebalancing before Sprint 5
- Sprint 8a OFFLINE-4 — Empática+Distribuida+GeniusPass stack must not exceed 2×
- Sprint 8b TRANS-1 + Resonance system — critical correctness for cross-run progression
- Sprint 8c TEST-5 + Resonant Patterns — full simulation validation, Secret Ending gate
- Sprint 9a platform integration — sandbox setup where most unpredictable delays happen
- Sprint 9b monetization polish — scope-heavy, many touch points, Apple disclosure compliance
- Sprint 11a rule-coverage grep — may surface under-tested rules requiring last-minute tests
- Sprint 11b device matrix + external testers — may surface platform bugs requiring fixes
- Sprint 12 store review — Apple rejection is real risk, budget 2x time

---

# Post-sprint ritual (MANDATORY at end of every sprint)

Every sprint ends with this ritual. Skipping it = silent invention accumulates and the project drifts.

### 1. Verification (automated)
```bash
npm run lint           # zero warnings
npm run typecheck      # zero errors
npm run check-invention # all 4 gates pass
npm test               # all tests green, including consistency.test.ts
```

If any of these fail → sprint is NOT done. Fix or escalate to Nico.

### 2. Update docs/PROGRESS.md

Add a new section for the sprint:

```markdown
### Sprint {N} — {Sprint name} (completed {date})

**Files created/modified:**
- src/config/constants.ts
- src/engine/production.ts
- ...

**Sprint checklist:**
- ✅ All AI checks passed
- ✅ All Sprint tests passed
- ✅ All Player tests confirmed by Nico
- (or ❌ specific items with reason)

**Discovered during sprint:**
- Issue X: decided Y, see PROGRESS note
- Feature request Z: deferred to POSTLAUNCH.md

**Divergences from GDD/CLAUDE.md:**
- None
- (or: "Changed X from Y to Z in constants.ts because W. GDD §? needs update.")

**Next action for next session:**
- Start Sprint {N+1} per docs/SPRINTS.md §Sprint {N+1}
- Known issue to address first: [if any]
```

### 3. If anything diverged from GDD.md

Update `docs/GDD.md` in the same commit that updates PROGRESS.md. Doc must match code. If you didn't update the GDD, the next session will read the old GDD, ignore your change, and silently re-implement the original.

This is the single most important habit. Doc-code drift is how projects die.

### 4. Commit message format

```
Sprint {N}: {short description}

- AI checks: ✅
- Sprint tests: ✅
- Player tests: ✅
- Divergences: {none | brief summary}
- Discovered: {none | brief list}

Closes #sprint-{N}
```

### 5. Before starting next sprint

Read the updated PROGRESS.md at session start. If there are unresolved "Discovered during sprint" items, address them FIRST, even if the natural next step would be Sprint N+1.

---

# Sprint dependency graph is above this section.
