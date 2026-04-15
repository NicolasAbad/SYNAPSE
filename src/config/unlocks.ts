export interface UnlockCondition {
  id: string;
  prestigeRequired: number;
  thoughtsRequired?: number;
  description: string;
}

export const PROGRESSIVE_UNLOCKS: readonly UnlockCondition[] = [
  { id: 'neurons_tab', prestigeRequired: 0, thoughtsRequired: 10, description: 'Neurons tab' },
  { id: 'upgrades_tab', prestigeRequired: 0, thoughtsRequired: 80, description: 'Upgrades tab' },
  { id: 'discharge', prestigeRequired: 0, thoughtsRequired: 1000, description: 'Discharge' },
  { id: 'focus_bar', prestigeRequired: 4, description: 'Focus Bar (P4+)' },
  { id: 'polarity', prestigeRequired: 3, description: 'Polarity choice (P3+)' },
  { id: 'archetype', prestigeRequired: 5, description: 'Archetype choice (P5+)' },
  { id: 'mutations', prestigeRequired: 7, description: 'Mutations (P7+)' },
  { id: 'pathways', prestigeRequired: 10, description: 'Neural Pathways (P10+)' },
  { id: 'resonance', prestigeRequired: 13, description: 'Resonance system (P13+)' },
] as const;
