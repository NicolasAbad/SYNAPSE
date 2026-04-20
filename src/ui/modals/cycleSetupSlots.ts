// Helper metadata + hook for CycleSetupScreen. Split out per CODE-2
// (CycleSetupScreen.tsx would exceed 200 lines otherwise).
//
// Unified unlock gates per GDD §29 CYCLE-1:
//   P0-P2  → 0 slots
//   P3-P6  → 1 slot  (Polarity — §11)
//   P7-P9  → 2 slots (Polarity + Mutation — §13)
//   P10+   → 3 slots (Polarity + Mutation + Pathway — §14)

import { useEffect, useState } from 'react';
import { BREAKPOINTS } from '../tokens';

export type Slot = 'polarity' | 'mutation' | 'pathway';

export const SLOT_UNLOCK_PRESTIGE: Record<Slot, number> = {
  polarity: 3, // CONST-OK: GDD §11 — Polarity unlocks at P3 (Sprint 4c scope)
  mutation: 7, // CONST-OK: GDD §13 — Mutations unlock at P7 (Sprint 5 scope)
  pathway: 10, // CONST-OK: GDD §14 — Pathways unlock at P10 (Sprint 5 scope)
};

export const SLOT_LOCKED_LABEL: Record<Slot, string> = {
  polarity: 'cycle_setup.slot_locked_polarity',
  mutation: 'cycle_setup.slot_locked_mutation',
  pathway: 'cycle_setup.slot_locked_pathway',
};

export function unlockedSlotsFor(prestigeCount: number): Slot[] {
  const result: Slot[] = [];
  if (prestigeCount >= SLOT_UNLOCK_PRESTIGE.polarity) result.push('polarity');
  if (prestigeCount >= SLOT_UNLOCK_PRESTIGE.mutation) result.push('mutation');
  if (prestigeCount >= SLOT_UNLOCK_PRESTIGE.pathway) result.push('pathway');
  return result;
}

export function useIsTabletWidth(): boolean {
  const [isTablet, setIsTablet] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(`(min-width: ${BREAKPOINTS.tablet}px)`).matches
      : false,
  );
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(`(min-width: ${BREAKPOINTS.tablet}px)`);
    const onChange = (e: MediaQueryListEvent) => setIsTablet(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return isTablet;
}
