// Implements CLAUDE.md CODE-1 "every player-facing string in
// config/strings/{lang}.ts via t('key')". Sprint 1 gap fill per
// Phase 4.9 Sprint 2 (PROGRESS.md Finding #16).
//
// Structure: nested object by domain, flattened to dot-notation
// at runtime via `t()`. Keys are conservative — Phase 5 will
// consume these; Sprint 3+ extends as new features ship.

export const en = {
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
  narrative: {
    base_01: "A pulse. Then another. Something is beginning that doesn't yet know what it is.",
  },
  cycle_setup: {
    slot_locked_polarity: 'Polarity — unlocks P3',
    slot_locked_mutation: 'Mutation — unlocks P7',
    slot_locked_pathway: 'Pathway — unlocks P10',
    same_as_last: 'SAME AS LAST',
    next: 'Next',
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
    singularidad: 'Singularity',
    convergencia_sinaptica: 'Synaptic Convergence',
    consciencia_distribuida: 'Distributed Consciousness',
    potencial_latente: 'Latent Potential',
    resonancia_acumulada: 'Accumulated Resonance',
    sintesis_cognitiva: 'Cognitive Synthesis',
    focus_persistente: 'Persistent Focus',
  },
  // Sprint 3+ adds keys as new features ship — do NOT preload
  // empty keys for future features (CODE-1 anti-pattern is
  // hardcoding; empty keys anticipating features is NOT a
  // CODE-1 fix, it's noise).
} as const;
