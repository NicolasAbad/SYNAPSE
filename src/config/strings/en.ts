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
    // Pre-launch audit Tier 2 (A-3) — anti-spam penalty visible feedback.
    anti_spam_badge: '×0.1',
    anti_spam_label: 'Tapping too fast — effectiveness reduced',
  },
  tabs: {
    mind: 'Mind',
    neurons: 'Neurons',
    upgrades: 'Upgrades',
    regions: 'Regions',
  },
  // Pre-launch audit Dim M Phase 2 — tab/subtab unlock celebration toasts.
  // Surfaced at the moment a new UI surface becomes visible (tab or Mind
  // subtab). Player taps the surface to dismiss the persistent badge.
  unlock_toast: {
    tab_regions: 'New tab unlocked: Regions',
    subtab_patterns: 'New: Patterns tree',
    subtab_diary: 'New: Neural Diary',
    subtab_mastery: 'New: Mastery tracking',
    subtab_archetypes: 'New: Archetypes',
    subtab_resonance: 'New: Resonance',
    cosmetics: 'Customize your mind — open Settings → Cosmetics',
  },
  // Pre-launch audit Tier 2 (A-1 / A-2) — activation-flash hero labels.
  // Cascade fires on every Cascade Discharge (sublabel = "+amount"); Insight
  // fires on every level-1/2/3 activation (sublabel = unused, level appears
  // in the main label as "INSIGHT L{N}").
  activation_flash: {
    cascade: 'CASCADE!',
    insight: 'INSIGHT',
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
    // Pre-launch audit C-3 — tutorial ×3 supercharged badge.
    discharge_tutorial_supercharge: 'SUPERCHARGED ×3',
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
    hint_upgrades_tab: 'Spend Sparks in the Upgrades tab',
    hint_focus_discharge: 'Fill Focus to 75% for a Cascade burst',
    hint_polarity: 'Before Awakening, pick a Polarity',
    hint_patterns_hipocampo: 'Mind tab: Patterns tree + Hipocampo shards are live',
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
    mastery: 'Mastery',
    archetypes_placeholder: 'Pick your archetype at P7 to unlock.',
    diary_placeholder: 'Unlocks in Sprint 6',
    diary_empty: 'Your Neural Diary is empty. Memories of your awakenings will appear here.',
    diary_count: '{n} entries',
    hidden_locked: 'Hidden achievement — discover to reveal.',
    achievements_placeholder: 'Unlocks in Sprint 7',
    resonance_placeholder: 'Unlocks in Sprint 8b',
    patterns_title: 'Pattern Tree',
    patterns_progress: 'patterns',
    mastery_title: 'Mastery',
    mastery_section_mutation: 'Mutations',
    mastery_section_upgrade: 'Upgrades',
    mastery_section_pathway: 'Pathways',
    mastery_section_archetype: 'Archetypes',
    mastery_locked_hint: 'Use once to reveal',
    mastery_level_label: 'Level',
    mastery_uses_label: 'uses',
    mastery_max_level_suffix: 'MAX',
    // Pre-launch audit Day 3 (A12) — empty-state explainer banner shown above
    // the entity grid. Players otherwise see a wall of "???" and don't know
    // mastery exists or how to engage with it.
    mastery_intro: 'Mastery tracks how often you use each Mutation, Upgrade, Pathway, and Archetype. Use any 10× to reveal it; +5% effect at max level.',
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
    // Sprint 7.5.3 §16.3 — Límbico Mood upgrades (Memorias-priced, marker effects).
    lim_steady_heart: 'Steady Heart',
    lim_empathic_spark: 'Empathic Spark',
    lim_resilience: 'Resilience',
    lim_elevation: 'Elevation',
    lim_euphoric_echo: 'Euphoric Echo',
    lim_emotional_wisdom: 'Emotional Wisdom',
    // Sprint 7.5.3 — Ondas Theta replaces retired regulacion_emocional offline path.
    ondas_theta: 'Theta Waves',
    // Sprint 7.5.5 §16.4 — Visual Foresight tier-unlock upgrades (3 of 3 shipped).
    vis_pattern_sight: 'Pattern Sight',
    vis_deep_sight: 'Deep Sight',
    vis_prophet_sight: 'Prophet Sight',
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
    // Regions (3, Memorias) — Sprint 7.5.2 retired consolidacion_memoria;
    // Sprint 7.5.3 retired regulacion_emocional (offline path → ondas_theta).
    // Plus 6 Sprint 7.5.3 Límbico mood upgrades:
    lim_steady_heart: 'Mood decay halved during offline',
    lim_empathic_spark: 'Cascade Mood bonus +5 (total +10)',
    lim_resilience: 'Mood floor 25 (anti-despair)',
    lim_elevation: 'Engaged→Elevated boundary 60→55',
    lim_euphoric_echo: 'Euphoric production mult 1.30→1.40',
    lim_emotional_wisdom: 'Each mood tier crossed this Run grants +1 lifetime Memoria',
    ondas_theta: 'Offline efficiency ×2',
    vis_pattern_sight: 'Mutation pool preview at Pattern Tree (T2)',
    vis_deep_sight: 'Spontaneous events show 20s countdown (T3)',
    vis_prophet_sight: 'Era 3 event preview at Awakening (T4)',
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
  // Catalog complete at 8 upgrades post-Sprint-7.7 (shard_proc_mastery landed).
  shard_upgrades: {
    shard_emo_pulse: 'Emotional Pulse',
    shard_emo_resonance: 'Emotional Resonance',
    shard_emo_deep: 'Deep Emotion',
    shard_proc_flow: 'Procedural Flow',
    shard_proc_pattern: 'Procedural Pattern',
    shard_proc_mastery: 'Procedural Mastery',
    shard_epi_imprint: 'Episodic Imprint',
    shard_epi_reflection: 'Episodic Reflection',
  },
  shard_upgrades_desc: {
    shard_emo_pulse: 'Each Cascade also grants +1 Spark',
    shard_emo_resonance: 'Fragment first-read grants +2 Memory (total +3)',
    shard_emo_deep: 'Mood event deltas ±50% stronger',
    shard_proc_flow: 'Tap contribution +5%',
    shard_proc_pattern: 'Discharge charge interval −10%',
    shard_proc_mastery: 'Mastery XP gain ×1.25 (accelerates all Mastery progression)',
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
  // Sprint 7.5.4 §16.2 — Pre-commit goal templates (8) + diary copy.
  precommit_goals: {
    pc_under_12min: { name: 'Under 12 Minutes', description: 'Complete this cycle in 12 min or less.' },
    pc_under_8min: { name: 'Under 8 Minutes', description: 'Complete this cycle in 8 min or less.' },
    pc_no_discharge: { name: 'No Discharge', description: 'Complete this cycle without using a Discharge.' },
    pc_five_cascades: { name: 'Five Cascades', description: 'Trigger 5 Cascades this cycle.' },
    pc_20_neurons: { name: '20 Neurons', description: 'Buy 20 neurons before P3.' },
    pc_no_tap_idle: { name: 'No Taps', description: 'Complete this cycle without tapping.' },
    pc_max_focus_3x: { name: 'Triple Focus', description: 'Trigger Insight three times this cycle.' },
    pc_spontaneous_hunter: { name: 'Spontaneous Hunter', description: 'Witness 3 Spontaneous events this cycle.' },
  },
  prefrontal_panel: {
    title: 'Prefrontal — Pre-commitments',
    streak_label: 'Streak',
    cancel_button: 'Cancel (refund wager)',
  },
  // Sprint 7.5.6/7.5.7 §16.5 — Broca Inner Voice Named Moment prompts.
  named_moments: {
    skip_button: 'Skip',
    author_button: 'Speak',
    first_awakening: { title: 'Your first awakening', prompt: 'Name this moment. What does it mean to begin?' },
    archetype_voice: { title: 'Your archetype speaks', prompt: 'Now that you have chosen, what will you become?' },
    resonance_found: { title: 'Resonance discovered', prompt: 'Something patterned. Name what resonated.' },
    era3_entry: { title: 'Beyond the threshold', prompt: 'You enter Era Three. Name what changes.' },
    last_choice: { title: 'The final choice', prompt: 'You stand at the ending. Name your decision.' },
  },
  // Sprint 7.5.3 §16.3 — Mood UI strings.
  mood_tiers: {
    numb: 'Numb',
    calm: 'Calm',
    engaged: 'Engaged',
    elevated: 'Elevated',
    euphoric: 'Euphoric',
  },
  mood_tier_descriptions: {
    numb: 'Your mind feels distant.',
    calm: 'Your mind rests at baseline.',
    engaged: 'Your mind is warming.',
    elevated: 'Your mind is lit.',
    euphoric: 'Your mind is singing.',
  },
  limbico_panel: {
    title: 'Límbico — Moodometer',
    current_mood: 'Mood',
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
  // Sprint 7.6 Phase 7.6.4: split each description into tagline/bonuses/blocks
  // for card scannability. `description` preserved for legacy consumers
  // (pathways.ts descriptionKey) — the PathwaySlot card now renders the 3
  // sub-spans instead of the single compound string.
  pathways: {
    rapida: {
      name: 'Swift',
      tagline: 'Speed specialist',
      bonuses: 'Insight ×2 · Discharge rate ×1.5',
      blocks: 'Blocked: Regions · Connections · New',
      description: 'Speed specialist. Insight ×2, Discharge rate ×1.5. Blocks Regions, Connections, New upgrades.',
    },
    profunda: {
      name: 'Deep',
      tagline: 'Idle specialist',
      bonuses: 'Memories ×2 this cycle · Focus fill ×0.5',
      blocks: 'Blocked: Tap · Focus · Synapse',
      description: 'Idle specialist. Memories ×2 this cycle, Focus fill ×0.5. Blocks Tap, Focus, Synapse.',
    },
    equilibrada: {
      name: 'Balanced',
      tagline: 'Flexible',
      bonuses: 'All categories enabled',
      blocks: 'Every upgrade bonus ×0.85',
      description: 'Flexible. All categories enabled — but every upgrade bonus ×0.85.',
    },
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
    precommit_success: 'Pre-commit succeeded',
    precommit_fail: 'Pre-commit failed',
  },

  // Sprint 7.10 Phase 7.10.5 — Sleep screen + Welcome modal + Lucid Dream copy.
  // Draft English (no Spanish source — these are new UI surfaces). Flagged in
  // PROGRESS.md for tone-pass review at sprint close.
  sleep: {
    title: 'Your mind was dreaming',
    elapsedLabel: 'Time away',
    gainedLabel: 'Thoughts gathered',
    efficiencyLabel: 'Offline efficiency',
    cappedNote: 'Cycle threshold reached — Awakening ready.',
    enhancedDischargeBanner: 'An enhanced Discharge awaits before Awakening.',
    lucidDreamTitle: 'A Lucid Dream stirs',
    lucidDreamOptionA: '+10% production for 1 hour',
    lucidDreamOptionB: '+2 Memories',
    rewardedAdButton: 'Watch ad — double offline thoughts',
    dismissButton: 'Wake up',
    // Sprint 7.10 Phase 7.10.6 — OFFLINE-10 returning-player greetings (§19 +
    // §16.5 + §39 Broca Inner Voice). Mood-tier-gated; show only when elapsed
    // >= lucidDreamMinOfflineMinutes (30 min — matches the "long enough to be
    // missed" threshold). Numb / Calm / Euphoric pulled near-verbatim from GDD
    // §19; Engaged + Elevated drafted Sprint 7.10.6 (Nico tone-pass approved).
    greetings: {
      numb: 'Your mind has been waiting.',
      calm: 'Your mind was quiet. It missed you.',
      engaged: 'Your mind was thinking of you.',
      elevated: 'Your mind was sharp while you were away.',
      euphoric: 'Your mind welcomes you back, still alight.',
    },
  },

  // Sprint 9a Phase 9a.4 — ad placement labels + MONEY-7 fallback toast.
  ads: {
    failedToast: 'Ad not available — try again in a moment',
    postDischargeOffer: 'Watch ad — double your last Discharge',
    postDischargeDismiss: 'No thanks',
    rerollMutation: 'Reroll mutations (watch ad)',
    decisionRetry: 'Pick the other option (watch ad)',
    piggyChipFull: 'Piggy full — watch ad to claim',
    rewardEarnedToast: 'Reward applied',
    rewardDismissedToast: 'Ad closed early — no reward',
    placeholderToast: 'Reward placement — Sprint 9b wires the bonus payout',
  },

  // Sprint 9a Phase 9a.2 — Settings modal + Restore Purchases (MONEY-3).
  settings: {
    title: 'Settings',
    closeButton: 'Close',
    restoreButton: 'Restore Purchases',
    restorePending: 'Restoring…',
    restoreSuccess: 'Purchases restored',
    restoreNoneFound: 'No previous purchases found',
    restoreFailed: 'Restore failed — check your connection',
    openButtonAria: 'Open settings',
    cosmeticsButton: 'Cosmetics',
    // Sprint 10 Phase 10.1 — section headers + per-row labels.
    sectionGeneral: 'General',
    sectionAudio: 'Audio',
    sectionAccessibility: 'Accessibility',
    sectionNotifications: 'Notifications',
    sectionAccount: 'Account',
    sectionGame: 'Game',
    // Pre-launch audit Tier-2 item C — tutorial-skip toggle.
    tutorialSkipLabel: 'Skip tutorial hints',
    tutorialSkipHint: 'Hide the on-screen tutorial pill. Useful for replays or speedrunners.',
    sectionLegal: 'Legal',
    legalPrivacyButton: 'Privacy Policy',
    legalTermsButton: 'Terms of Service',
    legalEulaButton: 'Genius Pass EULA',
    legalUrlMissing: 'Link not yet configured',
    // Pre-launch audit Day 2 — Subscription section + Genius Pass re-enable.
    sectionSubscription: 'Subscription',
    geniusPassReEnableLabel: 'Show Genius Pass offers',
    geniusPassReEnableHint: 'Re-enable subscription offers if you previously dismissed them',
    geniusPassReEnabledToast: 'Offers re-enabled — you may see Genius Pass again',
    languageLabel: 'Language',
    languageEn: 'English',
    languageEs: 'Español',
    sfxVolumeLabel: 'Sound effects',
    musicVolumeLabel: 'Music',
    colorblindLabel: 'Colorblind mode',
    colorblindHint: 'Adds shapes/patterns to color-only indicators',
    reducedMotionLabel: 'Reduced motion',
    reducedMotionHint: 'Disables canvas blur + simpler animations',
    highContrastLabel: 'High contrast',
    highContrastHint: 'Boosts text + UI border contrast',
    fontSizeLabel: 'Text size',
    fontSizeSmall: 'Small',
    fontSizeMedium: 'Medium',
    fontSizeLarge: 'Large',
    notificationsLabel: 'Daily reminders',
    notificationsHint: 'Reminds you when offline cap is full',
    // Pre-launch audit G-3 — analyticsConsent toggle (GDPR Article 21).
    sectionPrivacy: 'Privacy',
    analyticsConsentLabel: 'Share anonymous usage data',
    analyticsConsentHint: 'Helps us improve the game; turn off any time',
    // Pre-launch audit H-1 — GDPR Article 15 data export.
    dataExportButton: 'Download Your Data',
    dataExportHint: 'Get a copy of everything Synapse stores about you',
    dataExportSuccessShared: 'Export shared',
    dataExportSuccessDownloaded: 'synapse-data.json downloaded',
    dataExportSuccessCopied: 'Data copied to clipboard',
    dataExportFailed: 'Export failed — please try again',
    deferredCaveat: 'Audio + accessibility consumers ship in upcoming polish updates.',
    hardResetButton: 'Hard Reset',
    hardResetTapPrompt: 'Tap 2 more times to confirm',
    hardResetTapPromptOne: 'Tap 1 more time to confirm',
    hardResetInputPrompt: 'Type RESET to wipe all progress',
    hardResetInputPlaceholder: 'RESET',
    hardResetConfirmButton: 'Wipe everything',
    hardResetCancelButton: 'Cancel',
    hardResetWarning: 'This deletes all neurons, prestige, cosmetics, and settings. Irreversible.',
  },

  // Pre-launch audit Tier-2 item D — push permission soft-prompt copy.
  pushSoftPrompt: {
    title: 'Stay in the loop',
    body: 'Get a daily reminder + nudge before your offline cap fills, so you never miss a streak.',
    allow: 'Allow notifications',
    maybeLater: 'Maybe later',
  },

  // Sprint 10 Phase 10.1 (V-4) — save-sync indicator pill copy.
  saveSync: {
    saving: 'Saving…',
    // Pre-launch audit Day 1 — save-failure banner.
    errorPrefix: 'Save failed',
    errorRetryButton: 'Retry',
    errorDismissButton: 'Dismiss',
  },

  // Pre-launch audit Day 2 — ephemeral network/ad/IAP error toast copy.
  networkError: {
    adFailed: 'Ad unavailable. Try again later.',
    revenueCatInitFailed: 'Store unavailable. Some features may be limited.',
    adMobInitFailed: 'Ads unavailable. Tap-to-skip remains available.',
  },

  // Pre-launch audit Day 2 — RevenueCat cold-start overlay copy.
  initSpinner: {
    revenueCatLoading: 'Loading store…',
  },

  // Sprint 10 Phase 10.7 — ending share button + Capacitor.Share payload.
  endingShare: {
    button: 'Share',
    title: 'My SYNAPSE journey',
    text: 'I reached the {{ending}} ending after {{prestiges}} prestiges. The mind has changed.',
    fallbackError: 'Sharing unavailable on this device.',
  },

  // Sprint 10 Phase 10.4 — Daily Login Bonus modal.
  dailyLogin: {
    title: 'Daily Bonus',
    rewardLabel: 'Day {{day}} reward',
    sparksReward: '{{amount}} Sparks',
    claimButton: 'Claim',
    streakLabel: 'Streak: {{streak}} / 7',
    streakSaveTitle: 'Save your streak?',
    streakSaveBody: 'You missed a day. Watch a quick ad to keep your {{streak}}-day streak going.',
    streakSaveAdButton: 'Watch ad to save',
    streakSaveResetButton: 'Start fresh',
    streakSaveSubscriberToast: 'Genius Pass kept your streak alive.',
    streakSaveSuccess: 'Streak saved — claim your bonus.',
  },

  // Sprint 9b Phase 9b.5 — Piggy Bank claim + Spark packs + Limited-Time Offers.
  piggyBank: {
    chipFull: 'Piggy full — tap to break',
    modalTitle: 'Piggy Bank',
    modalBody: 'Break the piggy to claim your saved Sparks.',
    sparksAvailable: 'Sparks available',
    breakButton: 'Break ($0.99)',
    dismissButton: 'Later',
    brokenNote: 'The piggy is broken. Fills start again next cycle.',
  },

  sparkPack: {
    modalTitle: 'Spark Packs',
    subtitle: 'Fuel your next breakthrough.',
    smallTier: 'Small',
    mediumTier: 'Medium',
    largeTier: 'Large',
    smallAmount: '20 Sparks',
    mediumAmount: '110 Sparks (10% bonus)',
    largeAmount: '300 Sparks (25% bonus)',
    monthlyCapLabel: 'Monthly cap',
    capRemaining: 'remaining this month',
    capReachedToast: "Monthly Spark cap reached — resets on the 1st of next month.",
    // Pre-launch audit Day 3 (A11) — show explicit reset date so players know
    // when the cap rolls over instead of guessing.
    capResetsOn: 'Resets {{date}}',
    buyButton: 'Buy',
    closeButton: 'Close',
  },

  limitedTimeOffer: {
    timerLabel: 'Offer ends in',
    buyButton: 'Accept',
    dismissButton: 'Not now',
    dual_nature_pack: {
      name: 'Dual Nature Pack',
      description: 'A neuron skin and 30 Sparks — the mind wants both halves.',
    },
    mutant_bundle: {
      name: 'Mutant Bundle',
      description: 'A new glow, a new canvas — variety to match your volatility.',
    },
    deep_mind_pack: {
      name: 'Deep Mind Pack',
      description: '50 Sparks + 3 Memories. You earned this depth.',
    },
  },

  // Sprint 9b Phase 9b.4 — Starter Pack + Genius Pass offer modals.
  starterPack: {
    title: 'Neural Awakening Pack',
    subtitle: 'A welcome bundle for your growing mind.',
    itemSparks: '50 Sparks',
    itemMemories: '5 Memories',
    itemTheme: 'Neon Pulse canvas theme',
    timerLabel: 'Offer ends in',
    buyButton: 'Accept',
    dismissButton: 'Not now',
    expiredNote: 'This offer has expired.',
  },

  geniusPassOffer: {
    title: 'Genius Pass',
    // MONEY-9 compliance — must appear BEFORE the subscription CTA per GDD §26.
    freeBadge: 'All content accessible for free — subscription is convenience only.',
    benefitNoAds: 'No rewarded ads',
    benefitOfflineBoost: '+25% offline production',
    benefitMutation: '+1 Mutation option per cycle',
    benefitWeeklySparks: '10 Sparks each week',
    benefitHdSnapshot: 'HD Neural Snapshot',
    benefitGoldTheme: 'Genius Gold canvas theme',
    autoRenewStatement: 'Subscription auto-renews monthly unless cancelled.',
    cancelInstructions: 'Cancel anytime via App Store or Play Store settings.',
    subscribeMonthly: 'Subscribe monthly',
    subscribeWeekly: 'Subscribe weekly',
    dismissButton: 'Not now',
    maxDismissalsNote: 'This offer is available in the Store anytime.',
  },

  // Sprint 9b Phase 9b.2 — Cosmetics store + 18 cosmetic names/descriptions.
  // Names are terse (≤6 words) to match SleepScreen + narrative fragments tone.
  cosmetics: {
    storeTitle: 'Cosmetics',
    tabNeurons: 'Neurons',
    tabCanvas: 'Canvas',
    tabGlow: 'Glow',
    tabHud: 'HUD',
    previewButton: 'Preview (3s)',
    buyButton: 'Buy',
    equipButton: 'Equip',
    equippedLabel: 'Equipped',
    unequipButton: 'Unequip',
    ownedLabel: 'Owned',
    backButton: 'Back',
    exclusiveGeniusPass: 'Included with Genius Pass',
    exclusiveStarterPack: 'Included with Starter Pack',
    previewingToast: 'Previewing',
    neuron_skin: {
      ember:   { name: 'Ember',   description: 'Warm coals, slow burn.' },
      frost:   { name: 'Frost',   description: 'Crystalline stillness.' },
      void:    { name: 'Void',    description: 'What the stars see.' },
      plasma:  { name: 'Plasma',  description: 'Unstable brilliance.' },
      aurora:  { name: 'Aurora',  description: 'Cold fire in the dark.' },
      crystal: { name: 'Crystal', description: 'Light refracted forever.' },
      spore:   { name: 'Spore',   description: 'Quiet life, pressing outward.' },
      nebula:  { name: 'Nebula',  description: 'A mind becoming galaxy.' },
    },
    canvas_theme: {
      aurora:      { name: 'Aurora',      description: 'Green fire at the pole.' },
      deep_ocean:  { name: 'Deep Ocean',  description: 'Pressure turns to light.' },
      deep_space:  { name: 'Deep Space',  description: 'Alone, not lonely.' },
      temple:      { name: 'Temple',      description: 'Warm stone, old gold.' },
      genius_gold: { name: 'Genius Gold', description: 'For those who stay.' },
      neon_pulse:  { name: 'Neon Pulse',  description: 'First awakening, bright.' },
    },
    glow_pack: {
      firefly: { name: 'Firefly', description: 'Soft. Summer nights.' },
      halo:    { name: 'Halo',    description: 'Wide. Reverent.' },
      plasma:  { name: 'Plasma',  description: 'Tight and fierce.' },
    },
    hud_style: {
      minimal: { name: 'Minimal', description: 'Less to see, more to feel.' },
    },
  },

  // Sprint 8b Phase 8b.6 — Transcendence confirm dialog (per Sprint 3.6 audit).
  transcendence_confirm: {
    title: 'Transcend?',
    body: "You'll reset everything except Sparks, Patterns, Resonance, and your lifetime tracking. Run {N} begins.",
    confirm: 'Transcend',
    cancel: 'Not yet',
  },

  // Sprint 3+ adds keys as new features ship — do NOT preload
  // empty keys for future features (CODE-1 anti-pattern is
  // hardcoding; empty keys anticipating features is NOT a
  // CODE-1 fix, it's noise).
} as const;
