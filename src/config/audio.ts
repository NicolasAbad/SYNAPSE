// Sprint 10 Phase 10.2 — audio asset specs (data-only canonical storage file).
// GDD §28 verbatim filenames. Lives in src/config/ per the canonical storage
// rule (CLAUDE.md): pure-data files under src/config/ are excluded from Gate 3
// literal counting since their literals ARE the source of truth.
// ANALYTICS-5-style anti-drift: filenames here MUST match GDD §28 verbatim.

export type SfxName =
  | 'tap'
  | 'neuron_buy'
  | 'upgrade_buy'
  | 'discharge'
  | 'insight'
  | 'prestige'
  | 'spontaneous'
  | 'resonant_pattern';

export type AmbientEra = 1 | 2 | 3;

export interface SfxSpec {
  readonly name: SfxName;
  readonly file: string;
}

export interface AmbientSpec {
  readonly era: AmbientEra;
  readonly file: string;
}

export const SFX_SPECS: readonly SfxSpec[] = [
  { name: 'tap', file: 'tap.wav' },
  { name: 'neuron_buy', file: 'neuron_buy.wav' },
  { name: 'upgrade_buy', file: 'upgrade_buy.wav' },
  { name: 'discharge', file: 'discharge.wav' },
  { name: 'insight', file: 'insight.wav' },
  { name: 'prestige', file: 'prestige.wav' },
  { name: 'spontaneous', file: 'spontaneous.wav' },
  { name: 'resonant_pattern', file: 'resonant_pattern.wav' },
];

export const AMBIENT_SPECS: readonly AmbientSpec[] = [
  { era: 1, file: 'ambient_bio.mp3' },
  { era: 2, file: 'ambient_digital.mp3' },
  { era: 3, file: 'ambient_cosmic.mp3' },
];
