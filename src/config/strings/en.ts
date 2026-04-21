// Implements CLAUDE.md CODE-1 "every player-facing string in
// config/strings/{lang}.ts via t('key')". Sprint 1 gap fill per
// Phase 4.9 Sprint 2 (PROGRESS.md Finding #16).
//
// Structure: nested object by domain, flattened to dot-notation
// at runtime via `t()`. Keys are conservative — Phase 5 will
// consume these; Sprint 3+ extends as new features ship.

export const en = {
  hud_explain: {
    // Sprint 4c Phase 4c.6 — audit fix. Inline explanations for HUD elements
    // that previously had zero context. Shown below the relevant HUD chip /
    // counter so the player always understands what each number means.
    connection_chip: '+5% per pair of different neuron types owned',
    awakening_progress: 'to Awakening',
    memories_label: 'memories',
  },
  hud: {
    thoughts_label: 'thoughts',
    rate_prefix: '+',
    rate_suffix: '/s',
    charge_ready: 'ready',
    charge_countdown_prefix: 'Discharge ⚡',
    focus_bar_percent_suffix: '%',
    consciousness_bar_label: 'Consciousness',
  },
  tabs: {
    mind: 'Mind',
    neurons: 'Neurons',
    upgrades: 'Upgrades',
    regions: 'Regions',
  },
  neurons: {
    basica: {
      name: 'Basic',
      description: 'The foundation. All minds begin here.',
    },
    sensorial: {
      name: 'Sensory',
      description: 'Perceives the world.',
    },
    piramidal: {
      name: 'Pyramidal',
      description: 'Drives complex thought.',
    },
    espejo: {
      name: 'Mirror',
      description: 'Reflects and empathizes.',
    },
    integradora: {
      name: 'Interneuron',
      description: 'Integrates the network.',
    },
  },
  buttons: {
    discharge: 'DISCHARGE ⚡',
    discharge_locked_tooltip: 'Unlocks in next update',
  },
  app: {
    name: 'SYNAPSE',
  },
  gdpr: {
    title: 'Privacy',
    body: 'We use analytics to understand how you play. You can choose to share anonymous data, or continue without sharing.',
    accept: 'Accept',
    manage: 'Manage',
  },
  tutorial: {
    hint_tap: 'Tap the neuron',
    hint_buy: 'Buy your first neuron',
    hint_discharge: 'Use Discharge',
    hint_variety: 'Buy a different type for +5% production',
  },
  undo: {
    prefix_neuron: 'Bought',
    prefix_upgrade: 'Unlocked',
    button: 'UNDO',
  },
  confirm: {
    cancel: 'Cancel',
    confirm: 'Confirm',
  },
  awakening: {
    ready_label: 'AWAKENING',
    ready_hint: 'Cycle threshold reached',
    confirm_title: 'Awakening?',
    confirm_body: 'Reset cycle progress and begin a new cycle. Neurons, upgrades, and thoughts reset. Memories and lifetime progress carry over.',
    confirm_button: 'Awaken',
    screen_title: 'Awakening',
    duration_label: 'Cycle',
    memories_label: 'Memories',
    personal_best: 'New personal best',
    momentum_label: 'Momentum',
    momentum_suffix_seconds: 's head start',
    continue: 'Continue',
  },
  mind_subtabs: {
    home: 'Home',
    patterns: 'Patterns',
    archetypes: 'Archetypes',
    diary: 'Diary',
    achievements: 'Achievements',
    resonance: 'Resonance',
    archetypes_placeholder: 'Unlocks in Sprint 6',
    diary_placeholder: 'Unlocks in Sprint 6',
    achievements_placeholder: 'Unlocks in Sprint 7',
    resonance_placeholder: 'Unlocks in Sprint 8b',
    patterns_title: 'Pattern Tree',
    patterns_progress: 'patterns',
    patterns_explain: 'Every prestige earns 3 patterns. Each gives +2 thoughts/sec permanent, and +4% cycle production per pattern earned this cycle (cap ×1.5). Squares at 6 / 15 / 24 / 36 / 48 are permanent A/B decisions.',
    reset_button: 'Reset All Decisions',
    reset_confirm_1_title: 'Reset Pattern Decisions?',
    reset_confirm_1_body: 'This costs 1000 Resonance and clears every decision locked in so far. You can pick them again as patterns are re-earned.',
    reset_confirm_2_title: 'Really reset?',
    reset_confirm_2_body: 'Double-confirmation: 1000 Resonance will be consumed. This cannot be undone.',
    reset_confirm_button: 'Reset',
    reset_blocked_tooltip: 'Requires 1000 Resonance',
  },
  panels: {
    neurons: {
      rate_suffix: '/s',
      next_cost_prefix: 'Next',
      buy: 'Buy',
      locked: 'Locked',
      unlock_prestige: 'Unlock at P',
      unlock_neurons_prefix: 'Requires',
      mode_x1: '×1',
      mode_x10: '×10',
      mode_max: 'Max',
    },
    upgrades: {
      owned: 'OWNED',
      buy: 'Buy',
      locked_prefix: 'Unlock at P',
      blocked_by_pathway: 'Blocked by Pathway',
      section_affordable: 'Affordable',
      section_teaser: 'Next up',
      section_blocked: 'Blocked',
      section_locked: 'Locked',
    },
    regions: {
      shell_description: 'Sprint 5 builds the brain-region panel (Hippocampus, Prefrontal Cortex, Limbic System, Visual Cortex, Broca\'s Area).',
    },
  },
  narrative: {
    base_01: "A pulse. Then another. Something is beginning that doesn't yet know what it is.",
  },
  cycle_setup: {
    slot_locked_polarity: 'Polarity — unlocks P3',
    slot_locked_mutation: 'Mutation — unlocks P7',
    slot_locked_pathway: 'Pathway — unlocks P10',
    slot_placeholder_mutation: 'Mutation — Sprint 5',
    slot_placeholder_pathway: 'Pathway — Sprint 5',
    same_as_last: 'SAME AS LAST',
    next: 'Next',
    continue: 'Continue',
    polarity_title: 'Polarity',
    polarity_excitatory_name: 'Excitatory',
    polarity_excitatory_desc: 'Production +10%, Discharge −15%',
    polarity_inhibitory_name: 'Inhibitory',
    polarity_inhibitory_desc: 'Production −6%, Discharge +30%, easier Cascade',
  },
  // Upgrade display names (Sprint 3 Phase 1 — approved English translations
  // of GDD §24 Spanish canonical names per CLAUDE.md translation discipline).
  // Internal IDs stay snake_case Spanish; these are the player-facing labels.
  upgrades: {
    potencial_sinaptico: 'Synaptic Potential',
    mielina: 'Myelin',
    dopamina: 'Dopamine',
    concentracion_profunda: 'Deep Concentration',
    descarga_neural: 'Neural Discharge',
    amplificador_de_disparo: 'Discharge Amplifier',
    red_alta_velocidad: 'High-Speed Network',
    cascada_profunda: 'Deep Cascade',
    sincronizacion_total: 'Total Synchronization',
    red_neuronal_densa: 'Dense Neural Network',
    receptores_ampa: 'AMPA Receptors',
    transduccion_sensorial: 'Sensory Transduction',
    axones_proyeccion: 'Projection Axons',
    sincronia_neural: 'Neural Synchrony',
    ltp_potenciacion_larga: 'Long-Term Potentiation',
    espejo_resonantes: 'Resonant Mirrors',
    neurogenesis: 'Neurogenesis',
    consolidacion_memoria: 'Memory Consolidation',
    regulacion_emocional: 'Emotional Regulation',
    procesamiento_visual: 'Visual Processing',
    funciones_ejecutivas: 'Executive Function',
    amplitud_banda: 'Bandwidth',
    sueno_rem: 'REM Sleep',
    umbral_consciencia: 'Consciousness Threshold',
    ritmo_circadiano: 'Circadian Rhythm',
    hiperconciencia: 'Hyperconsciousness',
    retroalimentacion_positiva: 'Positive Feedback',
    emergencia_cognitiva: 'Cognitive Emergence',
    emergencia_cap_reached: 'Max bonus reached — other upgrades keep scaling',
    singularidad: 'Singularity',
    convergencia_sinaptica: 'Synaptic Convergence',
    consciencia_distribuida: 'Distributed Consciousness',
    potencial_latente: 'Latent Potential',
    resonancia_acumulada: 'Accumulated Resonance',
    sintesis_cognitiva: 'Cognitive Synthesis',
    focus_persistente: 'Persistent Focus',
  },
  // Upgrade effect descriptions — Sprint 4c Phase 4c.6 (pre-playtest audit
  // flagged missing effect text as a usability gap). Sourced from GDD §24 +
  // §16 effect columns. Short player-friendly wording — exact formulas live
  // in the GDD. Every upgrade ID has a `{id}_desc` entry.
  upgrades_desc: {
    // Tap (3)
    potencial_sinaptico: 'Tap gives 10% of rate instead of 5%',
    mielina: 'Tap also fills +2% Focus',
    dopamina: 'Tap bonus ×1.5',
    // Focus (1)
    concentracion_profunda: 'Focus fills ×2; Insight lasts +5s',
    // Synapsis / Discharge (5)
    descarga_neural: '+1 max Discharge charge',
    amplificador_de_disparo: 'Discharge bonus ×1.5',
    red_alta_velocidad: 'Charges accumulate 25% faster',
    cascada_profunda: 'Cascade multiplier doubled',
    sincronizacion_total: 'Cascade refunds +18% Focus',
    // Neurons (8)
    red_neuronal_densa: 'All neurons rate ×1.25',
    receptores_ampa: 'Basic neurons ×2',
    transduccion_sensorial: 'Sensory neurons ×3',
    axones_proyeccion: 'Pyramidal neurons ×3',
    sincronia_neural: 'Connection multipliers ×2',
    ltp_potenciacion_larga: 'All neurons ×1.5',
    espejo_resonantes: 'Mirror neurons ×4',
    neurogenesis: 'All neurons ×1.10',
    // Regions (5, Memorias)
    consolidacion_memoria: 'Basic neurons ×3; Memories +50%',
    regulacion_emocional: 'Offline efficiency ×2',
    procesamiento_visual: 'Highlights best upgrade',
    funciones_ejecutivas: 'Thought-cost upgrades −20%',
    amplitud_banda: 'All region upgrades +50%',
    // Consciousness & Offline (4)
    sueno_rem: 'Offline cap 4h → 8h',
    umbral_consciencia: 'Consciousness bar fills ×1.3',
    ritmo_circadiano: 'Offline efficiency ×1.5 + auto-charge',
    hiperconciencia: 'Consciousness bar fills ×2',
    // Meta (3)
    retroalimentacion_positiva: '×2 all production',
    emergencia_cognitiva: '×1.5 per 5 upgrades owned (cap ×5)',
    singularidad: '×1.01 per prestige (stacks)',
    // Tier P10 (6)
    convergencia_sinaptica: '+1.5% per lifetime prestige (cap +40%)',
    consciencia_distribuida: 'Offline cap 8h → 12h',
    potencial_latente: 'Discharge +1,000 × prestige count',
    resonancia_acumulada: 'First post-offline Discharge +5%/hr (cap +100%)',
    sintesis_cognitiva: 'Pattern flat bonus ×2',
    focus_persistente: 'Keep 25% Focus across prestige',
  },
  // Sprint 3+ adds keys as new features ship — do NOT preload
  // empty keys for future features (CODE-1 anti-pattern is
  // hardcoding; empty keys anticipating features is NOT a
  // CODE-1 fix, it's noise).
} as const;
