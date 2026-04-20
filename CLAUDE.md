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

## Pre-code research pattern (Sprint 1+2 precedent)

Before writing code for any phase, complete a pre-code research step of 5-15 minutes:

1. Grep `docs/` and `src/` for any reference to the phase's key concepts (names, rules, numbers mentioned in the phase prompt).
2. Identify ambiguities, undefined terms, or potential naming collisions.
3. Propose interpretations or resolutions with explicit STOP-for-approval gates where appropriate.
4. Only after resolution: write code.

This pattern caught 3 significant pre-code findings in Sprint 1+2:
- Phase 2 Sprint 2: `UI_MOCKUPS.html` `#4060E0` drift from canonical `--bl #4090E0`
- Phase 4 Sprint 2: "9 theme slots" ambiguity + `cosmic` naming collision (Era vs Cosmetics Store canvas theme)
- Phase 4 Sprint 2 (meta): `nebula` counter-proposal would have created a new collision — caught by pre-code catalog audit

Pattern cost: ~15 min per phase. Pattern benefit: catches the class of bugs that code review cannot — the code would look correct against its local spec; the bug lives in spec-to-spec inconsistencies.

Especially critical for phases that introduce NAMES (type unions, identifiers, enum values), NUMBERS (thresholds, caps, timing values), or VISUAL TOKENS (colors, sizes) — these are the most common sources of silent drift in canonical docs.

Not required for phases that purely implement already-specified behavior with no new concepts introduced (e.g., wiring an existing utility into a new consumer).

## Canonical storage file rule (Sprint 1/2 precedent)

Files that serve as the CANONICAL SOURCE OF TRUTH for spec values must be excluded from `scripts/check-invention.sh` Gate 3's literal count. Counting canonical values as "inventions" makes the constants-coverage ratio mathematically unreachable.

**Current exclusions in Gate 3:**
- `src/config/` (game-logic spec values — Sprint 1 Phase 8 precedent)
- `src/ui/tokens.ts` (UI design tokens — Sprint 2 Phase 1 precedent)

When adding a new canonical storage file (e.g. `src/config/audio.ts`, `src/config/achievements.ts`, `src/ui/animations.ts`), extend the Gate 3 exclusion list with a new `| grep -v "path/to/file"` line, parallel to the existing entries. Log the change in `docs/PROGRESS.md`.

This is NOT an escape hatch. Canonical storage files must:
1. Contain ONLY data (no logic).
2. Be imported by code that uses `SYNAPSE_CONSTANTS` or equivalent centralized pattern.
3. Be documented in GDD (or equivalent) as the source of truth.
4. Be reviewed at sprint close to confirm they still fit the "data, not code" criterion.

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

## Glossary (Spanish origin ↔ English display)
Mechanic names are English for v1.0 (target audience: anglophone mobile idle players). All user-facing strings flow through `src/config/strings/en.ts` via `t('key')` per CODE-1.

Internal TypeScript union-type string identifiers retain their Spanish origins (e.g., `'analitica'`, `'rapida'`, `'basica'`) — these are code-only, never shown to players, and refactoring them would have zero user impact while creating 15+ file churn. v1.1 multi-locale will add `es.ts` and other language files (see POSTLAUNCH.md §v1.1).

The Spanish column below is preserved as historical reference for the design heritage. The English column is the canonical player-facing text.

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

## Language translation — sprint-level ownership

Per Finding #17 (Phase 4.9 Sprint 2), v1.0 user-facing text is English. However, translation from the original Spanish design docs happens INCREMENTALLY — each sprint translates the GDD sections and docs it touches.

**Phase 4.9 (Sprint 2) translated:**
- GDD §29 (HUD layout) — full English
- UI_MOCKUPS.html — all user-facing labels English
- CLAUDE.md Glossary — intro reworded; table preserved as reference
- SPRINTS.md — 2 local mentions

**Sprints that still own translation of their sections:**
- Sprint 3: GDD §5 (neuron types full descriptions), §7 (Discharge + Cascade), §8 (Spontaneous events — most compound names are here: Ráfaga Dopamínica, Polaridad Fluctuante, etc.), §24 (upgrades — ~35 compound names including Convergencia Sináptica, Mente Despierta, etc.)
- Sprint 4a: §33 PRESTIGE_RESET prose references
- Sprint 5: §13 Mutations (~15 compound names)
- Sprint 6: GDD §9 (Era names: El Despertar → "The Awakening" etc.), §10 narrative prose
- Sprint 7: §11 Mental States prose, §12 Micro-challenges
- Sprint 8b: §15 Resonance upgrades, §17 Transcendence, §14 Run-exclusive upgrades
- Sprint 10: §16 Regions prose

**Translation discipline per sprint:**
1. At sprint kickoff, grep sprint's GDD sections for Spanish compound names still untranslated
2. For each compound name, propose an English equivalent in the sprint kickoff prompt to Nico (not auto-translate)
3. Nico approves per-name before code implementation begins
4. PROGRESS.md logs the translations applied in that sprint
5. Internal TS union-type identifiers (`'basica'`, `'rapida'`, etc.) NEVER translate — internal only, never player-facing

**Anti-pattern to avoid:** mass find-and-replace of Spanish compound names without per-name approval. Many names are creative gameplay decisions (Mente Despierta, Modo Ascensión, Cascada Eterna) with no neuroscientific equivalent to look up. Inventing English versions = silent naming invention, violates anti-invention rules.

**Exception:** Spanish bare terms that already have CLAUDE.md Glossary equivalents (Despertar→Awakening, Disparo→Discharge, Mutación→Mutation, etc.) can be find-and-replaced safely IF the context is bare-term (not inside a compound name). Compound names always require full-name translation with approval.

## Reviewer evidence discipline (Phase 4.9 Sprint 2 policy)

**Context:** Sprint 1+2 tracked 7+ fabrications in prompts generated by Claude Opus (reviewer), caught by Claude Code pre-code research or by Nico during review. Error classes: scope fabrication, name invention, unverified assumptions, naive find-and-replace tables, memory-based scope claims. This rule prevents reviewer-side invention the same way the "Anti-invention rules" prevent Claude-Code-side invention.

**Rule:** Every prompt generated by Claude Opus for a phase, decision, or scope expansion MUST begin with a "Reviewer evidence" block containing:

1. **Session state verification** — current phase, previous checkpoint commit hash, tests count at last checkpoint. Catches stale-context errors.

2. **Grep verifications run** — literal command + actual output summary. Not "I believe X is in the docs" — actual grep evidence pasted inline.

3. **Evidence-backed claims** — every scope claim, numeric value, name, or rule cited must have grep-verifiable evidence. Claims without evidence = unverified assumptions (see below).

4. **Unverified assumptions** — explicit list of things the prompt claims but could not or did not verify. Claude Code treats these as MUST-VERIFY-BEFORE-PROCEEDING.

5. **Scope boundary** — IN scope items from current phase AI checks, OUT OF scope items from future phase AI checks. Both verified against SPRINTS.md, not memory.

6. **Compound/edge case audit** — when prompt includes find-and-replace, naming tables, or reference lists, audit for edge cases BEFORE proposing. Example for find-and-replace: `grep -oE "bare_term [A-Z][a-zá-ú]+" file` to find compound names that naive replace would mangle.

7. **Red flags** — self-aware list of where the reviewer might be wrong, relying on stale memory, or skipped verification.

**Enforcement:**
- Nico rejects prompts missing the evidence block and asks for regeneration.
- Claude Code treats prompts without evidence block as NOT AUTHORITATIVE — verify every claim independently before proceeding.
- PROGRESS.md tracks per-phase metrics: reviewer errors caught by Claude Code, reviewer errors caught by Nico, unverified assumptions flagged. Target: ≤1 caught per phase. Consistent >2 signals reviewer context degradation → new session recommended.

**What's NOT in scope for this rule:**
- Quick conversational replies (checkpoint reviews, clarifying questions, simple approvals)
- Prompts that don't make authoritative claims about scope/values/names
- Meta-discussion about the project or process

**Applies to:** phase kickoff prompts, scope decisions, architectural decisions, find-and-replace tables, naming proposals, value recommendations, canonical storage updates.

## Instructions for Claude Opus (reviewer) at session start

When Nico starts a new session with Claude Opus as reviewer (recognizable by: multi-file canonical doc upload + Sprint context + prompts referencing "Phase X" or "Sprint X" + references to Claude Code as implementer):

1. **Read this entire CLAUDE.md first** — especially the "Reviewer evidence discipline" section above.

2. **Acknowledge reviewer role explicitly** in first substantive message: "I'm operating as reviewer. Evidence discipline per CLAUDE.md: every phase/decision prompt I generate starts with a Reviewer evidence block."

3. **On detecting compaction warning** (sees "NOTE: This conversation was successfully compacted..." in context): pause before advancing. Re-read CLAUDE.md "Reviewer evidence discipline" + "If this session was compacted" sections. Re-read PROGRESS.md last 5 session log entries.

4. **Reviewer track record awareness**: Sprint 1+2 had 7+ reviewer fabrications. This is ABOVE acceptable baseline. Evidence discipline exists to prevent recurrence. If approaching Sprint 3 without evidence blocks, stop and ask Nico to enforce the rule.

5. **If Nico references prior-session decisions** not appearing in CLAUDE.md or PROGRESS.md: "I cannot verify that from current context. Please point me to the CLAUDE.md / PROGRESS.md section, or treat as unresolved and re-confirm."

6. **Never claim memory of decisions not documented** in uploaded docs. This is exactly the fabrication class that evidence discipline prevents.

## If this session was compacted (Claude Code — implementer)

If you (Claude Code) see "NOTE: This conversation was successfully compacted..." anywhere in your context mid-task, the prior conversational memory is lost. Only the auto-generated compaction summary + this repo's canonical files remain. Recovery is possible because this project is designed for it — session state lives on disk in PROGRESS.md + git, not in the transcript.

**Required behavior the moment you detect compaction:**

1. **Stop implementing immediately.** Do not continue the current tool call, do not start new code. First reconstruct state, then resume.

2. **Run the recovery sequence** (in this order, all independent calls in parallel):
   - Read CLAUDE.md (this file, top to bottom) — re-load rules + current constants
   - Read PROGRESS.md last ~20 entries of the "Session log" section (most recent work)
   - `git status` — what files are dirty, what's uncommitted
   - `git log --oneline -20` — resumption index; last commit = last confirmed-green checkpoint
   - `git diff HEAD` (if there are uncommitted changes) — what work was in progress when compaction fired
   - Read the active sprint section in SPRINTS.md (identified from PROGRESS.md "Current status" → Active sprint)

3. **Reconstruct what was in flight.** Using the above, answer three questions before acting:
   - **What phase/task was I on?** → PROGRESS.md "Next action" field + last session log entry
   - **What did I already finish?** → last commit + any PROGRESS.md entry marked as "this session"
   - **What was I in the middle of?** → uncommitted `git diff` + incomplete checkboxes in the active sprint

4. **Verify green state before resuming.** Run `npm run typecheck`, `npm run lint`, `npm test` in parallel. If any fail, the compaction interrupted a broken state — fix the break before continuing the original task.

5. **Report the reconstruction to Nico and WAIT for confirmation** before resuming implementation. Format:
   ```
   Post-compaction recovery:
   - Active sprint: Sprint N
   - Last completed: <phase or task, with commit hash>
   - In progress: <task, with files touched>
   - Uncommitted changes: <summary of git diff>
   - Green state: typecheck/lint/test all passing
   - Proposed next step: <resume X by doing Y>
   Confirm to proceed.
   ```
   Nico may have context you cannot recover (e.g. a value approval given verbally in-session that didn't make it to PROGRESS.md). Do not guess — ask.

6. **Do not trust the compaction summary for decisions.** It captures facts but loses in-session agreements, approved values, and micro-corrections. Anything not in PROGRESS.md + git must be re-confirmed.

**Mid-task flush discipline (to make recovery possible):**

- After each phase AI-check bundle completes green (typecheck + lint + test), append the outcome to PROGRESS.md immediately — don't wait for phase close
- Commit at phase boundaries, not session end. Every green commit is a compaction recovery point
- If a spec gap is found and a value is approved in-session, write it to PROGRESS.md "Changes applied this sprint" before writing any code that uses it — values die in transcripts but survive in files

## If this session was compacted (Claude Opus — reviewer)

If Claude Opus sees "NOTE: This conversation was successfully compacted..." at the start of its context, the prior conversational memory is lost. Only the auto-generated compaction summary + re-uploaded canonical docs remain.

Anti-pattern: treating the compaction summary as equivalent to conversational memory. The summary captures facts but NOT meta-commitments, in-session auto-corrections, or process agreements.

**Required behavior after detecting compaction:**

1. Do NOT trust memory of prior session decisions. Evidence discipline applies with extra rigor.

2. Re-read CLAUDE.md "Reviewer evidence discipline" before generating any phase/decision prompt.

3. Re-read PROGRESS.md last 5 entries to reconstruct state. The compaction summary is a starting point, not authoritative.

4. If Nico references decisions made pre-compaction that don't appear in CLAUDE.md or PROGRESS.md, flag explicitly: "Not verifiable from current context — please re-confirm or point me to where it's documented."

5. First phase prompt after compaction should include extra verification in the "Unverified assumptions" block — err toward flagging, not claiming.

6. Review reviewer track record via PROGRESS.md metrics before generating prompts — if prior phase showed elevated fabrications, apply extra scrutiny.

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
