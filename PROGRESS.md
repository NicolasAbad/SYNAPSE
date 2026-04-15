# SYNAPSE — PROGRESS

Per CODE-7: read at session start, update at session end.

## Sprint 1 — Project Setup + Core Engine

**Status:** code complete; pending player validation on device + Firebase wiring.

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
- `src/engine/production.ts` — `softCap()` + `calculateProduction(): { base, effective }`
- `src/engine/formulas.ts` — `getThreshold()` piecewise + `calculateConnectionMult()` + `calculateNeuronCost()`
- `src/engine/tick.ts` — `gameTick(state, dtMs)` pure function
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
- [x] `softCap(100)===100`, `softCap(200)≈164.9`, `softCap(1000)≈547.4` (formula verified)
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

### Next Task (Sprint 2 — Canvas + HUD)
1. Add `src/canvas/CanvasRoot.tsx` with `devicePixelRatio` setup + `requestAnimationFrame` render loop
2. HUD layout: thoughts top-left, rate top-right, charges center
3. Tab nav with progressive disclosure (10/80/1%)
4. `formatNumber()` helper using `NUMBER_SUFFIXES`
5. Pause both loops on `visibilitychange`
6. AudioContext unlock wired to first canvas tap
