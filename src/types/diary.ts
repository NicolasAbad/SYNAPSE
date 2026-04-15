export interface DiaryEntry {
  timestamp: number;
  type: 'prestige' | 'pb' | 'achievement' | 'transcendence' | 'resonant';
  data: Record<string, unknown>;
}
