# SYNAPSE — UI Redesign Proposal (post-Mi A3 playtest)

**Status:** PROPOSAL — pending Nico approval before implementation.
**Author:** Claude Opus 4.7 (acting as senior idle-game UI/UX designer)
**Date drafted:** session-Day-5 of pre-launch audit cycle

---

## 0. Executive summary

The Mi A3 playtest exposed three distinct classes of UI failure:

1. **Layout collapse on narrow screens** — top HUD elements overlap, panels open at wrong heights, neurons go off-canvas, settings gear in wrong corner. Patched with tactical fixes today (commits `3156689` + `f5be810` + `132d233`) but the underlying layout isn't laid out for narrow Android.

2. **Pointer-events bugs class** — every fullscreen overlay mounted under HUD's `pointerEvents:'none'` wrapper renders visually but its interactive elements are dead. Hit OfferOrchestrator (5 modals) + CycleSetupScreen (Polarity selection). Patched today.

3. **Tutorial pacing too fast / no narrative anchor** — player drops into a fully-loaded HUD on the first launch. They see thoughts counter + rate counter + focus bar + discharge timer + 4 tabs + connection chip + memories chip + mood chip + settings gear, all at once, with no context. Genre best-practice (Cookie Clicker, AdCap, NGU, Realm Grinder, Idle Slayer) is to **start with one element and earn the rest**. Players who can't immediately answer "what do I do?" churn within 30 seconds.

The first two are tactical bugs (mostly fixed). The third is the architectural problem this proposal addresses: **The first 5-10 minutes of SYNAPSE need a narrative-tutorial that earns each UI element through the player's own actions.**

**Ship recommendation:**
- Don't launch the current build to the public store. The Mi A3 patches make it function, but a cold first-time player will still get HUD-overload + zero narrative anchor.
- Implementing this proposal is a 5-8 day focused effort. The result is a launch-quality product that justifies the polish you've put into the engine, balance, and content.

---

## 1. The unifying concept — "The Mind Awakens"

SYNAPSE's narrative premise is already perfect for this: **you ARE a mind that's just waking up**. The current UI ignores this — it presents a finished dashboard from second one. The new UI uses **diegetic progressive disclosure**: every UI element is itself a "memory the mind recovers". Nothing exists until the mind earns it.

This is genre-standard (Cookie Clicker hides everything behind incremental triggers; AdCap shows only the first business; NGU starts with a single attack button), but SYNAPSE has a unique narrative justification that none of those games have. Every UI element appearing can be framed as "the mind remembering what it can do" — making the tutorial feel like a story, not an instruction manual.

**Core design principles:**

| # | Principle | Application |
|---|---|---|
| 1 | Start blank | First launch = pure black canvas + 1 faint neuron. Nothing else. |
| 2 | One element at a time | Each UI element appears with a narrative beat ("...something stirs..." / "I can think..." / "Connections form...") |
| 3 | Earn don't show | No element appears until the player has done the action that justifies it |
| 4 | Diegetic transitions | UI fade-ins styled as "memory recovery" — soft cyan glow + gentle scale-up |
| 5 | Player paces themselves | No timed prompts in tutorial. The mind reveals when the player is ready |
| 6 | Silent first 5 minutes | Zero modals, zero offers, zero IAP prompts during the tutorial arc |
| 7 | Convention after mastery | Once the player completes Phase 7 (first prestige), the polished modern HUD is fully visible |

---

## 2. New tutorial flow — "The Mind Awakens" (Phase 0 → Phase 8)

8 phases spanning the first ~10-15 minutes of play. Each phase has:
- **Trigger condition** (what unlocks it)
- **Narrative beat** (single line of italic text that fades in/out)
- **UI elements that appear** (the diegetic disclosure)
- **Player goal** (what they're meant to do next)

### Phase 0 — Pre-thought (first 0-5s)

```
┌────────────────────────────────────┐
│                                    │
│                                    │
│                                    │
│                                    │
│                                    │
│                                    │
│              ✦                     │   ← single faint neuron, soft cyan pulse
│           (faint)                  │
│                                    │
│                                    │
│                                    │
│       ...something stirs...        │   ← italic, low-opacity, fades after 3s
│                                    │
│                                    │
└────────────────────────────────────┘
```

- **Trigger:** app first launch (no save loaded)
- **Narrative:** "...something stirs..."
- **UI:** ONE neuron (basica) at canvas center, faint cyan, slow ambient pulse. No HUD chrome at all.
- **Goal:** invite the player to tap. Nothing is labeled. The neuron glow tells them.
- **Time budget:** 3-8 seconds before player taps

### Phase 1 — First thought (5-15s in)

```
┌────────────────────────────────────┐
│  1                                 │   ← number fades in TINY at top-left
│                                    │     (no label, no chrome)
│                                    │
│              ●                     │   ← neuron now solid cyan after first tap
│                                    │
│                                    │
│           +1 +1 +1                 │   ← floaters appear with each tap
│                                    │
│                                    │
│                                    │
│         ...a thought...            │
│                                    │
└────────────────────────────────────┘
```

- **Trigger:** first tap on neuron
- **Narrative:** "...a thought..."
- **UI added:** thought counter (tiny, top-left, no label, no formatting). Tap floater on canvas.
- **Goal:** keep tapping
- **Time budget:** 10-30 seconds — let the player tap freely

### Phase 2 — The mind names itself (15-45s in)

```
┌────────────────────────────────────┐
│  5                                 │
│  thoughts                          │   ← label fades in below the number
│                                    │
│              ●                     │
│                                    │
│                                    │
│            +1                      │
│                                    │
│                                    │
│                                    │
│         ...I can think...          │
│                                    │
└────────────────────────────────────┘
```

- **Trigger:** thoughts >= 5 (i.e. 5 manual taps)
- **Narrative:** "...I can think..."
- **UI added:** "thoughts" label below the counter
- **Goal:** keep tapping toward 10
- **Time budget:** ~10-15s

### Phase 3 — More minds (45s-2min in)

```
┌────────────────────────────────────┐
│  10                                │
│  thoughts                          │
│                                    │
│              ●                     │
│                                    │
│                                    │
│       ┌──────────────┐             │
│       │  +1 neuron   │             │   ← buy button fades in centered low
│       │  (10 thoughts) │           │     "spend thoughts to grow"
│       └──────────────┘             │
│                                    │
│         ...connections form...     │
│                                    │
└────────────────────────────────────┘
```

- **Trigger:** thoughts >= 10 (cost of first additional Basica)
- **Narrative:** "...connections form..."
- **UI added:** A SINGLE buy button overlaid at canvas center-low. NOT inside a tab — directly on the canvas, big and obvious. Disappears after first purchase.
- **Goal:** spend thoughts on a 2nd neuron
- **Time budget:** as long as player needs

### Phase 4 — Production begins (2-4min in)

```
┌────────────────────────────────────┐
│  15            +0.5/s              │   ← rate counter fades in top-right
│  thoughts                          │
│                                    │
│              ●  ●                  │   ← 2 neurons now
│                                    │
│                                    │
│                                    │
│                                    │
│         ...thoughts flow...        │
│                                    │
└────────────────────────────────────┘
```

- **Trigger:** first neuron purchase complete
- **Narrative:** "...thoughts flow..."
- **UI added:** rate counter (top-right). Subtle "+0.5/s" in success green.
- **Behavior change:** Buy button disappears. Player can either tap the neurons (manual) or wait (passive). Both are valid.
- **Goal:** accumulate ~50 more thoughts (sets up Phase 5)
- **Time budget:** 1-3 minutes

### Phase 5 — Tab interface emerges (4-6min in)

```
┌────────────────────────────────────┐
│  50            +1.0/s              │
│  thoughts                          │
│                                    │
│              ●  ●  ●  ●            │
│                                    │
│                                    │
│                                    │
│                                    │
│         ...I can choose...         │
│                                    │
├────────────────────────────────────┤
│             Neurons                │   ← FIRST tab appears, just one
└────────────────────────────────────┘
```

- **Trigger:** ~50 thoughts (about 4-5 neurons owned)
- **Narrative:** "...I can choose..."
- **UI added:** Bottom tab bar, but with only ONE tab: Neurons. Single tab pulsing softly to invite tap.
- **Goal:** open the Neurons tab, see the panel UI for the first time
- **Time budget:** ~30s for player to discover

### Phase 6 — Focus emerges (~6-8min in)

```
┌────────────────────────────────────┐
│  500           +5.0/s              │
│  thoughts                          │
│ ━━━░░░░░░░░░░░░░░░░░░             │   ← Focus bar fades in, faint cyan
│                                    │
│              ●  ●  ●  ●            │
│              ●  ●  ●               │
│                                    │
│                                    │
│         ...focus...                │
│                                    │
├────────────────────────────────────┤
│   Neurons    Upgrades              │   ← second tab appears
└────────────────────────────────────┘
```

- **Trigger:** Focus bar reaches 50% for the first time (player has tapped enough)
- **Narrative:** "...focus..."
- **UI added:** Focus bar (was rendering before but you didn't see it because it stayed at 0%). Now visible. Upgrades tab appears.
- **Goal:** Keep tapping, watch the focus bar grow
- **Time budget:** ~1-2 min

### Phase 7 — Discharge (~8-10min in)

```
┌────────────────────────────────────┐
│  2.5K          +18/s               │
│  thoughts                          │
│ ━━━━━━━━━━━━━━━━━━░░░░             │   ← Focus near full
│         ⚡ Discharge ready         │   ← chip fades in CENTERED
│                                    │
│              ●  ●  ●  ●            │
│              ●  ●  ●               │
│                                    │
│                                    │
│         ...release...              │
│                                    │
│       ┌──────────────────┐         │
│       │  DISCHARGE  ⚡   │         │   ← BIG button fades in
│       └──────────────────┘         │
├────────────────────────────────────┤
│   Neurons    Upgrades              │
└────────────────────────────────────┘
```

- **Trigger:** Focus bar reaches 100% for the first time
- **Narrative:** "...release..."
- **UI added:** Discharge button (big, centered, pulsing). "Discharge ready" chip. The first time, it's auto-charged with the tutorial ×3 multiplier (TUTOR-2 already does this).
- **Goal:** tap Discharge → get the dopamine hit (Cascade overlay still fires)
- **Time budget:** as long as the player needs

### Phase 8 — Awakening introduces meta-loop (~12-15min in, end of tutorial)

```
┌────────────────────────────────────┐
│  20K           +50/s               │
│  thoughts                          │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━░░░       │
│ ▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰░░             │   ← Awakening progress bar
│         80% to Awakening           │
│                                    │
│              ●  ●  ●  ●            │
│                                    │
│                                    │
│       ...beyond this self...       │
│                                    │
├────────────────────────────────────┤
│   Neurons    Upgrades    Mind      │   ← Mind tab appears (Awakening lives here)
└────────────────────────────────────┘
```

- **Trigger:** cycleGenerated >= 80% of tutorialThreshold (25K)
- **Narrative:** "...beyond this self..."
- **UI added:** Awakening progress bar (the thin bar we already have). Mind tab fades in. When threshold hit, AwakeningScreen takes over with its full ceremony (already exists).
- **Goal:** complete first Awakening → tutorial is over → full HUD becomes visible

### Post-Phase 8 — Full HUD (15min+ in)

After the first Awakening completes, ALL remaining HUD elements appear at once with a soft "memories restored" transition. From here on, the player has the polished launch HUD (per Section 3). The "mind awakens" framing is done — the mind is now self-aware and the game is fully present.

---

## 3. Final main HUD (post-tutorial, the launch UI)

This is what the player sees after their first Awakening, and from then on:

```
┌────────────────────────────────────────────┐
│  [Android status bar — system]             │
├────────────────────────────────────────────┤
│                                            │
│  23.1K  thoughts        +30.9/s            │   Row 1 — hero pair (large)
│  ▰▰▰▰▰▰▰▰▰░░░░░░░░░░░░░░░░░░░             │   Row 2 — thin awakening bar
│                                            │
│  13 mem    ✦ x1.05    68 ◐         ⚙     │   Row 3 — status chips + settings gear
│                                            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━       │   Row 4 — focus bar, full width
│            ⚡  ⚡  Discharge 4:37          │   Row 5 — discharge pips + countdown
│                                            │
│                                            │
│              ●     ●                       │
│           ●     ●     ●                    │
│              ●     ●                       │   Canvas — auto-scaled
│           ●     ●     ●                    │     (60-70% viewport)
│              ●     ●                       │
│                                            │
│                                            │
│         ┌──────────────────┐               │
│         │   DISCHARGE  ⚡  │               │   Discharge button (only when ready)
│         └──────────────────┘               │
│                                            │
├────────────────────────────────────────────┤
│  Mind   Neurons   Upgrades   Regions      │   Bottom tab bar
└────────────────────────────────────────────┘
```

**Key changes vs current state:**

| Element | Now (post-Option C) | Proposed | Why |
|---|---|---|---|
| Top tabs | None | None | Already correct |
| Bottom tabs | 4 (Mind/Neurons/Upgrades/Regions) | Same | Standard mobile pattern; already correct |
| Hero row | Thoughts left + Rate right | Same but tighter | Already correct |
| Awakening bar | Thin cyan bar | Same | Already correct |
| Status chips | Separate components, 3 rows visually | Single horizontal row | Already mostly fixed |
| Settings gear | Top-right below stack | Same | Already fixed |
| Discharge | Bottom-center, ready-only | Same | Already fixed |
| Canvas | Auto-scaled spiral | Same | Already fixed |

**Verdict on main HUD:** the changes from today's playtest fixes already get us 80% there. Once the layout stabilizes on the actual Mi A3 device (validating tomorrow's screenshot), this is launch-ready.

---

## 4. Tab content redesign

### 4.1 — Neurons tab

**Current state:**
- Vertical list of neuron rows (5 types)
- Each row: name + count × rate + cost + Buy button
- Mode selector (×1 / ×10 / Max) at bottom
- Effective total at bottom

**Problems on Mi A3:**
- Each row very tall, only 3-4 fit on screen
- Lots of repeated label text ("thoughts" written 5 times in one screen)
- Mode selector buried at bottom
- No visual indication of which is "best buy now"

**Proposed:**

```
┌────────────────────────────────────┐
│   NEURONS                ×1 ×10 ⌧  │   ← title + mode selector at TOP
├────────────────────────────────────┤
│                                    │
│   ●  Basic           ×42           │   ← compact card row
│       0.5/s each                   │
│       ─────────────────  21/s      │
│                            12 th  │   ← cost displayed inline
│                                    │
├────────────────────────────────────┤
│                                    │
│   ●  Sensory         ×8       ★   │   ← star = best DPS-per-thought now
│       2/s each                     │
│       ─────────────────  16/s      │
│                            48 th  │
│                                    │
├────────────────────────────────────┤
│                                    │
│   ●  Pyramidal       ×0            │   ← greyed when not unlocked yet
│       Unlock at 10 Sensory         │
│                                    │
└────────────────────────────────────┘

Bottom: 18.3 thoughts/s effective
```

Changes:
- Mode selector at TOP (not buried)
- Each row is more compact (3 lines instead of 5)
- "★" badge marks best DPS-per-thought purchase
- Locked rows show requirement clearly
- Cost on the right side (RTL-friendly later)
- Effective total at bottom (sticky)

### 4.2 — Upgrades tab

**Current state:**
- Three sections (Affordable / Teaser / Locked) — Locked hidden at <P5
- Vertical scrolling list

**Problems on Mi A3:**
- Each upgrade row very tall
- Hard to scan affordable vs not
- No category grouping

**Proposed:**

```
┌────────────────────────────────────┐
│   UPGRADES        Affordable: 3    │   ← title + count
├────────────────────────────────────┤
│                                    │
│   ⚡ Mielina                       │   ← affordable section, top
│      +50% tap power                │
│      ──────────────  Buy 5 sparks  │
│                                    │
│   ✦ Potencial Sináptico            │
│      +25% production                │
│      ──────────────  Buy 8 sparks  │
│                                    │
├─ Coming next ──────────────────────┤
│                                    │
│   ◯ Convergencia                   │   ← teaser, dimmer
│      +1 charge max                 │
│      Need 15 sparks                │
│                                    │
└────────────────────────────────────┘
```

Changes:
- Affordable count badge in header
- Affordable section first (scannable in 1 look)
- Teaser section labeled "Coming next"
- Reduced row height (~3 lines vs 5)

### 4.3 — Mind tab

**Current state:**
- Subtab bar at top (home / patterns / diary / mastery / archetypes / resonance / achievements)
- Bottom-sheet body opens at top:25%

**Problems:**
- Too many subtabs visible (gating helps but P13+ shows 7)
- Subtab labels don't fit on narrow screens (overflow scroll)
- Body content dense

**Proposed:**

```
┌────────────────────────────────────┐
│   MIND                             │
├────────────────────────────────────┤
│                                    │
│   ✓ Achievements      3/35  →     │   ← list of "rooms" instead of pills
│   ◐ Patterns                  →   │
│   📖 Diary            12 entries → │
│   🎯 Mastery          5 unlocked → │
│   🦋 Archetypes       Analítica → │
│                                    │
│   ─────────────────────────────    │
│                                    │
│   Locked:                          │
│   ◇ Resonance         P13          │
│                                    │
└────────────────────────────────────┘
```

Changes:
- Replace horizontal scrolling subtab pills with vertical "rooms" list
- Each room = whole sub-screen (scrollable view that takes over)
- Back button returns to room list
- Locked rooms shown grouped at bottom with unlock requirement

This is a significant pattern change — closer to NGU's "Adventure / Inventory / Stats" sub-pages — but more readable on narrow screens.

### 4.4 — Regions tab

**Current state:**
- Vertical list of 5 region cards
- Each card has name, status, in-region upgrades, special panels (Hipocampo shards, Limbico mood)
- Far-future regions hidden

**Problems on Mi A3:**
- Region cards very tall (Hipocampo card is ~half the screen alone with its shard tree)
- No overview of "where am I?"

**Proposed:**

```
┌────────────────────────────────────┐
│   REGIONS                4/5       │
├────────────────────────────────────┤
│                                    │
│         ┌──────────────────┐       │
│         │      Brain       │       │
│         │       map        │       │
│         │                  │       │   ← Brain map (canvas) showing 5 regions
│         │   [Hipocampo]    │       │     as illuminated nodes; tap to drill in
│         │     ●━━━●        │       │
│         │  ●━━●  ●━━●     │       │
│         │     [Broca?]     │       │   ← unowned regions dim
│         └──────────────────┘       │
│                                    │
│   Tap a region to manage           │
│                                    │
└────────────────────────────────────┘

(Tap Hipocampo → opens detail page with shard tree, scrollable)
```

Changes:
- Brain map overview as the entry point (canvas-based, GDD §16 already mentions this)
- Tap a node → dedicated page for that region
- Eliminates the giant scrolling list of region cards on the main view

This is the most ambitious tab change. **Could be deferred to v1.1** if scope is too tight — current list works, it's just dense.

---

## 5. Modal redesign

### 5.1 — CycleSetupScreen (post-Awakening)

**Current state:** full-screen panel with vertical sections per slot (Polarity, Mutation, Pathway, Continue button). Stepper layout on phone, columns on tablet.

**Problems:**
- Visually noisy — lots of "card-in-card-in-card"
- Continue button hard to find
- WhatIf preview at bottom often clipped on Mi A3

**Proposed:** mostly OK once pointerEvents bug is fixed. Two minor changes:
- Continue button as a sticky FAB at bottom-right (not in the scrollable flow)
- WhatIf preview as a collapsible drawer (not always-visible) so it doesn't push Continue off-screen

### 5.2 — AwakeningScreen (the prestige ceremony)

**Current state:** modal taking over with cycle stats + Continue button.

**Proposed:** keep current; this is a celebration moment and the visual ceremony is good.

### 5.3 — StarterPackModal + GeniusPassOfferModal + LimitedTimeOfferModal

**Current state:** centered card with title + bundle + Accept / Not now buttons.

**Proposed:** keep current visual style; the pointerEvents bug is fixed. **One UX add:** delay these by 30 seconds after first eligibility so they don't fire mid-Awakening-celebration. Stagger.

### 5.4 — Settings modal

**Current state:** scrollable list of 8 sections (General / Audio / Accessibility / Notifications / Privacy / Account / Subscription / Game / Legal).

**Proposed:** keep current; it's a settings screen, players know what to expect. **One add:** group with iconography (gear sub-icons) so scanning is faster.

---

## 6. Implementation plan

### Phase A — Tutorial flow ("The Mind Awakens") — ~16-20 hours

The biggest piece. Must build:
- Tutorial state machine (`useGameStore` field tracking current phase 0-8)
- Element gating system (each HUD element checks the phase before rendering)
- Narrative beat overlay (italic text fade-in/out)
- Trigger conditions for each phase
- "Memory restored" transition animation for element fade-ins
- Phase-skipped path for veterans (settings toggle "Skip tutorial intro" — already shipped C-2)

Priority: **CRITICAL for launch** per Nico's note "vital for engagement"

### Phase B — Final HUD polish — ~6-8 hours

Mostly done today via Option C commit (`f5be810`). Remaining:
- Verify on Mi A3 (visual diff vs the screenshot bug-state)
- Tighten typography of hero pair (consistent line-height)
- Status row: chip styling pass (rounded backgrounds, equal padding)
- Mood indicator: replace numeric "68" with progress fill so the chip reads at a glance

Priority: **HIGH for launch** — finish the polish that's 80% done

### Phase C — Tab content redesigns — ~12-16 hours

In priority order:
- Neurons tab restyling (compact rows + mode selector to top): ~4 hrs
- Upgrades tab restyling (affordable count badge + section renaming): ~3 hrs
- Mind tab restructure (rooms list vs subtab pills): ~5-6 hrs
- Regions tab brain-map overview: **DEFER to v1.1** (~6+ hrs alone, lower priority)

Priority: **HIGH for launch** for Neurons + Upgrades; **MEDIUM** for Mind; **DEFER** for Regions.

### Phase D — Modal polish — ~4 hours

- Continue button as sticky FAB on CycleSetupScreen
- WhatIf preview as collapsible drawer
- Stagger offer modals by 30s post-Awakening

Priority: **MEDIUM for launch**

### Phase E — Tests + verification — ~6-8 hours

- Update HUD tests to handle the tutorial-phase gating
- Update tab tests (Neurons row count, Upgrades section, Mind subtab)
- Device verification cycle on Mi A3 (multiple screenshots, different progress states)
- E2E tutorial walkthrough test (P0 → first Awakening, asserts each phase fires correctly)

Priority: **HIGH** — without this we ship without confidence in the new flow

### Total effort estimate

| Phase | Effort | Priority |
|---|---|---|
| A: Tutorial flow | 16-20h | CRITICAL |
| B: Final HUD polish | 6-8h | HIGH |
| C: Tab content (Neurons + Upgrades + Mind) | 12-16h | HIGH (Mind is MEDIUM) |
| D: Modal polish | 4h | MEDIUM |
| E: Tests + verification | 6-8h | HIGH |
| **Total** | **44-56 hours** | |

That's ~5-7 focused working days. Plus device verification time (~1 hour per cycle, multiple cycles).

---

## 7. Decision points for Nico

### 7.1 — Scope

Pick one:

**Option A (full):** Phases A + B + C + D + E. ~5-7 days. Launch-quality, narrative-driven, polished. **Recommended if you can wait a week.**

**Option B (focused):** Phase A (tutorial) + B (HUD polish) + C-partial (Neurons + Upgrades only) + E (tests). Skip Mind restructure + Regions brain-map + modal polish. ~3-4 days. Ships the most-impactful 60% of the work.

**Option C (minimal):** Phase A (tutorial only) + E (tests for tutorial). Ships the engagement-vital piece. ~2-3 days. Falls back to current HUD post-tutorial. **Recommended if launch deadline is tight.**

### 7.2 — Veteran-skip toggle

Should the tutorial be skippable from launch, or only via the Settings toggle (already shipped C-2)?

**Recommendation:** make it skippable via a "I've played idle games before" button on Phase 0's screen. One tap → jump to Phase 8 with default state. Gives speedrunners + replayers an out without forcing them through the narrative.

### 7.3 — Mockup approval

Re-read the mockups in Section 2 (tutorial) and Section 3 (final HUD). For each phase:
- "Yes, ship as drawn" → I implement as proposed
- "Change X" → tell me what; I redraw
- "Skip phase N" → I collapse 2 phases into 1

### 7.4 — Order of operations

Once approved, execute in this order:
1. Tutorial flow (Phase A) — biggest leverage, also most risk
2. HUD polish (Phase B) — finish what we started today
3. Tab content (Phase C) — players will notice on first tab open
4. Modal polish (Phase D) — minor
5. Tests (Phase E) — interleaved with each above

---

## 8. What this proposal does NOT cover

To keep scope clear:

- **Visual styling** (color palette, typography choices, icon designs): unchanged. Current bioluminescent theme is good.
- **Game mechanics**: unchanged. No balance changes proposed.
- **Story content / narrative writing**: only the 8 tutorial beats are proposed. The rest of NARRATIVE.md stays as-is.
- **Audio**: unchanged. The Cascade + Insight SFX are still the only audio gap (N-5).
- **iOS**: deferred per project memory.
- **Spanish localization**: deferred per project memory.
- **Cloud sync**: deferred (not in v1.0 scope).

---

## 9. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Tutorial state machine breaks save migrations | Medium | Add a phase-tracking field to GameState (134 → 135), defensive load |
| Players miss the "buy first neuron" prompt and quit | Low | Phase 3's centered overlay button is hard to miss |
| Veterans annoyed by the slow tutorial | Medium | Skip button on Phase 0 + Settings toggle |
| New tutorial breaks existing analytics events | Low | Keep all existing event names; add new ones for phase transitions |
| Test suite needs major rework | High | Phase E budget covers this; expect 6-8h |
| Mi A3 perf hit by extra fade transitions | Low | Each transition is <300ms CSS opacity; minimal cost |

---

## 10. Final recommendation

**Ship Option B (focused)** for v1.0:
- Phase A (tutorial) — vital for engagement
- Phase B (HUD polish) — finishes today's work
- Phase C-partial (Neurons + Upgrades only)
- Phase E (tests)

Skip Mind restructure + Regions brain-map + modal polish — those become v1.0.1 or v1.1 patches that don't block launch.

Total: ~3-4 focused working days for me, then ship.

If you want the full version (A+B+C+D+E full) the answer is the same plan, just one week instead of half a week.

**Which option do you pick?**
