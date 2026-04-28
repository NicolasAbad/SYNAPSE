# SYNAPSE — UI Redesign V2 (synthesis: original mockups + research + code audit)

**Status:** ENHANCED PROPOSAL — supersedes `UI_REDESIGN_PROPOSAL.md` (V1).
**Author:** Claude Opus 4.7 (acting as senior idle-game UI/UX designer)
**Date drafted:** session-Day-5 of pre-launch audit cycle (post Mi A3 playtest)

---

## 0. What changed vs V1

V1 (`UI_REDESIGN_PROPOSAL.md`) introduced the "Mind Awakens" concept and 8-phase tutorial. V2 enhances it by integrating:

1. **Patterns from `docs/UI_MOCKUPS.html`** (the original SYNAPSE design references that Nico still likes):
   - "SAME AS BEFORE — START" big CTA on CycleSetupScreen (1-tap repeat for prestige veterans)
   - Awakening screen sectioned layout (Gains / Resets / Estimate / Record / Resonant Pattern)
   - Spontaneous-event banner (Dopamine Burst pill below FocusBar)
   - Narrative quote embedded on the canvas ("Before ideas, there was only impulse.")
   - Color-coded affordability on neurons (green=affordable, orange=expensive, red=can't)
   - Lucid Dream offline-return panel
   - Pattern Tree with milestone gold + decision orange + permanent warning

2. **2026 idle-game research findings:**
   - D1 retention top quartile = 42% — our forecast matches if we ship the tutorial right
   - First 5-15 minutes is the most important release window (player can drop the app in seconds)
   - "Time to aha!" — the moment the player performs the core loop — is THE metric
   - Clean menus + better explanations is the 2026 trend (vs slick-but-confusing)
   - Ad-free early gameplay is now standard for top performers (My Fish Mart, Idle Iktah)
   - Universal Paperclips proves minimal-text-first onboarding works for thoughtful players

3. **Codebase impact audit** (60 UI files, ~8,757 LoC, 176 test files, ~25 UI test files):
   - Most components are <250 lines — manageable to edit in place
   - Largest: UpgradesPanel (270 LoC), NeuronsPanel (245), EndingScreen (242)
   - Strategy: prefer style-only edits where possible (low test impact); add NEW wrapper components for new patterns (`HudHero`, `StatusRow`, `TutorialPhaseGate`); only rewrite when necessary

---

## 1. Final design philosophy (V2)

Three pillars, in priority order:

### Pillar 1 — Diegetic progressive disclosure ("The Mind Awakens")
Every UI element appears as a "memory the mind recovers". Cold start = literal blank canvas + 1 neuron. Each phase adds ONE element with a narrative beat. This is the SYNAPSE-unique hook none of Cookie Clicker / AdCap / NGU have.

### Pillar 2 — Genre conventions where they help
- Settings gear → top-right (universal mobile pattern)
- Bottom tab bar → 4 tabs (mobile mid-game convention)
- Hero pair (resource value + per-second rate) → top-left + top-right (AdCap pattern)
- Action button (Discharge) → bottom-center, only when actionable (Cookie Clicker / AdCap)
- Narrative quote embedded on canvas (a la Universal Paperclips minimalism)

### Pillar 3 — Originals that work, kept
The original `UI_MOCKUPS.html` had patterns that are good design and we should preserve / enhance:
- **SAME AS BEFORE — START button** on CycleSetupScreen (massive UX win; one tap to repeat)
- **Sectioned Awakening screen** (Gains | Resets | Estimate | Record | Resonant) — clear visual taxonomy
- **Spontaneous event banner** (Dopamine Burst pill) — diegetic event surface
- **Color-coded affordability** on Neurons tab (green/orange/red) — instant scan
- **Lucid Dream panel** on offline return — feels narratively right for SYNAPSE
- **Pattern Tree milestone gold + decision orange** — visual hierarchy matches importance

---

## 2. Complete tutorial flow — 8 phases (with all mockups)

(See `docs/mockups/` for individual SVG/PNG files; all 8 phases now have visual mockups.)

| Phase | Trigger | Beat | UI added | Mockup |
|---|---|---|---|---|
| 0 | App first launch | "...something stirs..." | 1 faint neuron, no chrome | `01-phase0-blank.svg` ✓ |
| 1 | First tap | "...a thought..." | Tiny "1" counter top-left | `phase1-first-thought.svg` (NEW) |
| 2 | thoughts ≥ 5 | "...I can think..." | "thoughts" label | `phase2-named.svg` (NEW) |
| 3 | thoughts ≥ 10 | "...connections form..." | Big "+1 neuron" button overlay | `02-phase3-buy-first.svg` ✓ |
| 4 | First buy | "...thoughts flow..." | "+0.5/s" rate counter top-right | `phase4-rate.svg` (NEW) |
| 5 | thoughts ≥ 50 | "...I can choose..." | Bottom tab bar with 1 tab (Neurons) | `phase5-tabs.svg` (NEW) |
| 6 | Focus 50% | "...focus..." | Focus bar visible + Upgrades tab | `phase6-focus.svg` (NEW) |
| 7 | Focus 100% | "...release..." | Big DISCHARGE button + supercharged ×3 | `03-phase7-discharge-ready.svg` ✓ |
| 8 | Awakening 80% | "...beyond this self..." | Awakening progress bar + Mind tab | `phase8-awakening.svg` (NEW) |

---

## 3. Final HUD design (post-tutorial)

`04-final-hud.svg` ✓ — see existing mockup. No major change vs V1 proposal:
- Hero pair: thoughts (left, big amber) + rate (right, green)
- Thin amber awakening progress bar
- Status row: memories | connection (centered) | mood ◐ | settings ⚙
- Focus bar (full-width cyan)
- Discharge pips + countdown chip (compact, centered)
- Canvas with auto-scaled spiral (60-70% viewport)
- Discharge button (bottom-center, only when ready)
- Bottom tab bar (4 tabs)

**Enhancement from original mockups (NEW):** add **Spontaneous event banner** below the Focus bar when an event is active (e.g. "⚡ Dopamine Burst — ×2 · 24s remaining"). Currently we don't surface active events visually anywhere.

**Enhancement (NEW):** narrative quote slot on the canvas (low-opacity italic, bottom of canvas area), rotates per cycle. Current: nothing. Adds ambient narrative without modal interruption.

---

## 4. Tab content redesign — all 4 tabs

### 4.1 Neurons tab — `05-neurons-tab.svg` ✓ (existing)
Already mocked. Add ONE pattern from original: color-coded affordability on the Buy buttons:
- Green when `cost ≤ thoughts` (affordable)
- Amber when `cost ≤ thoughts × 1.5` (close)
- Red when `cost > thoughts × 1.5` (out of reach)

### 4.2 Upgrades tab — `06-upgrades-tab.svg` ✓ (existing)
Already mocked. No further changes.

### 4.3 Mind tab — `mind-tab-rooms.svg` (NEW)
Replace horizontal subtab pills (currently scrollable on narrow screens) with a vertical "rooms list" pattern:
- Each room = a row with icon + title + summary count + chevron
- Tap → drill into the room (full-screen sub-page)
- Locked rooms grouped at bottom with unlock requirement
- Pattern matches NGU Idle's progression sub-tabs and is more readable on narrow Mi A3

### 4.4 Regions tab — `regions-brain-map.svg` (NEW)
Replace vertical scrolling list of region cards with a brain-map canvas overview:
- 5 region nodes positioned as a stylized brain diagram
- Owned regions illuminated, locked dimmed
- Tap a node → drill into region detail page (with shard tree etc.)
- Removes the "giant Hipocampo card eats half the screen" problem

---

## 5. Modal/screen redesigns

### 5.1 CycleSetupScreen — `cycle-setup-v2.svg` (NEW)
Incorporates the original mockup's **"SAME AS BEFORE — START" big green CTA** (~50px tall, full-width). Below it: smaller "Start with changes" outline button. Below that: collapsible "What if?" preview. Layout:
- Top: Polarity / Mutation / Pathway slots in 3 columns (or stepper on phone)
- Big primary CTA: SAME AS BEFORE — START
- Secondary CTA: Start with changes
- Collapsible: What-if preview + Momentum bonus chip

### 5.2 AwakeningScreen — `awakening-v2.svg` (NEW)
Sectioned layout from original mockup:
- Title: AWAKENING + subtitle "Your mind is ready to evolve"
- **GREEN section** — what you gain
- **RED section** — what resets
- **BLUE section** — estimated next cycle time
- **AMBER section** — new record (if beat)
- **GOLD DASHED section** — Resonant Pattern discovered (if applicable)
- Big primary button: AWAKEN
- Secondary: Later

### 5.3 SleepScreen / Offline return — `sleep-v2.svg` (NEW)
From original mockup:
- "Your mind dreamed" title + "You were away for 7h 23m"
- Big amber thoughts gain card
- Discharge charges accumulated note
- **LUCID DREAM** panel (P10+, 33% trigger): 2 cards (×2 prod 1h or +2 Memories)
- Optional ad row: "Watch ad: earnings ×2"
- Continue button

### 5.4 Settings modal — keep current
Already shipped, scrollable list with 8+ sections. Minor polish only (group icons + visual chunking).

### 5.5 Offer modals (Starter Pack / Genius Pass / Limited Time / Spark Pack / Piggy Bank)
Already shipped + pointer-events bug fixed today. **One UX add:** delay first appearance by 30s post-Awakening so they don't fire mid-celebration.

---

## 6. Code impact audit + migration safety plan

### 6.1 Files affected by phase

| Phase | Files modified | Files added | Tests affected |
|---|---|---|---|
| Tutorial state machine | `src/store/gameStore.ts`, `src/types/GameState.ts`, `src/store/migrate.ts` | `src/engine/tutorialPhase.ts`, `src/ui/hud/TutorialPhaseGate.tsx`, `src/ui/hud/NarrativeBeat.tsx` | save/migration tests, new tutorial state tests |
| Tutorial element gating | All HUD components (read tutorialPhase, gate render) | none | HUD tests (~28 tests need updates) |
| Final HUD polish | `ThoughtsCounter`, `RateCounter`, `MemoriesCounter`, `MoodIndicator`, `ConnectionChip`, `SettingsButton`, `DischargeCharges`, `FocusBar`, `AwakeningProgressBar` (already added) | `HudHero.tsx` (groups thoughts+rate), `StatusRow.tsx` (groups chips) | HUD tests + style snapshots |
| Spontaneous banner | `OfferOrchestrator` or new `SpontaneousBanner.tsx` mounted in HUD | `SpontaneousBanner.tsx` | new test file |
| Narrative quote on canvas | `NeuronCanvas.tsx` or overlay layer | `NarrativeQuoteLayer.tsx` | new test file |
| Tab redesigns (Neurons + Upgrades) | `NeuronsPanel.tsx`, `UpgradesPanel.tsx` | none (style + structure only) | panel tests need row-count + section assertions update |
| Mind tab restructure (rooms) | `MindPanel.tsx` (major rewrite) | `MindRoomsList.tsx`, room components stay same | MindPanel tests + new rooms-list test |
| Regions brain map | `RegionsPanel.tsx` (major rewrite) | `RegionsBrainMap.tsx` (canvas-based) | RegionsPanel tests need new brain-map mode |
| CycleSetupScreen "Same as Before" | `CycleSetupScreen.tsx`, `cycleSetupActionBar.tsx` | none | CycleSetupScreen tests + new "same as before" path test |
| AwakeningScreen sectioning | `AwakeningScreen.tsx` (style/layout) | none | tests update |
| SleepScreen Lucid Dream | `SleepScreen.tsx` | none | SleepScreen tests update |

**Total:** ~25 files modified, ~8 new files added. ~50-60 tests need updates. ~40 hours of focused work.

### 6.2 Risks + mitigations

| Risk | Mitigation |
|---|---|
| Tutorial phase field bumps GameState 133 → 134 | Add to migrate.ts as a default 0; existing saves auto-migrate. Zero data loss. |
| HUD tests break en masse | Update tests one-by-one alongside each component change. Run after each commit. |
| Players who already played mid-tutorial state get confused | If `prestigeCount > 0` on first launch of new build, treat as `tutorialPhase = 9` (post-tutorial), skip all phase gates. |
| Mind tab restructure breaks existing subtab navigation | Preserve `activeMindSubtab` field semantics (already exists). New rooms list maps to same field. Settings + tests untouched. |
| Brain map canvas adds perf cost | Render only when Regions tab is active. Use existing canvas+rAF pattern. Measure on Mi A3. |
| "Same as Before" creates polarity-storage edge case (first prestige) | Already handled — `lastCycleConfig` is null on first prestige; button reads "START" instead. |
| New SVG/CSS animations break reducedMotion | Audit each new animation; add `.a11y-no-motion` opt-out. |
| Save migration adds GameState field | Increment migration anchor + add migration step + test |
| iOS-specific styling needed | NOT in scope (iOS deferred per memory) — Android-only validation |

### 6.3 Migration safety plan

1. **Branch strategy:** all V2 work on a `redesign/v2` branch off main. PRs into main when phases are green.
2. **Phase ordering** for minimum risk:
   1. Tutorial state machine (engine + GameState bump + migration) → ship as standalone, test, no UI changes yet
   2. Tutorial phase gates on existing HUD elements → players see same UI but with phase-aware rendering
   3. New components (HudHero, StatusRow, SpontaneousBanner, NarrativeQuoteLayer)
   4. Tab content redesigns (Neurons → Upgrades → Mind → Regions in that order; each shippable independently)
   5. Modal redesigns (CycleSetup → Awakening → Sleep)
   6. Final polish + accessibility audit
3. **Rollback hatch:** keep all old components unmounted but in code for v1.0.1 if launch goes sideways. After 2 weeks of green retention metrics, delete.
4. **Device verification:** every phase requires Mi A3 install + screenshot diff against the mockup.
5. **Settings escape:** "Skip tutorial" toggle (already shipped C-2 commit `e600e32`) lets veterans bypass the new phase flow. Re-purpose the same field; veterans on update see no change.

---

## 7. Estimated total effort

| Bundle | Files | Effort | Critical for launch? |
|---|---|---|---|
| Tutorial state machine + 8 phase gates + narrative beats | ~10 files | 16-20h | YES (the engagement piece) |
| HudHero + StatusRow + SpontaneousBanner + NarrativeQuote | ~6 files | 8-10h | YES (mostly done via Option C today) |
| Neurons tab redesign | 1 file | 3-4h | YES |
| Upgrades tab redesign | 1 file | 3-4h | YES |
| Mind tab → rooms list | 1 file + 1 new | 5-7h | MEDIUM (current works) |
| Regions tab → brain map | 1 file + 1 new (canvas) | 8-10h | DEFER to v1.1 |
| CycleSetupScreen "Same as Before" + WhatIf collapsible | 2 files | 4-5h | YES |
| AwakeningScreen sectioning | 1 file | 3-4h | MEDIUM |
| SleepScreen Lucid Dream polish | 1 file | 2-3h | MEDIUM |
| Modal stagger (post-Awakening 30s delay) | 1 file (OfferOrchestrator) | 2h | LOW |
| Tests + Mi A3 verification cycles | many | 8-10h | YES |
| **Total (all)** | | **~62-79h** = 8-10 days | |
| **Launch-critical only** | | **~46-58h** = 6-7 days | |

---

## 8. Implementation phases (ordered for shipping)

**Sprint A (week 1) — Foundations:**
- Phase A1: Tutorial state machine + GameState field + migration (4-6h)
- Phase A2: NarrativeBeat component + narrative copy (2h)
- Phase A3: Element gating system (TutorialPhaseGate wrapper + apply to ~20 HUD elements) (8h)

**Sprint B (week 1-2) — HUD polish:**
- Phase B1: HudHero (groups thoughts+rate visually) (3h)
- Phase B2: StatusRow (memories+connection+mood as one row) (3h, mostly done already)
- Phase B3: SpontaneousBanner (when active event) (3h)
- Phase B4: NarrativeQuoteLayer (canvas overlay, rotates per cycle) (3h)

**Sprint C (week 2) — Tab content:**
- Phase C1: Neurons tab compact + best-buy + color-coded affordability (4h)
- Phase C2: Upgrades tab affordable badge + sections (4h)
- Phase C3: Mind tab rooms-list pattern (6h)
- Phase C4: Regions brain-map → DEFER to v1.1

**Sprint D (week 2) — Cycle / Awakening / Sleep:**
- Phase D1: CycleSetupScreen "Same as Before" big CTA + WhatIf collapsible (5h)
- Phase D2: AwakeningScreen sectioning per original mockup (4h)
- Phase D3: SleepScreen Lucid Dream polish (3h)

**Sprint E (week 2-3) — QA + ship:**
- Phase E1: Tests update across affected suites (8h)
- Phase E2: Mi A3 device verification cycles (3-4 cycles, ~4h total)
- Phase E3: Final commit + push + ship-ready state (2h)

**Total realistic timeline:** 2-3 weeks for full V2. **Launch-critical only:** 1.5-2 weeks (skipping Mind rooms restructure + Regions brain map + AwakeningScreen sectioning).

---

## 9. Decision matrix for Nico

| Scope | Includes | Effort | Launch quality |
|---|---|---|---|
| **V2-Full** | Everything in Sprints A+B+C+D+E (incl. Regions brain map deferred to v1.1) | ~10 days | Top-tier launch (D1 retention 50%+ likely) |
| **V2-Launch** | Sprints A + B + C1+C2 + D1 + E (skip Mind rooms + Regions brain + AwakeningScreen sectioning) | ~6-7 days | Strong launch (D1 retention 45-50%) |
| **V2-Minimal** | Sprint A only + tests | ~3-4 days | Tutorial-driven launch but HUD stays as-is post-Mi-A3-fixes |

**My recommendation: V2-Launch** (Sprints A+B+C-partial+D1+E). Hits the engagement-critical pieces (tutorial + final HUD polish + the 2 most-touched tabs + the most-impactful modal) without dragging into 2.5 weeks of work.

---

## 10. What V2 explicitly does NOT include

To prevent scope creep:

- **iOS-specific styling** — deferred per project memory
- **Spanish localization** — deferred per project memory
- **Cloud sync UI** — feature not in v1.0
- **A/B test infrastructure** — v1.1 candidate
- **Sound design / music** — out of scope (audio assets are Nico's pipeline)
- **Custom HUD layout (player-customizable)** — v1.5+ candidate
- **AI-driven personalization** — 2026 trend but way out of v1.0 scope
- **Achievement/Cosmetics shop visual overhaul** — current works
- **Splash screen redesign** — current works (Day 3 audit fix shipped pulse)

---

## 11. Files to be added (preview)

```
src/engine/tutorialPhase.ts            ← pure helpers: phaseFromState(state) → 0..9
src/types/GameState.ts                 ← +1 field tutorialPhase: number (133 → 134)
src/store/migrate.ts                   ← +1 migration step (default 0 for existing saves)
src/ui/hud/TutorialPhaseGate.tsx       ← wrapper: <TutorialPhaseGate from=N>...</TutorialPhaseGate>
src/ui/hud/NarrativeBeat.tsx           ← italic fade-in/out narrative line
src/ui/hud/HudHero.tsx                 ← groups ThoughtsCounter + RateCounter
src/ui/hud/StatusRow.tsx               ← groups Memories + Connection + Mood (row layout)
src/ui/hud/SpontaneousBanner.tsx       ← active event chip (Dopamine Burst etc.)
src/ui/canvas/NarrativeQuoteLayer.tsx  ← rotating quote overlay on canvas
src/ui/panels/MindRoomsList.tsx        ← rooms-list pattern (replaces subtab pills)
```

---

## 12. Visual mockups index

All mockups live in `docs/mockups/` (open `index.html` for the gallery view).

**Tutorial (8 phases):**
- ✓ `01-phase0-blank.svg/png` — pre-thought
- ✓ `phase1-first-thought.svg/png` (NEW)
- ✓ `phase2-named.svg/png` (NEW)
- ✓ `02-phase3-buy-first.svg/png` — buy first neuron
- ✓ `phase4-rate.svg/png` (NEW)
- ✓ `phase5-tabs.svg/png` (NEW)
- ✓ `phase6-focus.svg/png` (NEW)
- ✓ `03-phase7-discharge-ready.svg/png` — first discharge
- ✓ `phase8-awakening.svg/png` (NEW)

**Final UI:**
- ✓ `04-final-hud.svg/png` — polished launch HUD
- ✓ `05-neurons-tab.svg/png` — Neurons tab
- ✓ `06-upgrades-tab.svg/png` — Upgrades tab
- ✓ `mind-tab-rooms.svg/png` (NEW)
- ✓ `regions-brain-map.svg/png` (NEW — sketch only)

**Critical screens:**
- ✓ `cycle-setup-v2.svg/png` (NEW) — "Same as Before" CTA pattern
- ✓ `awakening-v2.svg/png` (NEW) — sectioned (Gains/Resets/Estimate/Record/Resonant)
- ✓ `sleep-v2.svg/png` (NEW) — Lucid Dream pattern

That's 17 mockups total, covering every screen the player sees in v1.0.

---

## 13. Decision request

Pick one:

- **V2-Full** (10 days) — top-tier launch
- **V2-Launch** (6-7 days, recommended) — strong launch, skip Mind rooms + Regions brain map + AwakeningScreen sectioning
- **V2-Minimal** (3-4 days) — tutorial only

After approval I'll execute via the `redesign/v2` branch, one phase at a time, each with green tests before merge. You can stop me at any phase if you want to ship earlier.
