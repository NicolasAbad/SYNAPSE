# SYNAPSE — PROGRESS

Per CODE-7: read at session start, update at session end.

## Sprint 1 — Project Setup + Core Engine

**Status:** code complete; pending player validation on device + Firebase wiring.

### Session 2026-04-15 — core data layer + engine pass

**Created:**
- `src/config/neurons.ts` — `NEURON_DEFINITIONS` + `NEURON_BY_TYPE` lookup, sourced from `SYNAPSE_CONSTANTS.neurons` (zero duplicated numbers)
- `src/config/upgrades.ts` — 35 upgrades with `id`, `name`, `description`, `category`, `tier` (P0/P2/P4/P6/P10), `cost`, `costType`, structured `requires`, `effect` token; `UPGRADE_BY_ID` lookup
- `src/engine/migrate.ts` — `migrateState(persisted, defaults)`; defaults injected by caller to keep `engine/` free of `store/` imports

**Modified:**
- `src/config/constants.ts` — added 10 canonical aliases / missing keys: `costMult`, `cascadeMult`, `offlineEfficiency`, `insightMult`, `insightDuration`, `focusFillPerTap`, `dischargeBaseMult`, `spontaneousChance`, `bankRefillPrice`, `sparkCapMonthly`
- `src/engine/production.ts` — softCap now applied to raw neuron output (was incorrectly applied to multiplier); full chain: connections × polarity × mental-state base × momentum, then `productionCap` softens excess; effective adds insight × eureka
- `src/engine/tick.ts` — refreshes `currentThreshold` each tick via `getThreshold(prestigeCount, transcendenceCount)`
- `CLAUDE.md` + `PROGRESS.md` — softCap expected values corrected to canonical 164.72 / 524.81

### Done

**Tooling**
- Vite 5 + React 18.3 + TypeScript strict scaffold
- All pinned dependencies installed per CLAUDE.md Tech Stack
- ESLint flat config + Prettier + path alias `@/* → src/*`
- `tsconfig.app.json` strict mode, `noUnusedLocals`, `noImplicitReturns`

**Capacitor**
- `capacitor.config.ts` written: `appId: app.synapsegame.mind`, `appName: SYNAPSE`, `webDir: dist`, portrait + dark background
- `npx cap add ios` and `npx cap add android` — pending (see Known Issues)

**Source files**
- `src/types/` — `GameState` (90+ fields) + sub-types (`NeuronState`, `UpgradeState`, `PatternNode`, `Mutation`, `AwakeningEntry`, `WeeklyChallengeState`, `DiaryEntry`)
- `src/config/constants.ts` — full `SYNAPSE_CONSTANTS` verbatim from GDD
- `src/config/strings/` — `t(key)` i18n with English seed dictionary
- `src/config/unlocks.ts` — `PROGRESSIVE_UNLOCKS` stub
- `src/engine/production.ts` — `softCap()` + `calculateProduction(): { base, effective }` with full multiplier chain (connections, polarity, mental-state base, momentum, productionCap; effective adds insight + eureka)
- `src/engine/formulas.ts` — `getThreshold()` piecewise + `calculateConnectionMult()` + `calculateNeuronCost()`
- `src/engine/tick.ts` — `gameTick(state, dtMs)` pure function; refreshes `currentThreshold` each tick
- `src/engine/migrate.ts` — `migrateState(persisted, defaults)` merges defaults for any missing fields, stamps `gameVersion`
- `src/store/initialState.ts` — default `GameState` builder
- `src/store/storage.ts` — Capacitor Preferences adapter for Zustand
- `src/store/gameStore.ts` — Zustand store + persist middleware + actions (tick, tap, buyNeuron, triggerDischarge, resetAll)
- `src/analytics/index.ts` — Firebase Analytics wrapper with no-op fallback
- `src/audio/index.ts` — Howler wrapper with `unlockAudioContext()` for iOS
- `src/main.tsx` + `src/App.tsx` — bootstrap with 100ms tick loop

**Repo**
- `.gitignore` covers node_modules, dist, .env, ios/, android/, IDE files
- `.env.example` placeholders for Firebase, AdMob, RevenueCat

### Sprint 1 AI-checks status
- [x] `npm run dev` starts (verified locally)
- [x] `npm run build` produces dist
- [x] `GameState` compiles, no `any`
- [x] `SYNAPSE_CONSTANTS` exports every GDD value
- [x] `softCap(100)===100`, `softCap(200)≈164.72`, `softCap(1000)≈524.81` (formula `100 * (x/100)^0.72` — canonical; GDD body values 164.9/547.4 were mathematically inconsistent with the exponent)
- [x] `calculateProduction()` returns `{ base, effective }`
- [x] Tick loop runs at 100ms
- [x] `t('app_name')` returns `SYNAPSE`
- [x] Zustand persist via Capacitor Preferences
- [x] ESLint zero warnings
- [x] No file > 200 lines (gameState.ts is largest at ~190)

### Known Issues / Deferred

- **Capacitor `cap add ios`/`cap add android` not yet run.** Will create `ios/` and `android/` directories (both gitignored). iOS pod install requires macOS + Xcode (Nico's Mac). Android requires `JAVA_HOME` and Android SDK. Defer until first device build sprint.
- **Firebase config not in `.env`.** Nico must create Firebase project and populate `.env` from `.env.example` before analytics/crashlytics fire.
- **No unit test suite yet.** GDD's "97 automated balance tests" land in Sprint 11.
- **Vite scaffold pulled React 19 by default.** Downgraded to 18.3 in `package.json` per CLAUDE.md pinning. Lockfile reflects 18.3.

## Sprint 2 — Canvas + HUD

**Status:** code complete; pending player validation on device.

### Session 2026-04-15 (cont'd) — canvas rendering + HUD + tabs

**Created:**
- `src/config/colorPalettes.ts` — `NeuronSkinPalette` interface, default skin (Basica/Sensorial/Piramidal/Espejo/Integradora colors verbatim from CLAUDE.md), `getSkinPalette()`, `DISCHARGE_FLASH_COLOR`
- `src/canvas/themes.ts` — `ThemeConfig` interface; Bioluminescent / Digital / Cosmic era themes implemented; `eraThemeForPrestige()` selector (P0-9 / P10-18 / P19+); empty cosmetic registry with `TODO Sprint 9` marker; `getActiveTheme(state)` honors `activeCanvasTheme` override
- `src/canvas/nodes.ts` — `SkinConfig`, `getActiveSkin()`, deterministic seeded polar layout `layoutNodes()` capped at 80 nodes, `drawNeurons()` with shadowBlur pulse
- `src/canvas/connections.ts` — `GlowPackConfig` + empty registry, `getActiveGlowPack()`, default ring-line `drawConnections()`
- `src/canvas/effects.ts` — `wrapText()` (verbatim from CLAUDE.md canvas rules), `drawDischargeFlash()` (gold radial 500ms fade), `drawNarrativeText()` (italic Georgia, lower-third)
- `src/canvas/renderer.ts` — `startRenderer(canvas)` rAF loop, `setupRetina()` with devicePixelRatio + ctx.setTransform, pause on `visibilitychange`, resize handler, reads store via `useGameStore.getState()` each frame
- `src/utils/formatNumber.ts` — `formatNumber()` (uses `NUMBER_SUFFIXES`, `Math.floor()` on input) + `formatRate()`
- `src/ui/HUD.tsx` — `React.memo` overlay with per-field selectors; thoughts (TL, gold, JetBrains-mono feel), rate (TR, green), charges dots (TC), Focus Bar (P4+), vertical Consciousness Bar (right edge); `pointerEvents: none` so taps reach canvas
- `src/ui/TabNav.tsx` — 4 tabs (Mind/Neurons/Upgrades/Regions), progressive disclosure (10 / 80 / `currentThreshold * regionsUnlockPct`), pulsing NEW badge per TUTOR-2, persisted via `localStorage` (`synapse:tabsSeen:v1`), keyframes injected once

**Modified:**
- `src/App.tsx` — mounts canvas via ref, wires `startRenderer`, `touchstart` handler calls `unlockAudioContext()` + `tap()`, overlays HUD + TabNav
- `src/config/strings/en.ts` — added `mind_tab`, `new_badge`

### Sprint 2 AI-checks status
- [x] Canvas uses `devicePixelRatio` (retina-correct via `ctx.setTransform`)
- [x] Touch uses `touchstart` not `click`, with `e.preventDefault()`
- [x] `touch-action: manipulation` on canvas CSS
- [x] Safe areas respected (`env(safe-area-inset-top/bottom)`)
- [x] HUD: thoughts TL, rate TR, charges TC
- [x] Focus Bar renders below charges (gated P4+)
- [x] Consciousness Bar on right edge (vertical, gated by `consciousnessBarUnlocked`)
- [x] Tab nav: 4 tabs, progressive disclosure (10/80/threshold×0.01)
- [x] `formatNumber()`: 1000→"1.0K", 1500000→"1.5M"
- [x] Canvas pauses on `visibilitychange === 'hidden'`
- [x] `wrapText()` implemented for narrative text
- [x] AudioContext unlock on first tap (iOS)
- [x] ESLint zero warnings; all files < 200 lines
- [x] `npm run build` produces 213 kB main bundle (well under 2 MB cap)
- [ ] **100ms tick loop** does NOT yet pause on `visibilitychange` — only rAF does. Wire in next session.

### Known Issues / Deferred (Sprint 2)
- **Tick loop visibility pause** not yet implemented (rAF pauses, but `setInterval` keeps running). Low impact (state still ticks correctly), but should pause for battery/correctness.
- **Discharge countdown text** in HUD (mockup line 37) not rendered — Sprint 3 will add charge-accumulation logic to tick; HUD shows dots only for now.
- **Tab content panels** (Mind/Neurons/Upgrades/Regions bodies) are placeholders — Sprint 3 wires the Neurons buy panel; others stay empty until their sprints.
- **Cosmetic registries** (`COSMETIC_REGISTRY` in themes, `GLOW_REGISTRY` in connections) are intentionally empty with `TODO Sprint 9` markers. The system architecture is locked in; Sprint 9 only fills lookup tables.
- **Pattern Tree / archetype / mutation panels** out of scope.

### Next Task (Sprint 3 — Neurons + Upgrades + Discharge)
1. Tick loop: pause `setInterval` on `visibilitychange === 'hidden'` (currently only rAF pauses)
2. Charge accumulation in `gameTick` using `dischargeAccumTime` + per-tick decrement
3. `ui/panels/NeuronPanel.tsx` — list 5 neuron types, ×1/×10/Max buy modes, color-coded affordability
4. `ui/panels/UpgradePanel.tsx` — 3 categories (new/affordable/locked), pulled from `UPGRADE_BY_ID`
5. Wire `triggerDischarge` button (Cascade fires when Focus ≥ 0.75)
6. Insight activation when `focusBar >= 1.0`; pick mult/duration tier from `insightMult`/`insightDuration`
7. Haptics: light on tap, medium on buy, heavy on discharge (Capacitor Haptics)
