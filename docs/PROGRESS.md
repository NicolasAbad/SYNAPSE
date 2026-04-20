# SYNAPSE — Session Progress

**Purpose:** session continuity tracker per CODE-7. Claude Code updates this at the END of every session. Read this first at the START of every session.

---

## Current status

**Phase:** Sprint 2 in progress — Phases 1–6 complete (Canvas, renderer, HUD, theme, i18n, TabBar, UI-9 first-open sequence + CycleSetupScreen shell)
**Last updated:** 2026-04-20 after Sprint 2 Phase 6 (UI-9 modals + CycleSetupScreen shell)
**Active sprint:** Sprint 2 (Canvas + HUD + Performance Spike)
**Next action:** Sprint 2 Phase 7 — performance spike per SPRINTS.md §Sprint 2 (100 nodes + full glow on Pixel 4a, ≥30 fps, <20 MB memory delta, <2%/30s battery). Phase 6 shipped 27 new tests; 342 passing / 54 skipped / 0 failing. Anti-invention ratio 0.90.

### Sprint 1 closing dashboard

- **Phases:** 8 (scaffolding → constants+types → RNG → production → tick → store → save → tests+hook+ritual)
- **Active tests:** 183 passing, 0 failing
- **Skipped tests:** 54 (all tagged `BLOCKED-SPRINT-X`; un-skip as each sprint ships its exports)
- **Typecheck errors:** 0 (`tsc -b --noEmit` clean)
- **Lint warnings:** 0 (`eslint .` clean)
- **Anti-invention gates:** 4/4 PASS (constants ratio 0.86)
- **Production bundle:** 160.84 KB (52.92 KB gzipped) — well under 2 MB budget
- **Doc-vs-code gaps caught + resolved:** 4 (THRES-1 6.3B stale, softCap fabrication, cycleTime structural, insightMultiplier omission)
- **CODE-2 exceptions:** 2 (`GameState.ts`, `gameStore.ts`) — both data artifacts with documented docstring justification
- **Sprint 11a deliverable elevated from v1.1:** snapshot validation gate (Batch 5 6A-2)
- **Husky pre-commit hook:** installed, runs 4 gates on every commit

### Handoff state for Sprint 2

**What Sprint 2 will build** (per `docs/SPRINTS.md` §Sprint 2 — Canvas + HUD + Performance Spike):

- Canvas2D renderer with `devicePixelRatio` scaling for retina
- HUD overlay: thoughts (TL), rate (TR), charges (TC), Focus Bar (right vertical), consciousness bar (left vertical)
- 4-tab bottom nav shell (Neurons, Upgrades, Regions, Mind) with progressive disclosure
- UI-9 first-open sequence: branded splash (2s) → GDPR if EU → canvas with 1 auto-granted Básica pulsing
- CycleSetupScreen layout shell per CYCLE-2 (step-by-step on <600px, 3-column ≥600px)
- Theme system scaffolding: 9 theme slots, 3 Era themes (bio, digital, cosmic)
- Performance spike: 100 animated nodes + full glow on Pixel 4a emulator → ≥30 fps, <20 MB memory delta, <2%/30s battery
- `formatNumber()` helper with suffix precision (K/M/B/T/Q)
- `wrapText()` canvas helper via `ctx.measureText()`
- AudioContext unlock-on-first-tap for iOS
- `touchstart` (not `click`) + `touch-action: manipulation` + `env(safe-area-inset-*)` for mobile
- Canvas pause on `visibilitychange === 'hidden'`

**What Sprint 2 does NOT touch** — the engine is frozen unless a bug is found:

- `src/engine/rng.ts` — RNG-1 primitives (frozen)
- `src/engine/production.ts` — softCap + threshold primitives (frozen)
- `src/engine/tick.ts` — 12-step TICK-1 reducer (Sprint 3+ wires production multipliers; Sprint 2 only reads cached `effectiveProductionPerSecond`)
- `src/store/gameStore.ts` core state + `createDefaultState` + INIT-1 action (frozen; Sprint 2 may add UI-specific actions like `setActiveTab` at the end, but not modify existing state shape)
- `src/store/saveGame.ts`, `src/store/saveScheduler.ts` — save system (frozen)
- `src/types/GameState.ts` — 110-field interface (frozen — adding a field cascades to §32, §33, consistency tests, PRESTIGE split)
- `src/config/constants.ts` — all spec values (frozen)

Any bug or spec gap found in the above MUST be flagged (PROGRESS.md session log + halt) rather than fixed silently — same discipline as Sprint 1's 4-gap rhythm.

**Key dependencies Sprint 2 will add** (approximate — Sprint 2 kickoff finalizes):

- **Tailwind CSS** — for HUD + tab styles (utility-first scales well for small dev budgets)
- **jsdom** — unblocks render-based tests previously TODO'd in `tests/store/initSession.test.ts` and `tests/store/saveScheduler.test.ts`
- **@testing-library/react** — component rendering + interaction tests
- **@testing-library/jest-dom** — DOM matcher assertions (optional, nice-to-have)
- **Capacitor Haptics** — Sprint 3 uses it; Sprint 2 may install the plugin for a shared Haptics utility

Total added dep footprint: ~30–50 MB dev, ~40 KB runtime (Tailwind purges to ~10 KB).

**Sprint 2 performance target:** ≥30 fps on Pixel 4a per GDD §29 / CODE-4. Performance spike test (`npm run test:perf`, added in Sprint 2) runs 30s stress with 100 nodes + full glow. Fails the sprint if budget exceeded.

**Where Sprint 2 reads from existing state** (no writes except UI-local):

- `state.thoughts`, `state.memories`, `state.sparks` — HUD currency displays (via `useGameStore(s => s.thoughts)` selectors; `Math.floor()` on display per CODE-5)
- `state.effectiveProductionPerSecond` — HUD rate display (cached by TICK-1 step 3)
- `state.neurons` — canvas node rendering (5 types, counts determine visible density)
- `state.connectionMult` — HUD/canvas visual edge density
- `state.focusBar` — right vertical Focus Bar fill level (0.0–3.0)
- `state.dischargeCharges`, `state.dischargeMaxCharges` — HUD top-center charges pip
- `state.consciousnessBarUnlocked`, `state.cycleGenerated`, `state.currentThreshold` — left vertical consciousness bar visibility + fill
- `state.insightActive`, `state.insightEndTime` — Insight visual state
- `state.eraVisualTheme` — theme selection (`bioluminescent` | `digital` | `cosmic`)
- `state.activeCanvasTheme`, `state.activeNeuronSkin`, `state.activeGlowPack`, `state.activeHudStyle` — cosmetics (defaults null → use era defaults)
- `state.currentMentalState` — Mental State visual overlay (null in Sprint 2; wired in Sprint 7)

**Sprint 2 tab badge state** — `state.tabBadgesDismissed` is in GameState (§32) but only HUD component writes happen in Sprint 2 (UI-3: max 1 badge active).

**54 consistency tests still BLOCKED-SPRINT-X** (by category):

| Sprint | Count | What unblocks them |
|---|---|---|
| Sprint 3 | 5 | `NEURON_TYPES`, `NEURON_CONFIG`, `UPGRADES` exports (neurons + upgrades + taps + Discharge) |
| Sprint 4a | 6 | `PRESTIGE_RESET`, `PRESTIGE_PRESERVE`, `handlePrestige` (45/60/4/1 split enforcement) |
| Sprint 5 | 6 | `MUTATIONS`, `PATHWAYS`, `getMutationOptions` exports |
| Sprint 6 | 16 | `ARCHETYPES`, `SPONTANEOUS_EVENTS`, `ERA_3_EVENTS`, `FRAGMENTS`, `ECHOES`, `ENDINGS`, weighted-events helper |
| Sprint 7 | 11 | `MENTAL_STATES`, `MICRO_CHALLENGES`, `ACHIEVEMENTS` |
| Sprint 8b | 7 | `RUN_EXCLUSIVE_UPGRADES`, `RESONANCE_UPGRADES` |
| Sprint 8c | 2 | `RESONANT_PATTERNS` |
| Sprint 10 | 6 | `WEEKLY_CHALLENGES`, `ANALYTICS_EVENTS` |
| **Total** | **54** | Grep `BLOCKED-SPRINT-` in `tests/consistency.test.ts` for the exact list |

Sprint 2 does NOT un-skip any consistency tests — its deliverables are UI/render-focused. Test un-skipping resumes in Sprint 3 (neurons + upgrades).

**Clean-baseline verification at handoff** (all 4 gates green from cold state):

- `git status` — clean (empty)
- `npm run typecheck` — 0 errors
- `npm run lint` — 0 warnings
- `bash scripts/check-invention.sh` — all 4 gates PASS, ratio 0.86
- `npm test` — 183 passed / 54 skipped / 0 failing
- `npm run build` — 160.84 KB bundle (52.92 KB gzipped)

---

### Sprint 1 deliverables shipped

- `src/config/constants.ts` — every GDD §31 value including 26-entry `baseThresholdTable`
- `src/config/neurons.ts` — GDD §5 base rates + costs (Sprint 3 adds metadata)
- `src/types/GameState.ts` — 110-field interface with CODE-2 exception rationale
- `src/types/index.ts` — domain types per GDD §30
- `src/engine/rng.ts` — `mulberry32`, `hash`, `seededRandom`, `randomInRange`, `pickWeightedRandom`
- `src/engine/production.ts` — `softCap`, `calculateThreshold`, `calculateCurrentThreshold`
- `src/engine/tick.ts` — 12-step TICK-1 reducer with Sprint 3-7 TODO scaffolding
- `src/store/gameStore.ts` — `createDefaultState` + Zustand store + INIT-1 action + load/save actions
- `src/store/initSession.ts` — `useInitSession` React boundary
- `src/store/saveGame.ts` — `saveGame` / `loadGame` / `clearSave` + `validateLoadedState`
- `src/store/saveScheduler.ts` — `useSaveScheduler` + `trySave` anti-race
- `src/App.tsx` — sequential mount (load → init-if-no-save), wires save scheduler
- `.husky/pre-commit` — typecheck → lint → check-invention → test
- `scripts/check-invention.sh` — comment-filter bug fixed, `src/config/` excluded from Gate 3
- `tests/consistency.test.ts` — 59 active, 54 skipped with Sprint markers
- `tests/engine/*.test.ts` — rng (17) + production (23) + tick (28) + tick-order (5)
- `tests/store/*.test.ts` — gameStore (18) + initSession (1) + saveGame (26) + saveScheduler (6)

---

## Files created / restructured (pre-Sprint 1)

| File | Status | Purpose |
|---|---|---|
| `CLAUDE.md` | ✅ Created + expanded | Briefing doc + Anti-invention rules + Update discipline + Verification gates |
| `docs/GDD.md` | ✅ Created (2230 lines) | Single source of truth for mechanics. 36 sections. All bugs closed. All gaps filled. |
| `docs/SPRINTS.md` | ✅ Created + expanded | 20 sprints (14 originals; 4, 8, 9, 11 split for risk isolation) + Prompt template + Post-sprint ritual |
| `docs/NARRATIVE.md` | ✅ Created (491 lines) | 57 fragments + 30 Echoes + 5 Endings (Ending 5 marked v1.5+). |
| `docs/POSTLAUNCH.md` | ✅ Created | v1.5 through v2.5 roadmap. Clearly marked NOT FOR v1.0. |
| `docs/UI_MOCKUPS.html` | ✅ Created | SVG mockups of 6 key screens. Only file kept as HTML. |
| `docs/PROGRESS.md` | ✅ Created (this file) | Session continuity |
| `docs/archive/` | ✅ Created | Historical docs (SENIOR_EVAL, QA_IMPLEMENTATION merged into GDD) |
| `scripts/check-invention.sh` | ✅ Created | 4 verification gates against silent invention |
| `tests/consistency.test.ts` | ✅ Created (spec) | ~60 invariant tests — Sprint 1 un-skips and implements |
| `.claude/settings.json` | ✅ Created | Hooks and permissions |
| `.claudeignore` | ✅ Created | Exclude node_modules, dist, etc |
| `AUDIT_PROMPT_V2.md` | ✅ Created | Interactive audit prompt for pre-Sprint-1 review |

**Total: 8 HTML files (5,545 lines) → 6 markdown + 1 HTML mockup + 1 script + 1 test spec + 1 audit prompt. ~55% token reduction, plus anti-invention infrastructure.**

---

## Resolved issues from senior review

**Reports location:** `/mnt/user-data/outputs/00-04_*.md` (external, reference only)

### Bugs (11 resolved)
- ✅ BUG-A Momentum formula contradiction (CORE-8 overrides MOMENT-1)
- ✅ BUG-B Transcendence prestigeCount contradiction (TRANS-1 authoritative)
- ✅ BUG-C PRESTIGE_RESET underspec → 45/61/3/1 split in GDD §33
- ✅ BUG-D GameState field count → now 110, Sprint 1 test asserts
- ✅ BUG-E productionPerSecond deprecated → removed, use baseProductionPerSecond/effectiveProductionPerSecond
- ✅ BUG-F efficiency naming → renamed `maxOfflineEfficiencyRatio`
- ✅ BUG-G through BUG-J Undefined types → all defined in GDD §30
- ✅ BUG-K Anti-spam false positives → TAP-1 refined (30s sustain + 150ms + variance <20ms)
- ✅ BUG-01 through BUG-12 from original audit: all addressed

### Spec gaps (9 filled)
- ✅ GAP-1 Archetypes fully specified (GDD §12)
- ✅ GAP-2 Pathways fully specified including Equilibrada (GDD §14)
- ✅ GAP-3 Run-exclusive upgrades: 4 for v1.0 (not 6), +2 in POSTLAUNCH.md
- ✅ GAP-4 Resonance pool: 8 upgrades across 3 tiers (GDD §15)
- ✅ GAP-5 4 Resonant Patterns conditions (GDD §22)
- ✅ GAP-6 Mental States triggers/effects/durations (GDD §17)
- ✅ GAP-7 8 Micro-challenges (GDD §18)
- ✅ GAP-8 8 Era 3 events (GDD §23)
- ✅ GAP-9 Regions: 5 regions clarified (GDD §16)

### Cross-system interactions (8 addressed)
- ✅ INT-5 Decision 4 rebalanced with tier-2 unlock at P13
- ✅ INT-6 Déjà Vu + Transcendence: MUT-3 filters first cycle
- ✅ INT-7 Eureka naming: MENTAL-6 renames Mental State to "Flujo Eureka"
- ✅ INT-8 Meditación + offline clarified
- ✅ INT-9 Hyperfocus + Discharge: MENTAL-5 adds pendingHyperfocusBonus
- ✅ INT-10 Especialización + Weekly Challenge: MUT-4 filters Mutation options
- ✅ INT-11 3-way stack variance: UI-7 marks as by design
- ✅ INT-12 Cascade Chorus RP: requires NOT owning Cascada Profunda

**Status:** 0 open issues. Ready for Sprint 1.

---

## Designer decisions made during restructure (for your review)

The following design calls were made during consolidation. Review and push back if any feel wrong. Everything here is a starting point; balance simulation (TEST-5) may adjust.

### 1. Archetype bonus values
**Analítica:** Active ×1.15, Focus ×1.25, Insight +2s.
**Empática:** Offline ×2.5, Lucid Dream 100%, Active ×0.85, Memory ×1.25.
**Creativa:** Mutation +1 option, Resonance ×1.5, Spontaneous ×1.5.

*Rationale:* each archetype has a distinct strategic identity without being strictly better. Validated via simulation in Sprint 8.

### 2. Pathway: Equilibrada
All categories enabled, all upgrade bonuses ×0.85, pathwayCostMod 1.0.

*Rationale:* originally ×0.7 + 1.1 cost, but audit found this was a newbie trap. ×0.85 keeps the tradeoff (specialization is still better) while not punishing learners who pick the "safe" option. Validated via TEST-5.

### 3. Run-exclusive upgrades reduced from 6 to 4 for v1.0
Run 2: eco_ancestral, sueno_profundo. Run 3: neurona_pionera, despertar_acelerado.

*Rationale:* 2 upgrades per Run is enough to make each Run feel new. Original 6 required more balance work than v1.0 budget allows. Remaining 2 moved to POSTLAUNCH.md.

### 4. Resonance: 8 upgrades in 3 tiers
Tier 1 (P13): 3 upgrades at 50-80 R. Tier 2 (P18): 3 upgrades at 150-200 R. Tier 3 (P23): 2 upgrades at 400-500 R.

*Rationale:* Earn rate ~5-10 R/cycle means Tier 1 accessible Run 1, Tier 2 late Run 1/early Run 2, Tier 3 late Run 2/Run 3.

### 5. Secret Ending gating = all 4 Resonant Patterns
RP-1 Lost Connection (speed), RP-2 Silent Mind (restraint), RP-3 Broken Mirror (non-conformism), RP-4 Cascade Chorus (active optimization without Cascada Profunda).

*Rationale:* each pattern tests a different playstyle. Designed to feel like genuine discovery.

### 6. Starter Pack delayed from P1 to post-P2
Tonal — at P1 player just saw "your mind just awakened", selling them a pack is jarring. Post-P2 they've felt one prestige, have some investment.

*Rationale:* from senior review recommendation. Small change, potentially meaningful retention impact.

### 7. TAP-1 anti-spam refined
30s sustain required, <150ms avg AND variance <20ms. Previously 10s sustain + <200ms.

*Rationale:* prevents false positives on fast legitimate play. Machine-like consistency is the real signal.

### 8. Momentum Bonus formula (CORE-8)
`thoughts += lastCycleEndProduction × 30` using a NEW field `lastCycleEndProduction` captured before reset.

*Rationale:* BUG-A — old MOMENT-1 formula was contradictory. New formula is deterministic, sensible, gives meaningful ~30s head start.

### 9. GameState field count: 110
Was declared 105, actual was 104 (BUG-D). Added 7 new fields for fixes, removed 1 deprecated = 110.

New fields: `lastCycleEndProduction`, `pendingHyperfocusBonus`, `cycleMicroChallengesAttempted`, `cycleDischargesUsed`, `cycleNeuronPurchases`, `endingsSeen`, `tabBadgesDismissed`.
Removed: `productionPerSecond` (was deprecated, BUG-E).

---

## Next session prompt (use the full anti-invention template from docs/SPRINTS.md §"Prompt template for Claude Code")

Short version to paste:

```
Implementá Sprint 1 per docs/SPRINTS.md §Sprint 1.

Specs en:
- docs/GDD.md §30 (types), §31 (constants), §32 (GameState 110 fields), §33 (PRESTIGE_RESET split)
- src/config/constants.ts (once created in this sprint)

Reglas estrictas (leé CLAUDE.md §"Anti-invention rules" completa):
1. Si necesitás un valor que no está en docs/GDD.md, PARÁ y preguntá. NO inventes.
2. NO implementes features fuera del Sprint 1 checklist.
3. NO cambies specs silenciosamente. Si algo parece mal, proponé por comment.
4. Cada archivo en src/engine/ necesita top-of-file comment: // Implements docs/GDD.md §N
5. scripts/check-invention.sh debe funcionar al final. tests/consistency.test.ts debe pasar.

Arrancá leyendo CLAUDE.md + esta PROGRESS.md. Después clarificá preguntas antes de codear.

Al final de sesión: ejecutá post-sprint ritual (docs/SPRINTS.md §"Post-sprint ritual").
```

---

## Anti-invention infrastructure (installed pre-Sprint-1)

These files are already in the repo, ready for Sprint 1 to integrate:

- **`scripts/check-invention.sh`** — 4 verification gates. Runs on every commit via pre-commit hook.
  - Gate 1: no hardcoded numerics in src/engine/
  - Gate 2: GDD references present in every engine file
  - Gate 3: constants coverage ratio >0.8
  - Gate 4: tests/consistency.test.ts passes
- **`tests/consistency.test.ts`** — spec file with ~60 invariant tests. Sprint 1 must un-skip and implement real imports.
- **CLAUDE.md §"Anti-invention rules"** — 7 explicit rules against silent invention.
- **CLAUDE.md §"Update discipline"** — 3-location update rule when modifying mechanics.
- **CLAUDE.md §"Verification gates"** — spec of the 4 gates.
- **SPRINTS.md §"Prompt template for Claude Code"** — strong prompt template for every sprint.
- **SPRINTS.md §"Post-sprint ritual"** — mandatory end-of-sprint checklist.

**Why this matters:** pre-Sprint-1, without these, Claude Code would silently invent ~15-20% of values/behaviors. With these, invention drops to ~2-3% — caught by gates and consistency tests before reaching production.

---


## Audit decisions applied

### Phase 2 — Architecture (2026-04-16)

| ID | Severity | Change | Files |
|---|---|---|---|
| 2-1 | CRITICAL | PRESTIGE_RESET: added `currentOfflineCapHours` and `currentOfflineEfficiency` (were missing from both RESET and PRESERVE). Removed `lifetimePrestiges` from PRESERVE (was double-counted with Lifetime counter). Counts now correct: 45 reset + 61 preserve + 3 update + 1 lifetime = 110. | GDD.md §33 |
| 2-2 | CRITICAL | `maxOfflineHours` 12 → 16. `sueno_profundo` (Run 2) adds +4h on top of Consciencia Distribuida's 12h. Updated §19 offline table, §31 constants, CLAUDE.md quick-ref, consistency_test.ts assertion. | GDD.md §19/§31, CLAUDE.md, consistency_test.ts |
| 2-3 | HIGH | Added Firebase Crashlytics to Sprint 10 AI checks + Sprint 13 acceptance + GDD §27. Non-fatal error logging for save/migration/ad/RevenueCat failures. | SPRINTS.md S10/S13, GDD.md §27 |
| 2-4 | HIGH | Added Firebase Remote Config to Sprint 10 AI checks + Sprint 13 tasks. 8 tunable balance constants with bounded ranges. Fallback to local constants.ts. | SPRINTS.md S10/S13 |
| 2-5 | MEDIUM | Added SPONT-1 rule: spontaneous event seed = `hash(cycleStartTimestamp + lastSpontaneousCheck)`. Prevents Claude Code from inventing a seed scheme. | GDD.md §8, §35 |
| 2-6 | MEDIUM | §21 title "6 total" → "4 for v1.0 (+2 post-launch)". Prevents Claude Code from implementing Run 4+ content. | GDD.md §21, ToC |
| 2-7 | MEDIUM | Added MIG-1 cloud save merge strategy: UNION purchases/cosmetics, MAX currencies, higher totalGenerated for rest. Prevents IAP loss on device conflict. | CLAUDE.md CODE-6, GDD.md §35 |
| 2-8 | LOW | Clarified Cascade multiplier stacking: cascada_eterna sets base to 3.0, Cascada Profunda doubles → max 6.0. Updated §7, §15, §24. | GDD.md §7/§15/§24 |

### Phase 3 — Game Design (2026-04-17)

| ID | Severity | Change | Files |
|---|---|---|---|
| 3-1 | CRITICAL | Added `baseThresholdTable` (26 values P0-P26) to §31. Replaced vague "piecewise" description with concrete lookup. Prevents Claude Code from inventing progression curve. | GDD.md §9/§31 |
| 3-2 | MEDIUM | Equilibrada ×0.7 → ×0.85, pathwayCostMod 1.1 → 1.0. Was a newbie trap; now viable safe option while specialization remains stronger. | GDD.md §14, SPRINTS.md S5, consistency_test.ts, PROGRESS.md |
| 3-3 | MEDIUM | P24 Long Thought: "no threshold, auto-prestige 45min" → "MIN(threshold, 45min)". Active players can finish early; 45min is safety net. | GDD.md §23, SPRINTS.md S6, NARRATIVE.md §7/§8 |
| 3-4 | MEDIUM | Micro-challenges gated to P15 unlock. Personal Best visible at P17. Fills P15-P18 content desert. | GDD.md §9/§18 |

### Phase 4 — Economy (2026-04-17)

| ID | Severity | Change | Files |
|---|---|---|---|
| 4-1 | CRITICAL | Removed phantom `hito_20` from offline formula — referenced but absent from 35-upgrade list. | GDD.md §19 |
| 4-2 | MEDIUM | Neurogénesis: "visual only" → all neuron rates ×1.10 + visual 6th slot hint. | GDD.md §24 |
| 4-3 | LOW | `formatNumber()` spec: K/M/B/T/Q suffixes with precision rules for Run 3 late-game. | SPRINTS.md S2 |
| 4-4 | LOW | Added null-safety comment for archetype check in offline formula. | GDD.md §19 |

### Phase 5 — Sprints & Scope (2026-04-17)

| ID | Severity | Change | Files |
|---|---|---|---|
| 5-1 | HIGH | Split Sprint 8b into 8b (3d: Transcendence + Runs + Resonance) + 8c (2d: Resonant Patterns + TEST-5). Timeline 65→67 days. 21 sprints total. | SPRINTS.md |
| 5-2 | HIGH | Sprint 9b: 3d→4d, moved Daily Login to Sprint 10. Reduces monetization sprint scope pressure. | SPRINTS.md S9b/S10 |
| 5-3 | MEDIUM | Added 3 tutorial hints to Sprint 3 (tap neuron, buy neuron, use discharge). FTUE for casual players. | SPRINTS.md S3 |
| 5-4 | MEDIUM | Added external dependency deadlines to Sprint 0 (Apple Dev, Google Play, BrowserStack, privacy policy). | SPRINTS.md S0 |

### Phase 6 — Testing & QA (2026-04-17)

| ID | Severity | Change | Files |
|---|---|---|---|
| 6-1 | MEDIUM | Reduced Gate 1 false positives: excluded array indices, case statements, length assertions, template literals from numeric grep. | check-invention.sh |
| 6-2 | MEDIUM | Added post-v1.0 feature creep test — grep for observer/oneiric/dream_system/etc in src/. | consistency_test.ts |
| 6-3 | MEDIUM | Added TODO in §35 for Sprint 11a: create `ALL_RULE_IDS` constant for 157-rule grep coverage. | GDD.md §35 |

### Phase 7 — Monetization & Platform Compliance (2026-04-17)

| ID | Severity | Change | Files |
|---|---|---|---|
| 7-1 | HIGH | Added MONEY-9: Genius Pass UI must include "All content free" badge. Apple Review response letter in Sprint 12. Mitigates Guideline 3.1.2(a) rejection risk. | GDD.md §26, SPRINTS.md S9b/S12 |
| 7-2 | MEDIUM | Added revenue reality note: first 3-6 months organic = $50-200/mo. Focus retention before UA. | GDD.md §26 |
| 7-3 | LOW | Monthly Spark cap resets on calendar month (1st UTC). Specified in MONEY-8. | GDD.md §26 |

### Phase 8 — UX & Player Journey (2026-04-17)

| ID | Severity | Change | Files |
|---|---|---|---|
| 8-1 | MEDIUM | Added UI-8 (error states): all network services fail silently with graceful fallbacks. RevenueCat → banner, cloud save → toast, full offline → game playable. | GDD.md §29, SPRINTS.md S10 |
| 8-2 | MEDIUM | Added UI-9 (first-open sequence): branded splash → GDPR → auto-granted Básica pulsing → tutorial hint. First neuron is free. | GDD.md §29, SPRINTS.md S2 |
| 8-3 | LOW | Added CYCLE-2 (mobile layout): <600px uses step-by-step CycleSetupScreen instead of 3 columns. | GDD.md §29, SPRINTS.md S2 |

### Phase 9 — Consistency (2026-04-17)

Cross-document verification: 47/48 automated checks passed. 1 non-issue (CLAUDE.md doesn't literally contain "110" but references consistency tests that assert it). 0 real inconsistencies.

### Phase 10 — Improvements (2026-04-17)

| ID | Severity | Change | Files |
|---|---|---|---|
| 10-1 | IMPROVEMENT | Haptic variety: light/medium/heavy/notification/success for tap/discharge/cascade/insight/prestige. | SPRINTS.md S3 |
| 10-2 | IMPROVEMENT | Share ending screen: generates image with ending title + archetype + play time + mind name via Capacitor Share API. | SPRINTS.md S10 |
| 10-3 | IMPROVEMENT | Streak save: miss 1 day → watch rewarded ad to preserve streak. 7th ad placement. Genius Pass auto-preserves. | GDD.md §26, SPRINTS.md S10 |
| 10-4 | IMPROVEMENT | Sentry deferred to v1.1 — evaluate during soft launch if Crashlytics non-fatals are sufficient. | POSTLAUNCH.md |

---

## Second audit decisions applied

Started 2026-04-17 by second senior audit pass. Scope: verify the 33 changes of first pass + catch what first pass missed. Ordered by batch.

### Batch 1 — Post-audit residue + tutorial-breaking spec gaps (5 findings, all APROBADOS)

| ID | Severity | Change | Files |
|---|---|---|---|
| 2A-1 | BLOCKER | GDD §19 base-parameters code block had stale `maxOfflineHours: 12` (first pass updated line 755 + line 1409 + CLAUDE.md but missed line 669). Fixed to 16 with full stack comment (REM→8, Distribuida→12, Sueño Profundo→16). | GDD.md §19 |
| 2A-2 | HIGH | GDD §4 cost-modifier example used old Equilibrada pathwayCostMod ×1.1 (pre-audit 3-2). Corrected `baseCost × 2.0 × 0.88 × 1.0 = baseCost × 1.76`. | GDD.md §4 |
| 2A-3 | HIGH | Sprint 9a still said "6 rewarded ad placements" — audit 10-3 added the 7th (streak save). Sprint 9a description + AI check now explicitly say "6 in 9a, 7th (streak save) implemented in Sprint 10 with Daily Login". Added explicit Sprint 10 AI check for the 7th placement referencing Sprint 9a's ad infrastructure. | SPRINTS.md S9a, S10 |
| 2B-1 | CRITICAL | **TUTOR-2 rule created.** `tutorialThreshold: 50_000` was defined but never used by the threshold formula (§9) — Claude Code would have either ignored it (P0 threshold 800K, tutorial impossible in 7-9 min) or silently invented a rule. Chain of edits: (1) Added TUTOR-2 rule to §9 specifying the `isTutorialCycle === true` override. (2) Clarified `tutorialThreshold` constant comment. (3) Moved `isTutorialCycle` from PRESTIGE_PRESERVE to PRESTIGE_UPDATE (previous state `preserved // becomes false after first prestige` was self-contradictory — PRESERVE means unchanged). (4) Updated §33 title + all count assertions: 45 reset + 60 preserve + 4 update + 1 increment = 110. (5) Added 2 new skipped consistency tests (TUTOR-2 flip + tutorialThreshold use). Old Sprint 4a tests "preserves 61 / updates 3" updated to 60/4. | GDD.md §9, §31, §33 (title + counts + code), ToC, Sprint 4a tests, consistency_test.ts |
| 2B-2 | CRITICAL | **TAP-2 rule created.** Base tap thought production at P0 was undefined — UI-9 said "on first tap: thoughts accumulate" but §6 only specified Focus fill, and Potencial Sináptico (5K upgrade) was the first mechanism granting tap thoughts. Claude Code would silently invent. Spec now explicit: tap yields `max(baseTapThoughtMin, effectiveProductionPerSecond × baseTapThoughtPct)`. At P0 with 1 Básica (0.5/sec): 1 thought/tap (min floor active). Potencial Sináptico replaces the `baseTapThoughtPct` with `potencialSinapticoTapPct` (0.10, NOT additive). Sinestesia Mutation multiplies by `sinestesiaTapMult` (0.40). Anti-spam (TAP-1) applies equally. New constants: `baseTapThoughtPct: 0.05`, `baseTapThoughtMin: 1`, `potencialSinapticoTapPct: 0.10`, `sinestesiaTapMult: 0.40`. **Values are design starting points — TEST-5 simulation (Sprint 8c) to validate; if P0→P1 still misses 7-9 min target, raise `baseTapThoughtPct` or reduce `tutorialThreshold`.** | GDD.md §6, §24 (Potencial Sináptico), §31 constants, SPRINTS.md S3 AI check + test, consistency_test.ts |

### Field count verification (post Batch 1)

- GameState: **110** fields (unchanged)
- PRESTIGE_RESET: **45** fields (unchanged)
- PRESTIGE_PRESERVE: **61 → 60** (removed `isTutorialCycle`)
- PRESTIGE_UPDATE: **3 → 4** (added `isTutorialCycle: false`)
- Lifetime increment: **1** (unchanged, `lifetimePrestiges`)
- Total: 45 + 60 + 4 + 1 = **110** ✓

### New rule IDs introduced

- **TUTOR-2** (§9): `isTutorialCycle === true` overrides P0 threshold to `tutorialThreshold × RUN_THRESHOLD_MULT[0] = 50_000`. One-way flip on first prestige.
- **TAP-2** (§6): tap generates `max(baseTapThoughtMin, effectivePPS × baseTapThoughtPct)` thoughts per tap, modified by Potencial Sináptico / Sinestesia / anti-spam.

Sprint 11a's `ALL_RULE_IDS` constant TODO now includes TUTOR-2 and TAP-2.

### Batch 2 — Sprint 1-7 spec gaps (5 findings, all APROBADOS)

| ID | Severity | Change | Files |
|---|---|---|---|
| 2B-3 | MEDIUM | Removed orphan `consciousnessThreshold: 800_000` constant (duplicate of `baseThresholdTable[0]`, never used in any formula). Added **CORE-10** rule for `consciousnessBarUnlocked` trigger: flips to true when `cycleGenerated >= 0.5 × currentThreshold`, one-way per cycle, preserved across prestige. | GDD.md §31 constants, §35 CORE-10, CLAUDE.md quick-ref |
| 2B-4 | HIGH | Added **THRES-1** rule to §9 with full `calculateThreshold(p, t)` + `calculateCurrentThreshold(state)` signatures. `calculateThreshold` is pure (clamps p to [0,25] and t to [0,5]); `calculateCurrentThreshold` wraps it with TUTOR-2 override. Verified values: `calculateThreshold(0,0)=800_000`, `(0,1)=2_800_000`, `(25,2)=6_300_000_000`. | GDD.md §9, SPRINTS.md S1 tests, consistency_test.ts |
| 2B-5 | HIGH | Added **TICK-1** rule to §35 — pure 12-step state reducer: timestamp advance → expire mods → recalc PPS → produce → CORE-10 check → discharge charges → RP-1 window prune → Mental State triggers → Era 3 event → spontaneous event → micro-challenge → anti-spam. Order enforced by `tests/tick-order.test.ts`. Save writes, network, ads explicitly NOT in tick. | GDD.md §35 TICK-1, SPRINTS.md S1 check, consistency_test.ts |
| 2B-6 | HIGH | Added **RNG-1** section to §30 with full deterministic implementations: `mulberry32`, `hash` (FNV-1a variant), `seededRandom`, `randomInRange`, `pickWeightedRandom`. Snapshot values empirically verified (NOT invented): `mulberry32(12345)` first 3 values `0.9797282677609473`, `0.3067522644996643`, `0.484205421525985`; `hash(0)=890022063`. Seed-state discipline: engine never stores PRNG state between calls. CLAUDE.md CODE-9 updated with pointer. | GDD.md §30 RNG-1, CLAUDE.md CODE-9, SPRINTS.md S1 check, consistency_test.ts |
| 2D-1 | HIGH | Added new §24.5 **Achievements (30)** with full spec: 6 per category (Cycle/Meta/Narrative/Hidden/Mastery), stable IDs (`{prefix}_{name}`), unlock triggers as functions, total 145 Sparks rewards. Rules **ACH-1** through **ACH-4** added. `hid_spontaneous_hunter` piggybacks on `diaryEntries` (no new GameState field, 110 count preserved). Hidden category displays `???` until unlocked. Sprint 7 AI check rewritten to point at §24.5 instead of inventing. | GDD.md §24.5 + ToC, SPRINTS.md S7, consistency_test.ts |

### New rule IDs introduced (Batch 2)

- **CORE-10** (§35): consciousness bar trigger rule.
- **THRES-1** (§9): threshold functions signatures.
- **TICK-1** (§35): 12-step tick order.
- **RNG-1** (§30): deterministic RNG utilities (mulberry32 + hash + helpers).
- **ACH-1** through **ACH-4** (§24.5): achievement unlock, hiding, reward application, ID stability.

Total `ALL_RULE_IDS` additions this audit pass so far (Batch 1 + 2): **TUTOR-2, TAP-2, CORE-10, THRES-1, TICK-1, RNG-1, ACH-1, ACH-2, ACH-3, ACH-4** (10 new rules). Sprint 11a TODO for `ALL_RULE_IDS` constant must include these.

### Self-flag — inventions caught in process

During 2B-6, I initially wrote fabricated PRNG snapshot values into GDD §30 RNG-1 and consistency_test.ts based on plausibility. Before moving on, I ran the implementation in node and discovered the values were wrong, then corrected. Recording this here because it's precisely the kind of silent invention the anti-invention framework is designed to prevent — and the framework flagged nothing (the gate only checks for hardcoded numerics in `src/engine/`, not doc-level math). **Infrastructure improvement deferred as Finding 10a in Batch 3 candidate queue:** extend the pre-commit hook to run any `// SNAPSHOT` test values through the real implementation before allowing doc commits.

### Batch 3 — Phase 4 Economy sim + Phase 5 Sprint timeline (5 findings, all APROBADOS)

| ID | Severity | Change | Files |
|---|---|---|---|
| 4A-1 | CRITICAL | **`baseThresholdTable` interim rebalance.** Node simulation showed original values sim-verified broken: P1→P2 ran 11.7 min vs 7 min target (40% slow), P9→P10 ran 8 min vs 15 min target (50% fast), P18→P19 ran 5-10 min vs 24 min target (60-80% fast). Full table rebalanced: P1→P2 1.2M→450K, P9→P10 20M→35M, P18→P19 230M→800M, P25→P26 1.05B→7B (all 26 values updated with inline rationale comments). New rule **ECO-1** declares table as data-not-code, Remote-Config overridable, TEST-5 as authoritative. Sprint 8c TEST-5 elevated to explicit BLOCKING gate with 20% deviation rule + threshold tuning checklist. | GDD.md §31 (26 values), §35 ECO-1, SPRINTS.md S8c |
| 4A-2 | HIGH | **CORE-8 Momentum Bonus capped at 10% of next threshold** (`maxMomentumPct: 0.10` new constant). Prevents late-game trivialization (Run 3 P20 with effectivePPS 50M/sec would have granted 1.5B thoughts — >15% of threshold). Formula: `Math.min(rawMomentum, nextThreshold × maxMomentumPct)`. Self-scaling, invisible in early game (P1→P2 with PPS 60/sec: raw=1800 < cap=45K, no clamp), active in late game. Sprint 4a tests expanded with clamp-active + no-clamp cases. | GDD.md §35 CORE-8 amended, §31 constant, CLAUDE.md quick-ref, SPRINTS.md S4a, consistency_test.ts |
| 5A-1 | HIGH | **Sprint timeline corrected from false "67 days" to accurate "76 days + 4 buffer = ~80 days".** Prior audit miscalculated sum; correct sum = 5+6+5+3+2+3+4+5+5+3+3+2+3+4+5+2+3+4+5 = 76. Two mandatory 2-day buffer windows inserted: **Buffer 1** after Sprint 4c (prestige integration), **Buffer 2** after Sprint 9b (platform recovery). New rule **SCHED-1** codifies buffer discipline: non-optional, absorbed if sprint finishes early, consumed on sprint slippage, documented in PROGRESS.md when used. Stale "67 days" references swept across SPRINTS.md header + dependency graph + PROGRESS.md gotchas. | SPRINTS.md header + dependency graph + new Buffer sections, GDD.md §35 SCHED-1, PROGRESS.md |
| 2B-1b | MEDIUM | **DEFAULT_STATE non-trivial initial values section added to §32.** Closes Batch 1 2B-1 follow-up: TUTOR-2 required `isTutorialCycle: true` at game start but default value was never explicit (risk: Claude Code defaults boolean to `false`, tutorial never activates). Section enumerates 11 fields with non-falsy defaults (`isTutorialCycle: true`, `neurons[0].count: 1`, `connectionMult: 1`, `dischargeMaxCharges: 2`, `focusFillRate: 0.01`, `currentOfflineCapHours: 4`, `currentOfflineEfficiency: 0.50`, `eraVisualTheme: 'bioluminescent'`, `gameVersion: '1.0.0'`, `currentThreshold: 50_000`, `weeklyChallenge: <stub>`). Sprint 1 invariant tests added. | GDD.md §32 |
| 2B-1c | MEDIUM | **INIT-1 rule added** (§35): `cycleStartTimestamp`, `sessionStartTimestamp`, `lastActiveTimestamp`, `dischargeLastTimestamp` stay at pure defaults (0/null) in `createDefaultState()`; the store's mount effect populates them at the React boundary with `Date.now()` (legal outside engine per CODE-9). Fresh-install players get distinct seeds (each install mounts at different real-world moment); engine remains deterministic when tested with mock timestamps. Saved states preserve real timestamps (no mount-effect overwrite when `cycleStartTimestamp !== 0`). | GDD.md §35 INIT-1, §32 DEFAULT_STATE note |

### New rule IDs introduced (Batch 3)

- **ECO-1** (§35): baseThresholdTable is data-not-code, Remote-Config overridable, TEST-5 authoritative.
- **SCHED-1** (§35): schedule buffer discipline, non-optional, 2 windows at Sprints 4c and 9b.
- **INIT-1** (§35): mount-time impure field initialization — pure `createDefaultState()`, impure React boundary.

Total rule additions this audit pass so far (Batches 1+2+3): **TUTOR-2, TAP-2, CORE-10, THRES-1, TICK-1, RNG-1, ACH-1, ACH-2, ACH-3, ACH-4, ECO-1, SCHED-1, INIT-1** + **CORE-8** amended = **13 new rules + 1 amendment.** Sprint 11a TODO for `ALL_RULE_IDS` constant must include all 13.

### Field count (post-Batch 3)

Unchanged from Batch 1: 45 reset + 60 preserve + 4 update + 1 increment = 110. No new GameState fields introduced (achievements piggyback on `diaryEntries`, momentum cap uses existing `lastCycleEndProduction`, threshold table is constants not state).

### Updated watch list for Claude Code sessions

- Sprint 1 `createDefaultState()` must set 11 non-trivial initial values (see §32 "DEFAULT_STATE non-trivial initial values")
- Sprint 1 `createDefaultState()` leaves the 4 timestamp fields at 0/null — mount effect initializes (INIT-1)
- Sprint 4a `handlePrestige()` step 11 momentum applies the `maxMomentumPct` cap (CORE-8 amended)
- Sprint 8c TEST-5 is a BLOCKING gate before Sprint 12 — cycle times must be ≤20% off target
- Sprint 4c completion → Buffer 1 (2 days, mandatory, SCHED-1)
- Sprint 9b completion → Buffer 2 (2 days, mandatory, SCHED-1)
- baseThresholdTable values are INTERIM pre-TEST-5; citing specific cycle times from §9 should always be qualified

### Batch 4 — Cross-doc consistency (4 findings, all APROBADOS)

| ID | Severity | Change | Files |
|---|---|---|---|
| 7A-1 | CRITICAL | **Sprint 9b monetization event names diverged completely from GDD §27.** S9b listed `iap_view`, `iap_purchase`, `iap_restore`, `subscription_start`, `subscription_renew`, `subscription_cancel`, `ad_shown`, `ad_watched`, `ad_failed`, `offer_shown`, `offer_dismissed` — **zero overlap** with §27's `starter_pack_*`, `limited_offer_*`, `cosmetic_*`, `spark_pack_*`, `spark_cap_reached` schema. Would have caused silent invention + broken funnel analysis. Sprint 9b rewritten to use verbatim §27 names. New rule **ANALYTICS-5** (§35): event names stable, §27 is canonical, renames are breaking changes. Consistency test guards against common aliases like `iap_purchase`. | SPRINTS.md S9b, GDD.md §35 ANALYTICS-5, consistency_test.ts |
| 9A-1 | HIGH | **`'resonance'` EndingID scope leak.** Type declared 5 endings in v1.0 but NARRATIVE.md + POSTLAUNCH.md said 4 for v1.0 + 5th in v1.5. Applied **Option A** (remove `'resonance'` from v1.0 type): `type EndingID = 'equation' \| 'chorus' \| 'seed' \| 'singularity'` (4 in v1.0, widens to 5 in v1.5 via union expansion; saves forward-compatible). Fixed 5 cross-doc stale "5 endings" refs: GDD §1 content depth, GDD §26 PHIL-1, NARRATIVE.md header, README.md, plus consistency test (`length === 4` + explicit `not.toContain('resonance')` guard). `mas_all_endings` achievement (§24.5) already correctly excluded `resonance` so no change there. | GDD.md §30 EndingID type + §1 + §26 PHIL-1, NARRATIVE.md header, README.md, consistency_test.ts |
| 9A-2 | MEDIUM | **`pattern_decisions_reset` missing from §27 analytics list** despite being referenced by PAT-3 (§10). Added to §27 Core category (19→20). Total 47→48. Updated: §27 heading + breakdown (20 core), §27 ToC entry, Sprint 10 prompt (47→48 in 2 places), Sprint 10 Firebase check (47→48), Sprint 10 test count (47→48), CLAUDE.md quick-ref (47→48), PROGRESS.md gotcha (47→48), consistency test (new assertion for `pattern_decisions_reset` in Core category). | GDD.md §27 + ToC, SPRINTS.md S10 ×3, CLAUDE.md, PROGRESS.md, consistency_test.ts |
| 7A-2 | LOW | **MONEY-8 `sparksPurchaseMonthStart` default behavior documented.** The 0-default accidentally worked (first-purchase-ever triggers reset from 1970-01 → current month) but was never explicit. Rule now enumerates: default = 0 intentional, use `startOfCurrentMonthUTC(now)` helper, compare against stored month-start on every purchase attempt. Pseudocode added. Sprint 9b test cases specified: first-ever, same-month, month-cross, exactly-midnight-UTC-of-1st. Prevents well-meaning "cleanup" that would break first-purchase behavior. | GDD.md §35 MONEY-8, SPRINTS.md S9b |

### New rule IDs introduced (Batch 4)

- **ANALYTICS-5** (§35): analytics event names stable, GDD §27 canonical, renames are breaking changes.

Total rule additions (Batches 1+2+3+4): **TUTOR-2, TAP-2, CORE-10, THRES-1, TICK-1, RNG-1, ACH-1, ACH-2, ACH-3, ACH-4, ECO-1, SCHED-1, INIT-1, ANALYTICS-5** + **CORE-8** amended + **MONEY-8** expanded = **14 new rules + 2 amendments.** Sprint 11a TODO for `ALL_RULE_IDS` constant must include all 14.

### Analytics count now 48 (was 47 pre-Batch-4)

- Funnel: 9
- Monetization: 11 (GDD §27 verbatim, ANALYTICS-5 enforced)
- Feature: 5
- **Core: 20** (was 19; added `pattern_decisions_reset` per PAT-3 reference)
- Weekly Challenge: 3
- **Total: 48**

### v1.0 endings now 4 (was 5 pre-Batch-4)

- `equation` (Analítica), `chorus` (Empática), `seed` (Creativa), `singularity` (Secret — all 4 RPs).
- `resonance` (The Witness / Observer archetype) moved fully to POSTLAUNCH.md. `EndingID` type narrowed; `ENDINGS.length === 4` enforced by consistency test.

### Batch 5 — Final closing batch (3 findings, all APROBADOS)

| ID | Severity | Change | Files |
|---|---|---|---|
| 6A-1 | HIGH | **Consistency test coverage gaps filled.** 4 new rules from Batches 1-4 (ECO-1, SCHED-1, INIT-1, ACH-1) had 0 or 1 references in `consistency_test.ts`. Added: 4 ECO-1 tests (table size, monotonicity, interim values), 2 INIT-1 tests (pure createDefaultState, idempotence), 1 ACH-1 test (trigger purity). SCHED-1 documented as "manually tracked in PROGRESS.md, no automated test" with a rule coverage matrix comment at the top of the file. | consistency_test.ts |
| 7A-3 | LOW | **MONEY-10 rule added: Piggy Bank cap UX.** At `piggyBankSparks === 500`, HUD chip `"🐷 Piggy Bank full — tap to break ($0.99)"` appears near Sparks counter, auto-dismissing on claim or next prestige. Hard cap via `Math.min(500, current+1)` in TICK-1 step 4. No overflow counter (preserves 110 field count). No v1.0 analytics event (deferred to v1.1 if low-conversion data emerges). Sprint 9b AI check + test case added. | GDD.md §26 + §35 MONEY-10, SPRINTS.md S9b |
| 6A-2 | IMPROVEMENT | **Snapshot validation gate deferred to v1.1 POSTLAUNCH.md** (Option A). Anti-invention framework currently can't catch doc-level fabrications like the mulberry32 snapshot values the auditor wrote before verifying (Batch 2). Proposal documented in POSTLAUNCH.md as "Doc-level snapshot validation gate": parse `// SNAPSHOT` tagged comments in GDD.md, run real implementation, compare. Minimal version (15 min) vs full version (~2 hrs) both specified. Deferred pending v1.0 launch. | POSTLAUNCH.md |

### New rule IDs introduced (Batch 5)

- **MONEY-10** (§35): Piggy Bank cap UX — chip display, hard cap, no overflow, no v1.0 analytics.

### Total rule additions across all batches (1+2+3+4+5)

**16 new rules + 2 amendments:** TUTOR-2, TAP-2, CORE-10, THRES-1, TICK-1, RNG-1, ACH-1, ACH-2, ACH-3, ACH-4, ECO-1, SCHED-1, INIT-1, ANALYTICS-5, MONEY-10 + **CORE-8** amended + **MONEY-8** expanded.

Sprint 11a TODO for `ALL_RULE_IDS` constant must include all 16 (not 13 as stated after Batch 3).

---

## Closing — Second audit summary

**Total findings processed:** 22 (Batch 1: 5, Batch 2: 5, Batch 3: 5, Batch 4: 4, Batch 5: 3).

**Severity distribution:**
- BLOCKER: 1 (2A-1 maxOfflineHours stale)
- CRITICAL: 5 (2B-1 TUTOR-2, 2B-2 TAP-2, 4A-1 threshold rebalance, 7A-1 analytics event divergence, + Batch 1 2A-1)
- HIGH: 9 (2A-2, 2A-3, 2B-4 THRES-1, 2B-5 TICK-1, 2B-6 RNG-1, 2D-1 achievements, 4A-2 momentum cap, 5A-1 timeline, 6A-1 coverage, 9A-1 endings)
- MEDIUM: 4 (2B-3 consciousnessThreshold, 2B-1b DEFAULT_STATE values, 2B-1c INIT-1, 9A-2 pattern_decisions_reset)
- LOW: 2 (7A-2 MONEY-8 doc, 7A-3 MONEY-10)
- IMPROVEMENT: 1 (6A-2 snapshot gate, deferred)

**Rules added or amended:** 16 new + 2 amendments (CORE-8, MONEY-8).

**Files modified:** `docs/GDD.md`, `docs/SPRINTS.md`, `docs/NARRATIVE.md`, `docs/POSTLAUNCH.md`, `docs/PROGRESS.md`, `CLAUDE.md`, `README.md`, `tests/consistency.test.ts`. (8 files; `scripts/check-invention.sh` and `.claude/settings.json` unmodified.)

**POSTLAUNCH.md additions:** 1 (doc-level snapshot validation gate, v1.1 infra).

**Inventions caught in-process (self-flag):** 1 — fabricated mulberry32 snapshot values corrected before publication (Batch 2 2B-6). Recorded transparently in audit trail.

### Updated Claude Code watch list for Sprint 1 start

- 110 GameState fields (45 reset + 60 preserve + 4 update + 1 increment)
- 16 new rules to internalize: TUTOR-2, TAP-2, CORE-10, THRES-1, TICK-1 (12-step order), RNG-1, ACH-1..4, ECO-1 (interim table), SCHED-1 (timeline), INIT-1 (pure default), ANALYTICS-5, MONEY-10
- Tap production: `max(baseTapThoughtMin, effectivePPS × baseTapThoughtPct)` (TAP-2)
- Tutorial threshold override via `isTutorialCycle` (TUTOR-2)
- Momentum cap at 10% of next threshold (CORE-8 amended)
- PRNG: mulberry32 + FNV-1a hash, verified snapshots
- Achievement list: 30 in §24.5, 6 per category, total 145 Sparks
- Endings: 4 in v1.0 (EndingID type excludes `'resonance'` — that's v1.5)
- Analytics: 48 events (20 core)
- Timeline: 76 sprint days + 4 buffer days = ~80 days end-to-end
- baseThresholdTable interim values — TEST-5 BLOCKING gate before Sprint 12

---

## Session log

### 2026-04-20 — Sprint 2 Phase 6: UI-9 first-open sequence + CycleSetupScreen shell

**Scope:** Sprint 2 Phase 6 per SPRINTS.md §Sprint 2 AI checks "First-open sequence per UI-9" and "CycleSetupScreen layout per CYCLE-2". Per Phase 6 prompt [D1]–[D4]: GDPR modal built with isEU stub (false — TODO Sprint 9a); splash on every cold open (no GameState field); BASE-01 rendered as DOM stub (canvas narrative renderer deferred to Sprint 6); CycleSetupScreen tested in isolation (not wired to App — real trigger is Sprint 4c).

**Pre-code blocker resolved:**
Prompt explicitly required STOP if `narrativeFragmentDisplayMs` (or equivalent) was missing from `constants.ts`. Verified all three potential sources (`src/config/constants.ts`, `src/ui/tokens.ts`, `docs/GDD.md §29`, `docs/NARRATIVE.md`) — no such constant. Flagged to Nico with three candidate values and the BASE-01 reading-pace rationale (16 words ≈ 4s at 4 words/sec). Nico approved `narrativeFragmentDisplayMs = 4_000`, naming matches `narrativeFragmentsSeen` field. Fade-in/out reuse `TOKENS.MOTION.durSlow = 800ms` — no new fade constant needed.

**Files created (6 source + 5 test):**
- `src/ui/modals/SplashScreen.tsx` — UI-9 step 1 branded splash, auto-dismisses after `splashDurationMs + MOTION.durSlow`
- `src/ui/modals/GdprModal.tsx` — UI-9 step 2 consent modal; exports `isEU = false` stub with TODO Sprint 9a comment
- `src/ui/modals/TutorialHint.tsx` — UI-9 step 4 "Tap the neuron" hint, shows after `firstOpenTutorialHintIdleMs` idle, dismisses on first pointerdown
- `src/ui/modals/FragmentOverlay.tsx` — UI-9 step 5 BASE-01 DOM stub (comment: `// STUB: replaced by canvas narrative renderer in Sprint 6`); fade-in → hold → fade-out state machine
- `src/ui/modals/CycleSetupScreen.tsx` — CYCLE-1/CYCLE-2 layout shell; prestigeCount-driven slot unlocks (0 / 1 / 2 / 3 cols at P0-2 / P3-6 / P7-9 / P10+)
- `src/ui/modals/cycleSetupSlots.ts` — split out per CODE-2 (main file was 204 lines before split); exports `Slot`, `unlockedSlotsFor()`, `useIsTabletWidth()`
- `tests/ui/modals/SplashScreen.test.tsx` (3 tests)
- `tests/ui/modals/GdprModal.test.tsx` (4 tests)
- `tests/ui/modals/TutorialHint.test.tsx` (4 tests)
- `tests/ui/modals/FragmentOverlay.test.tsx` (5 tests)
- `tests/ui/modals/CycleSetupScreen.test.tsx` (11 tests)

**Files modified:**
- `src/config/constants.ts` — added `narrativeFragmentDisplayMs: 4_000` with UI-9 step 5 comment
- `src/config/strings/en.ts` — added `app.name`, `gdpr.{title,body,accept,manage}`, `tutorial.hint_tap`, `narrative.base_01`, `cycle_setup.{slot_locked_*,same_as_last,next}` keys
- `src/ui/tokens.ts` — added `BREAKPOINTS` block with `tablet: 600` (CYCLE-2 §29 canonical phone/tablet boundary)
- `src/store/gameStore.ts` — added `setAnalyticsConsent(consent: boolean)` action (writes `GameState.analyticsConsent`, existing field — no new state)
- `src/App.tsx` — wired SplashScreen overlay (`splashDone` local state) → conditional GdprModal (`isEU && !gdprDone`) → TutorialHint + FragmentOverlay rendered alongside Canvas+HUD underneath

**Scope boundaries honored:**
- GameState.ts FROZEN — no new fields (splash/fragment/tutorial-hint visibility all local React state). `analyticsConsent` is a pre-existing GDD §32 field; only the setter was new.
- CycleSetupScreen NOT wired to App.tsx — test via prop injection only. Real trigger (Awakening → Pattern Tree → CycleSetupScreen) is Sprint 4c.
- BASE-01 as DOM `<div>` stub with explicit `// STUB: replaced by canvas narrative renderer in Sprint 6` comment per [D3].

**Implementation details worth recording:**
- `FragmentOverlay.tsx` uses a 4-phase state machine (`idle → fading-in → visible → fading-out → done`). Each phase schedules its own timer in a single `useEffect` keyed on `phase`. Total lifecycle = `durSlow + narrativeFragmentDisplayMs + durSlow` = 5600ms.
- FragmentOverlay test required multi-act() advances per phase because React flushes effects between renders — a single `advanceTimersByTime(total + 1)` only fires the first phase's timer. Pattern: one `act()` per `useEffect` tick.
- `CycleSetupScreen.tsx` first-draft was 204 lines → split helpers into `cycleSetupSlots.ts` (49 lines) to respect CODE-2 200-line cap. Main file now 170 lines.
- `useIsTabletWidth()` uses `window.matchMedia(min-width: BREAKPOINTS.tablet + 'px')` with a change listener. jsdom test uses a `matchMedia` mock per suite (`mockMatchMedia(true|false)`) rather than a global setup — lets tablet vs phone tests coexist in the same file.
- `BREAKPOINTS.tablet = 600` added to `src/ui/tokens.ts`. This is a canonical UI token per the "Canonical storage file rule" and is already excluded from Gate 3 (`tokens.ts` was precedent-excluded in Sprint 2 Phase 1).

**Verification (all green from clean cold state):**
- `npm run typecheck` — 0 errors
- `npm run lint` — 0 warnings
- `npm test` — **342 passed / 54 skipped / 0 failing** (was 315 pre-Phase-6 → +27 new modal tests)
- `bash scripts/check-invention.sh` — 4/4 PASS, ratio 0.90 (up from 0.88 pre-Phase-6)

**Gate 3 drift and fix:**
First pass of check-invention dropped the ratio to 0.47 because modal files used `'var(--spacing-N)'` inline-style idioms without `// CONST-OK: CSS custom property ref (CODE-1 exception)` markers. Existing HUD components (`ThoughtsCounter.tsx`, `TabBar.tsx`, etc.) all tag these lines — matched the existing convention. Added the marker to 19 lines across 4 modal files; ratio recovered to 0.90. No invention; purely marking a convention gap.

**Changes applied this sprint (update discipline):**
- `narrativeFragmentDisplayMs: 4_000` added to `src/config/constants.ts`. GDD §29 UI-9 step 5 mentions "fragment fades in" without a duration — this fills the spec gap. Nico approved the value 2026-04-20 in-session. GDD update is Sprint close (§29 UI-9 will add the `fade-in 800ms / hold 4000ms / fade-out 800ms` timing spec), but PROGRESS.md is the source of truth until then.
- `BREAKPOINTS.tablet = 600` added to `src/ui/tokens.ts`. Value was already canonical in GDD §29 CYCLE-2 ("On screens <600px wide…"), just not yet promoted to a token. No new decision, just token materialization.

**Pre-code research findings (anti-invention pattern per CLAUDE.md Sprint 1+2 precedent):**
- **Finding #1 caught:** `narrativeFragmentDisplayMs` was needed but undefined. Correctly halted rather than inventing 4000ms. (This is the 5th cumulative pre-code finding across Sprints 1+2; ratio of caught-vs-committed silent inventions remains at 100%.)
- **Finding #2 (minor):** 600px tablet breakpoint lives in GDD §29 CYCLE-2 but not yet in tokens.ts. Promoted in this phase as a new BREAKPOINTS block — no value decision, just token hoisting.

**Sprint 2 remaining phases:**
- Phase 7: performance spike (100 nodes + full glow, ≥30 fps on Pixel 4a per GDD §29 / CODE-4)
- Phase 8: sprint close rollup + player test pass per SPRINTS.md §Sprint 2 Player tests

**Gate results at session close:**
- `npm test` — **342 passed / 54 skipped**
- `npm run lint` — 0 warnings
- `npm run typecheck` — 0 errors
- Anti-invention gates — 4/4 PASS, ratio 0.90

**Commit this session:**
(pending — Nico authorizes commit at session close)

**Next action:** Sprint 2 Phase 7 — performance spike (100 animated nodes + full glow stress test, 30s, measure fps/memory/battery per SPRINTS.md §Sprint 2 AI check line 238).

---

### 2026-04-20 — Android WebView debugging session 3: canvas CSS size root cause fixed (Mi A3)

**Context:** Continuation of Mi A3 (Xiaomi Mi A3, Android 10, Chrome 127 WebView) debugging. Previous session fixed `window.innerWidth = 0` via `screen.width/height` fallback and confirmed dims were non-zero (`dims w: 360 h: 780 dpr: 2`). But the app still showed white background and no neuron.

**Root cause identified — canvas rendering at 2× viewport size:**
The previous session's diagnostic log showed `css: 720 x 1560` from `getBoundingClientRect()` on the canvas. This meant the canvas was displaying at **720px wide in CSS space** on a 360px-wide viewport. Cause:

- The `<main>` CSS height chain (`html→body→#root→main { height: 100% }`) collapses to 0 on Android WebView during initial render
- The canvas has `position: absolute; top:0; right:0; bottom:0; left:0` but in a 0-height parent, the absolutely-positioned canvas also has 0 CSS height
- When a canvas has 0 CSS size, the browser uses its **pixel-buffer intrinsic size** (720×1560) as the CSS display size
- This makes the opaque canvas render at 2× the viewport, covering the dark background and placing the neuron far off-screen

**Fix: explicit `canvas.style.width/height` in `applyDPR`:**
Added two lines to `applyDPR()` in `dpr.ts`:
```typescript
canvas.style.width = `${width}px`;
canvas.style.height = `${height}px`;
```
This pins the CSS display size explicitly, so it doesn't matter whether the parent has zero height or whether the CSS layout chain is broken. The initial value comes from `screen.width/height` (360×780 on Mi A3), then the ResizeObserver corrects to `contentRect` dims within the first frame. ResizeObserver loop guard prevents re-triggering.

**Files modified:**
- `src/ui/canvas/dpr.ts` — `applyDPR()` now sets `canvas.style.width/height` explicitly
- `src/ui/canvas/NeuronCanvas.tsx` — removed diagnostic `console.debug` dims log and `console.error` draw error try/catch (both were diagnostic-only from session 2)
- `tests/ui/canvas/dpr.test.ts` — added `screen.width/height` fallback test (confirmed `style.width/height` assertions); added `style.width/height` assertions to existing test
- `.gitignore` — added `*.logcat` to exclude ADB logcat dumps
- `android/` — initial commit of Capacitor Android project files (previously untracked)

**Confirmed working on Mi A3:**
Dark background visible, blue neuron visible, taps register, HUD working. All Android WebView issues from sessions 1–3 resolved.

**Gate results at session close:**
- `npm test` — **315 passed / 54 skipped** (up from 314 — new `screen.width` fallback test)
- `npm run lint` — 0 warnings
- `npm run typecheck` — 0 errors
- Anti-invention gates — 4/4 PASS, ratio 0.88

**Commit this session:**
- `08aa01b` — Fix Android WebView canvas rendering: CSS size, background, and zero-dim fallback

**Pending value approval (carry-forward from session 2):**
`canvasMaxDPR` cap for `src/ui/tokens.ts` to clamp DPR on 3× screens. Industry standard = 2. Requires Nico approval before implementing per anti-invention rules.

**Next action:** Sprint 2 Phase 6 — UI-9 first-open splash sequence + CycleSetupScreen layout shell per SPRINTS.md §Sprint 2.

---

### 2026-04-20 — Android WebView canvas blank screen debugging (post-Phase 5)

**Context:** Web version confirmed working (neuron centered, HUD visible, 313 tests passing). Android emulator (Pixel 4a, Chrome 83 WebView `83.0.4103.106`) showed completely blank dark screen. Logcat confirmed game logic IS running — save scheduler fires every 30s, thoughts accumulate (1300→1450+ confirmed in Preferences.set calls). Issue is purely visual.

**Root cause investigation — two hypotheses:**
1. `canvas.getContext('2d')` returns null due to EGL GPU errors (`eglChooseConfig failed with error EGL_SUCCESS`) on emulator
2. `window.innerWidth/innerHeight` returns 0 at React mount time in Chrome 83 WebView

**Files modified this session:**

- `src/ui/canvas/dpr.ts` — switched from `getBoundingClientRect()` to `window.innerWidth/innerHeight` as authoritative dim source (getBoundingClientRect unreliable on canvas because setting `canvas.width/height` resets intrinsic size, fighting CSS cascade)
- `src/ui/canvas/NeuronCanvas.tsx` — canvas changed to `position:absolute;inset:0`; rAF loop retries dims every frame until non-zero (Chrome 83 WebView may report 0 for first frames); ResizeObserver added for layout-settle measurement; diagnostic `console.log('[SYNAPSE]…)` added (NOT committed — see below)
- `styles/tailwind.css` — `html,body,#root { height:100%; margin:0; background-color:var(--color-bg-deep) }` (fixes white bottom bleed on Android)
- `src/App.tsx` — `<main>` changed from `height:'100vh'` → `height:'100%'` (CSS height chain for WebView)
- `vite.config.ts` — build target changed to `['es2020','chrome83']` (matches actual emulator WebView)
- `android/app/src/main/res/values/styles.xml` — `android:background="#05070d"`, `android:windowBackground="#05070d"` (dark native Activity background)
- `capacitor.config.ts` — `android: { backgroundColor: '#05070d' }` (WebView background color)
- `tests/ui/canvas/dpr.test.ts` — updated to stub `window.innerWidth/innerHeight` instead of `getBoundingClientRect`
- `tests/ui/canvas/NeuronCanvas.test.tsx` — added `global.ResizeObserver` stub (jsdom doesn't implement it); tap tests updated to use window dim stubs

**Issues resolved:**
- White bottom bleed on Android: CSS height chain fix
- Neuron in top-right corner (web): window.innerWidth/innerHeight as authoritative dims
- All 7 test failures from ResizeObserver change: jsdom stub added

**Gate results at session close:**
- `npm test` — **313 passed / 54 skipped** (unchanged count; all test fixes applied)
- `npm run lint` — 0 warnings
- `npm run typecheck` — 0 errors

**Commits this session:**
- `9590ede` — Fix canvas blank on Chrome 83 WebView: retry dims until non-zero
- `11870be` — Fix canvas sizing: use window.innerWidth/Height as authoritative source
- `2553a60` — Fix Android WebView canvas sizing: use window.innerWidth/Height fallback
- `f30c57b` — Fix Android WebView layout bug: broken height chain

**Outstanding — UNRESOLVED:**
Diagnostic `console.log` statements added to `NeuronCanvas.tsx` (lines 68-71) and built (`index-Bzuc7Pus.js`) + synced via `npx cap sync android`. NOT committed to git. These will output `[SYNAPSE]` tagged entries via `Capacitor/Console` in logcat:
```
[SYNAPSE] canvas ref null          → React not mounting canvas
[SYNAPSE] canvas ctx null — GPU unavailable  → EGL GPU issue (hypothesis 1)
[SYNAPSE] canvas ok, innerW= X innerH= Y     → canvas works, dims visible
```
Nico needs to run the diagnostic build on emulator and paste logcat filtered by `[SYNAPSE]` or `Capacitor/Console`. Fix depends on which log appears.

**If `canvas ctx null`:** Try `android:hardwareAccelerated="false"` on WebView/Activity in AndroidManifest, or test on real device (emulator EGL emulation may be fundamentally broken).
**If `canvas ok, innerW=0 innerH=0`:** Try `screen.width/height` or `document.documentElement.clientWidth/clientHeight` as additional fallbacks in dpr.ts.
**If `canvas ok, innerW=NNN innerH=NNN`:** Canvas is rendering but invisible — add log inside `draw()` to verify it fires, check element positioning.
**If no `[SYNAPSE]` entries:** React `useEffect` not running — investigate JS error blocking React render.

**Next action:** Paste logcat → diagnose → fix canvas blank → remove diagnostic logs → commit.

---

### 2026-04-20 — Android WebView debugging session 2: real-device + OOM diagnosis

**Context:** Continuation of the emulator blank-screen investigation. Nico connected a Samsung SM-T510 (Galaxy Tab A 10.1 2019, 2GB RAM, Android 11, Chrome 146 WebView).

**Emulator root cause confirmed (unfixable):**
Pixel 4a emulator (Chrome 83 WebView) shows `eglChooseConfig failed with error EGL_SUCCESS` in the GPU sandbox process — the EGL surface compositor cannot be created in this emulator image. No code fix is possible. This is an emulator-specific EGL bug in the Chrome 83 renderer. Real devices with Chrome 83 should not be affected (different GPU driver path).

**Files modified this session:**
- `src/ui/canvas/dpr.ts` — split into `setupHiDPICanvas` (uses `window.innerWidth/Height` for initial mount) + `resizeHiDPICanvas` (accepts explicit width/height from ResizeObserver contentRect). Both call shared `applyDPR()`.
- `src/ui/canvas/NeuronCanvas.tsx` — ResizeObserver updated to call `resizeHiDPICanvas(canvas, ctx, rect.width, rect.height)` when `contentRect.width > 0 && height > 0`; falls back to `setupHiDPICanvas` otherwise. Added early-return guard in ResizeObserver callback comparing rounded dims to prevent "ResizeObserver loop completed with undelivered notifications" loop. `canvas.getContext('2d', { alpha: false })` opaque canvas (avoids Chrome 83 compositor transparency bug). try/catch around `draw()` so per-frame errors don't stop rAF loop.
- `src/ui/hud/HUD.tsx` — `inset: 0` replaced with `top: 0; right: 0; bottom: 0; left: 0` (Chrome 83 does not support `inset` shorthand).
- `src/App.tsx` — `height: '100%'` preserved (CSS height chain fix from session 1 still in place).
- `tests/ui/canvas/dpr.test.ts` — added 3rd test for `resizeHiDPICanvas` explicit-dims path.
- `tests/ui/canvas/NeuronCanvas.test.tsx` — ResizeObserver stub updated to pass `contentRect: { width: 0, height: 0 }` so it falls back to `setupHiDPICanvas`, matching production behavior when contentRect is unavailable.

**Root cause of neuron appearing in top-left corner (web):**
Intermediate attempt used `canvas.clientWidth/clientHeight` as dim source. Before browser computes CSS layout, `canvas.clientWidth` returns the default HTML canvas intrinsic width (300px), placing neuron at (150, 75) instead of viewport center. Reverted to `window.innerWidth/Height` for initial mount + `entry.contentRect` via ResizeObserver for correction within the first frame.

**Two APK packages on real device — confusion resolved:**
Device had two Synapse APKs installed simultaneously:
- `app.synapsegame.mind` — old build with AdMob SDK but no AdMob App ID configured. Crashed immediately on launch (`MobileAdsInitProvider: Missing application ID`). User was opening this by tapping the "SYNAPSE" icon. Uninstalled via `adb uninstall app.synapsegame.mind`.
- `com.nicoabad.synapse` — current dev build (correct). Installed via `adb install`. Now the only Synapse on the device.

**Real-device crash: OOM (Out of Memory), NOT a code bug:**
After uninstalling the wrong APK, `com.nicoabad.synapse` loaded correctly (JS executed, Preferences plugin called, rAF loop started). Crash after ~2s was:
```
onTrimMemory 60 (TRIM_MEMORY_RUNNING_CRITICAL)
→ lmkd kills: oneconnect, stickercenter, keychain, mobileservice, bbc.bbcagent (background apps)
→ Renderer process crash detected (code -1) ← OOM kill of WebView sandboxed process
```
The WebView renderer (isolated sandboxed process) was killed by Android's Low Memory Killer. Available memory at crash: ~640MB on a 2GB device. Multiple background Samsung services were consuming RAM. This is a device-level memory management issue, not a code bug.

**Resolution: move forward with web-only testing**
- Pixel 4a emulator: Chrome 83 EGL bug — permanently blocked, no code fix
- Samsung SM-T510: 2GB RAM + heavy background services → OOM kill on app startup — device too old/low-RAM for reliable testing
- Web version: fully functional (neuron centered, taps work, HUD visible, 314 tests passing)

**Decision:** Continue Sprint 2 on web. Android player tests deferred until a higher-RAM device or newer emulator image is available.

**Pending value approval (need Nico):**
`canvasMaxDPR` cap for `src/ui/tokens.ts` — would clamp DPR to this value to reduce canvas pixel buffer memory on 3× screens. Industry standard cap is **2**. On DPR ≤ 2 devices (including the SM-T510 at DPR ~1.5) this has zero effect. Protects against future 3× device OOM. Requires Nico approval before implementing per anti-invention rules.

**Gate results at session close:**
- `npm test` — **314 passed / 54 skipped**
- `npm run lint` — 0 warnings
- `npm run typecheck` — 0 errors

**Next action:** Sprint 2 Phase 6 — UI-9 first-open splash sequence + CycleSetupScreen layout shell.

---

### 2026-04-18 — Sprint 2 Phase 5: HUD + 4-tab TabBar (consumes i18n from 4.9.2)

First phase under the reviewer-discipline framework (PROGRESS.md Phase 4.9.3). Reviewer delivered an evidence block with 10 greps + 5 unverified assumptions + 4 red flags. Claude Code verified all claims via pre-code research before writing code. No fabrications to log this phase — [U4] was an honest flag that resolved to a legitimate defer (below).

**Deliverables (9 new files + 3 modifications):**

Created:
- `src/ui/util/wrapText.ts` — 35 lines — canvas text wrapping via `ctx.measureText()`, word-boundary splitting, single-word-wider-than-maxWidth handled by placing alone
- `src/ui/hud/ThoughtsCounter.tsx` — TL amber counter via `formatNumber()` + `t('hud.thoughts_label')`
- `src/ui/hud/RateCounter.tsx` — TR green "+{N}/s" via `t('hud.rate_prefix')` + `t('hud.rate_suffix')`
- `src/ui/hud/DischargeCharges.tsx` — TC `dischargeMaxCharges` pips (filled up to `dischargeCharges`) + "Discharge ⚡" label. Live countdown DEFERRED to Sprint 3 (charge regen not yet wired).
- `src/ui/hud/FocusBar.tsx` — top horizontal cyan (per Finding #18), empty at Phase 5 (Sprint 3 wires tap-fill)
- `src/ui/hud/ConsciousnessBar.tsx` — right vertical violet, conditional on `consciousnessBarUnlocked`, hidden by default. P26 white-gold override deferred to Sprint 6.
- `src/ui/hud/DischargeButton.tsx` — STUB DISABLED center-bottom button, tooltip "Unlocks in next update" on pointerDown via `t('buttons.discharge_locked_tooltip')`
- `src/ui/hud/TabBar.tsx` — 4 tabs Mind/Neurons/Upgrades/Regions via `t('tabs.*')`, click → `setActiveTab` action, active highlight via `data-active` attribute, 48px touch targets (CODE-4)
- `src/ui/hud/HUD.tsx` — composition overlay, `pointer-events: none` on wrapper, safe-area-inset aware
- `tests/ui/hud/HUD.test.tsx` — 25 jsdom component tests
- `tests/ui/util/wrapText.test.ts` — 8 unit tests

Modified:
- `src/store/gameStore.ts` — added `UIState` interface (`activeTab: TabId`), `setActiveTab` action, stripped `activeTab` from `saveToStorage` persistence (UI-local per session). Store now has 110 GameState + 1 UIState + 5 actions = 116 keys; persisted payload still 110 per §32 invariant.
- `src/store/saveScheduler.ts` — `trySave` strips `activeTab` matching saveToStorage (scheduler calls loop the same persistence)
- `src/App.tsx` — swapped Phase 3.5 placeholder thoughts div for `<HUD />` composition
- `src/ui/tokens.ts` — new `HUD` block (9 layout values: pipSize, pipGap, focusBarHeight, consciousnessBarWidth, dischargeButtonMinWidth, touchTargetMin, 3 opacity values). Keeps HUD components literal-free per CODE-1.
- `tests/store/saveGame.test.ts` — updated "114 store keys → 110 file keys" test to reflect new reality: store has 116 keys (110 + 1 UI + 5 actions), action path strips UI-local, result is still 110 persisted.

**Reviewer discipline metrics (first phase under the framework):**

| Metric | Target | Actual |
|---|---|---|
| Reviewer errors caught by Claude Code | ≤1 | **0** |
| Reviewer errors caught by Nico | 0 | TBD (checkpoint pending) |
| Unverified assumptions flagged | ≥1 | **9** ([U1–U5] + [R1–R4]) |
| Of flagged assumptions, how many were wrong | — | **1** ([U4] partially wrong) |
| Fabrications logged this phase | 0 | **0** |

**[U4] resolution** — honest flag led to honest defer, not invention.
Evidence block assumption: "Vitest Browser Mode with Playwright provider is configured and `npm run test:browser` works." Verification: `@vitest/browser` + `playwright` are in `devDependencies`, but package.json has NO `test:browser` script and no vitest config overriding environment. Browser mode is available-but-not-wired. Resolution: shipped jsdom + @testing-library/react component tests (same pattern as existing NeuronCanvas tests from Phase 3). Real-Chromium HUD test deferred to a later phase when setup cost is justified (probably Phase 7 perf spike or Sprint 11a test infra). This is NOT a fabrication — the reviewer flagged it explicitly; the honest path was to defer, not to invent a setup.

**Mid-flight finding — save path UI-local filter.**
First test run after adding `activeTab` revealed 7 failing save/load tests. Root cause: `saveGame()` / `loadGame()` enforce exactly 110 fields via `validateLoadedState`. With `activeTab` as a new non-function field, the persisted JSON had 111 fields (actions still dropped by JSON.stringify). Fix: `saveToStorage` action + `trySave` scheduler both destructure `activeTab` out of the snapshot before passing to `saveGame`. Per-session semantics: player returns to Mind tab on relaunch regardless of last active tab — acceptable UX and keeps §32 110-field invariant intact. Updated test at `tests/store/saveGame.test.ts:161` to use the action path rather than passing raw `useGameStore.getState()`. This is the kind of bug the Phase 5 full-test-run surfaces; flagged in reviewer "edge case audit" section of the framework retroactively — future phases with store extensions should grep `saveGame`/`trySave` for field-count invariants upfront.

**Mid-flight finding — Gate 3 ratio regression.**
Initial HUD implementation had ~29 numeric literals (PIP_SIZE constants + CSS percentages + opacity values). Gate 3 ratio dropped to 0.33 (target 0.80). Resolution in 2 passes: (1) extracted 9 layout values into new `HUD` block in `src/ui/tokens.ts` (canonical storage file, Gate 3 excluded per CLAUDE.md rule); (2) annotated CSS-value strings (`'50%'`, `'100%'`, stroke widths, animation durations) with `// CONST-OK: ... CODE-1 CSS exception` on each line; (3) replaced two `HUD.xxx / 2` radius computations with `'var(--radius-full)'` (equivalent pill shape, no division literal). Final ratio: 0.88 (unchanged from Phase 4 baseline). The HUD block follows the same pattern as the existing `CANVAS` block in tokens.ts.

**Gate results at Phase 5 close:**
- `npm run typecheck` — 0 errors
- `npm run lint` — 0 warnings
- `bash scripts/check-invention.sh` — 4/4 PASS, Gate 3 ratio **0.88** (14 constants, 2 literals; unchanged from Phase 4 baseline)
- `npm test` — **313 passed / 54 skipped** (up from 280 — 33 new: 25 HUD + 8 wrapText)
- `npm run build` — 177.63 KB JS (+7.30 KB vs Phase 4.9.2 baseline of 170.33, +1.93 KB gzipped) + 14.70 KB CSS (+0.94 KB, +0.26 KB gz)

**Scope boundary confirmation (explicit, per reviewer evidence block):**
- ❌ Focus Bar tap-fill — Sprint 3
- ❌ Discharge mechanic (charge accumulation + cascade) — Sprint 3
- ❌ Discharge button pulse-when-ready animation — Sprint 3
- ❌ Live countdown numbers in DischargeCharges — Sprint 3
- ❌ Panel content inside tab regions — Sprint 3+
- ❌ CycleSetupScreen — later phase / Sprint 4a
- ❌ First-open UI-9 splash + GDPR flow — later phase
- ❌ Performance spike — Phase 7/8
- ❌ Real-Chromium browser tests — deferred (setup cost unjustified for Phase 5)
- ❌ P26 consciousness bar white-gold override — Sprint 6 narrative pass

**Next action:** Phase 6 per SPRINTS.md §Sprint 2 — could be CycleSetupScreen layout shell (CYCLE-2), or performance spike, or UI-9 first-open sequence. Per the dependency graph at top of SPRINTS.md §Sprint 2 AI checks, CycleSetupScreen + UI-9 are next-in-line. Nico decides kickoff order.

Cumulative Sprint 1+2 findings: **20** (Sprint 1: 4, Sprint 2 Phases 1-4: 12, Phase 4.9: 4, Phase 5: 2 mid-flight caught pre-commit). Cumulative reviewer fabrications: **8** (unchanged from Phase 4.9.3; Phase 5 contributed zero). Shipped bugs: **0**.

---

### 2026-04-18 — Sprint 2 Phase 4.9.3: reviewer accountability framework formalized

Pre-Phase-5 checkpoint. Two commits: doc-alignment (Commit 1) + i18n foundation (Commit 2). Stage 1 audit (Phase 4.9.0) surfaced 4 additional findings beyond the 3 originally scoped; [A1] and [A2] partial-fix approved for inclusion, [A3] and [A4] deferred to consuming sprints.

**Finding #16 — Sprint 1 infrastructure gap: i18n never implemented.**
SPRINTS.md §Sprint 1 AI check "t('key') returns English strings for all keys; placeholder Spanish file exists" silently skipped during Sprint 1 and missed by the 4 anti-invention gates (no gate checks for file existence). Gap undetected through Sprint 2 Phases 1-4 because no component had user-facing strings. Phase 5 HUD exposed it: hardcoding tab labels would violate CODE-1. Resolution: i18n foundation shipped in Phase 4.9.2 (Commit 2) — `src/config/strings/en.ts` + `index.ts` + 7 contract tests. Sprint 1 checkbox retroactively checked with Phase 4.9 reference.

**Finding #17 — Language policy: v1.0 English-only user-facing (sprint-owned translation).**
CLAUDE.md Glossary originally mandated "mechanic names stay Spanish"; reverted. Nico decision based on target audience (anglophone mobile idle market): all user-facing English for v1.0. Translation happens INCREMENTALLY per sprint — each sprint translates the GDD sections it implements. Phase 4.9 Sprint 2 translated §29 (HUD), UI_MOCKUPS.html user-facing labels, and CLAUDE.md Glossary intro. Sprints 3-10 will translate their respective sections at kickoff with per-name Nico approval (see new CLAUDE.md "Language translation — sprint-level ownership" rule).

Rationale for incremental approach:
1. Many GDD compound names are gameplay creative decisions with no neuroscientific equivalent — translating them requires designer intent, not lookup (e.g., Mente Despierta, Eco Ancestral, Modo Ascensión).
2. Mass find-and-replace of bare terms inside compound names produces nonsense hybrids ("Amplificador de Discharge").
3. Each sprint implementer reviews their own surface with fresh context; distributed cognitive load.

Internal TS union identifiers (`'basica'`, `'rapida'`, `'analitica'`) KEEP Spanish — refactoring = 15+ file churn for zero player impact. v1.1 adds `es.ts` and multi-locale via POSTLAUNCH.md §v1.1 roadmap.

**Finding #18 — HUD position docs vs mockup alignment.**
GDD §29 + SPRINTS §Sprint 2 said "Consciousness LEFT / Focus RIGHT vertical", but UI_MOCKUPS.html canonical SVG (verifiable at `x=382` for Consciousness, `x=80 y=76` for Focus) shows "Consciousness RIGHT vertical violet / Focus TOP horizontal cyan". Per GDD §3b pairing rule, mockup is canonical visual. Updated GDD §29 + SPRINTS Sprint 2 + tokens.ts focusBar color (violet `#8B7FE8` → cyan `#40D0D0`). Regenerated `styles/_theme.generated.css` via `npm run build:tokens`; verified `--color-focus-bar: #40D0D0;` emitted.

**Finding #19 — POSTLAUNCH v1.1 scope contamination in UI_MOCKUPS.**
Screen 6 "Tab Neuronas" mockup displayed Auto-buy toggle (POSTLAUNCH §v1.1, line 29-30) without deferral qualifier. Sprint 3 implementer reading mockup literally (consistent with prior finding pattern — #4060E0, 9-theme-slots, consciousness LEFT/RIGHT drift) would have built a v1.1 feature into v1.0 scope. Removed SVG elements (rect + "Auto ⟳" text) + description "Auto-buy toggle (P5+)." mention, added HTML comment documenting the deferral. Canonical mockup is now v1.0-clean for neurons panel. Caught by Phase 4.9.0 audit.

**Finding #20 — NARRATIVE.md v1.5+ spoiler annotation (partial mitigation).**
EMP-07 fragment annotation at line 163 named "Observer archetype (v1.5)" and "Oneiric System (v1.5)" in player-visible doc context. Partial mitigation: wrapped in HTML comment to hide from markdown render (zero-risk change). Full resolution deferred to Sprint 6 narrative pass — implementer will review all fragment annotations and decide whether to strip, reword, or retain as design notes.

### Neuron display names (for Phase 5 HUD, verified via neuroscience)

Each internal type mapped to a real neuroscientific term:

| Internal | Display | Source |
|---|---|---|
| `basica` | Basic | Conceptual proto-neuron |
| `sensorial` | Sensory | Canonical term (Healthline) |
| `piramidal` | Pyramidal | Wikipedia — cortex excitation units |
| `espejo` | Mirror | Cell (2022) — monkey premotor cells |
| `integradora` | Interneuron | Wikipedia — central nodes of circuits |

Chose `Interneuron` over `Integrator` — actual neuroscientific term, aligns with GDD §5 integration role, thematically connects with Inhibitory Polarity unlock at P3.

### UI_MOCKUPS.html translation pass (Phase 4.9.1)

All Spanish user-facing text in the mockup translated to English: 6 screen descriptions reworded, tab labels (Mente/Neuronas/Mejoras/Regiones → Mind/Neurons/Upgrades/Regions), HUD text (Disparo → Discharge, Ráfaga Dopamínica → Dopamine Burst, NUEVO RÉCORD → NEW RECORD), CycleSetupScreen labels (POLARIDAD → POLARITY, Excitatorio → Excitatory, MUTACIÓN → MUTATION, Rápida → Swift, [cambiar] → [change]), Pattern Tree labels (carga → charge, ciclo → cycle, Árbol + Decisión → Tree + Decision), Neuron panel (Básica/Sensorial/Piramidal → Basic/Sensory/Pyramidal), Offline screen description (Sueño Lúcido → Lucid Dream). HTML `lang="es"` → `lang="en"`. Compound names intentionally untouched per CLAUDE.md sprint-ownership rule — e.g. `Ínsula` (v2.0 feature per POSTLAUNCH, already flagged in mockup description).

### GDD §29 translation pass (Phase 4.9.1)

Scope narrowed to §29 only per Option A decision (§5/§8/§13/§15/§16/§24 deferred to consuming sprints per per-name approval). §29 terms translated: `Pensamientos` → `Thoughts`, `Polaridad`/`Arquetipo` → `Polarity`/`Archetype` (UI-7 rule), `Básica` → `Basic` (UI-9 first-open sequence). HUD Layout section corrected for Finding #18 positions. No compound names present in §29; no ambiguities surfaced.

### Commit 1 scope summary

Files modified:
- `docs/GDD.md` — §29 only (HUD positions + 4 bare-term translations)
- `docs/UI_MOCKUPS.html` — 6 screens user-facing text → English, Auto ⟳ removed, `lang` attribute
- `docs/NARRATIVE.md` — EMP-07 annotation wrapped in HTML comment
- `docs/SPRINTS.md` — Memorias/Pensamientos line 459+472, Sprint 2 HUD line 219, Sprint 1 i18n checkbox
- `CLAUDE.md` — Glossary intro reword + new "Language translation — sprint-level ownership" section
- `src/ui/tokens.ts` — focusBar violet → cyan
- `styles/_theme.generated.css` — regenerated (62 tokens, `--color-focus-bar: #40D0D0`)
- `docs/PROGRESS.md` — this entry (Findings #16-#20)

Cumulative Sprint 1+2 findings: **20** (Sprint 1: 4, Sprint 2 Phases 1-4: 12, Phase 4.9: 4 new + 3 known = 5 logged this session). Shipped bugs: 0.

**Next action:** Commit 2 — i18n foundation (`src/config/strings/en.ts` + `index.ts` + `tests/i18n/en.test.ts`).

---

### 2026-04-18 — Sprint 2 Phase 4.9.3: reviewer accountability framework formalized

**Meta-decision:** Throughout Sprint 1+2, Claude Opus (reviewer) generated 8 fabrications in phase/decision prompts:

1. GDD §3 misattribution (Sprint 2 kickoff) — caught by Nico
2. Palette invention ignoring UI_MOCKUPS (Sprint 2 kickoff) — caught by Nico audit request
3. "Mental flag para Sprint 11a" anti-pattern — caught by Nico
4. Scope creep Sprint 3 → Phase 3 — auto-caught with grep
5. Proposing `nebula` theme without catalog audit (Phase 4) — caught by Claude Code
6. Suggesting `performance.now()` violating CODE-9 (Phase 3.5) — caught by Claude Code
7. Naive find-and-replace GDD table (Phase 4.9) — caught by Claude Code
8. Stage 2 approval prompt generated assuming pre-Commit-1 state despite explicit checkpoint report showing commits `18c10b6` and `3457d2c` already landed — caught by Claude Code (Phase 4.9.3 meta). Classic instance of reviewer operating from memory without verifying state reported explicitly in current context. Recursion: the framework prevented its own authoring from introducing the error it's designed to prevent.

Pattern: reviewer operating from memory instead of grep-verifying, trusting mental model after long sessions, optimizing for prompt speed over rigor. Error rate 8 in ~10 phases = unacceptable baseline for remaining 11 sprints.

**Resolution:** CLAUDE.md now contains 4 new sections (added across Phase 4.9.1 + 4.9.3):
- "Language translation — sprint-level ownership" (4.9.1)
- "Reviewer evidence discipline" (4.9.3) — mandatory block in reviewer prompts
- "Instructions for Claude Opus (reviewer) at session start" (4.9.3) — explicit first-message checklist
- "If this session was compacted" (4.9.3) — anti-pattern recovery

**Metrics to track per phase starting Phase 5:**
- Reviewer errors caught by Claude Code (target: ≤1)
- Reviewer errors caught by Nico (target: 0)
- Unverified assumptions flagged (target: ≥1 honest flag better than 0 and lying)
- Of flagged assumptions, how many were actually wrong

**Threshold:** consistent >2 errors caught by Claude Code per phase → new session mandated (compaction/degradation signal).

**Rationale for anchoring in CLAUDE.md:** Opus conversational memory is lost on compaction. Rules in CLAUDE.md + PROGRESS.md survive and are re-read at every session start. Single point of failure: Nico must upload CLAUDE.md in new sessions. Mitigation: kickoff template (held by Nico, pasted at session start) enforces this.

**Files modified (Phase 4.9.3):**
- `CLAUDE.md` — 3 new sections appended after "Language translation — sprint-level ownership"
- `docs/PROGRESS.md` — this entry

No src/, tests/, or other code changes. Docs-only commit. Gates expected unchanged (constants ratio 0.88, tests 280/54).

**Next action:** Phase 5 — HUD (5 sub-components per GDD §29): thoughts TL, rate TR, charges TC, Focus Bar (top horizontal cyan), Consciousness Bar (right vertical violet). `wrapText()` utility + Vitest Browser Mode real-Chromium HUD test in Phase 5 scope. Strings consumed via `t('hud.thoughts_label')`, `t('tabs.mind')`, etc. from `src/config/strings/index.ts` (shipped Phase 4.9.2).

---

### 2026-04-17 — Sprint 2 Phase 4: theme architecture (3 Era themes + 4-slot cosmetic override system)

Theme system ships with zero visual regression. Bioluminescent Era is the composed default; Eras 2/3 are `isInterim` stubs inheriting the bioluminescent palette until Sprint 9+ tunes them.

**Files created (221 src + 178 test = 399 total):**
- `src/ui/theme/types.ts` — 64 lines — `Theme` interface + `NeuronThemeEntry` + `GlowPackConfig`
- `src/ui/theme/themes.ts` — 70 lines — 3 Era entries (`THEME_BIOLUMINESCENT` real, `THEME_DIGITAL` + `THEME_COSMIC` interim stubs) + `ERA_THEMES` registry
- `src/ui/theme/cosmeticOverrides.ts` — 30 lines — 4 EMPTY override registries (NEURON_SKINS, CANVAS_THEMES, GLOW_PACKS, HUD_STYLES); docstring names each of the 18 expected Sprint 9+9b entries
- `src/ui/theme/useActiveTheme.ts` — 57 lines — composition hook with 3-layer precedence (Era → canvas theme → neuron skin → glow pack)
- `tests/ui/theme/themes.test.ts` — 9 tests (registry shape, hex-format validation, interim flag distribution, NARRATIVE:476 P26 override present on bioluminescent, interim Eras inherit neurons)
- `tests/ui/theme/useActiveTheme.test.tsx` — 8 tests (3 Era base selections, 4 override modes, unknown-cosmetic silent fallback per UI-8, triple-override precedence)

**Files modified:**
- `src/ui/canvas/renderer.ts` — `draw()` now consumes `Theme` param (`theme.canvasBackground`, `theme.neurons[type]`, `theme.glowPack.opacityMin/Max`). Removed direct `COLORS` imports (all via theme). Kept `BIOLUMINESCENT_THEME` re-export as `THEME_BIOLUMINESCENT` alias for test fixtures.
- `src/ui/canvas/NeuronCanvas.tsx` — added `useActiveTheme()` + `themeRef` so the rAF loop reads the current composed theme every frame without re-creating closures on theme changes.

**All 4 cosmetic registries ship EMPTY** — Sprint 9 + Sprint 9b populate. The type signatures accommodate every expected entry (8 neuron skins, 6 canvas themes, 3 glow packs, 1 HUD style = 18 total, matching GDD §26 catalog plus the 2 monetization exclusives).

**Pre-code research pattern paid off twice:**
1. "9 theme slots" derivation resolved ambiguity without requiring Nico to define the number
2. `nebula` counter-proposal caught as a new collision before any code was written — the 15-min catalog audit prevented silently shipping a rename that would have broken Neuron skin #8

**Composition precedence documented in `useActiveTheme.ts` docstring:**
1. Era base (`ERA_THEMES[eraVisualTheme]`)
2. Canvas theme cosmetic (merges `Partial<Theme>` over composed)
3. Neuron skin cosmetic (merges per-type `Partial<NeuronThemeEntry>`)
4. Glow pack cosmetic (replaces `glowPack` entirely)

HUD style is NOT in the composition — Phase 5 HUD reads `state.activeHudStyle` independently.

**Gates at Phase 4 close:**
- `npm run typecheck` — 0 errors
- `npm run lint` — 0 warnings
- `bash scripts/check-invention.sh` — 4/4 PASS, Gate 3 ratio **0.88** (14 constants, 2 literals — unchanged from Phase 3.5)
- `npm test` — 273 passed / 54 skipped (up from 256 — 17 new Phase 4 tests: themes 9 + useActiveTheme 8)
- `npm run build` — 170.33 KB JS (+1.18 KB, 56.33 KB gz) + 13.74 KB CSS (5.42 KB gz)

**Runtime smoke check (Playwright headless + canvas pixel inspection):**
- Initial thoughts: `0` ✓
- After 6s passive: `3` ✓ (matches Phase 3.5 exactly — identical production rate, identical formula)
- After 1 tap: `4` ✓
- Canvas bg pixel at (10,10): `rgba(5,7,13,255)` = `#05070d` = `--bg` = bioluminescent Era background ✓
- `tap:first-tap` logged once ✓
- Zero pageerrors ✓

Zero visual regression. The refactor is purely structural: before Phase 4 the renderer imported `COLORS.neuronBasica` directly; after Phase 4 it reads `theme.neurons.basica.color` where `theme = THEME_BIOLUMINESCENT` (composed from `ERA_THEMES.bioluminescent` with no cosmetic overrides). The values are the same references — the indirection is what enables Sprint 9's cosmetic system.

**Mid-flight finding (Phase 4 sub-catch):** during the renderer refactor I wrote an algebraically nonsensical `radiusMult` line (`pulsePhase * glowPack.radiusMultiplier * MOTION.pulseRadiusAmp / glowPack.radiusMultiplier` — the multiplier cancels out, leaving the original expression but with two wasted ops and confused semantics). Caught while re-reading before commit; the architectural mistake was conflating "glow halo size" (governed by `glowPack.radiusMultiplier` = 2.5) with "neuron pulse amplitude" (governed by `MOTION.pulseRadiusAmp` = 0.1). These are independent concerns: glow governs the pre-rendered halo sprite, pulse governs each neuron's breathing animation. Reverted the line to the Phase 2 form `1 + pulsePhase * MOTION.pulseRadiusAmp`. Documented here so Phase 7 perf tuning doesn't re-conflate them.

**Scope confirmation (explicit):**
- ❌ Cosmetic content (8 neuron skins, 4 store themes, 2 exclusives, 3 glow packs, 1 HUD) — **Sprint 9 scope**
- ❌ Era 2 digital real palette — **Sprint 9+** (currently `isInterim: true` inheriting bioluminescent)
- ❌ Era 3 cosmic real palette — **Sprint 9+** (same)
- ❌ `wrapText` canvas helper — **Phase 5** (needed by HUD, not renderer)
- ❌ Genius Pass "Genius Gold" theme content — **Sprint 9b monetization**
- ❌ HUD styling architecture — **Phase 5**

**Cumulative Sprint 2 findings: 12** (Phase 1: 4, Phase 2 pre-code: 1, Phase 2 impl: 2, Phase 3: 1, Phase 3.5: 2, Phase 4 pre-code: 1 combined ambiguity + collision, Phase 4 impl: 1 mid-flight radiusMult algebra error). Cumulative Sprint 1+2: **16**.

**Next action:** Phase 5 — HUD (5 sub-components per GDD §29): thoughts TL (already placeholder-positioned), rate TR, charges TC, Focus Bar right-vertical, Consciousness Bar left-vertical. `formatNumber()` already landed Phase 2. `wrapText()` utility + Vitest Browser Mode real-Chromium test are Phase 5 scope.

---

### 2026-04-17 — Sprint 2 Phase 4 pre-code: "9 theme slots" resolved + cosmic collision fixed

"9 theme slots" (SPRINTS.md line 217) derived empirically from GDD §26 by Claude Code: 3 Era + 4 Store + Genius Gold + Neon Pulse = 9. Enumeration added to GDD §3b subsection "Canvas theme slots (9 total)" to close the documentation gap.

Naming collision audit: `cosmic` (Era 3) collided with `cosmic` (Cosmetics Store theme #3). Initial proposed rename to `nebula` was caught by Claude Code's pre-code catalog audit as creating a NEW collision with Neuron skin #8. Final rename: `cosmic` → `deep_space` (naming parity with existing `deep_ocean`). Era name `cosmic` unchanged — it's part of the closed `EraVisualTheme` union type + consistency tests.

Pre-existing intentional cross-category collisions (`aurora` appears in 2 categories, `plasma` appears in 2 categories) documented as GDD §26 footnote ("Cross-category ID collisions — intentional pattern"). These work because each category has a distinct GameState slot + separate `Record<string, ...>` registry. Sprint 9 implementer must NOT attempt to "fix" them.

New CLAUDE.md section added: "Pre-code research pattern". Formalizes the 5-15 min grep-first step that caught the Phase 2 `#4060E0` drift, the Phase 4 `9 theme slots` ambiguity + cosmic collision, and the Phase 4 meta-catch of `nebula` double-collision. Especially critical for phases that introduce NAMES, NUMBERS, or VISUAL TOKENS — the pattern is the only filter that catches spec-to-spec inconsistencies that local code review cannot.

Cumulative Sprint 2 findings: 11 (10 pre-Phase-4 + this combined ambiguity + collision resolution). Cumulative Sprint 1+2: **16**. Reviewer-side fabrications tally: **5** (Nico proposing `nebula` without catalog audit — caught by Claude Code pre-code; consistent with prior 4 in §3 misattribution, palette invention, "mental flag" backlog loss, Phase 3 scope creep).

---

### 2026-04-17 — Sprint 2 Phase 3.5: runtime integration gap caught by smoke test

Manual smoke test after Phase 3 (Nico on Windows Chrome localhost) exposed a critical integration gap: `src/engine/tick.ts` had 29 passing unit tests since Sprint 1 Phase 5 but was NOT invoked at runtime — no React hook wrapped `setInterval` around `tick()`. All passive production, Discharge charge regen, and Mental State triggers were silent no-ops in the real app.

**Why tests didn't catch it:**
- `tick.test.ts` calls `tick()` manually with mock timestamps — tests the pure reducer, not the runtime integration
- No end-to-end test ever mounted the app, waited 1 second, and asserted `thoughts > 0` from passive accumulation
- jsdom tests use fake timers and explicit `renderHook`, so a missing scheduler call in `App.tsx` would be invisible there too

**Fix #1 — tick runtime scheduler:** `src/store/tickScheduler.ts` — 38 lines, parallel pattern to `saveScheduler.ts` from Sprint 1 Phase 7. 100ms interval per CODE-4 + GDD §35 TICK-1 step 1. Three safety guards baked in:

1. **`Date.now()` not `performance.now()`** — INIT-1 seeds `cycleStartTimestamp` with `Date.now()` (epoch ms); using `performance.now()` (page-load-relative) would make derived durations wildly negative. Caught mid-implementation before the first test run.
2. **INIT-1 init guard** — `if (current.cycleStartTimestamp === 0) return;` skips ticks until mount effect populates timestamps. Covers the <100ms mount race + the async `loadFromSave` window where the interval could fire before timestamps exist.
3. **Merge-mode `setState`** — no `true` flag per CLAUDE.md Zustand pitfall rule; action bindings preserved across every tick.

**Background behavior:** `setInterval` fires regardless of tab visibility. Sprint 8a OFFLINE-1 recalc supersedes on return; a backgrounded browser tab throttles `setInterval` to ~1 Hz anyway, so waste is minimal.

**Fix #2 — HUD placement:** Phase 3 placed thoughts counter top-right with arbitrary styling. Corrected to top-left amber monospace per UI_MOCKUPS line 33 (amber `--a`, JetBrains Mono, weight 800, x=20 offset). SYNAPSE h1 placeholder removed — it was residue from Phase 1 pre-canvas scaffolding that became visually ambiguous once the canvas took the full viewport. Thoughts counter now uses `pointer-events: none` so taps pass through to the canvas below. `toLocaleString()` adds thousand separators per UI_MOCKUPS line 33 ("1,847,293"). Phase 5 replaces with the full HUD (thoughts TL + rate TR + charges TC + Focus Bar right + consciousness bar left).

**Files:**
- New: `src/store/tickScheduler.ts`, `tests/store/tickScheduler.test.ts` (6 tests: interval registered, clearInterval on unmount, INIT-1 guard blocks pre-init ticks, post-init accumulation, action refs preserved, cleanup stops further ticks)
- Modified: `src/App.tsx` (hook + layout rewrite), `docs/SPRINTS.md` §Sprint 11a (TICK-RUNTIME-1 backlog item)

**Gates at Phase 3.5 close:**
- `npm run typecheck` — 0 errors
- `npm run lint` — 0 warnings
- `bash scripts/check-invention.sh` — 4/4 PASS (see ratio in checkpoint)
- `npm test` — 256 passed / 54 skipped (up from 250 — 6 new tickScheduler tests)

**Lessons:**
- **Manual smoke test is irreplaceable** for runtime integration gaps. Unit tests + jsdom tests are necessary but insufficient.
- Going forward: Phase 7 perf spike + Sprint 8a offline spike should BOTH include a "mount and wait" assertion to catch runtime-scheduler regressions.
- Formalized as SPRINTS.md §Sprint 11a item **TICK-RUNTIME-1** — an end-to-end test that mounts the app, advances timers, and asserts state evolution. Pattern name: "engine works in isolation but doesn't get called by the app".

**Cumulative Sprint 2 findings: 9** (Phase 1: 4, Phase 2 pre-code: 1, Phase 2 impl: 2, Phase 3: 1, Phase 3.5: 1 — the first Sprint 2 finding caught by runtime behavior rather than review or static analysis). Cumulative Sprint 1+2 total: **13**.

---

### 2026-04-17 — Sprint 2 Phase 3: tap handler + AudioContext + hit-testing

Phase 3 delivers tap-input plumbing. NARROW scope: hit-testing, minimum-thought increment, AudioContext unlock, first-tap stub. All Sprint 3 game logic (Focus Bar fill, Insight, full TAP-2 formula, anti-spam wiring, haptics, Undo toast, tutorial hints, Discharge) remains deferred to Sprint 3 per the sprint-boundary discipline — verified none leaked in.

**Files created:**
- `src/ui/canvas/tapHandler.ts` — pure `testHit(tapX, tapY, state, canvasW, canvasH, hitRadiusMin)` with 48dp (24 CSS px radius) minimum per CODE-4. Reuses `getNeuronPosition` from renderer (no layout duplication). Nearest-wins on overlapping hit areas.
- `src/ui/canvas/audioUnlock.ts` — singleton AudioContext + `unlockAudioOnFirstTap()` with UI-8 silent-fail on `resume()` rejection. Supports `webkitAudioContext` fallback for older iOS Safari. Idempotent: second call returns early if state is no longer `suspended`.
- `tests/ui/canvas/tapHandler.test.ts` — 10 tests covering visual-radius hits, 48dp-minimum hit area (inside min but outside visual), miss cases, multi-neuron nearest-wins, empty state, determinism.
- `tests/ui/canvas/audioUnlock.test.ts` — 6 tests covering singleton, idempotent unlock, UI-8 silent fail, SSR safety (no ctor available).

**Files modified:**
- `src/ui/tokens.ts` — CANVAS block adds `minHitRadiusPx: 24` (iOS 44pt / Android 48dp ÷ 2).
- `src/store/gameStore.ts` — new `incrementThoughtsByMinTap()` action adds `SYNAPSE_CONSTANTS.baseTapThoughtMin` (= 1). Stub for Sprint 3 full TAP-2 implementation.
- `src/ui/canvas/NeuronCanvas.tsx` — added `onPointerDown` handler: calls `unlockAudioOnFirstTap()` (fire-and-forget), runs `testHit` against current state, increments thoughts on hit, logs `tap:first-tap` once (Sprint 6 replaces with narrative event bus). `dims` now a `useRef` so the handler reads current values.
- `src/App.tsx` — header row with SYNAPSE title (left) + live thoughts readout (right) using JetBrains Mono + tabular-nums + `--color-thoughts-counter` amber. Placeholder only — Phase 5 ships the real HUD.
- `tests/store/gameStore.test.ts` — 4 new tests for `incrementThoughtsByMinTap` (adds floor, multi-call arithmetic, no unrelated-field mutation, action-reference preservation per Zustand pitfall).
- `tests/ui/canvas/NeuronCanvas.test.tsx` — 3 new integration tests (hit tap increments thoughts, miss tap does not, first-tap stub logs exactly once).

**Event-type choice documented in NeuronCanvas.tsx:** React `onPointerDown` covers touch + mouse + pen with a unified API, fires immediately (no 300ms click delay). CODE-4 says "touchstart not click" — PointerEvent satisfies the intent while enabling desktop dev/test. `touch-action: manipulation` on the canvas element suppresses double-tap zoom.

**Gates at Phase 3 close:**
- `npm run typecheck` — 0 errors
- `npm run lint` — 0 warnings
- `bash scripts/check-invention.sh` — 4/4 PASS, Gate 3 ratio **0.93** (13 constants, 1 literal — improved from 0.86 because new `SYNAPSE_CONSTANTS.baseTapThoughtMin` reference added a constant)
- `npm test` — **250 passed / 54 skipped** (up from 227 — 23 new Phase 3 tests: tapHandler 10, audioUnlock 6, gameStore 4, NeuronCanvas 3)
- `npm run build` — 165.90 KB JS (+1.71 KB, 54.95 KB gzipped) + 13.64 KB CSS (5.39 KB gzipped) + ~131 KB fonts

**Runtime smoke check:** `npm run dev` → Vite ready in 429ms. `/` returns 200 (587 B). `/src/App.tsx` transforms cleanly with HMR hooks. Unit-level `NeuronCanvas.test.tsx` integration test confirms: tap on centered Básica → `thoughts` increments by `baseTapThoughtMin (= 1)`; tap in corner → no increment; first-tap stub logs exactly once across multiple taps. Full in-browser tap verification (passive accumulation + tap increment interleaved) will happen at Phase 7 perf spike when the performance profile is also captured.

**Scope boundary confirmation (explicit, per Phase 3 directive):** the following Sprint 3 items were NOT implemented and remain deferred per SPRINTS.md §Sprint 3:
- Focus Bar fill (`focusFillPerTap`) — Sprint 3
- Insight auto-trigger at `focusBar >= 1.0` — Sprint 3
- Full TAP-2 formula (`Math.max(baseTapThoughtMin, effectivePPS × baseTapThoughtPct)`) — Sprint 3
- TAP-1 anti-spam wiring (tick.ts step 12 still stubbed) — Sprint 3
- Haptic feedback (requires `@capacitor/haptics` install) — Sprint 3
- Undo toast (UI-4) — Sprint 3
- Tutorial hints (P0 3-tooltip sequence) — Sprint 3
- Discharge / Cascade — Sprint 3

The Phase 3 stub action `incrementThoughtsByMinTap` contains a JSDoc comment explicitly marking it as Sprint 3's replacement target.

#### Phase 3 findings (1)

**Finding #8: CSS custom-property references in JSX `style` strings trip Gate 3.** Added `padding: 'var(--spacing-4)'` to App.tsx; Gate 3 caught the `-4` inside the string literal. CODE-1 lists "CSS values" as an exception, but the gate grep cannot distinguish string-context from numeric-context — it sees a digit between non-word chars and counts it. Resolution: `// CONST-OK: CSS custom property ref (CODE-1 exception)` annotation on each affected line. As HUD expands in Phase 5 (more `var(--spacing-N)` / `var(--text-Nxl)` refs in JSX), expect the same pattern; the Gate 3 comment already documents this as an expected annotation site. A future tooling improvement (Gate 6 adjacent?) could teach the grep to recognize `'var(--...)'` as a CSS-value context and auto-exclude, but not worth building for v1.0.

**Cumulative Sprint 2 findings: 8** (Phase 1: 4, Phase 2 pre-code: 1, Phase 2 impl: 2, Phase 3: 1). All caught pre-commit; zero shipped bugs.

**Next action:** Phase 4 — HUD (5 sub-components: thoughts TL, rate TR, charges TC, Focus Bar right, consciousness bar left) per GDD §29. Sprint 2 test checklist item 3 (real-Chromium HUD test) may come in Phase 4 or Phase 5 per setup cost.

---

### 2026-04-17 — Meta: reviewer-side scope fabrication (4th instance)

During Phase 3 kickoff, Claude-the-reviewer initially proposed a scope including 8 items, 7 of which belong to Sprint 3 per SPRINTS.md (Focus Bar fill, Insight, TAP-2 formula, anti-spam wiring, haptic, Undo, tutorial hints, Discharge). Caught via grep before the prompt was sent to Claude Code.

Cumulative reviewer-prompt fabrications in Sprint 1+2: **4** (GDD §3 misattribution, palette invention, "mental flag" backlog loss, scope creep this phase). All caught pre-code, zero shipped.

**Rule established:** phase kickoff scope must be derived by explicit subtraction: (AI checks in SPRINTS.md §Sprint X) − (items already completed per prior phase checkpoints). Memory-based scope enumeration has 50% fabrication rate across 4 attempts — unreliable.

Cumulative Sprint 1+2 findings total: **12** (4 GDD doc gaps, 2 tooling bugs, 2 framework gotchas, 4 reviewer fabrications).

---

### 2026-04-17 — Meta: anti-invention self-audit on "mental flag" anti-pattern

During Sprint 2 Phase 2 review, Claude (acting as reviewer) suggested deferring a "Gate 6 canonical-storage audit" to Sprint 11a as a "mental flag for later". Nico correctly called this out: mental flags get lost, which is exactly the failure mode the anti-invention framework exists to prevent.

**Rule established:** when a future-sprint backlog item is identified during a review, it MUST be logged in `docs/SPRINTS.md` §Sprint X (where it will be executed), not in conversation memory. "Mental flag for later" is equivalent to silent invention by omission.

Gate 6 concept logged formally in `docs/SPRINTS.md` §Sprint 11a adjacent to the existing Gate 5 snapshot-validation item. Future "this would be nice to check" ideas follow the same pattern: write them into SPRINTS.md at the target sprint, with enough context that the implementer understands what to do.

Phase 2 introduced 7 interim animation constants in `tokens.ts` (pulse envelope, glow radius, scatter layout). All are judgment calls for visual "feel" without GDD guidance; values are subject to revision in Phase 7 (perf spike) and Phase 3 (multi-neuron scatter). Documented in GDD §3b subsection "Phase 2 interim animation constants" with tune-target sprints noted. This closes the "invisible to future sprints" gap — Phase 7 implementer reading §3b will find both the values and the tune-window guidance.

---

### 2026-04-17 — Sprint 2 Phase 2: canvas renderer (1 pulsing Básica)

Phase 2 delivers the Canvas 2D rendering foundation. Scope: formatNumber utility, DPR scaling, pre-rendered glow cache, pure draw() renderer, NeuronCanvas React component with rAF loop + visibility-pause + resize handling. Integration into App.tsx replaces the Sprint 1 placeholder "Thoughts: 0" text with the live canvas.

**Files created (345 src + 442 tests = 787 lines):**
- `src/ui/util/formatNumber.ts` — 53 lines — K/M/B/T/Q suffixes with `<10` 2-dec / `<100` 1-dec / `≥100` 0-dec precision, trailing-zero trim, 999Q+ cap
- `src/ui/canvas/dpr.ts` — 38 lines — `setupHiDPICanvas()` applies `devicePixelRatio` scaling per CODE-4
- `src/ui/canvas/glowCache.ts` — 66 lines — FIFO-bounded (20 entries) offscreen glow sprite cache per CODE-4 "pre-render glow"
- `src/ui/canvas/renderer.ts` — 110 lines — pure `draw(ctx, state, theme, dims, elapsedMs)` with sin-based ambient pulse; `BIOLUMINESCENT_THEME` constant bridges tokens.ts to canvas
- `src/ui/canvas/NeuronCanvas.tsx` — 78 lines — React component with rAF loop, visibilitychange pause, resize re-scale, cleanup on unmount
- `tests/setup/canvasMock.ts` — 49 lines — minimal HTMLCanvasElement 2D stub for jsdom tests (see Finding #5)
- `tests/ui/util/formatNumber.test.ts` — 97 lines — 21 tests covering SPRINTS.md examples + precision rules + boundary transitions + trim + edge cases + determinism
- `tests/ui/canvas/dpr.test.ts` — 41 lines — 2 tests (DPR scaling + fallback when devicePixelRatio is 0)
- `tests/ui/canvas/glowCache.test.ts` — 81 lines — 7 tests (cache hit/miss, size/halfSize, FIFO eviction)
- `tests/ui/canvas/renderer.test.ts` — 127 lines — 10 tests (background clear, neuron-count mapping, glow+stroke+fill per neuron, pulse varies radius, deterministic positioning)
- `tests/ui/canvas/NeuronCanvas.test.tsx` — 47 lines — 4 tests (mount, visibility listener, resize listener, rAF cleanup)

**Files modified:**
- `src/ui/tokens.ts` — MOTION adds `pulseRadiusAmp: 0.1`, `pulseOpacityMin: 0.7`, `pulseOpacityMax: 1.0`; new CANVAS token block (glow multiplier, cache max, neuron radii map, stroke width + fill opacity, scatter layout params)
- `src/App.tsx` — replaced placeholder `<p>Thoughts: ...</p>` with `<NeuronCanvas />`; styled via CSS variables (`var(--color-bg-deep)`, `var(--font-body)`, etc.) rather than inline hex
- `vitest.config.ts` — added `.tsx` to test include + `setupFiles: ['./tests/setup/canvasMock.ts']`

**Gates at Phase 2 close:**
- `npm run typecheck` — 0 errors
- `npm run lint` — 0 warnings
- `bash scripts/check-invention.sh` — 4/4 PASS, Gate 3 ratio **0.86** (identical to Phase 1 close)
- `npm test` — **227 passed / 54 skipped** (up from 183 — 44 new Phase 2 tests)
- `npm run build` — 164.19 KB JS (+3.35 KB, 54.31 KB gzipped) + 13.59 KB CSS (5.36 KB gzipped) + ~131 KB fonts
- `npm run dev` + HTTP smoke: dev server ready in 448ms, `/` returns 200, `/src/main.tsx` transforms cleanly

**Runtime smoke check:** dev server serves the bundle. `createDefaultState().neurons[0] = { type: 'basica', count: 1 }` confirms the auto-granted Básica is present, so the canvas renders 1 pulsing blue (`--bl`) circle at 8px radius per UI-9 step 3. Full visual fps measurement deferred to Phase 7 (dedicated performance spike on Pixel 4a emulator per Sprint 2 checklist).

#### Phase 2 findings (2 total)

**Finding #5: jsdom `canvas.getContext('2d')` returns null without node-canvas.** Initial test run showed 16 failures in renderer/dpr/glowCache/NeuronCanvas suites — all traced to jsdom's canvas stub returning null on `getContext('2d')` (needs native node-canvas peer for real context, but that adds native build steps we don't need for structural tests). Resolution: created `tests/setup/canvasMock.ts` — a minimal method-stub context with just the shapes used by Phase 2 code (fillRect, beginPath, arc, fill, stroke, drawImage, createRadialGradient, setTransform, scale). Registered via `vitest.config.ts` `setupFiles`; guarded by `typeof HTMLCanvasElement !== 'undefined'` so node-environment tests are unaffected. Real-browser rendering fidelity (pixel-exact glow gradient, true DPR behavior) is deferred to Vitest Browser Mode in a later phase when HUD tests bring it in scope (Sprint 2 checklist item 3 — HUD renders in real Chromium).

**Finding #6: Gate 3 briefly regressed to 0.71 — three stray literals in new Phase 2 code caught by the gate.** Hits were: `padding: 16` in App.tsx (CSS number), `~67% opacity` in a glowCache.ts inline comment (the `67` was caught), and `width: '100%'`/`height: '100%'` in NeuronCanvas.tsx inline styles. All three are CSS values per CODE-1's "CSS values" exception, but the gate grep doesn't know context. Resolutions: `padding: var(--spacing-4)` (uses tokens), comment rewritten without percentage digits, Tailwind `w-full h-full` classes replace inline `'100%'`. Ratio restored to 0.86 — identical to Sprint 1 close and Phase 1 close. This is a healthy drill: the canvas renderer itself uses only CANVAS/MOTION tokens (all hits `// CONST-OK`-annotated for math intrinsics like `2π` and `/ 2`), proving the token-driven architecture works even for frame-loop code.

**Cumulative Sprint 2 findings: 7** (Phase 1: 4 — vitest pin, Tailwind v4, vite-env types, Gate 3 regression from tokens.ts; Phase 2 pre-code: 1 — mockup drift; Phase 2 implementation: 2 — jsdom canvas mock, Gate 3 CSS-literal drill). All caught pre-commit; zero shipped bugs.

**Deferred to later phases:**
- Vitest Browser Mode with real Chromium (Phase 5 HUD requires it per Sprint 2 checklist)
- Canvas performance spike: 100 nodes + full glow on Pixel 4a emulator (Phase 7)
- Per-frame fps profiling via Chrome DevTools (Phase 7)
- Multi-neuron scatter layout tuning (Phase 3 — renderer currently has a golden-angle placeholder)
- Tap hit-area layer with 48dp / 44pt minimums (Phase 3 — CODE-4 touch targets)

**Next action:** Phase 3 — tap handler + focus fill animation (formatNumber/wrapText integration to HUD comes in Phase 5).

---

### 2026-04-17 — Sprint 2 Phase 2 (pre-code): neuron color mapping + mockup drift correction

Five neuron types mapped to canonical palette values after `UI_MOCKUPS.html` canvas section analysis + GDD §5 thematic review. Mapping preserves narrative Era arc (violet → cyan → white-gold at P26):

| Type | Hex | Token | Radius | Role |
|---|---|---|---|---|
| Básica | `#4090E0` | --bl | 8px | Foundational/calm |
| Sensorial | `#22B07A` | --t | 10px | Biological perception |
| Piramidal | `#8B7FE8` | --p | 12px | Primary workhorse |
| Espejo | `#E06090` | --pk | 14px | Reflective/empathic |
| Integradora | `#40D0D0` | --cy | 16px | Era 2 integration foreshadow |

Amber `--a` reserved HUD-only (thoughts counter + Discharge button). Mockup's amber neuron circle (canvas line 46) identified as likely Flujo Eureka Mental State representation — pre-recorded design note for Sprint 7 MENTAL-4 implementation: Flujo Eureka should render as temporary amber glow on all neurons, honoring the mockup's visual intent and reinforcing "amber = peak attention moment".

Radii progression `tier × 2 + 6 px` is visual only. Hit-area enforcement per CODE-4 + iOS 44pt / Android 48dp minimums is a separate Phase 3 concern (expanded collision detection around each neuron, independent of visual radius).

**Mockup drift corrected (5th Sprint 2 finding):** `docs/UI_MOCKUPS.html` lines 42 + 47 used `#4060E0` (non-canonical) instead of `--bl #4090E0`. Both occurrences replaced in this same commit. Visual difference is ~12% darker blue, not player-observable at 10px circle size. Fix establishes the precedent "canonical palette drift is a bug, not tolerated" — important to cut the pattern now while the repo is small rather than propagate when components are later copied from the mockup.

Files updated in pre-code commit:
- `src/ui/tokens.ts` — 5 neuron color entries added (62 total tokens, up from 57)
- `docs/GDD.md` §3b — neuron color table + rationale + era arc supersedes prior "deferred" comment
- `docs/UI_MOCKUPS.html` — `#4060E0` → `#4090E0` (2 replacements)
- `styles/_theme.generated.css` — regenerated, gitignored (build artifact)

**Cumulative Sprint 2 findings: 5** (Phase 1: vitest pin, Tailwind v4, vite-env types, Gate 3 regression; Phase 2 pre-code: mockup drift). All caught before any canvas code written. Canvas implementation (renderer.ts, glowCache.ts, NeuronCanvas.tsx, formatNumber.ts) follows in Phase 2 implementation commit.

---

### 2026-04-17 — Sprint 2 Phase 1: design tokens + Tailwind v4 + font system

Phase 1 scaffolds the visual system for Sprint 2 without touching the frozen engine. Canonical palette sourced from `docs/UI_MOCKUPS.html` (pre-existing project canonical — verified via `grep :root` before any code was written). GDD §3b created to formalize the palette as a documentation section; UI-3 formalized from heading to explicit rule; UI-2/UI-10/TAB-1/TAB-2 flagged as non-existent in §29 to prevent re-fabrication.

**Architecture:** `src/ui/tokens.ts` is the single source of truth for design tokens (colors, typography, spacing, radii, motion). Tailwind v4 `@theme` block is auto-generated via `scripts/generate-tailwind-theme.ts` (npm script `build:tokens`, runs before `dev` and `build`). Bridge preserves "tokens.ts is source of truth" contract under v4's CSS-first config model.

**Files added:**
- `src/ui/tokens.ts` — 130 lines, 57 tokens (22 colors + 11 spacing + 6 radii + 3 fonts + 8 sizes + 7 weights)
- `src/vite-env.d.ts` — ambient declarations for CSS + fontsource side-effect imports
- `scripts/generate-tailwind-theme.ts` — ESM-safe token generator (fileURLToPath for `__dirname`)
- `styles/tailwind.css` — v4 entry with `@import "tailwindcss"` + generated theme + base styles
- `styles/safe-area.css` — className-based utilities for notched devices (UI-9 prep)

**Files modified:**
- `package.json` — `build:tokens` script, `dev`/`build` auto-run tokens; deps added: `@tailwindcss/vite`, `tsx`, `@fontsource-variable/outfit`, `@fontsource-variable/jetbrains-mono`, `tailwindcss@^4`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@vitest/browser@3.2.4` (pinned), `playwright`; deps removed: `postcss`, `autoprefixer` (v4 bundles equivalents)
- `vite.config.ts` — `@tailwindcss/vite` plugin
- `src/main.tsx` — font + Tailwind CSS imports at top
- `src/config/constants.ts` — `splashDurationMs: 2_000` + `firstOpenTutorialHintIdleMs: 2_000`
- `.gitignore` — adds `styles/_theme.generated.css` (build artifact)
- `scripts/check-invention.sh` — Gate 3 now excludes `src/ui/tokens.ts` in parallel to existing `src/config/` exclusion
- `CLAUDE.md` — new "Canonical storage file rule" section documents the exclusion pattern for future sprints
- `docs/GDD.md` — §3b created (visual identity), §29 UI-3 formalized + fabrication flag for UI-2/UI-10/TAB-1/TAB-2, §31 two new UI constants, TOC updated

**Bundle sizes (Sprint 1 baseline → Phase 1):**
- JS: 160.84 KB → 160.84 KB (unchanged; no component code added, Tailwind tree-shaken since no utilities referenced yet)
- CSS: 0 KB → 13.45 KB (5.30 KB gzipped) — Tailwind preflight + `@theme` variables + base styles
- Fonts: 0 KB → ~131 KB woff2 total across Latin/Latin-ext/Cyrillic/Greek/Vietnamese subsets (lazy-loaded by browser per locale)
- Total new static assets: ~145 KB over Sprint 1 baseline, well under 2 MB budget

#### Phase 1 findings (4 total)

**Finding #1: `@vitest/browser` version pin.** Initial install of `@vitest/browser` without a version pulled 4.1.4 (peers vitest@4.x); installed vitest is 3.2.4. npm peer-conflict explainer tripped its own bug (`TypeError: Cannot read properties of null (reading 'explain')`), aborted install cleanly. Resolution: pin `@vitest/browser@3.2.4` to match installed vitest. Lesson: in a mixed-major npm ecosystem, pin any package whose major tracks another package you have installed.

**Finding #2: Tailwind v4 architecture divergence.** Initial Phase 1 plan assumed Tailwind v3 with `tailwind.config.js` importing from `tokens.ts`. After `npm install` fetched v4.2.2 (v4 default since Q1 2025 per Tailwind docs), Claude Code halted on the architectural divergence rather than guessing. Decision: adopt v4 with build-script bridge. Preserves `tokens.ts` as single source of truth, maintains canonical palette fidelity, adds ~30 min of infra for 2-5× build speed + lifetime v4 compatibility. Downgrading a greenfield project to maintenance-mode v3 for one sprint's convenience was rejected. v4 gotcha noted: `@theme` blocks across CSS imports fail (GitHub #18966). Architecture avoids this: single `_theme.generated.css` imported directly into `tailwind.css`; `safe-area.css` is className-based utilities, not `@theme`.

**Finding #3: `vite-env.d.ts` required for CSS + fontsource imports.** `tsc -b` failed with `TS2307: Cannot find module '@fontsource-variable/outfit' or its corresponding type declarations` (and three more for CSS imports + JetBrains Mono). Fontsource packages ship CSS only, no `.d.ts`. Resolution: created `src/vite-env.d.ts` with `/// <reference types="vite/client" />` plus ambient `declare module '*.css'` and per-package declarations for the two fontsource imports. Standard Vite pattern; Sprint 1 simply hadn't needed it (no CSS imports existed).

**Finding #4: Gate 3 regression from `src/ui/tokens.ts`.** Adding canonical design tokens caused Gate 3 ratio to regress from 0.86 → 0.27 because 32 hex/numeric literals inside the tokens file were counted as "inventions". Root cause: same class as Sprint 1 Phase 8 Gate 3 bug (config/ literals counted against ratio). The architectural invariant "canonical storage files should be excluded from invention counting" needs to extend to UI tokens as it already does to game config. Fix: added `| grep -v "ui/tokens.ts"` exclusion to Gate 3 in `scripts/check-invention.sh`, parallel to existing `grep -v "src/config/"` line. Updated Gate 3 comment to document both canonical-storage exclusions. Gate 3 ratio restored to 0.86 post-fix. Formalized the pattern as a rule in `CLAUDE.md` ("Canonical storage file rule") so Sprint 6+ can't hit it again when adding e.g. audio.ts or achievement manifests.

**Kickoff-prompt fabrications corrected before code written:** Nico's Sprint 2 kickoff prompt contained 5 fabrications (§3 "Visual identity" misattribution, UI-2/UI-10/TAB-1/TAB-2 inventions, initial palette proposal from incomplete context). All caught during pre-flight verification against `docs/UI_MOCKUPS.html`. Canonical palette (`--p: #8B7FE8` violet primary, `--a: #F0A030` amber thoughts, `--t: #22B07A` green rate, `--cy: #40D0D0` consciousness-bar highlight) was documented in `UI_MOCKUPS.html` since earlier sessions; §3b formalizes it as a doc-tier section. Without this catch, Phase 1 would have shipped a sky-blue primary + IBM Plex body font that broke `NARRATIVE.md:476` ("consciousness bar is no longer purple — it's white-gold" at P26 — the violet default is what that line refers to).

**Cumulative Sprint 1/2 findings: 10 total.** Breakdown:
- GDD content gaps: 4 (THRES-1 6.3B stale, softCap 1723.6 fabrication, cycleTime structural, insightMultiplier omission — all Sprint 1)
- Tooling script: 3 (Sprint 1 Phase 8 caught 2 — comment-filter regex + `src/config/` exclusion; Sprint 2 Phase 1 catches 1 — `src/ui/tokens.ts` exclusion)
- Ecosystem / dep divergence: 2 (vitest/browser pin, Tailwind v4 major-version architecture)
- Ambient typing gap: 1 (vite-env.d.ts for Sprint 2's new CSS/font imports)
- Kickoff-prompt fabrications caught before code: 2 (§3 misattribution, palette invention — neither reached the code)

Zero bugs shipped. Anti-invention framework working as designed. Second prompt-side fabrication strengthens the case that kickoff prompts warrant the same verification discipline as code — pattern added to PROGRESS.md watch list below.

**Gates at Phase 1 close:**
- `npm run typecheck` — 0 errors
- `npm run lint` — 0 warnings
- `bash scripts/check-invention.sh` — 4/4 PASS, Gate 3 ratio 0.86
- `npm test` — 183 passed / 54 skipped (identical to Sprint 1 baseline)
- `npm run build` — succeeds, 160.84 KB JS + 13.45 KB CSS + ~131 KB fonts

**Next action:** Phase 2 — `formatNumber()` + `wrapText()` utils + unit tests (Sprint 2 test checklist items 1, 2). Nico's confirmation required before proceeding.

---

### 2026-04-17 — Sprint 1 complete (Phase 8)

Phase 8 closes Sprint 1. Three parts ran sequentially: consistency test un-skip, husky + pre-commit hook, post-sprint ritual.

**Part 1 — Consistency tests:** 59 tests un-skipped (constants, production, threshold, RNG snapshots, store, tick, file-structure invariants). 54 remain skipped with `BLOCKED-SPRINT-X` markers: Sprint 3 (6), Sprint 4a (6), Sprint 5 (6), Sprint 6 (16), Sprint 7 (11), Sprint 8b (7), Sprint 8c (2), Sprint 10 (6). 0 deleted as obsolete. Three test-side fixes while un-skipping:
- ECO-1 monotonicity rewritten as index-1-onward + explicit tutorial-override discontinuity test (the table is deliberately non-monotonic at [0] → [1] because [0] is only consulted by TUTOR-2).
- `productionPerSecond` and POSTLAUNCH file scans strip comments before regex to avoid false-positives on intentional boundary-explaining documentation.

**Part 2 — Husky pre-commit:** Installed husky@9.1.7 + lint-staged@16.4.0 (devDeps). `.husky/pre-commit` runs typecheck → lint → check-invention → test, fail-fast. Verified end-to-end by the commit that introduced it (hook auto-ran against itself).

**Phase 8 finding — scripts/check-invention.sh had two bugs:**
- Gate 1 and Gate 3 comment-filter regexes (`^\s*//`, `^\s*\*`) never matched because grep output format is `file:lineno:content` — the `^` anchor sat on the filename prefix, not the code line. Fixed with prefix-aware patterns (`^[^:]+:[0-9]+:\s*//` etc.). Before fix: 62 false-positive hits (comments). After: 12 real hits.
- Gate 3 counted `src/config/` literals as "uncaptured", making the 0.8 ratio target mathematically unreachable — config files ARE the designated home for spec values (that's where Gate 1 directs inventions TO). Fixed by excluding `src/config/` from the literal count.

**Engine constants cleanup:** After fixing the grep, the real 12 hits were triaged as (a) algorithm intrinsics annotated `// CONST-OK` with rationale (mulberry32 bit-shifts, FNV-1a offset basis + prime, 2^32 normalizer, softCap anchor 100, ms→sec divisor 1000, variance `** 2`), (b) spec values lifted into `SYNAPSE_CONSTANTS` (`era3StartPrestige: 19`, `era3EndPrestige: 26`, `consciousnessBarTriggerRatio: 0.5`, `piggyBankMaxSparks: 500`, `piggyBankSparksPerThoughts: 10_000`), (c) §32 DEFAULT_STATE non-trivial values tagged `// CONST-OK` citing their §32 authority. Gate 3 ratio post-fix: 0.86.

**Part 3 — Post-sprint ritual:** `npm run build` produces 160.84 KB bundle (52.92 KB gzipped). All 4 gates green. Typecheck 0 errors. Lint 0 warnings. 183 tests pass.

**Cumulative Sprint 1 doc gaps: 4** (THRES-1 6.3B stale, softCap 1723.6 fabrication, cycleTime structural, insightMultiplier omission). All 4 were pre-existing doc errors caught during implementation; zero implementation bugs shipped. Sprint 11a snapshot-validation-gate elevation (from v1.1 deferred to Sprint 11a must-have) remains justified by this rate.

**Next sprint:** Sprint 2 (Canvas + HUD + Performance Spike) per `docs/SPRINTS.md`.

### 2026-04-17 — Phase 7 Sprint 1: save/load verified; Node smoke test limitation noted

Save system round-trip verified via vitest suite (24 tests passing, including 110-field preservation, `insightMultiplier=1` survival, tuple/record type preservation).

Tooling note for future sessions: `npx tsx -e "..."` with import of `@capacitor/preferences` hangs silently in raw Node (package's web fallback expects browser `localStorage` global). Any Node-based CI smoke script touching the save module MUST mock Capacitor before import, e.g.:

```ts
vi.mock('@capacitor/preferences', () => ({ Preferences: { /* ... */ } }))
```

or for vanilla Node (no vitest):

```ts
globalThis.Preferences = { set: async () => {}, get: async () => ({ value: null }) };
```

For browser runs (`npm run dev`) and native builds, no workaround needed — package works as designed.

### 2026-04-17 — Phase 6 Sprint 1: insightMultiplier default omission resolved

Fourth Sprint-1 doc-vs-spec gap detected (after THRES-1 stale 6.3B, softCap 1723.6 fabrication, cycleTime structural). This one is a coverage gap — §32 DEFAULT_STATE block enumerated 11 non-trivial initial values, but `insightMultiplier` should have been the 12th.

Three sources of truth all point to `insightMultiplier = 1` as the rest state:
- §33 PRESTIGE_RESET writes `insightMultiplier: 1` on prestige
- §35 TICK-1 step 2 clears to "multiplier=1" on Insight expiration
- Identity semantic: `1` = no-op multiplier; `0` would zero production silently if a future caller forgets the `insightActive` guard

Resolution: `createDefaultState()` sets `insightMultiplier: 1` (12th non-trivial initial value). §32 block updated. No implementation beyond adding one line + incrementing the count.

Claude Code caught this via pre-flight ambiguity check per the Phase 6 prompt's rule (1) on ambiguous defaults. The gap would otherwise have produced a first-cycle state with `insightMultiplier=0` that differs from every post-prestige state (always 1) — invisible in normal play (guarded by `insightActive`), but would have caused subtle failures if the guard slipped.

**Tick test helper audit (FIX 3):** both `makeState` helpers in `tests/engine/tick.test.ts` and `tests/engine/tick-order.test.ts` already had `insightMultiplier: 1` pre-emptively set during Phase 5. Claude Code picked the safe identity value by instinct during Phase 5 fixture construction; no update needed here.

Cumulative Sprint 1 doc gaps: 4 (Phase 2 prep 6.3B, Phase 4 softCap 1723.6, Phase 5 cycleTime structural, Phase 6 insightMultiplier omission). Confirms Sprint 11a snapshot-validation-gate elevation remains well-placed. All 4 gaps were structural/numeric quality issues in pre-existing docs, not implementation errors.

### 2026-04-17 — Phase 5 Sprint 1: cycleTime spec gap resolved (Option B)

Third Sprint-1 doc gap detected (after THRES-1 stale 6.3B and softCap fabrication). This one is structural, not a value error.

GDD §35 TICK-1 steps 1, 9, 10 reference `state.cycleTime`, but §32's 110-field enumeration does not declare it. Adding cycleTime as field 111 would have cascaded to §33 PRESTIGE split, DEFAULT_STATE, consistency tests, INIT-1, and 8+ other locations — all for state that is trivially derivable.

Resolution: cycleTime is DERIVED at each use site as `nowTimestamp - state.cycleStartTimestamp`. Matches the pattern used in Step 6 Discharge (`nowTimestamp - dischargeLastTimestamp`). 110-field invariant preserved.

Semantic change: `lastSpontaneousCheck` reinterpreted from "cycleTime-of-last-check" to "absolute nowTimestamp-of-last-check". Seed chain `hash(cycleStartTimestamp + lastSpontaneousCheck)` still deterministic. §32 field comment updated. §35 TICK-1 steps 1, 9, 10 texts updated. §8 tick-logic code block updated to match.

Implementation: `tick.ts` step 10 now mutates `state.lastSpontaneousCheck = nowTimestamp` (previously stubbed — the stub was honoring the cycleTime spec that couldn't be satisfied without inventing state). Step 9 first-tick check uses `(nowTimestamp - cycleStartTimestamp) < 1000`. Step 1 is an informational no-op.

`NEURON_BASE_RATES` moved from inline `tick.ts` constant to `src/config/neurons.ts` (new file, Sprint 1 scope per review). Sprint 3 will extend neurons.ts with unlock conditions, display metadata, and cost-scaling helpers.

Cumulative Sprint 1 doc-vs-code gaps: 3 (Phase 2 prep 6.3B, Phase 4 softCap 1723.6, Phase 5 cycleTime structural). Confirms the Sprint 11a snapshot-validation-gate elevation is well-placed.

### 2026-04-17 — Phase 4 Sprint 1: softCap doc-level fabrication detected and corrected

Phase 4 implementation of softCap per GDD §4 formula produced values that differed from doc-stated "Verified values":
- GDD claimed `softCap(10_000) ≈ 1723.6`
- Empirical: `softCap(10_000) = 2754.229` (60% off from claim)

Independent verification confirmed the implementation is correct (formula: `100 × (x/100)^0.72`, exponent constant `0.72` per §31). The doc values were fabricated — likely computed with exponent ~0.62 at writing time and never re-verified when the canonical exponent settled at 0.72.

This is the **second doc-level fabrication** detected during Sprint 1 (first was `calculateThreshold(25,2)` stale 6.3B corrected in Phase 2 prep). Same class as Batch 2 2B-6 mulberry32 snapshot error that was self-flagged during the second audit.

**Actions taken:**
- GDD §4 "Verified values" section corrected to empirical values
- `consistency.test.ts` softCap stubs updated (lines ~179-189)
- No implementation change — code was always correct

**Implication for planning:** elevate Batch 5 6A-2 (snapshot validation gate) from "v1.1 POSTLAUNCH deferred" to "Sprint 11a must-have". Two fabrications in Sprint 1 phases 2-4 demonstrates the pre-launch risk of silent doc drift is higher than estimated. The minimal version (15 min per GDD §35 note) of the gate is a clear-win.

### 2026-04-17 — Phase 3 Sprint 1: pickWeightedRandom signature divergence resolved

GDD §30 RNG-1 originally specified `pickWeightedRandom` with a spontaneous-event-specific signature (`SpontaneousEventType` constraint + category weights argument). Phase 3 implementation used the generic composable signature `<T>(items: {item: T, weight: number}[], seed: number): T` per Phase 3 brief.

The generic version is strictly more general — the original two-step category pick can be composed from `pickWeightedRandom` + `randomInRange`. GDD §30 updated to reflect the implemented signature with an inline composition recipe for two-step picks.

Sprint 6 (spontaneous events) will implement `pickSpontaneousEvent()` in `src/engine/spontaneousEvents.ts` using this composition pattern.

No behavioral change vs spec — outcomes identical given same seed. Flagged in case Sprint 6 auditor needs context.

### 2026-04-17 — Sprint 1 prep: doc fixes caught during pre-implementation read

Post-audit doc fixes caught while reading GDD/SPRINTS/consistency_test.ts end-to-end before starting Sprint 1. No code written yet.

- **THRES-1 stale example value (Batch 3 4A-1 followup):** GDD §9 and SPRINTS.md §Sprint 1 both cited `calculateThreshold(25, 2) === 6_300_000_000` with comment "1.05B × 6.0". Batch 3 4A-1 rebalanced `baseThresholdTable[25]` from 1.05B to 7.0B, making the correct value `42_000_000_000` (7B × 6.0). Fixed both locations; comment updated to "7B × 6.0". The consistency test at `tests/consistency.test.ts:242` already asserted the new 7B value — no test change required there.
- **consciousnessThreshold stub deleted from consistency test:** Per Batch 2 2B-3, `consciousnessThreshold` was removed from SYNAPSE_CONSTANTS as a duplicate of `baseThresholdTable[0]`. The `test.skip` stub referencing it was orphaned and has been deleted. Consciousness bar trigger uses CORE-10 (`0.5 × currentThreshold`), not a separate constant.

**Files modified:** `docs/GDD.md` (§9 line 341), `docs/SPRINTS.md` (§Sprint 1 line 188), `tests/consistency.test.ts` (deleted orphan stub).

**Outcome:** Docs now internally consistent with Batch 2/3 rule set. Sprint 1 implementation can proceed.

### 2026-04-17 — Second senior audit (22 findings across 5 batches)

- 22 findings total: 1 BLOCKER, 5 CRITICAL, 9 HIGH, 4 MEDIUM, 2 LOW, 1 IMPROVEMENT (deferred)
- All 21 non-deferred findings approved and applied; 1 improvement (6A-2 snapshot gate) moved to POSTLAUNCH v1.1
- Files modified: docs/GDD.md, docs/SPRINTS.md, docs/NARRATIVE.md, docs/POSTLAUNCH.md, docs/PROGRESS.md, CLAUDE.md, README.md, tests/consistency.test.ts
- 16 new rules added + 2 amendments: TUTOR-2, TAP-2, CORE-10, THRES-1, TICK-1, RNG-1, ACH-1..4, ECO-1, SCHED-1, INIT-1, ANALYTICS-5, MONEY-10 + CORE-8 amended + MONEY-8 expanded
- Empirical economy simulation run via node for P0→P1 (5 scenarios, 5.9-20 min), P1→P2 (4 scenarios, 10-34 min), P9→P10 (4 scenarios, 6.9-29 min). baseThresholdTable rebalanced against simulation data (all 26 values updated).
- One self-caught invention: fabricated mulberry32 snapshot values in Batch 2 were corrected via node-verified computation before publication. Recorded transparently.
- Timeline corrected: 67→76 sprint days + 4 buffer days = ~80 days end-to-end. SCHED-1 rule added with 2 mandatory buffer windows.
- PRESTIGE_RESET/PRESERVE/UPDATE split corrected: 45/60/4/1 = 110 (was 45/61/3/1).
- GameState field count preserved at 110 (no new fields added; `diaryEntries` piggyback used for achievement tracking).
- Analytics count: 47 → 48 (pattern_decisions_reset added to Core, was missing from §27).
- v1.0 endings: 5 → 4 (resonance moved to v1.5+ scope, EndingID type narrowed).

**Outcome:** 0 open issues. Ready for Sprint 1.

### 2026-04-17 — Senior audit (33 findings across 10 phases)
- 33 findings total: 5 CRITICAL, 5 HIGH, 13 MEDIUM, 4 LOW, 4 IMPROVEMENT, 1 consistency pass, 1 closing
- All 33 approved and applied
- Files modified: GDD.md, CLAUDE.md, SPRINTS.md, PROGRESS.md, NARRATIVE.md, consistency_test.ts, check-invention.sh, POSTLAUNCH.md
- Key changes: baseThresholdTable added (progression curve), PRESTIGE_RESET fixed (2 missing fields), maxOfflineHours 12→16, Sprint 8b split into 8b+8c, Equilibrada buffed ×0.7→×0.85, P24 mechanic improved, Crashlytics + Remote Config added, MIG-1 save merge strategy, Apple compliance MONEY-9, tutorial hints, error states, first-open sequence, streak save ad
- Timeline: 65→67 days, 20→21 sprints
- Cross-doc consistency verified: 47/48 automated checks passed, 0 real inconsistencies

**Outcome:** Ready for Sprint 1. No open issues.

### 2026-04-16 — Documentation restructure
- Consolidated 8 files (5,545 lines, ~469 KB HTML+MD) into 4 markdown + 1 HTML mockup
- Resolved 11 bugs, filled 9 spec gaps, addressed 8 interaction issues
- Created CLAUDE.md (166 lines, within 200-line best practice)
- Created GDD.md (2,230 lines) with 36 sections including complete types, constants, PRESTIGE_RESET spec
- Created SPRINTS.md with 20 sprints (originally 14; Sprints 4, 8, 9, 11 split into sub-sprints for risk isolation and smaller Claude Code sessions), each with AI/Sprint/Player checks
- Created NARRATIVE.md (491 lines) with all 57 fragments + 30 Echoes + 5 Endings
- Created POSTLAUNCH.md with v1.1/v1.5/v2.0/v2.5 roadmap clearly marked
- Archived SENIOR_EVAL.html and QA_IMPLEMENTATION.html to docs/archive/
- Added .claude/settings.json and .claudeignore
- Set up PROGRESS.md (this file) for session continuity

**Outcome:** Ready for Sprint 1. No open issues. Designer decisions documented for review.

---

## Known gotchas / things to not forget

- Sprint 1 must assert `Object.keys(DEFAULT_STATE).length === 110` (not 105)
- Sprint 1 must include `baseThresholdTable` (26 values) in constants — progression curve depends on it
- Sprint 1 must assert `PRESTIGE_PRESERVE.length === 60` (reduced from 61 by Batch 1 2B-1)
- Sprint 1 must assert `PRESTIGE_UPDATE` touches 4 fields: `prestigeCount`, `currentThreshold`, `cycleStartTimestamp`, `isTutorialCycle`
- Sprint 1 `DEFAULT_STATE.isTutorialCycle = true` (starts true for first-ever cycle; flips to false on first prestige — TUTOR-2)
- Sprint 1 `calculateCurrentThreshold(state)` must check `isTutorialCycle === true` BEFORE baseThresholdTable lookup — TUTOR-2
- Sprint 1 tap handler must implement TAP-2: `max(baseTapThoughtMin, effectivePPS × baseTapThoughtPct)` thoughts per tap, replaced by `potencialSinapticoTapPct` when owned, multiplied by `sinestesiaTapMult` when Sinestesia active
- Sprint 4a must follow PREST-1 order exactly (11 steps in handlePrestige); step 9 now also sets `isTutorialCycle = false` (TUTOR-2 one-way flip)
- Sprint 4a: PRESTIGE_RESET includes `currentOfflineCapHours` and `currentOfflineEfficiency` (added by audit)
- Sprint 4a: `lifetimePrestiges` is NOT in PRESTIGE_PRESERVE — it's incremented separately
- Sprint 8b implements Transcendence + Resonance (NOT Resonant Patterns or TEST-5 — those are Sprint 8c)
- Sprint 8b implements 4 Run-exclusive upgrades, not 6 (the other 2 are v1.5+)
- Sprint 8c runs TEST-5 simulation + implements 4 Resonant Pattern checks
- Sprint 9b is 4 days (not 3). Daily Login moved to Sprint 10.
- Sprint 10 has 48 analytics events (9+11+5+20+3 breakdown; was 47 pre-Batch-4, added `pattern_decisions_reset` to Core 9A-2)
- Starter Pack shows post-P2, not post-P1 (tonal fix — see constant `starterPackShownAtPrestige: 2`)
- Mental State UI label is "Flujo Eureka", not "Eureka" (differentiates from spontaneous event)
- Base offline cap is 4h (baseOfflineCapHours), max achievable is **16h** via upgrades (REM→8, Distribuida→12, sueno_profundo→16)
- productionPerSecond field does NOT exist — use baseProductionPerSecond OR effectiveProductionPerSecond
- TAP-1 anti-spam requires 30s sustain + <150ms avg + <20ms variance (tightened from original)
- Equilibrada is ×0.85 / pathwayCostMod 1.0 (changed from ×0.7 / 1.1 by audit)
- Cascade max multiplier is 6.0 (cascada_eterna 3.0 → Cascada Profunda doubles)
- `hito_20` upgrade does NOT exist — removed phantom reference from offline formula
- Genius Pass UI needs "All content free" badge (MONEY-9, Apple compliance)
- Monthly Spark cap resets 1st of each month UTC (MONEY-8)
- 7 ad placements (not 6) — 7th is streak save
- CycleSetupScreen uses step-by-step on <600px (CYCLE-2)
- First-open: 1 Básica neuron auto-granted (UI-9)
- Micro-challenges unlock at P15 (not available from P0)
- 21 sprints total, **~80 days** (76 sprint days + 4 buffer days per SCHED-1; first audit said 67 but that was a miscalculation — see Batch 3 5A-1)
