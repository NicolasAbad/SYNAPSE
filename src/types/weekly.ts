export interface WeeklyChallengeState {
  id: string | null;
  weekStartTimestamp: number;
  progress: number;
  target: number;
  rewardClaimed: boolean;
}
