/**
 * SYNAPSE design tokens — single source of truth for colors,
 * typography, spacing, and motion.
 *
 * Paired source of truth: docs/UI_MOCKUPS.html :root CSS variables.
 * Changes require updating BOTH files (ECO-1 pattern — data, not code).
 *
 * Aesthetic: bioluminescent — dark violet/lavender primary with
 * cyan and amber accents. Era 1 default; transitions to digital
 * (Era 2) and cosmic (Era 3) per GDD §9.
 *
 * Narrative tie-ins:
 * - NARRATIVE.md:476 — consciousness bar violet by default,
 *   white-gold at P26 only.
 * - NARRATIVE.md:60 — Era 2 transitions from "biology glow"
 *   toward "clean geometry".
 */

export const COLORS = {
  // ── Background layers ──
  bgDeep: '#05070d', // --bg: canvas base
  bgElevated: '#0a0d1a', // --bg2: modals, bottom sheets

  // ── Core bioluminescent palette (from UI_MOCKUPS :root) ──
  primary: '#8B7FE8', // --p: violet/lavender — primary UI, Focus Bar
  success: '#22B07A', // --t: green — rate counter, gains, success
  accent: '#F0A030', // --a: amber — thoughts counter, Discharge
  error: '#E85050', // --r: red — errors (rare), warnings
  blue: '#4090E0', // --bl: blue — secondary accent, "next cycle"
  pink: '#E06090', // --pk: pink — Espejo accent, spontaneous events
  cyan: '#40D0D0', // --cy: cyan — Consciousness Bar, Resonant Patterns

  // ── Text hierarchy ──
  textPrimary: '#e8e6f8', // --text: primary readable (violet-white)
  textSecondary: '#7070a0', // --t2: secondary, captions
  textDisabled: '#383860', // --t3: disabled states

  // ── Semantic aliases (used by specific HUD components) ──
  thoughtsCounter: '#F0A030', // accent — per UI_MOCKUPS thoughts display
  rateCounter: '#22B07A', // success — per UI_MOCKUPS rate display
  consciousnessBar: '#8B7FE8', // primary violet — default per NARRATIVE:476
  consciousnessBarP26: '#FFF0C0', // white-gold — Era-3-final override only
  focusBar: '#40D0D0', // cyan — matches UI_MOCKUPS SVG top horizontal bar (distinct from violet Consciousness Bar, Phase 4.9 Finding #18)
  dischargeBtn: '#F0A030', // accent amber

  // ── Overlay + border utilities (from UI_MOCKUPS observed patterns) ──
  overlayScrim: 'rgba(5, 7, 13, 0.85)',
  borderSubtle: '#ffffff14', // ~8% white
  borderMedium: '#ffffff20', // ~12% white
  borderStrong: '#ffffff30', // ~18% white

  // ── Neuron type colors (Sprint 2 Phase 2 — GDD §5 × canonical palette) ──
  // Mapping rationale in GDD §3b + PROGRESS.md Phase 2 pre-code entry.
  // Era arc: Era 1 violet (Piramidal-dominated) → Era 2 cyan (Integradora unlocks P10+) → Era 3 white-gold (P26).
  neuronBasica: '#4090E0', // --bl blue — foundational/calm; first type new players see
  neuronSensorial: '#22B07A', // --t green — biological "alive" perception (overlaps rate counter; semantically coherent — sense → rate)
  neuronPiramidal: '#8B7FE8', // --p violet — primary/workhorse; mid-tier that carries P0-P9 progression
  neuronEspejo: '#E06090', // --pk pink — reflective/empathic; mockup precedent (r=8 accent circle)
  neuronIntegradora: '#40D0D0', // --cy cyan — Era 2 "clean geometry" foreshadow; semantic overlap with Consciousness Bar is deliberate (both = integration)
  // NOTE: amber --a is reserved HUD-only (thoughts counter + Discharge button).
  // Mockup's amber neuron circle (line 46) is likely a Flujo Eureka Mental State render (Sprint 7 MENTAL-4).
} as const;

export const TYPOGRAPHY = {
  // Matches UI_MOCKUPS.html line 7-9.
  // Outfit serves both display AND body per UI_MOCKUPS usage.
  // JetBrains Mono for numeric displays (tabular figures prevent jitter).
  fontDisplay: "'Outfit Variable', 'Outfit', system-ui, sans-serif",
  fontBody: "'Outfit Variable', 'Outfit', system-ui, sans-serif",
  fontMono: "'JetBrains Mono Variable', 'JetBrains Mono', 'SF Mono', Consolas, monospace",

  size: {
    xs: '0.75rem', // 12px — captions
    sm: '0.875rem', // 14px — secondary text (UI_MOCKUPS body default)
    base: '1rem', // 16px — body
    lg: '1.125rem', // 18px — emphasized body
    xl: '1.5rem', // 24px — section headers
    '2xl': '1.625rem', // 26px — screen titles (UI_MOCKUPS h1 style)
    '3xl': '2rem', // 32px — hero counters
    '4xl': '3rem', // 48px — rare, splash moments
  },

  weight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 800, // UI_MOCKUPS uses for thoughts counter
    heaviest: 900, // UI_MOCKUPS uses for h1 gradient title
  },

  leading: {
    tight: 1.2, // display
    normal: 1.5, // body
    relaxed: 1.65, // long-form (UI_MOCKUPS paragraph default)
  },

  tabular: 'tabular-nums', // critical for live number counters
} as const;

export const SPACING = {
  0: '0',
  1: '0.25rem', // 4px
  2: '0.5rem', // 8px
  3: '0.75rem', // 12px
  4: '1rem', // 16px — default gutter
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  8: '2rem', // 32px
  10: '2.5rem', // 40px
  12: '3rem', // 48px — touch target minimum (Android 48dp)
  16: '4rem', // 64px
} as const;

export const RADII = {
  sm: '4px',
  md: '8px', // cards
  lg: '12px', // modals
  xl: '16px', // screen containers (UI_MOCKUPS .screen border-radius)
  '2xl': '20px', // bottom sheets
  full: '9999px',
} as const;

export const TOUCH = {
  minTarget: '48px', // Android 48dp, iOS 44pt
} as const;

export const MOTION = {
  durInstant: 100, // tap feedback
  durFast: 200, // tab switch, button press
  durMedium: 400, // modal enter
  durSlow: 800, // splash → canvas transition
  durPulse: 2400, // neuron ambient pulse (full sin cycle)
  // Pulse envelope (Sprint 2 Phase 2 — renderer.ts consumes these)
  pulseRadiusAmp: 0.1, // ±10% of base radius at pulse peak/trough
  pulseOpacityMin: 0.7, // opacity at pulse trough
  pulseOpacityMax: 1.0, // opacity at pulse peak
} as const;

// HUD layout constants (Sprint 2 Phase 5 — TS-only tokens).
// All values derived from UI_MOCKUPS.html Screen 1 canonical SVG.
// Per CLAUDE.md "Canonical storage file rule": this block keeps HUD
// visual values as data (not logic) so the HUD components themselves
// stay literal-free and CODE-1 compliant.
export const HUD = {
  pipSize: 10, // Discharge charge pip diameter (mockup r=5 → 10px)
  pipGap: 6, // Space between adjacent pips
  focusBarHeight: 4, // Focus Bar track height (mockup h=4)
  consciousnessBarWidth: 3, // Consciousness Bar track width (mockup w=3)
  dischargeButtonMinWidth: 120, // Mockup button w=120
  touchTargetMin: 48, // CODE-4 minimum (Android 48dp / iOS 44pt)
  dischargePipFadedOpacity: 0.4, // Empty pip visual weight
  dischargeLabelOpacity: 0.6, // Countdown text subtlety (mockup #F0A03060)
  dischargeButtonDisabledOpacity: 0.55, // Stub-state visual
} as const;

// Canvas-specific geometry + rendering primitives (TS-only tokens;
// not emitted as CSS vars because canvas code reads them directly).
export const CANVAS = {
  // Pre-rendered glow sprite size = neuron radius × this multiplier.
  glowRadiusMultiplier: 2.5,
  glowCacheMaxEntries: 20, // FIFO eviction beyond this
  // Visual radii per neuron type (Sprint 2 Phase 2 mapping, GDD §3b).
  // Progression = tier × 2 + 6 px. Visual only — tap hit-areas are a
  // Phase 3 concern per CODE-4 (iOS 44pt / Android 48dp minimums).
  neuronRadii: {
    basica: 8,
    sensorial: 10,
    piramidal: 12,
    espejo: 14,
    integradora: 16,
  },
  // Circle stroke + fill style (matches UI_MOCKUPS canvas section).
  neuronStrokeWidth: 1.5,
  neuronFillOpacityHex: '30', // 2-digit hex alpha suffix (~19% fill)
  // Tap hit-area enforcement (Sprint 2 Phase 3 — CODE-4 touch targets).
  // iOS 44pt / Android 48dp minimum ÷ 2 = 24 CSS px radius.
  // Hit radius per neuron = max(visualRadius, minHitRadiusPx).
  minHitRadiusPx: 24,
  // Deterministic scatter layout for multi-neuron rendering (Phase 3+).
  scatterGoldenAngle: 2.399, // ≈ 137.5° in radians — natural spiral
  scatterBaseRadius: 40, // distance from canvas center for first scattered neuron
  scatterRadiusStep: 12, // additional distance per index
} as const;
