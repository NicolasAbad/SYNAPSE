export interface UpgradeState {
  id: string;
  purchased: boolean;
  category: 'production' | 'discharge' | 'focus' | 'connection' | 'special';
  cost: number;
  effect: string;
}
