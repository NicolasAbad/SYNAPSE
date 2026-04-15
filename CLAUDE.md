# SYNAPSE — Neural Evolution Idle Game

## Project Overview
Mobile idle/incremental game. Player evolves a mind from a single neuron to cosmic superintelligence across 3 runs with 26 prestiges each. React + Vite + Zustand + Canvas 2D + Capacitor (iOS/Android) + AdMob + RevenueCat + Firebase.

## Tech Stack — Pinned Versions
```json
"dependencies": {
  "react": "^18.3",
  "zustand": "^4.5",
  "howler": "^2.2",
  "@capacitor/core": "^6.1",
  "@capacitor/app": "^6.0",
  "@capacitor/preferences": "^6.0",
  "@capacitor/haptics": "^6.0",
  "@capacitor/status-bar": "^6.0",
  "@capacitor/keyboard": "^6.0",
  "@capacitor-community/admob": "^6.0",
  "@revenuecat/purchases-capacitor": "^8.0",
  "@capacitor-firebase/analytics": "^6.0",
  "@capacitor-firebase/crashlytics": "^6.0"
}
```
- **Build:** Vite + TypeScript (strict mode)
- **Rendering:** Canvas 2D (NOT SVG, NOT DOM for game area)
- **Orientation:** Portrait only (`capacitor.config.ts: orientation: 'portrait'`)
- **Storage:** Capacitor Preferences (NOT localStorage — survives uninstall)
- **Audio:** Howler.js (unlock AudioContext on first user tap for iOS)

## Documentation (READ BEFORE CODING)
1. `docs/SYNAPSE_GDD_V2_FINAL.html` — All mechanics, constants, 112 rules, GameState
2. `docs/SYNAPSE_NARRATIVE_BIBLE.html` — 57 fragments, 30 echoes, 5 endings (English)
3. `docs/SYNAPSE_QA_IMPLEMENTATION.html` — UI specs, 28 analytics events, audio, files
4. `docs/SYNAPSE_UI_MOCKUPS.html` — 6 screen wireframes
5. `docs/synapse_five_features.py` — 30 achievements, 5 mental states, 8 challenges

## Session Management
- **Read CLAUDE.md at session start.** It's the single source of truth for how to work.
- **Read PROGRESS.md at session start.** It tracks what's done and what's next.
- **Update PROGRESS.md at session end.** List: files created/modified, sprint checklist progress, known issues, next task. This is how we maintain continuity between sessions.
- **Ask before large refactors.** If a task requires changing >10 files, describe the plan first.

---

## CODE RULES (NON-NEGOTIABLE)
**GDD rule IDs for reference:** CODE-1 (zero hardcoding), CODE-2 (file size limits), CODE-3 (sprint DoD), CODE-4 (canvas rules), CODE-5 (mobile rules), CODE-6 (storage), CODE-7 (session continuity), CODE-8 (TypeScript style). See `docs/SYNAPSE_GDD_V2_FINAL.html` CLAUDE.md section for full text.

### Design Philosophy (applies to EVERY decision)
**GDD rule IDs:** PHIL-1 (F2P completes all), PHIL-2 (no content desert), PHIL-3 (respect time), PHIL-4 (choices matter), PHIL-5 (discoverability).
- **F2P completes ALL content.** No paywall. No pay-to-win. Genius Pass = convenience only.
- **No content desert.** New mechanic or event every 1-2 prestiges. Player always has something new.
- **Respect the player's time.** No forced ads. No energy system. No wait timers. Offline never loses a night.
- **Choices matter.** Every prestige has at least one meaningful decision.
- **Every new feature is discoverable.** When ANY new mechanic, tab, or system unlocks: show tab badge "!" or "NEW", pulse highlight, toast, or Awakening screen message. The player must NEVER discover a feature by accident 3 prestiges late. If you add something, ask: "How will the player know this exists?"

### Zero Hardcoding
- Every game number → `config/constants.ts`. No inline `0.75` or `300` in engine/UI code.
- Every player-facing string → `config/strings/en.ts` via `t('key')`. No inline text.
- Every unlock condition → `config/unlocks.ts`. No inline `prestigeCount >= 3`.
- Only exceptions: `0`, `1`, `-1`, `true`, `false`, array indices, CSS values.

### File Discipline
- **Max 200 lines per file.** Split by responsibility if exceeded.
- **Max 50 lines per function.** Extract helpers with descriptive names.
- **Single responsibility.** One file = one purpose. `discharge.ts` ≠ Focus + Cascade.
- **No circular imports.** Flow: `config/ → engine/ → store/ → ui/`. Canvas reads store + config.

### Naming
- Files: `camelCase.ts` / `PascalCase.tsx` (components)
- Constants: `SCREAMING_SNAKE` top-level, `camelCase` nested
- Functions: `camelCase`, verb-first: `calculateProduction`, `handlePrestige`
- Types: `PascalCase`: `GameState`, `NeuronType`, `Achievement`
- Booleans: `is`/`has`/`should` prefix: `isSubscribed`, `hasPatternDecision`
- Event handlers: `handle` prefix: `handleTap`, `handleBuy`, `handleDischarge`
- Callbacks/hooks: `on` prefix: `onPrestigeComplete`, `onOfflineReturn`

### Imports
```typescript
// 1. React + external
import { useState, useCallback } from 'react';
import { Haptics } from '@capacitor/haptics';

// 2. Config
import { CONSTANTS } from '@/config/constants';
import { t } from '@/config/strings/en';

// 3. Engine
import { calculateProduction } from '@/engine/production';

// 4. Store
import { useGameStore } from '@/store/gameStore';

// 5. Components
import { NeuronPanel } from '@/ui/panels/NeuronPanel';

// 6. Types
import type { GameState, NeuronType } from '@/types';
```

### TypeScript Style
- `strict: true` in tsconfig. No `any`. No `// @ts-ignore`.
- Prefer `const` over `let`. Never `var`.
- Prefer `interface` for objects, `type` for unions/intersections.
- Destructure props: `({ neurons, onBuy }: NeuronPanelProps)` not `(props)`.
- Early returns over nested ifs: `if (!condition) return;` then main logic.
- Pure functions in engine/: no side effects, no store access. Receive state, return result.
- Store actions mutate state via Zustand's `set()`. Engine functions NEVER call `set()` directly.

### React Style
- Functional components only. No classes.
- `React.memo()` for all panels and list items (prevent re-renders from tick loop).
- Canvas component does NOT use React rendering — it's a raw `<canvas>` ref with `useEffect`.
- Separate game state subscriptions: `useGameStore(s => s.thoughts)` not `useGameStore()`.
- No `useEffect` for game logic. Game logic lives in engine/, triggered by tick or events.

### Error Handling
- `try/catch` around: storage read/write, ad calls, RevenueCat calls, Firebase calls.
- On storage error: log to analytics, continue with in-memory state.
- On ad error: show toast "Ad not available", grant no reward, no crash.
- On network error: continue offline, retry on next foreground.
- Never `throw` in engine functions. Return error states or null.

### Git Discipline
- Commit after each logical unit: "feat: add discharge system", "fix: cascade focus order"
- One feature per commit. Never commit 5 features in one commit.
- Run `npm run lint` before every commit. Zero warnings.
- Tag each completed sprint: `git tag sprint-1-done`

---

## CANVAS RULES

### Game Loop Architecture
```
┌─ requestAnimationFrame (60fps) ─── renderCanvas() ── visual only
│
└─ setInterval (100ms) ─── gameTick() ── production, timers, state
```
- Render loop: `requestAnimationFrame`. Only draws. No state changes. Reads store.
- Game logic: `setInterval(100)` or accumulator inside rAF with 100ms steps.
- On `document.visibilitychange === 'hidden'`: pause BOTH loops. Save state.
- On `document.visibilitychange === 'visible'`: resume loops, apply offline/catch-up.

### Canvas Retina
```typescript
const dpr = window.devicePixelRatio || 1;
canvas.width = canvas.clientWidth * dpr;
canvas.height = canvas.clientHeight * dpr;
ctx.scale(dpr, dpr);
```
Always. Without this, the game looks blurry on every iPhone.

### Canvas Touch
- Use `touchstart` / `touchend` for taps. NOT `click` (300ms delay).
- CSS on canvas: `touch-action: manipulation;` (disables double-tap zoom).
- Track tap position for potential future features. Ignore multi-touch (use first touch only).

### Canvas Safe Areas
```css
canvas {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}
```
HUD elements must not render under the notch or home indicator.

### Canvas Text Word-Wrap
Canvas2D has no word-wrap. For narrative fragments:
```typescript
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line + (line ? ' ' : '') + word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}
```

### Canvas Performance
- Max 80 visible nodes. If neuronCount > 80, cluster distant ones.
- Glow effect: use `ctx.shadowBlur` sparingly (expensive). Pre-render glow to offscreen canvas.
- Connection lines: skip connections for nodes off-screen.
- Reduced motion mode: disable all animations, show static nodes only.

---

## MOBILE RULES
**GDD rule IDs:** APP-1 (splash), APP-2 (portrait), APP-3 (push permission), APP-4 (privacy/ToS links), APP-5 (GDPR), APP-6 (credits), APP-7 (feedback email), APP-8 (network failure), APP-9 (Firebase fallback), APP-10 (force-close recovery), APP-11 (ad interruption), APP-12 (app switching), APP-13 (deep links v2.0), APP-14 (.env secrets), APP-15 (lint), APP-16 (git strategy), APP-17 (build requirements), APP-18 (Crashlytics), APP-19 (Remote Config), APP-20 (performance targets), APP-21 (soft launch).

### iOS Audio
Howler.js requires AudioContext unlock on iOS. On first user tap:
```typescript
import { Howler } from 'howler';
// Call once on first touchstart:
Howler.ctx?.resume();
```
Do NOT try to play audio before user interaction. It will fail silently.

### Scroll Bounce
```css
html, body { overscroll-behavior: none; overflow: hidden; }
```
Plus in `capacitor.config.ts` for iOS: `scrollEnabled: false`.

### Android Back Button
```typescript
import { App } from '@capacitor/app';
App.addListener('backButton', ({ canGoBack }) => {
  if (isModalOpen) closeModal();
  else App.minimizeApp(); // don't exit, minimize
});
```

### Status Bar
```typescript
import { StatusBar, Style } from '@capacitor/status-bar';
StatusBar.setStyle({ style: Style.Dark });
StatusBar.setBackgroundColor({ color: '#03050C' }); // match game bg
```
Show status bar (player needs to see battery/time). Dark style to match game.

### Keyboard (Reset Input)
```typescript
import { Keyboard } from '@capacitor/keyboard';
Keyboard.addListener('keyboardWillShow', () => {
  // scroll the reset modal into view
});
```

### Floating Point Safety
- Display: always `Math.floor()` for thoughts display. Never show decimals to player.
- Comparison: `cycleGenerated >= threshold - 0.001` (epsilon tolerance for prestige check).
- Format: `formatNumber(Math.floor(value))` everywhere.

### Storage
```typescript
import { Preferences } from '@capacitor/preferences';
// Save:
await Preferences.set({ key: 'gameState', value: JSON.stringify(state) });
// Load:
const { value } = await Preferences.get({ key: 'gameState' });
```
NOT `localStorage`. Capacitor Preferences persists across app updates and reinstalls.

---

## KEY GAME CONSTANTS (quick reference)
Full list in `docs/SYNAPSE_GDD_V2_FINAL.html`. These are the ones Claude Code needs most often:
```
tutorialThreshold:      50_000      // P1 tutorial ~7-8 min
tutorialDischargeMult:  3.0         // ×3 first discharge
consciousnessThreshold: 800_000     // base P0 threshold
costMult:               1.28        // neuron cost scaling
softCap exponent:       0.72        // softCap(x) = 100 * pow(x/100, 0.72)
cascadeThreshold:       0.75        // Focus >= this triggers Cascade
cascadeMult:            2.5         // Cascade discharge multiplier
momentumBonusSeconds:   30          // post-prestige free production
maxOfflineHours:        8           // offline cap (12 with REM)
offlineEfficiency:      0.50        // 50% of base production
runThresholdMult:       [1.0, 3.5, 6.0, 8.5, 12.0, 15.0]
insightMult:            [3.0, 8.0, 18.0]
insightDuration:        [15, 12, 8]
bundleId:               app.synapsegame.mind
```

## APP STORE REQUIREMENTS (CRITICAL — causes rejections if missing)
**GDD rule IDs:** STORE-1 to STORE-11 (store submission), MONEY-1 to MONEY-8 (purchases/revenue), DATA-1 to DATA-4 (user data/privacy), ANALYTICS-3 (conversion funnel).
- **Restore Purchases:** Settings → "Restore Purchases" button. Calls `RevenueCat.restorePurchases()`. Apple REJECTS without this.
- **Subscription terms:** Show price ($4.99/mo), auto-renew, and cancellation instructions BEFORE purchase. Apple REJECTS without this.
- **Price from store, not hardcoded:** Use `product.priceString` from RevenueCat SDK. NEVER write "$4.99" in UI code. Prices come from App Store Connect / Google Play Console. A $0.01 mismatch = automatic rejection.
- **App Tracking Transparency (iOS):** Show ATT prompt BEFORE first ad loads. AdMob requires IDFA. Include `NSUserTrackingUsageDescription` in Info.plist. If user declines: ads still work but lower revenue.
- **Bundle ID:** `app.synapsegame.mind`. Never change after first submission.
- **Version numbering:** CFBundleShortVersionString / versionName = "1.0.0". CFBundleVersion / versionCode = increment each upload.
- **No login required:** Note in App Review Notes: "No login required. Game starts immediately."
- **Android 20 testers:** 20 testers in closed testing for 14 days before production.
- **Commission:** Apple 30% (15% after yr1 or <$1M). Google 15% first $1M, 30% after.
- **Refunds:** Handled by Apple/Google. RevenueCat revokes entitlement automatically. Check on foreground.
- **Tax:** Apple/Google collect tax. Nico completes tax forms in both consoles before first payout.
- See GDD rules STORE-1 through STORE-11, MONEY-1 through MONEY-8, DATA-1 through DATA-4.
- **RevenueCat products (22 total):** genius_pass_weekly, genius_pass_monthly, piggy_bank, piggy_refill, starter_pack, 8× neuron_skin_*, 4× canvas_theme_*, 3× glow_pack_*, hud_style_minimal, 3× spark_pack_*.
- **Conversion funnel (ANALYTICS-3):** app_first_open → first_tap → first_buy → first_discharge → first_prestige → reached_p5 → reached_p10 → first_transcendence → first_purchase. Configure in Sprint 13.
- **Monetization events (ANALYTICS-4):** 11 new events for starter pack, limited offers, cosmetics, spark packs. **Total analytics events: 44.**

---

## VISUAL DEFAULTS
Claude Code should use these unless Nico overrides after review:

### Colors (Canvas)
| Element | Hex | Note |
|---|---|---|
| Background | `#03050C` | Near-black, slight blue |
| Basic neuron | `#4060E0` | Blue |
| Sensory neuron | `#22B07A` | Green |
| Pyramidal neuron | `#8B7FE8` | Purple |
| Mirror neuron | `#E06090` | Pink |
| Integrator neuron | `#40D0D0` | Cyan |
| Connections | `#FFFFFF10` | Very faint white |
| Discharge flash | `#F0A030` | Gold |
| Consciousness bar | `#8B7FE8` | Purple |
| Focus bar | `#40D0D0` | Cyan |

### Canvas Themes — Complete Visual Specs

**3 ERA THEMES (free, unlock by gameplay progression):**

**Bioluminescent (Era 1, P0-P9)** — Default. The mind is being born.
- Background: solid `#03050C` (near-black)
- Subtle animated noise: very faint blue particles drifting upward, opacity 0.03, speed 0.5px/frame
- Neurons: standard colors with `ctx.shadowBlur=12`, `ctx.shadowColor` matching neuron color
- Connections: `#FFFFFF10`, 1px lines
- Feel: dark ocean floor, bioluminescent organisms

**Digital (Era 2, P10-P18)** — The mind is thinking.
- Background: `#060A14` (slightly brighter than Era 1)
- Grid overlay: `#1A2A4A15` lines every 40px, subtle digital grid
- Scan line: horizontal line sweeping top to bottom every 8 seconds, `#40D0D020`, 1px
- Neurons: sharper edges, glow is more white-blue. `shadowColor=#80C0FF`
- Connections: `#40D0D018`, 1px, slight pulse every 2s
- Feel: digital neural network, matrix-like but elegant

**Cosmic (Era 3, P19-P26)** — The mind is transcending.
- Background: radial gradient center `#0A0520` → edge `#030308`
- Star field: 30 white dots at random positions, opacity 0.1-0.3, twinkle via sin(time)
- Nebula wash: very faint purple-pink radial gradient at 5% opacity, slowly rotating
- Neurons: intense glow, `shadowBlur=20`, colors shift slightly with sin(time*0.5)
- Connections: `#8B7FE818`, 1.5px, with faint particle traveling along them
- Feel: deep space, cosmic consciousness

**4 STORE THEMES ($1.99 each, purely cosmetic):**

**Aurora** — Northern lights over your mind.
- Background: `#020A08` (dark green-black)
- Aurora effect: 2 horizontal sine waves at y=30% and y=60% of canvas
  - Wave 1: gradient `#22B07A20` → `#40D0D010`, amplitude 40px, period 200px, speed 0.3px/frame
  - Wave 2: gradient `#4060E015` → `#8B7FE810`, amplitude 30px, period 300px, speed 0.2px/frame
- Neurons: standard colors, glow tinted slightly green
- Connections: `#22B07A12`
- Feel: cold, beautiful, northern night sky

**Deep Ocean** — Your mind sinks into the abyss.
- Background: vertical gradient `#020810` (top) → `#081020` (bottom)
- Caustic light: 3 overlapping sine patterns on top 30% of canvas, `#4060E008`, simulating light through water
- Slow-rising bubbles: 5-8 circles, radius 2-4px, `#FFFFFF06`, drift upward at 0.3px/frame, reset when off-screen
- Neurons: slightly blue-shifted. All glows +20% blue channel
- Connections: `#4060E015`, slightly wavy (offset by sin)
- Feel: deep underwater, pressure, calm darkness

**Nebula** — A mind made of stardust.
- Background: `#0A0510` (dark purple)
- Nebula clouds: 3 large radial gradients at random positions
  - Colors: `#8B7FE808`, `#E0609006`, `#40D0D005`
  - Radius: 150-250px, very soft edges
  - Slow drift: 0.1px/frame in random direction, bounce off edges
- Star field: 20 dots, opacity 0.15, twinkle
- Neurons: purple-shifted glow
- Connections: `#8B7FE815`
- Feel: being inside a nebula, galaxy creation

**Circuit** — The digital twin of your mind.
- Background: `#080C10` (dark gray-blue)
- Circuit board grid: `#1A3A5A10` lines, 30px spacing, with small nodes (3px circles) at intersections
- Data flow: every 3 seconds, a bright dot (`#40D0D060`) travels along one random grid line, 2px, speed 3px/frame
- Neurons: squared glow (box-shadow feel via overlapping rects), more geometric
- Connections: straight lines only (no curves), `#40D0D020`, 2px, right-angle routing
- Feel: printed circuit board, technical blueprint

**2 EXCLUSIVE THEMES (not purchasable in store):**

**Neon Pulse** (Starter Pack exclusive) — Electric energy.
- Background: `#050508` (near-black with warm tint)
- Neon bands: 2 horizontal lines at y=25% and y=75%, `#F0A03015`, 2px, pulsing opacity 0.05-0.15 with sin(time*3)
- Ambient glow: faint orange radial from center, `#F0A03005`
- Neurons: warm-shifted. All glows add +30% red channel. Orange rim around each node.
- Connections: `#F0A03012`, with faint orange pulse traveling along them
- Feel: neon sign, warm electric, arcade vibe

**Genius Gold** (Genius Pass exclusive) — You support this game.
- Background: `#0A0804` (dark warm brown-black)
- Gold dust: 15 tiny particles, `#F0C04020`, 1-2px, slow random drift, fade in/out over 3s cycles
- Accent lines: thin gold border around the entire canvas, `#F0C04015`, 1px
- Neurons: standard colors BUT each has a thin gold ring outline (`#F0C040`, 1px, no fill)
- Connections: `#F0C04010`, with occasional gold spark traveling
- Feel: premium, elegant, understated luxury. NOT flashy. Classy.

### Neuron Skin Palettes (8 skins, $0.99 each)
Each skin changes ALL neuron colors + connection tint. Glow color matches new palette.

| Skin | Basic | Sensory | Pyramidal | Mirror | Integrator | Connections | Feel |
|---|---|---|---|---|---|---|---|
| **Default** | `#4060E0` | `#22B07A` | `#8B7FE8` | `#E06090` | `#40D0D0` | `#FFFFFF10` | Cool blue |
| **Ember** | `#E04040` | `#F0A030` | `#E06020` | `#F04060` | `#F08030` | `#F0A03010` | Fire/lava |
| **Frost** | `#80C0F0` | `#A0E0F0` | `#60A0D0` | `#B0D0F0` | `#70B0E0` | `#80C0F010` | Ice/arctic |
| **Void** | `#606080` | `#505070` | `#404060` | `#707090` | `#585878` | `#60608010` | Dark matter |
| **Solar** | `#F0D040` | `#F0B020` | `#E0C060` | `#F0A040` | `#D0C030` | `#F0D04010` | Sun/gold |
| **Toxic** | `#40F060` | `#30D040` | `#60F080` | `#20E050` | `#50F070` | `#40F06010` | Radioactive |
| **Crystal** | `#D0D0F0` | `#C0C0E0` | `#E0D0F0` | `#D0C0E0` | `#C0D0F0` | `#D0D0F010` | Glass/diamond |
| **Shadow** | `#302040` | `#201830` | `#3A2850` | `#281838` | `#2A2040` | `#30204010` | Dark/stealth |
| **Prism** | Cycles through all default colors per neuron, shifting over time via `hue += time*10` | `#FFFFFF10` | Rainbow shift |

### Glow Pack Specs (3 packs, $0.99 each)

**Firefly** — Particles orbit around neurons.
- 2-4 tiny circles (1-2px) per neuron, orbit radius = nodeRadius + 8px
- Color: same as neuron at 40% opacity. Speed: 1 revolution / 3 seconds.
- Replaces default shadowBlur glow with particle orbit.

**Halo** — Clean ring around each neuron.
- Thin ring (1.5px stroke) at nodeRadius + 6px from center.
- Color: neuron color at 50% opacity. No fill. No shadowBlur.
- Clean, minimal, modern look. Ring pulses opacity 30%-60% with sin(time*2).

**Plasma** — Electric arcs between connected neurons.
- Connections rendered as jagged lines (3-4 segments with random offsets ±5px).
- Bright: connection color at 40% opacity, 2px. Flicker every 0.5s (random segment offsets change).
- Neurons: standard shadowBlur + occasional "spark" particle at connection endpoints.

### Animations
- Easing: `ease-out` for UI transitions, linear for canvas pulses.
- Modal appear: slide up from bottom, 300ms, with backdrop blur(8px).
- Toast: fade in 200ms, hold 3s, fade out 200ms.
- Numbers: snap to value (no counting animation in v1.0 — simpler, less buggy).
- Neuron glow: `ctx.shadowBlur = 12`, pulse via `sin(time * 2)` modulating blur 8-16.

### Fonts
- HUD numbers: system monospace (`'SF Mono', 'Roboto Mono', monospace`)
- UI text: system sans-serif (`-apple-system, 'Segoe UI', sans-serif`)
- Narrative fragments on canvas: system serif (`Georgia, 'Times New Roman', serif`)
- No custom fonts in v1.0 (saves ~200KB bundle size).

---

## SPRINT DEFINITIONS OF DONE

Each sprint has two sections:
- **AI checks** ✅ — Claude Code verifies these (automated/code review)
- **Player tests** 🎮 — Nico plays the game on a device and confirms

### Sprint 0: Pre-launch Marketing (PARALLEL — runs alongside S1-S10)
**Nico tasks (30 min/week):**
- [ ] Create TikTok/Instagram account. Post "Building a game 100% with AI — Day 1"
- [ ] Post weekly progress: GIFs of canvas, screenshots of neurons, short video clips
- [ ] Create presence on r/incremental_games (Reddit). Share early GIFs.
- [ ] Set up Discord server or landing page with email signup
- [ ] Research ASO keywords: idle, brain, neuron, evolution, mind, incremental, prestige
- [ ] (At Sprint 8) Record 30-second gameplay trailer
- [ ] (At Sprint 10) Create feature graphic for Google Play (1024×500)
- [ ] (At Sprint 12) Post "launching soon" on all channels

### Sprint 1: Project Setup + Core Engine
**AI checks:**
- [ ] `npm run dev` starts without errors
- [ ] `npm run build` produces bundle < 2MB
- [ ] GameState interface compiles (90+ fields, all typed, no `any`)
- [ ] `SYNAPSE_CONSTANTS` exports every value from GDD
- [ ] `softCap(100)=100`, `softCap(200)≈164.72`, `softCap(1000)≈524.81` (formula `100 * (x/100)^0.72`)
- [ ] `calculateProduction()` returns `{ base, effective }` separately
- [ ] Tick loop runs at 100ms with delta-time tracking
- [ ] `t('key')` returns English strings for all keys
- [ ] Zustand store persists to Capacitor Preferences (not localStorage)
- [ ] PROGRESS.md created with Sprint 1 status
- [ ] ESLint zero warnings. No file > 200 lines. No function > 50 lines.
- [ ] All numbers come from constants.ts (zero hardcoded values)

**Player tests (Nico on device):**
- [ ] App opens on phone without crash
- [ ] Console shows no errors

### Sprint 2: Canvas + HUD
**AI checks:**
- [ ] Canvas uses `devicePixelRatio` (not blurry on retina)
- [ ] Touch uses `touchstart` not `click`
- [ ] `touch-action: manipulation` on canvas CSS
- [ ] Safe areas respected (notch, home indicator)
- [ ] HUD: thoughts top-left, rate top-right, charges center
- [ ] Focus Bar renders below charges (P4+)
- [ ] Consciousness Bar on right edge (vertical)
- [ ] Tab nav: 4 tabs, progressive disclosure (10/80/1%)
- [ ] `formatNumber()`: 1000→"1.0K", 1500000→"1.5M"
- [ ] Canvas pauses on `visibilitychange === 'hidden'`
- [ ] `wrapText()` function for narrative canvas text
- [ ] AudioContext unlock on first tap (iOS)

**Player tests (Nico on device):**
- [ ] Canvas looks sharp (not blurry) on your phone
- [ ] Tap feels instant (no delay)
- [ ] HUD text doesn't overlap with notch
- [ ] Game pauses when you switch to another app
- [ ] Game resumes when you come back
- [ ] Canvas renders at smooth framerate (no visible stutter)
- [ ] When thoughts hit 10: Neurons tab appears with pulsing glow + "!" badge — impossible to miss

### Sprint 3: Neurons + Upgrades + Discharge
**AI checks:**
- [ ] 5 neuron types with costs, rates, requirements from constants
- [ ] Cost scales at ×1.28 per owned (10th Basic = `10 × 1.28^9 ≈ 107`)
- [ ] Upgrade panel: 3 categories (new/affordable/locked)
- [ ] Discharge bonus = `baseProductionPerSecond × 20` (NOT effective)
- [ ] Cascade: `Focus >= CONSTANTS.cascadeThreshold` + Discharge = ×2.5
- [ ] Focus fills with `CONSTANTS.focusFillPerTap` per tap
- [ ] Insight activates when Focus ≥ 1.0 (duration from constants)
- [ ] Haptic feedback: tap=light, buy=medium, discharge=heavy

**Player tests (Nico on device):**
- [ ] Buy a neuron → see thoughts decrease and production increase
- [ ] Buy an upgrade → feel the production change
- [ ] Wait for Discharge → feel the big burst of thoughts
- [ ] Fill Focus → Insight activates with visible ×3 effect
- [ ] Trigger a Cascade → satisfying big number moment
- [ ] Haptics feel right on each action

### Sprint 4: Prestige + Patterns + Polarity
**AI checks:**
- [ ] Prestige resets ALL 33+ fields in PRESTIGE_RESET
- [ ] Prestige preserves memories, patterns, sparks, achievements, diary
- [ ] Pattern Tree displays, allows node placement
- [ ] Decision nodes show permanent binary choice
- [ ] CycleSetupScreen: 1 column at P3, 2 at P7, 3 at P10+
- [ ] "Same as before — START" works in 1 tap
- [ ] Momentum bonus = `CONSTANTS.momentumBonusSeconds × baseProduction`
- [ ] Personal bests tracked per prestige number

**Player tests (Nico on device):**
- [ ] Play from P0 to P1: takes 7-8 minutes (time it)
- [ ] First Discharge happens at ~5 minutes (feels impactful)
- [ ] Prestige animation plays smoothly
- [ ] After prestige: thoughts=0, neurons=0, but patterns visible
- [ ] P2 feels faster than P1 (patterns are working)
- [ ] At P3: Polarity choice appears (Excitatory vs Inhibitory)
- [ ] "Same as before" skips setup in 1 tap

### Sprint 5: Mutations + Pathways + Regions
**AI checks:**
- [ ] 15 mutations defined with effects/tradeoffs
- [ ] 3 pathways (Swift/Deep/Balanced) with enables/blocks
- [ ] Region panel shows unlocked regions
- [ ] Region upgrades cost Memories
- [ ] What-if Preview shows time estimates on CycleSetupScreen

**Player tests (Nico on device):**
- [ ] At P7: 3 mutation cards appear. Each feels different.
- [ ] At P10: Pathway choice appears. 3 options.
- [ ] CycleSetupScreen shows all 3 columns at P10+
- [ ] What-if estimates seem reasonable (green=faster, red=slower)
- [ ] Regions tab shows Hippocampus with purchasable upgrades

### Sprint 6: Archetypes + Narrative + Events
**AI checks:**
- [ ] 3 archetypes with production bonuses
- [ ] Narrative fragments render on canvas (fade, 6s, lower third, word-wrapped)
- [ ] Echoes render at 15% opacity, 4s, middle canvas
- [ ] Spontaneous Synapse banner every 4-6 min (40% chance)
- [ ] Eureka expires after 60s
- [ ] Endgame countdown visible from P20
- [ ] Ending screen: fullscreen overlay, blurred background, binary choice

**Player tests (Nico on device):**
- [ ] At P5: archetype choice feels meaningful
- [ ] Narrative fragments appear on canvas. Readable. Don't overlap HUD.
- [ ] Echoes appear subtly. Not distracting but noticeable.
- [ ] Spontaneous Synapse banner appears mid-cycle. Dismissible.
- [ ] Read a few fragments. Do they feel engaging? Quality check.

### Sprint 7: 5 New Features
**AI checks:**
- [ ] 30 achievements: locked=hint, unlocked=✓, toast on unlock
- [ ] 5 mental states: only 1 active, priority system, HUD chip
- [ ] Mental states affect effectiveProduction ONLY (not base/offline)
- [ ] 8 micro-challenges: appear 8-10 min, auto-fade 5s, reward 1% cycleGen
- [ ] Neural diary: logs prestiges, PBs, achievements. Max 500.
- [ ] What-if preview: shows ~Xm estimated on each CycleSetup option

**Player tests (Nico on device):**
- [ ] Unlock an achievement → toast appears with name
- [ ] Achievement panel shows progress clearly
- [ ] Mental State chip appears below Focus Bar when triggered
- [ ] Micro-challenge banner appears. Accept one. Complete it. Get reward.
- [ ] Ignore a micro-challenge. It fades. No punishment.
- [ ] Open diary. See your prestige history logged.

### Sprint 8: Offline + Transcendence + Runs 2-3
**AI checks:**
- [ ] Offline = `baseProduction × hours × 0.50`. Cap 8h.
- [ ] Sleep screen: animated counter, Lucid Dream (P10+, 33%)
- [ ] Transcendence: `prestigeCount→0`, `transcendenceCount+=1`
- [ ] Run 2 threshold = base × 3.5
- [ ] 6 run-exclusive upgrades at Run 2+
- [ ] 4 Resonant Pattern conditions checked at prestige
- [ ] Secret Ending when all 4 discovered
- [ ] Save to Capacitor Preferences on prestige + background
- [ ] Firebase cloud save on prestige (fail silently if offline)
- [ ] `migrateState()` adds defaults for missing fields

**Player tests (Nico on device):**
- [ ] Close app for 1 hour. Reopen. Sleep screen shows ~correct thoughts.
- [ ] Close app overnight. Reopen. Get substantial offline progress.
- [ ] Complete 26 prestiges → Transcendence ending plays
- [ ] Start Run 2 → threshold is noticeably higher but patterns help
- [ ] Force-close app during prestige animation → reopen → no progress lost
- [ ] Uninstall and reinstall → restore save from Firebase prompt appears

### Sprint 9: Monetization
**AI checks:**
- [ ] 6 rewarded ad placements working (including NEW post-Discharge ×2)
- [ ] Ad rules: no ads first 10 min, no ad after Cascade, max 1 per 3 min
- [ ] Ad failure → toast "Ad not available" (no crash)
- [ ] ATT prompt implemented for iOS (NSUserTrackingUsageDescription in Info.plist)
- [ ] Genius Pass: TWO plans — weekly ($1.99/wk) + monthly ($4.99/mo)
- [ ] Monthly shown first with "best value" badge. Weekly shows "Save 38% with monthly."
- [ ] ALL prices fetched from store via `product.priceString` (NEVER hardcoded)
- [ ] Subscription screen shows: price, auto-renew, cancel instructions BEFORE purchase
- [ ] **Restore Purchases button** in Settings → calls RevenueCat.restorePurchases()
- [ ] Entitlement check on app foreground via `Purchases.getCustomerInfo()`
- [ ] Genius Pass offer triggers: post-P1, post-PB, post-P5, post-P10, post-Transcendence. 72h min. Max 3 dismissals.
- [ ] Starter Pack "Neural Awakening Pack" ($2.99): appears on Awakening screen post-P1. 48h timer. One-time.
- [ ] Cosmetics Store "Neural Aesthetics": 8 neuron skins ($0.99), 4 canvas themes ($1.99), 3 glow packs ($0.99), 1 HUD style ($1.99)
- [ ] Cosmetic preview: 3-second live preview on canvas before purchase
- [ ] Cosmetics persist forever (non-consumable, survive prestige + transcendence)
- [ ] Cosmetic equip: mix any skin + theme + glow. Store accessible from Settings or canvas icon.
- [ ] Spark Packs: 3 tiers ($0.99/20, $3.99/110, $7.99/300). Bonus on higher tiers.
- [ ] Monthly Spark purchase cap: 1000. After cap: friendly message, no purchase.
- [ ] Piggy Bank: fills, breaks on purchase (price from store). Refill $0.99.
- [ ] Limited-Time Offers: 4 triggers (P3, P7, P13, Run 2). 48h countdown. Max 1 active.
- [ ] Daily Login: correct reward per day in streak
- [ ] No ads during first 10 minutes (tutorial)
- [ ] 11 new analytics events (ANALYTICS-4): starter_pack_*, limited_offer_*, cosmetic_*, spark_*

**Player tests (Nico on device):**
- [ ] Watch a rewarded ad → get the reward
- [ ] After Discharge: post-Discharge ×2 ad appears (only non-Cascade). Watch it → double bonus.
- [ ] Decline an ad → no punishment, no repeated prompt
- [ ] Buy Genius Pass (monthly) → ads disappear, offline bonus applies, exclusive theme unlocks
- [ ] Buy Genius Pass (weekly) → same benefits
- [ ] Price shown matches App Store / Play Store exactly
- [ ] Subscription screen shows: price, "auto-renews", "cancel in Settings"
- [ ] After P1: Starter Pack appears on Awakening screen. Buy it → 50 Sparks + theme + 5 Memories.
- [ ] Dismiss Starter Pack → still available in Store for 48h, then gone.
- [ ] Open Cosmetics Store: see all items with prices. Preview a neuron skin → canvas changes for 3 seconds.
- [ ] Buy a neuron skin → equip it → all neurons change color.
- [ ] Buy a canvas theme → equip it → background changes.
- [ ] Mix skin + theme + glow → all work together.
- [ ] At P3: "Dual Nature Pack" limited offer appears with 48h timer.
- [ ] Buy Spark Storm pack → verify bonus (300 sparks, not 250).
- [ ] Try to exceed 1000 Sparks purchased/month → friendly cap message.
- [ ] Tap "Restore Purchases" → works (restores or "no purchases found")
- [ ] (iOS) ATT prompt appears before first ad
- [ ] Does monetization feel FAIR? Would YOU spend $2.99 on the Starter Pack? Would the cosmetics make you want to personalize your mind?

### Sprint 10: Polish + Infrastructure
**AI checks:**
- [ ] Settings: sound, notifications, colorblind, about, reset, feedback
- [ ] Hard Reset requires typing "RESET"
- [ ] Splash: logo → canvas, < 3 seconds
- [ ] GDPR consent for EU users
- [ ] Push notification permission after P1
- [ ] Force-close recovery (state saved before prestige animation)
- [ ] Time anomaly detection and cap
- [ ] Android back button: closes modal or minimizes app
- [ ] Status bar: dark style, matches game background
- [ ] Scroll bounce disabled
- [ ] All 44 analytics events fire correctly (including 9 funnel + 11 monetization events)
- [ ] Push notification schedule: 4h/8h/24h/72h with narrative text (NOTIF-1)
- [ ] Push notifications respect quiet hours (10pm-8am local)
- [ ] Push notifications stop after 7 days absent with no return
- [ ] All feature unlocks have discoverability (PHIL-5): tab badges, pulses, toasts
- [ ] Audio: ambient plays, SFX on tap/buy/discharge/prestige
- [ ] Colorblind mode works. Reduced motion works.
- [ ] No file > 200 lines. All imports correct direction. ESLint clean.

**Player tests (Nico on device):**
- [ ] Play the ENTIRE game from P0 to P5. Everything feels good?
- [ ] Switch between all 4 tabs rapidly. No lag?
- [ ] Lock phone, wait 5 min, unlock. Game resumes correctly?
- [ ] Turn sound on. Does ambient feel right? SFX satisfying?
- [ ] Try colorblind mode. Can you still distinguish neuron types?
- [ ] Try reduced motion. Game still playable?
- [ ] Open Settings → About → all links work?
- [ ] Send Feedback → email opens with device info?
- [ ] Hard Reset → type RESET → game restarts from zero?
- [ ] Overall: would you recommend this game to a friend?

### Sprint 11: QA + Balance + Device Testing
**AI checks:**
- [ ] Run 97 automated balance tests (all pass)
- [ ] No file in src/ exceeds 200 lines
- [ ] All imports follow dependency flow (config→engine→store→ui)
- [ ] ESLint passes with zero warnings
- [ ] All 140 GDD rules are implemented
- [ ] PROGRESS.md is up to date with all sprints marked done

**Player tests (Nico on device — MOST IMPORTANT SPRINT):**
- [ ] Test on iPhone SE or similar small screen — no clipping, no overlap
- [ ] Test on budget Android — canvas runs at 30fps+
- [ ] Play P0 to P5 continuously — time each prestige (P1=7-8m, P2-P5=15-24m)
- [ ] Close app 1 hour, reopen — offline progress correct
- [ ] Close app overnight — offline progress correct
- [ ] Force-close during prestige animation — no data loss
- [ ] Lock phone, wait 5 min, unlock — game resumes correctly
- [ ] Switch to another app and back — game resumes
- [ ] Turn off WiFi — game works fully offline
- [ ] Measure battery drain: < 5% per hour active play

### Sprint 12: Store Preparation + Submission (ALL MANUAL)
**Nico tasks:**
- [ ] Buy Apple Developer account ($99/year) if not already
- [ ] Buy Google Play Developer account ($25 one-time) if not already
- [ ] Register domain: synapsegame.app (or similar)
- [ ] Write and host Privacy Policy at synapsegame.app/privacy
- [ ] Write and host Terms of Service at synapsegame.app/terms
- [ ] Complete tax forms: W-8BEN in App Store Connect
- [ ] Complete tax interview in Google Play Console
- [ ] Connect bank account in both platforms
- [ ] Fill iOS Privacy Nutrition Labels in App Store Connect
- [ ] Fill Google Play Data Safety form
- [ ] Complete IARC content rating questionnaire
- [ ] Answer export compliance (iOS — standard HTTPS exemption)
- [ ] Create app icon (1024×1024) — design or AI-generate
- [ ] Source or create 3 ambient audio tracks + 8 SFX files
- [ ] Take 6 in-game screenshots for store listing
- [ ] Write full App Store description (4000 chars)
- [ ] Set App Review Notes: "No login required. Sandbox Apple ID: [id]"
- [ ] Build iOS archive in Xcode → upload to App Store Connect
- [ ] Build Android AAB → upload to Google Play Console
- [ ] (Android) Create closed testing track, recruit 20 testers, start 14-day wait
- [ ] (iOS) Submit to TestFlight for internal testing
- [ ] Test IAP in sandbox (both platforms): buy, restore, cancel, re-subscribe

### Sprint 13: Soft Launch → Global (ALL MANUAL)
**Nico tasks:**
- [ ] Submit to App Store for Canada + Australia only
- [ ] Submit to Google Play for Canada + Australia only
- [ ] Wait for review (iOS 24-48h, Android 1-3 days)
- [ ] If rejected: read rejection reason, fix, resubmit
- [ ] Configure conversion funnel dashboard in Firebase (ANALYTICS-3): app_first_open → first_tap → first_buy → first_discharge → first_prestige → reached_p5 → reached_p10 → first_transcendence → first_purchase
- [ ] Monitor for 2 weeks via Firebase Analytics dashboard:
  - D1 retention > 35%?
  - Crash rate < 1%?
  - Average session > 8 minutes?
  - Ad revenue per user (ARPU)?
  - IAP conversion rate?
- [ ] Balance patch via Firebase Remote Config if prestige times are off
- [ ] Hotfix critical bugs via new build submission
- [ ] Decision: metrics pass → submit global release
- [ ] Decision: metrics fail → iterate, re-soft-launch
- [ ] Submit global release (all countries)
- [ ] Monitor global launch reviews and crashes for 2 weeks
- [ ] Respond to player reviews in both stores

---

## File Structure
```
synapse/
├── CLAUDE.md                          # This file (project rules)
├── PROGRESS.md                        # Updated each session (what's done, what's next)
├── docs/                              # Design docs (read-only)
│   ├── SYNAPSE_GDD_V2_FINAL.html
│   ├── SYNAPSE_NARRATIVE_BIBLE.html
│   ├── SYNAPSE_QA_IMPLEMENTATION.html
│   ├── SYNAPSE_UI_MOCKUPS.html
│   ├── SYNAPSE_CORE_POSTLAUNCH_DEEP.html
│   └── SYNAPSE_SENIOR_EVAL.html
├── src/
│   ├── config/                        # Data definitions (never logic)
│   ├── engine/                        # Pure functions (no side effects)
│   ├── store/                         # Zustand store (state + actions)
│   ├── canvas/                        # Canvas2D rendering (reads store)
│   ├── ui/                            # React components
│   ├── analytics/                     # Firebase event wrappers
│   └── audio/                         # Howler.js wrapper
├── capacitor.config.ts
├── tsconfig.json                      # strict: true
├── eslint.config.js
├── .env.example
├── .gitignore
└── package.json
```
