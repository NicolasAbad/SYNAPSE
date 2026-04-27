# Plan — SYNAPSE comprehensive pre-launch audit prompt (v2)

## Context

Nico asked for an expert audit prompt to use while he handles his manual carryover tasks. The first draft of the prompt was generic; he asked me to deepen it by reviewing the codebase + docs + game flow + bringing in idle-game success theory.

This v2 plan does that. Three Explore agents walked the codebase (game flow / architecture / retention+monetization) and surfaced ~25 concrete risks already named with file:line evidence. The prompt below pre-loads those findings as **"verify these specific claims"** anchors — the audit shouldn't have to rediscover them, just confirm/refute and dig further.

The prompt also embeds an **idle game success rubric** synthesized from the genre's leaders (Cookie Clicker, Adventure Capitalist, NGU Idle, Antimatter Dimensions, Realm Grinder, Idle Slayer, Melvor Idle, Kittens Game). The rubric is what the auditor measures SYNAPSE against, not just internal spec compliance.

## What the explorations confirmed about SYNAPSE

### Game flow (high-level)

- **First 5 minutes**: 2.6s splash → (GDPR if EU, currently `isEU=false`) → tutorial cycle. Tutorial threshold 25K thoughts, ×3.0 first-discharge mult, target 7-9 min P0→P1. Hints fire on idle-2s + on-action prompts (tap → buy → discharge → variety).
- **Early loop (P1-P9)**: Cycle Setup with progressively more slots: Polarity (P3+), Mutation (P7+), Pathway (P10+). 5 neuron types unlock progressively. ~35 upgrades. AwakeningScreen at prestige with momentum bonus.
- **Mid-game reveal (P10-P18)**: Pathway choice (Rápida/Profunda/Equilibrada with HARD blocks on categories — soft-lock risk). 5 Mental States. Mood (5 tiers, 0-100). Memory Shards (Hipocampo). Pre-commits (Prefrontal). Visual Foresight T1-T4. 5 Regions. Insight L2.
- **Late game (P19-P26 / Era 3)**: 8 Era 3 events (one per prestige). The Long Thought P24 = 45-min auto-prestige cap. P26 = Ending Screen (4 endings + 1 secret Singularity if all 4 RPs).
- **Transcendence (Run 2/3)**: thresholds ×3.5 then ×6.0. Resonance currency. 8 Resonance upgrades (P13+). 4 Run-exclusive upgrades.
- **Offline**: 4h base cap → 16h max. Efficiency stack (×2.5 final cap per OFFLINE-8). SleepScreen with Lucid Dream A/B choice. Procedural shard drip at 50% of active rate.

### Architecture (high-level)

- Strict layering: `config → engine → store → ui` (one-way deps).
- **Engine**: 37 files, all ≤199 lines, CODE-9 enforced (no Math.random / Date.now), 99% test coverage. 12-step tick reducer with correct ordering.
- **Store**: `gameStore.ts` 1,446 lines (justified CODE-2 exception for 133-field state). Action handlers wrap Capacitor/Firebase in try/catch. tickScheduler (100ms) + saveScheduler (30s + visibilitychange + beforeunload).
- **UI**: 85 components, 64 memo'd (~75%), separate rAF loop for canvas, glow cache, 80-node visible cap.
- **Platform adapters**: native-only guards (Capacitor.isNativePlatform), web/test inert, all try/catch wrapped (CODE-8).
- **Tests**: 2150 passing / 1 skipped (WC consumer), 6/6 anti-invention gates, fast-check property tests (50 invariants), determinism gate (10k ticks), save fuzz (1000 malformed), migration chain (8 anchors).

### Pre-flagged risks (from exploration — auditor must verify each)

#### CRITICAL / HIGH
1. **ArchetypeChoiceModal wiring unclear at P7** — code exists but integration with prestige flow unverified. If broken, players never see archetype choice. (game flow agent)
2. **Save validation is field-count only** — `validateLoadedState()` checks 133 keys but no per-field type validation. Malformed `thoughts: "NaN"` would surface as runtime crash. (architecture agent)
3. **Permission gate too late (P1+P3)** — first push permission ask happens AFTER P1 prestige. By then 30-40% have churned. No soft-prompt before native OS modal → 30-40% reflex-deny. (retention agent)
4. **Accessibility toggles status uncertain** — retention agent claimed they're "stubs"; PROGRESS.md says Sprint 10.5 wired them. Verify which is right.
5. **Modal stacking has no single source of truth** — multiple booleans in App.tsx state. Risk if prestige + offline return collide.
6. **Genius Pass dismissal stops offers permanently after 3 dismisses** — no "re-enable" path in Settings. May trip Apple Review (MONEY-9 compliance).

#### MEDIUM
7. **Splash 2.6s creates dead time** — no progress indicator, player unaware if loading or hung.
8. **Pathways create soft-lock on regions** — Rápida blocks `reg` category, Profunda blocks `tap`/`foc`/`syn`. No "what-if" preview on CycleSetupScreen.
9. **Tutorial hints have manual × dismiss** — if player dismisses hint #3 manually at P1, never told about Polarity / Patterns / Upgrades.
10. **Starter Pack 48h window expires silently** — no push reminder before expiry.
11. **Diary 500-entry circular buffer drops oldest silently** — no warning at cap.
12. **Mastery system invisible until first use** — players miss the +5% cap bonus.
13. **No tutorial skip affordance** — speedrunner archetype rage-quits.
14. **Spark monthly cap reset shows no countdown** — players don't know when cap resets.
15. **Pattern reset cost (1000 Resonance) has no 2-step confirm** — accidental reset = catastrophic.

#### LOW
16. **Audio context unlock has no try/catch on iOS denial path**.
17. **Capacitor Preferences write failure → silent data loss** (no `state.lastSaveError` flag).
18. **Native Crashlytics not integrated** — JS-only, native ANR/crashes invisible.
19. **Remote Config has no schema validation fallback** — malformed remote keys could load invalid types.
20. **Echoes / Cosmetics store has no in-game discovery** — buried in Settings.

### Spec gaps surfaced
- **Cloud sync MIG-1 (union/MAX merge) not implemented** — deferred. Risk zero until cloud save ships.
- **Era 3 mechanical effects partial** — `era3.ts` helper stubs exist but `era3Events.ts` strings → mechanical mapping unclear (e.g., what does P20 "Mirror Cycle" actually do mechanically?).
- **Region unlock visual onboarding** — regions unlock at 1% threshold but no toast/hint when first region available.
- **Spanish i18n** — `en.ts` exists, `es.ts` doesn't. Per-name approval discipline (CLAUDE.md) means it's deferred.

## Where to use this prompt

Pick any of:
- **Fresh Claude Code session** (best — full file access + can run `npm` scripts)
- **Claude.ai web with file uploads** (upload `CLAUDE.md`, `docs/GDD.md`, `docs/SPRINTS.md`, `docs/PROGRESS.md`, `docs/NARRATIVE.md`, `docs/POSTLAUNCH.md`, plus zips of `src/` + `tests/`)
- **ChatGPT / Gemini with project knowledge** (same upload list)
- **Human expert reviewer** (give them this prompt as the brief)

For best results: a fresh AI session that hasn't seen any of the project before, so it brings naive-fresh-eyes perspective.

---

## The prompt

Copy everything between `---PROMPT START---` and `---PROMPT END---`.

---PROMPT START---

# SYNAPSE — Comprehensive Pre-Launch Audit

## Your role

You are conducting a **pre-launch audit** of **SYNAPSE**, a mobile idle/incremental game (React 18 + TypeScript strict + Vite + Zustand + Canvas 2D + Capacitor 6, target iOS + Android). This is the last review before money is committed (store fees, marketing, store submission). **Be brutally honest** — false praise costs the developer more than blunt criticism.

You operate as a **multi-disciplinary expert**:
- **Senior idle/incremental game designer** — 10+ years on titles like Cookie Clicker, Adventure Capitalist, NGU Idle, Antimatter Dimensions, Realm Grinder, Idle Slayer, Melvor Idle, Kittens Game. You know what makes the genre work and where players churn.
- **Senior fullstack mobile engineer** — React + TypeScript + Capacitor, mobile WebView quirks, native config, save/load reliability, performance.
- **UX + accessibility specialist** — WCAG AA, mobile-native touch patterns, Apple HIG / Material guidelines, screen-reader compat, reduced-motion / colorblind / font-scale support.
- **F2P monetization analyst** — IAP funnel design, ad placement ethics, retention hooks, conversion-without-being-predatory.

---

## SYNAPSE — what you're auditing (1-paragraph elevator)

A neuroscience-themed idle/incremental: tap to fire neurons → buy more neurons → buy upgrades → fill Focus Bar → trigger Discharge bursts → eventually prestige (Awakening) → repeat across **3 Runs (Transcendences) × 26 Prestiges each**. Branching layers: 3 Polarities × 3 Archetypes × 3 Pathways × ~15 Mutations × Pattern Tree decisions × 5 Mental States × 5 Regions × 4 Resonant Patterns. Late-game: Era 3 (P19-P26) culminates in 4 endings + 1 secret. Monetization: RevenueCat IAPs + AdMob rewarded ads + Genius Pass subscription. F2P philosophy: 100% content reachable without spending (PHIL-1).

---

## What to read (in this order)

If you have file-system access, read these directly. If not, ask the user to paste / upload them.

1. **`CLAUDE.md`** — project rules + invariants (CODE-1 through CODE-9, anti-invention discipline, Glossary). 600+ lines. Read in full.
2. **`docs/GDD.md`** — full design (~3500 lines). Skim everything; deep-read §4 production / §6 focus / §7 discharge / §9 prestige / §11 polarity / §12 archetypes / §13 mutations / §14 pathways / §16 regions / §17 mental states / §22 resonant patterns / §23 Era 3 / §27 analytics / §32 GameState / §33 prestige split.
3. **`docs/SPRINTS.md`** — sprint plan + checklists. Especially **Sprint 11b** (next: device matrix) and POSTLAUNCH (v1.5+ scope boundary).
4. **`docs/PROGRESS.md`** — current state, deferrals, manual tasks. **Critical** for distinguishing implementation-pending from documented-deferred. Scan the entire log.
5. **`docs/NARRATIVE.md`** — story fragments, echoes, endings. Evaluate emotional arc + payoff.
6. **`docs/POSTLAUNCH.md`** — v1.5+ scope boundary. Anything found there is OUT OF SCOPE.
7. **Source tree (skim, then deep-dive based on findings):**
   - `src/engine/` — pure game logic (37 files, CODE-9 deterministic)
   - `src/store/gameStore.ts` — Zustand store, 133-field state, all actions (1446 lines, CODE-2 documented exception)
   - `src/store/saveGame.ts`, `src/store/migrate.ts` — persistence + 8-anchor migration chain
   - `src/store/tickScheduler.ts`, `src/store/saveScheduler.ts` — runtime hooks
   - `src/ui/` — React components (panels / modals / hud / canvas)
   - `src/platform/` — Capacitor adapters (audio, push, ads, IAP, crashlytics, remote config, perf)
   - `src/config/` — canonical constants + content tables + strings
   - `src/App.tsx` — top-level mount + hook wiring
8. **Tests:**
   - `tests/consistency.test.ts` — content-count + structural invariants
   - `tests/properties/` — fast-check property tests
   - `tests/engine/perfBudget.test.ts` — hot-path budgets
   - `tests/engine/determinism.test.ts` — CODE-9 enforcement
   - `tests/store/saveFuzz.test.ts`, `tests/store/migrationChain.test.ts` — save robustness
   - `tests/integration/tickRuntime.test.tsx` — TICK-RUNTIME-1 wiring
9. **Anti-invention infrastructure:**
   - `scripts/check-invention.sh` — 6/6 commit-blocking gates
   - `scripts/check-rule-coverage.sh` — GDD rule-ID coverage
   - `scripts/check-palette-drift.sh` — UI ↔ tokens drift
   - `scripts/buffer-1-prestige-sim.ts` — full P0-P25 sim

---

## Pre-flagged risks — verify each (highest leverage section)

A prior pass already surfaced these 20 risks with file:line evidence. **For each, your job is to (a) confirm or refute, (b) add severity if missed, (c) propose concrete fix with effort estimate.** Don't waste budget rediscovering — verify and dig deeper.

### CRITICAL / HIGH suspicion
1. **ArchetypeChoiceModal wiring at P7** — file exists (`src/ui/modals/ArchetypeChoiceModal.tsx`) but integration with prestige flow unconfirmed. **Verify**: trace where it's mounted + when it fires. If it doesn't fire at P7 prestige, it's a broken core mechanic.
2. **Save validation is structural-only** — `validateLoadedState()` in `src/store/saveGame.ts:54-67` checks field count (133) but not per-field types. Malformed cloud-merge → runtime crash on tick. **Verify**: feed a save with `thoughts: "NaN"` to migrate+validate; confirm it crashes downstream.
3. **Push permission gate fires AFTER P1** — `src/platform/usePushRuntime.ts` permission cadence (gate 1 after P1, gate 3 after P3). By P1, 30-40% of FTUE-cohort have churned. No soft-prompt before native OS modal. **Verify**: inspect mount sequence, confirm no soft-prompt component exists.
4. **Accessibility toggle status conflict** — `tests/properties/saveRoundtrip.properties.test.ts` and PROGRESS.md claim Sprint 10.5 wired them; one prior reviewer claimed "stubs". **Verify** by reading `src/platform/useAccessibilityRuntime.ts` + `styles/accessibility.css` + PolaritySlot/FocusBar/ConsciousnessBar/renderer.ts consumers. State the truth.
5. **Modal stacking — no single source of truth** — `src/App.tsx` has multiple booleans (`splashDone`, `gdprDone`, `settingsOpen`, `cosmeticsOpen`, `dailyLoginState`). **Verify**: can two modals render simultaneously? What if prestige fires while SleepScreen is open?
6. **Genius Pass max-3-dismissals has no Settings re-enable path** — after 3rd dismiss, offers stop forever. **Verify** there's no "Enable Genius Pass offers" toggle anywhere. May trip Apple Review (App Review 3.1.2 subscription transparency).

### MEDIUM suspicion
7. **Splash 2.6s dead time** — `SplashScreen.tsx`, no progress indicator. Player unaware if loading or hung.
8. **Pathways create soft-lock on category access** — `src/config/pathways.ts` Rápida blocks `reg`, Profunda blocks `tap`/`foc`/`syn`. Verify no preview/what-if before commit.
9. **Tutorial hints have manual × dismiss** — `src/ui/modals/TutorialHints.tsx`. If user dismisses hint #3 manually, are subsequent unlock hints (Polarity, Patterns) ever shown another way?
10. **Starter Pack 48h window expires silently** — `src/engine/starterPackTrigger.ts`. Verify no push reminder before expiry.
11. **Diary 500-entry circular buffer** — verify cap behavior + whether player is warned.
12. **Mastery invisible until first use** — `src/ui/panels/MasterySubtab.tsx`. Confirm there's no "use this 10x to unlock mastery" tooltip.
13. **No tutorial skip affordance** — confirm.
14. **Spark monthly cap reset has no countdown** — verify in `src/ui/modals/SparkPackPurchaseModal.tsx`.
15. **Pattern reset (1000 Resonance) has no 2-step confirm** — verify.

### LOW suspicion
16. **Audio context unlock no try/catch** — `src/ui/canvas/NeuronCanvas.tsx:54` calls `unlockAudioOnFirstTap()` unguarded.
17. **Capacitor Preferences write failure → silent data loss** — no `state.lastSaveError` field exposed.
18. **Native Crashlytics not integrated** — JS Crashlytics only, native ANR/JNI errors invisible.
19. **Remote Config schema not validated** — `src/platform/remoteConfig.ts` + `src/config/remoteConfigBounds.ts`.
20. **Cosmetics store buried in Settings** — no in-game discovery surface.

### Spec / docs gaps
- **Era 3 events: mechanical effects partial** — strings in `src/config/era3Events.ts` but `src/engine/era3.ts` may not implement all 8 events' mechanics. Trace each (P19 "First Fracture", P20 "Mirror Cycle", P21 "Silent Resonance", P22 "Dreamer's Dream", P23, P24 "Long Thought", P25 "Final Awakening", P26).
- **Cloud sync MIG-1 (union/MAX merge)** — GDD §31 spec, no implementation. Acceptable if cloud save isn't shipping in v1.0.
- **Region unlock visual onboarding** — regions unlock at 1% threshold but no in-game toast/hint.

---

## Audit dimensions (cover all 12)

For each dimension, evaluate **design intent** (GDD) + **implementation** (src/) + the **gap** + the **idle-game-genre best practice**.

### A. Core game loop & moment-to-moment feel
- Tap → produce → buy → discharge → prestige loop. Every step rewarding within ~5 seconds?
- Tap responsiveness on mobile (touch-action, hit areas, anti-spam TAP-1, haptics, +N tap floaters).
- Discharge timing + Cascade trigger (Focus Bar ≥ 0.75) — does the player FEEL the burst?
- Insight auto-activation — agency or "the game playing itself"?
- Audio cues (8 SFX per Sprint 10.2) — do they hit at the right beats?
- Empty-state edges — first 30 seconds before any neuron purchased; brand-new save.
- **Idle benchmark**: in Cookie Clicker the first cookie + first cursor + first grandma all fire within 60s. Does SYNAPSE match this dopamine rate?

### B. Progression & pacing (THE make-or-break dimension for idle games)
- P0 → P1 tutorial: target 7-9 min (TUTOR-2). Sprint 8c-tuning was DEFERRED — flag the open balance validation.
- P1 → P9 (early game): does upgrade unlock cadence keep the player interested?
- P10 → P18 (mid game): Insight L2 + Pathway choice + Patterns + Mental States. Complexity reveal cliff?
- P19 → P26 (late game / Era 3): does the 8-event arc earn the secret ending payoff?
- 3 Runs × Transcendence — meta-loop compelling or grindy on Run 2/3? `runThresholdMult` is [1.0, 3.5, 6.0, 8.5, 12.0, 15.0] — Run 2 is 3.5× longer.
- Sprint 8c-tuning deadlock notes in PROGRESS.md — what's the player risk if the as-shipped balance is misaligned?
- Offline progress (OFFLINE-1..11): cap+efficiency stack motivating or frustrating?
- Daily Login (Sprint 10.4): 7-day cycle [5,5,10,10,15,20,50] sparks — ramp right? Day 7 = 5× Day 1 — too steep or just right?
- **Idle benchmark**: AdCap pace ≈ first prestige at 8h. Cookie Clicker ≈ 1h. Antimatter Dimensions ≈ 30 min. Synapse first-prestige is 7-9 min — VERY fast, optimal for mobile retention. Verify the rest of the curve.

### C. Tutorial, onboarding, FTUE
- Splash → GDPR (EU only, currently `isEU=false`) → tutorial cycle. What's the time-to-fun? Time-to-first-meaningful-choice?
- Tutorial hint stack (8 hints across cycles 1-5): are any over- or under-explanatory?
- TUTOR-2 + tutorialDischargeMult = 3.0 — does the first Discharge feel earned?
- Hidden mechanics surfacing: Mood, Mental States, Patterns, Mutations, Polarity, Archetype, Pathway, Regions, Memory Shards, Pre-commits — list the intended reveal order and confirm each lands non-confusingly.
- "Aha" moments per cycle — list the intended ones and confirm each is telegraphed.
- Failure modes: what if the player closes the app mid-tutorial? What if they tap dismiss on critical hint?
- **Idle benchmark**: Realm Grinder reveals Faction choice gradually (3 cycles before mandatory). NGU Idle gates complexity behind levels (one new system per ~10 levels). Does SYNAPSE match this gradual reveal?

### D. Monetization & retention design
- IAP catalog (19 products per Sprint 9b.3 — currently DEFERRED on RevenueCat propagation).
- 5 ad placements (placement #7 = `streak_save`). Each placement non-coercive? MONEY-6 frequency cap respected?
- Genius Pass subscription value prop vs IAP packs. MONEY-9 max-3-dismissals enforcement.
- Starter Pack offer trigger — first prestige? P2? Validate the anchoring moment matches PEAK player engagement.
- Limited-Time Offers (Sprint 9b.5) — predatory pressure or genuine FOMO?
- Cosmetics store (18 entries per Sprint 9b.2) — F2P-reachable thresholds?
- Piggy Bank (MONEY-10 cap 500) — rewarding or punishing at endgame?
- GDPR + analyticsConsent gate — does monetization respect opt-out?
- 11 monetization analytics events (§27 ANALYTICS-4) — funnel triggers logged completely?
- Daily login + push notifications — engagement loop without being predatory?
- **Idle benchmark**: ethical idle monetization = AdCap-tier (gold cosmetics + speed-boosters, 100% F2P viable). Predatory = Idle Heroes-tier (pay-to-win heroes, time-gated content). Where does SYNAPSE land?

### E. Architecture, code quality, type safety
- CODE-1: zero hardcoded game values in engine. Anti-invention gates 1-6 enforce — verify they catch violations.
- CODE-2: 200-line file cap, 50-line function cap. Two documented exceptions. Anything else creeping over?
- CODE-9: pure engine. Verify `tests/engine/determinism.test.ts` spy assertions pass under realistic mid-game state.
- 133-field GameState invariant. 8-anchor migration chain. Next addition smooth?
- Zustand pitfall: never `setState(state, true)`. Grep src/ for any violation.
- Type safety: `strict: true`, no `any`, no `@ts-ignore`. Spot-check.
- React.memo on panels (CODE-8). All 4 tab panels memoized?
- try/catch around: Capacitor Preferences, Firebase, RevenueCat, AdMob, Howler. Never throws at boundary?
- Coverage thresholds (engine ≥85, store ≥75, ui ≥60) — pass at sprint close. Spot-check critical files.

### F. Performance & runtime
- 100ms game tick + 60fps rAF. Does `tickScheduler` share work with rendering?
- Hot-path budgets in `tests/engine/perfBudget.test.ts`: tick <5ms p95, calculateProduction <2ms p95, handlePrestige <50ms p95. Realistic for low-end Android (Mi A3 target)?
- Canvas glow cache + 80-node visible cap. Scales to P10+ visual density?
- Memory: `src/platform/perf.ts` ships memory snapshot wrapper. What's the heap profile across a long session?
- Battery: no instrumentation yet. Projected battery hit per 1h session?
- Long-task observer wrapper exists. Recommend an SLO if Sprint 11b doesn't add one.
- Cold-start time on Capacitor WebView (Mi A3 = canonical low-end target).

### G. UX, mobile-native, accessibility
- Touch targets ≥48dp / 44pt (CODE-4). Verify every interactive element.
- Safe areas via `env(safe-area-inset-*)` — notched-phone tested?
- Portrait-only with tablet landscape ≥900px. Tablet layouts tested?
- Reduced motion — canvas pulse frozen + HUD transitions suppressed. Every animation surface respects it?
- Colorblind mode — Polarity gets ▲/▼ glyphs but what about other color-coded surfaces (mood tier, neuron type, region status, Mental State, Mutation effect color)?
- High contrast — token overrides via `styles/accessibility.css`. Spot-check WCAG AA contrast ratios.
- Font scale 0.85em / 1em / 1.15em (rem-based). Overflow at 1.15em on small screens?
- Screen reader: aria-pass landed Sprint 10.5. Any unlabeled icon-only buttons remaining?
- Network failure UI (`NetworkErrorToast`) — exhaustive across save/load/IAP/ad?
- Loading state UX — RevenueCat init takes 2-5s on cold start. Spinner or frozen UI?
- Localization: English only at v1.0 (Spanish DEFERRED). Any user-facing strings hardcoded outside `t('key')`?

### H. Save reliability & data integrity
- Capacitor Preferences primary, Firebase Cloud secondary (fail silently per CODE-6). Cloud actually shipping in v1.0?
- `migrateState` defensive (never throws, validateLoadedState rejects bad shape, loader falls back to `createDefaultState`).
- Save fuzz (1000 malformed payloads, 5 fuzz arbitraries). Coverage gaps?
- Migration chain (8 historical anchors). Mid-migration crash recovery?
- Cloud merge MIG-1: union purchases/cosmetics, MAX currencies, higher `totalGenerated`. Implemented?
- Save on prestige + background + 30s interval (NEVER on tick). Verify `saveScheduler.ts`.
- **Account deletion / data export (GDPR Article 17/15)** — Does this exist? If not, **CRITICAL** flag.
- **Save failure UX** — if `Preferences.set()` fails, does the player see anything?

### I. Telemetry, observability, post-launch ops
- 49 analytics events (48 §27 + reset_game extension). Weekly_challenge_* events tied to dead code?
- Crashlytics adapter wired at saveGame.load + RevenueCat.init + AdMob.init. Complete catch-site set?
- `firstEventsFired: string[]` for fire-once funnel. Race conditions?
- Remote Config: 6 keys defined (`src/config/remoteConfigBounds.ts`) — consumers DEFERRED to v1.1. Should anything launch with remote-tunability for emergency rollback (e.g., monetization disable kill-switch)?
- A/B test infrastructure: NONE shipping. Acceptable for v1.0?
- Event params: user-identifying fields stripped? GDPR-safe payloads?
- Dashboard readiness: are Firebase + RevenueCat dashboards configured to act on the events?

### J. Production / launch readiness
- App Store + Play Store submission inputs (privacy policy URL, age rating, screenshots, listing copy) — none in code; flag the checklist gap.
- Bundle ID `com.nicoabad.synapse` (locked).
- iOS: Info.plist URL types for `synapse://` deep links — DEFERRED. ATT prompt? Push permission flow?
- Android: AndroidManifest.xml intent-filter — DEFERRED. Target SDK 34? FCM config? Foreground service for daily reminder reliability?
- Notarization / code signing automated?
- Crash recovery: if engine throws, useful error or white screen?
- Store category, ASO keyword strategy.
- Licensing audit: any GPL/AGPL deps that conflict with proprietary release?
- Asset license: fonts (Outfit, JetBrains Mono — open OFL ✓), audio sources, narrative copyright.
- ToS / EULA / Privacy Policy text shipped or stubbed?

### K. Idle-game-genre fitness (the rubric — see next section)
Score SYNAPSE against the 10 genre success principles below.

### L. Replayability & long-tail engagement
- 4 endings + 1 secret. Replay value: do players keep playing post-ending?
- 3 Transcendences with thresholds ×3.5 then ×6.0. Is Run 2 differentiated enough or is it Run 1 stretched?
- Achievements: 35 total, sparks reward sum = 175. Hidden category for replay drive?
- Cosmetics: 18 entries. Enough variety to chase?
- Inner Voice Named Moments (5 fire per game). Player authoring vs skip path.
- Resonant Patterns: 4 per Run, secret ending gate. Discoverable without spoilers?
- Personal Best tracking: what gets PB-tracked? Is the player aware?
- **Idle benchmark**: NGU Idle 1000+ hour engagement. Cookie Clicker 600+ achievements + ascension perks. Antimatter Dimensions infinity → eternity → reality progression. SYNAPSE has 3 Runs × 26 prestiges = 78 prestiges total. Is that enough surface area for a 30-day retention curve?

---

## Idle-game-success rubric (score SYNAPSE on each, 1-10)

These are the 10 principles that distinguish the genre's hits from its misses. Score each + justify.

1. **Numbers go up — visibly, satisfyingly, exponentially**: every action causes a number to increment in the player's view. Format scaled (1K → 1.2M → 4.5T → 9.8e22). Cookie Clicker hit every multiple-of-10 with new visual celebration. Does SYNAPSE celebrate?
2. **Choices that matter — but not too many at once**: progressive complexity reveal. NGU gates systems behind levels. Does SYNAPSE introduce too much at P10 (Pathway + Mutations + Patterns + Region + Insight L2 all live)?
3. **Stuff happens when you're away** (offline progression): Adventure Capitalist set the standard with offline cap + efficiency. Does SYNAPSE's 4-16h cap + 50% efficiency stack feel rewarding or stingy?
4. **Frequent small rewards + occasional big ones** (variable schedule of reinforcement): tap = small, neuron unlock = medium, prestige = big, Era 3 event = huge. Does SYNAPSE distribute these well?
5. **Active vs passive balance**: Cookie Clicker ~70/30 passive/active. SYNAPSE appears ~60/40 (Discharge timing + mutation choices). Is the active layer fun or grindy?
6. **Prestige feels meaningful, not punishing**: meta-currency + permanent unlocks. SYNAPSE has Memorias + Sparks + Resonance + Patterns. Does the post-prestige state look DIFFERENT from pre-prestige?
7. **Hidden depth that emerges over time**: secret mechanics, easter eggs, optimal builds. SYNAPSE has Resonant Patterns (4 hidden conditions) + Mood Tier system + Mental State priority + secret Singularity ending. Is the depth discoverable without spoilers?
8. **Notifications + retention without being annoying**: daily reminder OK, "come back NOW!" not. SYNAPSE's 3 notification types (daily 18:00, offline cap reached, streak about to break). Permission cadence?
9. **Monetization that respects time invested**: F2P viable (Synapse: PHIL-1 100% F2P). IAP for convenience (Genius Pass +25% offline). Cosmetics for delight. Where does SYNAPSE actually land vs aspiration?
10. **The 3 Walls defeated**:
    - **Wall 1 (Day 1, FTUE)**: tutorial too long / first rewards too sparse → uninstall. Does SYNAPSE clear it?
    - **Wall 2 (Day 3-7, mid-game grind)**: no new mechanics → churn. Does Pathway + Mutation + Patterns + Mental States layered reveal carry the player past Day 3?
    - **Wall 3 (Day 14+, endgame plateau)**: no payoff → quit. Does Era 3 + 4 endings + Transcendence loop give players reason to push past P19?

---

## Severity scale

- **CRITICAL** (P0): launch-blocker. App crashes, data loss, monetization broken, accessibility regression that blocks app-store approval, GDPR violation, security exploit, FTUE breakage that causes >25% D1 churn.
- **HIGH** (P1): ship-degrading. First-time-user confusion that kills retention, perf below SLO on target devices, missing analytics that prevents post-launch diagnosis, monetization friction that costs 20%+ conversion.
- **MEDIUM** (P2): polish gap. Improves player experience but not required for launch. v1.0.1 patch material.
- **LOW** (P3): nice-to-have. v1.1+ candidate. Note but don't dwell.

---

## Output format

Produce ONE markdown report (10-20 pages, quality > quantity) with:

### 1. Executive summary (1-2 pages max)
- **Top 5 risks** (severity + likelihood)
- **Top 5 strengths** (be specific, name files; no platitudes)
- **Ship-readiness verdict**: `Ready` / `Conditionally Ready` / `Not Ready`. With one paragraph rationale.
- **Estimated time to ship-ready** (full-time hours / days, broken down by P0 fixes).
- **D1 / D7 / D30 retention forecast** (best-guess given the FTUE + retention design, with rationale).

### 2. Verification of pre-flagged risks (sections 1-20 + spec gaps)
For each pre-flagged item, state **CONFIRMED** / **REFUTED** / **MORE NUANCED**, with file:line evidence.

### 3. Findings by dimension (sections A-L above)

Each finding:
```
### [SEVERITY] short title
**Location:** path/to/file.ts:42-88 (or doc reference)
**Observation:** what you see
**Why it matters:** impact on player / business / engineering
**Industry comparison:** how this compares to genre best-practice (Cookie Clicker / AdCap / NGU / etc.)
**Recommended fix:** concrete next step + effort estimate (hours / days)
```

### 4. Idle-game-success rubric scorecard
A 1-10 score per principle (1-10 above) with one-paragraph rationale per score. Markdown table.

### 5. Cross-cutting concerns
Patterns observed across multiple dimensions. Examples: "Telemetry coverage uneven across mental states + mood transitions" (D + I), "Reduced-motion respect consistent in HUD but absent in canvas particle effects" (G + F).

### 6. Suggested sprint additions
Things the project needs that aren't in current SPRINTS.md or PROGRESS.md. Frame as "Sprint 11b should add X" or "Pre-launch must add Y" or "Post-launch should add Z".

### 7. Score by dimension (table)
A 1-10 rating per dimension A-L with a one-sentence rationale per score.

### 8. Open questions for Nico
Things you couldn't determine from the artifacts. Don't fabricate answers.

### 9. Ship/no-ship verdict + critical-path checklist
Bulleted list of EXACTLY what must be fixed before launch. Sequence + dependencies. Effort estimate.

---

## Discipline (per CLAUDE.md anti-invention rules)

- **Cite specific file:line refs for every finding.** No "somewhere in the code" or "I think the engine does X". If you can't cite, say so explicitly.
- **Don't invent values or behaviors.** If a value seems missing, flag it as a documented gap, not a fabricated issue. If GDD says X but code does Y, surface the divergence with both refs.
- **Distinguish design intent from implementation drift.** Some "issues" are documented design decisions. Read the design rationale FIRST, then judge.
- **Read before recommending.** Don't suggest "add X" without grepping for X first.
- **No vague advice.** "Improve UX" is not a finding. "Tab cross-fade duration is 150ms but the thumb lifts during scroll, suggest 80ms" IS a finding.
- **Don't fabricate severity counts.** Report what you find. Don't pad.
- **Acknowledge uncertainty.** "Without device testing, I can't confirm the perf budget holds on Mi A3 — flag as Sprint 11b assertion."
- **Strengths matter too.** If a system is genuinely well-designed, name it. Anchors auditor credibility.

---

## Scope boundaries

**IN scope:**
- Game design, mechanics, balance (where measurable from code/GDD)
- Code architecture, type safety, test coverage
- Mobile UX, touch targets, accessibility, perf
- Monetization mechanics + funnel design
- Save reliability, migration, offline progress
- Telemetry coverage + analytics event design
- Internationalization readiness
- Launch checklist (legal, privacy, store submission inputs)
- Tutorial / FTUE
- Narrative integration
- Sprint 11b prerequisites
- Genre-fitness benchmarks (vs Cookie Clicker / AdCap / NGU / etc.)

**OUT of scope:**
- Visual art quality (assets owned by Nico's design pipeline, not code review)
- Marketing copy / store listing text content
- Server-side infrastructure (game is client-only + Firebase)
- Alternative architecture proposals (don't suggest "rewrite in Unity / React Native / Flutter")
- v1.5+ features documented in `docs/POSTLAUNCH.md`
- Sprint 8c-tuning specifics (deadlock documented; auditor flags the deferral, doesn't solve it)

---

## What to verify hands-on (if sandbox + npm available)

```bash
npm test                        # expect ~2150 passing, 1 skipped
npm run check-invention         # expect 6/6 gates green
npm run check:rules             # expect 155 covered + 0 allowlisted
npm run check:palette           # expect aligned (no drift)
npm run typecheck               # expect clean
npm run lint                    # expect clean (zero warnings)
npm run dev                     # launch web preview
                                # play through P0 → P1 (Awakening) — TIME IT
                                # play through P1 → P3 — note pacing
npx tsx scripts/buffer-1-prestige-sim.ts  # full P0-P25 simulation
```

If Capacitor + Android device:
```bash
npx cap sync
npx cap run android
adb logcat | grep -i synapse
```

Live FTUE walkthrough: time the splash → first tap → first neuron → first discharge → first prestige → first cycle setup → first archetype/polarity choice. **Compare actual times to GDD targets.** Note any friction or confusion.

---

## Auditor calibration

- **Time budget**: 6-12 hours of focused review.
- **Length**: 10-20 pages. Quality > quantity. Pad less, find more.
- **Severity calibration**: if you find <5 CRITICAL issues, you didn't look hard enough OR project is genuinely close to ship — verify before claiming. If >25 CRITICAL, recalibrate the severity scale upward.
- **Tone**: blunt, specific, actionable. No hedge-speak. State the finding.
- **Strengths**: name them with file refs. Anchors credibility.

---

## Why this audit matters

SYNAPSE is one developer's solo project shipping into a saturated mobile idle-game category. The first 24-72 hours of public availability define D1/D7/D30 trajectories. Every ship-blocker not caught now becomes a 1-star review, an uninstall, a Reddit post. Every accessibility gap becomes an Apple Review rejection. Every monetization friction is left-on-table revenue.

The developer has built the codebase with extreme rigor (6 anti-invention gates, 2150+ tests, fast-check property invariants, determinism gates). What's needed now is **outside-in player perspective + genre expertise** — the things tests can't measure. That's what this audit is for.

Begin with the executive summary, then verify pre-flagged risks (highest leverage), then walk dimensions A → L. End with the rubric scorecard, the score table, and the ship-or-no-ship verdict.

---PROMPT END---

## Verification

After Nico copies the prompt out:

1. **Sanity-check the prompt itself** — does it self-execute? Read it as if you were the auditor receiving it cold. Does it give enough context to start? Does it specify deliverables clearly?
2. **Pick a venue** — fresh Claude Code session is easiest (full file access + can run `npm` scripts to verify perf budgets / test counts / sim outputs). Web Claude or ChatGPT works if you upload the file set.
3. **Set expectations** — auditor needs 6-12h of focused review. Don't accept a 10-minute reply; that's a skim, not an audit.
4. **Compare audits if multiple are run** — divergence between two audits = signal about which findings are real vs subjective.

Iterate this plan file directly to refine the prompt for future audits (add dimensions, tighten severity scale, change output format).
