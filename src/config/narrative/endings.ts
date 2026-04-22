// Canonical 4 v1.0 endings per docs/NARRATIVE.md §6.
// Text reproduced verbatim from NARRATIVE.md §6. Each ending presents a
// binary choice; both options are valid. v1.0 ships 4 endings:
//   equation   — Analytical archetype (no RPs required)
//   chorus     — Empathic archetype (no RPs required)
//   seed       — Creative archetype (no RPs required)
//   singularity — Secret (all 4 Resonant Patterns required)
// 'resonance' (v1.5+ Observer archetype) is NOT in v1.0 per POSTLAUNCH.md.

import type { EndingID, Archetype } from '../../types';

export interface EndingDef {
  id: EndingID;
  /** Archetype that triggers this ending, or 'secret' for Singularity. */
  archetype: Archetype | 'secret';
  /** i18n key roots — `endings.${id}.title`, `.option_a`, `.option_b`, etc. */
  i18nRoot: string;
}

export const ENDINGS: readonly EndingDef[] = [
  { id: 'equation', archetype: 'analitica', i18nRoot: 'endings.equation' },
  { id: 'chorus', archetype: 'empatica', i18nRoot: 'endings.chorus' },
  { id: 'seed', archetype: 'creativa', i18nRoot: 'endings.seed' },
  { id: 'singularity', archetype: 'secret', i18nRoot: 'endings.singularity' },
];

export const ENDINGS_BY_ID: Readonly<Record<EndingID, EndingDef>> = Object.freeze(
  Object.fromEntries(ENDINGS.map((e) => [e.id, e])) as Record<EndingID, EndingDef>,
);

export const ENDINGS_BY_ARCHETYPE: Readonly<Record<Archetype, EndingDef>> = Object.freeze({
  analitica: ENDINGS_BY_ID.equation,
  empatica: ENDINGS_BY_ID.chorus,
  creativa: ENDINGS_BY_ID.seed,
});
