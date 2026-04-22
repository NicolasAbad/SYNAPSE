# SYNAPSE — Game Design Document

**Version:** 2.1 (post-consolidation, all bugs closed, all specs complete)  
**Last updated:** 2026-04-16  
**Status:** Ready for implementation (Sprint 1)

This is the single source of truth for SYNAPSE's mechanics. When a value in code disagrees with this doc, the doc wins (update the code). When a value in this doc is unclear, stop and ask before implementing. When balance simulations (TEST-5) show a value doesn't work, update this doc first, then update code.

---

## Table of contents

1. [Concept & vision](#1-concept--vision)
2. [Core loops](#2-core-loops)
3. [Economy — 3 currencies](#3-economy--3-currencies)
3b. [Visual identity — bioluminescent aesthetic](#3b-visual-identity--bioluminescent-aesthetic)
4. [Production formula](#4-production-formula)
5. [Neurons — 5 types](#5-neurons--5-types)
6. [Focus Bar & Insight](#6-focus-bar--insight)
7. [Discharge, Cascade, Charges](#7-discharge-cascade-charges)
8. [Spontaneous Events (12)](#8-spontaneous-events-12)
9. [Prestige system (3 Eras, 26 cycles)](#9-prestige-system-3-eras-26-cycles)
10. [Pattern Tree (50 nodes + 5 decisions)](#10-pattern-tree-50-nodes--5-decisions)
11. [Polarity (P3+)](#11-polarity-p3)
12. [Archetypes — 3 types (P5+)](#12-archetypes--3-types-p5)
13. [Mutations — 15 pool (P7+)](#13-mutations--15-pool-p7)
14. [Neural Pathways — 3 routes (P10+)](#14-neural-pathways--3-routes-p10)
15. [Resonance system (P13+)](#15-resonance-system-p13)
16. [Regions — 5 brain areas](#16-regions--5-brain-areas)
17. [Mental States — 5 states](#17-mental-states--5-states)
18. [Micro-challenges — 8 pool](#18-micro-challenges--8-pool)
19. [Offline system](#19-offline-system)
20. [Transcendence & Runs](#20-transcendence--runs)
21. [Run-exclusive upgrades — 4 for v1.0 (+2 post-launch)](#21-run-exclusive-upgrades--4-for-v10-2-post-launch)
22. [Resonant Patterns & Secret Ending](#22-resonant-patterns--secret-ending)
23. [Era 3 unique events (P19-P26)](#23-era-3-unique-events-p19-p26)
24. [The 35 upgrades (categorized)](#24-the-35-upgrades-categorized)
24.5. [Achievements (30)](#245-achievements-30--added-by-second-audit-2d-1)
25. [Weekly Challenge (CORE-9)](#25-weekly-challenge-core-9)
26. [Monetization](#26-monetization)
27. [Analytics — 48 events](#27-analytics--48-events)
28. [Audio](#28-audio)
29. [UI / HUD / tabs](#29-ui--hud--tabs)
30. [Type definitions](#30-type-definitions)
31. [Constants (complete)](#31-constants-complete)
32. [GameState (110 fields, fully enumerated)](#32-gamestate-110-fields-fully-enumerated)
33. [PRESTIGE_RESET (45 fields), PRESTIGE_PRESERVE (60 fields), PRESTIGE_UPDATE (4 fields)](#33-prestige_reset-45-fields-prestige_preserve-60-fields-prestige_update-4-fields)
34. [TRANSCENDENCE_RESET & TRANSCENDENCE_PRESERVE](#34-transcendence_reset--transcendence_preserve)
35. [All GDD rules (157)](#35-all-gdd-rules-157)
36. [Audit — edge cases, bugs, exploits (all resolved)](#36-audit--edge-cases-bugs-exploits-all-resolved)

---

# 1. Concept & vision

A neural network grows in your hands, from a single neuron to cosmic superintelligence. Each cycle is a chapter in a narrative of awakening, framed by bioluminescent aesthetics and philosophical fragments. The game is a **mobile idle/incremental** where active play rewards optimization but idle play never loses progress. Content depth (57 fragments + 4 endings in v1.0 + 3 Runs; 5th ending "The Witness" arrives in v1.5 — see POSTLAUNCH.md) exceeds typical idle scope.

**Target metrics (validated by simulation):**
- D1 retention: 40%
- D7 retention: 15%
- D30 retention: 6%
- Avg session: 4 minutes
- Sessions per day: 3-5
- Time to first ending: 30-40 days (casual) / 10 days (active)
- Time to all endings: 80-90 days (casual) / 31 days (active)
- Total content: 29 active hours across 4 endings + Secret + weekly challenges + personal bests + Ascension Mode (post-launch)

**What makes SYNAPSE different from other idle games:**
- Every prestige has a meaningful CHOICE (Polarity, Mutation, Pathway, Pattern Decision) — not just "bigger numbers"
- Narrative is baked INTO mechanics (archetype choice unlocks new fragments)
- 3-currency model with clean role separation (no currency sprawl)
- Free-to-play completes 100% of content (PHIL-1) — monetization is cosmetics + convenience only

---

# 2. Core loops

Three nested loops feed each other:

**Loop 1 (seconds):** Tap / buy neuron / buy upgrade → production rises → Focus Bar fills → Discharge ready. The moment-to-moment loop.

**Loop 2 (minutes, one cycle):** Accumulate thoughts → reach cycle threshold → Awakening (prestige) → new cycle starts with Patterns earned + Polarity/Mutation/Pathway chosen. A cycle is 7-25 minutes.

**Loop 3 (hours, one Run):** 26 prestiges = 1 Run. Each Run ends in Transcendence → reset with persistent Resonance + Patterns + achievements. 3 Runs total reveal 4 endings + a Secret 5th.

Loop 1 feeds Loop 2 (thoughts accumulate). Loop 2 feeds Loop 3 (patterns accumulate). Loop 3 closes the narrative arc.

---

# 3. Economy — 3 currencies

Clean role separation — no currency overlap. Each currency has one purpose. Sprint 6.8 re-architecture added **Memory Shards** as a sub-currency of Memorias (3 types), preserving the "3 primary currencies" mental model while adding passive drip progression. See §16.1 Hipocampo.

| Currency | Role | Resets on prestige | Resets on Transcendence | Earned from |
|---|---|---|---|---|
| **Pensamientos (Thoughts)** | Cycle currency — buy neurons, Thoughts-priced upgrades | ✓ Yes | ✓ Yes | Production (passive + tap) |
| **Memorias (Memories)** | Meta currency — buy Memoria-priced upgrades, Pre-commitment wagers, Memoria-upgrades | ✗ No | ✓ Yes | Prestiges, fragments, achievements, events, Shard conversion |
| **Chispas (Sparks)** | Premium currency — daily login, challenges, achievements, monetization | ✗ No | ✗ No | Daily login, achievements, weekly challenges, Resonant Patterns, IAP |
| **Shards** (sub-Memorias) | Hipocampo currency — passive drip per active play, buy Shard upgrades | ✗ No | ✗ No (lifetime) | Cycle-time drip per type: Emotional (events), Procedural (taps/purchases), Episodic (prestiges/RPs) |

**Shards to Memoria conversion:** Integrated Mind unlock "Memory Weave" converts 100 shards (any type mix) → 1 Memoria. See §16.6.

**Memory generation table (Sprint 6.8 updated — `consolidacion_memoria` retired per §16.8):**

| Source | Memories | Frequency |
|---|---|---|
| Prestige (base) | +2 | Every prestige |
| Fragment read | +1 | 79 v1.0 (12 base + 15 per archetype + 5 region unlocks + 3 cross-Run + 5 mood-tier beats + 5 dreams + 1 integrated-mind) |
| Hipocampo unlock | +3 | Once (preserved as REG-3) |
| Resonant Pattern discovered | +5 Sparks (not Memories) | 4 times lifetime |
| Lucid Dream Option B | +2 (or +3 with high-mood Empática) | P10+, 33%/100% by archetype |
| Spontaneous "Memoria Fugaz" | +1 | Max 1 per cycle |
| Pre-commit success | 2× cycle Memory reward | Per cycle (§16.2) |
| Pre-commit failure | 0.85× cycle Memory reward | Per cycle |
| Pre-commit streak (5+ consecutive) | +1 permanent Memoria/cycle | Lifetime while streak held |
| Shard conversion (Memory Weave) | +1 per 100 Shards | Any time shards ≥ 100 |
| Integrated Mind 4-region tier | +10% Memoria gain globally | Per cycle while tier held |
| Shard upgrade `shard_emo_resonance` | +2 Memory on fragment read (base +1) | Per new fragment |
| Shard upgrade `shard_epi_imprint` | +1 Memory per prestige | Per prestige |

---

# 3b. Visual identity — bioluminescent aesthetic

Canonical palette (from `docs/UI_MOCKUPS.html` `:root`):

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#05070d` | Background deep (canvas base) |
| `--bg2` | `#0a0d1a` | Background elevated (modals, sheets) |
| `--p` | `#8B7FE8` | Primary — violet/lavender (Focus Bar, Consciousness Bar default) |
| `--t` | `#22B07A` | Success — rate counter, gains |
| `--a` | `#F0A030` | Accent — thoughts counter, Discharge button |
| `--r` | `#E85050` | Error — rare warnings |
| `--bl` | `#4090E0` | Secondary accent blue |
| `--pk` | `#E06090` | Accent pink (Espejo, spontaneous events) |
| `--cy` | `#40D0D0` | Consciousness Bar highlights, Resonant Patterns |
| `--text` | `#e8e6f8` | Primary text (violet-white) |
| `--t2` | `#7070a0` | Secondary text (muted) |
| `--t3` | `#383860` | Disabled states |

**Typography:** Outfit (display + body) + JetBrains Mono (numeric displays for tabular figures that prevent HUD counter jitter). Both self-hosted via `@fontsource-variable/*` packages — no CDN dependencies per UI-8.

**Aesthetic direction:** dark canvas with violet + cyan organic glows evoking synapses firing at night. Amber accents for numeric emphasis (thoughts, Discharge). Era 1 is the bioluminescent default; Era 2 shifts toward cooler "clean geometry" aesthetics; Era 3 cosmic. Narrative tie-ins documented:
- `NARRATIVE.md:476` — Consciousness Bar violet by default, transitions to white-gold at P26 (Era 3 final cycle).
- `NARRATIVE.md:60` — Era 2 transition: "glow of biology replaced by clean geometry of thought made precise".

**Source of truth pairing:** `src/ui/tokens.ts` (TypeScript canonical values) + `docs/UI_MOCKUPS.html` (visual reference) + this section. Tailwind v4 `@theme` block is auto-generated from `tokens.ts` via `scripts/generate-tailwind-theme.ts` (`npm run build:tokens`) — `styles/_theme.generated.css` is a build artifact, not source. Changes to palette: update `tokens.ts` + `UI_MOCKUPS.html` + §3b table. Tailwind regenerates automatically on next build.

**Neuron type colors** (mapped Sprint 2 Phase 2 from canonical palette — ECO-1: no new hex values introduced):

| Type | Hex | Canonical token | Radius | Rationale |
|---|---|---|---|---|
| Básica | `#4090E0` | --bl blue | 8px | Foundational/calm; first type new players see |
| Sensorial | `#22B07A` | --t green | 10px | Biological "alive" perception (rate-counter overlap is semantically coherent: sense → rate) |
| Piramidal | `#8B7FE8` | --p violet | 12px | Primary/workhorse; mid-tier that carries P0-P9 progression |
| Espejo | `#E06090` | --pk pink | 14px | Reflective/empathic; mockup precedent (r=8 accent circle) |
| Integradora | `#40D0D0` | --cy cyan | 16px | Era 2 "clean geometry" foreshadow; semantic overlap with Consciousness Bar is deliberate (both = integration) |

Radii progression = `tier × 2 + 6 px` (Básica tier 1 → 8px, Integradora tier 5 → 16px). Visual radius only — tap hit-area is a separate Phase 3 concern per CODE-4 (iOS 44pt / Android 48dp minimums).

**Amber `--a` reserved HUD-only** (thoughts counter + Discharge button). Not assigned to any neuron type. Mockup's amber neuron circle (canvas line 46) is interpreted as a Flujo Eureka Mental State render — Sprint 7 MENTAL-4 will implement temporary amber glow on all neurons during that state.

Era arc via neuron palette: Era 1 violet-dominated (Piramidal is the primary buy) → Era 2 introduces cyan (Integradora unlocks P10+, Consciousness Bar also cyan) → Era 3 transitions to white-gold at P26 (per NARRATIVE:476, "consciousness bar is no longer purple — it's white-gold"). Each era transition introduces a new palette tone without backtracking.

**Phase 2 interim animation constants**

These canvas animation constants were introduced Sprint 2 Phase 2 with judgment-call values; Phase 7 perf spike may tune them after Pixel 4a testing. Values live in `src/ui/tokens.ts` MOTION and CANVAS blocks.

| Constant | Value | Rationale (Phase 2 interim) | Tune in |
|---|---|---|---|
| `MOTION.pulseRadiusAmp` | `0.1` | ±10% radius oscillation around base — subtle "alive" feel without distraction | Phase 7 |
| `MOTION.pulseOpacityMin` | `0.7` | Minimum opacity during pulse valley — neuron never fully fades | Phase 7 |
| `MOTION.pulseOpacityMax` | `1.0` | Maximum opacity during pulse peak — full visibility | Phase 7 |
| `CANVAS.glowRadiusMultiplier` | `2.5` | Glow halo extends 2.5× neuron radius — visible without dominating | Phase 7 |
| `CANVAS.scatterGoldenAngle` | `2.399` (≈137.5°) | Golden-angle spiral prevents clustering as neurons multiply | Phase 3 (multi-neuron) |
| `CANVAS.scatterBaseRadius` | `40` | Distance from canvas center to first non-Básica neuron | Phase 3 |
| `CANVAS.scatterRadiusStep` | `12` | Spacing increase per additional neuron | Phase 3 |

Tunable via `tokens.ts` edit + `npm run build:tokens`. Changes require visual verification per CLAUDE.md "Canonical storage file rule".

### Canvas theme slots (9 total)

The canvas rendering system supports 9 theme variants total — the "9 theme slots" figure referenced in SPRINTS.md §Sprint 2. These are derived empirically from the following GDD sections:

| Source | Count | Names | Selection |
|---|---|---|---|
| Era themes (§9) | 3 | `bioluminescent`, `digital`, `cosmic` | `state.eraVisualTheme` (prestige-driven) |
| Cosmetics Store themes (§26) | 4 | `aurora`, `deep_ocean`, `deep_space`, `temple` | `state.activeCanvasTheme` (purchased, $1.99 each) |
| Genius Pass exclusive (§26) | 1 | `genius_gold` | `state.activeCanvasTheme` (subscriber-only) |
| Starter Pack exclusive (§26) | 1 | `neon_pulse` | `state.activeCanvasTheme` (purchased $2.99 starter pack) |
| **Total** | **9** | | |

Era themes live in `ERA_THEMES: Record<EraVisualTheme, Theme>` registry (`src/ui/theme/themes.ts`). The other 6 cosmetic themes live in `CANVAS_THEMES: Record<string, Partial<Theme>>` (Sprint 9 content, Phase 4 ships empty).

Resolution order in `useActiveTheme()`:
1. Base: `ERA_THEMES[state.eraVisualTheme]`
2. Override if `state.activeCanvasTheme !== null`: `CANVAS_THEMES[state.activeCanvasTheme]`

`null` active canvas theme = Era default applies.

**Colorblind accessibility:** Sprint 10 (SPRINTS.md §Sprint 10) will add shape/pattern alternatives for color-only indicators. Current palette is NOT colorblind-safe by design — that is a Sprint 10 layer.

---

# 4. Production formula

```ts
// Base production per second (no temporary modifiers)
baseProductionPerSecond = 
  (sum of neuron.count × neuron.rate × polarityMod) 
  × connectionMult 
  × upgradeMult 
  × archetypeMod 
  × regionMult 
  × mutationStaticMod  // only static mutations (Hiperestimulación, Especialización, etc.)

// Apply softCap to the cumulative multiplier stack (NOT to the sum)
rawMult = connectionMult × upgradeMult × archetypeMod × regionMult × mutationStaticMod × polarityMod
finalMult = softCap(rawMult)

// Effective production includes temporary modifiers (used for tick, tap, UI display)
// Sprint 6.8 re-architecture: Mood layer added post-softCap (stacks multiplicatively
// with Mental States). Mood ranges 0.90 (Numb) → 1.30 (Euphoric). See §16.3.
effectiveProductionPerSecond = 
  baseProductionPerSecond 
  × insightMult 
  × mentalStateMod 
  × moodTierMod           // NEW Sprint 6.8: Mood tier multiplier (Numb 0.90 → Euphoric 1.30)
  × spontaneousEventMod 
  × mutationTemporalMod  // Crescendo, Sprint, etc.

// SoftCap function — prevents unbounded multiplier stacking
function softCap(x: number): number {
  if (x <= 100) return x;
  return 100 * Math.pow(x / 100, 0.72);
}
```

**Verified values (empirically confirmed via node, Phase 4 Sprint 1):**
- `softCap(100)` = 100 (exact, identity at boundary)
- `softCap(200)` = 164.71820345351463 (≈ 164.72)
- `softCap(1000)` = 524.8074602497726  (≈ 524.81)
- `softCap(10_000)` = 2754.2287033381663 (≈ 2754.23)

These are IEEE 754 bit-exact values from the implementation in `src/engine/production.ts`. Prior audit versions of this section contained fabricated approximations (notably `softCap(10_000) ≈ 1723.6` was off by 60%); corrected Phase 4 Sprint 1. See PROGRESS.md.

**Neuron cost scaling:**
```
cost(type, owned) = baseCost(type) × 1.28^owned
```

**Cost modifier order (COST-1 — never change):**
```
finalCost = baseCost × mutationCostMod × funcionesEjecutivasMod × pathwayCostMod
```

Example: Déjà Vu (×2 cost) + Funciones Ejecutivas (×0.88) + Equilibrada Pathway (×1.0) = `baseCost × 2.0 × 0.88 × 1.0 = baseCost × 1.76`

---

# 5. Neurons — 5 types

Unlocked progressively. First cycle shows only Básicas; others are teased with unlock requirement visible.

| # | Type (ES) | Type (EN) | Base cost | Base rate (thoughts/sec) | Unlock |
|---|---|---|---|---|---|
| 1 | Básicas | Basic | 10 | 0.5 | Start |
| 2 | Sensoriales | Sensory | 150 | 4.5 | 10 Básicas owned |
| 3 | Piramidales | Pyramidal | 2,200 | 32 | 5 Sensoriales owned |
| 4 | Espejo | Mirror | 35,000 | 220 | 5 Piramidales owned |
| 5 | Integradoras | Integrator | 600,000 | 1,800 | Era 2 (P10+) |

**Connections (passive multipliers):**
For every PAIR of neuron types that both have ≥1 neuron owned, `connectionMult += 0.05`. With all 5 types owned, `connectionMult = 1 + 10 × 0.05 = 1.5` (10 pairs from C(5,2)).

**Mutations like Especialización** that restrict production to 1 neuron type DO NOT reset connectionMult — pairs still count for the bonus, but only the chosen type's direct production applies.

---

# 6. Focus Bar & Insight

The Focus Bar is **active play's currency**. It fills only when the player taps.

**Fill rate:** Each tap adds `focusFillPerTap` (base 0.01 = 1% of bar per tap). Upgrades modify this.

**Thought contribution (TAP-2):** Each tap ALSO generates thoughts, computed as `Math.max(baseTapThoughtMin, effectiveProductionPerSecond × baseTapThoughtPct)`. At P0 with 1 Básica (0.5 thoughts/sec) and no upgrades: tap yields `max(1, 0.5 × 0.05) = max(1, 0.025) = 1` thought. This makes taps immediately meaningful for the UI-9 first-open sequence ("On first tap: thoughts accumulate"). When `Potencial Sináptico` upgrade (GDD §24) is owned, `baseTapThoughtPct` is replaced (NOT summed) with `0.10` (tap bonus 5% → 10% of effective production). `Sinestesia` Mutation (§13 #13) multiplies this by `(1 − 0.6) = 0.4` for the cycle it's active. Tap thoughts are subject to the same anti-spam penalty (TAP-1) as normal production — if anti-spam fires, `effectiveness *= antiSpamPenaltyMultiplier (0.10)`.

**Levels (progressive by prestige):**
- P0-P9: Bar max = 1.0 (level 1 — Claro / Clear Insight)
- P10-P18: Bar max = 2.0 (level 2 — Profundo / Deep Insight)
- P19+: Bar max = 3.0 (level 3 — Trascendente / Transcendent Insight)

**Insight trigger:** When `focusBar >= 1.0`, auto-activate Insight at the highest level achieved this cycle.

**Insight effect table:**

| Level | Production mult | Duration | Visual |
|---|---|---|---|
| Claro (1) | ×3.0 | 15s | Yellow glow on neurons |
| Profundo (2) | ×8.0 | 12s | White-blue glow |
| Trascendente (3) | ×18.0 | 8s | Rainbow glow |

Higher levels are more powerful but shorter, rewarding focused burst play.

**FOCUS rules:**
- **FOCUS-1:** Focus Bar only fills via taps (NOT during offline, NOT during idle on canvas — unless Meditación Mutation is active, see §13)
- **FOCUS-2:** Focus Bar does NOT reset on Insight activation (player can pre-charge for next Insight)
- **FOCUS-3:** Focus Bar resets on prestige UNLESS "Focus Persistente" upgrade is owned (retains 25% across prestige — not 50% as older docs said)

**Fix from BUG-06:** At P10 transition (max 1.0 → 2.0), if Focus Persistente is NOT owned, `focusBar = 0` on prestige. If owned, `focusBar *= 0.25`. Show one-time tooltip explaining levels 2-3 exist now.

---

# 7. Discharge, Cascade, Charges

**Discharge (Disparo):** A dopamine-burst mechanic. Costs nothing to activate; has charges that accumulate over time.

**Charges:**
- Accumulate: 1 charge per 20 minutes of active play (offline-aware: time the app was open + offline time both count, capped at offline cap)
- Max charges: 2 (P0-P9), 3 (P10+), 4 (P15+ with "Amplificador de Disparo" upgrade)
- On prestige: `dischargeCharges = 0`, `dischargeLastTimestamp = timestamp` (timer starts fresh)

**Discharge effect:**
- Base: instant burst of `effectiveProductionPerSecond × dischargeMultiplier × 60` (= 1 minute of production compressed)
- `dischargeMultiplier` base: 1.5 (P0-P2), 2.0 (P3+), can rise via upgrades
- Pre-P3 tutorial: first Discharge = ×3.0 (tutorialDischargeMult) to teach the mechanic

**Cascade:**
- Trigger: Discharge while `focusBar >= cascadeThreshold (0.75)` = Cascade
- Effect: Discharge multiplier = `dischargeMultiplier × cascadeMult (2.5)`
- Consumes Focus Bar entirely (sets to 0)
- Cascada Profunda upgrade: `cascadeMult` 2.5 → 5.0 (replaces base, not additive)
- Resonance upgrade `cascada_eterna`: `cascadeMult` base 2.5 → 3.0 (replaces base)
- **Stacking order:** `cascada_eterna` sets base to 3.0, then `Cascada Profunda` doubles it → final 6.0. Without `cascada_eterna`: 2.5 → 5.0. Max achievable: 6.0.

**Order of operations (fix from BUG-07):**
1. Check `focusBar >= 0.75` BEFORE applying Discharge
2. If yes, flag Cascade, apply ×cascadeMult
3. Execute Discharge burst
4. Set `focusBar = 0`
5. THEN apply any post-Discharge effects (Sincronización Total +0.18 bonus)
6. Second consecutive Discharge cannot be Cascade unless player fills Focus naturally again

---

# 8. Spontaneous Events (12)

"Golden cookie" of SYNAPSE. Every 4-6 minutes during a cycle, 40% chance of an event. Flash on canvas signals it. Effect applied automatically — the player doesn't have to act, but attentive players optimize around them.

**Impact:** Net +3-5% production per cycle. Does not significantly change prestige timing.

**Weighted random:** Positives 50%, Neutrals 33%, Negatives 17%.

**Event pool:**

| Event | Effect | Duration | Type |
|---|---|---|---|
| Eureka | Next upgrade costs 0 | Until used | Positive |
| Ráfaga Dopamínica | Production ×2 | 30s | Positive |
| Claridad Momentánea | Focus fills ×3 | 45s | Positive |
| Conexión Profunda | Connection multipliers give ×2 | 60s | Positive |
| Disparo Latente | +1 Discharge charge (instant) | Instant | Positive |
| Memoria Fugaz | +1 Memory (max 1/cycle) | Instant | Positive |
| Polaridad Fluctuante | Polarity reverses | 45s | Neutral |
| Mutación Temporal | Random Mutation (from pool of 15) stacks on top of current | 60s | Neutral |
| Eco Distante | Extra narrative fragment (cosmetic, stored to archive) | 4s | Neutral |
| Pausa Neural | Production = 0 but Focus fills ×5 | 10s | Neutral |
| Fatiga Sináptica | Production −30% | 45s | Negative |
| Interferencia | Focus Bar resets to 0 (max 1/cycle) | Instant | Negative |

**Tick logic:**
```ts
// Deterministic via seeded PRNG (CODE-9).
// Note: lastSpontaneousCheck stores absolute nowTimestamp (ms since epoch),
// not a cycleTime offset. See §32 field comment and §35 TICK-1 step 10.
if ((nowTimestamp - state.lastSpontaneousCheck) / 1000 >= randomInRange(240, 360, seed)) {
  state.lastSpontaneousCheck = nowTimestamp;
  if (seededRandom(seed) < 0.40) {
    const event = pickWeightedRandom(SPONTANEOUS_POOL, seed);
    applySpontaneousEvent(state, event);
    triggerCanvasFlash(event.type);
    logAnalyticsEvent('spontaneous_event', { id: event.id, type: event.type });
  }
}
```

`spontaneousMemoryUsed` and `spontaneousInterferenceUsed` track 1-per-cycle limits.

**SPONT-1 (seed):** Spontaneous event seed = `hash(cycleStartTimestamp + lastSpontaneousCheck)`. Each check advances `lastSpontaneousCheck`, producing a new seed for the next check. This ensures deterministic event sequences within a cycle, reproducible via TEST-5.

---

# 9. Prestige system (3 Eras, 26 cycles)

A Run consists of 26 prestiges grouped into 3 Eras. Each Era changes the game's rules.

**Threshold formula:**
```ts
threshold(prestigeCount, transcendenceCount) = baseThreshold(prestigeCount) × RUN_THRESHOLD_MULT[transcendenceCount]
```

Where `baseThreshold` is a lookup table (see §31 `baseThresholdTable` — 26 values, one per prestige level), and:
```
RUN_THRESHOLD_MULT = [1.0, 3.5, 6.0, 8.5, 12.0, 15.0]
```

**TUTOR-2 (tutorial threshold override):** When `isTutorialCycle === true` (first cycle of the first Run, before the first prestige ever), `currentThreshold = tutorialThreshold × RUN_THRESHOLD_MULT[transcendenceCount]` (effectively `50_000 × 1.0 = 50_000`) instead of `baseThresholdTable[0]`. `isTutorialCycle` flips to `false` inside `handlePrestige()` (see PREST-1 step 9 and §33 PRESTIGE_UPDATE). After the first prestige, all subsequent cycles use `baseThresholdTable[prestigeCount]` as normal. `isTutorialCycle` does NOT re-enable on Transcendence — it is a one-time first-ever-cycle flag. This implements the TUTOR-1 target (P0→P1 ≈ 7-9 min) without requiring a tutorial-specific code branch elsewhere.

**Threshold functions (THRES-1, second audit 2B-4):**

```ts
/**
 * Pure function. No side effects. Given (p, t), returns the scheduled threshold for that prestige in that Run.
 * Callers must handle TUTOR-2 override externally via calculateCurrentThreshold().
 * Clamps inputs defensively — defense against save corruption or out-of-range transcendenceCount.
 */
function calculateThreshold(prestigeCount: number, transcendenceCount: number): number {
  const { baseThresholdTable, runThresholdMult } = SYNAPSE_CONSTANTS;
  // baseThresholdTable has 26 entries (P0→P1 through P25→P26). Clamp p to [0, 25].
  const safeP = Math.max(0, Math.min(baseThresholdTable.length - 1, prestigeCount));
  // runThresholdMult has 6 entries (Runs 1-6). Clamp t to [0, 5]. Run 7+ clamps to last entry.
  const safeT = Math.max(0, Math.min(runThresholdMult.length - 1, transcendenceCount));
  return baseThresholdTable[safeP] * runThresholdMult[safeT];
}

/**
 * Effective threshold for the current cycle, incorporating TUTOR-2 tutorial override.
 * Callers: UI (display), tick (progress tracking), prestige-ready check.
 */
function calculateCurrentThreshold(state: GameState): number {
  if (state.isTutorialCycle) {
    const { tutorialThreshold, runThresholdMult } = SYNAPSE_CONSTANTS;
    const safeT = Math.max(0, Math.min(runThresholdMult.length - 1, state.transcendenceCount));
    return tutorialThreshold * runThresholdMult[safeT];
  }
  return calculateThreshold(state.prestigeCount, state.transcendenceCount);
}
```

Verified values: `calculateThreshold(0, 0) === 800_000` (P0→P1 Run 1), `calculateThreshold(0, 1) === 2_800_000` (P0→P1 Run 2, 800K × 3.5), `calculateThreshold(25, 2) === 42_000_000_000` (P25→P26 Run 3, 7B × 6.0). With `isTutorialCycle: true`, `calculateCurrentThreshold` returns `25_000` instead of 800K for P0→P1 (Sprint 3 Phase 7.4b retune; was 50K).

**Era 1 — El Despertar (P1-P9)**
- Bioluminescent aesthetic
- Introduce: Disparo (P0), Patrones + Regiones (P1), Polaridad (P3), Focus levels (P4), Arquetipos (P5), Meta upgrades (P6), Mutaciones (P7)
- Avg cycle time: 7-15 minutes
- Feeling: "I'm learning how this works"

**Era 2 — La Expansión (P10-P18)**
- Digital aesthetic (canvas evolves)
- Introduce: Neural Pathways (P10), Sueños Lúcidos (P10+), Integrator neuron (P10), Tier P10 upgrades, Resonance currency (P13), Área de Broca region (P14)
- Avg cycle time: 16-22 minutes
- Feeling: "I have real strategies now"

**Era 3 — La Transcendencia (P19-P26+)**
- Cosmic aesthetic
- Each of the 8 final cycles has a UNIQUE narrative event that changes rules (see §23)
- From P20: countdown visible ("7 awakenings to Transcendence")
- From P25: "The final awakening approaches"
- P26 confirmation: "Take your time. There is no rush."
- Avg cycle time: 24-35 minutes
- Feeling: "I'm approaching the ending"

**Era milestones table (Sprint 6.8 re-architecture — onboarding re-paced, Region sub-systems staggered):**

| Prestige | Feature unlocked | UI change |
|---|---|---|
| P0 | Start + Visual Foresight T1 | Canvas with Básicas only; What-if 3 cycles ahead |
| P1 | Patterns + Hipocampo region (Shards begin) | Mind tab, Regions tab (1 of 5 active — Hipocampo glows on brain canvas) |
| P3 | Polarity | CycleSetupScreen shows 1 column |
| P4 | Focus level 2 (Profundo) | Focus bar extends visually |
| P5 | Prefrontal + Límbico regions + Pre-commit unlocked + Visual T2 + Mood icon in HUD | CycleSetupScreen shows 2 columns (+ Pre-commit slot) |
| P6 | Meta upgrades | New upgrade category |
| P7 | Mutations **+ Archetypes** (migrated from P5 Sprint 6.8 — informed choice) | CycleSetupScreen shows 3 columns; Archetype choice modal |
| P10 | Neural Pathways, Era 2, Lucid Dreams, Auto-buy neurons (v1.1 pulled) | CycleSetupScreen shows 4 columns (Polarity/Mutation/Pathway/Pre-commit); canvas evolves |
| P12 | Visual Foresight T3 (Spontaneous 20s countdown) | Spontaneous badge previews |
| P13 | Resonance currency + Sintesis Cognitiva + Mastery begins visible | New Mind sub-tab for Resonance, Mastery tree |
| P14 | Área de Broca region + Inner Voice fully active | Region panel shows all 5 regions on brain canvas |
| P15 | Micro-challenges unlocked, Mini-map (v1.1 pulled) | Challenge banners at 30% threshold, mini-map overlay bottom-left |
| P17 | Personal Best tracking visible | Best times in Awakening screen + Neural Diary |
| P19 | Era 3 begins + Visual Foresight T4 (Era 3 preview 1-cycle-ahead) | Canvas cosmic, next-event preview |
| P20 | Endgame countdown | Countdown below consciousness bar |
| P26 | Transcendence unlocked | Ending screen appears |

**Region unlock cadence (Sprint 6.8):** Regions are no longer all-at-P1. Hipocampo first (P1), then Prefrontal + Límbico (P5), then Visual tier upgrades (T2 P5 / T3 P12 / T4 P19), then Broca (P14). This respects **progressive disclosure** (see §37 Onboarding) — players meet one new region every ~hour of play, not all at once.

---

# 10. Pattern Tree (50 nodes + 5 decisions)

Each prestige earns `patternsPerPrestige = 3` patterns, allocated to the tree. Patterns are purely cosmetic structure for the player's "mind map" but have mechanical effects:

**Pattern bonuses:**
- Each pattern grants `patternFlatBonusPerNode = 2 thoughts/sec` permanent (cosmetic scale — negligible at late game, meaningful at Run 1 P0)
- Additionally, `patternCycleBonusPerNode = 4%` per pattern acquired THIS CYCLE (resets on prestige, hard-capped at 1.5× via `patternCycleCap`)

**Cap:** Cycle bonus caps at ×1.5 (achieved around 37 patterns in cycle — typical cycle earns 3, so cap is never hit mid-cycle; it's a safety).

**Decision nodes (5 total, at 6/15/24/36/48 patterns):**

| Node | Option A | Option B |
|---|---|---|
| 6 | +8% cycle bonus | +1 max Discharge charge |
| 15 | +15% offline efficiency | Focus fills +20% faster |
| 24 | Insight duration +3s | +2 Memories per prestige |
| 36 | Cascade threshold 75%→65% (smaller buff) | +10% Discharge damage (always active). Tier-2 at P13+: ALSO generates Resonance on Discharge *(INT-5 fix)* |
| 48 | Regions give ×1.3 | Mutations offer +1 option (4 total) |

**PAT-3 rule:** `patternDecisions` NEVER resets on prestige or transcendence. A "Reset All Pattern Decisions" button exists in Pattern Tree UI, costs **1000 Resonance** (end-game gated). Requires double confirmation. Logged as `pattern_decisions_reset` analytics event.

---

# 11. Polarity (P3+)

Each cycle (post-prestige), the player picks a Polarity. Permanent for this cycle only.

| Polarity | Effect |
|---|---|
| Excitatoria (Excitatory) | Production +10%, Discharge bonus −15% |
| Inhibitoria (Inhibitory) | Production −6%, Discharge bonus +30%, Cascade chance +10% |

**POLAR-1:** Polarity defaults to last choice if player skips selection. Null until P3.

---

# 12. Archetypes — 3 types (P7+)

**Sprint 6.8 re-architecture:** Archetype choice migrated from P5 → P7. Rationale: at P5 the player has ~45 min of play and hasn't seen Mutations yet — too early for a Run-defining irreversible choice. At P7 the player has seen Polarity (P3) and is simultaneously choosing their first Mutation — they now understand the SHAPE of cycle choices and can pick an Archetype that matches their emerging preference. Implementation: Sprint 7.6 migrates the unlock gate; existing P5 state remains valid (legacy saves auto-play the Archetype Choice modal at the P7 cycle start).

Permanent for the ENTIRE Run (cannot change until Transcendence). Unlocks 15 archetype-exclusive narrative fragments. Fragment count math: 12 universal fragments + 15 per archetype + 5 region-unlock + 3 cross-Run memory + 5 mood-tier beats + 5 Oneiric dreams + 1 integrated-mind = **79 total** when a Run sees all three archetypes' content.

**Note on values:** the bonuses below are **design starting points validated by simulation**. Balance shifts during Sprint 8c TEST-5 1000-run simulation (now critical after Sprint 6.8 added Mood + Shards + Pre-commits + Mastery). Update this doc FIRST, code second.

**Empática offline path update (Sprint 6.8, per §16.8 + §19):** With `regulacion_emocional` retired, Empática's offline ceiling is preserved via two paths: (a) new `ondas_theta` upgrade replaces Reg. Emocional in the offline stack (§24), and (b) Mood now applies to offline calc — Euphoric mood ×1.30 extends Empática's offline production further than v1.0 original design. Sprint 8c TEST-5 validates the final ratio stays ≤ 2.0 OFFLINE-4 cap.

### Analítica (Analytical) — the speed-focused mind

**Theme:** Active play, burst optimization, speed runs.

| Effect | Value |
|---|---|
| Active production | ×1.15 |
| Focus Bar fill rate | ×1.25 |
| Insight duration | +2s each level |
| Offline efficiency | baseline (0.50, no bonus) |
| Memory generation | baseline |
| Narrative | Analytical fragments unlocked (15 new) |

Strong when: short cycles, speedruns, active play sessions.  
Weak when: player is offline a lot.

### Empática (Empathic) — the idle-focused mind

**Theme:** Passive play, offline optimization, gentle rhythm.

| Effect | Value |
|---|---|
| Offline efficiency | ×2.5 (stacks into OFFLINE-4 cap of 2.0 final ratio) |
| Lucid Dream trigger rate | 100% (vs 33% default) P10+ |
| Active production | ×0.85 (tradeoff) |
| Memory generation | ×1.25 |
| Narrative | Empathic fragments unlocked (15 new) |

Strong when: player plays ~10 min active per day + long offline periods.  
Weak when: active grinding.

### Creativa (Creative) — the variety-focused mind

**Theme:** Mutation exploration, emergent combinations, spontaneity.

| Effect | Value |
|---|---|
| Mutation pool offers | 4 options (vs 3 default) |
| Resonance gain rate | ×1.5 |
| Spontaneous event rate | ×1.5 (more "golden cookies") |
| Active/offline production | baseline |
| Narrative | Creative fragments unlocked (15 new) |

Strong when: player enjoys experimentation, high-variance cycles.  
Weak when: player wants consistent builds.

**Archetype selection UI (P5):**
- Shown as 3 cards with thematic art + short description + "what you gain"
- Irreversible for the Run — confirmation modal
- After Transcendence, the player can pick a different one

---

# 13. Mutations — 15 pool (P7+)

Each cycle (from P7+), 3 cards drawn from pool of 15 (4 if Creativa). Player picks 1. Active for this cycle only.

**Pool:**

| # | Name | Effect | Category | affectsOffline |
|---|---|---|---|---|
| 1 | Eficiencia Neural | Neurons cost −40% but produce −25% | Producción | false |
| 2 | Hiperestimulación | Production ×2, Focus fills 50% slower | Producción | false |
| 3 | Descarga Rápida | Discharge charges every 12 min, Discharge gives −40% bonus | Disparo | false |
| 4 | Disparo Concentrado | Discharge ×3, max 1 charge | Disparo | false |
| 5 | Neuroplasticidad *(reworked, see BUG-09)* | Upgrades cost −50%, effects reduced 40% after 50% consciousness | Upgrade | false |
| 6 | Especialización | Only 1 neuron type (player choice) produces this cycle. Produces ×4. Connections still count. | Restricción | false |
| 7 | Focus Acelerado | Focus fills ×3, Insight lasts 5s (not full duration) | Focus | false |
| 8 | Meditación | Focus fills passively (idle only, NOT offline) at 25% rate | Focus | false |
| 9 | Región Dominante | Most expensive region ×3, others ×0.5 | Regions | false |
| 10 | Memoria Frágil | Memories earned ×2, lose 1 Memory if cycle >20 min | Memories | false |
| 11 | Sprint | Production ×5 first 5 min, then ×0.5 | Temporal | true |
| 12 | Crescendo | Production ×0.2 → ×3 linearly with consciousness % | Temporal | true |
| 13 | Sinestesia | Taps generate Memories (1 per 500 taps), tap thoughts −60% | Especial | false |
| 14 | Déjà Vu | Start with last cycle's upgrades owned, costs ×2 | Especial | false |
| 15 | Mente Dividida | 2 independent Focus Bars, each Insight half-powerful | Especial | false |

**MUT-1:** Each Mutation has `affectsOffline: boolean`. If true, offline uses AVERAGE production (Crescendo) not peak.

**MUT-2 (Sprint 6.8 refactor):** Mutation seed computed at **prestige-END** (was prestige-START), enabling Visual Foresight T2 preview: the NEXT cycle's mutation pool is known the moment the CURRENT cycle prestiges. Formula: `hash(currentCycleEndTimestamp + prestigeCount + 1)`. Filter `lastMutationId` from options (no repeat). This refactor is BACKWARDS COMPATIBLE — determinism preserved; only the compute moment shifts one step earlier in the game loop.

**MUT-3 (INT-6 fix):** First cycle of any Run (`prestigeCount === 0`): filter out Déjà Vu, Neuroplasticidad, and any Mutation that references "previous cycle" state. Prevents Transcendence-break edge case.

**MUT-4 (INT-10 fix):** When a Weekly Challenge targets neuron type X, filter out `Especialización` with non-X restriction. Prevents challenge-trap.

---

# 14. Neural Pathways — 3 routes (P10+)

Each cycle, player chooses 1 Pathway. Gates which upgrade CATEGORIES are buyable. Not reversible within the cycle.

The 35 upgrades are tagged by category: `tap`, `foc`, `syn`, `neu`, `reg`, `con`, `met`, `new`. Each Pathway enables/blocks categories.

### Rápida (Swift) — speed specialist

- **Enables categories:** `tap`, `foc`, `syn`, `met`
- **Blocks categories:** `reg`, `con`, `new`
- **Bonuses:**
  - Insight duration ×2
  - Discharge charge rate ×1.5
- **pathwayCostMod:** 1.0 (no cost change)
- **Theme:** Short cycles, speedruns, Analítica pairs well.

### Profunda (Deep) — idle specialist

- **Enables categories:** `neu`, `reg`, `con`, `new`
- **Blocks categories:** `tap`, `foc`, `syn`
- **Bonuses:**
  - Memories per prestige ×2 (this cycle only)
  - Focus Bar fill rate ×0.5 (pathway malus — rare to need focus anyway)
- **pathwayCostMod:** 1.0
- **Theme:** Long cycles, Empática pairs well, narrative-focused play.

### Equilibrada (Balanced) — safe default

- **Enables categories:** ALL
- **Blocks categories:** NONE
- **Bonuses:**
  - All upgrade bonuses: ×0.85 (slightly weaker per upgrade — the tradeoff for flexibility)
- **pathwayCostMod:** 1.0 (no cost penalty)
- **Theme:** Learners, flexible play, Creativa pairs well (combine with varied Mutations).

**PATH-1:** Pathway not reversible within cycle. Blocked upgrade icons are visible but greyed out with tooltip "Blocked by current Pathway".

**PATH-2:** On prestige, `currentPathway = null` until player chooses. Default = last choice.

---

Continues in Part 2 (sections 15-36)...

---

# 15. Resonance system (P13+)

Resonance is a currency earned by OPTIMAL play. It persists across Transcendence. Spent on permanent upgrades.

**Earning formula (validated starting point):**

```ts
function resonanceGainOnPrestige(cycleMetrics: CycleMetrics): number {
  let r = 1;  // Base: 1 per prestige
  r += Math.min(cycleMetrics.cascadesTriggered, 3);  // up to +3 per cycle
  r += Math.min(cycleMetrics.insightsLevel2Plus, 2);  // up to +2 per cycle
  if (cycleMetrics.durationMinutes < 15) r += 3;  // under-15 bonus
  if (state.archetype === 'creativa') r = Math.round(r * 1.5);
  return r;
}
```

Typical cycle: 5-10 Resonance. Perfect cycle: ~18. Max/run: ~260.

**Resonance upgrade pool (13 permanent upgrades, 3 tiers) — Sprint 6.8 pulled 5 from v1.5 POSTLAUNCH:**

### Tier 1 (unlocked P13)

| ID | Name | Cost (R) | Effect |
|---|---|---|---|
| `eco_neural` | Eco Neural | 50 | All production +5% per Resonance upgrade owned |
| `patron_estable` | Patrón Estable | 50 | Pattern cycle cap 1.5 → 1.8 |
| `cascada_eterna` | Cascada Eterna | 80 | `cascadeMult` base 2.5 → 3.0 (Cascada Profunda then doubles: 3.0→6.0) |
| `deep_listening` *(v1.5 pulled)* | Deep Listening | 120 | Inner Voice engine: Oneiric dream frequency doubled; cross-Run memory fragments grant +1 extra Memoria |
| `cosmic_voice` *(v1.5 pulled)* | Cosmic Voice | 100 | Fragments glow permanently in Diary; rereading any fragment grants +1 Memoria (vs 0 normally — NARR-8 amendment) |

### Tier 2 (unlocked P18, requires ≥1 Tier 1)

| ID | Name | Cost (R) | Effect |
|---|---|---|---|
| `mente_despierta` | Mente Despierta | 150 | `focusFillRate` ×1.25 permanent |
| `memoria_longeva` | Memoria Longeva | 150 | Memory cap 3 unspent carryover between cycles |
| `eureka_frecuente` | Eureka Frecuente | 200 | Spontaneous event frequency ×1.3 |
| `time_dilation` *(v1.5 pulled)* | Time Dilation | 250 | Offline cap +4h permanent (stacks with Consciencia Distribuida + Sueño Profundo → 20h lifetime max) |
| `meta_consciousness` *(v1.5 pulled)* | Meta Consciousness | 300 | Patterns earned ×1.5 per prestige (stacks with Node 48 region mult) |

### Tier 3 (unlocked P23, requires ≥2 Tier 2)

| ID | Name | Cost (R) | Effect |
|---|---|---|---|
| `resonancia_profunda` | Resonancia Profunda | 400 | Resonance earn rate ×1.5 |
| `consciencia_eterna` | Consciencia Eterna | 500 | Unlocks Modo Ascensión early post-Transcendence (otherwise requires completing 4 endings) |
| `eternal_witness` *(v1.5 pulled, scope reduced)* | Eternal Witness | 600 | Unlocks "Dual Archetype" — select a SECONDARY archetype in CycleSetupScreen at 50% bonus strength (Run-specific, no permanent stack) |

**Note on v1.5 pulls:** These 5 Resonance upgrades were originally planned for v1.5 POSTLAUNCH ("Resonance tree expansion (+5 upgrades)"). Sprint 6.8 pulls them into v1.0 to give the endgame Resonance sink a meaningful depth — 8 upgrades felt thin for a 3-Run completion arc. v1.5 still adds the Observer archetype + Cerebelo region but no longer expands Resonance separately (it's now baked into v1.0 ceiling).

**RESON-1:** Resonance upgrades survive Transcendence (persistent). `resonanceUpgrades: string[]`.

**RESON-2:** PAT-3's "Reset All Pattern Decisions" costs **1000 Resonance** — designed to require post-Transcendence accumulation (one full Run ~260 R, two Runs ~520 R, unlocks mid-Run-3).

**RESON-3:** Resonance earning is atomic at prestige completion. Display: "+X Resonance" on Awakening screen.

---

# 16. Regions — 5 thematic sub-systems

**Sprint 6.8 re-architecture (2026-04-22):** Regions are no longer upgrade-skin panels with flat Memoria-priced buffs. Each region is a **distinct mechanical sub-system** that maps to the brain area's real neurobiological function. The 5 regions together constitute the second-strongest system in SYNAPSE (after Archetypes), and the Memorias currency becomes a hub-of-meta-progression rather than a dead-end sink.

## 16.0 Overview

| Region | Neurobiology | Gameplay verb | Sub-system | Unlocks |
|---|---|---|---|---|
| **Hipocampo** | Memory consolidation | **Accumulation** | Memory Shards (3 types: Emotional / Procedural / Episodic) + 8-upgrade shard tree | P0 |
| **Corteza Prefrontal** | Executive function, planning | **Commitment** | Pre-commitments (cycle-start wagers, 8 goal templates, streak bonuses) | P5 |
| **Sistema Límbico** | Emotion, motivation | **Dynamic state** | Moodometer (0-100 with 5 tiers) + event-driven shifts + 6 mood upgrades | P5 |
| **Corteza Visual** | Pattern recognition, foresight | **Foresight** | 4-tier preview powers (What-if extended / Mutation pool preview / Spontaneous countdown / Era 3 preview) | P0 (T1) / P5 (T2) / P12 (T3) / P19 (T4) |
| **Área de Broca** | Language, self-narration | **Identity** | Named Moments (5 slots) + Inner Voice engine + cross-Run memory fragments + mood-gated greetings | P14 |
| **Amplitud de Banda** | — | **Synergy** | Integrated Mind: compound bonuses when multiple regions active (3/4/5 thresholds) | P5 (meta) |

**REG-1:** Regions unlock progressively, NOT all at P1. Hipocampo auto-activates at first prestige (P1), the rest unlock at their listed prestige. Locked regions render greyed on the brain canvas.

**REG-2:** Regions tab is replaced from a list of upgrade-rows into a **brain-diagram canvas** (5 positioned region nodes). Tap a region → its mini-panel slides up with that sub-system's specific UI.

**REG-3:** The Hipocampo +3 Memorias one-time bonus (prior v1.0 design) is preserved and fires on first Hipocampo unlock.

**REG-4:** Retired upgrades (moved into sub-system mechanics): `consolidacion_memoria`, `regulacion_emocional`, `procesamiento_visual`. New upgrade `ondas_theta` replaces the offline path of `regulacion_emocional` (see §19). `funciones_ejecutivas` and `amplitud_banda` are preserved but reinterpreted as Prefrontal panel features.

---

## 16.1 Hipocampo — Memory Shards

**Theme:** Continuous experience compressed into discrete memory. Passive drip reward tied to play depth.

**Mechanic:**
- 3 shard types, each driplets tied to specific play behaviors:
  - **Emotional Shards** — drip from Cascades, Spontaneous events, fragment reads (+0.5/min of active play in cycles where these fire)
  - **Procedural Shards** — drip from taps and purchases (+0.5/min of active play where actions occur)
  - **Episodic Shards** — drip from prestiges and Resonant Pattern discoveries (+N at each prestige, +5 per RP)
- Shards persist across prestige AND Transcendence (lifetime counter by type)
- 8-upgrade Hipocampo tree (3 Emotional + 3 Procedural + 2 Episodic) priced in typed shards
- Integrated Mind unlock: "Memory Weave" converts 100 shards (any mix) → 1 Memoria

**Hipocampo shard upgrade tree (8 upgrades):**

| ID | Branch | Cost | Effect | Unlock |
|---|---|---|---|---|
| `shard_emo_pulse` | Emotional | 20 Emo | Cascade Sparks bonus +1 each | P1 |
| `shard_emo_resonance` | Emotional | 50 Emo | Fragment first-read grants +2 Memory (base +1) | P3 |
| `shard_emo_deep` | Emotional | 120 Emo | Mood events ±50% stronger (bigger swings either way) | P7 |
| `shard_proc_flow` | Procedural | 20 Proc | Tap contribution +5% | P1 |
| `shard_proc_pattern` | Procedural | 50 Proc | Discharge charge interval −10% | P3 |
| `shard_proc_mastery` | Procedural | 120 Proc | Mastery XP gain ×1.25 (see §38) | P7 |
| `shard_epi_imprint` | Episodic | 10 Epi | +1 Memoria per prestige | P1 |
| `shard_epi_reflection` | Episodic | 30 Epi | Each Resonant Pattern also grants +10 Sparks (base +5) | P5 |

**REG-5 (Hipocampo):** Shard types track independently. UI shows 3 counters with color coding (Emotional pink, Procedural blue, Episodic cyan).

**REG-6:** Shard drip pauses while the cycle is completed (at threshold). Offline contributes Procedural shards at 50% rate.

---

## 16.2 Corteza Prefrontal — Pre-commitments

**Theme:** Strategic commitment and risk. Player bets on a cycle outcome at setup.

**Mechanic:**
- At cycle start (integrated into CycleSetupScreen), optionally spend 1-3 Memorias to **commit to a cycle goal**.
- Success at cycle end = 2× Memory reward + Sparks bonus proportional to wager.
- Failure = −15% Memory reward this cycle (softened from original −25% proposal per Sprint 6.8 balance pass).
- Skip = neutral baseline.
- Streak counter: 5 consecutive successes → +1 permanent Memoria/cycle (stacking buff, lifetime).

**Pre-commitment goal templates (8):**

| ID | Goal | Wager | Success bonus |
|---|---|---|---|
| `pc_under_12min` | Complete cycle in < 12 min | 1 Mem | 2× + 2 Sparks |
| `pc_under_8min` | Complete cycle in < 8 min | 2 Mem | 2× + 5 Sparks |
| `pc_no_discharge` | Complete cycle without Discharge | 2 Mem | 2× + 5 Sparks |
| `pc_five_cascades` | Trigger 5 Cascades this cycle | 2 Mem | 2× + 5 Sparks |
| `pc_20_neurons` | Buy 20 neurons before P3 | 1 Mem | 2× + 2 Sparks |
| `pc_no_tap_idle` | Complete cycle without tapping | 3 Mem | 2× + 8 Sparks |
| `pc_max_focus_3x` | Fill Focus to 100% three times | 1 Mem | 2× + 2 Sparks |
| `pc_spontaneous_hunter` | Witness 3 Spontaneous events | 2 Mem | 2× + 5 Sparks |

**PRECOMMIT-1:** Pre-commits available from P5+ (when Prefrontal region mini-panel becomes active).

**PRECOMMIT-2:** A single Pre-commit is active per cycle. Player can cancel before first tap (refunds wager) but not after cycle has meaningful progress.

**PRECOMMIT-3:** Streak resets on failure. Genius Pass waives the failure penalty (treats failure as 0% reward, but streak still resets).

**PRECOMMIT-4:** Pre-commit state stored in `activePrecommitment: { goalId, wager } | null`. Streak count in `precommitmentStreak: number`. History derived from `diaryEntries` (type `'precommit'`).

**Prefrontal panel extras (non-wager features):**
- "Plan Ahead" — queue next cycle's Polarity/Mutation/Pathway selection during current cycle (smooths Awakening flow).
- `funciones_ejecutivas` upgrade (preserved, Memoria-priced) — thought-cost upgrades −20%. Still present in §24 as the last surviving region-upgrade.

---

## 16.3 Sistema Límbico — Moodometer

**Theme:** Emotional weather that colors your mind's productivity. Persistent state shifted by play events.

**Mechanic:**
- Moodometer: 0-100, starts at 50 (Calm). Visible in HUD as a tier icon; full 0-100 bar in Límbico panel.
- 5 tiers with distinct production / focus / discharge effects.
- Mood persists across prestige. **Resets to 50 on Transcendence** (fresh Run = fresh emotional slate).

**Mood tiers:**

| Range | Tier | Production | Focus fill | Max Discharges | Insight potential | Narrative |
|---|---|---|---|---|---|---|
| 0-19 | **Numb** | ×0.90 | ×1.00 | +0 | +0 | "Your mind feels distant." |
| 20-39 | **Calm** | ×1.00 | ×1.00 | +0 | +0 | "Your mind rests at baseline." |
| 40-59 | **Engaged** | ×1.05 | ×1.10 | +0 | +0 | "Your mind is warming." |
| 60-79 | **Elevated** | ×1.15 | ×1.10 | +1 | +0 | "Your mind is lit." |
| 80-100 | **Euphoric** | ×1.30 | ×1.10 | +1 | +1 | "Your mind is singing." |

**Mood event deltas (MOOD-2):**

| Event | Δ Mood |
|---|---|
| Cascade triggered | +5 |
| Prestige complete | +10 |
| Fragment first-read | +3 |
| Resonant Pattern discovered | +15 |
| Weekly Challenge complete | +20 |
| Pre-commit failure | −15 |
| Dormancy Mental State entry | −5 |
| Long idle (no session for 6h+) | decays 2/hour until Calm |
| Anti-spam penalty fires | −10 |

**Mood tier effect application (MOOD-1):**
- Production mult applies POST-softCap in `effectiveProductionPerSecond` (same layer as Mental States + Insight).
- Mental State and Mood stack multiplicatively (Euphoric 1.30 × Flow 1.20 = 1.56×).
- Offline calculation uses the AVERAGE Mood during the away period (not current), preventing ramp-farming.

**Límbico panel features:**
- Moodometer full 0-100 bar with tier boundaries visually marked
- 24h mood history chart (circular buffer `moodHistory` max 48 samples at 30min spacing)
- Event log (last 10 mood-affecting events)
- 6 Límbico upgrades purchased in Memorias:

| ID | Cost | Effect | Unlock |
|---|---|---|---|
| `lim_steady_heart` | 3 Mem | Mood decay during offline halved (1/hour instead of 2) | P5 |
| `lim_empathic_spark` | 5 Mem | Cascade Mood bonus +5 (→ +10 total) | P5 |
| `lim_resilience` | 8 Mem | Mood never drops below 25 (anti-despair floor) | P8 |
| `lim_elevation` | 12 Mem | Engaged→Elevated boundary shifts from 60→55 (easier tier climb) | P10 |
| `lim_euphoric_echo` | 20 Mem | Euphoric tier Production mult boosted 1.30 → 1.40 | P13 |
| `lim_emotional_wisdom` | 30 Mem | Each mood tier crossed this Run grants +1 lifetime Memoria | P15 |

**MOOD-1:** Tier boundaries and multipliers are constants (not hardcoded). Tuneable via Sprint 8c TEST-5.

**MOOD-2:** Event deltas live in `SYNAPSE_CONSTANTS.moodDelta*` constants, cited by `src/engine/mood.ts`.

**MOOD-3:** Offline decay per §19 — Mood drifts toward Calm (50) at 2/hour. Empática archetype gets 1/hour decay (half rate). Genius Pass subscribers' Mood never drops below 40 (Calm floor).

---

## 16.4 Corteza Visual — Foresight Tiers

**Theme:** Perception of hidden structure. Each tier reveals more of the game's internal state to the player.

**Mechanic:**
- 4 tiers unlock sequentially at specific prestige gates.
- Tier 1 active at P0; subsequent tiers unlock at listed prestige OR earlier if specific Memoria upgrade is bought.
- Foresight is powerful — preserves surprise by adding WARNINGS, not eliminating events.

**Foresight tiers:**

| Tier | Unlock | Power |
|---|---|---|
| **T1** | P0 (always on) | What-if Preview extended from "next cycle" to "3 cycles ahead" — forecasting horizon triples |
| **T2** | P5 or `vis_pattern_sight` upgrade (2 Mem) | Mutation pool preview: see the 3 candidate Mutations BEFORE prestiging (enables pre-plan) |
| **T3** | P12 or `vis_deep_sight` upgrade (8 Mem) | Spontaneous events show 20s countdown badge before firing — player positions for them |
| **T4** | P19 or `vis_prophet_sight` upgrade (20 Mem) | Era 3 event preview 1 cycle ahead — player knows what's coming at next prestige |

**FORESIGHT-1:** T1 is always active. Visual panel's state is `visualInsightTier: 1..4` (DERIVED from regionsUnlocked + purchased Visual upgrades + prestigeCount — NOT a stored field, keeps 119 count).

**FORESIGHT-2:** T2 requires MUT-2 mutation seed refactor to compute at prestige-END (not prestige-START) — so seed is known before player prestiges. See §13 for updated MUT-2.

**FORESIGHT-3:** T3 countdown activated inside `stepSpontaneousEventTrigger` — 20 seconds before the roll fires, emit a "Spontaneous event approaching" badge to HUD.

**FORESIGHT-4:** T4 preview renders in Awakening screen showing next Era 3 event name + narrative snippet (mechanical summary hidden).

**Visual panel extras (non-tier features):**
- **Pattern Recognition** — highlights optimal next upgrade in Upgrades tab (replaces old `procesamiento_visual`). Toggle in Visual panel settings.
- **Compare Runs** — overlay current Run vs personal-best Run at same prestige. Unlocked at T4.

---

## 16.5 Área de Broca — Inner Voice Engine

**Theme:** Language and self-narration. The player's mind learns to speak, and those words persist.

**Mechanic:**
- 5 **Named Moment** slots activate at key narrative points. At each, the player picks from 3 thematic phrase templates OR enters free-text (up to 40 chars, profanity-filtered).
- Named phrases persist across prestige AND Transcendence (lifetime identity).
- Named phrases weave into Awakening Log entries, Diary prose, and the final Ending paragraph.

**5 Named Moments:**

| Moment | Trigger | When it surfaces |
|---|---|---|
| 1. First Awakening | First prestige completed | Awakening screen prose |
| 2. Archetype Voice | Archetype chosen (P7) | Archetype confirmation + Diary |
| 3. Resonance Found | First Resonant Pattern discovered | RP celebration + Awakening log |
| 4. Era 3 Entry | P19 — Era 3 begins | First Era 3 modal prose |
| 5. The Last Choice | P26 — ending selection | Final ending paragraph |

**VOICE-1:** Named phrases stored in `brocaNamedMoments: { momentId: string; phrase: string }[]` (preserved across Transcendence).

**VOICE-2:** If player skips a Named Moment, a default archetype-keyed phrase is used. Skip is always valid.

**Broca panel features (P14+ unlock, but Inner Voice moments start earlier):**
- Named Moments archive — 5 cards showing each moment's phrase + reread context
- "Name your mind" — free-text field (max 20 chars, existing pre-redesign feature)
- Voice History — shows past Runs' named phrases (cross-Run memory per NARRATIVE.md cross-Run fragments)
- +1 passive Memoria/cycle (`brocaPassiveMemoryPerCycle` constant — existing, preserved)

**Inner Voice engine (cross-cutting, unified in §39):**
- Named Moments (5 per Run) — Broca-driven
- Oneiric Dreams (5 in v1.0, 25 more v1.5+) — mood-gated returning greetings + offline narrative payloads
- Cross-Run Memory fragments — Broca speaks in prior Run's voice at each new Run's P5
- All drive off `brocaNamedMoments` + `narrativeFragmentsSeen` (with prefix `dream_*`, `voice_*`, `crossrun_*`)

---

## 16.6 Amplitud de Banda — Integrated Mind

**Theme:** When multiple regions cohere, the mind becomes more than the sum of its parts.

**Mechanic:** Synergy bonuses unlock based on the number of "actively-engaged" regions this Run. A region counts as "active" when the player has purchased at least 1 of its upgrades or crossed a tier threshold:
- **Hipocampo active:** ≥1 shard upgrade owned
- **Prefrontal active:** ≥1 successful Pre-commit this Run
- **Límbico active:** Mood has reached Engaged (40+) at least once this Run
- **Visual active:** ≥T2 unlocked this Run
- **Broca active:** ≥1 Named Moment authored this Run

**Integrated Mind tiers:**

| Active regions | Bonus |
|---|---|
| 3 | +1 permanent max Discharge charge |
| 4 | +10% Memoria gain globally (multiplies Memoria table rewards) |
| 5 | Secret cycle-end narrative beat: "Your mind is whole." + unique ending variant + +5 Sparks (once per Run) |

**INTEGRATED-1:** Integrated Mind status recomputes at each prestige. UI shows progress ("3 of 5 regions engaged") in the Regions tab canvas.

**INTEGRATED-2:** The "5 regions" narrative beat counts as a separate NARR fragment (`integrated_mind_whole`) — grants +1 Memoria on first-read per NARR-8.

---

## 16.7 Regions Tab UI (Sprint 7.5 spec)

Replaces the Sprint 5 list-of-cards RegionsPanel with a **brain-diagram canvas**:
- Stylized brain outline rendered on Canvas 2D (not DOM/SVG) per CODE-4
- 5 region nodes positioned anatomically (Hipocampo front-middle, Prefrontal top-front, Límbico center, Visual back, Broca front-side)
- Unlocked regions glow softly in their theme color; locked regions outlined but dark
- Tap a region → its sub-system mini-panel slides up with the specific UI surface

Panel-per-region UIs:
- **Hipocampo:** 3 shard counters + 8-upgrade tree
- **Prefrontal:** active Pre-commit (or "Accept Pre-commit" CTA) + streak counter + history + `funciones_ejecutivas` upgrade
- **Límbico:** Moodometer bar + 24h chart + event log + 6 Límbico upgrades
- **Visual:** 4 tier cards (locked/unlocked) + Pattern Recognition toggle + Compare Runs
- **Broca:** 5 Named Moment cards + "Name your mind" field + Voice History

**REG-7:** Amplitud de Banda rendered as a footer strip on the Regions tab showing current Integrated Mind tier.

---

## 16.8 Migration from Sprint 5 Regions

Sprint 5 shipped 5 region upgrades (`consolidacion_memoria`, `regulacion_emocional`, `procesamiento_visual`, `funciones_ejecutivas`, `amplitud_banda`). Sprint 6.8 re-architecture handles them as follows:

| Old upgrade | Sprint 6.8 disposition |
|---|---|
| `consolidacion_memoria` | **Retired** — effect absorbed into Hipocampo shard upgrades (`shard_emo_resonance` grants +2 Memory vs +1) |
| `regulacion_emocional` | **Retired** — offline effect moved to new `ondas_theta` upgrade (§24) + Mood-applies-to-offline (§19) |
| `procesamiento_visual` | **Retired** — effect folded into Visual panel Pattern Recognition toggle (T1) |
| `funciones_ejecutivas` | **Preserved** — rehomed into Prefrontal panel as Memoria-priced upgrade |
| `amplitud_banda` | **Preserved but reinterpreted** — this is now the Integrated Mind cross-region tracker, no longer a simple +50% multiplier |

Migration code: `migrateState()` checks for retired upgrade IDs in `state.upgrades` and silently drops them (preserves Memorias refund? NO — the effects of old upgrades were value-neutral to sunset per Transcendence). A one-time Sprint 7.5 migration modal notifies affected save-game players.

---

## 16.9 All REG / SUB-SYSTEM rules index

- **REG-1..7** — Region unlock and UI rules (above)
- **SHARD-1..3** — Shard drip + conversion + typed mechanics
- **PRECOMMIT-1..4** — Pre-commit activation, resolution, streak
- **MOOD-1..3** — Mood layer application, event deltas, offline decay
- **FORESIGHT-1..4** — Visual tier unlock and preview semantics
- **VOICE-1..2** — Broca Named Moments persistence
- **INTEGRATED-1..2** — Amplitud de Banda synergy tracking

See §35 for full rule IDs index.

---

# 17. Mental States — 5 states

Emerge from player behavior patterns. Only 1 state active at a time. Higher priority replaces lower.

**Priority (high to low):** Eureka > Flow > Hyperfocus > Deep > Dormancy.

Active state modifies production and shows a chip in the HUD.

**Full MENTAL-4 spec:**

| State | Trigger | Effect | Duration | Exit early if |
|---|---|---|---|---|
| **Flow** | 10+ taps in last 15s | Tap production ×1.2 | 20s | No tap for 5s |
| **Deep** (Deep Thought) | No taps for 60s AND ≥5 neurons owned | Passive production ×1.3 | 90s | Any tap |
| **Eureka** (Eureka Rush, renamed to *Flujo Eureka* in UI to disambiguate from event) | 3 Insights activated within 2 minutes | All production ×1.5 | 30s | Prestige |
| **Dormancy** | No taps AND no purchases for 120s | Passive production ×1.15, no tap penalty on return | 5 min | Any tap or purchase |
| **Hyperfocus** | Focus Bar > 50% continuously for 30s | Next Insight activated is +1 level (if already level 3, duration +50%) | Until Insight consumed | Focus drops < 50% before Insight |

**MENTAL-1:** 5 Mental States. Only 1 active. Priority hierarchy as above.

**MENTAL-2:** `currentMentalState`, `mentalStateExpiry` track active state. Tracking arrays (`lastTapTimestamps`, `insightTimestamps`, etc.) are circular buffers (size 20 for taps, 3 for insights).

**MENTAL-3:** `lastPurchaseTimestamp` tracks the timestamp of last neuron/upgrade buy. Dormancy trigger checks this.

**MENTAL-4:** Triggers/effects as in table above. Exit conditions as specified.

**MENTAL-5 (INT-9 fix — Hyperfocus + Discharge interaction):** When Hyperfocus is active and player uses Discharge (which sets Focus to 0, exiting Hyperfocus), the "+1 Insight level" bonus is NOT lost. Stored as `pendingHyperfocusBonus: boolean` and consumed by whatever Insight the player activates within the next 5 seconds.

**MENTAL-6 (INT-7 fix — Eureka naming):** Mental State "Eureka Rush" displays in UI as **"Flujo Eureka"** to differentiate from the Spontaneous Event "Eureka" (which is a free-upgrade pickup). When both active simultaneously, HUD shows BOTH indicators stacked (not just highest priority).

**MENTAL-7 (Sprint 6.8 — Mental States vs Mood clarification):** Mental States are SHORT-TERM state (seconds-to-minutes, tick-level triggers, reset on prestige implicitly via timestamp buffers). Mood (§16.3) is LONG-TERM state (hours-days, event-cumulative, persists across prestige, resets on Transcendence). They are **complementary, not competing** — both apply in `effectiveProductionPerSecond` and stack multiplicatively:

```ts
effectiveMult = insightMult × mentalStateMod × moodTierMod × spontaneousMod × mutationTemporalMod
```

Worst-case compound (Euphoric mood × Flow mental × Insight Trasc × Spontaneous Ráfaga × Crescendo late) = 1.30 × 1.20 × 18.0 × 2.0 × 3.0 = 168×. This is intentional — a perfect burst window is the speedrunner's payoff. SoftCap (`rawMult` layer) does NOT cap `effectiveMult`.

**MENTAL-8 (Sprint 6.8 — Dormancy + Mood tier interaction):** When Mood ≥ 60 (Elevated/Euphoric) and Dormancy triggers, the Dormancy passive prod bonus becomes +30% (vs base +15%). Narrative framing: "the mind rests better when happy." Minor balance effect.

---

# 18. Micro-challenges — 8 pool

Optional mid-cycle challenges. Unlock at P15 (Era 2 mid-game). Appear when `cycleGenerated / threshold` crosses 30%. Only 1 active at a time. Reward: Chispas.

| ID | Challenge | Time limit | Reward |
|---|---|---|---|
| `tap_surge` | Tap 50 times in 30s | 30s | +2 Chispas |
| `focus_hold` | Keep Focus Bar above 60% for 45s | 45s | +2 Chispas |
| `discharge_drought` | Don't use Discharge for 2 minutes | 120s | +3 Chispas |
| `neuron_collector` | Buy 10 neurons in next 60s | 60s | +2 Chispas |
| `perfect_cascade` | Trigger Cascade with Focus between 73% and 77% (tight tolerance) | 90s | +3 Chispas |
| `patient_mind` | Don't tap for 45s (idle only) | 45s | +2 Chispas |
| `upgrade_rush` | Buy 3 upgrades in 90s | 90s | +2 Chispas |
| `synergy_master` | Own all 5 neuron types within 2 min of cycle start | 120s from cycle start only | +3 Chispas |

**MICRO-1:** Challenges appear at 30% threshold cross. After failure/expiry, 2 min cooldown before next.

**MICRO-2:** Max 3 challenges per cycle. Tracked in `cycleMicroChallengesAttempted`.

**MICRO-3:** Fail state: timer runs out → banner fades, no reward, no penalty (challenges are optional upside only).

**MICRO-4:** Challenge selection: deterministic from `hash(cycleStartTimestamp + cycleMicroChallengesAttempted)`.

**MICRO-5 (Sprint 6.8 — Pre-commit interaction):** Micro-challenges and Pre-commits (§16.2) operate at different time scales: Micro = mid-cycle pop-ups (2 min windows), Pre-commit = full-cycle wagers. A completed Micro-challenge MAY incidentally satisfy a Pre-commit goal (e.g., completing `neuron_collector` helps toward Pre-commit `pc_20_neurons`). When this happens, the player gets BOTH rewards — no double-counting penalty. Analytics event `micro_challenge_completed` fires independently of `precommit_fulfilled`.

---

# 19. Offline system

**Base parameters:**
```
baseOfflineCapHours:     4           // initial cap, no upgrades
maxOfflineHours:         16          // max achievable (REM → 8, Consciencia Distribuida → 12, Sueño Profundo → 16)
baseOfflineEfficiency:   0.50        // 50% of base production
maxOfflineEfficiencyRatio: 2.0       // final ratio cap (OFFLINE-4)
```

**Formula:**
```ts
function applyOfflineProgress(state: GameState, now: number): GameState {
  const elapsedSeconds = Math.min(
    (now - state.lastActiveTimestamp) / 1000,
    state.currentOfflineCapHours * 3600
  );
  
  if (elapsedSeconds < 60) return state;  // less than 1 min = skip
  
  // Time anomaly detection (OFFLINE-5)
  if (now < state.lastActiveTimestamp) {
    return { ...state, lastActiveTimestamp: now };  // clock went backward
  }
  if (elapsedSeconds > state.currentOfflineCapHours * 3600 * 2) {
    // Way over cap — cap hard, log anomaly
    logEvent('time_anomaly');
  }
  
  let efficiency = state.currentOfflineEfficiency;  // starts at 0.50 base
  
  // Apply upgrade stack (multiplicative) — Sprint 6.8: regulacion_emocional retired,
  // replaced by ondas_theta; Mood tier now contributes via getEffectiveMoodMult().
  if (hasUpgrade(state, 'ritmo_circadiano')) efficiency *= 1.5;
  if (hasUpgrade(state, 'ondas_theta')) efficiency *= 2.0;  // NEW §24 replacing regulacion_emocional
  if (state.archetype === 'empatica') efficiency *= 2.5;  // null until P7 (Sprint 6.8 migration); check is safe
  if (state.isSubscribed) efficiency *= 1.25;  // Genius Pass +25%
  if (patternDecisions[15] === 'A') efficiency *= 1.15;  // Decision 2A
  efficiency *= getEffectiveMoodMult(state);  // NEW Sprint 6.8: 0.90-1.30 based on Mood tier, AVG during offline window
  
  // Final ratio cap (OFFLINE-4, fixes EXPLOIT-03)
  efficiency = Math.min(efficiency, state.currentOfflineEfficiency * (2.0 / 0.5));  
  // Simplified: efficiency can't exceed 2.0 as a final multiplier (2× active production)
  // The math: 0.5 base × 4 stacked = 2.0, so cap kicks in when stack > 4× base
  
  // Use average production for Mutations with affectsOffline=true
  const prodPerSec = getEffectiveOfflineProduction(state);
  // (uses avg of cycle for Crescendo/Sprint, peak for others)
  
  const gained = Math.floor(prodPerSec * elapsedSeconds * efficiency);
  
  return {
    ...state,
    thoughts: state.thoughts + gained,
    cycleGenerated: state.cycleGenerated + gained,
    totalGenerated: state.totalGenerated + gained,
    lastActiveTimestamp: now,
  };
}
```

**Offline progression table (reference values per archetype build):**

| Config | Cap | Final ratio | Reward in 8h (at 10k prod/sec base) |
|---|---|---|---|
| Base (P0) | 4h | 50% | 7.2M (in 4h only — cap) |
| + Sueño REM | 8h | 50% | 14.4M |
| + Ritmo Circadiano | 8h | 75% | 21.6M |
| + Ondas Theta *(Sprint 6.8 — replaces Reg. Emocional)* | 8h | 100% | 28.8M |
| + Consciencia Distribuida (P10+) | 12h | 100% | 43.2M |
| + Decision 2A | 12h | 115% | 49.7M |
| + Genius Pass | 12h | 143.75% | 62.1M |
| + Euphoric Mood (×1.30, Sprint 6.8) | 12h | 186.8% | 80.7M |
| Empática (full stack + Euphoric) | 12h | **200% (capped)** | 86.4M |
| + Sueño Profundo (Run 2+) | 16h | **200% (capped)** | 115.2M |
| + Time Dilation Resonance (pulled v1.5, §15) | 20h | **200% (capped)** | 144.0M |

**Sleep screen (return UI):**
- 4-second animation: brain "dreaming" — neurons pulse softly, accumulated thoughts fall as golden particles
- Counter rises visually
- After animation: summary card + options
- Optional rewarded ad: watch → ×2 offline reward (if `elapsedMinutes >= 30`)

**Lucid Dream (Sueño Lúcido, P10+, 33% chance):**
- After animation, binary choice:
  - **A:** +10% production for 1h
  - **B:** +2 Memories (or +3 with Regulación Emocional)
- Empática: ALWAYS triggers Lucid Dream (100% vs 33%)

**OFFLINE rules:**
- **OFFLINE-1:** Base efficiency 0.50. Base cap 4h. Upgrades modify both.
- **OFFLINE-2:** If offline fills `cycleGenerated` to 100%: cap at threshold. Banner. NEVER auto-prestige.
- **OFFLINE-3:** Focus Bar does NOT fill offline (unless Meditación Mutation, which only applies to idle-on-canvas, not closed-app — see INT-8 fix below).
- **OFFLINE-4:** Final efficiency ratio capped at 2.0 (final offline production ≤ 2× active).
- **OFFLINE-5:** Time anomaly: `now < lastActiveTimestamp` → ignore offline, reset timestamp. `elapsed > cap × 2` → cap hard, log event.
- **OFFLINE-6:** `baseOfflineCapHours = 4`. Sueño REM upgrade → 8h. Consciencia Distribuida (P10+) → 12h. Sueño Profundo (Run 2+) → 16h. `maxOfflineHours = 16` (achievable cap). Player never loses a night of sleep once Sueño REM is purchased (achievable in first cycle at 50K thoughts).
- **OFFLINE-7 (BUG-03 fix):** If offline fills the cycle to 100%, and `nextDischargeBonus > 0` (from "Resonancia Acumulada" upgrade), show on Sleep screen: "Your mind awakened. You have 1 enhanced Discharge before Awakening — use it?" Option to use or skip.
- **OFFLINE-8 (Sprint 6.8 — Mood during offline):** Mood decays toward Calm (50) at 2/hour while offline (1/hour for Empática archetype; never below 40 for Genius Pass subscribers). The `moodTierMod` used in the offline efficiency stack is the AVERAGE mood across the offline window (computed from `moodHistory` 30min samples), NOT the current mood — prevents ramp-farming by checking in for 1 minute to spike Mood before going offline.
- **OFFLINE-9 (Sprint 6.8 — Shard drip):** Offline contributes Procedural shards (§16.1) at 50% rate. Emotional and Episodic shards do NOT drip offline (they require active play triggers).
- **OFFLINE-10 (Sprint 6.8 — Returning-player greeting):** On return after ≥30 min offline, a Broca Inner Voice greeting (§16.5 + §39) prepends the Sleep screen with mood-gated prose — "Your mind welcomes you back, still alight" (Euphoric) / "Your mind was quiet. It missed you" (Calm) / "Your mind has been waiting" (Numb).

---

# 20. Transcendence & Runs

**Trigger:** Reaching P26 ending screen. Player chooses ending narrative (5 options). Transcendence runs:

```ts
function handleTranscendence(state: GameState, endingChosen: EndingID): GameState {
  // Record the ending
  const newEndingsSeen = [...state.endingsSeen, endingChosen];
  
  // Apply full reset
  const reset = {
    ...defaultGameState(),  // all defaults
    // Preserve these:
    memories: 0,  // CRITICAL: Memories DO reset on Transcendence
    archetype: null,  // CRITICAL: Choose new archetype in next Run
    regionsUnlocked: [],  // CRITICAL: Reset region progress
    eraVisualTheme: 'bioluminescent',
    narrativeFragmentsSeen: [],  // new archetype, new fragments
    
    prestigeCount: 0,  // CRITICAL: Or Run 2+ threshold becomes infinite
    transcendenceCount: state.transcendenceCount + 1,
    
    // Preserved across Transcendence:
    sparks: state.sparks,
    piggyBankSparks: state.piggyBankSparks,
    resonance: state.resonance,
    resonanceUpgrades: state.resonanceUpgrades,
    patterns: state.patterns,
    totalPatterns: state.totalPatterns,
    patternDecisions: state.patternDecisions,
    resonantPatternsDiscovered: state.resonantPatternsDiscovered,
    personalBests: state.personalBests,
    awakeningLog: state.awakeningLog,
    dailyStreakDays: state.dailyStreakDays,
    weeklyChallenge: state.weeklyChallenge,
    archetypeHistory: [...state.archetypeHistory, state.archetype!],
    endingsSeen: newEndingsSeen,
    achievementsUnlocked: state.achievementsUnlocked,
    lifetimePrestiges: state.lifetimePrestiges,
    lifetimeDischarges: state.lifetimeDischarges,
    lifetimeInsights: state.lifetimeInsights,
    runUpgradesPurchased: state.runUpgradesPurchased,  // survives Transcendence
    // ... more (see §34)
  };
  
  return reset;
}
```

**TRANS-1:** `prestigeCount = 0` on Transcendence. `transcendenceCount += 1`. Threshold uses `RUN_THRESHOLD_MULT[transcendenceCount]`. **CRITICAL — without this, Run 2+ is unplayable.**

**TRANS-2 (INT-3 fix):** Convergencia Sináptica upgrade uses `lifetimePrestiges` (which persists) not `prestigeCount` (which resets). Formula: +1.5% per lifetime prestige, max +40%. This way Run 2 players start with strong Convergencia already.

**TRANS-3:** Run 2 threshold multiplier ×3.5. Run 3: ×6.0. See `RUN_THRESHOLD_MULT` constant.

**TRANS-4:** Archetype choice is Run-specific. `archetypeHistory` records past archetypes used.

**TRANS-5 (Sprint 6.8 — new field PRESERVE/RESET rules for Region re-architecture):**

| Field (Sprint 6.8 new) | PRESTIGE | TRANSCENDENCE | Rationale |
|---|---|---|---|
| `memoryShards` (3-type object) | PRESERVE | **PRESERVE** | Lifetime neurobiological accumulation; never reset |
| `memoryShardUpgrades` | PRESERVE | **PRESERVE** | Purchases are permanent; lifetime investment |
| `activePrecommitment` | RESET (null) | RESET (null) | Cycle-scoped; cannot span cycles |
| `precommitmentStreak` | PRESERVE | RESET (0) | Tracks streaks within a Run; fresh on Transcendence |
| `mood` | PRESERVE | RESET (50) | Mood persists across prestige (plans across cycles); fresh Run = fresh emotional slate |
| `moodHistory` | PRESERVE | RESET (empty) | 24h chart only relevant within a Run |
| `brocaNamedMoments` | PRESERVE | **PRESERVE** | Identity persists across Runs — player's voice echoes |
| `mastery` (Record<id, uses>) | PRESERVE | **PRESERVE** | Lifetime use tracking; core of §38 Mastery system |
| `autoBuyConfig` | PRESERVE | PRESERVE | QoL preference; player's auto-buy toggles don't reset |

---

# 21. Run-exclusive upgrades — 4 for v1.0 (+2 post-launch)

Six upgrades unlock over 3 Transcendences (2 per Run starting Run 2). They survive Transcendence permanently. Appear in the "new upgrades" section of the Upgrades tab with "NEW" badge.

**Note on design:** These are meant to amplify the feeling of progression across Runs. Each Run should feel more powerful AND more interesting, not just a harder version.

### Unlocked after first Transcendence (available Run 2+)

| ID | Name | Cost | Effect | Unlock condition |
|---|---|---|---|---|
| `eco_ancestral` | Eco Ancestral | 100K thoughts | Prestige retroactively grants +1 Pattern to last 3 cycles' totals | Run 2+ |
| `sueno_profundo` | Sueño Profundo | 200K thoughts | Offline cap +4h (12h → 16h with Consciencia Distribuida) | Run 2+ |

### Unlocked after second Transcendence (available Run 3+)

| ID | Name | Cost | Effect | Unlock condition |
|---|---|---|---|---|
| `neurona_pionera` | Neurona Pionera | 150K thoughts | First neuron type purchased each cycle costs 50% less | Run 3+ |
| `despertar_acelerado` | Despertar Acelerado | 300K thoughts | Threshold ×0.8 for P1-P3 of each Run | Run 3+ |

### Unlocked after third Transcendence (available Run 4+, post-launch)

| ID | Name | Cost | Effect | Unlock condition |
|---|---|---|---|---|
| `memoria_ancestral` | Memoria Ancestral | 400K thoughts | +1 Memory per cycle starting P1 | Run 4+ (post-launch) |
| `consciencia_plena` | Consciencia Plena | 500K thoughts | All archetype bonuses +20% | Run 4+ (post-launch) |

**RUN-1:** `runUpgradesPurchased: string[]` tracks IDs. Survives Transcendence. Does NOT reset.

**RUN-2:** Run-exclusive upgrades do NOT count toward the 35-upgrade limit. They're displayed in a separate "Run Upgrades" section.

**Note for v1.0 Sprint 8b:** Implement upgrades 1-4 (Run 2 and Run 3 unlocks, 4 upgrades total). Upgrades 5 and 6 are **v1.5+ content** and belong in `POSTLAUNCH.md`. Original planning said "6 run-exclusive upgrades" — this was aspirational. Adjust Sprint 8b to "4 run-exclusive upgrades (Run 2 + Run 3)" for v1.0.

---

# 22. Resonant Patterns & Secret Ending

4 hidden conditions. Each discovered independently. Discovering all 4 unlocks the Secret Ending at next Transcendence.

**RESON_PATTERN-1: The Lost Connection**
- Condition: Buy all 5 neuron types within first 2 minutes of any cycle
- Echo hint (appears P3+): "Everything began together, in one instant of clarity. The fragments always knew they were one."
- Theme: Simultaneity, speed-buying

**RESON_PATTERN-2: The Silent Mind**
- Condition: Complete a full cycle (reach threshold) without using Discharge
- Echo hint (appears P3+): "Some minds grow in quietude, not in lightning."
- Theme: Passive play, restraint

**RESON_PATTERN-3: The Broken Mirror**
- Condition: Reach P10 with ≥3 Pattern Decisions set to Option B
- Echo hint (appears P10+): "Every decision carves a path. Follow the less-lit one."
- Theme: Narrative intentionality, non-conformism

**RESON_PATTERN-4: The Cascade Chorus**
- Condition: Trigger 5 Cascades in a single cycle WITHOUT owning the Cascada Profunda upgrade *(INT-12 refinement)*
- Echo hint (appears P10+): "The storm of thought has its own rhythm."
- Theme: Active optimization, deliberate challenge

**Check logic:**
```ts
// At prestige (before reset):
for (const [idx, pattern] of RESONANT_PATTERNS.entries()) {
  if (!state.resonantPatternsDiscovered[idx] && pattern.check(state)) {
    state.resonantPatternsDiscovered[idx] = true;
    state.sparks += 5;
    triggerDiscoveryAnimation(pattern);
    logEvent('resonant_pattern_discovered', { index: idx });
  }
}
```

**Secret Ending unlock:** When `resonantPatternsDiscovered.every(b => b) === true`, at the next Transcendence screen, a 5th ending option "Resonance" appears alongside the 4 main endings.

**RESON_PATTERN rules:**
- **RP-1:** All 4 patterns checked at prestige completion, BEFORE reset
- **RP-2:** Echoes (ambient canvas text) from pool filter by `prestigeCount` — hints appear more frequently at P10+
- **RP-3:** `resonantPatternsDiscovered` NEVER resets (not prestige, not transcendence)
- **RP-4:** `cycleDischargesUsed` (new field, resets on prestige) tracks for RP-2. `cycleCascades` (existing) tracks for RP-4. Per-cycle neuron purchase timestamps (new field `cycleNeuronPurchases: {type: NeuronType, timestamp: number}[]`) tracks for RP-1.

---

# 23. Era 3 unique events (P19-P26)

Each of the 8 final cycles has a unique narrative event that changes the cycle's rules. Purpose: prevent Era 3 from feeling like a grind (cycles are 25-35 min each).

| Prestige | Event name | Mechanical effect | Narrative beat |
|---|---|---|---|
| P19 | **The First Fracture** | Mutations offer 5 options (vs 3) this cycle only | "The mind questions itself for the first time." |
| P20 | **Threshold Doubt** (countdown begins) | Threshold shown as "7 awakenings to Transcendence" | "7 awakenings remain. The end becomes visible." |
| P21 | **The Mirror Cycle** | Polarity chosen is applied ×2 strength | "The mind sees itself clearly — for better or worse." |
| P22 | **Silent Resonance** | Resonance gain ×3, production −20% | "In quieting the noise, understanding grows." |
| P23 | **The Dreamer's Dream** | Offline ×3, active play doesn't fill Focus | "The mind sleeps even while awake." |
| P24 | **The Long Thought** | Auto-prestige at MIN(threshold reached, 45 min elapsed) | "Time itself becomes a cycle." |
| P25 | **The Final Awakening** | All neurons cost ×0.5, Discharge gives ×5 (vs 1.5 base) | "The final awakening approaches." |
| P26 | **The Last Choice** | Ending screen at prestige. No next cycle. | "Take your time. There is no rush." |

**ERA3-1:** Each event triggers automatically when the player reaches the corresponding prestigeCount.

**ERA3-2:** Events are announced via a fullscreen modal at cycle start, with narrative copy + mechanical explanation + "Continue" button.

**ERA3-3:** Events may interact with other systems (e.g., P23 Dreamer's Dream + Meditación Mutation: Focus STILL doesn't fill because Era 3 event overrides). Priority: Era 3 event > Mutation > upgrades.

---

# 24. Upgrades (39 v1.0, categorized) — Sprint 6.8 re-architected

**Sprint 6.8 re-architecture — TWO waves of change:**

**Wave 1 — Region redesign retirements + ondas_theta:** Count changed 35 → 33 initially. Three region-priced upgrades retired into the Region sub-systems (§16.8) — effects absorbed by Hipocampo shards (`consolidacion_memoria`), Límbico mood + offline stack (`regulacion_emocional` → new `ondas_theta`), and Visual Foresight T1 (`procesamiento_visual`). `funciones_ejecutivas` and `amplitud_banda` are preserved but rehomed in Regions panel UI.

**Wave 2 — Pacing + thematic additions (5 new upgrades + new category + 3 rebalances):**
- Fills P7-P9 "dead zone" where player had no new upgrades to unlock (3 new upgrades: `neurotrofinas` P7, `reflexion_metacognitiva` P7, `arquitecto_neural` P8)
- Fills thematic holes created by Sprint 6.8 — Memoria generation path + Mood synergy path for Thoughts-focused players (2 new upgrades: `acervo_memorias` P5, `red_emotiva` P6)
- Rewards genuine offline play (1 new: `guardian_del_tiempo` P12)
- 3 existing upgrades rebalanced (effect changes, same IDs): `sincronizacion_total`, `umbral_consciencia`, `potencial_latente` (see §24.6)
- New `mem` category for Memoria-generation-focused upgrades (8 → 9 categories)

**Final count: 33 + 6 new = 39 upgrades.**

Categories used by Pathway gating: `tap`, `foc`, `syn`, `neu`, `reg`, `con`, `met`, `mem` *(new Sprint 6.8)*, `new`. Pathway §14 category lists updated: Deep now enables `mem` by default (thematic fit); Swift blocks `mem` (speed pathway avoids meta buildup); Balanced enables all.

**UX ordering rule (UPGRADES-1):** The Upgrades tab shows Thoughts-priced upgrades FIRST, then Memoria-priced in a separate subsection. Within each subsection, sort by cost ascending. Previously (pre-Sprint-6.8) the Sprint 3.6.3 sort compared numeric values directly — a 2-Memoria upgrade sorted before a 3000-Thought upgrade because `2 < 3000`, which was visually jarring ("why are these memory things at the top?"). Fix: sort by `(currencyRank, cost)` where `currencyRank(thoughts)=0, currencyRank(memorias)=1`. This keeps sections coherent and puts the player's most-common decision (thought-priced next buy) at the top.

### Tap (⚡, 3)
| Upgrade | Cost | Effect | Tier |
|---|---|---|---|
| Potencial Sináptico | 5K | Tap thought bonus 5% → 10% of `effectiveProductionPerSecond` (replaces `baseTapThoughtPct`, see TAP-2 §6) | P0 |
| Mielina | 15K | Tap also fills +2% Focus | P0 |
| Dopamina | 80K | Tap bonus ×1.5 | P2+ |

### Focus (🎯, 1 — scarce, deeply synergistic)
| Upgrade | Cost | Effect | Tier |
|---|---|---|---|
| Concentración Profunda | 25K | Focus fill rate ×2. Insight duration +5s. | P4+ |

### Synapsis / Discharge (◎, 6 — Sprint 6.8 added arquitecto_neural)
| Upgrade | Cost | Effect | Tier |
|---|---|---|---|
| Descarga Neural | 8K | Max Discharge charges +1 | P0 |
| Amplificador de Disparo | 40K | Discharge bonus ×1.5 | P2+ |
| Red de Alta Velocidad | 100K | Charges accumulate 25% faster | P2+ |
| Cascada Profunda | 200K | `cascadeMult` ×2 (base 2.5→5.0, or 3.0→6.0 with cascada_eterna) | P4+ |
| Sincronización Total | 500K | After Cascada, Focus regains **+0.25** *(rebalanced from +0.18 Sprint 6.8)* + **Mood +2 on Cascade** *(new)* | P5+ |
| **Arquitecto Neural** *(NEW Sprint 6.8)* | 300K | Max Discharge charges +1 (stacks with Descarga Neural → **4 charges pre-P15**). Fills P8 dead zone. | **P8+** |

### Neurons (⬡, 9 — Sprint 6.8 added neurotrofinas)
| Upgrade | Cost | Effect | Tier |
|---|---|---|---|
| Red Neuronal Densa | 3K | All neurons rate ×1.25 | P0 |
| Receptores AMPA | 12K | Básicas ×2 | P1+ |
| Transducción Sensorial | 50K | Sensoriales ×3 | P1+ |
| Axones de Proyección | 180K | Piramidales ×3 | P2+ |
| Sincronía Neural | 600K | Connection multipliers ×2 | P2+ |
| LTP Potenciación Larga | 2M | All neurons ×1.5 | P3+ |
| Espejo Resonantes | 150K | Espejos ×4 | P2+ |
| Neurogénesis | 5M | All neuron rates ×1.10 + visual hint (greyed 6th slot appears — v1.5 foreshadowing) | P5+ |
| **Neurotrofinas** *(NEW Sprint 6.8)* | 400K | All neuron rates +10% per unique neuron type owned (max +50% with all 5) — rewards diversity, fills P7 dead zone | **P7+** |

### Regions (◈, 2 — Memoria-priced, Sprint 6.8 reduced from 5)

Sprint 6.8 retired 3 upgrades (`consolidacion_memoria` → Hipocampo shards; `regulacion_emocional` → `ondas_theta` below; `procesamiento_visual` → Visual T1). Remaining:

| Upgrade | Region | Cost | Effect | Unlock |
|---|---|---|---|---|
| Funciones Ejecutivas | Prefrontal | 3 Mem | Thought-cost upgrades −20% (COST-1) | P2+ |
| Amplitud de Banda | Meta (cross-region) | 15 Mem | Reinterpreted as Integrated Mind tracker (§16.6) — when 5 regions active, secret narrative beat fires | P2+ |

Plus Sprint 6.8 NEW `ondas_theta` (`con` category below, Thoughts-priced).

### Consciousness & Offline (✦, 5) — one more than v1.0 original

### Consciousness & Offline (✦, 6 — Sprint 6.8 added ondas_theta + guardian_del_tiempo)
| Upgrade | Cost | Effect | Tier |
|---|---|---|---|
| Sueño REM | 50K | Offline cap 4h → 8h | P0 |
| Umbral de Consciencia | 100K | Consciousness bar fills ×1.3 **(always on** *— rebalanced Sprint 6.8, removed "at ≥50% bar" conditional for clarity)* | P0 |
| Ritmo Circadiano | 200K | Offline ×1.5 efficiency + auto-charge on return if ≥cap | P2+ |
| Hiperconciencia | 500K | Consciousness bar fills ×2 | P4+ |
| **Ondas Theta** *(NEW Sprint 6.8)* | 300K | Offline efficiency ×2 (replaces retired `regulacion_emocional`; stacks into OFFLINE-4 cap) | P3+ |
| **Guardian del Tiempo** *(NEW Sprint 6.8)* | 1M | Offline efficiency +10% per hour offline (max +50% at 5+ hours). Rewards genuine offline stretches, not 30-min check-ins. | **P12+** |

### Meta (∞, 4 — Sprint 6.8 added reflexion_metacognitiva)
| Upgrade | Cost | Effect | Tier |
|---|---|---|---|
| Retroalimentación Positiva | 1M | ×2 all production | P6+ |
| Emergencia Cognitiva | 3M | Production ×1.5 per 5 upgrades owned, max ×5 | P6+ |
| Singularidad | 10M | ×1.01 per prestigeCount (multiplicative) | P8+ |
| **Reflexión Meta-Cognitiva** *(NEW Sprint 6.8)* | 2M | Mutation effects ×1.15 (first upgrade in game that buffs Mutations — thematic: "mind reflecting on its own mutations") | **P7+** |

### Memory (🧠, 2 — NEW category Sprint 6.8 `mem`)

New category created to separate Memoria-generation-focused upgrades from Meta upgrades. Pathway §14: Deep enables `mem` by default (thematic), Swift blocks `mem`, Balanced enables all.

| Upgrade | Cost | Effect | Tier |
|---|---|---|---|
| **Acervo de Memorias** *(NEW Sprint 6.8)* | 500K | Memorias per prestige +1 (base 2 → 3). Replaces the retired `consolidacion_memoria` path for Thoughts-focused players who want Memoria acceleration. | **P5+** |
| **Red Emotiva** *(NEW Sprint 6.8)* | 1.5M | Mood shift event magnitudes ×1.5 (both positive and negative amplified — the mind feels MORE. Commitment to emotional play.) | **P6+** |

### Tier P10 — Era 2 (★, 6) — new upgrades for Era 2
| Upgrade | Cost | Effect | Tier |
|---|---|---|---|
| Convergencia Sináptica | 200K | +1.5% per lifetime prestige, max +40% *(uses `lifetimePrestiges`, fix from INT-3)* | P10+ |
| Consciencia Distribuida | 150K | Offline cap 8h → 12h | P10+ |
| Potencial Latente | 300K | Discharge burst **× (1 + prestigeCount × 0.02)** *(rebalanced Sprint 6.8 — was +1000 × prestigeCount additive, now multiplicative so it scales properly against late-game base production)* | P10+ |
| Resonancia Acumulada | 350K | +5% to first post-offline Discharge per hour offline (max +100%) | P10+ |
| Síntesis Cognitiva | 800K | Pattern flat bonus ×2 | P13+ |
| Focus Persistente | 600K | Retain 25% Focus across prestige *(fix from BUG-06 — was 50%)* | P12+ |

**Total: 39 upgrades (Sprint 6.8 final — was 35 pre-rearchitecture).**

Breakdown:
- Tap 3 (unchanged)
- Focus 1 (unchanged)
- Synapsis 6 (added arquitecto_neural)
- Neurons 9 (added neurotrofinas)
- Regions 2 (reduced from 5 per §16.8)
- Consciousness & Offline 6 (added ondas_theta + guardian_del_tiempo)
- Meta 4 (added reflexion_metacognitiva)
- **Memory (NEW) 2** (acervo_memorias + red_emotiva)
- Tier P10 6 (unchanged)

Sum: 3+1+6+9+2+6+4+2+6 = **39**.

**Sprint 5 upgrade IDs retired in Sprint 6.8 Wave 1:** `consolidacion_memoria`, `regulacion_emocional`, `procesamiento_visual`. Code will continue to understand these IDs (`migrateState()` drops them from `state.upgrades` silently) — their effects are preserved via the Region sub-systems.

**Sprint 6.8 Wave 2 additions (6 new IDs):** `neurotrofinas`, `reflexion_metacognitiva`, `arquitecto_neural`, `acervo_memorias`, `red_emotiva`, `guardian_del_tiempo`. String keys for i18n: `upgrades.{id}` name, `upgrades_desc.{id}` description.

**Sprint 6.8 Wave 2 rebalances (3 existing IDs, effect changed no ID change):**
- `sincronizacion_total`: +0.18 → +0.25 Focus post-Cascade, + "Mood +2 on Cascade" tie
- `umbral_consciencia`: removed "at ≥50%" conditional; always on now
- `potencial_latente`: +1000 × prestigeCount (additive) → × (1 + prestigeCount × 0.02) (multiplicative)

## 24.6 Upgrades tab UX polish spec (Sprint 7.8)

Beyond the Sprint 6.8 sort fix (UPGRADES-1), the Upgrades tab gets a small polish pass:

1. **UPGRADES-2 Owned drawer (collapsible footer).** Currently hidden entirely ("panel focuses on purchase decisions" per Sprint 3.6.3 comment). Add "Owned (N)" collapsible footer so players can see their build at a glance. Collapsed by default to preserve focus.

2. **UPGRADES-3 Category-grouping toggle.** Primary grouping stays Affordable/Teaser/Locked. Secondary toggle: "Group by category" (Tap / Focus / Synapsis / Neurons / Regions / Consciousness / Meta / Memory / P10). Helps organized-mind players.

3. **UPGRADES-4 Mastery level badges.** When §38 Mastery ships, each owned upgrade card shows a small L{1-10} badge with subtle ring fill. Reinforces lifetime-progression loop.

4. **UPGRADES-5 Newly-unlocked pulse.** When an upgrade crosses Locked → Teaser → Affordable on a prestige, pulse the card edge with the category color for 3s. Current UI renders silently, missing a celebration beat.

5. **UPGRADES-6 Estimated-payoff preview (tap-hold).** On long-press of an upgrade card, show an estimated payoff line ("+X thoughts/sec projected" or "+1 Cascade reachable per cycle"). Helps players evaluate buys without calculator-level thinking.

## 24.7 Pathway recalibration note (Sprint 6.8)

With the `mem` category addition and upgrade count 33 → 39, Pathway §14 enable/block lists need refresh:
- **Rápida (Swift):** enables `tap`, `foc`, `syn`, `met`. Blocks `reg`, `con`, `new`, `mem` (+1 new block). Unchanged bonuses (Insight ×2, Discharge charge rate ×1.5).
- **Profunda (Deep):** enables `neu`, `reg`, `con`, `new`, `mem` (+1 new enable). Blocks `tap`, `foc`, `syn`. Unchanged bonuses (Memories ×2, Focus fill ×0.5).
- **Equilibrada (Balanced):** enables ALL including `mem`. No blocks. Unchanged bonus (all upgrade bonuses ×0.85).

---

# 24.5. Achievements (30) — added by second audit (2D-1)

30 achievements in 5 categories (6 each). Unlock conditions are checked on the tick after the relevant state change (not every tick — event-driven). Rewards are Sparks; total reward pool is 145 Sparks. Once unlocked, `achievementsUnlocked: string[]` stores the ID (never resets, §33 PRESERVE + §34 TRANSCENDENCE_PRESERVE).

**ID format:** `{category_prefix}_{short_name}`. Categories: `cyc_*` (Cycle), `meta_*` (Meta), `nar_*` (Narrative), `hid_*` (Hidden — not shown in UI until unlocked), `mas_*` (Mastery — requires Run 2 or Run 3).

Achievement unlock events fire `achievement_unlocked` analytics event (§27 Feature event #1) with `{id, prestigeCount}`.

### Category 1 — Cycle (6 achievements, 25 Sparks total)

Low-friction early wins. Most players will unlock all 6 within Run 1.

| ID | Display name | Trigger | Reward | Notes |
|---|---|---|---|---|
| `cyc_first_spark` | First Spark | First Discharge used (`lifetimeDischarges` goes from 0 to 1) | +3 Sparks | Triggered during tutorial P0 |
| `cyc_first_cascade` | First Cascade | First Cascade triggered (Discharge with `focusBar >= 0.75`) | +5 Sparks | Teaches Cascade |
| `cyc_full_focus` | Fully Focused | Focus Bar reaches 1.0 for the first time | +3 Sparks | Insight tutorial payoff |
| `cyc_under_10` | Quick Mind | Complete any cycle in under 10 minutes (cycle duration <600s at prestige) | +5 Sparks | Optimization taste |
| `cyc_five_types` | Full Orchestra | Own at least 1 of all 5 neuron types simultaneously in one cycle | +4 Sparks | Connection-mult teaching |
| `cyc_eureka_rush` | Eureka Rush | Trigger the "Flujo Eureka" Mental State (3 Insights in 2 min) | +5 Sparks | Mental State teaching |

### Category 2 — Meta (6 achievements, 35 Sparks total)

Cross-cycle milestones. Unlock across Run 1 progression.

| ID | Display name | Trigger | Reward | Notes |
|---|---|---|---|---|
| `meta_first_awakening` | First Awakening | First prestige completed (`lifetimePrestiges` goes from 0 to 1) | +5 Sparks | Tutorial payoff |
| `meta_polarity_picked` | First Choice | First Polarity chosen (at P3) | +3 Sparks | Milestone |
| `meta_archetype_chosen` | First Identity | First Archetype chosen (at P5) | +5 Sparks | Archetype commitment |
| `meta_mutation_picked` | First Mutation | First Mutation chosen (at P7) | +3 Sparks | |
| `meta_pathway_picked` | First Pathway | First Pathway chosen (at P10) | +5 Sparks | Era 2 gateway |
| `meta_era_3` | Threshold of Truth | Reach P19 (Era 3 begins) | +14 Sparks | Era 3 reward |

### Category 3 — Narrative (6 achievements, 30 Sparks total)

Rewards narrative engagement. Tracks `narrativeFragmentsSeen.length` and ending choices.

| ID | Display name | Trigger | Reward | Notes |
|---|---|---|---|---|
| `nar_first_fragment` | First Fragment | Read first narrative fragment (BASE-01) | +3 Sparks | Often coincides with `cyc_first_spark` |
| `nar_ten_fragments` | Ten Truths | Read 10 narrative fragments total (`narrativeFragmentsSeen.length >= 10`) | +5 Sparks | |
| `nar_all_base` | The Foundation | Read all 12 BASE fragments | +5 Sparks | Cross-Run — all BASE triggers hit |
| `nar_first_ending` | First Resolution | See first ending (regardless of which; `endingsSeen.length >= 1`) | +7 Sparks | Run 1 completion |
| `nar_diary_50` | Chronicler | Neural Diary reaches 50 entries | +5 Sparks | `diaryEntries.length >= 50` |
| `nar_all_archetype_frags` | Full Voice | Read all 15 fragments of current Run's archetype | +5 Sparks | Per-archetype completion |

### Category 4 — Hidden (6 achievements, 28 Sparks total)

**NOT shown in UI until unlocked.** Display placeholder `???` on the achievements list for locked Hidden entries. These are discovery rewards, aligned with Secret Ending themes.

| ID | Display name | Trigger | Reward | Notes |
|---|---|---|---|---|
| `hid_no_tap_cycle` | The Still Mind | Complete a cycle without a single tap (`cycle-level tap count === 0` at prestige) | +5 Sparks | Parallel to RP-2 but more forgiving (also idle-friendly) |
| `hid_no_discharge_full_cycle` | Silent Power | Complete 3 full cycles in a row without using Discharge | +5 Sparks | Extends RP-2 mentality |
| `hid_insight_trasc` | Transcendent Thought | Trigger a Level 3 (Trascendente) Insight | +3 Sparks | Only possible P19+ |
| `hid_max_connection` | Perfect Network | Reach `connectionMult === 1.5` (all 5 types owned) and maintain for 30s | +5 Sparks | Sustained perfect connections |
| `hid_spontaneous_hunter` | Golden Cookie | Experience all 12 spontaneous event types at least once (lifetime, tracked in new field) | +5 Sparks | Collection achievement |
| `hid_first_rp` | Resonance Detected | Discover first Resonant Pattern | +5 Sparks | Gateway to Secret Ending |

### Category 5 — Mastery (6 achievements, 27 Sparks total)

Requires multi-Run play. Bulk of these hit only Run 2 or later.

| ID | Display name | Trigger | Reward | Notes |
|---|---|---|---|---|
| `mas_first_transcendence` | Ascended | First Transcendence completed (`transcendenceCount >= 1`) | +7 Sparks | Run 2 start |
| `mas_all_archetypes` | Three Minds | Play all 3 archetypes across Runs (`archetypeHistory` contains all 3) | +5 Sparks | Requires Run 3 start |
| `mas_all_pathways` | Walking All Ways | Use all 3 Pathways across prestiges (`uniquePathwaysUsed.length === 3`) | +3 Sparks | |
| `mas_all_mutations` | The Variety | Use all 15 Mutations at least once (`uniqueMutationsUsed.length === 15`) | +5 Sparks | Collection |
| `mas_resonance_50` | Resonant Mind | Accumulate 50 Resonance total in one Run (reset on Transcendence; tracks max peak) | +3 Sparks | Mid-Run resonance milestone |
| `mas_all_endings` | Full Spectrum | See all 4 endings playable in v1.0 (`endingsSeen.length >= 4` with 4 unique IDs excluding `resonance`) | +4 Sparks | Main content completion. Excludes Secret (5th is separate, narrative-driven) |

### Reward total verification

### Category 6 — Regions (5 achievements, 30 Sparks total — Sprint 6.8 added)

Tied to Region sub-system engagement. Reward exploration of each sub-system.

| ID | Display name | Trigger | Reward | Notes |
|---|---|---|---|---|
| `reg_shard_collector` | Shard Collector | Accumulate 100 shards of any type | +5 Sparks | Rewards Hipocampo engagement |
| `reg_precommit_streak` | Committed Mind | Achieve 5 consecutive Pre-commit successes | +7 Sparks | Prefrontal streak bonus |
| `reg_euphoric` | Euphoric | Reach Mood 100 (Euphoric tier) | +5 Sparks | Límbico peak mood |
| `reg_foresight_master` | Foresight Master | Unlock all 4 Visual Foresight tiers | +7 Sparks | Visual region completion |
| `reg_integrated_mind` | Integrated Mind | Activate all 5 regions in one Run (Amplitud de Banda 5-tier) | +6 Sparks | Integrated Mind endgame beat |

### Reward total verification

| Category | Count | Total Sparks |
|---|---|---|
| Cycle | 6 | 25 |
| Meta | 6 | 35 |
| Narrative | 6 | 30 |
| Hidden | 6 | 28 |
| Mastery | 6 | 27 |
| **Regions** *(Sprint 6.8)* | **5** | **30** |
| **Total** | **35** | **175** |

### New field required (minor GameState addition — does NOT affect 110 count)

The 30-achievement list references `spontaneousEventTypesSeen: string[]` for `hid_spontaneous_hunter`. This tracking is too granular to derive from existing fields. **Decision: instead of adding a new field (which would break the 110 count), piggyback on `diaryEntries`.** The diary entry type `'fragment'` is extended to also log spontaneous events with `data.spontaneousId` present. Achievement check: `unique IDs across diary entries where type==='fragment' && data.spontaneousId !== undefined >= 12`. This preserves field count.

### Rules

- **ACH-1:** Achievement checks happen on the tick AFTER the relevant state change (e.g., `cyc_first_spark` fires one tick after `lifetimeDischarges` increments). Prevents race conditions with other checks.
- **ACH-2:** Hidden achievements display as `???` with placeholder icon in the Mind → Achievements subtab UNTIL unlocked. After unlock, full name + description visible. This is the only category with this rule.
- **ACH-3:** Reward is applied immediately on unlock (`sparks += reward`). Toast banner: `"🏆 {displayName} · +{reward} Sparks"`. Analytics: `achievement_unlocked`. Logged to Neural Diary as `type: 'achievement'`.
- **ACH-4:** Achievement IDs are stable across versions (never renamed). If a v1.1+ achievement is added, use new ID. For save compatibility, `achievementsUnlocked` retains all historical IDs; unknown IDs from older saves are ignored (not crash).

### Sprint 7 AI check addition (replacing vague "30 achievements" line)

`src/config/achievements.ts` exports `ACHIEVEMENTS: Achievement[]` with exactly 30 entries matching GDD §24.5 (IDs, display names, triggers as pure functions taking GameState, rewards, categories). Sprint 7 test suite asserts `ACHIEVEMENTS.length === 30`, `ACHIEVEMENTS.filter(a => a.category === 'cycle').length === 6` (×5 for all categories), total Spark reward sum === 145, every ID matches `/^(cyc|meta|nar|hid|mas)_[a-z_0-9]+$/`, Hidden achievements have `isHidden: true` flag, narrative/mastery achievements correctly persist across Transcendence.

---

# 25. Weekly Challenge (CORE-9)

**Cycle:** Every Monday 00:00 UTC, a new challenge is assigned (seeded from week start timestamp).

**Challenge pool (8):**
1. Complete 5 prestiges this week
2. Reach P10 in one session
3. Trigger 3 Cascades
4. Discover 1 Resonant Pattern
5. Buy 10 Mirror neurons
6. Complete a cycle under 15 min
7. Activate all 5 Mental States
8. Read 10 narrative fragments

**Display:** Progress shown in Daily Login modal. Also accessible from Mind tab.

**Reward:** 15 Chispas + 1 narrative fragment.

**Rules:**
- **CORE-9:** If week passes without completion, challenge is replaced. Old one NOT claimable retroactively.
- **WKLY-1:** Challenge 5 ("Buy 10 Mirror neurons") + Especialización Mutation filter: if Especialización with non-Mirror is offered, replace that option (MUT-4 fix).
- **WKLY-2:** Tooltip on all challenges: "Mutations and Pathways do not invalidate challenge progress — you only need to meet the literal condition."
- **WKLY-3:** Analytics events: `weekly_challenge_started`, `weekly_challenge_completed`, `weekly_challenge_expired`.

**Post-launch:** The 8-challenge pool should grow to 16-20 within 2 months of launch. 8 weeks = player has seen all. Add rotation.

---

# 26. Monetization

**Philosophy (PHIL-1):** F2P completes 100% of content — all 4 v1.0 endings (3 archetype + Secret Singularity), all Resonant Patterns, 3 Transcendences. No paywall. No pay-to-win. IAP = cosmetics + convenience. (5th ending "The Witness" is v1.5+ content — still free in that version; PHIL-1 guarantee extends to every future version.)

### Revenue streams

| Stream | Offering | Avg/mo (conservative) | Avg/mo (optimistic) |
|---|---|---|---|
| Rewarded ads | 7 placements | ~$200/mo | ~$800/mo |
| Genius Pass (subscription) | $4.99/mo OR $1.99/wk | ~$600 | ~$2,400 |
| Starter Pack (one-time) | $2.99 post-P2 | ~$150 | ~$600 |
| Cosmetics Store | 8 skins ($0.99) + 4 themes ($1.99) + 3 glows ($0.99) + 1 HUD ($1.99) | ~$100 | ~$400 |
| Piggy Bank | Fills passively, $0.99 to refill | ~$50 | ~$200 |
| Spark Packs | 3 tiers ($0.99/$3.99/$7.99) | ~$100 | ~$400 |
| Limited-Time Offers | 4 milestone triggers | ~$100 | ~$400 |
| **TOTAL** | | **~$1,300/mo** | **~$5,200/mo** |

**Revenue note:** Conservative estimates assume established DAU (~2K). First 3-6 months will be organic growth phase with revenue closer to $50-200/mo. Revenue scales with installs. Focus on retention metrics (D7 ≥15%) before scaling UA spend.

### Rules

- **MONEY-1:** All prices fetched from store via `product.priceString` (RevenueCat). NEVER hardcoded. Apple/Google reject on $0.01 mismatch.
- **MONEY-2:** Subscription UI shows: price, auto-renew statement, cancel instructions BEFORE purchase.
- **MONEY-3:** Restore Purchases button in Settings → calls `RevenueCat.restorePurchases()`.
- **MONEY-4:** No ads during first 10 minutes (tutorial grace period).
- **MONEY-5:** No ad after a Cascade (Cascade is its own reward).
- **MONEY-6:** Max 1 rewarded ad per 3 minutes.
- **MONEY-7:** Ad failure → toast "Ad not available", no crash, no penalty.
- **MONEY-8:** Monthly Spark purchase cap: 1000. Resets on calendar month boundary (1st of each month, UTC). `sparksPurchaseMonthStart` stores first day of current tracking month (timestamp of month-start UTC). Exceeding shows friendly cap message, blocks purchase. **Default behavior (documented by second audit 7A-2):** `sparksPurchaseMonthStart` defaults to `0` at game install (timestamp 1970-01-01 UTC). This is intentional and MUST NOT be changed. On every Spark purchase attempt, the code computes `startOfCurrentMonthUTC(now)` via a pure helper and compares against `sparksPurchaseMonthStart`; if they differ, reset `sparksPurchasedThisMonth = 0` and set `sparksPurchaseMonthStart = startOfCurrentMonthUTC(now)`. The 0-default ensures first-purchase-ever always triggers a reset path (from 1970-01 → current month). Helper pseudocode:
  ```ts
  function startOfCurrentMonthUTC(now: number): number {
    const d = new Date(now);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
  }
  // Purchase attempt:
  const monthStart = startOfCurrentMonthUTC(nowTimestamp);
  if (state.sparksPurchaseMonthStart !== monthStart) {
    state.sparksPurchaseMonthStart = monthStart;
    state.sparksPurchasedThisMonth = 0;
  }
  if (state.sparksPurchasedThisMonth + packAmount > maxSparksPurchasedPerMonth) return blockPurchase();
  ```
  This helper is permitted to accept `nowTimestamp` externally (store-boundary, not engine) per INIT-1. Sprint 9b test must cover: (a) first-ever purchase resets from 0, (b) second purchase same month doesn't reset, (c) purchase after month-crossing resets cleanly, (d) purchase at exactly 00:00:00 UTC on the 1st works.

### 7 rewarded ad placements
1. Offline return ×2 (if offline ≥ 30 min)
2. Post-Discharge ×2 (non-Cascade only)
3. Post-Discharge ×2 (second slot, different cooldown)
4. Mutation reroll (offer 3 new options mid-prestige)
5. Pattern Decision retry (let player pick the other option, one-time per decision)
6. Piggy Bank refill ×2 on claim
7. Streak save (watch ad to preserve daily login streak after missing 1 day)

### Genius Pass benefits ($4.99/mo OR $1.99/wk)
- No ads (removes all 7 placements, including streak save — streak is auto-preserved for subscribers)
- Offline +25% efficiency (stacks into OFFLINE-4 cap)
- Extra Mutation slot (+1 option always, independent from Creativa's +1)
- 10 Chispas / week
- HD Neural Snapshot (can save/share your mind visually)
- Exclusive "Genius Gold" canvas theme

### Genius Pass offer triggers
Offered at: post-P1, post-Personal Best, post-P5, post-P10, post-Transcendence. Minimum 72h between offers. Max 3 total dismissals (after which the offer is Store-only).

**MONEY-9 (Apple compliance):** Genius Pass subscription UI must include: (1) prominent "All content accessible for free — subscription is convenience only" badge, (2) price, auto-renew, cancel instructions per MONEY-2. App Review notes must reference PHIL-1 (100% content free). Prepare response letter for Sprint 12 explaining no gameplay is gated behind subscription.

### Starter Pack — "Neural Awakening Pack" ($2.99) *(INT adjustment: delay 1 cycle)*
- Contents: 50 Chispas + "Neon Pulse" exclusive canvas theme + 5 Memories
- Appears: on Awakening screen post-P2 (not P1 — tonally softer per review recommendation)
- 48h timer then gone forever
- One-time only
- Events: `starter_pack_shown`, `starter_pack_purchased`, `starter_pack_dismissed`

### Cosmetics Store — "Neural Aesthetics"
- **Neuron skins (8):** ember, frost, void, plasma, aurora, crystal, spore, nebula — $0.99 each
- **Canvas themes (4):** aurora, deep_ocean, deep_space, temple — $1.99 each
- **Glow packs (3):** firefly, halo, plasma — $0.99 each
- **HUD style pack (1):** minimal — $1.99

**Cross-category ID collisions (intentional pattern):**

Some cosmetic identifiers appear in multiple categories:
- `aurora`: Neuron skin #5 AND Canvas theme #1
- `plasma`: Neuron skin #4 AND Glow pack #3

These are NOT bugs. Each cosmetic category maps to a distinct GameState slot (`activeNeuronSkin`, `activeCanvasTheme`, `activeGlowPack`, `activeHudStyle`), and the Sprint 9 registry architecture keeps each category in a separate `Record<string, ...>` (`NEURON_SKINS`, `CANVAS_THEMES`, `GLOW_PACKS`, `HUD_STYLES` — see `src/ui/theme/cosmeticOverrides.ts`). Lookups are always scoped by category: `NEURON_SKINS[state.activeNeuronSkin]`, never `ALL_COSMETICS[id]`. No runtime collision possible.

Era theme IDs (`bioluminescent`, `digital`, `cosmic`) live in a separate registry (`ERA_THEMES`) with a closed union type (`EraVisualTheme`) — they MUST NOT overlap with cosmetic IDs to preserve type safety. The earlier `cosmic` cosmetic was renamed to `deep_space` (Sprint 2 Phase 4) to prevent this specific Era/cosmetic overlap. `deep_space` also mirrors the `deep_ocean` naming pattern.

3-second live preview on canvas before purchase. Persist forever (survive prestige + transcendence). Mix-and-match.

### Limited-Time Offers (4 milestones, 48h each)
| Trigger | Offer | Reason |
|---|---|---|
| P3 (Polarity unlocked) | "Dual Nature Pack" — 1 neuron skin + 30 Sparks for $1.99 | Player learned the game has depth |
| P7 (Mutations unlocked) | "Mutant Bundle" — 1 glow pack + 1 canvas theme for $1.99 | Visual variety pairs with mechanical variety |
| P13 (Resonance unlocked) | "Deep Mind Pack" — 50 Sparks + 3 Memories for $2.99 | Mid-game investment |
| Run 2 start | "New Beginning Sale" — all cosmetics 50% off for 48h | Fresh start = fresh look |

### Piggy Bank
Fills passively (1 Spark per 10K `totalGenerated`, max 500). "Break" costs $0.99. Survives prestige + transcendence.

**Cap UX (MONEY-10, second audit 7A-3):** When `piggyBankSparks === 500`, a non-intrusive chip appears in the HUD near the Sparks counter: `"🐷 Piggy Bank full — tap to break ($0.99)"`. Tapping opens the standard claim modal. The chip auto-dismisses on claim OR on next prestige. Accumulation is hard-capped: `piggyBankSparks = Math.min(500, current + 1)`; additional `totalGenerated` increments do NOT add to piggyBankSparks (no overflow counter — kept simple to avoid field-count bump). No analytics event fires for cap-reached in v1.0 — if post-launch data shows Piggy Bank sits at cap without conversion, add `piggy_bank_cap_reached` event in v1.1 (marked as v1.1 enhancement in POSTLAUNCH.md).

### Spark Packs
- $0.99 → 20 Sparks
- $3.99 → 110 Sparks (10% bonus)
- $7.99 → 300 Sparks (25% bonus)

Monthly cap: 1000 Sparks purchased (resets 1st of each month UTC). Anti-addict safeguard.

### Daily Login Bonus
7-day streak: 5 / 5 / 10 / 10 / 15 / 20 / 50 Sparks. Streak save: 1 grace day per 7-day cycle — if player misses exactly 1 day, on next login offer "Watch ad to save your streak?" (rewarded ad). If watched, streak continues. If skipped or 2+ days missed, streak resets to 0. Grace resets each new 7-day cycle.

---

# 27. Analytics — 48 events

**Breakdown:** 9 funnel + 11 monetization + 5 feature + 20 core + 3 weekly_challenge = 48 total. (Second audit 9A-2: added `pattern_decisions_reset` to Core category, missing from the original 47 despite being referenced by PAT-3 §10. Total 47 → 48.)

### Funnel (9) — ANALYTICS-3
`app_first_open`, `tutorial_first_tap`, `tutorial_first_buy`, `tutorial_first_discharge`, `first_prestige`, `reached_p5`, `reached_p10`, `first_transcendence`, `first_purchase`.

Firebase dashboard configured in Sprint 13.

### Monetization (11) — ANALYTICS-4
`starter_pack_shown`, `starter_pack_purchased`, `starter_pack_dismissed`, `limited_offer_shown` (id), `limited_offer_purchased` (id, price), `limited_offer_expired` (id), `cosmetic_purchased` (type, id, price), `cosmetic_previewed` (type, id), `cosmetic_equipped` (type, id), `spark_pack_purchased` (tier, amount), `spark_cap_reached`.

### Feature (5)
`achievement_unlocked` (id, prestigeCount), `mental_state_changed` (from, to), `micro_challenge_completed` (id, reward), `micro_challenge_failed` (id), `diary_entry_added` (entryType).

### Core (20)
`first_tap`, `first_neuron` (type), `upgrade_purchased` (id, cost, prestigeCount), `discharge_used` (bonus, cascade, insightActive), `insight_activated` (level), `prestige_completed` (prestigeCount, cycleTime, productionPeak, patternsTotal), `polarity_chosen` (type, prestigeCount), `mutation_chosen` (id, options, prestigeCount), `pathway_chosen` (type, prestigeCount), `pattern_decision` (nodeIndex, choice), `resonant_pattern_discovered` (index), `spontaneous_event` (id, type), `personal_best` (prestigeLevel, oldTime, newTime), `transcendence` (transcendenceCount, totalTime, archetypeChosen), `ending_seen` (endingId, choice), `offline_return` (elapsedHours, thoughtsEarned, lucidDream), `ad_watched` (placementId, reward), `genius_pass_offered` (triggerId, dismissed), `genius_pass_purchased` (plan), `pattern_decisions_reset` (prestigeCount, resonanceCost).

### Weekly Challenge (3) — CORE-9
`weekly_challenge_started` (id, weekStartTimestamp), `weekly_challenge_completed` (id, daysToComplete), `weekly_challenge_expired` (id).

### Crash monitoring
Firebase Crashlytics enabled by default. Non-fatal errors logged for: save load failure, migration failure, ad SDK timeout, RevenueCat timeout. Target: crash-free rate ≥99%.

---

# 28. Audio

**Library:** Howler.js. AudioContext unlock on first user tap (iOS requirement).

### Ambient tracks (3, one per Era)
- `ambient_bio.mp3` — Era 1 bioluminescent (loop, soft, deep tones with organic pulses)
- `ambient_digital.mp3` — Era 2 digital (loop, rhythmic, subtle glitches)
- `ambient_cosmic.mp3` — Era 3 cosmic (loop, spacey, long reverb)

### SFX (8)
- `tap.wav` — each tap (subtle click, pitch varies ±5% for variety)
- `neuron_buy.wav` — soft pop
- `upgrade_buy.wav` — ascending chime
- `discharge.wav` — whoosh + impact (intensified version for Cascade)
- `insight.wav` — rising tone + shimmer
- `prestige.wav` — descending chime + 3s reverb
- `spontaneous.wav` — subtle bell (positive) or buzz (negative)
- `resonant_pattern.wav` — harmonic chord crescendo (rare, impactful)

### Settings
- Master toggle (on/off)
- Separate music volume slider
- Separate SFX volume slider
- Respect system audio settings

**AUDIO-1:** Never play audio before first user gesture (iOS silent failure).  
**AUDIO-2:** On `visibilitychange === 'hidden'`: pause ambient, suppress SFX until visible again.

---

# 29. UI / HUD / tabs

### HUD Layout (portrait)
- Top-left: Thoughts (current count, large number)
- Top-right: Rate (thoughts/sec)
- Top-center: Discharge charges count + timer to next charge
- Top horizontal bar (below thoughts/rate): Focus Bar, cyan (rises with taps)
- Right vertical: Consciousness bar, violet (rises with cycleGenerated)
- Bottom: 4 tabs (Neurons, Upgrades, Regions, Mind)
- Center bottom: Discharge button (large, pulsing when charge available)
- Overlay banners: Spontaneous event, Mental State chip, Micro-challenge, Weekly challenge progress

*Positions verified against [UI_MOCKUPS.html](UI_MOCKUPS.html) canonical SVG (Phase 4.9.1 Sprint 2 pre-code alignment — Finding #18). Focus Bar is at `x=80 y=76 w=230 h=4` (top horizontal cyan `#40D0D0`). Consciousness bar is at `x=382 y=120..480` (right vertical violet `#8B7FE8`). Per GDD §3b pairing rule, the mockup is the canonical visual source.*

### Tabs (always 4)
1. **Neurons** — buy neurons, see connection stats
2. **Upgrades** — browse 35 + Run-exclusive upgrades, sorted by affordability
3. **Regions** — 5 brain regions with their upgrades
4. **Mind** — Pattern Tree, Archetypes, Resonance upgrades, Neural Diary, Achievements, Weekly Challenge

### Badge priority (UI-3)
Only 1 tab badge active at a time. Priority:
1. New feature unlock (e.g., "Pattern Tree unlocked")
2. Affordable upgrade not yet purchased
3. Discharge charge ready
4. Active mission / challenge

Badge dismisses after tab opened once. Tracked in `tabBadgesDismissed: string[]`.

### Tab Upgrades ordering
1. **Affordable** — green highlight, can buy now
2. **Teaser (next affordable)** — greyed but visible, with unlock requirement
3. **Blocked by Pathway** — tooltip "Blocked by current Pathway"
4. **Locked** (not yet unlocked by prestige) — silhouette only

### Pre-cycle modal flow (CYCLE-1)
ONE unified screen (`CycleSetupScreen`) with 1-3 columns based on prestige:
- P3-P6: 1 column (Polarity)
- P7-P9: 2 columns (Polarity, Mutation)
- P10+: 3 columns (Polarity, Mutation, Pathway)

Prominent "SAME AS LAST" button: one-tap default to previous choices. Experienced players skip in <2 sec.

Sequence: Awakening → 3s animation → Pattern Tree view → CycleSetupScreen → new cycle.

### UI rules
- **UI-1:** Max 1 tab badge (UI-3)
- **UI-3 (tab badge priority):** Max 1 tab badge visible at a time. Priority order: (1) new feature unlock > (2) affordable upgrade not yet purchased > (3) Discharge charge ready > (4) active mission/challenge. Dismissed badges persist in `tabBadgesDismissed: string[]` (RESETS per §33). Clears on tab opened. Formalized Sprint 2 kickoff — previously existed only as §29 heading text.
- **UI-4:** Undo expensive purchase — 3s toast if purchase >10% of current thoughts
- **UI-5:** Fragment archive — every shown fragment saved to `narrativeFragmentsSeen`
- **UI-6:** Landscape on tablets ≥900px wide
- **UI-7 (INT-11 note):** The 3-choice stack (Polarity + Archetype + Pathway) creates specialist builds with ~40% variance between weakest and strongest. This is BY DESIGN — balanced by Run-over-Run re-choice.
- **UI-8 (error states):** All network-dependent services fail silently with graceful fallback. Firebase Analytics/Crashlytics: silent fail, game continues (CODE-8 try/catch). RevenueCat: store shows cached prices or "Store temporarily unavailable" banner, retry on next foreground. AdMob: toast per MONEY-7. Cloud save: toast "Saved locally. Cloud sync will resume when online." Full offline: game fully playable, no blocking modals.
- **UI-9 (first-open sequence):** (1) Branded splash screen (2s max, app icon + "SYNAPSE", dark background). (2) If EU detected: GDPR consent modal (minimal, Accept / Manage — game starts regardless). (3) Canvas loads with 1 Basic neuron auto-granted and pulsing. (4) Tutorial hint "Tap the neuron" after 2s idle. (5) On first tap: thoughts accumulate, BASE-01 fragment fades in.
- **CYCLE-2 (mobile layout):** On screens <600px wide, CycleSetupScreen uses step-by-step flow (swipe or "Next") instead of 3 simultaneous columns: Step 1 = Polarity (full width), Step 2 = Mutation (full width), Step 3 = Pathway (full width). Progress dots at bottom. "SAME AS LAST" visible on Step 1. Tablets/landscape ≥600px keep 3-column layout per CYCLE-1.
- **UI-2, UI-10, TAB-1, TAB-2 are NOT formal rules.** If referenced in prompts or session handoffs, flag as fabrication. Colorblind mode (previously attributed to UI-10) is Sprint 10 scope per SPRINTS.md §Sprint 10 — see §3b accessibility note.

---

# 30. Type definitions

All domain types used across GameState, engine, and store.

```ts
// --- Neuron types ---
type NeuronType = 'basica' | 'sensorial' | 'piramidal' | 'espejo' | 'integradora';

interface NeuronState {
  type: NeuronType;
  count: number;
}

interface NeuronSnapshot {
  type: NeuronType;
  count: number;
  rate: number;           // at moment of snapshot
  timestamp: number;
}

// --- Upgrade ---
type UpgradeCategory = 'tap' | 'foc' | 'syn' | 'neu' | 'reg' | 'con' | 'met' | 'new';

interface UpgradeState {
  id: string;             // matches constants upgrade ID
  purchased: boolean;
  purchasedAt?: number;   // timestamp (for undo toast)
}

// --- Polarity ---
type Polarity = 'excitatory' | 'inhibitory';

// --- Archetype ---
type Archetype = 'analitica' | 'empatica' | 'creativa';

// --- Pathway ---
type Pathway = 'rapida' | 'profunda' | 'equilibrada';

// --- Mutation ---
type MutationCategory = 
  | 'produccion' | 'disparo' | 'upgrade' | 'restriccion' | 'focus' 
  | 'regions' | 'memorias' | 'temporal' | 'especial';

interface Mutation {
  id: string;
  name: string;                    // display name (Spanish)
  effect: string;                  // display effect text (Spanish)
  category: MutationCategory;
  affectsOffline: boolean;
  // Gameplay effects are functions in engine/mutations.ts keyed by id
}

// --- Pattern ---
interface PatternNode {
  index: number;                   // 0-49
  isDecisionNode: boolean;         // true at 6, 15, 24, 36, 48
  decision?: 'A' | 'B';            // only if decision node and chosen
  acquiredAt: number;              // prestigeCount when earned
}

// --- Weekly Challenge ---
interface WeeklyChallengeState {
  id: string;
  weekStartTimestamp: number;
  progress: number;
  target: number;
  rewardClaimed: boolean;
}

// --- Awakening Log ---
interface AwakeningEntry {
  prestigeCount: number;
  timestamp: number;
  cycleDurationMs: number;
  endProduction: number;           // effectiveProductionPerSecond at prestige moment
  polarity: Polarity | null;
  mutationId: string | null;
  pathway: Pathway | null;
  patternsGained: number;
  memoriesGained: number;
  wasPersonalBest: boolean;
}

// --- Spontaneous Event ---
type SpontaneousEventType = 'positive' | 'neutral' | 'negative';

interface SpontaneousEventActive {
  id: string;
  type: SpontaneousEventType;
  endTime: number;                 // timestamp; 0 for instant events
}

// --- Mutation active state ---
interface MutationActive {
  id: string;
  stackedRandomId?: string;        // for "Mutación Temporal" spontaneous event
  stackedExpiry?: number;
}

// --- Micro-challenge ---
interface MicroChallenge {
  id: string;
  startTime: number;
  timeLimit: number;
}

// --- Limited Offer ---
interface LimitedOffer {
  id: string;
  expiresAt: number;
}

// --- Diary Entry ---
interface DiaryEntry {
  timestamp: number;
  type: 'prestige' | 'resonant_pattern' | 'personal_best' | 'ending' | 'fragment' | 'achievement';
  data: Record<string, any>;       // type-specific payload
}

// --- Ending ---
// v1.0 ships with 4 endings: 3 archetype endings + 1 Secret (Singularity).
// 'resonance' (The Witness / Observer) is v1.5+ content — see POSTLAUNCH.md.
// The type is deliberately NARROW in v1.0; v1.5 migration widens it to include 'resonance'
// via union expansion. Saved states (endingsSeen: EndingID[]) remain forward-compatible.
type EndingID = 'equation' | 'chorus' | 'seed' | 'singularity';
```

### Deterministic RNG utilities (RNG-1, second audit 2B-6)

These are the canonical implementations required by CODE-9 (engine determinism). Every random decision in the engine MUST derive from one of these — never `Math.random()`. Seeds are stateless inputs, always re-computed from `hash(cycleStartTimestamp + local_counter)` per call site. Spec is reference-quality: different implementations of the same seed MUST produce the same output sequence, or TEST-5 simulation is not reproducible.

```ts
/**
 * mulberry32 — standard 32-bit seeded PRNG.
 * Pure function: same seed always produces same sequence.
 * Returns a generator function; call to get next float in [0, 1).
 * Reference: github.com/bryc/code/blob/master/jshash/PRNGs.md#mulberry32
 */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;  // coerce to uint32
  return function () {
    s = (s + 0x6D2B79F5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * hash — deterministic 32-bit hash from any primitive input.
 * Uses FNV-1a (offset basis 2166136261, prime 16777619).
 * Output: uint32 in [0, 2^32).
 * Stable across JS engines — all math is integer via Math.imul.
 */
function hash(input: number | string): number {
  let h = 2166136261 >>> 0;  // FNV offset basis
  const str = String(input);
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * seededRandom — one-shot random float in [0, 1) from a seed.
 * Convenience wrapper: single use, no state. For multi-draw from same seed family,
 * use mulberry32 directly and reuse the generator.
 */
function seededRandom(seed: number): number {
  return mulberry32(seed)();
}

/**
 * randomInRange — deterministic integer in [min, max] (inclusive both) from seed.
 * Used for spontaneous event check interval randomization (SPONT-1).
 */
function randomInRange(min: number, max: number, seed: number): number {
  return Math.floor(seededRandom(seed) * (max - min + 1)) + min;
}

/**
 * pickWeightedRandom — generic weighted-random selection over items with positive weights.
 * Deterministic per seed. Returns the item whose cumulative weight range contains
 * seededRandom(seed) × totalWeight.
 */
function pickWeightedRandom<T>(
  items: Array<{ item: T; weight: number }>,
  seed: number,
): T {
  let totalWeight = 0;
  for (const entry of items) totalWeight += entry.weight;
  const roll = seededRandom(seed) * totalWeight;
  let cumulative = 0;
  for (const entry of items) {
    cumulative += entry.weight;
    if (roll < cumulative) return entry.item;
  }
  // Reachable only via float rounding when roll ≈ totalWeight exactly.
  return items[items.length - 1].item;
}
```

Generic weighted-random selection over an array of items with positive weights. Used throughout the engine for any weighted pick (Mutations, Spontaneous events, Micro-challenges, etc.).

For two-step category-then-uniform picks (e.g. SPONT-1 which first picks a positive/neutral/negative category, then picks uniformly within that category), compose two calls:

```ts
// Step 1: weighted category pick via pickWeightedRandom
const category = pickWeightedRandom([
  { item: 'positive', weight: spontaneousWeights.positive },
  { item: 'neutral',  weight: spontaneousWeights.neutral  },
  { item: 'negative', weight: spontaneousWeights.negative },
], seed);

// Step 2: uniform pick within category via randomInRange
const candidates = pool.filter(e => e.type === category);
const idx = randomInRange(0, candidates.length - 1, hash(`${seed}:cat-${category}`));
return candidates[idx];
```

Sprint 6 (spontaneous events) will implement this composition in `src/engine/spontaneousEvents.ts` as `pickSpontaneousEvent()`.

**RNG verification (Sprint 1 snapshot test):**
- `mulberry32(12345)()` first 3 values: `0.9797282677609473`, `0.3067522644996643`, `0.484205421525985` (computed with the implementation above; exact to IEEE 754 double precision). Sprint 1 asserts these exact values — any drift in the PRNG implementation fails the test.
- `hash("0")` = `890022063`; `hash("1")` = `873244444`; `hash(0)` = `890022063` (number and string coerce equal because `String(0) === "0"`).

**Seed-state discipline:**
- Engine code never stores PRNG state between calls. Every RNG call constructs a fresh `mulberry32(hash(...))` from a deterministically-derived seed.
- The only RNG-related field in GameState is `mutationSeed: number` (stored per-cycle for MUT-2). All other seeds (spontaneous, micro-challenge, RP checks) are recomputed on the fly from `cycleStartTimestamp` + local counters.

---

# 31. Constants (complete)

```ts
export const SYNAPSE_CONSTANTS = {
  // Tutorial
  tutorialThreshold: 25_000,             // Used for P0 of first Run ONLY when isTutorialCycle=true (see TUTOR-2 §9). Overrides baseThresholdTable[0]. TUTOR-1 target: 7-9 min. Retuned 50K→25K in Sprint 3 Phase 7.4b (tutorial-timing simulator projected 50K → ~14.7 min at 5 taps/sec, well above target).
  tutorialDischargeMult: 3.0,

  // Thresholds
  runThresholdMult: [1.0, 3.5, 6.0, 8.5, 12.0, 15.0],  // by transcendenceCount
  // NOTE: consciousnessThreshold removed in second audit (2B-3) — was duplicate of baseThresholdTable[0].
  // For consciousness bar visibility trigger, see CORE-10 (§35) which uses 0.5 × currentThreshold.
  baseThresholdTable: [                  // P0→P26 base thresholds (×runThresholdMult for Runs 2+)
    // v2 (second audit 4A-1) — INTERIM values from node-simulated 1-tap/sec runs with typical upgrade/archetype kit.
    // Old values were sim-verified to run 40-50% slow in Era 1 tail / 50-80% fast in Era 2-3. See PROGRESS.md Batch 3 for rationale.
    // THESE ARE STILL INTERIM. Sprint 8c TEST-5 is the authoritative gate — run 27 scenarios (3 tap × 3 archetype × 3 pathway), tune any cycle >20% off target.
    // See ECO-1 (§35): this table is data, not code — rebalancing never requires engine changes.
    800_000,        // P0→P1:  ~8 min (OVERRIDDEN to 50K by TUTOR-2 for first-ever cycle only)
    450_000,        // P1→P2:  ~7 min (was 1.2M; sim showed 11.7 min → 40% slow. Rebalanced for post-momentum start)
    1_000_000,      // P2→P3:  ~8 min (was 1.8M)
    2_000_000,      // P3→P4:  ~9 min (was 2.6M; Polarity unlocked P3)
    3_500_000,      // P4→P5:  ~10 min (was 3.8M; Focus L2 unlocked P4)
    5_000_000,      // P5→P6:  ~11 min (was 5.5M; Archetype chosen P5)
    7_500_000,      // P6→P7:  ~12 min (was 8M)
    11_000_000,     // P7→P8:  ~13 min (was 11M; Mutations unlocked P7)
    16_000_000,     // P8→P9:  ~14 min (was 15M)
    35_000_000,     // P9→P10: ~15 min (was 20M; sim showed 8 min → 50% fast. Era 2 gate — player must earn it)
    65_000_000,     // P10→P11: ~16 min (was 30M; Pathways + Integradora + Tier P10 upgrades = big ceiling jump)
    95_000_000,     // P11→P12: ~17 min (was 42M)
    135_000_000,    // P12→P13: ~18 min (was 55M)
    180_000_000,    // P13→P14: ~19 min (was 70M; Resonance currency unlocked P13)
    250_000_000,    // P14→P15: ~20 min (was 90M; Broca region P14)
    340_000_000,    // P15→P16: ~21 min (was 115M; Micro-challenges unlocked P15)
    450_000_000,    // P16→P17: ~22 min (was 145M)
    580_000_000,    // P17→P18: ~22 min (was 180M; Personal Best visible P17)
    800_000_000,    // P18→P19: ~24 min (was 230M; sim 5-10 min → 60-80% fast. Era 3 gate — earn it)
    1_100_000_000,  // P19→P20: ~25 min (was 300M; Era 3 starts, First Fracture event)
    1_500_000_000,  // P20→P21: ~27 min (was 380M; countdown visible from here)
    2_000_000_000,  // P21→P22: ~28 min (was 470M; Mirror Cycle event)
    2_800_000_000,  // P22→P23: ~30 min (was 570M; Silent Resonance event)
    3_800_000_000,  // P23→P24: ~32 min (was 700M; Dreamer's Dream event)
    5_200_000_000,  // P24→P25: ~33 min (was 850M; Long Thought event, 45-min auto-prestige cap)
    7_000_000_000,  // P25→P26: ~35 min (was 1.05B; Final Awakening event)
  ],

  // Production
  costMult: 1.28,
  softCapExponent: 0.72,

  // Cascade & Discharge
  cascadeThreshold: 0.75,
  cascadeMultiplier: 2.5,                // Cascada base mult
  dischargeMultiplier: 1.5,              // base, pre-P3
  dischargeMultiplierP3Plus: 2.0,
  chargeIntervalMinutes: 20,

  // Momentum
  momentumBonusSeconds: 30,
  maxMomentumPct: 0.10,                  // CORE-8 cap (second audit 4A-2): momentumBonus capped at 10% of upcoming threshold to prevent late-game trivialization where effectivePPS × 30 would dwarf short-cycle thresholds

  // Focus
  focusFillPerTap: 0.01,                 // 1% per tap base
  insightMultiplier: [3.0, 8.0, 18.0],
  insightDuration: [15, 12, 8],          // seconds

  // Tap thought contribution (TAP-2, §6)
  baseTapThoughtPct: 0.05,               // 5% of effectiveProductionPerSecond per tap (P0 base, replaced by Potencial Sináptico → 0.10)
  baseTapThoughtMin: 1,                  // minimum 1 thought per tap regardless of production (ensures UI-9 feedback works even at P0 with 0.5/sec)
  potencialSinapticoTapPct: 0.10,        // replaces baseTapThoughtPct when owned (not additive)
  sinestesiaTapMult: 0.40,               // Sinestesia Mutation: tap thoughts × 0.4 (i.e. −60%, per §13 #13)

  // Offline
  baseOfflineEfficiency: 0.50,
  baseOfflineCapHours: 4,
  maxOfflineHours: 16,                  // max achievable (REM→8, Distribuida→12, sueno_profundo→16)
  maxOfflineEfficiencyRatio: 2.0,
  offlineMinMinutes: 1,                  // skip calc if <1 min

  // Patterns
  patternsPerPrestige: 3,
  patternCycleBonusPerNode: 0.04,
  patternCycleCap: 1.5,
  patternFlatBonusPerNode: 2,
  patternResetCostResonance: 1000,       // PAT-3
  patternDecisionNodes: [6, 15, 24, 36, 48],

  // Mutations
  mutationPoolSize: 15,
  mutationOptionsPerCycle: 3,            // +1 with Creativa, +1 with Genius Pass

  // Resonance
  resonanceBasePerPrestige: 1,
  resonanceMaxCascadesCount: 3,          // max +3/cycle
  resonanceMaxInsightsCount: 2,          // max +2/cycle
  resonanceFastCycleBonus: 3,
  resonanceFastCycleThresholdMin: 15,

  // Regions
  regionsUnlockPct: 0.01,                // 1% of threshold to trigger first region unlock

  // Spontaneous events
  spontaneousCheckIntervalMin: 240,      // 4 min
  spontaneousCheckIntervalMax: 360,      // 6 min
  spontaneousTriggerChance: 0.40,
  spontaneousWeights: { positive: 0.50, neutral: 0.33, negative: 0.17 },

  // Mental States
  mentalStateFlowTapCount: 10,
  mentalStateFlowWindowMs: 15_000,
  mentalStateFlowDurationMs: 20_000,
  mentalStateDeepIdleMs: 60_000,
  mentalStateDeepMinNeurons: 5,
  mentalStateDeepDurationMs: 90_000,
  mentalStateEurekaInsightCount: 3,
  mentalStateEurekaWindowMs: 120_000,
  mentalStateEurekaDurationMs: 30_000,
  mentalStateDormancyIdleMs: 120_000,
  mentalStateDormancyDurationMs: 300_000,
  mentalStateHyperfocusFocusThreshold: 0.5,
  mentalStateHyperfocusDurationMs: 30_000,

  // Micro-challenges
  microChallengeTriggerPct: 0.30,
  microChallengeCooldownMs: 120_000,
  microChallengeMaxPerCycle: 3,

  // Tap anti-spam (TAP-1, fixed from BUG-K)
  antiSpamTapWindow: 30_000,              // 30s sustain required (was 10s)
  antiSpamTapIntervalMs: 150,             // <150ms avg triggers (was <200ms)
  antiSpamVarianceThreshold: 20,          // std dev < 20ms = machine-like
  antiSpamPenaltyMultiplier: 0.10,

  // Monetization
  maxSparksPurchasedPerMonth: 1000,
  noAdTutorialMinutes: 10,
  minAdCooldownMs: 180_000,               // 3 min
  geniusPassOfferMinIntervalMs: 259_200_000,  // 72h
  geniusPassMaxDismissals: 3,
  starterPackExpiryMs: 172_800_000,       // 48h
  starterPackShownAtPrestige: 2,          // post-P2, not P1 (tonal fix)
  limitedOfferExpiryMs: 172_800_000,

  // Daily login
  dailyLoginRewards: [5, 5, 10, 10, 15, 20, 50],

  // Runtime scheduler
  tickIntervalMs: 100,                    // CODE-4 + §35 TICK-1 step 1: fixed 100ms dt (surfaced Sprint 2 Phase 3.5)

  // Save
  saveIntervalMs: 30_000,                 // 30s auto-save during active

  // UI
  undoToastDurationMs: 3_000,
  undoExpensiveThresholdPct: 0.10,        // >10% of thoughts triggers undo
  splashDurationMs: 2_000,                // UI-9 step 1: 2s branded splash (Sprint 2 kickoff)
  firstOpenTutorialHintIdleMs: 2_000,     // UI-9 step 4: 2s idle → "Tap the neuron" (Sprint 2 kickoff)

  // Version
  gameVersion: '1.0.0',
} as const;
```

---

Continues in Part 3 (sections 32-36)...

# 32. GameState (119 fields, fully enumerated)

**CRITICAL:** This interface must match `DEFAULT_STATE` in `src/store/gameStore.ts` exactly. Consistency test asserts `Object.keys(DEFAULT_STATE).length === 119`.

**Sprint 6.8 re-architecture (2026-04-22):** field count grew 110 → 119 (+9 net) to support the Region redesign. New fields: `memoryShards`, `memoryShardUpgrades`, `activePrecommitment`, `precommitmentStreak`, `mood`, `moodHistory`, `brocaNamedMoments`, `mastery`, `autoBuyConfig`. Derived state (NOT new fields): `visualInsightTier` (from regionsUnlocked + Visual upgrades), stats dashboard (from existing aggregates), precommitmentHistory (from diaryEntries filter), oneiric dreams seen (extend narrativeFragmentsSeen with `dream_*` prefix).

```ts
interface GameState {
  // === Economy (5) ===
  thoughts: number;
  memories: number;
  sparks: number;
  cycleGenerated: number;                       // RESETS on prestige
  totalGenerated: number;                       // NEVER resets

  // === Production cache (2) — productionPerSecond REMOVED (was deprecated, BUG-E fix) ===
  baseProductionPerSecond: number;              // no temporary mods — for offline, discharge
  effectiveProductionPerSecond: number;         // with temporary mods — for UI, tick, tap

  // === Neurons (2) ===
  neurons: NeuronState[];                       // array of 5, one per type
  connectionMult: number;                       // computed from pairs

  // === Focus (5) ===
  focusBar: number;                             // 0.0 to 3.0 (by level)
  focusFillRate: number;                        // computed from upgrades
  insightActive: boolean;
  insightMultiplier: number;
  insightEndTime: number | null;

  // === Discharge (4) ===
  dischargeCharges: number;
  dischargeMaxCharges: number;
  dischargeLastTimestamp: number;
  nextDischargeBonus: number;                   // from Resonancia Acumulada

  // === Upgrades (1) ===
  upgrades: UpgradeState[];

  // === Cycle choices (4) ===
  currentPolarity: Polarity | null;
  currentMutation: MutationActive | null;
  mutationSeed: number;                         // for deterministic pool draws
  currentPathway: Pathway | null;

  // === Offline (2) ===
  currentOfflineCapHours: number;
  currentOfflineEfficiency: number;

  // === Session (1) ===
  sessionStartTimestamp: number | null;

  // === Prestige & progression (11) ===
  prestigeCount: number;
  currentThreshold: number;
  consciousnessBarUnlocked: boolean;
  patterns: PatternNode[];
  totalPatterns: number;
  regionsUnlocked: string[];
  archetype: Archetype | null;
  archetypeHistory: Archetype[];
  cycleStartTimestamp: number;
  firstCycleSnapshot: NeuronSnapshot | null;
  awakeningLog: AwakeningEntry[];

  // === Personal bests (1) ===
  personalBests: Record<number, { minutes: number; rewardGiven: boolean }>;

  // === Resonance (2) ===
  resonance: number;
  resonanceUpgrades: string[];

  // === Spontaneous events (3) ===
  lastSpontaneousCheck: number;                 // absolute timestamp (ms since epoch) of last SPONT-1 check — RESETS
  spontaneousMemoryUsed: boolean;               // RESETS (max 1 Memoria Fugaz/cycle)
  spontaneousInterferenceUsed: boolean;         // RESETS (max 1 Interferencia/cycle)

  // === Pattern decisions (1) ===
  patternDecisions: Record<number, 'A' | 'B'>;  // NEVER resets

  // === Resonant Patterns — Secret Ending (1) ===
  resonantPatternsDiscovered: [boolean, boolean, boolean, boolean]; // NEVER resets

  // === Tutorial + Retention (3) ===
  isTutorialCycle: boolean;                     // true only first cycle ever
  dailyLoginStreak: number;                     // 0-7
  lastDailyClaimDate: string | null;            // 'YYYY-MM-DD'

  // === Session bonuses (3) ===
  momentumBonus: number;                        // thoughts from pre-prestige snapshot
  lastCycleEndProduction: number;               // NEW field: snapshot for CORE-8 (BUG-A fix)
  eurekaExpiry: number | null;                  // Eureka spontaneous event expiry

  // === Active event (1) ===
  activeSpontaneousEvent: SpontaneousEventActive | null;

  // === Run-exclusive upgrades (1) ===
  runUpgradesPurchased: string[];               // NEVER resets

  // === Achievements (6) ===
  achievementsUnlocked: string[];               // NEVER resets
  lifetimeDischarges: number;                   // NEVER resets
  lifetimeInsights: number;                     // NEVER resets
  lifetimePrestiges: number;                    // NEVER resets (for Convergencia, INT-3 fix)
  uniqueMutationsUsed: string[];                // NEVER resets
  uniquePathwaysUsed: string[];                 // NEVER resets

  // === Achievement tracking (5) ===
  personalBestsBeaten: number;                  // NEVER resets (cumulative)
  cycleUpgradesBought: number;                  // RESETS
  cycleCascades: number;                        // RESETS
  cyclePositiveSpontaneous: number;             // RESETS
  cycleNeuronsBought: number;                   // RESETS

  // === Mental States (6) ===
  currentMentalState: string | null;            // RESETS
  mentalStateExpiry: number | null;             // RESETS
  lastTapTimestamps: number[];                  // RESETS — circular buffer size 20
  lastPurchaseTimestamp: number;                // RESETS
  insightTimestamps: number[];                  // RESETS — size 3
  focusAbove50Since: number | null;             // RESETS
  pendingHyperfocusBonus: boolean;              // NEW: INT-9 fix — RESETS

  // === Micro-challenges (3) ===
  activeMicroChallenge: MicroChallenge | null;  // RESETS
  lastMicroChallengeTime: number;               // RESETS
  cycleMicroChallengesAttempted: number;        // NEW: MICRO-2 tracking — RESETS

  // === Resonant Pattern tracking (2) ===
  cycleDischargesUsed: number;                  // NEW: RP-2 tracking — RESETS
  cycleNeuronPurchases: { type: NeuronType; timestamp: number }[];  // NEW: RP-1 tracking — RESETS

  // === Neural Diary (1) ===
  diaryEntries: DiaryEntry[];                   // NEVER resets, max 500

  // === Hipocampo — Memory Shards (2) — Sprint 6.8 re-architecture ===
  memoryShards: { emotional: number; procedural: number; episodic: number }; // PRESERVE (lifetime)
  memoryShardUpgrades: string[];                // PRESERVE (lifetime)

  // === Prefrontal — Pre-commitments (2) — Sprint 6.8 ===
  activePrecommitment: { goalId: string; wager: number } | null; // RESETS (cycle-scoped)
  precommitmentStreak: number;                  // PRESERVE on prestige, RESET on Transcendence

  // === Límbico — Mood (2) — Sprint 6.8 ===
  mood: number;                                 // 0-100, PRESERVE on prestige, RESET to 50 on Transcendence
  moodHistory: { timestamp: number; mood: number }[]; // circular buffer 48, PRESERVE on prestige, RESET on Transcendence

  // === Broca — Named Moments (1) — Sprint 6.8 ===
  brocaNamedMoments: { momentId: string; phrase: string }[]; // PRESERVE (lifetime identity, survives Transcendence)

  // === Mastery — unified lifetime tracking (1) — Sprint 6.8 §38 ===
  mastery: Record<string, number>;              // id → use count, NEVER resets (Mutations + Upgrades + Pathways + Archetypes)

  // === Auto-buy config (1) — Sprint 6.8 QoL pull-in from v1.1 ===
  autoBuyConfig: Record<string, { enabled: boolean; cap: number }>; // per-neuron-type auto-buy, PRESERVE, unlocks P10+

  // === What-if Preview (2) ===
  lastCycleTimes: number[];                     // Circular buffer 3 — PRESERVE on prestige, RESET on transcendence
  lastCycleConfig: { polarity: string; mutation: string; pathway: string } | null;

  // === App infrastructure (2) ===
  notificationPermissionAsked: number;          // 0=never, 1=after P1, 2=after P3
  analyticsConsent: boolean;                    // GDPR

  // === Piggy Bank (2) ===
  piggyBankSparks: number;
  piggyBankBroken: boolean;

  // === Cosmetics — ownership (4) ===
  ownedNeuronSkins: string[];
  ownedCanvasThemes: string[];
  ownedGlowPacks: string[];
  ownedHudStyles: string[];

  // === Cosmetics — equipped (4) ===
  activeNeuronSkin: string | null;
  activeCanvasTheme: string | null;
  activeGlowPack: string | null;
  activeHudStyle: string | null;

  // === Starter Pack + Limited Offers (7) ===
  starterPackPurchased: boolean;
  starterPackDismissed: boolean;
  starterPackExpiresAt: number;
  activeLimitedOffer: LimitedOffer | null;
  purchasedLimitedOffers: string[];
  sparksPurchasedThisMonth: number;
  sparksPurchaseMonthStart: number;

  // === Genius Pass (2) ===
  geniusPassLastOfferTimestamp: number;
  isSubscribed: boolean;

  // === Narrative (2) ===
  narrativeFragmentsSeen: string[];
  eraVisualTheme: 'bioluminescent' | 'digital' | 'cosmic';

  // === Endings (1) ===
  endingsSeen: EndingID[];                      // NEW: track which endings player chose

  // === Transcendence (1) ===
  transcendenceCount: number;                   // NEVER resets

  // === Retention (3) ===
  dailyStreakDays: number;
  lastOpenedDate: string | null;
  weeklyChallenge: WeeklyChallengeState;

  // === Tab badges (1) ===
  tabBadgesDismissed: string[];                 // NEW: UI-3 tracking — PRESERVE

  // === System (2) ===
  lastActiveTimestamp: number;
  gameVersion: string;
}
```

**Field count:** Let's count the sections:
- Economy: 5
- Production cache: 2 (productionPerSecond removed — BUG-E fix)
- Neurons: 2
- Focus: 5
- Discharge: 4
- Upgrades: 1
- Cycle choices: 4
- Offline: 2
- Session: 1
- Prestige & progression: 11
- Personal bests: 1
- Resonance: 2
- Spontaneous events: 3
- Pattern decisions: 1
- Resonant Patterns: 1
- Tutorial + Retention: 3
- Session bonuses: 3 (added `lastCycleEndProduction` — BUG-A fix)
- Active event: 1
- Run-exclusive upgrades: 1
- Achievements: 6
- Achievement tracking: 5
- Mental States: 7 (added `pendingHyperfocusBonus` — INT-9 fix)
- Micro-challenges: 3 (added `cycleMicroChallengesAttempted`)
- Resonant Pattern tracking: 2 (added `cycleDischargesUsed`, `cycleNeuronPurchases` — RP tracking)
- Neural Diary: 1
- What-if Preview: 2
- App infrastructure: 2
- Piggy Bank: 2
- Cosmetics ownership: 4
- Cosmetics equipped: 4
- Starter Pack + Limited: 7
- Genius Pass: 2
- Narrative: 2
- Endings: 1 (added `endingsSeen`)
- Transcendence: 1
- Retention: 3
- Tab badges: 1 (added `tabBadgesDismissed` — UI-3)
- System: 2
- Hipocampo Shards: 2 (Sprint 6.8)
- Prefrontal Pre-commits: 2 (Sprint 6.8)
- Límbico Mood: 2 (Sprint 6.8)
- Broca Named Moments: 1 (Sprint 6.8)
- Mastery: 1 (Sprint 6.8 §38)
- Auto-buy config: 1 (Sprint 6.8 QoL pull-in)

**Total: 119 fields.**

Breakdown verification: 5+2+2+5+4+1+4+2+1+11+1+2+3+1+1+3+3+1+1+6+5+7+3+2+1+2+2+2+4+4+7+2+2+1+1+3+1+2+2+2+2+1+1+1 = 119 ✓

Historical notes:
- Pre-Sprint-6.8: 110 fields after second-audit reconciliation (old docs claimed 105, actual interface had 104 — BUG-D discrepancy. That revision removed 1 deprecated `productionPerSecond` and added 7 fields across bug/gap fixes. Net: 104 − 1 + 7 = 110.)
- **Sprint 6.8 re-architecture (2026-04-22):** +9 fields for Region redesign + Mastery + Auto-buy QoL. Net: 110 + 9 = 119.

### DEFAULT_STATE non-trivial initial values (second audit 2B-1b)

The majority of `DEFAULT_STATE`'s 110 fields initialize to falsy defaults implied by their TypeScript type (0 for numbers, false for booleans, null for `T | null`, [] for arrays, {} for records). These 12 fields have non-falsy initial values (updated Phase 6 Sprint 1 — `insightMultiplier` added, see PROGRESS.md) — Sprint 1 must set them explicitly:

```ts
export function createDefaultState(): GameState {
  return {
    // ... (all 110 fields, most initialized to their falsy default)
    
    // ── Non-trivial initial values (required by various rules) ──
    isTutorialCycle: true,                    // TUTOR-2 (§9): first-ever cycle flag, flips on first prestige
    neurons: [                                 // UI-9: auto-grant 1 Básica on first open
      { type: 'basica', count: 1 },
      { type: 'sensorial', count: 0 },
      { type: 'piramidal', count: 0 },
      { type: 'espejo', count: 0 },
      { type: 'integradora', count: 0 },
    ],
    connectionMult: 1,                         // 1 neuron type at start (no pairs)
    dischargeMaxCharges: 2,                    // §7 base for P0-P9
    insightMultiplier: 1,                      // identity multiplier; matches §33 PRESTIGE_RESET and TICK-1 step 2 exit (added Phase 6 Sprint 1, §32 gap fix)
    focusFillRate: 0.01,                       // base focusFillPerTap (no upgrades yet)
    currentOfflineCapHours: 4,                 // baseOfflineCapHours
    currentOfflineEfficiency: 0.50,            // baseOfflineEfficiency
    eraVisualTheme: 'bioluminescent',          // Era 1 default
    gameVersion: '1.0.0',                      // from SYNAPSE_CONSTANTS.gameVersion
    
    // ── Impure fields populated at mount, NOT in createDefaultState ──
    // cycleStartTimestamp, sessionStartTimestamp, lastActiveTimestamp, 
    // dischargeLastTimestamp — see RNG-1 seed-state discipline + 2B-1c decision:
    //   createDefaultState() stays pure. The store's mount effect sets these to 
    //   `now = Date.now()` as a one-time impure initialization outside the engine.
    //   Engine code never reads these fields without having been passed `nowTimestamp` 
    //   (CODE-9 determinism). On fresh-install first tick, the tick caller supplies 
    //   `nowTimestamp`; engine code does NOT call `Date.now()` itself.
    
    // ── Threshold derived, not stored directly ──
    // currentThreshold is not in DEFAULT_STATE because it derives from isTutorialCycle + 
    // prestigeCount + transcendenceCount via calculateCurrentThreshold(state). The field 
    // IS in GameState (for save round-trip), but default is computed: 
    //   createDefaultState() sets it to 25_000 (tutorial override, matches TUTOR-2; Sprint 3 Phase 7.4b retune — was 50K).
    currentThreshold: 25_000,                  // TUTOR-2: first-ever cycle uses tutorialThreshold
    
    // ── Weekly Challenge initial state ──
    weeklyChallenge: {                         // §25 default — inactive until first Monday crossing
      id: '',
      weekStartTimestamp: 0,
      progress: 0,
      target: 0,
      rewardClaimed: false,
    },
  };
}
```

**Sprint 1 invariant tests for DEFAULT_STATE (beyond the 110-field count):**
```ts
const s = createDefaultState();
expect(s.isTutorialCycle).toBe(true);
expect(s.neurons[0]).toEqual({ type: 'basica', count: 1 });
expect(s.neurons.slice(1).every(n => n.count === 0)).toBe(true);
expect(s.currentThreshold).toBe(25_000);
expect(s.currentOfflineCapHours).toBe(4);
expect(s.currentOfflineEfficiency).toBe(0.50);
expect(s.eraVisualTheme).toBe('bioluminescent');
// Impure fields NOT set by createDefaultState — default to 0 and populated at mount
expect(s.cycleStartTimestamp).toBe(0);
expect(s.sessionStartTimestamp).toBe(null);
expect(s.lastActiveTimestamp).toBe(0);
```

```ts
// Sprint 1 invariant test:
assert(Object.keys(DEFAULT_STATE).length === 110);
```

Constant for runtime verification: `GAMESTATE_FIELD_COUNT: 110` in `config/constants.ts`.

---

# 33. PRESTIGE_RESET (45 fields), PRESTIGE_PRESERVE (60 fields), PRESTIGE_UPDATE (4 fields)

The old docs claimed "83 fields reset" with no enumeration — this was both wrong and unverifiable. This section replaces that with an explicit three-way split that sums to 110 (matching `GameState`).

The reset logic is split into three explicit categories so that each of the 110 `GameState` fields has a documented fate on prestige. Sprint 4a's test suite asserts this split exactly.

### PRESTIGE_RESET (45 fields, each with exact target value)

```ts
export const PRESTIGE_RESET: Partial<GameState> = {
  // Economy (2)
  thoughts: 0,
  cycleGenerated: 0,
  // Production cache (2) — will recalculate immediately
  baseProductionPerSecond: 0,
  effectiveProductionPerSecond: 0,
  // Neurons (2)
  neurons: [
    { type: 'basica', count: 0 },
    { type: 'sensorial', count: 0 },
    { type: 'piramidal', count: 0 },
    { type: 'espejo', count: 0 },
    { type: 'integradora', count: 0 },
  ],
  connectionMult: 1,
  // Focus (5) — note: focusBar handled separately by Focus Persistente logic
  focusBar: 0,                        // OR focusBar × 0.25 if Focus Persistente owned
  focusFillRate: 0,                   // will recalculate from (now empty) upgrades
  insightActive: false,
  insightMultiplier: 1,
  insightEndTime: null,
  // Discharge (4)
  dischargeCharges: 0,
  dischargeMaxCharges: 2,             // base, will recalculate from upgrades (now empty)
  dischargeLastTimestamp: 0,          // set to timestamp param
  nextDischargeBonus: 0,
  // Upgrades (1)
  upgrades: [],                       // empty; all 35 not purchased
  // Cycle choices (4)
  currentPolarity: null,
  currentMutation: null,
  mutationSeed: 0,                    // will be re-seeded when Mutation chosen
  currentPathway: null,
  // Session bonuses (3)
  momentumBonus: 0,                   // calculated from lastCycleEndProduction
  lastCycleEndProduction: 0,          // capture value BEFORE reset, then reset
  eurekaExpiry: null,
  // Active event (1)
  activeSpontaneousEvent: null,
  // Spontaneous events cycle state (3)
  lastSpontaneousCheck: 0,
  spontaneousMemoryUsed: false,
  spontaneousInterferenceUsed: false,
  // Achievement cycle trackers (4)
  cycleUpgradesBought: 0,
  cycleCascades: 0,
  cyclePositiveSpontaneous: 0,
  cycleNeuronsBought: 0,
  // Mental State cycle trackers (7)
  currentMentalState: null,
  mentalStateExpiry: null,
  lastTapTimestamps: [],
  lastPurchaseTimestamp: 0,
  insightTimestamps: [],
  focusAbove50Since: null,
  pendingHyperfocusBonus: false,
  // Micro-challenges (3)
  activeMicroChallenge: null,
  lastMicroChallengeTime: 0,
  cycleMicroChallengesAttempted: 0,
  // Offline (2) — reset to base values, upgrades recalculate on purchase
  currentOfflineCapHours: 4,            // resets to base (OFFLINE-6)
  currentOfflineEfficiency: 0.50,       // resets to base (OFFLINE-1)
  // Resonant Pattern cycle trackers (2)
  cycleDischargesUsed: 0,
  cycleNeuronPurchases: [],
  // Note: cycleStartTimestamp is in PRESTIGE_UPDATE (set to current timestamp param),
  // not reset to 0 — handled separately below.
};
// Total: 45 fields reset to explicit values.
```

### PRESTIGE_PRESERVE (60 fields that pass through unchanged)

```ts
export const PRESTIGE_PRESERVE = [
  // Economy — preserved across cycle
  'memories',                         // Memorias are meta currency
  'sparks',
  'totalGenerated',
  // Prestige & progression — excluding prestigeCount and currentThreshold
  // which go in PRESTIGE_UPDATE below
  'consciousnessBarUnlocked',
  'patterns',                         // pattern tree progress
  'totalPatterns',
  'regionsUnlocked',
  'archetype',                        // Run-persistent
  'archetypeHistory',
  'firstCycleSnapshot',               // first cycle memento
  'awakeningLog',
  // Personal bests
  'personalBests',
  // Resonance
  'resonance',
  'resonanceUpgrades',
  // Pattern decisions
  'patternDecisions',                 // NEVER reset
  // Resonant Patterns
  'resonantPatternsDiscovered',
  // Tutorial + Retention
  // NOTE: isTutorialCycle is NOT in PRESERVE — moved to PRESTIGE_UPDATE (flipped to false on first prestige, TUTOR-2 §9)
  'dailyLoginStreak',
  'lastDailyClaimDate',
  // Run-exclusive upgrades
  'runUpgradesPurchased',
  // Achievements (lifetime)
  'achievementsUnlocked',
  'lifetimeDischarges',
  'lifetimeInsights',
  // NOTE: lifetimePrestiges is NOT here — it's incremented separately (see "Lifetime counter" below)
  'uniqueMutationsUsed',
  'uniquePathwaysUsed',
  'personalBestsBeaten',
  // Neural Diary
  'diaryEntries',
  // What-if Preview
  'lastCycleTimes',                   // circular buffer 3 — append, preserve
  'lastCycleConfig',
  // App infrastructure
  'notificationPermissionAsked',
  'analyticsConsent',
  // Piggy Bank
  'piggyBankSparks',
  'piggyBankBroken',
  // Cosmetics ownership (all 4 ownership arrays)
  'ownedNeuronSkins',
  'ownedCanvasThemes',
  'ownedGlowPacks',
  'ownedHudStyles',
  // Cosmetics equipped (all 4 active slots)
  'activeNeuronSkin',
  'activeCanvasTheme',
  'activeGlowPack',
  'activeHudStyle',
  // Starter Pack + Limited Offers (7)
  'starterPackPurchased',
  'starterPackDismissed',
  'starterPackExpiresAt',
  'activeLimitedOffer',
  'purchasedLimitedOffers',
  'sparksPurchasedThisMonth',
  'sparksPurchaseMonthStart',
  // Genius Pass
  'geniusPassLastOfferTimestamp',
  'isSubscribed',
  // Narrative
  'narrativeFragmentsSeen',
  'eraVisualTheme',                   // only changes at P10 (digital) and P19 (cosmic) thresholds
  // Endings
  'endingsSeen',
  // Transcendence
  'transcendenceCount',
  // Retention
  'dailyStreakDays',
  'lastOpenedDate',
  'weeklyChallenge',
  // Tab badges
  'tabBadgesDismissed',
  // Session
  'sessionStartTimestamp',
  // System
  'lastActiveTimestamp',
  'gameVersion',
] as const;
// Total: 60 fields preserve unchanged.
```

### PRESTIGE_UPDATE (4 fields) — neither reset nor preserved, but recomputed

```ts
// Applied inside handlePrestige after PRESTIGE_RESET:
prestigeCount: state.prestigeCount + 1,
currentThreshold: calculateThreshold(state.prestigeCount + 1, state.transcendenceCount),
cycleStartTimestamp: timestamp,   // timestamp param for new cycle
isTutorialCycle: false,           // TUTOR-2 (§9): one-way flip on first prestige, never re-enables
```

### Lifetime counter (1 field) — incremented separately

```ts
// Applied inside handlePrestige:
lifetimePrestiges: state.lifetimePrestiges + 1,
```

### Field count verification

**45 (reset) + 60 (preserve) + 4 (update) + 1 (lifetime increment) = 110 fields ✓** — matches `GameState` total enumerated in §32.

### Sprint 4a unit tests (replacing the old "83 fields" claim)

```ts
describe('handlePrestige resets state correctly', () => {
  test('resets 45 fields to default values', () => {
    const postPrestige = handlePrestige(fullGameState, 1_000_000);
    PRESTIGE_RESET_FIELDS.forEach(field => {
      expect(postPrestige[field]).toEqual(PRESTIGE_RESET[field]);
    });
  });
  
  test('preserves 60 fields unchanged', () => {
    const before = structuredClone(fullGameState);
    const postPrestige = handlePrestige(fullGameState, 1_000_000);
    PRESTIGE_PRESERVE_FIELDS.forEach(field => {
      expect(postPrestige[field]).toEqual(before[field]);
    });
  });
  
  test('updates 4 fields correctly', () => {
    const postPrestige = handlePrestige(fullGameState, 1_000_000);
    expect(postPrestige.prestigeCount).toBe(fullGameState.prestigeCount + 1);
    expect(postPrestige.currentThreshold).toBe(
      calculateThreshold(fullGameState.prestigeCount + 1, fullGameState.transcendenceCount)
    );
    expect(postPrestige.cycleStartTimestamp).toBe(1_000_000);
    expect(postPrestige.isTutorialCycle).toBe(false);  // TUTOR-2: one-way flip on first prestige
  });
  
  test('increments lifetime counters', () => {
    const postPrestige = handlePrestige(fullGameState, 1_000_000);
    expect(postPrestige.lifetimePrestiges).toBe(fullGameState.lifetimePrestiges + 1);
  });
  
  test('all 110 fields are accounted for', () => {
    const allFields = [
      ...PRESTIGE_RESET_FIELDS,
      ...PRESTIGE_PRESERVE_FIELDS,
      'prestigeCount', 'currentThreshold', 'cycleStartTimestamp', 'isTutorialCycle',  // UPDATE (4)
      'lifetimePrestiges',  // handled specially (increment)
    ];
    const uniqueFields = new Set(allFields);
    expect(uniqueFields.size).toBe(110);
    // Also verify against actual GameState keys:
    const gameStateKeys = Object.keys(defaultGameState());
    expect(gameStateKeys.length).toBe(110);
    expect(new Set(gameStateKeys)).toEqual(uniqueFields);
  });
});
```

---

# 34. TRANSCENDENCE_RESET & TRANSCENDENCE_PRESERVE

### TRANSCENDENCE_RESET — superset of PRESTIGE_RESET + more resets

Includes everything in PRESTIGE_RESET **PLUS** these additional resets:

```ts
export const TRANSCENDENCE_ADDITIONAL_RESET: Partial<GameState> = {
  // Memory meta-currency resets
  memories: 0,
  
  // Archetype resets (re-choose in new Run)
  archetype: null,
  
  // Regions reset
  regionsUnlocked: [],
  
  // Canvas resets to Era 1 look
  eraVisualTheme: 'bioluminescent',
  
  // Prestige count resets (CRITICAL for threshold — TRANS-1)
  prestigeCount: 0,
  
  // Narrative fragments reset (new archetype brings new fragments)
  narrativeFragmentsSeen: [],
  
  // Tutorial cycle stays false (not first-ever cycle)
  // isTutorialCycle: false,  // already false
  
  // First cycle snapshot retaken
  firstCycleSnapshot: null,
  
  // Run-specific cycle config memory
  lastCycleConfig: null,
  lastCycleTimes: [],
  
  // Threshold recalculated from new prestigeCount=0 and incremented transcendenceCount
  // currentThreshold: handled by calculation
};
```

### TRANSCENDENCE_PRESERVE (subset of PRESTIGE_PRESERVE)

These SURVIVE Transcendence:
- `sparks`
- `piggyBankSparks`
- `totalGenerated`
- `resonance`
- `resonanceUpgrades`
- `patterns`
- `totalPatterns`
- `patternDecisions`
- `resonantPatternsDiscovered`
- `personalBests`
- `awakeningLog`
- `archetypeHistory` (+ append current archetype before reset)
- `endingsSeen` (+ append chosen ending)
- `runUpgradesPurchased`
- `achievementsUnlocked`
- `lifetimeDischarges`
- `lifetimeInsights`
- `lifetimePrestiges`
- `uniqueMutationsUsed`
- `uniquePathwaysUsed`
- `personalBestsBeaten`
- `diaryEntries`
- `dailyLoginStreak`
- `lastDailyClaimDate`
- `dailyStreakDays`
- `lastOpenedDate`
- `weeklyChallenge` (carries over — if active challenge, continues)
- `tabBadgesDismissed`
- `notificationPermissionAsked`
- `analyticsConsent`
- `ownedNeuronSkins`, `ownedCanvasThemes`, `ownedGlowPacks`, `ownedHudStyles`
- `activeNeuronSkin`, `activeCanvasTheme`, `activeGlowPack`, `activeHudStyle`
- `starterPackPurchased`, `starterPackDismissed`, `starterPackExpiresAt`, `purchasedLimitedOffers`, `sparksPurchasedThisMonth`, `sparksPurchaseMonthStart` (monetization history never resets)
- `geniusPassLastOfferTimestamp`, `isSubscribed`
- `gameVersion`, `lastActiveTimestamp`, `sessionStartTimestamp`
- `transcendenceCount` → incremented (special case)

### TRANSCENDENCE_UPDATE
```ts
transcendenceCount: state.transcendenceCount + 1,
archetypeHistory: [...state.archetypeHistory, state.archetype!],  // append before null
endingsSeen: [...state.endingsSeen, chosenEnding],                // append
currentThreshold: calculateThreshold(0, state.transcendenceCount + 1),
```

**TRANS rules (updated from older version):**
- **TRANS-1:** `prestigeCount = 0`, `transcendenceCount += 1`, threshold recalculates with new multiplier. **CRITICAL.**
- **TRANS-2 (INT-3 fix):** `Convergencia Sináptica` upgrade uses `lifetimePrestiges` (persistent) not `prestigeCount` (resets). Run 2 player starts with strong Convergencia bonus.
- **TRANS-3:** `runThresholdMult` = `[1.0, 3.5, 6.0, 8.5, 12.0, 15.0]` by transcendenceCount (Run index).
- **TRANS-4:** Archetype choice is Run-specific. Player picks new archetype at P5 of each Run.

---

# 35. All GDD rules (157)

This section consolidates all named rules. Use the ID when referencing in code comments, commit messages, or PROGRESS.md.

*(Due to space, only new/changed rules are expanded here. The complete 157-rule list is preserved in `docs/archive/rules_original.md` for reference. All original rules remain in force unless explicitly superseded below.)*

**TODO for Sprint 11a:** Create `ALL_RULE_IDS` constant (flat array of all 157 rule ID strings) in `src/config/constants.ts`. The Sprint 11a grep script will import this array and verify every ID appears in at least one test file or code comment. Until then, the rule IDs listed below + the originals in archive constitute the full set.

### Rules added this revision

- **PREST-1** *(existing, clarified)*: `handlePrestige()` order: (1) calculate `lastCycleEndProduction` from `effectiveProductionPerSecond`, (2) calculate duration, (3) evaluate personal best at CURRENT `prestigeCount`, (4) trigger Resonant Pattern checks (ALL 4), (5) calculate Resonance gain, (6) calculate Patterns gained, (7) calculate Memories gained, (8) apply PRESTIGE_RESET (45 fields), (9) apply PRESTIGE_UPDATE (prestigeCount += 1, recalc threshold, new cycleStartTimestamp), (10) increment `lifetimePrestiges`, (11) compute `momentumBonus = lastCycleEndProduction × 30` → add to `thoughts` (BUG-A fix).

- **CORE-8** *(BUG-A fix, overrides MOMENT-1; amended by second audit 4A-2)*: Momentum Bonus formula:
  ```ts
  const rawMomentum = lastCycleEndProduction * momentumBonusSeconds;
  const nextThreshold = calculateCurrentThreshold(postPrestigeState);  // already updated to P+1
  const cappedMomentum = Math.min(rawMomentum, nextThreshold * maxMomentumPct);
  thoughts += Math.floor(cappedMomentum);
  ```
  Where `lastCycleEndProduction` is the `effectiveProductionPerSecond` captured at the moment of prestige BEFORE reset (stored in new field). Not `baseProductionPerSecond` (which is ~0 post-reset). The 10% cap (`maxMomentumPct`) prevents late-game trivialization: at Run 3 P20 with PPS ~50M/sec, raw momentum would be 1.5B thoughts; cap clamps this to 10% of the P20→P21 threshold (1.5B × 6.0 = 9B × 0.10 = 900M thoughts), a meaningful but non-trivializing head start. In early game (P1→P2 with PPS ~60/sec), raw momentum is ~1800 thoughts which is well under 10% of 450K (45K cap) — no clamp applies. The cap is self-scaling and invisible until it matters. Animated counter on Awakening screen: "Momentum: +X ⚡ (30s head start)". Resets in transcendence. Deprecates old MOMENT-1.

- **CORE-10** *(consciousness bar visibility, second audit 2B-3)*: `consciousnessBarUnlocked` flips to `true` when `cycleGenerated >= 0.5 × currentThreshold` on any tick. The flag is preserved across prestige (§33 PRESERVE); once a player has seen the consciousness bar, it remains visible in future cycles even at low cycleGenerated. Flipping happens exactly once per cycle (no-op if already true). This rule replaces the deprecated `consciousnessThreshold` constant (which duplicated `baseThresholdTable[0]` and was removed).

- **TICK-1** *(tick order of operations, second audit 2B-5)*: The 100ms game tick is a pure state reducer: `tick(state: GameState, nowTimestamp: number): GameState`. It executes these 12 steps in strict order every tick. Order is enforced by `tests/tick-order.test.ts` (Sprint 1). Violating order breaks determinism (CODE-9) and TEST-5 reproducibility.

  1. **Timestamp advance (informational)** — per-tick `dt` is fixed at 100ms. The engine does NOT store `cycleTime` as a field; it is derived at each use site as `(nowTimestamp - state.cycleStartTimestamp)`. This step is retained in the ordering for 12-step narrative continuity but executes no state mutation. (Audit note: earlier drafts of this rule referenced `state.cycleTime += dt` — that field never existed in §32. Resolution deferred to derivation per the Step 6 Discharge pattern. See PROGRESS.md Phase 5 Sprint 1.)
  2. **Expire temporary modifiers** — in order:
     - If `state.insightActive && state.insightEndTime !== null && nowTimestamp >= state.insightEndTime` → clear Insight (active=false, endTime=null, multiplier=1).
     - If `state.activeSpontaneousEvent !== null && state.activeSpontaneousEvent.endTime !== 0 && nowTimestamp >= state.activeSpontaneousEvent.endTime` → clear event.
     - If `state.currentMentalState !== null` → evaluate MENTAL-4 exit conditions for the active state. If triggered → clear currentMentalState, mentalStateExpiry.
     - If `state.eurekaExpiry !== null && nowTimestamp >= state.eurekaExpiry` → clear (spontaneous "Eureka" consumed or timed out).
     - If `state.pendingHyperfocusBonus && (nowTimestamp - state.mentalStateExpiry > 5000)` → clear the pending bonus (MENTAL-5 5-second window expired without Insight consumption).
  3. **Recalculate production** — pure derivation from current state: `baseProductionPerSecond` and `effectiveProductionPerSecond` per §4 formula. Cached into state fields (so UI reads are constant-time).
  4. **Produce** — `thoughts += effectiveProductionPerSecond × 0.1`; `cycleGenerated += ...`; `totalGenerated += ...`. No rounding in engine — rounding is a UI-layer concern (CODE-9). Piggy Bank accumulation also happens here: every 10K increment of `totalGenerated` → `piggyBankSparks = min(500, +1)`.
  5. **CORE-10 check** — if `!state.consciousnessBarUnlocked && state.cycleGenerated >= 0.5 × state.currentThreshold` → set `consciousnessBarUnlocked = true`. One-time flip per cycle.
  6. **Discharge charge accumulation** — if `nowTimestamp - state.dischargeLastTimestamp >= chargeIntervalMinutes × 60_000` → `dischargeCharges = Math.min(dischargeMaxCharges, dischargeCharges + 1)`, `dischargeLastTimestamp = nowTimestamp`.
  7. **Resonant Pattern window expiry** — if state has an active RP-1 tracking window (`cycleNeuronPurchases[0].timestamp + 120_000 < nowTimestamp`) → purge entries outside the 2-minute window (they can no longer contribute to the "5 types within 2 min" condition). Never evaluates success here — success evaluated at prestige (§22 RP-1).
  8. **Mental State triggers** — evaluate triggers in priority order (Eureka > Flow > Hyperfocus > Deep > Dormancy). Only promote if the new state is higher priority than current, OR current is null. Promotion updates `currentMentalState`, `mentalStateExpiry`, and `focusAbove50Since` as applicable. MENTAL-5 Hyperfocus sets `pendingHyperfocusBonus = true` when consumed by Discharge (handled in the discharge action, not tick).
  9. **Era 3 event activation** — if `state.prestigeCount` in [19, 26] AND no Era 3 event has fired yet for this cycle (tracked via a derived check on `cycleStartTimestamp`) AND `(nowTimestamp - state.cycleStartTimestamp) < 1000` (activate only in first tick of the cycle, where cycle age < 1 second) → fire the Era 3 event for this prestigeCount. Modal opens.
  10. **Spontaneous event trigger** — per SPONT-1 / §8: if `(nowTimestamp - state.lastSpontaneousCheck) / 1000 >= randomInRange(240, 360, hash(state.cycleStartTimestamp + state.lastSpontaneousCheck))` (interval is seconds between checks; divide by 1000 to convert ms → seconds) → update `state.lastSpontaneousCheck = nowTimestamp`; with `spontaneousTriggerChance (0.40)` chance, pick weighted event and apply. Note: `lastSpontaneousCheck` stores an absolute timestamp (ms since epoch), NOT a cycleTime offset. See §32 field comment.
  11. **Micro-challenge trigger** — per MICRO-1/§18: if `state.prestigeCount >= 15` AND no active challenge AND `state.cycleGenerated / state.currentThreshold` just crossed `microChallengeTriggerPct (0.30)` AND cooldown respected AND `cycleMicroChallengesAttempted < microChallengeMaxPerCycle` → trigger new challenge via `hash(cycleStartTimestamp + cycleMicroChallengesAttempted)`.
  12. **Anti-spam TAP-1 evaluation** — only evaluate if `state.lastTapTimestamps.length >= 20` (circular buffer filled) AND `nowTimestamp - state.lastTapTimestamps[0] >= 30_000` (30s sustain). If avg interval <150ms AND stddev <20ms → set an internal anti-spam flag (not a field, re-derived per tick) that reduces tap effectiveness to 10% for the next window. Flag auto-clears when tap pattern normalizes.

  **Not in tick:** save writes (per CODE-6, save only on prestige + background + 30s interval), ad logic, RevenueCat calls, Firebase network calls — all are side-effect actions invoked from store actions, not tick.

- **ECO-1** *(baseThresholdTable is data, not code; second audit 4A-1)*: `baseThresholdTable` is a 26-entry data array representing cycle targets. It may be overridden at runtime by Firebase Remote Config (§Sprint 10 Remote Config overridable constants list). Rebalancing NEVER requires engine code changes — only updates to: (a) `src/config/constants.ts` locally, (b) `tests/consistency.test.ts` if a specific value is asserted, (c) `docs/PROGRESS.md` under "Changes applied". **Pre-launch:** values in §31 are INTERIM, validated only by the node-simulation done during second audit (1 tap/sec, typical kit). **Sprint 8c TEST-5 is the authoritative tuning gate** — run 1000 playthroughs × 27 scenarios (3 tap rates × 3 archetypes × 3 pathways); any cycle time deviation >20% from target requires a new rebalance commit. TEST-5 MUST pass before Sprint 12 store submission.

- **SCHED-1** *(schedule buffer discipline; second audit 5A-1)*: The 21-sprint plan sums to 76 days of sprint work. Two mandatory 2-day buffer windows exist (Buffer 1 after Sprint 4c, Buffer 2 after Sprint 9b), yielding ~80 days end-to-end. Buffer rules:
  1. Buffers are NOT optional — they exist on the critical path.
  2. If a sprint finishes early, the gained time does NOT become leisure; it is reassigned to the next available buffer (or absorbed by a future sprint's slippage).
  3. If a sprint slips, the loss is absorbed by the next buffer, then by the sprint after that (compressed scope), then by the buffer after that, etc. Launch date slips only when both buffers AND one sprint's scope compression have been exhausted.
  4. Buffer 1 primary purpose: prestige integration (Sprints 4a-4c touch 110 fields; integration bugs are common). Secondary: Sprint 9 platform-setup slippage.
  5. Buffer 2 primary purpose: Apple/Google sandbox + review iteration (Sprint 9a-9b). Secondary: Sprint 11b device-specific bug fixes.
  6. Nico documents buffer consumption in PROGRESS.md at the start of the buffer window with: "Buffer N consumed by X (slippage in Sprint Y)".

- **INIT-1** *(mount-time impure field initialization; second audit 2B-1c)*: Four fields in `GameState` are timestamps that represent "real-world time of event X": `cycleStartTimestamp`, `sessionStartTimestamp`, `lastActiveTimestamp`, `dischargeLastTimestamp`. These fields are NOT initialized by `createDefaultState()` (which must stay pure per CODE-9). They default to `0` (or `null` for nullable types) in the pure default. The store's mount effect (React `useEffect` in the root game component) assigns them their real values ONCE on first mount per session:
  ```ts
  const now = Date.now();  // legal HERE only — outside the engine, at the React boundary
  dispatch({ type: 'INIT_SESSION_TIMESTAMPS', nowTimestamp: now });
  // Reducer: populates only if the field is still the default sentinel (0 or null)
  ```
  Rules:
  1. **Pure engine discipline:** engine code (src/engine/*) NEVER calls `Date.now()`. All time inputs come via `nowTimestamp` parameters passed from the store boundary.
  2. **First-tick determinism:** on fresh install, the first tick's `nowTimestamp` becomes the effective `cycleStartTimestamp` for seed derivation. This means fresh-install players DO get distinct seeds (each install mounts at a different real-world moment), while the engine remains pure and testable with mock timestamps.
  3. **Save restore:** if a saved state has non-zero timestamps, the mount effect does NOT overwrite them — only initializes when `cycleStartTimestamp === 0` (fresh install or explicit reset).
  4. **Sprint 1 test:** `createDefaultState()` must return `cycleStartTimestamp === 0` and `sessionStartTimestamp === null` (verifies purity); a separate test must verify that the mount effect populates them from a passed `nowTimestamp` param (verifies the React boundary).

- **ANALYTICS-5** *(analytics event-name stability; second audit 7A-1)*: Event names in §27 are the canonical source. Sprint 9b, Sprint 10, Firebase dashboard configuration, and any consistency test MUST use the exact names as written in §27. No aliases, no synonyms, no convention changes (e.g., `iap_purchase` is NOT a synonym for `spark_pack_purchased` — they're different events with different semantics). Adding a new analytics event requires (a) adding it to §27 with its category + params, (b) updating the total count in §27 heading, (c) adding a consistency test assertion. Removing an event requires updating Firebase dashboard queries. Changing an event name is a breaking change that requires a migration note in PROGRESS.md.

- **MONEY-10** *(Piggy Bank cap UX; second audit 7A-3)*: When `piggyBankSparks === 500`, display a non-intrusive HUD chip near the Sparks counter: `"🐷 Piggy Bank full — tap to break ($0.99)"`. Tapping opens the standard claim modal. Chip auto-dismisses on claim OR on next prestige. Cap is hard-enforced via `piggyBankSparks = Math.min(500, current + 1)` in TICK-1 step 4 — no overflow counter, no progress lost from player perspective (just no further accumulation). No v1.0 analytics event for cap-reached (deferred to v1.1 if data shows low conversion at cap). This rule exists specifically to ensure the player is aware they've hit the cap — silent capping would eliminate Piggy Bank conversion opportunities.

- **TRANS-2** *(INT-3 fix)*: Convergencia Sináptica uses `lifetimePrestiges` not `prestigeCount`. Formula: +1.5% per lifetime prestige, max +40%.

- **MUT-3** *(INT-6 fix)*: First cycle of any Run (`prestigeCount === 0`) filters out Déjà Vu, Neuroplasticidad, and any Mutation referencing "previous cycle" state.

- **MUT-4** *(INT-10 fix)*: Weekly Challenge targeting neuron type X filters out Especialización Mutation options that don't choose type X.

- **MENTAL-5** *(INT-9 fix)*: Hyperfocus + Discharge — pending bonus stored in `pendingHyperfocusBonus`, consumed by next Insight within 5 seconds.

- **MENTAL-6** *(INT-7 fix)*: "Eureka Rush" Mental State displays as "Flujo Eureka" in UI. Stacks visually with "Eureka" Spontaneous Event when both active.

- **OFFLINE-7** *(BUG-03 fix)*: If offline filled `cycleGenerated` to 100% AND `nextDischargeBonus > 0`, show Sleep screen banner: "Your mind awakened. You have 1 enhanced Discharge before Awakening — use it?" Options: use or skip.

- **RP-1 through RP-4** *(GAP-5 fix)*: Resonant Patterns fully specified. See §22.

- **ERA3-1 through ERA3-3** *(GAP-8 fix)*: Era 3 events fully specified. See §23.

- **WKLY-1, WKLY-2, WKLY-3** *(CORE-9 expanded, INT-10)*: Weekly Challenge rules. See §25.

- **MICRO-1 through MICRO-4** *(GAP-7 fix)*: Micro-challenges fully specified. See §18.

- **RESON-1, RESON-2, RESON-3** *(GAP-4 fix)*: Resonance system fully specified. See §15.

- **PATH-1, PATH-2** *(GAP-2 fix)*: Pathways fully specified. See §14.

- **TAP-1** *(BUG-K fix)*: Anti-spam refined. 30s sustain (was 10s). <150ms avg AND variance <20ms required (was <200ms avg only). Prevents false positives on fast legitimate play.

- **SPONT-1** *(spec gap fix)*: Spontaneous event seed = `hash(cycleStartTimestamp + lastSpontaneousCheck)`. Deterministic per CODE-9.

- **MIG-1** *(cloud conflict merge)*: On cloud/local save conflict, merge strategy: (1) `totalGenerated`: MAX. (2) `sparks`, `piggyBankSparks`: MAX. (3) `ownedNeuronSkins`, `ownedCanvasThemes`, `ownedGlowPacks`, `ownedHudStyles`: UNION. (4) `starterPackPurchased`, `purchasedLimitedOffers`, `runUpgradesPurchased`, `achievementsUnlocked`, `resonantPatternsDiscovered`: UNION/OR. (5) `isSubscribed`: TRUE if either (RevenueCat authoritative). (6) Everything else: from save with higher `totalGenerated`. (7) Equal `totalGenerated` + different states: default to local with toast "Cloud save available in Settings". Full conflict UI deferred to v1.1.

- **UI-7** *(INT-11 explicit note)*: 3-way choice stack variance ~40% is BY DESIGN. Balanced by Run re-choice.

### Rules deprecated

- **MOMENT-1** — superseded by CORE-8 (BUG-A fix).
- **INTER-03** (in old GDD audit) — contained contradiction with TRANS-1; replaced by TRANS-2 which uses `lifetimePrestiges`.
- **CODE-4** subrule "productionPerSecond cache" — field removed (BUG-E fix). Use `baseProductionPerSecond` and `effectiveProductionPerSecond` separately.

---

# 36. Audit — edge cases, bugs, exploits (all resolved)

Both the original 15-issue audit (Categories 1-7) AND the senior review (11 bugs + 9 spec gaps + 8 interactions) have been consolidated and resolved. Summary:

### Resolved (total: 43 issues)

**Original audit (15):**
- BUG-01 through BUG-12: all addressed in rules CORE-6, PREST-1, OFFLINE-7, updated focus rules, etc.
- EXPLOIT-01 through EXPLOIT-04: OFFLINE-5 (time anomaly), OFFLINE-4 (efficiency cap), TAP-1 (anti-spam).
- INTER-01 through INTER-04: PATH-1 (balanced), MUT-1 (affectsOffline), TRANS-2 (lifetimePrestiges), CORE-6 (recalculate).
- UX-01 through UX-04: CYCLE-1 (unified modal), UX-02 (threshold estimate), WKLY-2 (tooltip), CODE-6 (migrateState).
- CATEGORY 7: CORE-6, OFFLINE-4, OFFLINE-5, MUT-2, COST-1, TAP-1, PREST-1 — all in force.

**Senior review bugs (11):**
- BUG-A (Momentum formula): CORE-8 overrides MOMENT-1, adds `lastCycleEndProduction` field.
- BUG-B (Transcendence prestigeCount): TRANS-1 authoritative, INTER-03 deprecated, Convergencia uses `lifetimePrestiges` (TRANS-2).
- BUG-C (PRESTIGE_RESET underspec): enumerated explicitly in §33. 45/61/3/1 split.
- BUG-D (field count): corrected to 110 fields. Sprint 1 test asserts `Object.keys(DEFAULT_STATE).length === 110`.
- BUG-E (productionPerSecond deprecated): field removed, interface uses `baseProductionPerSecond` + `effectiveProductionPerSecond` only.
- BUG-F (efficiency naming): constant renamed `maxOfflineEfficiencyRatio: 2.0` for clarity.
- BUG-G, BUG-H, BUG-I, BUG-J (undefined types): all types defined in §30.
- BUG-K (anti-spam false positives): TAP-1 refined.

**Senior review spec gaps (9):**
- GAP-1 (Archetypes): fully specified, §12.
- GAP-2 (Pathways): fully specified, §14.
- GAP-3 (Run-exclusive upgrades): reduced from 6 to 4 for v1.0 (+2 in post-launch), §21.
- GAP-4 (Resonance upgrades): 8-upgrade pool across 3 tiers, §15.
- GAP-5 (Resonant Patterns): 4 conditions specified, §22.
- GAP-6 (Mental States): full triggers/effects/durations, §17.
- GAP-7 (Micro-challenges): 8 specified, §18.
- GAP-8 (Era 3 events): 8 specified, §23.
- GAP-9 (Regions): 5 regions clarified with unlock timing, §16.

**Senior review interactions (8):**
- INT-5 (Decision 4 balance): rebalanced with pre-P13 fallback value.
- INT-6 (Déjà Vu + Transcendence): MUT-3 filters on `prestigeCount === 0`.
- INT-7 (Eureka naming): MENTAL-6 renames to "Flujo Eureka".
- INT-8 (Meditación + offline): explicit rule — Meditación affects idle only, NOT offline.
- INT-9 (Hyperfocus + Discharge): MENTAL-5 adds `pendingHyperfocusBonus` field.
- INT-10 (Especialización + Challenge): MUT-4 filters Mutation options.
- INT-11 (3-way stack variance): UI-7 marks as by design.
- INT-12 (Cascade Chorus RP): RP-4 requires NOT owning Cascada Profunda upgrade.

**Status:** 0 open issues. Ready for Sprint 1.

---

# 37. Onboarding & Tutorial Track — Sprint 6.8 addition

**Rationale:** The original v1.0 tutorial is 2 hints across 8 minutes (first-idle "tap the neuron" prompt + Discharge ×3 boost). For a 29-hour completionist game, this under-teaches critical mechanics. New players who don't understand Discharge+Cascade or Polarity in the first session drop before Run 2. Sprint 6.8 ships a **5-cycle progressive tutorial track** that introduces one new mechanical concept per cycle with dismissable tooltips + small Sparks rewards.

## 37.1 Tutorial cycles

| Cycle | New concept revealed | UI surfaces |
|---|---|---|
| **1** (P0 → P1) | Tap + Consciousness bar | Minimal HUD (Thoughts counter + Consciousness bar only) |
| **2** (P1 → P2) | Upgrades tab + Sensoriales unlock + Sparks counter | Upgrades tab becomes active; +2 Sparks rewarded |
| **3** (P2 → P3) | Focus bar + Discharge button + Cascade hint | Focus bar + Discharge charges visible; Cascade teaser on first Cascade-possible moment |
| **4** (P3 → P4) | Polarity (first real cycle-choice) | CycleSetupScreen 1-column |
| **5** (P4 → P5) | Patterns tab + Hipocampo region (Shard drip begins) | Mind tab + Regions tab both active |

After Cycle 5, the tutorial track dismisses and progressive disclosure continues via §9 era-milestones (P5 Prefrontal+Límbico, P7 Archetype, etc.).

## 37.2 Rules

- **TUTOR-3:** Tutorial hints are dismissable (tap anywhere to fade after 3s). Never blocking.
- **TUTOR-4:** Each tutorial step completion fires analytics `tutorial_step_completed` with `{cycle: 1..5, step_id}`.
- **TUTOR-5:** Completing a tutorial step grants +2 Sparks (`tutorialSparksRewardPerStep` constant) — first dopamine hits that establish the reward loop.

## 37.3 Returning-player context

After a 30+ min absence, a Broca-voiced greeting prefaces the Sleep screen (per §16.5 + §39 Inner Voice engine). This isn't part of the tutorial track — it's a retention hook. See OFFLINE-10 (§19).

---

# 38. Mastery System — Sprint 6.8 addition

**Rationale:** 15 Mutations exist but TEST-5 simulation shows players default to 2-3 favorites (Hiperestimulación, Déjà Vu, Meditación dominate; Sinestesia / Especialización / Memoria Frágil see <5% use). Same pattern holds for Upgrades (players buy Dopamina / Potencial Sináptico every Run, skip others). Sprint 6.8's Mastery system nudges variety by rewarding lifetime use — PULLED FROM v1.5 POSTLAUNCH ("Upgrade Mastery +1% per lifetime purchase") and unified with B5 Mutation Mastery into a single cross-system mechanic.

## 38.1 Scope

Mastery applies to 4 entity classes:
- **Mutations** — each of 15 tracks lifetime use (cycles played with that Mutation)
- **Upgrades** — each of 33 tracks lifetime purchase count (across all Runs)
- **Pathways** — each of 3 tracks lifetime cycle count
- **Archetypes** — each of 3 tracks lifetime Run count (+1 per full Run completed in that archetype)

Total trackable entities: 15 + 33 + 3 + 3 = **54**. Storage: `mastery: Record<string, number>` (single field).

## 38.2 Rules

- **MASTERY-1:** Mastery level = `floor(uses / 1)` for first 10 uses. Caps at level 10 (no gain past that). Constants: `masteryMaxLevel = 10`, `masteryBonusPerLevel = 0.005`.
- **MASTERY-2:** Each Mastery level grants +0.5% to that entity's effectiveness. Max bonus per entity = +5% at level 10. Bonus applies multiplicatively:
  - Mutation Mastery → multiplies Mutation effect strength (e.g. Hiperestimulación L10 → ×2.10 instead of ×2.00)
  - Upgrade Mastery → multiplies upgrade effect (e.g. Dopamina L10 → ×1.575 instead of ×1.50)
  - Pathway Mastery → multiplies Pathway bonus
  - Archetype Mastery → multiplies archetype bonus

## 38.3 UI surface

`Mind → Mastery` sub-tab — added in Sprint 7.7:
- 4 section tabs (Mutations / Upgrades / Pathways / Archetypes)
- Each entity card shows: name + current use count + level (0-10) + next-level preview
- Locked/never-used entities show as `???` with a small "Use once to reveal" hint

## 38.4 Interactions

- **With shard upgrade `shard_proc_mastery`:** Mastery XP gain ×1.25 (accelerates mastery accumulation).
- **With Resonance upgrade `eternal_witness` (pulled v1.5):** Player picks a SECONDARY archetype per cycle at 50% bonus strength. The secondary archetype's use count DOES contribute to its Mastery (encourages dual-archetype variety).
- **Persistence:** Mastery survives PRESTIGE AND TRANSCENDENCE (it's lifetime).
- **Analytics:** `mastery_level_up` event fires at each level-up with `{entity_id, new_level}`.

---

# 39. Inner Voice Engine — Sprint 6.8 addition

**Rationale:** Multiple narrative-persistence mechanisms were overlapping: Broca Named Moments (new), Oneiric Dreams (v1.5 proposal), Mood-gated returning greetings (B7), Cross-Run memory fragments (B10). Unifying them into ONE engine avoids code duplication and creates a cohesive player-voice surface spanning Broca + dreams + greetings.

## 39.1 Engine scope

The Inner Voice engine handles all player-voiced or player-named narrative payloads:

1. **Named Moments (5 per Run)** — Broca-driven per §16.5. Player picks/writes phrases at key points.
2. **Oneiric Dreams (5 in v1.0, 25 more v1.5+)** — Short narrative beats shown on offline return. Originally v1.5 POSTLAUNCH content; pulled to v1.0 as 5 seed dreams.
3. **Mood-gated Returning Greetings** — Broca speaks when player returns after ≥30 min absence, tone varying by current Mood tier.
4. **Cross-Run Memory Fragments** — At each new Run's P5 (when Archetype choice would have been, now migrated to P7 — so this slot is freed), Broca speaks in the voice of the player's PRIOR Run's archetype.
5. **Integrated Mind Secret Beat** — "Your mind is whole" one-time narrative beat at 5-region active tier.

## 39.2 Data model

All Inner Voice content flows through existing `narrativeFragmentsSeen: string[]` field (no new GameState field needed). Fragment ID prefixes:
- `voice_*` — Named Moment authored phrases (e.g. `voice_first_prestige`)
- `dream_*` — Oneiric dream payloads (e.g. `dream_empathic_01`)
- `greeting_*` — Returning greetings (e.g. `greeting_euphoric_01`)
- `crossrun_*` — Cross-Run memory fragments (e.g. `crossrun_from_analitica`)
- `integrated_mind_whole` — single ID for the 5-region beat

Named phrases themselves stored in `brocaNamedMoments: { momentId; phrase }[]`. Prose templates with `{playerPhrase}` placeholders rendered at display time.

## 39.3 v1.0 content counts

| Type | v1.0 count | Storage |
|---|---|---|
| Named Moments | 5 slots × 3 prose templates each = 15 template variants | `src/config/narrative/namedMoments.ts` |
| Oneiric Dreams | 5 dreams (1 per Archetype + 1 per Polarity + 1 Era 3) | `src/config/narrative/dreams.ts` |
| Mood-gated Greetings | 5 variants (one per Mood tier) | `src/config/narrative/greetings.ts` |
| Cross-Run Fragments | 3 (one per archetype-as-prior-voice) | `src/config/narrative/crossRun.ts` |
| Integrated Mind | 1 | existing `fragments.ts` |

Total v1.0 Inner Voice content: **29 narrative payloads**. See NARRATIVE.md §10-14 for the actual prose.

## 39.4 Rules

- **VOICE-1:** Named phrases persist across Transcendence (lifetime identity). Skip always valid — default archetype-keyed phrase used.
- **VOICE-2:** Greetings fire once per return session. If player returns twice within 10 min, second return skips the greeting.
- **VOICE-3:** Dreams fire on offline ≥30 min with one weighted per archetype-fit. Pool expands v1.5.
- **VOICE-4:** Cross-Run fragments fire at each new Run's P5 — only if `archetypeHistory` has ≥1 prior archetype. First Run skips.
- **VOICE-5:** Integrated Mind beat fires ONCE per Run when 5 regions activate simultaneously. Stored as `integrated_mind_whole` in `narrativeFragmentsSeen`.

---

# End of GDD.md

For sprint plan and checklists, see `docs/SPRINTS.md`.  
For narrative content (fragments, echoes, endings), see `docs/NARRATIVE.md`.  
For v1.5+ post-launch content, see `docs/POSTLAUNCH.md`.  
For session continuity, see `docs/PROGRESS.md`.  
For visual mockups, see `docs/UI_MOCKUPS.html`.

