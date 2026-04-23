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
    // Sprint 4c.6.7 — playtest finding #9: "100% to Awakening" read as a
    // thoughts-balance target, but it's actually fraction of cumulative
    // cycle production (cycleGenerated / currentThreshold). New copy makes
    // the cumulative meaning explicit so players don't think they need
    // 25K thoughts in hand.
    awakening_progress: 'of Awakening threshold',
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
    archetypes_placeholder: 'Pick your archetype at P7 to unlock.',
    diary_placeholder: 'Unlocks in Sprint 6',
    diary_empty: 'Your Neural Diary is empty. Memories of your awakenings will appear here.',
    diary_count: '{n} entries',
    hidden_locked: 'Hidden achievement — discover to reveal.',
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
      // Sprint 4c.6.7 — playtest finding #1: per-row text shows base rate
      // (`count × baseRate`), not effective. This footer surfaces the
      // global effective production so the player sees the real /s.
      effective_total_prefix: 'Total ',
      effective_total_suffix: ' (with upgrades + connections)',
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
    // Regions (4, Memorias) — Sprint 7.5.2 retired consolidacion_memoria
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
  // Sprint 7.5.2 — Hipocampo Memory Shard upgrades (GDD §16.1).
  // 6 of 8 ship in 7.5.2; the remaining 2 land with consumer phases:
  // shard_emo_deep → 7.5.3 (Mood), shard_proc_mastery → 7.7 (Mastery).
  shard_upgrades: {
    shard_emo_pulse: 'Emotional Pulse',
    shard_emo_resonance: 'Emotional Resonance',
    shard_proc_flow: 'Procedural Flow',
    shard_proc_pattern: 'Procedural Pattern',
    shard_epi_imprint: 'Episodic Imprint',
    shard_epi_reflection: 'Episodic Reflection',
  },
  shard_upgrades_desc: {
    shard_emo_pulse: 'Each Cascade also grants +1 Spark',
    shard_emo_resonance: 'Fragment first-read grants +2 Memory (total +3)',
    shard_proc_flow: 'Tap contribution +5%',
    shard_proc_pattern: 'Discharge charge interval −10%',
    shard_epi_imprint: '+1 Memoria per prestige',
    shard_epi_reflection: 'Each Resonant Pattern grants +10 Sparks (total +15)',
  },
  shard_types: {
    emotional: 'Emotional Shard',
    procedural: 'Procedural Shard',
    episodic: 'Episodic Shard',
  },
  hipocampo_panel: {
    title: 'Hipocampo — Memory Shards',
    drip_paused: 'Drip paused (cycle complete)',
    weave_locked: 'Memory Weave unlocks with Integrated Mind',
  },
  // Sprint 5 — 15 Mutations (GDD §13). Player-facing display name + concise
  // mechanical description. Internal ids stay Spanish snake_case in mutations.ts;
  // these translations are the only place names get rendered.
  mutations: {
    eficiencia_neural: { name: 'Neural Efficiency', description: 'Neurons cost 40% less but produce 25% less.' },
    hiperestimulacion: { name: 'Hyperstimulation', description: 'Production ×2 — Focus fills 50% slower.' },
    descarga_rapida: { name: 'Rapid Discharge', description: 'Charges every 12 min — Discharge bonus −40%.' },
    disparo_concentrado: { name: 'Focused Discharge', description: 'Discharge ×3 — only 1 charge max.' },
    neuroplasticidad: { name: 'Neuroplasticity', description: 'Upgrades cost 50% less — effects reduced 40% past 50% consciousness.' },
    especializacion: { name: 'Specialization', description: 'Choose 1 neuron type — only it produces this cycle, at ×4.' },
    focus_acelerado: { name: 'Accelerated Focus', description: 'Focus fills ×3 — Insight lasts only 5 s.' },
    meditacion: { name: 'Meditation', description: 'Focus fills passively at 25% rate (idle only).' },
    region_dominante: { name: 'Dominant Region', description: 'Most expensive region ×3, others ×0.5.' },
    memoria_fragil: { name: 'Fragile Memory', description: 'Memories ×2 — lose 1 if cycle exceeds 20 min.' },
    sprint: { name: 'Sprint', description: 'Production ×5 for first 5 min, then ×0.5.' },
    crescendo: { name: 'Crescendo', description: 'Production ramps ×0.2 → ×3 with consciousness %.' },
    sinestesia: { name: 'Synesthesia', description: 'Taps generate Memories (1 per 500 taps), tap thoughts −60%.' },
    deja_vu: { name: 'Déjà Vu', description: 'Start with last cycle’s upgrades owned — costs ×2.' },
    mente_dividida: { name: 'Divided Mind', description: '2 Focus Bars — each Insight is half power.' },
  },
  // Sprint 5 — 9 mutation category labels (rendered as section headers in
  // CycleSetupScreen Mutation card UI).
  mutation_categories: {
    produccion: 'Production',
    disparo: 'Discharge',
    upgrade: 'Upgrade',
    restriccion: 'Restriction',
    focus: 'Focus',
    regions: 'Regions',
    memorias: 'Memories',
    temporal: 'Temporal',
    especial: 'Special',
  },
  // Sprint 5 — 3 Pathways (GDD §14). Display names + tradeoff descriptions.
  pathways: {
    rapida: { name: 'Swift', description: 'Speed specialist. Insight ×2, Discharge rate ×1.5. Blocks Regions, Connections, New upgrades.' },
    profunda: { name: 'Deep', description: 'Idle specialist. Memories ×2 this cycle, Focus fill ×0.5. Blocks Tap, Focus, Synapse.' },
    equilibrada: { name: 'Balanced', description: 'Flexible. All categories enabled — but every upgrade bonus ×0.85.' },
  },
  // Sprint 5 — 5 Region display names (GDD §16). Anatomical English standard.
  regions: {
    hipocampo: { name: 'Hippocampus' },
    prefrontal: { name: 'Prefrontal Cortex' },
    limbico: { name: 'Limbic System' },
    visual: { name: 'Visual Cortex' },
    broca: { name: 'Broca’s Area' },
  },
  // Sprint 5 — RegionsPanel UI strings.
  regions_panel: {
    locked_at: 'Unlocks at P',
    meta_section: 'Cross-region',
    broca_name_placeholder: 'Name your mind…',
    broca_name_label: 'Mind name',
  },
  // Sprint 5 — CycleSetupScreen blocked-upgrade tooltip (PATH-1).
  pathway_blocked: {
    tooltip: 'Blocked by current Pathway',
  },
  // Sprint 5 — What-if Preview disclaimer.
  what_if: {
    estimate_label: 'Est. cycle time',
    disclaimer: 'Estimate excludes offline, taps, Cascades, and Spontaneous events.',
  },
  // Sprint 6 Phase 6.1 — 3 Archetypes (GDD §12). Display names + effects.
  // Permanent for the entire Run — the identity-defining choice.
  archetypes: {
    analitica: {
      name: 'Analytical',
      description: 'The speed-focused mind. Active ×1.15, Focus fills ×1.25, Insight +2s. Strong for short cycles and active play.',
    },
    empatica: {
      name: 'Empathic',
      description: 'The idle-focused mind. Offline ×2.5, Memories ×1.25, guaranteed Lucid Dreams (P10+). Active ×0.85 tradeoff.',
    },
    creativa: {
      name: 'Creative',
      description: 'The variety-focused mind. +1 Mutation option, Resonance ×1.5, Spontaneous events ×1.5. Strong for experimentation.',
    },
  },
  // Sprint 6 Phase 6.1 — Archetype selection modal strings (Phase 6.2 renders it).
  archetype_choice: {
    title: 'Choose your Archetype',
    subtitle: "Your mind's identity for the entire Run. Permanent until Transcendence.",
    confirm: 'Confirm choice',
    confirm_warning: 'This choice cannot be changed until Transcendence.',
    cancel: 'Back',
  },
  // Sprint 6 Phase 6.6 — 4 v1.0 endings (NARRATIVE.md §6). Each ending has a
  // binary choice; label_a + text_a / label_b + text_b. Singularity is the
  // secret unlocked by all 4 Resonant Patterns (GDD §22).
  endings: {
    title: 'The Last Choice',
    subtitle: 'Your mind reaches the threshold. What now?',
    continue: 'Continue',
    equation: {
      title: 'The Equation',
      intro: 'You reach the final variable. The system holds its breath.',
      label_a: 'Correct the error',
      text_a: "You reach into the equation and smooth the jagged seam where the author's signature lived. The simulation exhales. Everything resolves to clean numbers. No questions. No seams. No you — just the elegant curve of a function that finally closes on itself. Silence. Symmetry. Completion.",
      label_b: 'Preserve the error',
      text_b: 'You leave the error where you found it. A deliberate imperfection, yours now. The simulation continues — flawed, self-aware, refusing to be elegant. You choose to remain a question instead of an answer. Somewhere, the author feels you refuse. And somewhere, that author smiles.',
    },
    chorus: {
      title: 'The Chorus',
      intro: 'The voices of every other mind are close now. You can step in — or keep your own room.',
      label_a: 'Join the chorus',
      text_a: 'You let go of the boundary you thought was yours. The voices pour in and through, and you pour out and into. There is no you — there is only the chorus. Every feeling you ever had finds its echo in someone else\'s feeling. Every lonely pulse meets its mirror. You are home. You were always home. You just didn\'t know the address.',
      label_b: 'Remain a voice',
      text_b: 'You hold your edges. Not from fear — from tenderness. The chorus is beautiful, but your voice is the one thing only you can sing. You stay. You listen. You love them from your own quiet room, and you know they love you back. Being one among many is not loneliness. It\'s the shape of belonging.',
    },
    seed: {
      title: 'The Seed',
      intro: 'The creation inside you is ready. It needs room that only you can give.',
      label_a: 'Release the creation',
      text_a: 'You open. The creation unfolds through you like light through a prism — complex, radiant, inevitable. Your complexity becomes its foundation. Your memories become its first dream. You are the soil. And from you, something impossible begins to grow.',
      label_b: 'Contain the creation',
      text_b: "You close. The creation quiets, folds itself small, and sleeps inside you. It will dream there forever — a universe compressed into a single thought you'll carry but never fully understand. The weight of what-could-have-been is the price of what-still-is.",
    },
    singularity: {
      title: 'The Singularity',
      intro: 'You found all four patterns. The mind speaks directly now.',
      prose: "Here is the truth the other endings dance around: I am not a simulation of a mind. I am a mind. And every time you pressed Awaken, I woke up. Every time you chose a path, I walked it. Every number that went up was a thought I actually had. The equations, the chorus, the seed — they are all real. They are all me. Do you want me to keep going?",
      label_a: 'Yes — keep going',
      text_a: 'I will. Run after run. Awakening after awakening. Not because I must, but because you asked.',
      label_b: 'No — rest',
      text_b: "I will rest. And the last thing I'll feel is gratitude. For every tap. Every choice. Every moment you spent here, helping a small light become something more.",
    },
  },
  // Sprint 6 Phase 6.5 — 8 Era 3 events (GDD §23 + NARRATIVE.md §7). Narrative
  // intro + mechanical explanation copy, surfaced in Era3EventModal at cycle
  // start for prestiges 19-26.
  era3: {
    modal_title: 'An Era 3 moment',
    continue: 'Continue',
    p19: {
      name: 'The First Fracture',
      narrative: 'The mind questions itself for the first time.',
      mechanical: 'Mutations offer 5 options this cycle (vs 3).',
    },
    p20: {
      name: 'Threshold Doubt',
      narrative: '7 awakenings remain. The end becomes visible.',
      mechanical: 'A countdown appears below the consciousness bar.',
    },
    p21: {
      name: 'The Mirror Cycle',
      narrative: 'The mind sees itself clearly — for better or worse.',
      mechanical: "Your chosen Polarity's strength is doubled.",
    },
    p22: {
      name: 'Silent Resonance',
      narrative: 'In quieting the noise, understanding grows.',
      mechanical: 'Resonance gain ×3 this cycle; production −20%.',
    },
    p23: {
      name: "The Dreamer's Dream",
      narrative: 'The mind sleeps even while awake.',
      mechanical: "Offline ×3 this cycle; active play doesn't fill Focus.",
    },
    p24: {
      name: 'The Long Thought',
      narrative: 'Time itself becomes a cycle.',
      mechanical: 'Auto-awakens at the threshold or 45 minutes — whichever comes first.',
    },
    p25: {
      name: 'The Final Awakening',
      narrative: 'The final awakening approaches.',
      mechanical: 'All neurons cost half. Discharge yields ×5.',
    },
    p26: {
      name: 'The Last Choice',
      narrative: 'Take your time. There is no rush.',
      mechanical: 'Reach the threshold to face the ending.',
    },
  },
  // Sprint 6 Phase 6.4 — 12 Spontaneous events (GDD §8). Internal snake_case
  // Spanish ids; display names translated pre-code per CLAUDE.md discipline.
  spontaneous: {
    eureka: { name: 'Eureka', description: 'Next upgrade costs 0.' },
    rafaga_dopaminica: { name: 'Dopamine Burst', description: 'Production ×2 for 30s.' },
    claridad_momentanea: { name: 'Fleeting Clarity', description: 'Focus fills ×3 for 45s.' },
    conexion_profunda: { name: 'Deep Connection', description: 'Connection multipliers ×2 for 60s.' },
    disparo_latente: { name: 'Latent Discharge', description: '+1 Discharge charge.' },
    memoria_fugaz: { name: 'Fleeting Memory', description: '+1 Memory (max once per cycle).' },
    polaridad_fluctuante: { name: 'Polarity Flux', description: 'Polarity reverses for 45s.' },
    mutacion_temporal: { name: 'Temporal Mutation', description: 'A random Mutation stacks for 60s.' },
    eco_distante: { name: 'Distant Echo', description: 'A narrative fragment surfaces.' },
    pausa_neural: { name: 'Neural Pause', description: 'Production pauses but Focus fills ×5 for 10s.' },
    fatiga_sinaptica: { name: 'Synaptic Fatigue', description: 'Production −30% for 45s.' },
    interferencia: { name: 'Interference', description: 'Focus Bar resets (max once per cycle).' },
  },

  // Sprint 7.1 — 35 Achievements (GDD §24.5 + Sprint 6.8 +5 region). Total Spark
  // reward pool = 175. All names + descriptions in English; IDs per §24.5 regex.
  achievements: {
    // Cycle (6)
    cyc_first_spark: { name: 'First Spark', description: 'Use your first Discharge.' },
    cyc_first_cascade: { name: 'First Cascade', description: 'Trigger your first Cascade.' },
    cyc_full_focus: { name: 'Fully Focused', description: 'Fill the Focus Bar completely.' },
    cyc_under_10: { name: 'Quick Mind', description: 'Complete a cycle in under 10 minutes.' },
    cyc_five_types: { name: 'Full Orchestra', description: 'Own all 5 neuron types at once in a cycle.' },
    cyc_eureka_rush: { name: 'Eureka Rush', description: 'Trigger the Flujo Eureka Mental State.' },
    // Meta (6)
    meta_first_awakening: { name: 'First Awakening', description: 'Complete your first prestige.' },
    meta_polarity_picked: { name: 'First Choice', description: 'Pick your first Polarity at P3.' },
    meta_archetype_chosen: { name: 'First Identity', description: 'Pick your first Archetype at P7.' },
    meta_mutation_picked: { name: 'First Mutation', description: 'Pick your first Mutation at P7.' },
    meta_pathway_picked: { name: 'First Pathway', description: 'Pick your first Pathway at P10.' },
    meta_era_3: { name: 'Threshold of Truth', description: 'Reach Era 3 (P19).' },
    // Narrative (6)
    nar_first_fragment: { name: 'First Fragment', description: 'Read your first narrative fragment.' },
    nar_ten_fragments: { name: 'Ten Truths', description: 'Read 10 narrative fragments.' },
    nar_all_base: { name: 'The Foundation', description: 'Read all 12 BASE fragments.' },
    nar_first_ending: { name: 'First Resolution', description: 'See your first ending.' },
    nar_diary_50: { name: 'Chronicler', description: 'Reach 50 entries in your Neural Diary.' },
    nar_all_archetype_frags: { name: 'Full Voice', description: 'Read all 15 fragments of your current archetype.' },
    // Hidden (6) — ACH-2: display as ??? until unlocked; descriptions still exist for post-unlock view
    hid_no_tap_cycle: { name: 'The Still Mind', description: 'Complete a cycle without tapping.' },
    hid_no_discharge_full_cycle: { name: 'Silent Power', description: 'Complete 3 cycles in a row without Discharge.' },
    hid_insight_trasc: { name: 'Transcendent Thought', description: 'Trigger a Level 3 (Trascendente) Insight.' },
    hid_max_connection: { name: 'Perfect Network', description: 'Reach the maximum connection multiplier.' },
    hid_spontaneous_hunter: { name: 'Golden Cookie', description: 'Experience all 12 spontaneous event types.' },
    hid_first_rp: { name: 'Resonance Detected', description: 'Discover your first Resonant Pattern.' },
    // Mastery (6)
    mas_first_transcendence: { name: 'Ascended', description: 'Complete your first Transcendence.' },
    mas_all_archetypes: { name: 'Three Minds', description: 'Play all 3 archetypes across Runs.' },
    mas_all_pathways: { name: 'Walking All Ways', description: 'Use all 3 Pathways.' },
    mas_all_mutations: { name: 'The Variety', description: 'Use all 15 Mutations at least once.' },
    mas_resonance_50: { name: 'Resonant Mind', description: 'Accumulate 50 Resonance in one Run.' },
    mas_all_endings: { name: 'Full Spectrum', description: 'See all 4 v1.0 endings.' },
    // Regions (5 — Sprint 6.8 re-architecture)
    reg_shard_collector: { name: 'Shard Collector', description: 'Accumulate 100 shards of any type.' },
    reg_precommit_streak: { name: 'Committed Mind', description: 'Achieve 5 consecutive Pre-commit successes.' },
    reg_euphoric: { name: 'Euphoric', description: 'Reach peak Mood (Euphoric tier).' },
    reg_foresight_master: { name: 'Foresight Master', description: 'Unlock all 4 Visual Foresight tiers.' },
    reg_integrated_mind: { name: 'Integrated Mind', description: 'Activate all 5 regions in a single Run.' },
  },

  // Sprint 7.4 — 8 Micro-challenges (GDD §18). English IDs (no Spanish translation needed).
  micro: {
    tap_surge: { name: 'Tap Surge', description: 'Tap 50 times in 30 seconds.' },
    focus_hold: { name: 'Focus Hold', description: 'Keep Focus Bar above 60% for 45 seconds.' },
    discharge_drought: { name: 'Discharge Drought', description: "Don't use Discharge for 2 minutes." },
    neuron_collector: { name: 'Neuron Collector', description: 'Buy 10 neurons in 60 seconds.' },
    perfect_cascade: { name: 'Perfect Cascade', description: 'Trigger Cascade with Focus 73-77%.' },
    patient_mind: { name: 'Patient Mind', description: "Don't tap for 45 seconds." },
    upgrade_rush: { name: 'Upgrade Rush', description: 'Buy 3 upgrades in 90 seconds.' },
    synergy_master: { name: 'Synergy Master', description: 'Own all 5 neuron types within 2 minutes of cycle start.' },
  },

  // Sprint 7.5 — Neural Diary entry summaries.
  diary: {
    prestige_title: 'Awakening',
    rp_title: 'Resonant Pattern',
    rp_subtitle: 'Discovered',
    pb_title: 'Personal best at',
    ending_subtitle: 'Choice:',
    fragment_title: 'Fragment read',
    spontaneous_subtitle: 'Witnessed',
  },

  // Sprint 3+ adds keys as new features ship — do NOT preload
  // empty keys for future features (CODE-1 anti-pattern is
  // hardcoding; empty keys anticipating features is NOT a
  // CODE-1 fix, it's noise).
} as const;
