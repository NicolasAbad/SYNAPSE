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
  // Sprint 3+ adds keys as new features ship — do NOT preload
  // empty keys for future features (CODE-1 anti-pattern is
  // hardcoding; empty keys anticipating features is NOT a
  // CODE-1 fix, it's noise).
} as const;
