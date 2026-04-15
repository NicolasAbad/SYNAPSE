export interface PatternNode {
  id: string;
  unlocked: boolean;
  category: 'cycle_bonus' | 'flat_bonus' | 'decision' | 'resonant';
  prestigeRequired: number;
  effect: { kind: string; value: number };
}
