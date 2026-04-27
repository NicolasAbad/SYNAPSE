# SYNAPSE — Audit Fix Plan

**Source:** `docs/AUDIT.md` (2026-04-27)
**Owner split:** Claude Code (autonomous, code-only) vs Nico (manual / dashboards / legal / native config)

---

## Part 1 — Everything Claude can solve autonomously

Items grouped by effort tier. Within each tier, listed roughly by impact-per-hour.

### Tier 0 — Quick wins (< 1 hour each, ~9 items, ~6-8 hours total)

| # | Audit ID | Action | Effort | File(s) |
|---|---|---|---|---|
| 1 | E-3 | Fix `scripts/buffer-1-prestige-sim.ts` UI_FIELDS list (add `lastSaveError`, `networkError`) so the sim stops false-positive on field count | 2-line edit | `scripts/buffer-1-prestige-sim.ts:49` |
| 2 | G-2 | Wrap `FragmentOverlay.tsx:100` and `SplashScreen.tsx:46` opacity transitions in `reducedMotion` check | 30 min | `src/ui/modals/FragmentOverlay.tsx`, `src/ui/modals/SplashScreen.tsx` |
| 3 | I-1 | Add comment in `firebase.ts` noting weekly_challenge_* events are defined but unused | 5 min | `src/platform/firebase.ts:80-83` |
| 4 | B-2 | Gate `DailyLoginModal` to `!isTutorialCycle` so it doesn't interrupt cold-start tutorial flow | 1 hr | `src/App.tsx:176-200` (the `checkDaily` effect) |
| 5 | G-3 | Add analyticsConsent toggle row in Settings → Account section | 1 hr | `src/ui/modals/SettingsModal.tsx`, store action already exists |
| 6 | M-5 | Hide region cards whose `unlockPrestige > prestigeCount + 3` | 1 hr | `src/ui/panels/RegionsPanel.tsx` |
| 7 | M-6 | Gate `ConsciousnessBar` by prestige (P1+) instead of dynamic 50% threshold | 30 min | `src/ui/hud/ConsciousnessBar.tsx`, `src/engine/core.ts` (CORE-10) |
| 8 | D-4 | Add "Piggy Bank FULL" indicator chip when `piggyBankSparks === piggyCap` | 1 hr | `src/ui/hud/` (new chip), `src/store/gameStore.ts` (selector) |
| 9 | A-4/16 | Wrap `unlockAudioOnFirstTap()` call in try/catch | 10 min | `src/ui/canvas/NeuronCanvas.tsx:54` |
| 10 | C-3 | Add "Supercharged ×3" badge on `DischargeButton` during first tutorial discharge | 1 hr | `src/ui/hud/DischargeButton.tsx` |

### Tier 1 — Medium fixes (2-4 hours each, ~7 items, ~16-22 hours total)

| # | Audit ID | Action | Effort | File(s) |
|---|---|---|---|---|
| 11 | M-1 | Gate `TabBar` tabs by prestige (Mind+Upgrades P0; Neurons P1; Regions P5) | 2 hr | `src/ui/hud/TabBar.tsx` |
| 12 | M-4 | Hide Locked-section in `UpgradesPanel` until P5 (or cap visible Locked rows to "next 3 unlocks") | 2 hr | `src/ui/panels/UpgradesPanel.tsx:77-120` |
| 13 | M-2 | Hide locked neuron types in `NeuronsPanel` until unlock condition met (show only `basica` at P0; reveal `sensorial` after first 10 Basicas; etc.) | 3 hr | `src/ui/panels/NeuronsPanel.tsx:87-96` |
| 14 | M-3 | Hide non-functional Mind subtabs until content exists (gate Patterns→P1, Achievements→always w/ progress, Diary→P1, Mastery→P5+, Archetypes→P7+) | 3 hr | `src/ui/panels/MindPanel.tsx:71-74` |
| 15 | C-2 | Add tutorial skip affordance (long-press dismiss OR Settings → Game → "Skip tutorial hints" toggle) | 2-3 hr | `src/ui/modals/TutorialHints.tsx`, `src/ui/modals/SettingsModal.tsx`, store flag |
| 16 | A-3 | Add visible feedback when anti-spam penalty (×0.10) activates — toast + ×0.1 badge near rate counter | 2 hr | `src/ui/hud/RateCounter.tsx`, `src/ui/hud/HUD.tsx` (toast surface) |
| 17 | M-9 | Cosmetics in-game discovery — toast post-prestige if any cosmetic affordable, OR permanent Cosmetics chip near SaveSyncIndicator | 3 hr | `src/ui/hud/HUD.tsx`, `src/ui/hud/SaveSyncIndicator.tsx` |

### Tier 2 — Larger fixes (4-10 hours each, ~7 items, ~30-50 hours total)

| # | Audit ID | Action | Effort | File(s) |
|---|---|---|---|---|
| 18 | **H-1 CRITICAL** | **GDPR Article 15 data export** — Settings → Account → "Download Your Data" button → JSON serialize current save → Capacitor Share or Blob download | 4-6 hr | `src/ui/modals/SettingsModal.tsx`, new `src/platform/dataExport.ts` |
| 19 | D-1 | Push permission soft-prompt modal at gate 1 trigger (BEFORE the native OS modal). With Allow / Maybe-Later buttons | 4-6 hr | New `src/ui/modals/PushSoftPromptModal.tsx`, `src/platform/usePushRuntime.ts`, `src/App.tsx` |
| 20 | A-1 | Cascade visual celebration — 200ms cyan screen tint + scale-up "+X,XXX" floater. SFX file deferred to Nico | 4 hr (visual only) | `src/ui/hud/DischargeButton.tsx`, new screen-flash component, `src/ui/canvas/TapFloaterLayer.tsx` (variant) |
| 21 | A-2 | Insight activation visual — 1s screen tint (level-colored) + "INSIGHT L{N}" text overlay. SFX deferred | 4 hr (visual only) | New `src/ui/hud/InsightActivationOverlay.tsx`, `src/store/tickScheduler.ts` (transition detector already exists) |
| 22 | G-1 | colorblindMode coverage — neuron types get tier-numbered indicator (1-5), mood tiers get ◯◔◑◕● glyphs (extend existing), mental states get icons | 6-10 hr | `src/ui/canvas/renderer.ts`, `src/ui/hud/MoodIndicator.tsx`, mental state UI |
| 23 | M-7 | Animated arrow/glow on TutorialHints target buttons (one reusable component + 8 hint→target mappings) | 4 hr | New `src/ui/modals/TutorialTargetCallout.tsx`, hint mappings in `TutorialHints.tsx` |
| 24 | D-2 | Starter Pack push reminder — schedule local notification at T-24h before expiry | 3-4 hr | `src/platform/pushScheduler.ts`, `src/engine/starterPackTrigger.ts` |
| 25 | C-1 cross | Reusable "ActivationFlash" component + retrofit at 12 trigger sites (Cascade / Insight / Mental State entry / Mood tier transitions / first Region unlock / first Polarity / first Mutation / first Pathway / first Resonant Pattern / first Era 3 event / first Personal Best / first Achievement) | 6-8 hr | New `src/ui/hud/ActivationFlash.tsx`, retrofit in tickScheduler + various action handlers |
| 26 | D-3 | Spark cap countdown UI — show remaining sparks + countdown to month-end UTC midnight in `SparkPackPurchaseModal` | 1-2 hr | `src/ui/modals/SparkPackPurchaseModal.tsx` |
| 27 | J-5 | Top-level `ErrorBoundary` in `App.tsx` showing "Something went wrong. Tap to reload." with reset-to-default option | 2 hr | `src/App.tsx`, new `src/ui/ErrorBoundary.tsx` |

**Total autonomous work I can do:** ~52-78 hours of code work. Roughly **6-10 focused days** to get through everything.

---

## Part 2 — What requires Nico (cannot be auto-solved)

| # | Audit ID | Action | Why blocked |
|---|---|---|---|
| N-1 | J-3 CRITICAL | Write + host Privacy Policy + ToS, reference URLs in store listings | Legal review + hosting decision |
| N-2 | J-1 CRITICAL | iOS Info.plist URL types + AndroidManifest.xml intent-filter for `synapse://` | Native project edits in Xcode + Android Studio |
| N-3 | J-2 CRITICAL | Configure 19 RevenueCat IAP products (Sprint 9b.3) | RevenueCat dashboard access; blocked on propagation |
| N-4 | J-4 | Mirror 6 Remote Config keys + bounds in Firebase Console | Firebase Console access |
| N-5 | A-1/A-2 | SFX asset files for Cascade + Insight celebrations | Audio asset creation/sourcing |
| N-6 | H-2 partial | RevenueCat customer profile deletion endpoint call (needs backend) OR Privacy Policy "contact support" workaround | Backend deployment OR legal workaround decision |
| N-7 | I-2 | Native Crashlytics bridge (`@capacitor-firebase/crashlytics`) | Native plugin install + Xcode/Android Studio testing |
| N-8 | F-1 | Mi A3 perf budget verification (Sprint 11b device matrix) | BrowserStack/Firebase Test Lab credentials + real device |
| N-9 | L-3 | 50-100 additional achievements (especially hidden category) | Game design content work |
| N-10 | Spanish i18n | Translate `en.ts` → `es.ts` per CLAUDE.md per-name approval | Per-name approval discipline |
| N-11 | L-2 | Run 2 mechanic differentiation pass | Game design decision |
| N-12 | I-3 | A/B test infrastructure (Firebase A/B Testing) | Firebase Console + experiment design |

---

# Part 3 — Dimension M Score Improvement Plan

**Current score:** 3/10
**Target score:** 7-8/10 (genre healthy zone)
**Why this matters:** Single biggest D1 retention risk. Forecast says fixes here move D1 from 30-40% → 45-55%.

## Why the score is 3/10 today

P0 census shows ~57 visible interactive elements vs genre norm of 1-16:
- 4 tabs visible (vs Cookie Clicker = 0 until first cookie purchased)
- 5 neuron rows visible, 4 locked greyed (vs AdCap = 1 visible)
- 6 Mind subtabs visible with placeholder content (vs NGU Idle = 2 tabs only)
- ~30 upgrade rows visible (9 affordable + ~20 locked teaser)
- 5 region cards visible, 4 locked
- 11 HUD elements

The locked-teaser strategy is COHERENT across panels (good engineering), but it's the wrong choice for FTUE. The strategy needs to be partially inverted: hide most things at P0, reveal as the player earns context.

## Approach

Two-phase plan. Phase 1 is the heavy lift — gates the major UI surfaces by prestige. Phase 2 is polish + measurement.

### Phase 1 — Major surface gating (the heavy lift)

**Target: drop P0 element count from ~57 to ~12-15.** Match NGU Idle's healthy starting density.

Each fix introduces a `visibleAt(prestigeCount, ...)` predicate. The gates are deliberate, documented, and testable.

| Step | Action | Files | Effort | Element count delta |
|---|---|---|---|---|
| 1.1 | **TabBar gating** — Mind + Upgrades visible at P0; Neurons appears at P1 (after first prestige); Regions appears at P5 | `src/ui/hud/TabBar.tsx` | 2 hr | -2 tabs at P0 → 2 tabs |
| 1.2 | **NeuronsPanel** — show only `basica` at P0; `sensorial` after first 10 Basicas owned; `piramidal` after first 5 Sensorials; etc. (chained unlock) | `src/ui/panels/NeuronsPanel.tsx` | 3 hr | -4 rows at P0 → 1 row |
| 1.3 | **UpgradesPanel** — Locked section hidden until P5. At P0-P4 only show Affordable + Teaser sections. Cap Teaser to "next 3 visible unlocks" | `src/ui/panels/UpgradesPanel.tsx` | 2 hr | -20 rows at P0 → ~9 affordable + 3 teaser = 12 rows |
| 1.4 | **MindPanel subtabs** — gate per-subtab. P0 = `home` only. P1 = + Patterns + Diary. P5 = + Mastery. P7 = + Archetypes. Achievements always visible (with 0/35 progress bar at P0) | `src/ui/panels/MindPanel.tsx` | 3 hr | -5 subtabs at P0 → 1 subtab + Achievements progress |
| 1.5 | **RegionsPanel** — hide region cards whose `unlockPrestige > prestigeCount + 3`. P0 player sees Hipocampo only (and a "?" teaser for "unlocks soon at P3" if applicable) | `src/ui/panels/RegionsPanel.tsx` | 1 hr | -4 cards at P0 → 1 card + 1 teaser |

**End-of-Phase-1 P0 census (projected):**
- Tabs: 2 (Mind + Upgrades)
- HUD elements: 11 (unchanged — all earn their place at P0)
- Neurons (after Neurons tab unlock at P1): 1 row
- Upgrades: ~9 affordable + ~3 teaser
- Regions (after Regions tab unlock at P5): N/A (tab not visible at P0)
- Mind subtabs: 1 active (home) + Achievements progress chip
- **Total interactive elements at P0: ~14-16** (down from 57)

This puts SYNAPSE in the **NGU Idle zone (10-16 elements)** which is the genre-healthy baseline.

### Phase 2 — Reveal celebration + finishing polish

Each new unlock should FEEL earned, not silently appear.

| Step | Action | Files | Effort |
|---|---|---|---|
| 2.1 | "New Tab Unlocked!" toast on TabBar reveals (Neurons at P1, Regions at P5) — 2s top-of-screen toast + soft chime + "New!" badge that pulses for 30s on the new tab | `src/ui/hud/TabBar.tsx`, new `TabUnlockToast.tsx` | 3 hr |
| 2.2 | "New Region Available" toast when first region card appears (Hipocampo at P1) and when subsequent regions unlock | `src/ui/panels/RegionsPanel.tsx`, hook into prestige action | 2 hr |
| 2.3 | "New Subtab Available" pulse on the Mind tab badge when Patterns/Diary/Mastery/etc. subtab unlocks | `src/ui/hud/TabBar.tsx`, badge state | 2 hr |
| 2.4 | M-7 — animated arrow/glow on TutorialHints target buttons (was its own item; folds into Dimension M because it makes the new gates discoverable) | `src/ui/modals/TutorialHints.tsx`, new `TutorialTargetCallout.tsx` | 4 hr |
| 2.5 | ConsciousnessBar — gate to fixed prestige (P1+) instead of dynamic 50% threshold so its appearance is consistent + earned | `src/ui/hud/ConsciousnessBar.tsx` | 30 min |
| 2.6 | M-9 — Cosmetics in-game discovery (chip + post-prestige toast) | `src/ui/hud/`, hook into prestige action | 3 hr |

**Phase 2 total:** ~14-15 hours.

### Phase 3 — Measure + validate

| Step | Action | Effort |
|---|---|---|
| 3.1 | Re-run the P0 / P3 / P5 / P7 / P10 / P19 census manually (open dev preview at each prestige). Compare to pre-fix table | 1-2 hr |
| 3.2 | Add a meta-test in `tests/meta/dimensionMCensus.test.tsx` — mounts `App` at P0/P3/P5/P10 with seeded state and asserts visible-element counts stay within budgets (e.g., P0 ≤ 16) | 3-4 hr |
| 3.3 | Update `docs/PROGRESS.md` with new Dimension M score | 30 min |

**Phase 3 total:** ~5-6 hours.

## Total Dimension M plan effort

- Phase 1: ~11 hours
- Phase 2: ~14-15 hours
- Phase 3: ~5-6 hours
- **Total: ~30-32 hours, ~4 focused days**

## Projected score improvement

| Aspect | Before | After |
|---|---|---|
| P0 visible elements | 57 | ~14-16 |
| Genre comparison | "5-57× denser than baseline" | "NGU Idle zone — healthy baseline" |
| Reveal celebration | None (silent unlocks) | Toasts + pulse badges + chime SFX |
| Locked-teaser strategy | Maximalist — show all 26 prestiges | Conservative — show next 3 unlocks |
| Bell-curve shape | Front-loaded plateau | Smooth ramp |
| **Dimension M score** | **3/10** | **7-8/10** |

D1 retention forecast lift: 30-40% → 45-55%.

---

## Recommended execution order

If you say "go", I'd execute in this order to maximize early payoff:

1. **All Tier 0 quick wins first** (~6-8 hours combined, finishes in one focused session). Includes the buffer-1 sim fix that's been bugging us, plus the easy Dimension M wins (M-5, M-6) and several compliance/UX gaps. Get a clean commit per item or batch.
2. **Dimension M Phase 1** (~11 hours, the heavy lift). One commit per UI surface gated. Verify P0 census after each.
3. **GDPR data export H-1** (~4-6 hours). The other CRITICAL item I can solve.
4. **Dimension M Phase 2** (~14 hours). Celebration polish.
5. **Dimension M Phase 3** (~5 hours). Measure + validate + meta-test.
6. **Remaining Tier 2 items** (D-1, A-1, A-2 visual portions, G-1, M-7, D-2, C-1 cross-cutting flash component) — pick by priority.

Throughout, I'll commit at every green phase boundary (per `feedback_phase_commits` memory) and keep tests + gates green.

---

**Ready to start.** Tell me where to begin (default: Tier 0 → Dimension M Phase 1 → H-1 → Dimension M Phase 2/3 → remaining Tier 2).
