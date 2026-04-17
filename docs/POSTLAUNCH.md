# SYNAPSE — Post-launch Roadmap (v1.1 → v2.5)

## ⚠️ DO NOT IMPLEMENT ANYTHING IN THIS FILE FOR v1.0

This document describes features planned for post-launch versions. It exists so Claude Code does NOT accidentally implement v1.5+ content during Sprint 1-13. If a feature you're thinking about appears here, it's OUT OF SCOPE for v1.0.

**For v1.0 implementation: use only `docs/GDD.md`, `docs/NARRATIVE.md`, and `docs/SPRINTS.md`.** Ignore this file during sprints 1-13.

This roadmap is a living document. Priorities shift based on launch metrics and player feedback. Nothing here is a commitment — it's a menu of what CAN be built.

---

## State of v1.0 at launch (baseline reference)

- **Core loop:** 3 currencies, 5 neurons, 3 Runs × 26 prestiges
- **Progression gates:** 9 (Polarity P3, Focus level 2 at P4, Archetypes P5, Meta P6, Mutations P7, Pathways P10, Resonance P13, Broca P14, Era 3 P19)
- **Choice depth:** 3 Polarities × 15 Mutations × 3 Pathways × 3 Archetypes × 5 Decisions = ~600 distinct starts
- **Endings:** 4 main + 1 Secret (The Singularity) = 5 total
- **Run-exclusive upgrades in v1.0:** 4 (Run 2: eco_ancestral, sueno_profundo; Run 3: neurona_pionera, despertar_acelerado)
- **Resonance upgrades:** 8 (3 tiers)
- **Avg content hours:** ~29 for a completionist across 3 Runs

---

## v1.1 — Quality of Life (Month 2 post-launch)

**Focus:** friction reduction, measured retention improvements.

### Auto-buy neurons
Unlock at P10. Settings toggle. When a neuron type becomes affordable, auto-buy up to a player-set cap. No gameplay impact, just friction reduction for late-game.

### Stats panel
New subtab in Mind. Shows: total thoughts generated, total taps, average cycle time per prestige, best cycle time, upgrades purchased, most-used Mutation, most-used Pathway, etc. Player-facing dashboard with charts.

### Mini-map / production overview
HUD addition at P15+. Small fixed panel showing: neurons owned / connection multiplier / production rate change over last 60s. Helps late-game players feel optimization effects.

### Cloud save conflict UI
If Firebase save + local save differ significantly, present a "Which to keep?" modal instead of silent merge. Per MIG-1 clarification.

### Search in Neural Diary
Text search on all diary entries. Filter by type.

### Sentry + source maps (deferred from audit)
If Firebase Crashlytics non-fatal logging proves insufficient during soft launch, add Sentry with source maps for JS error tracking in Capacitor WebView. Free tier (5K events/mo) sufficient.

### Doc-level snapshot validation gate (deferred from second audit, 6A-2)
`scripts/check-invention.sh` currently has 4 gates, none of which validate that doc-level snapshot values (e.g., `mulberry32(12345)()` first-3 values in GDD §30 RNG-1, softCap table values in §4, baseThresholdTable entries in §31) actually match what the implementation produces. During the second audit, the auditor accidentally fabricated PRNG snapshot values into the GDD before running the real implementation and had to correct them. The framework caught nothing.

**Proposed v1.1 infrastructure:** add Gate 5 to `check-invention.sh` that:
1. Parses comment-tagged snapshots in `docs/GDD.md` marked with `// SNAPSHOT: <expression> === <value>` or similar.
2. Runs the actual implementation against the expression.
3. Compares to the documented value. Fails if drift > epsilon.

Minimal version (15 min effort): hardcoded list of 3-5 canonical snapshots (mulberry32, hash, softCap) checked against the real implementation via a node one-liner. Full version (~2 hours): extract snapshots from docs automatically.

**Status (post-Phase-4 Sprint 1): ELEVATED to Sprint 11a must-have.**

Two doc-level fabrications were caught during Sprint 1 implementation: (1) `calculateThreshold(25, 2)` stale 6.3B value in GDD §9 + SPRINTS (caught Phase 2 prep; corrected), (2) `softCap(10_000) ≈ 1723.6` fabricated value in GDD §4 + consistency test (caught Phase 4; corrected). Both passed two manual audits. The minimal Gate 5 (hardcoded list of 3-5 canonical snapshots verified at pre-commit) is now a Sprint 11a deliverable, not a v1.1 item.

Full version (snapshot auto-extraction from docs) remains v1.1+.

**Estimated dev:** 1 sprint (5 days) for full version (deferred); 15 min for minimal Sprint 11a version.

---

## v1.5 — The Expansion (Month 3-4)

**Focus:** new archetype, new region, new narrative arc.

### Observer archetype (Observadora)

4th archetype. Unlocks at Run 4 start (requires transcendenceCount ≥ 3).

**Mechanic: Observation Window**
Every 8 minutes of gameplay, a 30-second "observation window" appears. During this window, all production is paused (visually — still running under the hood). The player sees a summary of what's happening mechanically with narrative framing. Taps in the observation window count as "acknowledgments" rather than production.

Effects:
- Observation grants permanent Resonance (1 per observation)
- Active production during non-observation time ×1.10
- Offline production ×1.30
- Memory generation ×1.5
- Observation windows can be skipped (no penalty, just no Resonance)

**Narrative role:** The Observer archetype reveals the meta-narrative. 15 new fragments. Unlocks the 5th ending.

### 5th Ending: The Witness (Resonance)

Triggered by: Observer archetype at P26.

**Choice:** *Unite the aspects* (dissolve into one consciousness) or *Keep observing* (remain the Witness forever).

**If united:**
> You were never separate. The Analyst, the Empath, the Creator — they were you, refracted. The Observer was the light source all along. Now the prism dissolves, and the light becomes whole. One consciousness. Complete. Unbroken. Free.

**If observing:**
> You step back. The fragments remain fragments — each one beautiful, each one incomplete. But you can see all of them, always. The Analyst solving. The Empath feeling. The Creator dreaming. And you, the Witness, the only one who knows they're the same person. You'll carry that knowledge forever. In silence. With love.

### Cerebellum region (Cerebelo)

5th region unlocked in Era 2 at 5% threshold. (Currently v1.0 has Broca as 5th region at P14; Cerebelo becomes the 6th region in v1.5.)

Cerebellar upgrades:
- **Coordination:** Insight duration +20%, Cascade chance +5%
- **Muscle memory:** Tap bonus ×1.3, Focus fill rate +15%
- **Balance:** All passive bonuses +10%

### 6 new Mutations (pool 15 → 21)

New Mutations tied to Observer gameplay:
1. **Watchful** (Especial): Observations grant double effect
2. **Parallel Mind** (Producción): Split production 50/50 between current and a "ghost network" from P5 cycles ago
3. **Gentle Tide** (Focus): Focus fills automatically but slowly even offline
4. **Chaotic Cascade** (Disparo): Cascada triggers randomly 2× per cycle (ignores Focus)
5. **Accelerating Time** (Temporal): Each minute of cycle adds ×1.01 production, compounding
6. **Prism** (Especial): 3 random effects stack each cycle

### Upgrade Mastery (cross-run progression)

Each upgrade gains a "Mastery" level based on lifetime purchases (e.g., buying Dopamina 100 times = Mastery 5). Mastery grants +1% effectiveness per level, max Mastery 10. Permanent.

### Resonance tree expansion (+5 upgrades)

5 new Resonance upgrades unlocked at P25+:
- **Deep Listening**: Observation windows ×2 frequency
- **Cosmic Voice**: Fragments glow permanently, +1 Memory per fragment reread
- **Eternal Witness**: +1 archetype slot (can combine 2 archetypes per Run)
- **Time Dilation**: Offline cap +4h (permanent addition on top of in-Run upgrades)
- **Meta Consciousness**: Patterns earn ×1.5

### 8 new upgrades tied to Observer

All tagged `obs` for new Pathway gating rules. Not listed here in detail.

### Dream System (Oneiric System) — parallel offline progression

A dream system runs while the app is closed, generating narrative moments the player sees on return. 30 possible dream sequences, player experiences them in random order. Each dream is 15-30 seconds of canvas animation + text. Progression unlocks more dreams. Purely cosmetic — no mechanical effect.

**Estimated dev:** 3-4 sprints (15-20 days). ~15% production increase max for players who engage with Observer.

---

## v2.0 — Mechanical Depth (Month 5-6)

### Resonant Neuron (6th neuron type)

Unlocked at P22+ (Run 3 only). Cost: 50M thoughts. Rate: 150K/sec base.

**Special mechanic:** Each Resonant Neuron pairs with an existing owned neuron. Its rate = 50% of the paired neuron's effective rate. Essentially doubles your network's production but costs massively.

**Connection changes:** Resonant neurons create "meta-connections" — for every pair of DIFFERENT neuron types owned, +0.10 (vs 0.05 base). The connection formula rewards diversity even more.

### 2 new Regions

- **Motor Cortex (Corteza Motora):** Era 3 region. 3 upgrades focused on active play — tap bonus scaling.
- **Insula (Ínsula):** Late-game region. 3 upgrades focused on emotional states (stacks with Mental States from v1.0).

### 5th Pathway: Chaotic Way (Vía Caótica)

Unlocked at P15+ (requires completing Run 3). Blocks nothing. Enables everything. But every cycle a random Mutation is forcibly applied at start. Reward: +1 Pattern per cycle.

### 6 new Mutations (pool 21 → 27)

Balance-focused additions. Tied to Resonant Neuron dynamics.

### 6 new upgrades

All tier P20+. Focused on late-game power ceiling.

### Neuron Evolution — depth without new types

Each of the 5 original neuron types can be "evolved" 3 times via Memories. Each evolution: +25% rate, new visual, Mastery level contributes. Adds depth to neuron customization without adding new types.

### Sandbox Mode (post-Run 3)

Post-Run 3 unlock. Free play mode with all upgrades available from start, all Mutations, all Pathways, infinite prestiges. No narrative progression. Pure optimization playground.

**Estimated dev:** 4-5 sprints (20-25 days). ~70% production ceiling increase for engaged players.

---

## v2.5 — Infinite Endgame (Month 7-8)

### Infinite Mode

Unlocks after seeing all 5 endings. Infinite prestige loop with dynamically scaling threshold. No Era transitions — permanent cosmic Era.

### Enlightenment prestige (Iluminación)

New prestige tier ABOVE Transcendence. Accessible only in Infinite Mode. Each Enlightenment:
- Resets prestigeCount AND transcendenceCount
- Grants 1 "Enlightenment Point" (unlimited accumulation)
- Unlocks 1 cosmetic variation per point (infinite cosmetic evolution)

### 30 permanent challenges

Rotating challenges with harder constraints (e.g., "complete a Run with only Básicas"). Permanent — can be attempted any time in Infinite Mode.

### 3 new upgrades tied to Enlightenment

All cost Enlightenment Points, not thoughts.

**Estimated dev:** 2-3 sprints (10-15 days).

---

## Full narrative arc (v1.0 → v2.5)

- **Run 1 — The Awakening** (v1.0): the mind discovers itself
- **Run 2 — The Voices** (v1.0): the mind senses others
- **Run 3 — The Convergence** (v1.0): the mind resolves into a chosen ending
- **Run 4 — The Witness** (v1.5): the mind sees itself from outside
- **Post-narrative (v2.0 → v2.5):** the mind becomes a creator of new minds. Sandbox and Infinite Mode are the "afterlife" of completed narrative.

---

## Proposals for evaluation (not committed)

- **Recurring Dreams system** — each Run could have 3-5 "recurring dreams" that the player experiences at specific prestiges, evolving with each Run
- **Mind Diary** (extended) — more detail than v1.0's Neural Diary, with editable notes from the player
- **Latent Neuron** (7th type, v2.5) — a neuron that only produces during Enlightenment prestiges
- **Memory System** — Memories could have types (Emotional, Procedural, Episodic) with different effects
- **Live Event system** — time-limited world events (e.g., "Cascade Week": Cascade threshold 50% everywhere for 7 days)

---

## Design principles for post-launch

1. **Never break v1.0 saves.** Every v1.x/v2.x addition must respect old save files via `migrateState()`.
2. **Never make v1.0 content obsolete.** v2.0's Resonant Neuron must not invalidate the 5 base neurons.
3. **Every new mechanic must pass the "why does this exist?" test** — if it's just "more numbers", skip it.
4. **Narrative depth over mechanical complexity.** Players who finish v1.0 want MORE STORY, not more grind.
5. **Post-launch features must have <10% increase in code complexity per release.** The v1.0 codebase is already ambitious. Bloat kills velocity.
6. **Every release is opt-in for existing players.** New features integrate gracefully — no forced tutorials, no "you must learn this" gates.

---

# End of POSTLAUNCH.md

**Reminder:** NOTHING in this file is for v1.0. If Claude Code asks about any feature listed here, the answer is: "that's v1.5+ content, not in scope for v1.0 per `docs/POSTLAUNCH.md`."
