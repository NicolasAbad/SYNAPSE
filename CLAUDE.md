# CLAUDE.md — SYNAPSE

Mobile idle/incremental game. Player evolves a mind from a single neuron to cosmic superintelligence across 3 Runs × 26 prestiges each. React + Vite + Zustand + Canvas 2D + Capacitor (iOS/Android) + AdMob + RevenueCat + Firebase.

**Working directory:** this repo. **Game design:** `docs/GDD.md`. **Sprints:** `docs/SPRINTS.md`. **Narrative:** `docs/NARRATIVE.md`. **Session continuity:** `docs/PROGRESS.md` (update at end of every session).

---

## Session start checklist
- Read this file (you're reading it)
- Read `docs/PROGRESS.md` — last session's state + next task
- Read the current sprint's checklist in `docs/SPRINTS.md`
- If touching an unfamiliar system, read its section in `docs/GDD.md` first

## Session end checklist
- Update `docs/PROGRESS.md` — files created/modified, checkboxes completed, known issues, next task
- Run `npm test` and `npm run lint` — commit only if green

---

## Tech stack
- **Framework:** React 18 + Vite + TypeScript (strict mode)
- **State:** Zustand (one store, selectors for slicing)
- **Rendering:** Canvas 2D (NOT SVG, NOT DOM for game area)
- **Mobile wrapper:** Capacitor 6
- **Orientation:** Portrait only; landscape ≥900px for tablets (UI-6)
- **Storage:** Capacitor Preferences (NEVER localStorage)
- **Audio:** Howler.js (unlock AudioContext on first user tap for iOS)
- **Analytics:** Firebase Analytics (48 events — see GDD §27)
- **Monetization:** RevenueCat + AdMob
- **Testing:** Vitest 3 (unit + integration), Vitest Browser Mode (via Playwright provider), Playwright (E2E), adb + CDP (Android WebView debugging), Firebase Test Lab / BrowserStack (S11 device matrix)

## Directory map
```
src/
  config/          ← all constants, strings (CODE-1)
    constants.ts   ← every game number (see GDD §constants)
    strings/       ← i18n (en.ts, es.ts)
  engine/          ← pure functions, no side effects (CODE-9 deterministic)
    production.ts  ← softCap, base/effective calcs
    discharge.ts   ← discharge + focus + cascade
    prestige.ts    ← handlePrestige, reset/preserve logic
    transcendence.ts
    mutations.ts
    offline.ts
    tick.ts        ← 100ms game loop
    migrate.ts     ← save version migrations
  store/           ← Zustand store + actions
    gameStore.ts
  ui/              ← React components
    panels/        ← tab panels (Neurons, Upgrades, Regions, Mind)
    modals/        ← CycleSetupScreen, Awakening, etc.
    hud/           ← thoughts, rate, charges, focus bar, consciousness bar
    canvas/        ← Canvas2D rendering
  sim/             ← tick-based simulation for TEST-5
  i18n/            ← translation files
e2e/               ← Playwright specs
docs/
  GDD.md           ← source of truth for mechanics
  SPRINTS.md       ← sprint plan + checklists
  NARRATIVE.md     ← fragments, echoes, endings (English)
  POSTLAUNCH.md    ← v1.5+ roadmap (NOT for v1.0 — do not implement)
  PROGRESS.md      ← session continuity tracker
  UI_MOCKUPS.html  ← SVG mockups (only file kept as HTML)
  archive/         ← historical docs
.claude/settings.json
.claudeignore
```

## Architecture rules (CODE-1 through CODE-9)
- **CODE-1:** ZERO hardcoded game values. Every number in `config/constants.ts`, every player-facing string in `config/strings/{lang}.ts` via `t('key')`. Only exceptions: 0, 1, -1, array indices, CSS values.
- **CODE-2:** MAX 200 lines per file, MAX 50 lines per function. One file = one purpose. Dependency flow: `config → engine → store → ui` (never backward). No circular imports.
  - **Exception:** pure type definition files with >100 fields may exceed the 200-line cap IF the excess is entirely from documentation/section comments that aid audit and cross-reference. The exception must be documented in a file-level docstring citing this clause. As of post-2nd-audit, the only file under this exception is `src/types/GameState.ts` (214 lines, 110 fields).
- **CODE-3:** Sprint is NOT done until every checkbox in `docs/SPRINTS.md` for that sprint is checked (AI checks + Player tests + Sprint tests).
- **CODE-4:** Canvas — rAF at 60fps (visual only), separate 100ms game tick. Touch via `touchstart` not `click`. `touch-action: manipulation`. Safe areas via `env(safe-area-inset-*)`. Max 80 visible nodes. Pre-render glow.
- **CODE-5:** Mobile — AudioContext unlock on first tap. `overscroll-behavior: none`. Android back button closes modals or minimizes. `Math.floor()` all displayed numbers. Epsilon tolerance for threshold comparisons.
- **CODE-6:** Storage — Capacitor Preferences primary, Firebase Cloud secondary (fail silently). Save on prestige + background + 30s interval (NEVER on tick). On conflict: merge per MIG-1 (union purchases/cosmetics, MAX currencies, higher `totalGenerated` for everything else). `migrateState()` adds defaults for missing fields.
- **CODE-7:** Session continuity — PROGRESS.md updated at end of every session. Lists: files created/modified, sprint checkbox progress, known issues, next task.
- **CODE-8:** TypeScript — `strict: true`. No `any`. No `@ts-ignore`. `const` over `let`. Early returns. Pure functions in engine/. `React.memo()` all panels. try/catch around: storage, ads, Firebase, RevenueCat (never throw in engine).
- **CODE-9:** Engine determinism — NO `Math.random()` (use seeded `mulberry32` — full spec in GDD §30 RNG-1), NO `Date.now()` (pass timestamp as parameter to tick/offline/save). Hash function for deriving seeds: FNV-1a variant per GDD §30. Fixed 100ms dt. Round currency to integer before display (engine keeps exact values). Enables replay + 1000-run simulation.

## Never do these things
- **Never use `Math.random()` inside `src/engine/`** — breaks CODE-9 determinism
- **Never use `Date.now()` inside `src/engine/`** — pass timestamp as param
- **Never use `localStorage`** — use Capacitor Preferences (CODE-6)
- **Never hardcode a game number** — put it in `config/constants.ts` (CODE-1)
- **Never commit with failing tests** — red tests = red commit (CODE-3)
- **Never reference v1.5+ features** — those are archived in `docs/POSTLAUNCH.md`, NOT for v1.0
- **Never use `productionPerSecond`** — this field was deprecated. Use `baseProductionPerSecond` (for offline/discharge) or `effectiveProductionPerSecond` (for UI/tick/tap)
- **Never edit `docs/archive/`** — historical only
- **Never write files >200 lines** — split by responsibility (CODE-2)

## Common pitfalls (framework-specific gotchas that cause silent failures)

**Zustand store pattern (Sprint 1 Phase 6 discovery):**
Never use `useGameStore.setState(state, true)` (the replace flag). The `true` flag replaces the WHOLE store object including bound action methods, leaving `initSessionTimestamps`, `reset`, and all other actions `undefined` — subsequent calls fail with cryptic "X is not a function" errors. Always use `setState(state)` (merge mode) which preserves action references. This applies to test setup, save/load flows, and any programmatic state reset.

Correct:
```ts
useGameStore.setState(createDefaultState());       // ✓ merges
useGameStore.setState({ thoughts: 100 });          // ✓ partial
```

Incorrect:
```ts
useGameStore.setState(createDefaultState(), true); // ✗ actions lost
useGameStore.setState({ ...createDefaultState(), ...actions }, true); // ✗ brittle
```

For a true reset, prefer calling the `reset()` action (which is itself defined as `() => set(() => createDefaultState())` — Zustand's `set()` preserves actions automatically).

---

## Anti-invention rules (CRITICAL — read every session)

These rules prevent Claude Code from inventing values, behaviors, or specifications that are not documented. Silent invention is the #1 source of bugs in AI-assisted development.

- **Never invent a numeric value.** If a value is needed and not in `src/config/constants.ts` or `docs/GDD.md`:
  1. STOP immediately. Do not pick "a reasonable default".
  2. Do not say "this can be tuned later".
  3. Do not interpolate from similar values.
  4. Ask Nico explicitly: "Need value for X. Not found in constants.ts §? or GDD.md §?. Please specify."

- **Never interpret ambiguous specs creatively.** If docs/GDD.md says "the Mutation affects production" without specifying the exact multiplier, that is a spec gap — not an invitation to guess. Stop and ask.

- **Never implement a feature not in the current sprint.** If you discover a missing feature while implementing Sprint N, do NOT add it silently. Document it in `docs/PROGRESS.md` under "Discovered during Sprint N" and continue with what's specified. Nico decides when/if to add it.

- **Never change an existing specification without approval.** If the GDD says X and you think Y is better: STOP. Write your proposal in a comment, show Nico, let him decide. Do not "improve" silently.

- **Never skip a test because "it doesn't apply in this context".** If a test in the sprint checklist seems wrong, ask. Do not decide unilaterally.

- **Never round numbers in engine code.** Currency display rounding happens in UI layer (`Math.floor` on display). The engine state uses exact values. Silent rounding breaks determinism (CODE-9).

- **Never inline a value "just this once".** Every value gets pulled from constants. If the value doesn't exist yet, add it to constants first (with Nico's approval of the value).

## Update discipline (when modifying mechanics mid-sprint)

If during a sprint you need to modify something that was specified (e.g., a value doesn't work in simulation, a formula has a bug), update **all three locations** in the same commit:

1. **The code** (implementation change)
2. **`src/config/constants.ts`** (if a constant changed)
3. **`docs/PROGRESS.md`** (a line in "Changes applied this sprint" explaining what changed, why, and the GDD section that now disagrees)

If you update only 1 or 2 of these, the doc and code diverge silently. Future sessions read the doc, ignore your change, and re-implement the original — or worse, the test passes against the new code but the player experience follows the old doc.

After the sprint ends, Nico updates `docs/GDD.md` to match the code. Until then, PROGRESS.md is the source of truth for any divergence.

## Verification gates (run before every commit)

Before running `npm test`, run `npm run check-invention` which executes these gates:

1. **No hardcoded numerics in engine:** grep finds numeric literals in `src/engine/` that aren't `0`, `1`, `-1`, or pulled from constants. Any match → fail.
2. **GDD references present:** every file in `src/engine/` contains a comment referencing the GDD section it implements (format: `// Implements GDD.md §N`). Missing reference → fail.
3. **Constants coverage ratio:** constants referenced vs numeric literals in src/ — ratio must be >0.8. Lower means someone is hardcoding.
4. **Consistency tests green:** `tests/consistency.test.ts` passes (asserts code matches doc invariants like field counts, constant values, etc.).

If any gate fails, the commit is blocked by the pre-commit hook.

## Key constants (quick reference — full list in GDD §constants)
```
tutorialThreshold:      50_000     // P1 tutorial ~7-8 min
tutorialDischargeMult:  3.0        // ×3 first discharge
costMult:               1.28       // neuron cost scaling
softCapExponent:        0.72       // softCap(x) = 100 × pow(x/100, 0.72)
cascadeThreshold:       0.75       // Focus ≥ this triggers Cascade
cascadeMult:            2.5        // Cascade discharge multiplier
momentumBonusSeconds:   30         // post-prestige head start
maxMomentumPct:         0.10       // CORE-8 cap (4A-2): momentum ≤10% of next threshold
baseOfflineCapHours:    4          // initial offline cap
maxOfflineHours:        16         // max via upgrades (REM→8, C.Distribuida→12, S.Profundo→16)
baseOfflineEfficiency:  0.50       // 50% of base production
maxOfflineEfficiencyRatio: 2.0     // final ratio cap (OFFLINE-4)
runThresholdMult:       [1.0, 3.5, 6.0, 8.5, 12.0, 15.0]
insightMult:            [3.0, 8.0, 18.0]
insightDuration:        [15, 12, 8]
patternCycleBonusPerNode: 0.04
patternCycleCap:        1.5
bundleId:               app.synapsegame.mind
```

## Glossary (Spanish ↔ English)
In-game mechanic names stay Spanish (evocative, distinctive). Code identifiers use the English equivalent in camelCase. Player-facing strings use locale files.

| Spanish (canonical) | English | Code identifier |
|---|---|---|
| Despertar | Awakening (prestige ritual) | `awakening`, `handlePrestige` |
| Disparo | Discharge | `discharge` |
| Cascada | Cascade | `cascade` |
| Consciencia (barra) | Consciousness bar | `consciousnessBar` |
| Pensamientos | Thoughts | `thoughts` |
| Memorias | Memories | `memories` |
| Chispas | Sparks | `sparks` |
| Resonancia | Resonance | `resonance` |
| Sinapsis Espontánea | Spontaneous Event | `spontaneousEvent` |
| Insight / Claro / Profundo / Trascendente | Insight / Clear / Deep / Transcendent | `insight` |
| Polaridad (Excitatoria / Inhibitoria) | Polarity (Excitatory / Inhibitory) | `polarity`, `'excitatory' \| 'inhibitory'` |
| Arquetipo (Analítica / Empática / Creativa) | Archetype (Analytical / Empathic / Creative) | `archetype`, `'analitica' \| 'empatica' \| 'creativa'` |
| Mutación | Mutation | `mutation` |
| Vía / Pathway (Rápida / Profunda / Equilibrada) | Pathway (Swift / Deep / Balanced) | `pathway`, `'rapida' \| 'profunda' \| 'equilibrada'` |
| Patrones (árbol) | Patterns (tree) | `patterns`, `patternDecisions` |
| Transcendencia | Transcendence | `transcendence` |
| Trascendencia | (typo variant, avoid) | — |
| Sueño / Sueño REM / Sueño Lúcido | Sleep / REM Sleep / Lucid Dream | `sleep`, `remSleep`, `lucidDream` |
| Síntesis Cognitiva | Cognitive Synthesis | (upgrade) |
| Cargas | Charges | `dischargeCharges` |

## Common commands
- `npm install` — install deps
- `npm run dev` — Vite dev server (web preview)
- `npm test` — Vitest (unit + integration)
- `npm run test:browser` — Vitest Browser Mode (component tests)
- `npm run test:e2e` — Playwright E2E
- `npm run sim` — run 1000-playthrough economy simulation (TEST-5)
- `npm run lint` — ESLint (zero warnings required)
- `npm run typecheck` — tsc --noEmit
- `npx cap sync` — sync web build to iOS/Android
- `npx cap open android` / `npx cap open ios` — open native IDE
- `adb devices` — list connected Android devices (for CDP debugging)

## Prompting style for new work
When asking Claude Code to implement a sprint:
1. Reference the sprint by number: "Implement Sprint 3 per docs/SPRINTS.md §Sprint 3"
2. Let Claude read GDD.md for mechanics — don't paste specs inline
3. Ask for tests FIRST when sprint has TEST-3 requirement (most do)
4. After implementation, ask Claude to update PROGRESS.md
5. Never accept "this probably works" — insist on green test output

## Feedback
Found a bug? Report via thumbs-down in Claude.ai interface (not here).

---

**Read next:** `docs/GDD.md` for mechanics, `docs/SPRINTS.md` for sprint plan, `docs/PROGRESS.md` for what's next.
