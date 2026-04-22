// Canonical 8 Era 3 events per GDD §23 + NARRATIVE.md §7.
// Each event triggers at its specific prestigeCount (ERA3-1). Effects apply
// to that cycle only and are read by engine helpers in src/engine/era3.ts.
//
// Text reproduced from NARRATIVE.md §7 + GDD §23. Persisted per-cycle via
// narrativeFragmentsSeen with `era3_pXX` prefix (applyFragmentRead skips
// Memory grant for these — they're system events, not narrative fragments).

import type { Era3EventDef } from '../types';

export const ERA3_EVENTS: readonly Era3EventDef[] = [
  {
    id: 'era3_p19',
    prestigeCount: 19,
    nameKey: 'era3.p19.name',
    narrativeKey: 'era3.p19.narrative',
    mechanicalKey: 'era3.p19.mechanical',
  },
  {
    id: 'era3_p20',
    prestigeCount: 20,
    nameKey: 'era3.p20.name',
    narrativeKey: 'era3.p20.narrative',
    mechanicalKey: 'era3.p20.mechanical',
  },
  {
    id: 'era3_p21',
    prestigeCount: 21,
    nameKey: 'era3.p21.name',
    narrativeKey: 'era3.p21.narrative',
    mechanicalKey: 'era3.p21.mechanical',
  },
  {
    id: 'era3_p22',
    prestigeCount: 22,
    nameKey: 'era3.p22.name',
    narrativeKey: 'era3.p22.narrative',
    mechanicalKey: 'era3.p22.mechanical',
  },
  {
    id: 'era3_p23',
    prestigeCount: 23,
    nameKey: 'era3.p23.name',
    narrativeKey: 'era3.p23.narrative',
    mechanicalKey: 'era3.p23.mechanical',
  },
  {
    id: 'era3_p24',
    prestigeCount: 24,
    nameKey: 'era3.p24.name',
    narrativeKey: 'era3.p24.narrative',
    mechanicalKey: 'era3.p24.mechanical',
  },
  {
    id: 'era3_p25',
    prestigeCount: 25,
    nameKey: 'era3.p25.name',
    narrativeKey: 'era3.p25.narrative',
    mechanicalKey: 'era3.p25.mechanical',
  },
  {
    id: 'era3_p26',
    prestigeCount: 26,
    nameKey: 'era3.p26.name',
    narrativeKey: 'era3.p26.narrative',
    mechanicalKey: 'era3.p26.mechanical',
  },
];

export const ERA3_BY_PRESTIGE: Readonly<Record<number, Era3EventDef>> = Object.freeze(
  Object.fromEntries(ERA3_EVENTS.map((e) => [e.prestigeCount, e])),
);
