export interface AwakeningEntry {
  prestigeNumber: number;
  timestamp: number;
  thoughtsAtPrestige: number;
  durationSeconds: number;
  archetype: string | null;
  polarity: string | null;
  mutation: string | null;
  pathway: string | null;
}
